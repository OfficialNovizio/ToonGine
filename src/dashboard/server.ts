// Express server for the ToonGine dashboard.
// Serves the Vite-built React UI + REST API + WebSocket live feed.
import express from 'express'
import { createServer } from 'http'
import { join } from 'path'
import { existsSync } from 'fs'
import apiRouter from './api'

export function startDashboard(port: number = 3000) {
  const app = express()

  // ── Serve Vite-built React UI ──────────────────────────────────────────
  const uiDist = join(__dirname, 'ui', 'dist')
  if (existsSync(uiDist)) {
    app.use(express.static(uiDist))
    app.get(/^(?!\/api\/).*/, (_req: any, res: any) => {
      res.sendFile(join(uiDist, 'index.html'))
    })
  }

  // ── Mount API routes ───────────────────────────────────────────────────
  app.use('/api', apiRouter)

  // ── HTTP server + optional WebSocket ────────────────────────────────────
  const server = createServer(app)

  // WebSocket is optional — dashboard works without it
  try {
    const ws = require('ws')
    const WSS = ws.WebSocketServer || ws.Server
    const wss = new WSS({ server, path: '/api/live' })
    const clients = new Set<any>()
    wss.on('connection', (wsConn: any) => {
      clients.add(wsConn)
      wsConn.on('close', () => clients.delete(wsConn))
      wsConn.on('error', () => clients.delete(wsConn))
    })
    let liveTick = 0
    setInterval(() => {
      liveTick++
      const msg = JSON.stringify({
        type: 'live', tick: liveTick,
        toonCalls: 0, engineQueries: 0, agentActivities: 0,
        moduleStatuses: [
          { name: 'API Server', connected: true, details: 'port ' + port },
          { name: 'Supabase', connected: true, details: 'anon auth' },
        ]
      })
      clients.forEach((c: any) => { try { c.send(msg) } catch {} })
    }, 2000)
  } catch {
    console.log('WebSocket not available — live feed disabled')
  }

  server.listen(port, () => {
    console.log(`ToonGine dashboard running on http://localhost:${port}`)
  })

  return server
}
