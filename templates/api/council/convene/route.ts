// app/api/council/convene/route.ts — Council API Endpoint
// POST /api/council/convene — Convene the strategy council
// Spawns real Hermes agents for each council seat, synthesizes decision

import { NextRequest, NextResponse } from 'next/server'
import { spawnHermesAgent, type HermesAgentResult } from '@/lib/hermes-spawn'

interface CouncilRequest {
  topic: string
  context?: string
  research_brief?: string
  urgency?: 'critical' | 'high' | 'routine'
}

interface CouncilPosition {
  agent: string
  role: string
  thesis: string
  recommendation: string
}

interface CouncilDecision {
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  rationale: string
  conditions: string[]
  risks_accepted: string[]
  next_steps: string[]
  positions: CouncilPosition[]
  bias_audit?: string
  total_tokens: number
  duration_ms: number
  mode: 'live' | 'simulated'
}

export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
    const body: CouncilRequest = await request.json()
    const { topic, context = '', research_brief = '', urgency = 'routine' } = body

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    // Check if Hermes is available
    const hermesAvailable = await checkHermesAvailable()

    if (!hermesAvailable) {
      // Fallback: structured simulation
      return NextResponse.json(simulateCouncil(topic, context, research_brief, urgency, start))
    }

    // Council seats
    const seats = [
      {
        agentId: 'yvon/marcus-ceo',
        role: 'CEO',
        prompt: `You are Marcus, CEO of YVON. The council has convened to decide: "${topic}"

Context: ${context || 'None provided'}
Research brief: ${research_brief || 'None provided'}
Urgency: ${urgency}

As CEO, evaluate this decision. Consider:
1. Strategic fit with YVON's vision
2. Long-term impact (3-5 year horizon)
3. Opportunity cost — what would we NOT do?
4. Quality bar — is this good enough?

Respond with EXACTLY this format:
THESIS: [your position in 2-3 sentences]
SCORE: [1-10 rating]
RECOMMENDATION: [PROCEED | DEFER | REJECT]
`,
      },
      {
        agentId: 'yvon/diana-coo',
        role: 'COO',
        prompt: `You are Diana, COO of YVON. The council has convened to decide: "${topic}"

As COO, evaluate operational feasibility. Consider:
1. Team capacity — can we execute this?
2. Timeline — how long would it take?
3. Dependencies — what needs to happen first?
4. Blockers — what could stop us?

Respond with EXACTLY this format:
THESIS: [your position in 2-3 sentences]
SCORE: [1-10 rating — feasibility]
RECOMMENDATION: [PROCEED | DEFER | REJECT]
`,
      },
      {
        agentId: 'yvon/felix-finance',
        role: 'CFO',
        prompt: `You are Felix, CFO of YVON. The council has convened to decide: "${topic}"

As CFO, evaluate financial impact. Consider:
1. Cost — what would this cost in tokens/dollars?
2. ROI timeline — when does it pay back?
3. Runway impact — how does this affect our cash position?
4. Risk-adjusted value — is this worth the capital allocation?

Respond with EXACTLY this format:
THESIS: [your position in 2-3 sentences]
SCORE: [1-10 rating — financial viability]
RECOMMENDATION: [PROCEED | DEFER | REJECT]
`,
      },
      {
        agentId: 'yvon/kai-marketing',
        role: 'CMO',
        prompt: `You are Kai, CMO of YVON. The council has convened to decide: "${topic}"

As CMO, evaluate market timing. Consider:
1. Competitive landscape — what are others doing?
2. Market readiness — is the timing right?
3. Positioning — how does this fit our brand?
4. User impact — how will this affect our users?

Respond with EXACTLY this format:
THESIS: [your position in 2-3 sentences]
SCORE: [1-10 rating — market readiness]
RECOMMENDATION: [PROCEED | DEFER | REJECT]
`,
      },
    ]

    // Phase 1: Gather positions (sequential — 90s per agent)
    const positions: CouncilPosition[] = []
    let totalTokens = 0

    for (const seat of seats) {
      try {
        const result: HermesAgentResult = await spawnHermesAgent({
          agentId: seat.agentId,
          task: seat.prompt,
          workdir: '/root/yvon',
          timeoutMs: 90000,
          maxOutputTokens: 1024,
        })

        // Parse structured response
        const parsed = parsePosition(result.content, seat.agentId, seat.role)
        positions.push(parsed)
        totalTokens += result.content.length
      } catch (err: any) {
        positions.push({
          agent: seat.agentId,
          role: seat.role,
          thesis: `Unable to reach council member: ${err.message}`,
          recommendation: 'ABSTAIN',
        })
      }
    }

    // Phase 2: Synthesize (quick Marcus re-spawn with all positions)
    const synthesisPrompt = `Council positions on: "${topic}"

${positions.map(p => `${p.role} (${p.agent}): ${p.thesis}
Recommendation: ${p.recommendation}`).join('\n\n')}

As Marcus (CEO), synthesize these positions into a single decision. You must decide NOW.
DECISION: [APPROVED | REJECTED | CONDITIONAL]
RATIONALE: [2-3 sentences explaining why]
CONDITIONS: [list specific conditions if CONDITIONAL, otherwise "none"]
RISKS: [risks we are consciously accepting]`

    let synthesis: HermesAgentResult
    try {
      synthesis = await spawnHermesAgent({
        agentId: 'yvon/marcus-ceo',
        task: synthesisPrompt,
        workdir: '/root/yvon',
        timeoutMs: 60000,
        maxOutputTokens: 512,
      })
      totalTokens += synthesis.content.length
    } catch {
      // Fallback synthesis if Marcus can't be reached
      const proCount = positions.filter(p => p.recommendation === 'PROCEED').length
      synthesis = {
        agentId: 'marcus-ceo',
        content: `DECISION: ${proCount >= 2 ? 'CONDITIONAL' : 'REJECTED'}\nRATIONALE: Council showed ${proCount}/4 support. Falling back to automated synthesis.\nCONDITIONS: Full council review required\nRISKS: Automated decision without CEO synthesis`,
        toolCalls: [],
        success: false,
        error: 'Marcus spawn failed — used automated synthesis',
      }
    }

    // Parse synthesis
    const parsedSynthesis = parseDecision(synthesis.content)

    // Phase 3: Kahneman bias audit (only if decision is APPROVED or CONDITIONAL)
    let biasAudit: string | undefined
    if (parsedSynthesis.decision !== 'REJECTED') {
      try {
        const biasResult = await spawnHermesAgent({
          agentId: 'yvon/kahneman-psychology',
          task: `Audit this council decision for cognitive bias:

Decision: ${parsedSynthesis.decision}
Rationale: ${parsedSynthesis.rationale}
Positions: ${positions.map(p => `${p.role}: ${p.thesis}`).join(' | ')}

Check for: anchoring, overconfidence, confirmation bias, loss aversion, framing effects, survivorship bias.
Respond with: BIAS_TYPE: [detected bias] | EXPLANATION: [why] | CORRECTION: [what to adjust]`,
          workdir: '/root/yvon',
          timeoutMs: 60000,
          maxOutputTokens: 512,
        })
        biasAudit = biasResult.content.slice(0, 500)
        totalTokens += biasResult.content.length
      } catch {
        biasAudit = 'Kahneman unavailable for bias audit'
      }
    }

    const decision: CouncilDecision = {
      decision: parsedSynthesis.decision,
      rationale: parsedSynthesis.rationale,
      conditions: parsedSynthesis.conditions,
      risks_accepted: parsedSynthesis.risks,
      next_steps: [
        'Diana: Create sprint plan with milestones',
        'Dev: Architecture assessment if technical',
        'Felix: Cost projection update',
        'Board: Final governance review before execution',
      ],
      positions,
      bias_audit: biasAudit,
      total_tokens: totalTokens,
      duration_ms: Date.now() - start,
      mode: 'live',
    }

    return NextResponse.json(decision)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const hermesAvailable = await checkHermesAvailable()
  return NextResponse.json({
    council: 'YVON Advisory Council',
    members: ['marcus-ceo', 'diana-coo', 'felix-finance', 'kai-marketing'],
    validators: ['kahneman-psychology'],
    governance: 'board-command',
    status: hermesAvailable ? 'live' : 'simulated',
    last_convened: null,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function checkHermesAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process')
    execSync('which hermes', { timeout: 3000 })
    return true
  } catch {
    return false
  }
}

