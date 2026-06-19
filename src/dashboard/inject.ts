// src/dashboard/inject.ts
// Agent Dashboard injection — embeds ToonGine dashboard into host project.
// Detects project type (Next.js, Vite, plain HTML) and creates the agent
// dashboard page with "Initialize ToonGine" flow.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, relative } from 'path'

export interface InjectResult {
  created: string[]
  updated: string[]
  skipped: string[]
  errors: string[]
  dashboardPath: string | null
}

export function injectDashboard(projectRoot: string, config?: any): InjectResult {
  const created: string[] = []
  const updated: string[] = []
  const skipped: string[] = []
  const errors: string[] = []
  let dashboardPath: string | null = null

  const isNextApp = existsSync(join(projectRoot, 'app', 'layout.tsx'))
  const isNextPages = existsSync(join(projectRoot, 'pages', '_app.tsx'))
  const isVite = existsSync(join(projectRoot, 'vite.config.ts')) || existsSync(join(projectRoot, 'vite.config.js'))

  try {
    if (isNextApp) {
      dashboardPath = injectNextAppRouter(projectRoot, created, skipped, errors, updated)
    } else if (isNextPages) {
      dashboardPath = injectNextPagesRouter(projectRoot, created, skipped, errors, updated)
    } else if (isVite) {
      dashboardPath = injectVite(projectRoot, created, skipped, errors, updated)
    } else {
      // Generic: create standalone HTML page
      dashboardPath = injectGeneric(projectRoot, created, skipped, errors)
    }
  } catch (e: any) {
    errors.push(e.message)
  }

  return { created, updated, skipped, errors, dashboardPath }
}

// ─── Next.js App Router ────────────────────────────────────────────────────

function injectNextAppRouter(root: string, created: string[], skipped: string[], errors: string[], updated: string[]): string | null {
  const pageDir = join(root, 'app', 'toongine')
  const pagePath = join(pageDir, 'page.tsx')
  const layoutPath = join(pageDir, 'layout.tsx')

  mkdirSync(pageDir, { recursive: true })

  // Create layout (no nav wrapper — standalone page)
  if (!existsSync(layoutPath)) {
    writeFileSync(layoutPath, `export default function ToonGineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
`)
    created.push('app/toongine/layout.tsx')
  }

  // Always overwrite the page with latest template
  writeFileSync(pagePath, NEXTJS_AGENT_TEMPLATE)
  created.push('app/toongine/page.tsx')

  // Inject nav link into existing layout if possible
  injectNavLink(root, '/toongine', '⚡ToonGine', created, skipped, errors, updated)

  return '/toongine'
}

function injectNextPagesRouter(root: string, created: string[], skipped: string[], errors: string[], updated: string[]): string | null {
  const pageDir = join(root, 'pages', 'toongine')
  const pagePath = join(pageDir, 'index.tsx')

  mkdirSync(pageDir, { recursive: true })
  writeFileSync(pagePath, NEXTJS_AGENT_TEMPLATE.replace(/export default function ToonGinePage/, 'export default function ToonGineIndexPage'))
  created.push('pages/toongine/index.tsx')

  injectNavLink(root, '/toongine', '⚡ToonGine', created, skipped, errors, updated)
  return '/toongine'
}

function injectVite(root: string, created: string[], skipped: string[], errors: string[], updated: string[]): string | null {
  const pageDir = join(root, 'src', 'pages')
  const pagePath = join(pageDir, 'ToonGine.tsx')

  mkdirSync(pageDir, { recursive: true })
  writeFileSync(pagePath, REACT_AGENT_TEMPLATE)
  created.push('src/pages/ToonGine.tsx')

  // Try to add route to App.tsx
  try {
    const appPath = join(root, 'src', 'App.tsx')
    if (existsSync(appPath)) {
      let content = readFileSync(appPath, 'utf-8')
      if (!content.includes('ToonGine')) {
        // Inject import
        if (!content.includes("import ToonGine")) {
          content = content.replace(/(import .+\n)/, `$1import ToonGine from './pages/ToonGine'\n`)
        }
        // Inject route (before closing </Routes> or </Router>)
        content = content.replace(/(<\/Routes>|<\/Switch>|<\/Router>)/, `  <Route path="/toongine" element={<ToonGine />} />\n    $1`)
        writeFileSync(appPath, content)
        updated.push('src/App.tsx')
      }
    }
  } catch {}

  return '/toongine'
}

