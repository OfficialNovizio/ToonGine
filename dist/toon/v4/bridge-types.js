"use strict";
// src/toon/v4/bridge-types.ts
// Shared types for the V4 graph intelligence bridge.
// Normalizes schemas from code-review-graph, graphify, and codegraph.
Object.defineProperty(exports, "__esModule", { value: true });
exports.stableHash = stableHash;
exports.nodeId = nodeId;
// ─── Helpers ─────────────────────────────────────────────────────────────────
const crypto_1 = require("crypto");
function stableHash(input) {
    return (0, crypto_1.createHash)('sha256').update(input).digest('hex').slice(0, 16);
}
function nodeId(qualifiedName, tool) {
    return stableHash(tool + '::' + qualifiedName);
}
//# sourceMappingURL=bridge-types.js.map