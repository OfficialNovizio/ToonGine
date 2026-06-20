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
const ws_1 = require("ws");
const path_1 = require("path");
const fs_1 = require("fs");
const api_1 = __importDefault(require("./api"));
function startDashboard(port = 3000) {
    const app = (0, express_1.default)();
    // ── Serve Vite-built React UI ──────────────────────────────────────────
    const uiDist = (0, path_1.join)(__dirname, 'ui', 'dist');
    if ((0, fs_1.existsSync)(uiDist)) {
        app.use(express_1.default.static(uiDist));
        // SPA fallback — serve index.html for all non-API routes
        app.get(/^(?!\/api\/).*/, (_req, res) => {
            res.sendFile((0, path_1.join)(uiDist, 'index.html'));
        });
    }
    // ── Mount API routes ───────────────────────────────────────────────────
    app.use('/api', api_1.default);
    // ── HTTP server + WebSocket ────────────────────────────────────────────
    const server = (0, http_1.createServer)(app);
    const wss = new ws_1.WebSocketServer({ server, path: '/api/live' });
    const clients = new Set();
    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.on('close', () => clients.delete(ws));
        ws.on('error', () => clients.delete(ws));
    });
    // Broadcast live metrics to all connected clients every 2 seconds
    let liveTick = 0;
    const liveInterval = setInterval(() => {
        if (clients.size === 0)
            return;
        liveTick++;
        const payload = JSON.stringify({
            tick: liveTick,
            timestamp: Date.now(),
            // These would come from the metrics collector in a real setup
            toon: { calls: 0, savings: 0 },
            cie: { queries: 0, savings: 0 },
            cost: { total: 0, hourly: 0 },
        });
        for (const ws of clients) {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(payload);
            }
        }
    }, 2000);
    server.on('close', () => {
        clearInterval(liveInterval);
        for (const ws of clients)
            ws.close();
    });
    // ── Start ──────────────────────────────────────────────────────────────
    server.listen(port, () => {
        console.log(`  ✅ Dashboard running at http://localhost:${port}`);
        console.log('  Press Ctrl+C to stop\n');
    });
    return server;
}
//# sourceMappingURL=server.js.map