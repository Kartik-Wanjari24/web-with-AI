#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <functional>
#include <regex>
#include <chrono>
#include <algorithm>
#include <cmath>

namespace adaptiveshield {

// ---------------------------------------------------------------------------
// Packet — mirrors JS Packet class
// ---------------------------------------------------------------------------
struct Packet {
    std::string id;
    std::string timestamp;
    std::string srcIp;
    int         dstPort   = 443;
    std::string protocol  = "HTTPS";
    std::string payload;
    int         length    = 512;
    std::string method    = "GET";
    std::string path      = "/";
    std::string geo       = "US";
};

// ---------------------------------------------------------------------------
// Rule — ACL entry pushed from the React layer at runtime
// ---------------------------------------------------------------------------
struct Rule {
    std::string id;
    std::string type;    // "IP" | "PORT" | "PROTOCOL" | "REGEX"
    std::string value;
    std::string action;  // "ALLOW" | "BLOCK"
    std::string label;
    std::string priority;
    bool        enabled = true;
};

// ---------------------------------------------------------------------------
// PipelineStageResult — mirrors JS PipelineStageResult
// ---------------------------------------------------------------------------
struct PipelineStageResult {
    std::string stageName;
    std::string status;      // "PASS" | "BLOCK"
    std::string reason;
    int         riskScore = 0;
    std::string matchedRuleId;
};

// ---------------------------------------------------------------------------
// PipelineDecision — mirrors JS PipelineDecision
// ---------------------------------------------------------------------------
struct ThreatLevel {
    std::string label;
    std::string color;
};

struct PipelineDecision {
    Packet      packet;
    bool        allowed        = true;
    std::string action         = "ALLOW"; // "ALLOW"|"BLOCK"|"RATE_LIMITED"|"AUTO_BANNED"
    int         finalRiskScore = 0;
    std::vector<PipelineStageResult> stageResults;
    std::string verdictStage;
    std::string verdictReason  = "Traffic cleared all inspection stages";

    void addResult(const PipelineStageResult& result);
    ThreatLevel getThreatLevel() const;
};

// ---------------------------------------------------------------------------
// Pipeline stage interfaces
// ---------------------------------------------------------------------------
using RuleSupplier = std::function<const std::vector<Rule>&()>;

class IPFilterStage {
public:
    explicit IPFilterStage(RuleSupplier getRules);
    // Returns true if pipeline should halt.
    bool evaluate(const Packet& packet, PipelineDecision& decision) const;
private:
    RuleSupplier getRules_;
    static const std::string kName;
};

class PortProtocolStage {
public:
    explicit PortProtocolStage(RuleSupplier getRules);
    bool evaluate(const Packet& packet, PipelineDecision& decision) const;
private:
    RuleSupplier getRules_;
    static const std::string kName;
};

class RateLimiterStage {
public:
    RateLimiterStage(long long windowMs = 4000, int maxRequests = 8);
    bool evaluate(const Packet& packet, PipelineDecision& decision);
    void reset();
private:
    long long windowMs_;
    int maxRequests_;
    std::unordered_map<std::string, std::vector<long long>> ipHistory_;
    static const std::string kName;
};

class PayloadThreatStage {
public:
    explicit PayloadThreatStage(RuleSupplier getRules);
    bool evaluate(const Packet& packet, PipelineDecision& decision) const;
private:
    RuleSupplier getRules_;
    static const std::string kName;

    struct BuiltinSig {
        std::string id;
        std::string name;
        std::regex  pattern;
        int         risk;
    };
    std::vector<BuiltinSig> builtinSigs_;
};

using AutoBanCallback = std::function<void(const std::string& ip, int score)>;

class AdaptiveAutoBlockStage {
public:
    explicit AdaptiveAutoBlockStage(AutoBanCallback onAutoBan = nullptr);
    bool evaluate(const Packet& packet, PipelineDecision& decision);
    void clearBan(const std::string& ip);
    void reset();
private:
    AutoBanCallback onAutoBan_;
    std::unordered_map<std::string, int> reputationScores_;
    std::unordered_set<std::string>      autoBannedIps_;
    static const std::string kName;
};

// ---------------------------------------------------------------------------
// FirewallPipeline — master orchestrator
// ---------------------------------------------------------------------------
class FirewallPipeline {
public:
    struct Config {
        RuleSupplier  getRules;
        AutoBanCallback onAutoBan;
    };

    explicit FirewallPipeline(Config cfg);
    PipelineDecision process(const Packet& packet);

    // Expose stage-level reset for the React layer (e.g. after rule wipe).
    void resetDynamicState();

private:
    IPFilterStage         ipFilter_;
    PortProtocolStage     portProto_;
    RateLimiterStage      rateLimiter_;
    PayloadThreatStage    payloadThreat_;
    AdaptiveAutoBlockStage autoBlock_;
};

} // namespace adaptiveshield
