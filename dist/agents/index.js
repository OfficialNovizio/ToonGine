"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHermesSkills = exports.validateManifest = exports.autoGenerateManifest = exports.getCouncilMembers = exports.getAgentsByLevel = exports.getAgentsByDept = exports.getAgent = exports.loadRegistry = void 0;
// src/agents/index.ts — Barrel export for toongine/agents
var registry_1 = require("./registry");
Object.defineProperty(exports, "loadRegistry", { enumerable: true, get: function () { return registry_1.loadRegistry; } });
Object.defineProperty(exports, "getAgent", { enumerable: true, get: function () { return registry_1.getAgent; } });
Object.defineProperty(exports, "getAgentsByDept", { enumerable: true, get: function () { return registry_1.getAgentsByDept; } });
Object.defineProperty(exports, "getAgentsByLevel", { enumerable: true, get: function () { return registry_1.getAgentsByLevel; } });
Object.defineProperty(exports, "getCouncilMembers", { enumerable: true, get: function () { return registry_1.getCouncilMembers; } });
Object.defineProperty(exports, "autoGenerateManifest", { enumerable: true, get: function () { return registry_1.autoGenerateManifest; } });
var manifest_schema_1 = require("./manifest-schema");
Object.defineProperty(exports, "validateManifest", { enumerable: true, get: function () { return manifest_schema_1.validateManifest; } });
var hermes_generator_1 = require("./hermes-generator");
Object.defineProperty(exports, "generateHermesSkills", { enumerable: true, get: function () { return hermes_generator_1.generateHermesSkills; } });
//# sourceMappingURL=index.js.map