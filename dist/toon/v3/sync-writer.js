"use strict";
// src/toon/v3/sync-writer.ts — Write-Back Interceptor
//
// When any LLM (Claude, Hermes, etc.) creates or modifies a file, this
// interceptor ensures writes flow to ALL three locations simultaneously:
//
//   1. Originals (human-readable .md for the user)
//   2. .toon/ (compressed .toon for the LLM)
//   3. engine.bin (reindexed chunk for query matching)
//
// Usage:
//   import { writeFile } from 'toongine/toon/v3/sync-writer'
//   writeFile('agent-department/CEO/marcus/MEMORY.md', newContent)
//   writeFile('docs/novizio/CONTEXT.md', newContent, 'both')
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFile = writeFile;
exports.deleteFile = deleteFile;
exports.writeMany = writeMany;
const fs_1 = require("fs");
const path_1 = require("path");
function strip(text) {
    const stripped = text.replace(/^#{1,6}\s+/gm, '').replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '').replace(/^---[\s\S]*?---/gm, '').replace(/^\|.+\|$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    return { output: stripped, savingsPercent: text.length > 0 ? Math.round((1 - stripped.length / text.length) * 100) : 0 };
}
const compile_1 = require("./compile");
// ─── Path Detection ───────────────────────────────────────────────────────────
const TOONABLE_PREFIXES = [
    'agent-department/',
    'agent-memory/',
    'docs/',
    '.toon/graphify/',
    '.toon/codegraph/',
    'CLAUDE.md',
];
function isToonable(path) {
    return TOONABLE_PREFIXES.some(p => path.startsWith(p));
}
function toToonFilename(originalPath) {
    return originalPath.replace(/\.md$/, '.toon').replace(/\.json$/, '.json');
}
// ─── Main Writer ──────────────────────────────────────────────────────────────
function writeFile(relativePath, content, target = 'both', projectRoot = process.cwd()) {
    const result = {
        written: { original: null, toon: null },
        reindexed: false,
    };
    const fullPath = (0, path_1.join)(projectRoot, relativePath);
    try {
        // ── Write to originals ─────────────────────────────────────────────────
        if (target === 'originals' || target === 'both') {
            (0, fs_1.mkdirSync)((0, path_1.dirname)(fullPath), { recursive: true });
            (0, fs_1.writeFileSync)(fullPath, content, 'utf-8');
            result.written.original = relativePath;
        }
        // ── Write to .toon/ (compressed) ───────────────────────────────────────
        if ((target === 'toon' || target === 'both') && isToonable(relativePath)) {
            const toonPath = getToonPath(relativePath, projectRoot);
            if (toonPath) {
                const compressed = compressForToon(content, relativePath);
                (0, fs_1.mkdirSync)((0, path_1.dirname)(toonPath), { recursive: true });
                (0, fs_1.writeFileSync)(toonPath, compressed, 'utf-8');
                result.written.toon = toonPath.replace(projectRoot + '/', '');
            }
            // ── Attempt reindex of engine.bin ────────────────────────────────────
            try {
                const engineBin = (0, path_1.join)(projectRoot, '.toon', 'v3', 'engine.bin');
                if ((0, fs_1.existsSync)(engineBin)) {
                    (0, compile_1.compile)({ projectRoot, maxMergeIterations: 256 });
                    result.reindexed = true;
                }
            }
            catch { /* reindex is best-effort */ }
        }
    }
    catch (e) {
        result.error = e.message;
    }
    return result;
}
// ─── Delete Handler ───────────────────────────────────────────────────────────
function deleteFile(relativePath, projectRoot = process.cwd()) {
    const result = {
        written: { original: null, toon: null },
        reindexed: false,
    };
    const fullPath = (0, path_1.join)(projectRoot, relativePath);
    const toonPath = getToonPath(relativePath, projectRoot);
    try {
        // Remove from originals
        if ((0, fs_1.existsSync)(fullPath)) {
            (0, fs_1.unlinkSync)(fullPath);
            result.written.original = `${relativePath} (deleted)`;
        }
        // Remove from .toon/
        if (toonPath && (0, fs_1.existsSync)(toonPath)) {
            (0, fs_1.unlinkSync)(toonPath);
            result.written.toon = `${toonPath.replace(projectRoot + '/', '')} (deleted)`;
        }
        // Reindex
        try {
            const engineBin = (0, path_1.join)(projectRoot, '.toon', 'v3', 'engine.bin');
            if ((0, fs_1.existsSync)(engineBin)) {
                (0, compile_1.compile)({ projectRoot, maxMergeIterations: 256 });
                result.reindexed = true;
            }
        }
        catch { /* best-effort */ }
    }
    catch (e) {
        result.error = e.message;
    }
    return result;
}
// ─── Bulk Write ───────────────────────────────────────────────────────────────
function writeMany(files, target = 'both', projectRoot) {
    return files.map(f => writeFile(f.path, f.content, target, projectRoot));
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToonPath(relativePath, root) {
    if (relativePath.startsWith('agent-department/')) {
        return (0, path_1.join)(root, '.toon', 'agents', toToonFilename(relativePath));
    }
    if (relativePath.startsWith('agent-memory/')) {
        return (0, path_1.join)(root, '.toon', 'memory', toToonFilename(relativePath));
    }
    if (relativePath.startsWith('docs/')) {
        return (0, path_1.join)(root, '.toon', 'docs', toToonFilename(relativePath));
    }
    if (relativePath.startsWith('.toon/graphs/')) {
        return (0, path_1.join)(root, '.toon', 'graphs', toToonFilename(relativePath));
    }
    if (relativePath === 'CLAUDE.md') {
        return (0, path_1.join)(root, '.toon', 'project', 'CLAUDE.md');
    }
    // Generic: try .toon/ mirror
    return (0, path_1.join)(root, '.toon', toToonFilename(relativePath));
}
function compressForToon(content, path) {
    const stripped = strip(content);
    const ext = (0, path_1.extname)(path);
    const header = `#TOON src=${path} compressed=${new Date().toISOString()} savings=${stripped.savingsPercent}%\n`;
    if (ext === '.json') {
        // JSON: keep as-is but wrap with TOON header
        return header + content;
    }
    // Markdown: use stripped version (30-60% smaller)
    const best = stripped.output.length < content.length ? stripped.output : content;
    return header + best.slice(0, 50000);
}
//# sourceMappingURL=sync-writer.js.map