function parsePosition(content: string, agentId: string, role: string): CouncilPosition {
  const thesis = content.match(/THESIS:\s*([\s\S]+?)(?=\n\w+:|\n\n|$)/)
  const recommendation = content.match(/RECOMMENDATION:\s*(PROCEED|DEFER|REJECT)/i)

  return {
    agent: agentId,
    role,
    thesis: thesis?.[1]?.trim() || content.slice(0, 200),
    recommendation: recommendation?.[1]?.toUpperCase() || 'ABSTAIN',
  }
}

function parseDecision(content: string): {
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  rationale: string
  conditions: string[]
  risks: string[]
} {
  const decisionMatch = content.match(/DECISION:\s*(APPROVED|REJECTED|CONDITIONAL)/i)
  const rationaleMatch = content.match(/RATIONALE:\s*([\s\S]+?)(?=\n\w+:|\n\n|$)/)
  const conditionsMatch = content.match(/CONDITIONS:\s*([\s\S]+?)(?=\n\w+:|\n\n|$)/)
  const risksMatch = content.match(/RISKS:\s*([\s\S]+?)(?=\n\w+:|\n\n|$)/)

  return {
    decision: (decisionMatch?.[1]?.toUpperCase() || 'CONDITIONAL') as 'APPROVED' | 'REJECTED' | 'CONDITIONAL',
    rationale: rationaleMatch?.[1]?.trim() || 'Council synthesis produced no clear rationale.',
    conditions: conditionsMatch?.[1]
      ? conditionsMatch[1].split(/[,;]/).map(c => c.trim()).filter(c => c && c !== 'none')
      : [],
    risks: risksMatch?.[1]
      ? risksMatch[1].split(/[,;]/).map(r => r.trim()).filter(r => r && r !== 'none')
      : ['Automated synthesis — risks not explicitly enumerated'],
  }
}

// Fallback simulation when Hermes is not available
function simulateCouncil(
  topic: string,
  context: string,
  researchBrief: string,
  urgency: string,
  start: number,
): CouncilDecision {
  const roles = ['CEO', 'COO', 'CFO', 'CMO']
  const agents = ['marcus-ceo', 'diana-coo', 'felix-finance', 'kai-marketing']

  const positions: CouncilPosition[] = roles.map((role, i) => ({
    agent: agents[i],
    role,
    thesis: `${role} analysis of "${topic.slice(0, 80)}" — simulation mode. Hermes agent runtime not available.`,
    recommendation: 'ABSTAIN',
  }))

  return {
    decision: 'CONDITIONAL',
    rationale: `Council simulation for "${topic}". Real agent spawning unavailable — Hermes runtime not detected. Deploy YVON on a VPS with Hermes installed for live council debates.`,
    conditions: ['Deploy with Hermes Agent installed', 'Verify hermes CLI is in PATH', 'Re-run council with --live flag'],
    risks_accepted: ['Decision made without live agent input'],
    next_steps: ['Install Hermes Agent', 'Re-convene council'],
    positions,
    total_tokens: 0,
    duration_ms: Date.now() - start,
    mode: 'simulated',
  }
}
