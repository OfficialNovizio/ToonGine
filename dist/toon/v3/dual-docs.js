"use strict";
// src/toon/v3/dual-docs.ts — Dual-Version Document Manager
//
// Every document exists in TWO versions:
//   1. HUMAN version → full markdown (originals/ or .archive/)
//   2. LLM version   → stripped TOON (.toon/docs/ or .toon/project/)
//
// This module serves the right version based on who's asking.
//
// Usage:
//   import { readDoc } from 'toongine/toon/v3/dual-docs'
//   const human = readDoc('docs/novizio/CONTEXT.md', 'human')
//   const llm   = readDoc('docs/novizio/CONTEXT.md', 'llm')
//   const stats = docStats()  // how much we're saving
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDoc = readDoc;
exports.readDocsForLLM = readDocsForLLM;
exports.readDocForHuman = readDocForHuman;
exports.getToonPath = getToonPath;
exports.getHumanPath = getHumanPath;
exports.docStats = docStats;
const resolver_1 = require("./resolver");
// ─── Main API ─────────────────────────────────────────────────────────────────
/**
 * Read a document in the requested mode.
 * - 'human': full markdown from originals or .archive/
 * - 'llm':   compressed TOON from .toon/
 * - 'auto':  .toon/ first, fallback to originals
 */
function readDoc(path, mode = 'auto', projectRoot) {
    return (0, resolver_1.resolve)(path, mode, projectRoot);
}
/**
 * Read multiple docs at once (for batch injection).
 * Always returns LLM-optimized versions.
 */
function readDocsForLLM(paths, projectRoot) {
    const results = (0, resolver_1.resolveMany)(paths, 'llm', projectRoot);
    return results.map(r => ({
        path: r.path,
        content: r.content,
        savings: r.originalSize > 0
            ? Math.round((1 - r.compressedSize / r.originalSize) * 100)
            : 0,
    }));
}
/**
 * Read a doc for human viewing.
 */
function readDocForHuman(path, projectRoot) {
    return (0, resolver_1.resolve)(path, 'human', projectRoot);
}
// ─── Path Helpers ─────────────────────────────────────────────────────────────
/**
 * Get the .toon/ path for a given original path.
 */
function getToonPath(originalPath) {
    if (originalPath.startsWith('agent-department/')) {
        return `.toon/memory/${originalPath.replace(/\.md$/, '.toon')}`;
    }
    if (originalPath.startsWith('agent-memory/')) {
        return `.toon/memory/${originalPath.replace(/\.md$/, '.toon')}`;
    }
    if (originalPath.startsWith('docs/')) {
        return `.toon/docs/${originalPath.replace(/\.md$/, '.toon')}`;
    }
    if (originalPath.startsWith('.toon/graphify/')) {
        return `.toon/graphify/${originalPath.replace(/\.md$/, '.toon').replace(/\.json$/, '.json')}`;
    }
    if (originalPath.startsWith('.toon/codegraph/')) {
        return `.toon/codegraph/${originalPath.replace(/\.md$/, '.toon')}`;
    }
    if (originalPath === 'CLAUDE.md') {
        return '.toon/project/CLAUDE.md';
    }
    return `.toon/${originalPath.replace(/\.md$/, '.toon')}`;
}
/**
 * Get the original path for a .toon/ path.
 */
