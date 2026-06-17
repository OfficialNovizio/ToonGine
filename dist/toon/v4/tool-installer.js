"use strict";
// src/toon/v4/tool-installer.ts
// Auto-installs all 3 graph tools inside .toon/tools/.
// Idempotent — skips if already installed.
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectTools = detectTools;
exports.installCodegraph = installCodegraph;
exports.ensureAllTools = ensureAllTools;
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
function detectTools(projectRoot) {
    return [
        detectCodeReviewGraph(),
        detectGraphify(),
        detectCodegraph(projectRoot),
    ];
}
function detectCodeReviewGraph() {
    try {
        const out = (0, child_process_1.execSync)('code-review-graph --version 2>/dev/null || python3 -c "import code_review_graph" 2>&1', { stdio: 'pipe', timeout: 5000 }).toString();
        return { name: 'code-review-graph', installed: true, path: 'pip global', version: extractVersion(out) };
    }
    catch {
        return { name: 'code-review-graph', installed: false, path: '', version: '', error: 'not installed — pip install code-review-graph' };
    }
}
function detectGraphify() {
    try {
        const out = (0, child_process_1.execSync)('graphify --version 2>/dev/null || pipx runpip graphifyy show 2>&1', { stdio: 'pipe', timeout: 5000 }).toString();
        return { name: 'graphify', installed: true, path: 'pipx global', version: extractVersion(out) };
    }
    catch {
        return { name: 'graphify', installed: false, path: '', version: '', error: 'not installed — pipx install graphifyy' };
    }
}
function detectCodegraph(projectRoot) {
    try {
        const out = (0, child_process_1.execSync)('codegraph version 2>/dev/null || npx @colbymchenry/codegraph version 2>&1', { stdio: 'pipe', timeout: 5000 }).toString();
        return { name: 'codegraph', installed: true, path: 'npm global', version: extractVersion(out) };
    }
    catch {
        // Check if installed locally
        const localPath = (0, path_1.join)(projectRoot, '.toon', 'tools', 'codegraph');
        if ((0, fs_1.existsSync)((0, path_1.join)(localPath, 'package.json'))) {
            return { name: 'codegraph', installed: true, path: localPath, version: 'local' };
        }
        return { name: 'codegraph', installed: false, path: '', version: '', error: 'not installed — npm i -g @colbymchenry/codegraph' };
    }
}
function installCodegraph(projectRoot) {
    const toolsDir = (0, path_1.join)(projectRoot, '.toon', 'tools');
    if (!(0, fs_1.existsSync)(toolsDir))
        (0, fs_1.mkdirSync)(toolsDir, { recursive: true });
    const dest = (0, path_1.join)(toolsDir, 'codegraph');
    // Skip if already installed
    if ((0, fs_1.existsSync)((0, path_1.join)(dest, 'package.json'))) {
        return { name: 'codegraph', installed: true, path: dest, version: 'local' };
    }
    try {
        (0, child_process_1.execSync)(`npm install --prefix "${dest}" @colbymchenry/codegraph 2>&1 || curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh 2>&1`, {
            stdio: 'pipe',
            timeout: 60000,
        });
        return { name: 'codegraph', installed: true, path: dest, version: 'latest' };
    }
    catch (err) {
        return { name: 'codegraph', installed: false, path: dest, version: '', error: err.stderr?.toString() || err.message };
    }
}
function ensureAllTools(projectRoot) {
    const results = detectTools(projectRoot);
    // Auto-install codegraph if missing (the others are typically installed via pip)
    if (!results.find(r => r.name === 'codegraph')?.installed) {
        const r = installCodegraph(projectRoot);
        const idx = results.findIndex(t => t.name === 'codegraph');
        if (idx >= 0)
            results[idx] = r;
    }
    const toolMap = {};
    for (const r of results) {
        toolMap[r.name] = {
            installed: r.installed,
            path: r.path,
            status: r.installed ? 'ok' : 'missing',
        };
    }
    return toolMap;
}
function extractVersion(out) {
    const m = out.match(/(\d+\.\d+\.\d+)/);
    return m ? m[1] : 'unknown';
}
//# sourceMappingURL=tool-installer.js.map