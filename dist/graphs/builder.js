"use strict";
// src/graphs/builder.ts — Built-in knowledge graph builder
// No external dependencies. Scans project, builds graphify + codegraph reports.
// Synchronous (readFileSync). Regex-based import extraction.
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAllGraphs = buildAllGraphs;
exports.getGraphStats = getGraphStats;
const fs_1 = require("fs");
const path_1 = require("path");
// ─── Scan project ─────────────────────────────────────────────────────────────
function scanFiles(dir, pattern) {
    const files = [];
    try {
        for (const entry of (0, fs_1.readdirSync)(dir)) {
            if (entry === 'node_modules' || entry === '.git' || entry === 'dist' ||
                entry === '.next' || entry === '__pycache__' || entry === '.toon')
                continue;
            const full = (0, path_1.join)(dir, entry);
            try {
                if ((0, fs_1.statSync)(full).isDirectory()) {
                    files.push(...scanFiles(full, pattern));
                }
                else if (pattern.test(entry)) {
                    files.push(full);
                }
            }
            catch { /* skip unreadable */ }
        }
    }
    catch { /* skip unreadable dir */ }
    return files;
}
// ─── Extract imports via regex ────────────────────────────────────────────────
function extractImports(content) {
    const imports = [];
    // TypeScript/JavaScript imports
    // import X from './path'
    // import { X } from './path'
    // import * as X from './path'
    // import './path'
    // const X = require('./path')
    // await import('./path')
    const tsRe = /(?:import\s+(?:[\s\S]*?\s+from\s+)?['"]|require\s*\(\s*['"]|import\s*\(\s*['"])((?:\.\/|\.\.\/|@\/)[^'"]+)/g;
    let m;
    while ((m = tsRe.exec(content)) !== null) {
        imports.push(m[1]);
    }
    // Python imports
    // from .module import X
    // from ..package import X
    const pyRe = /^from\s+(\.\S+)\s+import/gm;
    while ((m = pyRe.exec(content)) !== null) {
        imports.push(m[1]);
    }
    return [...new Set(imports)];
}
// ─── Resolve import path ──────────────────────────────────────────────────────
function resolveImport(importPath, fromFile, root) {
    const fromDir = (0, path_1.dirname)(fromFile);
    let resolved = (0, path_1.join)(fromDir, importPath);
    const candidates = [
        resolved,
        resolved + '.ts',
        resolved + '.tsx',
        resolved + '.js',
        resolved + '.jsx',
        resolved + '.py',
        (0, path_1.join)(resolved, 'index.ts'),
        (0, path_1.join)(resolved, 'index.js'),
    ];
    for (const c of candidates) {
        if ((0, fs_1.existsSync)(c))
            return c;
    }
    // @/ alias -> project root
    if (importPath.startsWith('@/')) {
        resolved = (0, path_1.join)(root, importPath.slice(2));
        const aliasCandidates = [
            resolved,
            resolved + '.ts',
            resolved + '.tsx',
            resolved + '.js',
            resolved + '.jsx',
            (0, path_1.join)(resolved, 'index.ts'),
            (0, path_1.join)(resolved, 'index.js'),
        ];
        for (const c of aliasCandidates) {
            if ((0, fs_1.existsSync)(c))
                return c;
        }
    }
    return null;
}
// ─── Build codegraph (dependency graph) ───────────────────────────────────────
function buildCodegraph(root) {
    const files = scanFiles(root, /\.(ts|tsx|js|jsx|py)$/);
    const importMap = {};
    for (const file of files) {
        try {
            const content = (0, fs_1.readFileSync)(file, 'utf-8');
            const rawImports = extractImports(content);
            const resolved = [];
            for (const imp of rawImports) {
                const r = resolveImport(imp, file, root);
                if (r)
                    resolved.push((0, path_1.relative)(root, r));
            }
            if (resolved.length > 0) {
                importMap[(0, path_1.relative)(root, file)] = [...new Set(resolved)];
            }
        }
        catch { /* skip unreadable */ }
    }
    // Count importers
    const importerCount = {};
    for (const deps of Object.values(importMap)) {
        for (const dep of deps) {
            importerCount[dep] = (importerCount[dep] ?? 0) + 1;
        }
    }
    // Hub files (most imported)
    const hubFiles = Object.entries(importerCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([file, count]) => ({
        file,
        importers: count,
        risk: (count >= 50 ? 'critical' :
            count >= 20 ? 'high' :
                count >= 10 ? 'medium' : 'low'),
    }));
    // Fan-out files (most imports made)
    const fanOutFiles = Object.entries(importMap)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 12)
        .map(([file]) => file);
    // API route dependencies
    const apiDeps = {};
    for (const [file, deps] of Object.entries(importMap)) {
        if ((file.includes('api/') || file.includes('routes/')) &&
            (file.includes('route') || file.includes('handler'))) {
            apiDeps[file] = deps.filter(d => !d.includes('api/') && !d.includes('routes/'));
        }
    }
    return { hubFiles, fanOutFiles, apiDeps };
}
// ─── Build graphify (code structure knowledge graph) ──────────────────────────
function buildGraphify(root) {
    const files = scanFiles(root, /\.(ts|tsx|js|jsx|md|css|py)$/);
    const nodes = [];
    const communities = new Map();
    for (const file of files) {
        const rel = (0, path_1.relative)(root, file);
        const dir = (0, path_1.dirname)(rel).split('/')[0] || 'root';
        const ext = (0, path_1.extname)(file).slice(1);
        const typeMap = {
            ts: 'typescript', tsx: 'typescript',
            js: 'javascript', jsx: 'javascript',
            py: 'python',
            md: 'documentation',
            css: 'stylesheet',
        };
        nodes.push({
            name: rel,
            type: typeMap[ext] || ext,
            deps: [],
            community: 0,
        });
        if (!communities.has(dir))
            communities.set(dir, []);
        communities.get(dir).push(rel);
    }
    let communityIdx = 0;
    const communityList = [];
    for (const [name, nodeNames] of communities) {
        const cohesion = Math.min(0.99, +(0.01 + nodeNames.length / nodes.length).toFixed(2));
        communityList.push({ name, cohesion, nodes: nodeNames });
        for (const n of nodes) {
            if (nodeNames.includes(n.name))
                n.community = communityIdx;
        }
        communityIdx++;
    }
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (nodes[i].community === nodes[j].community) {
                edges.push([i, j]);
            }
        }
    }
    return { nodes, edges, communities: communityList };
}
// ─── Generate reports ─────────────────────────────────────────────────────────
function generateCodegraphReport(report) {
    const lines = [
        '# Code Dependency Graph — Auto-generated by ToonGine',
        `> Hub files: ${report.hubFiles.length} · High fan-out: ${report.fanOutFiles.length}`,
        '> Rebuild: `npx toongine graph`',
        '',
        '## Hub Files — Most Imported (highest blast radius)',
        '',
        '| # | File | Importers | Risk |',
        '|---|------|-----------|------|',
    ];
    report.hubFiles.forEach((h, i) => {
        lines.push(`| ${i + 1} | \`${h.file}\` | **${h.importers}** | ${h.risk} |`);
    });
    lines.push('', '> ⚠️ Changing a hub file affects every importer. Check reverse deps before editing.', '', '## High Fan-Out Files — Most Imports (coupling risk)', '', '| # | File |', '|---|------|');
    report.fanOutFiles.forEach((f, i) => {
        lines.push(`| ${i + 1} | \`${f}\` |`);
    });
    if (Object.keys(report.apiDeps).length > 0) {
        lines.push('', '## API Route Dependency Map', '');
        for (const [route, deps] of Object.entries(report.apiDeps)) {
            lines.push(`### \`${route}\` (${deps.length} deps)`);
            deps.forEach(d => lines.push(`  → \`${d}\``));
            lines.push('');
        }
    }
    lines.push('---', '', `_Generated by ToonGine on ${new Date().toISOString().split('T')[0]}_`);
    return lines.join('\n');
}
function generateGraphifyReport(report) {
    const lines = [
        '# Graph Report — Auto-generated by ToonGine',
        `> ${report.nodes.length} nodes · ${report.edges.length} edges · ${report.communities.length} communities`,
        '> Rebuild: `npx toongine graph`',
        '',
        '## Community Hubs (Navigation)',
        '',
    ];
    report.communities.forEach((c, i) => {
        lines.push(`- **Community ${i}**: \`${c.name}\` (${c.nodes.length} nodes, cohesion: ${c.cohesion})`);
    });
    lines.push('', '---', '');
    report.communities.forEach((c, i) => {
        lines.push(`### Community ${i} — "${c.name}"`);
        lines.push(`Cohesion: ${c.cohesion} · Nodes: ${c.nodes.length}`);
        const preview = c.nodes.slice(0, 15).join(', ');
        const suffix = c.nodes.length > 15 ? ` (+${c.nodes.length - 15} more)` : '';
        lines.push(`Files: ${preview}${suffix}`);
        lines.push('');
    });
    lines.push('---', '', `_Generated by ToonGine on ${new Date().toISOString().split('T')[0]}_`);
    return lines.join('\n');
}
// ─── Public API ───────────────────────────────────────────────────────────────
function buildAllGraphs(rootDir) {
    const graphifyDir = (0, path_1.join)(rootDir, '.toon', 'graphify');
    const codegraphDir = (0, path_1.join)(rootDir, '.toon', 'codegraph');
    (0, fs_1.mkdirSync)(graphifyDir, { recursive: true });
    (0, fs_1.mkdirSync)(codegraphDir, { recursive: true });
    const codegraph = buildCodegraph(rootDir);
    const codegraphMd = generateCodegraphReport(codegraph);
    (0, fs_1.writeFileSync)((0, path_1.join)(codegraphDir, 'CODEGRAPH_REPORT.md'), codegraphMd);
    const graphify = buildGraphify(rootDir);
    const graphifyMd = generateGraphifyReport(graphify);
    (0, fs_1.writeFileSync)((0, path_1.join)(graphifyDir, 'GRAPH_REPORT.md'), graphifyMd);
    return { graphify: graphifyMd, codegraph: codegraphMd };
}
function getGraphStats(rootDir) {
    try {
        const codegraph = buildCodegraph(rootDir);
        const graphify = buildGraphify(rootDir);
        return {
            nodes: graphify.nodes.length,
            edges: graphify.edges.length,
            communities: graphify.communities.length,
            hubs: codegraph.hubFiles.length,
        };
    }
    catch {
        return { nodes: 0, edges: 0, communities: 0, hubs: 0 };
    }
}
//# sourceMappingURL=builder.js.map