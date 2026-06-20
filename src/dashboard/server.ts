// Express server for the ToonGine dashboard.
// Serves the Vite-built React UI + REST API + WebSocket live feed.
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { join } from 'path'
import { existsSync } from 'fs'
import apiRouter from './api'

export function startDashboard(port: number = 3000) {
  const app = express()

  // ── Serve Vite-built React UI ──────────────────────────────────────────
  const uiDist = join(__dirname, 'ui', 'dist')
  if (existsSync(uiDist)) {
    app.use(express.static(uiDist))
    // SPA fallback — serve index.html for all non-API routes
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(join(uiDist, 'index.html'))
    })
  }

  // ── Mount API routes ───────────────────────────────────────────────────
  app.use('/api', apiRouter)

  // ── HTTP server + WebSocket ────────────────────────────────────────────
  const server = createServer(app)
  const wss = new WebSocketServer({ server, path: '/api/live' })

  const clients = new Set<WebSocket>()

  wss.on('connection', (ws) => {
    clients.add(ws)
    ws.on('close', () => clients.delete(ws))
    ws.on('error', () => clients.delete(ws))
  })

  // Broadcast live metrics to all connected clients every 2 seconds
  let liveTick = 0
  const liveInterval = setInterval(() => {
    if (clients.size === 0) return
    liveTick++
    const payload = JSON.stringify({
      tick: liveTick,
      timestamp: Date.now(),
      // These would come from the metrics collector in a real setup
      toon: { calls: 0, savings: 0 },
      cie: { queries: 0, savings: 0 },
      cost: { total: 0, hourly: 0 },
    })
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload)
      }
    }
  }, 2000)

  server.on('close', () => {
    clearInterval(liveInterval)
    for (const ws of clients) ws.close()
  })

  // ── Start ──────────────────────────────────────────────────────────────
  server.listen(port, () => {
    console.log(`  ✅ Dashboard running at http://localhost:${port}`)
    console.log('  Press Ctrl+C to stop\n')
  })

  return server
}
