#include "pipeline.hpp"
#include <stdexcept>
#include <sstream>

namespace adaptiveshield {

// ---- static name constants -------------------------------------------------
const std::string IPFilterStage::kName        = "Stage 1: IP Access List";
const std::string PortProtocolStage::kName    = "Stage 2: Port & Protocol Guard";
const std::string RateLimiterStage::kName     = "Stage 3: Sliding-Window Rate Limiter";
const std::string PayloadThreatStage::kName   = "Stage 4: Deep Payload Threat Analyzer";
const std::string AdaptiveAutoBlockStage::kName = "Stage 5: Adaptive IP Auto-Banning";

// ---- PipelineDecision ------------------------------------------------------
void PipelineDecision::addResult(const PipelineStageResult& result) {
    stageResults.push_back(result);
    finalRiskScore = std::max(finalRiskScore, result.riskScore);

    if (result.status == "BLOCK" && allowed) {
        allowed       = false;
        action        = "BLOCK";
        verdictStage  = result.stageName;
        verdictReason = result.reason;
    }
}

ThreatLevel PipelineDecision::getThreatLevel() const {
    if (finalRiskScore >= 90) return {"CRITICAL", "text-rose-700 bg-rose-50 border-rose-300"};
    if (finalRiskScore >= 70) return {"HIGH",     "text-amber-700 bg-amber-50 border-amber-300"};
    if (finalRiskScore >= 35) return {"MEDIUM",   "text-blue-700 bg-blue-50 border-blue-300"};
    return                          {"LOW",       "text-emerald-700 bg-emerald-50 border-emerald-300"};
}

// ---- IPFilterStage ---------------------------------------------------------
IPFilterStage::IPFilterStage(RuleSupplier getRules)
    : getRules_(std::move(getRules)) {}

bool IPFilterStage::evaluate(const Packet& pkt, PipelineDecision& decision) const {
    const auto& rules = getRules_();
    for (const auto& r : rules) {
        if (!r.enabled || r.type != "IP") continue;
        if (r.action == "ALLOW" && (r.value == pkt.srcIp || r.value == "*")) {
            decision.addResult({kName, "PASS",
                "Explicitly Whitelisted via Rule [" + r.id + "]", 0, r.id});
            return false;
        }
    }
    for (const auto& r : rules) {
        if (!r.enabled || r.type != "IP") continue;
        if (r.action == "BLOCK" && r.value == pkt.srcIp) {
            decision.addResult({kName, "BLOCK",
                "Blacklisted IP detected: " + pkt.srcIp, 100, r.id});
            return true;
        }
    }
    decision.addResult({kName, "PASS", "IP not in explicit blacklists", 5, ""});
    return false;
}

// ---- PortProtocolStage -----------------------------------------------------
PortProtocolStage::PortProtocolStage(RuleSupplier getRules)
    : getRules_(std::move(getRules)) {}

bool PortProtocolStage::evaluate(const Packet& pkt, PipelineDecision& decision) const {
    const auto& rules = getRules_();
    for (const auto& r : rules) {
        if (!r.enabled) continue;
        if (r.type == "PORT" && r.action == "BLOCK") {
            try {
                if (std::stoi(r.value) == pkt.dstPort) {
                    decision.addResult({kName, "BLOCK",
                        "Unauthorized Destination Port " + std::to_string(pkt.dstPort) +
                        " (" + (r.label.empty() ? "Restricted" : r.label) + ")",
                        85, r.id});
                    return true;
                }
            } catch (...) {}
        }
        if (r.type == "PROTOCOL" && r.action == "BLOCK") {
            std::string rv = r.value, pp = pkt.protocol;
            // case-insensitive compare
            std::transform(rv.begin(), rv.end(), rv.begin(), ::toupper);
            std::transform(pp.begin(), pp.end(), pp.begin(), ::toupper);
            if (rv == pp) {
                decision.addResult({kName, "BLOCK",
                    "Disallowed Protocol: " + pkt.protocol, 80, r.id});
                return true;
            }
        }
    }
    decision.addResult({kName, "PASS",
        "Port " + std::to_string(pkt.dstPort) + "/" + pkt.protocol +
        " conforms to network policy", 10, ""});
    return false;
}

// ---- RateLimiterStage ------------------------------------------------------
RateLimiterStage::RateLimiterStage(long long windowMs, int maxRequests)
    : windowMs_(windowMs), maxRequests_(maxRequests) {}

bool RateLimiterStage::evaluate(const Packet& pkt, PipelineDecision& decision) {
    using namespace std::chrono;
    long long now = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()).count();

    auto& timestamps = ipHistory_[pkt.srcIp];
    timestamps.erase(
        std::remove_if(timestamps.begin(), timestamps.end(),
            [&](long long t){ return now - t >= windowMs_; }),
        timestamps.end());
    timestamps.push_back(now);

    int count = static_cast<int>(timestamps.size());
    if (count > maxRequests_) {
        int risk = std::min(100, 50 + (count - maxRequests_) * 10);
        decision.action = "RATE_LIMITED";
        decision.addResult({kName, "BLOCK",
            "Rate limit exceeded: " + std::to_string(count) +
            " reqs / " + std::to_string(windowMs_ / 1000) + "s" +
            " (Threshold: " + std::to_string(maxRequests_) + ")",
            risk, ""});
        return true;
    }
    int passRisk = static_cast<int>(
        std::floor(static_cast<double>(count) / maxRequests_ * 20.0));
    decision.addResult({kName, "PASS",
        "Rate within limits: " + std::to_string(count) + "/" +
        std::to_string(maxRequests_) +
        " in " + std::to_string(windowMs_ / 1000) + "s",
        passRisk, ""});
    return false;
}

void RateLimiterStage::reset() { ipHistory_.clear(); }

