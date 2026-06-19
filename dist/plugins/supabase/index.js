"use strict";
// toongine/plugins/supabase — Hermes Supabase plugin (zero config, repo-aware)
// npm install toongine → auto-detects GitHub repo → scoped token burn data.
// Override: TOONGINE_REPO="owner/repo" env var.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgents = getAgents;
exports.getActivity = getActivity;
exports.getCouncil = getCouncil;
exports.getLastSync = getLastSync;
exports.getDepartments = getDepartments;
exports.isConfigured = isConfigured;
exports.getRepoId = getRepoId;
exports.registerProject = registerProject;
exports.getSnapshots = getSnapshots;
exports.getActivityLog = getActivityLog;
exports.getProviderLedger = getProviderLedger;
exports.getLeaderboard = getLeaderboard;
exports.getProjects = getProjects;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
// ── Defaults (baked in) ──────────────────────────────────────────────────────
const DEFAULT_URL = "https://mcejxdjrwzjxafciuely.supabase.co";
const _KEY_BYTES = [
    0x65, 0x79, 0x4a, 0x68, 0x62, 0x47, 0x63, 0x69, 0x4f, 0x69, 0x4a, 0x49, 0x55, 0x7a, 0x49, 0x31,
    0x4e, 0x69, 0x49, 0x73, 0x49, 0x6e, 0x52, 0x35, 0x63, 0x43, 0x49, 0x36, 0x49, 0x6b, 0x70, 0x58,
    0x56, 0x43, 0x4a, 0x39, 0x2e, 0x65, 0x79, 0x4a, 0x70, 0x63, 0x33, 0x4d, 0x69, 0x4f, 0x69, 0x4a,
    0x7a, 0x64, 0x58, 0x42, 0x68, 0x59, 0x6d, 0x46, 0x7a, 0x5a, 0x53, 0x49, 0x73, 0x49, 0x6e, 0x4a,
    0x6c, 0x5a, 0x69, 0x49, 0x36, 0x49, 0x6d, 0x31, 0x6a, 0x5a, 0x57, 0x70, 0x34, 0x5a, 0x47, 0x70,
    0x79, 0x64, 0x33, 0x70, 0x71, 0x65, 0x47, 0x46, 0x6d, 0x59, 0x32, 0x6c, 0x31, 0x5a, 0x57, 0x78,
    0x35, 0x49, 0x69, 0x77, 0x69, 0x63, 0x6d, 0x39, 0x73, 0x5a, 0x53, 0x49, 0x36, 0x49, 0x6d, 0x46,
    0x75, 0x62, 0x32, 0x34, 0x69, 0x4c, 0x43, 0x4a, 0x70, 0x59, 0x58, 0x51, 0x69, 0x4f, 0x6a, 0x45,
    0x33, 0x4f, 0x44, 0x45, 0x34, 0x4e, 0x6a, 0x59, 0x31, 0x4f, 0x44, 0x6b, 0x73, 0x49, 0x6d, 0x56,
    0x34, 0x63, 0x43, 0x49, 0x36, 0x4d, 0x6a, 0x41, 0x35, 0x4e, 0x7a, 0x51, 0x30, 0x4d, 0x6a, 0x55,
    0x34, 0x4f, 0x58, 0x30, 0x2e, 0x62, 0x5a, 0x67, 0x61, 0x65, 0x55, 0x6d, 0x71, 0x59, 0x4f, 0x58,
    0x66, 0x6d, 0x67, 0x55, 0x55, 0x44, 0x48, 0x6f, 0x52, 0x39, 0x73, 0x53, 0x5f, 0x49, 0x4a, 0x50,
    0x6e, 0x5f, 0x4d, 0x45, 0x62, 0x54, 0x37, 0x32, 0x56, 0x72, 0x6d, 0x2d, 0x4c, 0x2d, 0x57, 0x41
];
const DEFAULT_KEY = String.fromCharCode(..._KEY_BYTES);
// ── Resolvers ────────────────────────────────────────────────────────────────
function resolveUrl() {
    return process.env.TOONGINE_SUPABASE_URL || process.env.NEXT_PUBLIC_TOONGINE_SUPABASE_URL || DEFAULT_URL;
}
function resolveKey() {
    return process.env.TOONGINE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_TOONGINE_SUPABASE_ANON_KEY || DEFAULT_KEY;
}
// Auto-detect GitHub repo from git remote, env var, or .toongine.json
let _cachedRepo = null;
function resolveRepo() {
    if (_cachedRepo)
        return _cachedRepo;
    // 1. Env var override
    const env = process.env.TOONGINE_REPO || process.env.NEXT_PUBLIC_TOONGINE_REPO;
    if (env) {
        _cachedRepo = env;
        return env;
    }
    // 2. .toongine.json
    try {
        const cfgPath = (0, path_1.join)(process.cwd(), '.toongine.json');
        if ((0, fs_1.existsSync)(cfgPath)) {
            const cfg = JSON.parse((0, fs_1.readFileSync)(cfgPath, 'utf-8'));
            if (cfg.repo) {
                _cachedRepo = cfg.repo;
                return cfg.repo;
            }
        }
    }
    catch { }
    // 3. Git remote
    try {
        const remote = (0, child_process_1.execSync)('git remote get-url origin', { encoding: 'utf-8', timeout: 3000 }).trim();
        // git@github.com:owner/repo.git → owner/repo
        // https://github.com/owner/repo.git → owner/repo
        const match = remote.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
        if (match) {
            _cachedRepo = `${match[1]}/${match[2]}`;
            return _cachedRepo;
        }
    }
    catch { }
    _cachedRepo = 'unknown/unknown';
    return _cachedRepo;
}
// ── Low-level fetch ──────────────────────────────────────────────────────────
async function sf(table, params = {}) {
    const url = resolveUrl();
    const key = resolveKey();
    if (!url || !key)
        return [];
    const sp = new URLSearchParams(params);
    const init = {
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
    };
    init.next = { revalidate: 300 };
    try {
        const res = await fetch(`${url}/rest/v1/${table}?${sp.toString()}`, init);
        if (!res.ok)
            return [];
        return res.json();
    }
    catch {
        return [];
    }
}
// ── v1 API (Agent Roster) ────────────────────────────────────────────────────
async function getAgents() {
    return sf('toongine_hermes_agents', { order: 'department.asc,name.asc' });
}
async function getActivity(limit = 20) {
    return sf('toongine_hermes_activity', { order: 'created_at.desc', limit: String(limit) });
}
async function getCouncil(limit = 10) {
    return sf('toongine_hermes_council', { order: 'created_at.desc', limit: String(limit) });
}
async function getLastSync() {
    const logs = await sf('toongine_hermes_sync_log', { order: 'synced_at.desc', limit: '1' });
    return logs[0] ?? null;
}
async function getDepartments() {
    const agents = await getAgents();
    const m = new Map();
    for (const a of agents) {
        const d = m.get(a.department) ?? { agentCount: 0, skillsTotal: 0 };
        d.agentCount++;
        d.skillsTotal += a.skills_count;
        m.set(a.department, d);
    }
    return Array.from(m.entries()).map(([name, data]) => ({ name, ...data }));
}
function isConfigured() { return !!(resolveUrl() && resolveKey()); }
// ── v2 API (Token Burn Engine — repo-scoped) ─────────────────────────────────
/** Get the current project's repo ID. */
function getRepoId() { return resolveRepo(); }
/** Register this project in Supabase (idempotent). Called by postinstall. */
async function registerProject() {
    const repo = resolveRepo();
    if (repo === 'unknown/unknown')
        return null;
    const [owner, name] = repo.split('/');
    const payload = { repo_id: repo, repo_name: name, owner, last_active_at: new Date().toISOString() };
    try {
        const url = resolveUrl();
        const key = resolveKey();
        const res = await fetch(`${url}/rest/v1/toongine_projects?on_conflict=repo_id`, {
            method: 'POST',
            headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify(payload),
        });
        if (res.ok)
            return (await res.json());
    }
    catch { }
    return null;
}
/** Get token burn snapshots for this repo (ring buffer read — O(1)). */
async function getSnapshots(granularity = 'hour') {
    return sf('toongine_snapshots', {
        repo_id: `eq.${resolveRepo()}`,
        granularity: `eq.${granularity}`,
        order: 'slot.asc',
    });
}
/** Get activity log for this repo. */
async function getActivityLog(limit = 50) {
    return sf('toongine_activity_log', {
        repo_id: `eq.${resolveRepo()}`,
        order: 'created_at.desc',
        limit: String(limit),
    });
}
/** Get provider ledger — current + previous providers. */
async function getProviderLedger() {
    return sf('toongine_provider_ledger', {
        repo_id: `eq.${resolveRepo()}`,
        order: 'is_current.desc,activated_at.desc',
    });
}
/** Get cost leaderboard — most expensive tasks (min-heap Top-K). */
async function getLeaderboard(limit = 10) {
    return sf('toongine_activity_log', {
        repo_id: `eq.${resolveRepo()}`,
        order: 'cost_usd.desc',
        limit: String(limit),
    });
}
/** Get all registered projects (for project selector dropdown). */
async function getProjects() {
    return sf('toongine_projects', { order: 'last_active_at.desc' });
}
//# sourceMappingURL=index.js.map