"use strict";
// src/dashboard/inject.ts
// Settings injection — embeds dashboard into host project.
// Detects project type (Next.js App Router, Pages Router, Vite) and
// creates the appropriate settings/dashboard page without overwriting.
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectDashboard = injectDashboard;
const fs_1 = require("fs");
const path_1 = require("path");
function injectDashboard(projectRoot, config) {
    const created = [];
    const skipped = [];
    const errors = [];
    const isNextApp = (0, fs_1.existsSync)((0, path_1.join)(projectRoot, 'app', 'layout.tsx')) ||
        (0, fs_1.existsSync)((0, path_1.join)(projectRoot, 'app', 'layout.js'));
    const isNextPages = (0, fs_1.existsSync)((0, path_1.join)(projectRoot, 'pages', '_app.tsx')) ||
        (0, fs_1.existsSync)((0, path_1.join)(projectRoot, 'pages', '_app.js'));
    const isVite = (0, fs_1.existsSync)((0, path_1.join)(projectRoot, 'vite.config.ts')) ||
        (0, fs_1.existsSync)((0, path_1.join)(projectRoot, 'vite.config.js'));
    try {
        if (isNextApp) {
            injectNextAppRouter(projectRoot, config, created, skipped);
        }
        else if (isNextPages) {
            injectNextPagesRouter(projectRoot, config, created, skipped);
        }
        else if (isVite) {
            injectVite(projectRoot, config, created, skipped);
        }
        else {
            skipped.push('Unknown project type — dashboard available via npx toongine dashboard');
        }
    }
    catch (e) {
        errors.push(e.message);
    }
    return { created, skipped, errors };
}
// ─── Next.js App Router ──────────────────────────────────────────────────────
function injectNextAppRouter(root, config, created, skipped) {
    const pageDir = (0, path_1.join)(root, 'app', 'settings', 'dashboard');
    const pagePath = (0, path_1.join)(pageDir, 'page.tsx');
    if ((0, fs_1.existsSync)(pagePath)) {
        skipped.push('app/settings/dashboard/page.tsx (already exists)');
        return;
    }
    (0, fs_1.mkdirSync)(pageDir, { recursive: true });
    (0, fs_1.writeFileSync)(pagePath, NEXTJS_PAGE_TEMPLATE);
    created.push('app/settings/dashboard/page.tsx');
}
// ─── Next.js Pages Router ────────────────────────────────────────────────────
function injectNextPagesRouter(root, config, created, skipped) {
    const pageDir = (0, path_1.join)(root, 'pages', 'settings');
    const pagePath = (0, path_1.join)(pageDir, 'dashboard.tsx');
    if ((0, fs_1.existsSync)(pagePath)) {
        skipped.push('pages/settings/dashboard.tsx (already exists)');
        return;
    }
    (0, fs_1.mkdirSync)(pageDir, { recursive: true });
    (0, fs_1.writeFileSync)(pagePath, NEXTJS_PAGE_TEMPLATE);
    created.push('pages/settings/dashboard.tsx');
}
// ─── Vite / React SPA ────────────────────────────────────────────────────────
function injectVite(root, config, created, skipped) {
    const pageDir = (0, path_1.join)(root, 'src', 'pages');
    const pagePath = (0, path_1.join)(pageDir, 'Dashboard.tsx');
    if ((0, fs_1.existsSync)(pagePath)) {
        skipped.push('src/pages/Dashboard.tsx (already exists)');
        return;
    }
    (0, fs_1.mkdirSync)(pageDir, { recursive: true });
    (0, fs_1.writeFileSync)(pagePath, REACT_PAGE_TEMPLATE);
    created.push('src/pages/Dashboard.tsx');
}
// ─── Templates ───────────────────────────────────────────────────────────────
const NEXTJS_PAGE_TEMPLATE = `'use client'

import { useEffect, useState } from 'react'

interface DashboardData {
  toon: any; cie: any; cost: any; modules: any[]; agents: any[]
}

const DASHBOARD_PORT = 4200

export default function DashboardSettingsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [connected, setConnected] = useState(false)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    fetch('/api/toongine-config').then(r => r.json()).then(setConfig).catch(() => {})

    try {
      const ws = new WebSocket(\`ws://localhost:\${DASHBOARD_PORT}/api/live\`)
      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onmessage = (e) => {
        try { const msg = JSON.parse(e.data); if (msg.type === 'stats') setData(msg) } catch {}
      }
      return () => ws.close()
    } catch { setConnected(false) }
  }, [])

  async function toggleSetting(key: string) {
    try {
      await fetch('/api/toongine-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: !config?.dashboard?.[key] })
      })
      setConfig((prev: any) => ({
        ...prev,
        dashboard: { ...prev?.dashboard, [key]: !prev?.dashboard?.[key] }
      }))
    } catch {}
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0e17', color: '#e4e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        <a href="/settings" style={{ color: '#5a6478', fontSize: 14, textDecoration: 'none' }}>
          ← Back to Settings
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>⚙️ Dashboard Settings</h1>

        {/* Toggles */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 20, marginTop: 20, marginBottom: 32
        }}>
          {[
            { key: 'showInSettings', label: 'Show Dashboard in Settings', hint: 'When off, access via: npx toongine dashboard' },
            { key: 'autoStartOnDev', label: 'Auto-start with dev server', hint: 'Dashboard starts on port 4200 with npm run dev' },
          ].map(({ key, label, hint }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={config?.dashboard?.[key] !== false}
                onChange={() => toggleSetting(key)}
                style={{ width: 18, height: 18, accentColor: '#00d4ff' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#5a6478' }}>{hint}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Dashboard embed */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 20, marginBottom: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: connected ? '#34d399' : '#f87171', display: 'inline-block'
            }} />
            <span style={{ fontWeight: 600 }}>
              {connected ? 'Dashboard Connected' : 'Dashboard Offline'}
            </span>
            <span style={{ fontSize: 13, color: '#5a6478', marginLeft: 'auto' }}>
              {connected ? 'WebSocket active' : 'Start with: npx toongine dashboard'}
            </span>
          </div>

          {data ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16
            }}>
              {/* Connections */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>🔌 Connections</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(data.modules || []).map((m: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: m.connected ? '#34d399' : m.details?.includes('fallback') ? '#f59e0b' : '#f87171'
                      }} />
                      <span style={{ color: '#8892a8' }}>{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOON */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>📊 TOON Compression</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#00d4ff' }}>
                  {data.toon?.avgSavingsPercent || 0}%
                </div>
                <div style={{ fontSize: 13, color: '#5a6478' }}>
                  {data.toon?.total || 0} calls · \${data.toon?.totalCostSaved?.toFixed(4) || '0.0000'} saved
                </div>
              </div>

              {/* Cost */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>💰 Cost</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#5a6478' }}>Spent</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171' }}>
                      \${data.cost?.totalSpent?.toFixed(4) || '0.0000'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#5a6478' }}>Saved</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>
                      \${data.cost?.totalSaved?.toFixed(4) || '0.0000'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CIE */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>⚙️ CIE Pipeline</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 13, color: '#8892a8' }}>
                  <span>{data.cie?.totalTicks || 0} runs</span>
                  <span>·</span>
                  <span>{data.cie?.avgLatencyMs || 0}ms</span>
                  <span>·</span>
                  <span>{data.cie?.skipRate || 0}% skip</span>
                </div>
              </div>

              {/* Agents summary */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16, gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>👥 Agents</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(data.agents || []).map((a: any) => (
                    <span key={a.agentId} style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 12,
                      background: 'rgba(255,255,255,0.06)', color: '#8892a8',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: a.status === 'online' ? '#34d399' : a.status === 'idle' ? '#f59e0b' : '#f87171'
                      }} />
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a6478' }}>
              {connected ? 'Waiting for data...' : 'Dashboard server not running. Start with:'}
              <br />
              <code style={{ color: '#00d4ff', marginTop: 8, display: 'inline-block' }}>
                npx toongine dashboard
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
`;
const REACT_PAGE_TEMPLATE = `import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    try {
      const ws = new WebSocket('ws://localhost:4200/api/live')
      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onmessage = (e) => {
        try { setData(JSON.parse(e.data)) } catch {}
      }
      return () => ws.close()
    } catch { setConnected(false) }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e17', color: '#e4e8f0', padding: 24 }}>
      <h1>⚡ YVON Dashboard</h1>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Offline'}</p>
      {data && <pre style={{ color: '#8892a8', fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
`;
//# sourceMappingURL=inject.js.map