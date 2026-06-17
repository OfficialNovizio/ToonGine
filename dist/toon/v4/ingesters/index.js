"use strict";
// src/toon/v4/ingesters/index.ts
// Run all 3 ingesters in parallel and report results.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestCodegraph = exports.ingestGraphify = exports.ingestCodeReviewGraph = void 0;
exports.ingestAll = ingestAll;
const code_review_graph_1 = require("./code-review-graph");
Object.defineProperty(exports, "ingestCodeReviewGraph", { enumerable: true, get: function () { return code_review_graph_1.ingestCodeReviewGraph; } });
const graphify_1 = require("./graphify");
Object.defineProperty(exports, "ingestGraphify", { enumerable: true, get: function () { return graphify_1.ingestGraphify; } });
const codegraph_1 = require("./codegraph");
Object.defineProperty(exports, "ingestCodegraph", { enumerable: true, get: function () { return codegraph_1.ingestCodegraph; } });
function ingestAll(unified, projectRoot) {
    const start = Date.now();
    // Run all ingestors
    const results = [
        (0, code_review_graph_1.ingestCodeReviewGraph)(unified, projectRoot),
        (0, graphify_1.ingestGraphify)(unified, projectRoot),
        (0, codegraph_1.ingestCodegraph)(unified, projectRoot),
    ];
    const totalNodes = results.reduce((s, r) => s + r.nodesIngested, 0);
    const totalEdges = results.reduce((s, r) => s + r.edgesIngested, 0);
    const totalDeduped = results.reduce((s, r) => s + r.nodesDeduped, 0);
    const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);
    const unifiedStats = unified.stats();
    return {
        projectRoot,
        results,
        totalNodes,
        totalEdges,
        totalDeduped,
        totalErrors,
        durationMs: Date.now() - start,
        unifiedStats,
    };
}
//# sourceMappingURL=index.js.map