// ---- PayloadThreatStage ----------------------------------------------------
PayloadThreatStage::PayloadThreatStage(RuleSupplier getRules)
    : getRules_(std::move(getRules)) {
    // Mirrors JS built-in signatures exactly
    builtinSigs_ = {
        {"SIG-SQLI",  "SQL Injection",
         std::regex(R"((\b(UNION(\s+ALL)?|SELECT|INSERT|DELETE|UPDATE|DROP|TABLE)\b|'(\s*OR\s*|\s*AND\s*)'1'='1'|--|;))",
                    std::regex::icase), 95},
        {"SIG-XSS",   "Cross-Site Scripting (XSS)",
         std::regex(R"((<script[\s\S]*?>|javascript:|onload\s*=|onerror\s*=|alert\(|eval\())",
                    std::regex::icase), 85},
        {"SIG-CMDI",  "OS Command Injection",
         std::regex(R"((;|&&|\|\|)\s*(cat\s+/etc|rm\s+-rf|nc\s+-e|bash\s+-i|whoami|curl\s+http))",
                    std::regex::icase), 98},
        {"SIG-PATH",  "Directory Traversal",
         std::regex(R"((\.\.\/|\.\.\\|\/etc\/passwd|win\.ini))",
                    std::regex::icase), 90},
        {"SIG-BRUTE", "Auth Probe / Brute Pattern",
         std::regex(R"((admin:admin|root:root|password123|hydra|sqli))",
                    std::regex::icase), 75},
    };
}

bool PayloadThreatStage::evaluate(const Packet& pkt, PipelineDecision& decision) const {
    std::string combined = pkt.path + " " + pkt.payload;

    // Check built-in signatures
    for (const auto& sig : builtinSigs_) {
        if (std::regex_search(combined, sig.pattern)) {
            decision.addResult({kName, "BLOCK",
                "Malicious exploit signature matched: [" + sig.name + "]",
                sig.risk, sig.id});
            return true;
        }
    }

    // Check custom REGEX rules from the React layer
    for (const auto& r : getRules_()) {
        if (!r.enabled || r.type != "REGEX") continue;
        try {
            std::regex custom(r.value, std::regex::icase);
            if (std::regex_search(combined, custom)) {
                decision.addResult({kName, "BLOCK",
                    "Malicious exploit signature matched: [" + r.label + "]",
                    95, r.id});
                return true;
            }
        } catch (const std::regex_error&) {
            // Invalid regex rule — skip silently (mirroring JS behaviour)
        }
    }

    decision.addResult({kName, "PASS",
        "Payload sanitized - 0 malicious signatures detected", 5, ""});
    return false;
}

// ---- AdaptiveAutoBlockStage ------------------------------------------------
AdaptiveAutoBlockStage::AdaptiveAutoBlockStage(AutoBanCallback onAutoBan)
    : onAutoBan_(std::move(onAutoBan)) {}

bool AdaptiveAutoBlockStage::evaluate(const Packet& pkt, PipelineDecision& decision) {
    if (autoBannedIps_.count(pkt.srcIp)) {
        decision.action = "AUTO_BANNED";
        decision.addResult({kName, "BLOCK",
            "Dynamic Auto-Shield: IP " + pkt.srcIp +
            " is quarantined for persistent hostile violations", 100, ""});
        return true;
    }

    int current  = reputationScores_.count(pkt.srcIp) ? reputationScores_[pkt.srcIp] : 0;
    int newScore = current + decision.finalRiskScore;
    reputationScores_[pkt.srcIp] = newScore;

    if (newScore >= 120) {
        autoBannedIps_.insert(pkt.srcIp);
        if (onAutoBan_) onAutoBan_(pkt.srcIp, newScore);
        decision.action = "AUTO_BANNED";
        decision.addResult({kName, "BLOCK",
            "Reputation ceiling breached (" + std::to_string(newScore) +
            "/120). Autonomous Quarantine Activated.", 100, ""});
        return true;
    }

    int passRisk = std::min(35, newScore / 4);
    decision.addResult({kName, "PASS",
        "Reputation intact. Accumulated IP Threat Index: " +
        std::to_string(newScore) + "/120", passRisk, ""});
    return false;
}

void AdaptiveAutoBlockStage::clearBan(const std::string& ip) {
    autoBannedIps_.erase(ip);
    reputationScores_.erase(ip);
}

void AdaptiveAutoBlockStage::reset() {
    autoBannedIps_.clear();
    reputationScores_.clear();
}

// ---- FirewallPipeline -------------------------------------------------------
FirewallPipeline::FirewallPipeline(Config cfg)
    : ipFilter_    (cfg.getRules)
    , portProto_   (cfg.getRules)
    , rateLimiter_ (4000, 8)
    , payloadThreat_(cfg.getRules)
    , autoBlock_   (cfg.onAutoBan)
{}

PipelineDecision FirewallPipeline::process(const Packet& pkt) {
    PipelineDecision decision;
    decision.packet = pkt;

    // Each stage returns true → halt (unless action already specialised)
    if (ipFilter_.evaluate(pkt, decision)    && decision.action == "BLOCK")  return decision;
    if (portProto_.evaluate(pkt, decision)   && decision.action == "BLOCK")  return decision;
    if (rateLimiter_.evaluate(pkt, decision) && decision.action != "BLOCK")  {} // rate-limit continues
    else if (!decision.allowed)                                               return decision;
    if (payloadThreat_.evaluate(pkt, decision) && decision.action == "BLOCK") return decision;
    autoBlock_.evaluate(pkt, decision);
    return decision;
}

void FirewallPipeline::resetDynamicState() {
    rateLimiter_.reset();
    autoBlock_.reset();
}

} // namespace adaptiveshield
