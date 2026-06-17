"use strict";
// src/toon/v4/ingesters/graphify.ts
// Ingests from safishamsi/graphify (JSON) into unified graph.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestGraphify = ingestGraphify;
const fs_1 = require("fs");
const path_1 = require("path");
const bridge_types_1 = require("../bridge-types");
function ingestGraphify(unified, projectRoot) {
    const start = Date.now();
    const errors = [];
    const jsonPath = (0, path_1.join)(projectRoot, 'graphify-out', 'graph.json');
    if (!(0, fs_1.existsSync)(jsonPath)) {
        return {
            tool: 'graphify',
            nodesIngested: 0,
            edgesIngested: 0,
            nodesDeduped: 0,
            errors: ['graph.json not found — run graphify .'],
            durationMs: Date.now() - start,
        };
    }
    try {
        const raw = (0, fs_1.readFileSync)(jsonPath, 'utf-8');
        const graph = JSON.parse(raw);
        // ─── Build community map ────────────────────────────────────────────
        const communityMap = new Map();
        if (graph.communities) {
            for (const c of graph.communities) {
                const cName = c.name || `community-${c.id}`;
                if (c.nodes) {
                    for (const nId of c.nodes) {
                        communityMap.set(String(nId), cName);
                    }
                }
            }
        }
        // ─── Convert nodes ──────────────────────────────────────────────────
        const nodes = graph.nodes.map((gn) => {
            const label = gn.label || gn.id?.toString() || 'unknown';
            return {
                id: (0, bridge_types_1.nodeId)(label, 'graphify'),
                name: label.replace(projectRoot + '/', '').slice(0, 200),
                qualified_name: label,
                kind: gn.type || 'Unknown',
                file_path: gn.file_path || null,
                language: gn.language || null,
                community: communityMap.get(String(gn.id)) || null,
                tool_source: 'graphify',
                tool_node_id: String(gn.id),
                extra: gn.metadata || {},
            };
        });
        // ─── Convert edges ──────────────────────────────────────────────────
        const rawEdges = graph.links || graph.edges || [];
        const edges = [];
        if (rawEdges.length > 0) {
            for (const ge of rawEdges) {
                // Look up source and target labels from nodes
                const srcNode = graph.nodes.find(n => String(n.id) === String(ge.source));
                const tgtNode = graph.nodes.find(n => String(n.id) === String(ge.target));
                if (!srcNode || !tgtNode)
                    continue;
                edges.push({
                    source_id: (0, bridge_types_1.nodeId)(srcNode.label || String(ge.source), 'graphify'),
                    target_id: (0, bridge_types_1.nodeId)(tgtNode.label || String(ge.target), 'graphify'),
                    kind: ge.kind || 'REFERENCES',
                    confidence: ge.confidence || 1.0,
                    tool_source: 'graphify',
                    extra: {},
                });
            }
        }
        const result = unified.ingest('graphify', nodes, edges);
        result.errors = errors;
        return result;
    }
    catch (err) {
        return {
            tool: 'graphify',
            nodesIngested: 0,
            edgesIngested: 0,
            nodesDeduped: 0,
            errors: [err.message],
            durationMs: Date.now() - start,
        };
    }
}
//# sourceMappingURL=graphify.js.map