function getHumanPath(toonPath) {
    return toonPath
        .replace(/^\.toon\/docs\//, 'docs/')
        .replace(/^\.toon\/agents\//, 'agent-department/')
        .replace(/^\.toon\/memory\/agent-memory\//, 'agent-memory/')
        .replace(/^\.toon\/graphify\//, '.toon/graphify/')
        .replace(/^\.toon\/codegraph\//, '.toon/codegraph/')
        .replace(/^\.toon\/project\//, '')
        .replace(/\.toon$/, '.md');
}
// ─── Stats ────────────────────────────────────────────────────────────────────
const fs_1 = require("fs");
const path_1 = require("path");
function docStats(projectRoot = process.cwd()) {
    const stats = {
        totalDocs: 0,
        totalHumanSize: 0,
        totalToonSize: 0,
        savingsPercent: 0,
        breakdown: {
            agentMemory: { count: 0, humanSize: 0, toonSize: 0 },
            docs: { count: 0, humanSize: 0, toonSize: 0 },
            graphs: { count: 0, humanSize: 0, toonSize: 0 },
            project: { count: 0, humanSize: 0, toonSize: 0 },
        },
    };
    function countDir(toonDir, humanDir, key) {
        const tDir = (0, path_1.join)(projectRoot, toonDir);
        if (!(0, fs_1.existsSync)(tDir))
            return;
        let toonFiles = 0;
        let toonSize = 0;
        function walkToon(dir) {
            if (!(0, fs_1.existsSync)(dir))
                return;
            for (const entry of (0, fs_1.readdirSync)(dir, { withFileTypes: true })) {
                const p = (0, path_1.join)(dir, entry.name);
                if (entry.isDirectory()) {
                    walkToon(p);
                }
                else if (entry.name.endsWith('.toon')) {
                    toonFiles++;
                    try {
                        toonSize += (0, fs_1.statSync)(p).size;
                    }
                    catch { }
                }
            }
        }
        walkToon(tDir);
        let humanFiles = 0;
        let humanSize = 0;
        const hDir = (0, path_1.join)(projectRoot, humanDir);
        if ((0, fs_1.existsSync)(hDir)) {
            function walkHuman(dir) {
                if (!(0, fs_1.existsSync)(dir))
                    return;
                for (const entry of (0, fs_1.readdirSync)(dir, { withFileTypes: true })) {
                    const p = (0, path_1.join)(dir, entry.name);
                    if (entry.isDirectory()) {
                        walkHuman(p);
                    }
                    else if (entry.name.endsWith('.md') || entry.name.endsWith('.json')) {
                        humanFiles++;
                        try {
                            humanSize += (0, fs_1.statSync)(p).size;
                        }
                        catch { }
                    }
                }
            }
            walkHuman(hDir);
        }
        stats.breakdown[key] = {
            count: toonFiles || humanFiles,
            humanSize,
            toonSize,
        };
        stats.totalDocs += toonFiles || humanFiles;
        stats.totalHumanSize += humanSize;
        stats.totalToonSize += toonSize;
    }
    countDir('.toon/agents', 'agent-department', 'agentMemory');
    countDir('.toon/memory/agent-memory', 'agent-memory', 'agentMemory');
    countDir('.toon/docs', 'docs', 'docs');
    countDir('.toon/graphify', '.toon/graphify', 'graphs');
    countDir('.toon/codegraph', '.toon/codegraph', 'graphs');
    // Project configs
    const projectToon = (0, path_1.join)(projectRoot, '.toon', 'project', 'CLAUDE.md');
    const projectOrig = (0, path_1.join)(projectRoot, 'CLAUDE.md');
    if ((0, fs_1.existsSync)(projectToon)) {
        stats.breakdown.project.count = 1;
        try {
            stats.breakdown.project.toonSize = (0, fs_1.statSync)(projectToon).size;
        }
        catch { }
    }
    if ((0, fs_1.existsSync)(projectOrig)) {
        stats.breakdown.project.count = Math.max(stats.breakdown.project.count, 1);
        try {
            stats.breakdown.project.humanSize = (0, fs_1.statSync)(projectOrig).size;
        }
        catch { }
    }
    stats.totalHumanSize += stats.breakdown.project.humanSize;
    stats.totalToonSize += stats.breakdown.project.toonSize;
    stats.savingsPercent = stats.totalHumanSize > 0
        ? Math.round((1 - stats.totalToonSize / stats.totalHumanSize) * 100)
        : 0;
    return stats;
}
//# sourceMappingURL=dual-docs.js.map