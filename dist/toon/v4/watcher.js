"use strict";
// src/toon/v4/watcher.ts
// File watcher — auto-rebuilds unified graph on project changes.
// Uses fs.watch with debounce + lock to prevent infinite loops.
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWatcher = startWatcher;
exports.stopAllWatchers = stopAllWatchers;
exports.getWatcherStatus = getWatcherStatus;
const fs_1 = require("fs");
const unified_graph_1 = require("./unified-graph");
const index_1 = require("./ingesters/index");
let _watchers = new Map();
let _isBuilding = false;
function startWatcher(projectRoot) {
    const statuses = [];
    // Watch source files only
    const watchDir = projectRoot;
    if (!(0, fs_1.existsSync)(watchDir)) {
        statuses.push({ tool: 'file-watcher', running: false, pid: null, lastRebuild: null, errors: 1 });
        return statuses;
    }
    // Debounce: rebuild after 2 seconds of no changes
    const DEBOUNCE_MS = 2000;
    const status = {
        tool: 'file-watcher',
        running: true,
        pid: process.pid,
        lastRebuild: null,
        errors: 0,
    };
    try {
        const watcher = (0, fs_1.watch)(watchDir, { recursive: true }, (eventType, filename) => {
            if (!filename)
                return;
            // Only rebuild on source file changes
            if (!/\.(ts|tsx|js|jsx|py|md|css|json|yml|yaml)$/.test(filename))
                return;
            // Skip generated/build directories
            if (filename.includes('node_modules') || filename.includes('.next') ||
                filename.includes('dist') || filename.includes('.toon') ||
                filename.includes('graphify-out') || filename.includes('.code-review-graph') ||
                filename.includes('.codegraph'))
                return;
            // Rate limit
            if (filename.includes('.lock'))
                return;
            const existing = _watchers.get('file-watcher');
            if (existing?.timer)
                clearTimeout(existing.timer);
            const timer = setTimeout(() => {
                rebuildGraph(projectRoot, status);
            }, DEBOUNCE_MS);
            if (existing) {
                existing.timer = timer;
            }
        });
        _watchers.set('file-watcher', { watcher, status, timer: null });
        statuses.push(status);
    }
    catch (err) {
        status.running = false;
        status.errors++;
        statuses.push(status);
    }
    return statuses;
}
function rebuildGraph(projectRoot, status) {
    if (_isBuilding)
        return; // prevent concurrent builds
    _isBuilding = true;
    try {
        const unified = (0, unified_graph_1.createUnifiedGraph)(projectRoot);
        (0, index_1.ingestAll)(unified, projectRoot);
        unified.close();
        status.lastRebuild = new Date().toISOString();
        status.errors = 0;
    }
    catch (err) {
        status.errors++;
    }
    finally {
        _isBuilding = false;
    }
}
function stopAllWatchers() {
    for (const [name, entry] of _watchers) {
        entry.watcher.close();
        if (entry.timer)
            clearTimeout(entry.timer);
        entry.status.running = false;
    }
    _watchers.clear();
}
function getWatcherStatus() {
    return Array.from(_watchers.values()).map(e => e.status);
}
//# sourceMappingURL=watcher.js.map