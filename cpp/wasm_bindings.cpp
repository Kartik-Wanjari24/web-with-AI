/**
 * wasm_bindings.cpp
 *
 * Emscripten EMBIND entry-point.  Compiled with:
 *   emcmake cmake .. && emmake make
 *
 * Exports three things to JS:
 *   - PipelineEngine  (class)  wraps FirewallPipeline, owns the rule list.
 *   - PacketInput     (value_object) mirrors the JS Packet fields.
 *   - DecisionOutput  (value_object) mirrors what React reads from PipelineDecision.
 */
#include <emscripten/bind.h>
#include "pipeline.hpp"
#include <memory>
#include <vector>
#include <string>

using namespace adaptiveshield;
using namespace emscripten;

// ---------------------------------------------------------------------------
// Flat value objects for EMBIND (EMBIND doesn't support nested vectors
// directly — we serialise stage results as a JSON string instead).
// ---------------------------------------------------------------------------
struct PacketInput {
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

struct StageResultOutput {
    std::string stageName;
    std::string status;
    std::string reason;
    int         riskScore = 0;
    std::string matchedRuleId;
};

struct DecisionOutput {
    std::string srcIp;
    bool        allowed        = true;
    std::string action;
    int         finalRiskScore = 0;
    std::string verdictStage;
    std::string verdictReason;
    std::string threatLabel;   // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    // Stage results serialised as newline-delimited JSON for simplicity
    std::vector<StageResultOutput> stageResults;
};

struct RuleInput {
    std::string id;
    std::string type;
    std::string value;
    std::string action;
    std::string label;
    std::string priority;
    bool        enabled = true;
};

// ---------------------------------------------------------------------------
// PipelineEngine — the class exported to JavaScript
// ---------------------------------------------------------------------------
class PipelineEngine {
public:
    PipelineEngine() {
        FirewallPipeline::Config cfg;
        cfg.getRules  = [this]() -> const std::vector<Rule>& { return rules_; };
        cfg.onAutoBan = [this](const std::string& ip, int score) {
            lastAutoBanIp_    = ip;
            lastAutoBanScore_ = score;
            autoBanCount_++;
        };
        pipeline_ = std::make_unique<FirewallPipeline>(std::move(cfg));
    }

    // Called from React whenever the rules state changes.
    void setRules(const std::vector<RuleInput>& jsRules) {
        rules_.clear();
        rules_.reserve(jsRules.size());
        for (const auto& r : jsRules) {
            rules_.push_back({r.id, r.type, r.value, r.action,
                              r.label, r.priority, r.enabled});
        }
    }

    DecisionOutput processPacket(const PacketInput& pkt) {
        Packet p;
        p.id        = pkt.id;
        p.timestamp = pkt.timestamp;
        p.srcIp     = pkt.srcIp;
        p.dstPort   = pkt.dstPort;
        p.protocol  = pkt.protocol;
        p.payload   = pkt.payload;
        p.length    = pkt.length;
        p.method    = pkt.method;
        p.path      = pkt.path;
        p.geo       = pkt.geo;

        PipelineDecision d = pipeline_->process(p);

        DecisionOutput out;
        out.srcIp         = d.packet.srcIp;
        out.allowed        = d.allowed;
        out.action         = d.action;
        out.finalRiskScore = d.finalRiskScore;
        out.verdictStage   = d.verdictStage;
        out.verdictReason  = d.verdictReason;
        out.threatLabel    = d.getThreatLevel().label;

        for (const auto& sr : d.stageResults) {
            out.stageResults.push_back({sr.stageName, sr.status,
                                        sr.reason, sr.riskScore,
                                        sr.matchedRuleId});
        }
        return out;
    }

    void resetDynamicState() { pipeline_->resetDynamicState(); }

    int  getAutoBanCount()    const { return autoBanCount_; }
    std::string getLastAutoBanIp() const { return lastAutoBanIp_; }

private:
    std::vector<Rule>              rules_;
    std::unique_ptr<FirewallPipeline> pipeline_;
    int         autoBanCount_    = 0;
    std::string lastAutoBanIp_;
    int         lastAutoBanScore_ = 0;
};

// ---------------------------------------------------------------------------
// EMBIND registration
// ---------------------------------------------------------------------------
EMSCRIPTEN_BINDINGS(adaptiveshield_module) {
    // ---- value objects (plain-old-data structs) ----------------------------
    value_object<PacketInput>("PacketInput")
        .field("id",        &PacketInput::id)
        .field("timestamp", &PacketInput::timestamp)
        .field("srcIp",     &PacketInput::srcIp)
        .field("dstPort",   &PacketInput::dstPort)
        .field("protocol",  &PacketInput::protocol)
        .field("payload",   &PacketInput::payload)
        .field("length",    &PacketInput::length)
        .field("method",    &PacketInput::method)
        .field("path",      &PacketInput::path)
        .field("geo",       &PacketInput::geo);

    value_object<StageResultOutput>("StageResultOutput")
        .field("stageName",     &StageResultOutput::stageName)
        .field("status",        &StageResultOutput::status)
        .field("reason",        &StageResultOutput::reason)
        .field("riskScore",     &StageResultOutput::riskScore)
        .field("matchedRuleId", &StageResultOutput::matchedRuleId);

    value_object<DecisionOutput>("DecisionOutput")
        .field("srcIp",         &DecisionOutput::srcIp)
        .field("allowed",       &DecisionOutput::allowed)
        .field("action",        &DecisionOutput::action)
        .field("finalRiskScore",&DecisionOutput::finalRiskScore)
        .field("verdictStage",  &DecisionOutput::verdictStage)
        .field("verdictReason", &DecisionOutput::verdictReason)
        .field("threatLabel",   &DecisionOutput::threatLabel)
        .field("stageResults",  &DecisionOutput::stageResults);

    value_object<RuleInput>("RuleInput")
        .field("id",       &RuleInput::id)
        .field("type",     &RuleInput::type)
        .field("value",    &RuleInput::value)
        .field("action",   &RuleInput::action)
        .field("label",    &RuleInput::label)
        .field("priority", &RuleInput::priority)
        .field("enabled",  &RuleInput::enabled);

    // ---- vectors of the above ---------------------------------------------
    register_vector<StageResultOutput>("VectorStageResultOutput");
    register_vector<RuleInput>("VectorRuleInput");

    // ---- PipelineEngine class ---------------------------------------------
    class_<PipelineEngine>("PipelineEngine")
        .constructor<>()
        .function("setRules",          &PipelineEngine::setRules)
        .function("processPacket",     &PipelineEngine::processPacket)
        .function("resetDynamicState", &PipelineEngine::resetDynamicState)
        .function("getAutoBanCount",   &PipelineEngine::getAutoBanCount)
        .function("getLastAutoBanIp",  &PipelineEngine::getLastAutoBanIp);
}
