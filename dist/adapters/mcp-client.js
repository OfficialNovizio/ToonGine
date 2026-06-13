"use strict";
// src/adapters/mcp-client.ts — MCP client for code-review-graph
//
// Connects to code-review-graph's MCP server via stdio JSON-RPC.
// Gracefully degrades if code-review-graph is not installed.
//
//   const client = createMCPClient()
//   if (client.available) {
//     const result = await client.query("analyze src/index.ts")
//     await client.close()
//   }
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMCPClient = createMCPClient;
const child_process_1 = require("child_process");
const child_process_2 = require("child_process");
// ─── Helpers ──────────────────────────────────────────────────────────────────
function findCodeReviewGraph() {
    try {
        const result = (0, child_process_2.execSync)('which code-review-graph', { encoding: 'utf-8', timeout: 5000 });
        const trimmed = result.trim();
        return trimmed ? trimmed : null;
    }
    catch {
        return null;
    }
}
// ─── Main ──────────────────────────────────────────────────────────────────────
function createMCPClient() {
    const binaryPath = findCodeReviewGraph();
    if (!binaryPath) {
        return {
            available: false,
            query: async () => { throw new Error('code-review-graph not installed'); },
            close: () => { },
        };
    }
    let proc = null;
    let nextId = 1;
    const pending = new Map();
    let buffer = '';
    let initialized = false;
    let initPromise = null;
    function ensureProcess() {
        if (proc && !proc.killed)
            return proc;
        proc = (0, child_process_1.spawn)(binaryPath, ['mcp'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
        });
        buffer = '';
        pending.clear();
        nextId = 1;
        initialized = false;
        initPromise = null;
        proc.stdout?.on('data', (chunk) => {
            buffer += chunk.toString();
            // Parse complete JSON-RPC messages (newline-delimited)
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // keep incomplete line in buffer
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed)
                    continue;
                try {
                    const response = JSON.parse(trimmed);
                    const pendingRequest = pending.get(response.id);
                    if (pendingRequest) {
                        pending.delete(response.id);
                        if (response.error) {
                            pendingRequest.reject(new Error(response.error.message));
                        }
                        else {
                            const resultStr = typeof response.result === 'string'
                                ? response.result
                                : JSON.stringify(response.result);
                            pendingRequest.resolve(resultStr);
                        }
                    }
                }
                catch {
                    // Ignore non-JSON lines
                }
            }
        });
        proc.stderr?.on('data', (chunk) => {
            // Stderr may contain log messages; ignore for now
        });
        proc.on('error', (err) => {
            pending.forEach((p) => {
                p.reject(new Error(`MCP process error: ${err.message}`));
            });
            pending.clear();
        });
        proc.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                const msg = `MCP process exited with code ${code}`;
                pending.forEach((p) => {
                    p.reject(new Error(msg));
                });
                pending.clear();
            }
        });
        return proc;
    }
    function sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            const p = ensureProcess();
            const id = nextId++;
            const request = {
                jsonrpc: '2.0',
                id,
                method,
                params,
            };
            pending.set(id, { resolve, reject });
            const timeout = setTimeout(() => {
                pending.delete(id);
                reject(new Error(`MCP request timeout: ${method}`));
            }, 120000); // 2 minute timeout
            // Wrap resolve/reject to clear timeout
            const origResolve = resolve;
            const origReject = reject;
            pending.set(id, {
                resolve: (v) => { clearTimeout(timeout); origResolve(v); },
                reject: (e) => { clearTimeout(timeout); origReject(e); },
            });
            p.stdin?.write(JSON.stringify(request) + '\n');
        });
    }
    async function initialize() {
        if (initialized)
            return;
        if (initPromise)
            return initPromise;
        initPromise = (async () => {
            await sendRequest('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'toongine',
                    version: '1.3.0',
                },
            });
            // Send initialized notification
            const p = ensureProcess();
            p.stdin?.write(JSON.stringify({
                jsonrpc: '2.0',
                method: 'notifications/initialized',
            }) + '\n');
            initialized = true;
        })();
        return initPromise;
    }
    async function query(q) {
        await initialize();
        try {
            const result = await sendRequest('tools/call', {
                name: 'code_review',
                arguments: { query: q },
            });
            return result;
        }
        catch {
            // Fallback: try as a prompt-based query
            try {
                const result = await sendRequest('tools/call', {
                    name: 'analyze',
                    arguments: { code: q },
                });
                return result;
            }
            catch {
                throw new Error('code-review-graph query failed');
            }
        }
    }
    return {
        available: true,
        query,
        close: () => {
            if (proc && !proc.killed) {
                try {
                    proc.stdin?.end();
                }
                catch { }
                proc.kill();
            }
        },
    };
}
//# sourceMappingURL=mcp-client.js.map