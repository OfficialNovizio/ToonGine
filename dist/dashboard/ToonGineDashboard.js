"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToonGineDashboard = ToonGineDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const TokenBurn_1 = require("./TokenBurn");
const ProjectHealth_1 = require("./ProjectHealth");
const AgentMemory_1 = require("./AgentMemory");
function ToonGineDashboard({ tab, tokenBurnData, projectHealthData, agentMemoryData }) {
    if (tab === 'memory')
        return (0, jsx_runtime_1.jsx)(AgentMemory_1.AgentMemory, { data: agentMemoryData });
    if (tab === 'burn')
        return (0, jsx_runtime_1.jsx)(TokenBurn_1.TokenBurn, { data: tokenBurnData });
    return (0, jsx_runtime_1.jsx)(ProjectHealth_1.ProjectHealth, { data: projectHealthData });
}
//# sourceMappingURL=ToonGineDashboard.js.map