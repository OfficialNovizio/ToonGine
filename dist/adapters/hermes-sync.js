"use strict";
// src/adapters/hermes-sync.ts — Hermes memory sync module
//
// Reads/writes ~/.hermes/memories/ files for bidirectional
// context synchronization between ToonGine and Hermes Agent.
//
//   syncWithHermes()     → read USER.md + MEMORY.md, return synced context
//   pushToHermes(...)    → write memories back to Hermes
//
// Dependencies: Node.js fs module only.
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncWithHermes = syncWithHermes;
exports.pushToHermes = pushToHermes;
exports.clearHermesMemory = clearHermesMemory;
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("./config");
// ─── Path resolution ──────────────────────────────────────────────────────────
function getHermesPaths() {
    const dir = (0, config_1.getConfig)().hermesMemoryDir;
    return {
        dir,
        userFile: (0, path_1.join)(dir, 'USER.md'),
        memoryFile: (0, path_1.join)(dir, 'MEMORY.md'),
    };
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeRead(path) {
    try {
        if (!(0, fs_1.existsSync)(path)) {
            return { content: '', error: `File not found: ${path}` };
        }
        const content = (0, fs_1.readFileSync)(path, 'utf-8');
        return { content, error: null };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: '', error: `Read error: ${msg}` };
    }
}
function ensureDir(path) {
    if (!(0, fs_1.existsSync)(path)) {
        (0, fs_1.mkdirSync)(path, { recursive: true });
    }
}
// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Synchronize context from Hermes memory files.
 *
 * Reads USER.md (user identity/preferences) and MEMORY.md (persistent
 * agent memory) from ~/.hermes/memories/. Returns a structured context
 * object suitable for injecting into agent system prompts.
 *
 * The `contextString` field is pre-formatted for LLM injection with
 * minimal token overhead.
 */
function syncWithHermes() {
    const errors = [];
    const filesRead = [];
    const { userFile, memoryFile } = getHermesPaths();
    const userResult = safeRead(userFile);
    if (userResult.error) {
        errors.push(`USER.md: ${userResult.error}`);
    }
    else if (userResult.content) {
        filesRead.push(userFile);
    }
    const memoryResult = safeRead(memoryFile);
    if (memoryResult.error) {
        errors.push(`MEMORY.md: ${memoryResult.error}`);
    }
    else if (memoryResult.content) {
        filesRead.push(memoryFile);
    }
    const userProfile = userResult.content;
    const agentMemory = memoryResult.content;
    const success = errors.length === 0 || filesRead.length > 0;
    // Build a compact context string for LLM injection
    const contextParts = [];
    if (userProfile) {
        const truncated = userProfile.length > 2000
            ? userProfile.slice(0, 2000) + '\n... (truncated)'
            : userProfile;
        contextParts.push(`--- USER PROFILE ---\n${truncated}`);
    }
    if (agentMemory) {
        const truncated = agentMemory.length > 3000
            ? agentMemory.slice(0, 3000) + '\n... (truncated)'
            : agentMemory;
        contextParts.push(`--- AGENT MEMORY ---\n${truncated}`);
    }
    return {
        userProfile,
        agentMemory,
        success,
        filesRead,
        errors,
        contextString: contextParts.join('\n\n'),
    };
}
/**
 * Push memories back to the Hermes memory system.
 *
 * Each string in `memories` is appended to MEMORY.md as a dated entry.
 * Creates the ~/.hermes/memories/ directory if it doesn't exist.
 *
 * Returns a result with count of memories written and total bytes.
 */
function pushToHermes(memories) {
    const errors = [];
    const { dir, memoryFile, userFile } = getHermesPaths();
    // Ensure the memories directory exists
    try {
        ensureDir(dir);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            memoriesWritten: 0,
            bytesWritten: 0,
            errors: [`Failed to create directory: ${msg}`],
        };
    }
    // Build entry lines with timestamps
    const now = new Date().toISOString();
    const entries = memories.map((m, i) => `[${now}#${i + 1}] ${m.trim()}`);
    const block = '\n' + entries.join('\n') + '\n';
    const bytes = Buffer.byteLength(block, 'utf-8');
    // Append to MEMORY.md
    try {
        const existing = (0, fs_1.existsSync)(memoryFile)
            ? (0, fs_1.readFileSync)(memoryFile, 'utf-8')
            : '# Hermes Agent Memory\n\nPersistent memories synced from ToonGine.\n';
        (0, fs_1.writeFileSync)(memoryFile, existing + block, 'utf-8');
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            memoriesWritten: 0,
            bytesWritten: 0,
            errors: [`Write error: ${msg}`],
        };
    }
    // Also touch USER.md if it doesn't exist (template)
    if (!(0, fs_1.existsSync)(userFile)) {
        try {
            (0, fs_1.writeFileSync)(userFile, '# User Profile\n\nNo profile configured yet.\n', 'utf-8');
        }
        catch {
            // Non-critical; USER.md template creation can fail silently
        }
    }
    return {
        success: true,
        memoriesWritten: memories.length,
        bytesWritten: bytes,
        errors,
    };
}
/**
 * Clear all Hermes memory (resets MEMORY.md).
 * USE WITH CAUTION — this is irreversible.
 */
function clearHermesMemory() {
    try {
        const { dir, memoryFile } = getHermesPaths();
        ensureDir(dir);
        (0, fs_1.writeFileSync)(memoryFile, '# Hermes Agent Memory\n\nCleared and reset.\n', 'utf-8');
        return { success: true, error: null };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: msg };
    }
}
//# sourceMappingURL=hermes-sync.js.map