function injectGeneric(root: string, created: string[], skipped: string[], errors: string[]): string | null {
  // Create a standalone HTML page served by toongine Express
  const publicDir = join(root, 'public')
  mkdirSync(publicDir, { recursive: true })

  const htmlPath = join(publicDir, 'toongine.html')
  writeFileSync(htmlPath, STANDALONE_AGENT_TEMPLATE)
  created.push('public/toongine.html')

  return 'public/toongine.html'
}

// ─── Nav Link Injection ─────────────────────────────────────────────────────

function injectNavLink(root: string, href: string, label: string, created: string[], skipped: string[], errors: string[], updated: string[]): void {
  // Try to add a nav link to the project's layout
  const layoutPaths = [
    join(root, 'app', 'layout.tsx'),
    join(root, 'components', 'Nav.tsx'),
    join(root, 'components', 'NavBar.tsx'),
    join(root, 'components', 'Navigation.tsx'),
    join(root, 'src', 'components', 'Nav.tsx'),
  ]

  for (const navPath of layoutPaths) {
    if (!existsSync(navPath)) continue
    try {
      let content = readFileSync(navPath, 'utf-8')
      if (content.includes(label)) { skipped.push(`${relative(root, navPath)} (already has link)`); return }
      
      // Inject as a <Link> or <a> tag before a closing nav/div
      const navLink = `<Link href="${href}" className="toongine-nav-link">${label}</Link>`
      const aTag = `<a href="${href}" className="toongine-nav-link">${label}</a>`
      
      if (content.includes('</nav>')) {
        content = content.replace('</nav>', `  ${aTag}\n      </nav>`)
        writeFileSync(navPath, content)
        updated.push(relative(root, navPath))
        return
      }
      if (content.includes('</div>') && (content.includes('nav') || content.includes('Nav'))) {
        content = content.replace(/(\s+)<\/div>(\s*\n\s*(?:export|function|const|{))/, `$1  <a href="${href}" style={TAB_STYLE}>${label}</a>\n$1</div>$2`)
        writeFileSync(navPath, content)
        updated.push(relative(root, navPath))
        return
      }
    } catch {}
  }

  skipped.push('No nav file found — access dashboard at ' + href)
}

// ─── Templates ───────────────────────────────────────────────────────────────

const NEXTJS_AGENT_TEMPLATE = `'use client'

import { useEffect, useState } from 'react'

/* ── Design tokens (dark glass) ───────────────────────────────────────── */
const colors = {
  bg: '#0a0e17',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  text: '#e4e8f0',
  muted: '#5a6478',
  accent: '#00d4ff',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
}

const glassCard: React.CSSProperties = {
  background: colors.glass, border: \`1px solid \${colors.glassBorder}\`,
  borderRadius: 14, backdropFilter: 'blur(16px)', padding: 20,
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: colors.bg, color: colors.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.muted },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 },
  kpi: { textAlign: 'center' as const, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10 },
  kpiVal: { fontSize: 22, fontWeight: 700 },
  kpiLbl: { fontSize: 10, color: colors.muted, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginTop: 4 },
  section: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 },
  panel: { ...glassCard },
  panelTitle: { fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  memRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 },
  barWrap: { flex: 1, height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  gridItem: { textAlign: 'center' as const, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8 },
  plugRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 },
  initOverlay: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    minHeight: 400, textAlign: 'center' as const },
  initBtn: { marginTop: 20, padding: '16px 48px', fontSize: 16, fontWeight: 700,
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none',
    borderRadius: 14, cursor: 'pointer', letterSpacing: '-0.01em' },
  initBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  progressBar: { width: 300, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6366f1)', borderRadius: 3, transition: 'width 0.3s' },
}

export default function ToonGinePage() {
  const [data, setData] = useState<any>(null)
  const [initializing, setInitializing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')

  // Poll for data
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/toongine/health')
        if (res.ok) {
          const d = await res.json()
          if (d.initialized) setData(d)
        }
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleInit() {
    setInitializing(true)
    setError('')
    setProgress(10)
    setStatusText('Scanning project files...')

    try {
      const res = await fetch('/api/toongine/init', { method: 'POST' })
      if (!res.ok) throw new Error('Init failed')

      // Stream progress updates
      const reader = res.body?.getReader()
      if (reader) {
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            try {
              const msg = JSON.parse(line)
              if (msg.progress) setProgress(msg.progress)
              if (msg.status) setStatusText(msg.status)
              if (msg.done) {
                setProgress(100)
                setStatusText('Initialization complete!')
                setTimeout(() => window.location.reload(), 1500)
              }
              if (msg.error) throw new Error(msg.error)
            } catch (e: any) {
              if (e.message !== 'Init failed') throw e
            }
          }
        }
      }

      // Fallback: just reload
      setProgress(100)
      setStatusText('Done! Refreshing...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (e: any) {
      setError(e.message || 'Initialization failed')
      setInitializing(false)
    }
  }

  // ── Empty State (not initialized) ──
  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.initOverlay}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>ToonGine Agent Dashboard</h1>
          <p style={{ color: colors.muted, fontSize: 14, maxWidth: 480, lineHeight: 1.6 }}>
            Initialize ToonGine to unlock AI agent intelligence — knowledge graph,
            TOON compression, token burn tracking, agent memory health, and more.
          </p>
          {error && (
            <div style={{ marginTop: 12, padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: colors.red, fontSize: 13 }}>
              {error}
            </div>
          )}
          <button
            onClick={handleInit}
            disabled={initializing}
            style={{ ...styles.initBtn, ...(initializing ? styles.initBtnDisabled : {}) }}
          >
            {initializing ? 'Initializing...' : '🚀 Initialize ToonGine'}
          </button>
          {initializing && (
            <div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: progress + '%' }} />
              </div>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>{statusText}</div>
            </div>
          )}
          <div style={{ marginTop: 32, fontSize: 11, color: colors.muted }}>
            Installed via ToonGine npm package · Runs locally · Zero config
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard (initialized) ──
  const { summary, memories, graph, plugins, efficiency, errors: errs } = data
  const fmt = (n: number) => n?.toLocaleString?.() ?? '0'
  const kb = (b: number) => (b / 1024).toFixed(1)

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={styles.header}>
          <h1 style={styles.title}>⚡ ToonGine Agent Dashboard</h1>
          <div style={styles.subtitle}>{summary?.repo || 'Local Project'} · auto-refresh 5s</div>
        </div>

        {/* KPI Row */}
        <div style={styles.kpiRow}>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.purple}}>{summary?.agentMemories ?? 0}</div><div style={styles.kpiLbl}>Agent Memories</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.green}}>{summary?.completionRate ?? 0}%</div><div style={styles.kpiLbl}>Completion</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.accent}}>{fmt(summary?.graphNodes)}</div><div style={styles.kpiLbl}>Graph Nodes</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.yellow}}>{summary?.skillsTotal ?? 0}</div><div style={styles.kpiLbl}>Skills</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.purple}}>{plugins?.length ?? 0}</div><div style={styles.kpiLbl}>Plugins</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.accent}}>{fmt(summary?.sessions)}</div><div style={styles.kpiLbl}>Sessions</div></div>
        </div>

        {/* Memory + Graph */}
        <div style={styles.section}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>🧠 Agent Memory Health</div>
            {(memories || []).slice(0, 8).map((m: any, i: number) => {
              const pct = m.health || 0
              const bc = pct >= 90 ? colors.green : pct >= 70 ? colors.yellow : colors.red
              return (
                <div key={i} style={styles.memRow}>
                  <span style={{ width: 90, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.agent}</span>
                  <span style={{ fontSize: 10, color: colors.muted, width: 45 }}>{m.dept}</span>
                  <div style={styles.barWrap}><div style={{ width: pct + '%', height: '100%', background: bc, borderRadius: 3 }} /></div>
                  <span style={{ width: 35, textAlign: 'right', fontFamily: 'monospace', fontSize: 10, color: colors.muted }}>{kb(m.size)}K</span>
                  <span style={{ width: 30, textAlign: 'right', fontWeight: 600, fontSize: 11, color: bc }}>{pct}%</span>
                </div>
              )
            })}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelTitle}>🔗 Knowledge Graph</div>
            <div style={styles.grid}>
              <div style={styles.gridItem}><div style={{ fontSize: 20, fontWeight: 700, color: colors.purple }}>{fmt(graph?.nodes)}</div><div style={{ fontSize: 9, color: colors.muted }}>NODES</div></div>
              <div style={styles.gridItem}><div style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{fmt(graph?.edges)}</div><div style={{ fontSize: 9, color: colors.muted }}>EDGES</div></div>
              <div style={styles.gridItem}><div style={{ fontSize: 20, fontWeight: 700, color: colors.green }}>{graph?.density ?? '—'}</div><div style={{ fontSize: 9, color: colors.muted }}>DENSITY</div></div>
              {(graph?.kinds || []).slice(0, 6).map((k: any, i: number) => (
                <div key={i} style={styles.gridItem}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(k.count)}</div>
                  <div style={{ fontSize: 9, color: colors.muted }}>{k.kind}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plugins + Efficiency */}
        <div style={styles.section}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>🔌 Plugins</div>
            {(plugins || []).map((p: any, i: number) => {
              const dc = p.status === 'ok' ? colors.green : p.status === 'warn' ? colors.yellow : colors.red
              return (
                <div key={i} style={styles.plugRow}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: dc }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: colors.muted, fontFamily: 'monospace' }}>{p.detail}</span>
                </div>
              )
            })}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelTitle}>⚡ Efficiency</div>
            {(efficiency || []).slice(0, 6).map((a: any, i: number) => {
              const rate = a.successRate || 0
              const bc = rate >= 80 ? colors.green : rate >= 50 ? colors.yellow : colors.red
              return (
                <div key={i} style={styles.memRow}>
                  <span style={{ width: 80, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.agent}</span>
                  <span style={{ fontSize: 10, color: colors.muted }}>{a.tasks}t</span>
                  <div style={styles.barWrap}><div style={{ width: rate + '%', height: '100%', background: bc, borderRadius: 3 }} /></div>
                  <span style={{ width: 35, textAlign: 'right', fontWeight: 600, fontSize: 11, color: bc }}>{rate}%</span>
                  <span style={{ width: 45, textAlign: 'right', fontFamily: 'monospace', fontSize: 10, color: colors.muted }}>\${a.cost}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Errors */}
        <div style={styles.section}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>⚠️ Error Report</div>
            {(errs || []).length > 0 ? (errs || []).map((e: any, i: number) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.severity === 'critical' ? colors.red : colors.yellow }} />
                  <span style={{ fontWeight: 600 }}>{e.title}</span>
                </div>
                <div style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>{e.detail}</div>
              </div>
            )) : <div style={{ color: colors.green, fontSize: 12 }}>✅ No errors detected</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
`

const REACT_AGENT_TEMPLATE = NEXTJS_AGENT_TEMPLATE.replace(/export default function ToonGinePage/, 'export default function ToonGine')

const STANDALONE_AGENT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ToonGine Agent Dashboard</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0e17;color:#e4e8f0;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .init{text-align:center;max-width:500px;padding:40px}
  .init h1{font-size:2rem;font-weight:800;margin-bottom:8px}
  .init p{color:#5a6478;font-size:.9rem;line-height:1.6;margin-bottom:24px}
  .init button{padding:16px 48px;font-size:1rem;font-weight:700;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;border:none;border-radius:14px;cursor:pointer}
  .init button:disabled{opacity:.5;cursor:not-allowed}
  .progress{margin-top:16px;width:300px;height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden}
  .progress-fill{height:100%;background:linear-gradient(90deg,#8b5cf6,#6366f1);border-radius:3px;transition:width .3s}
  .status{font-size:.75rem;color:#5a6478;margin-top:8px}
</style>
</head>
<body>
<div class="init">
  <div style="font-size:64px">⚡</div>
  <h1>ToonGine Agent Dashboard</h1>
  <p>Initialize ToonGine to unlock AI agent intelligence — knowledge graph, TOON compression, token burn tracking, and more.</p>
  <button id="initBtn" onclick="startInit()">🚀 Initialize ToonGine</button>
  <div class="progress" id="progressBar" style="display:none"><div class="progress-fill" id="progressFill"></div></div>
  <div class="status" id="statusText"></div>
</div>
<script>
async function startInit() {
  const btn = document.getElementById('initBtn')
  btn.disabled = true
  btn.textContent = 'Initializing...'
  document.getElementById('progressBar').style.display = 'block'
  try {
    const res = await fetch('/api/toongine/init', { method: 'POST' })
    if (!res.ok) throw new Error('Init failed')
    const text = await res.text()
    document.getElementById('statusText').textContent = 'Done! Refreshing...'
    setTimeout(() => location.reload(), 1500)
  } catch(e) {
    document.getElementById('statusText').textContent = 'Error: ' + e.message
    btn.disabled = false
    btn.textContent = '🚀 Retry'
  }
}
</script>
</body>
</html>
`
