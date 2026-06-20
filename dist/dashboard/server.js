"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDashboard = startDashboard;
// Express server for the ToonGine dashboard.
// Serves the Vite-built React UI + REST API + WebSocket live feed.
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const path_1 = require("path");
const fs_1 = require("fs");
const api_1 = __importDefault(require("./api"));
function startDashboard(port = 3000) {
    const app = (0, express_1.default)();
    // ── Serve Vite-built React UI ──────────────────────────────────────────
    const uiDist = (0, path_1.join)(__dirname, 'ui', 'dist');
    if ((0, fs_1.existsSync)(uiDist)) {
        app.use(express_1.default.static(uiDist));
        app.get(/^(?!\/api\/).*/, (_req, res) => {
            res.sendFile((0, path_1.join)(uiDist, 'index.html'));
        });
    }
    // ── Mount API routes ───────────────────────────────────────────────────
    app.use('/api', api_1.default);
    // ── HTTP server + optional WebSocket ────────────────────────────────────
    const server = (0, http_1.createServer)(app);
    // WebSocket is optional — dashboard works without it
    try {
        const ws = require('ws');
        const WSS = ws.WebSocketServer || ws.Server;
        const wss = new WSS({ server, path: '/api/live' });
        const clients = new Set();
        wss.on('connection', (wsConn) => {
            clients.add(wsConn);
            wsConn.on('close', () => clients.delete(wsConn));
            wsConn.on('error', () => clients.delete(wsConn));
        });
        let liveTick = 0;
        setInterval(() => {
            liveTick++;
            const msg = JSON.stringify({
                type: 'live', tick: liveTick,
                toonCalls: 0, engineQueries: 0, agentActivities: 0,
                moduleStatuses: [
                    { name: 'API Server', connected: true, details: 'port ' + port },
                    { name: 'Supabase', connected: true, details: 'anon auth' },
                ]
            });
            clients.forEach((c) => { try {
                c.send(msg);
            }
            catch { } });
        }, 2000);
    }
    catch {
        console.log('WebSocket not available — live feed disabled');
    }
    server.listen(port, () => {
        console.log(`ToonGine dashboard running on http://localhost:${port}`);
    });
    return server;
}
//# sourceMappingURL=server.js.map