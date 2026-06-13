"use strict";
// src/toon/v3/resolver.ts — Runtime TOON Resolver
//
// Single entry point for ALL file reads. Agents, CIE, and middleware go through
// this resolver instead of raw fs — it serves compressed .toon/ versions first,
// falls back to .archive/, and only hits original files as last resort.
//
// Architecture:
//   resolve(path) → .toon/ (compressed) → .archive/ (original) → raw path
//
// Usage:
//   import { resolve } from 'toongine/toon/v3/resolver'
//   const memory = resolve('agent-department/CEO/marcus/MEMORY.md')
//   const docs   = resolve('docs/novizio/CONTEXT.md', 'llm')
//   const docs   = resolve('docs/novizio/CONTEXT.md', 'human')
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = resolve;
exports.resolveMany = resolveMany;
exports.clearResolveCache = clearResolveCache;
exports.resolverStats = resolverStats;
const fs_1 = require("fs");
const path_1 = require("path");
// ─── Path Mapping ─────────────────────────────────────────────────────────────
const PATH_MAP = {
    'agent-department': { toon: '.toon/memory/agent-department', archive: '.toon/.archive' },
    'agent-memory': { toon: '.toon/memory/agent-memory', archive: '.toon/.archive' },
    'docs': { toon: '.toon/docs', archive: '.toon/.archive' },
    'graphify-out': { toon: '.toon/graphs', archive: '.toon/.archive' },
    'CLAUDE.md': { toon: '.toon/project/CLAUDE.md', archive: '.toon/.archive' },
};
// ─── Cache ────────────────────────────────────────────────────────────────────
const resolveCache = new Map();
const CACHE_TTL = 60000; // 1 minute
function cacheKey(path, mode) {
    return `${mode}:${path}`;
}
// ─── Main Resolver ────────────────────────────────────────────────────────────
function resolve(relativePath, mode = 'auto', projectRoot = process.cwd()) {
    // Strip leading / if present
    const cleanPath = relativePath.replace(/^\//, '');
    // Check cache
    const key = cacheKey(cleanPath, mode);
    const cached = resolveCache.get(key);
    if (cached)
        return cached;
    let result;
    // ── Tier 1: .toon/ compressed version ───────────────────────────────────
    if (mode === 'llm' || mode === 'auto') {
        const toonPath = toToonPath(cleanPath, projectRoot);
        if (toonPath && (0, fs_1.existsSync)(toonPath)) {
            try {
                const content = (0, fs_1.readFileSync)(toonPath, 'utf-8');
                const originalSize = getOriginalSize(cleanPath, projectRoot);
                result = {
                    content,
                    source: 'toon',
                    path: toonPath,
                    compressedSize: content.length,
                    originalSize,
                };
                resolveCache.set(key, result);
                setTimeout(() => resolveCache.delete(key), CACHE_TTL);
                return result;
            }
            catch { /* fall through */ }
        }
    }
    // ── Tier 2: .archive/ original backup ───────────────────────────────────
    if (mode === 'human' || mode === 'auto') {
        const archivePath = getLatestArchive(cleanPath, projectRoot);
        if (archivePath && (0, fs_1.existsSync)(archivePath)) {
            try {
                const content = (0, fs_1.readFileSync)(archivePath, 'utf-8');
                result = {
                    content,
                    source: 'archive',
                    path: archivePath,
                    compressedSize: content.length,
                    originalSize: content.length,
                };
                resolveCache.set(key, result);
                setTimeout(() => resolveCache.delete(key), CACHE_TTL);
                return result;
            }
            catch { /* fall through */ }
        }
    }
    // ── Tier 3: Original file ───────────────────────────────────────────────
    const fullPath = (0, path_1.join)(projectRoot, cleanPath);
    if ((0, fs_1.existsSync)(fullPath)) {
        try {
            const content = (0, fs_1.readFileSync)(fullPath, 'utf-8');
            result = {
                content,
                source: 'original',
                path: fullPath,
                compressedSize: content.length,
                originalSize: content.length,
            };
            resolveCache.set(key, result);
            setTimeout(() => resolveCache.delete(key), CACHE_TTL);
            return result;
        }
        catch { /* fall through */ }
    }
    // ── Not found ────────────────────────────────────────────────────────────
    result = {
        content: '',
        source: 'not-found',
        path: cleanPath,
        compressedSize: 0,
        originalSize: 0,
    };
    return result;
}
// ─── Bulk Resolve (for CIE/middleware) ────────────────────────────────────────
function resolveMany(paths, mode = 'llm', projectRoot) {
    return paths.map(p => resolve(p, mode, projectRoot));
}
// ─── Path Helpers ─────────────────────────────────────────────────────────────
function toToonPath(relativePath, root) {
    for (const [prefix, mapping] of Object.entries(PATH_MAP)) {
        if (relativePath.startsWith(prefix)) {
            const rel = relativePath.slice(prefix.length).replace(/^\//, '');
            const toonRel = rel.replace(/\.md$/, '.toon').replace(/\.json$/, '.json');
            const toonPath = (0, path_1.join)(root, mapping.toon, toonRel);
            if ((0, fs_1.existsSync)(toonPath)) {
                if (prefix === 'CLAUDE.md')
                    return (0, path_1.join)(root, mapping.toon);
                return toonPath;
            }
            const mdPath = (0, path_1.join)(root, mapping.toon, rel);
            if ((0, fs_1.existsSync)(mdPath)) {
                return mdPath;
            }
            return null;
        }
    }
    // Generic fallback: try .toon/memory/ or .toon/docs/
    if (relativePath.endsWith('.md')) {
        const toonPath = (0, path_1.join)(root, '.toon', relativePath.replace(/\.md$/, '.toon'));
        if ((0, fs_1.existsSync)(toonPath))
            return toonPath;
    }
    return null;
}
function getLatestArchive(relativePath, root) {
    const archiveRoot = (0, path_1.join)(root, '.toon', '.archive');
    if (!(0, fs_1.existsSync)(archiveRoot))
        return null;
    try {
        const { readdirSync } = require('fs');
        const dirs = readdirSync(archiveRoot, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort()
            .reverse(); // newest first
        for (const dir of dirs) {
            const candidate = (0, path_1.join)(archiveRoot, dir, relativePath);
            if ((0, fs_1.existsSync)(candidate))
                return candidate;
        }
    }
    catch { /* no archive */ }
    return null;
}
function getOriginalSize(relativePath, root) {
    const fullPath = (0, path_1.join)(root, relativePath);
    if (!(0, fs_1.existsSync)(fullPath)) {
        // Try archive
        const archivePath = getLatestArchive(relativePath, root);
        if (archivePath) {
            try {
                const { statSync } = require('fs');
                return statSync(archivePath).size;
            }
            catch {
                return 0;
            }
        }
        return 0;
    }
    try {
        const { statSync } = require('fs');
        return statSync(fullPath).size;
    }
    catch {
        return 0;
    }
}
// ─── Clear Cache ──────────────────────────────────────────────────────────────
function clearResolveCache() {
    resolveCache.clear();
}
// ─── Stats ────────────────────────────────────────────────────────────────────
function resolverStats() {
    let totalOriginal = 0;
    let totalCompressed = 0;
    for (const [, result] of resolveCache) {
        totalOriginal += result.originalSize;
        totalCompressed += result.compressedSize;
    }
    return {
        cacheSize: resolveCache.size,
        savings: {
            totalOriginal,
            totalCompressed,
            percent: totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0,
        },
    };
}
//# sourceMappingURL=resolver.js.map