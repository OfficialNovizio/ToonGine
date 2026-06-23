# CAOS — Cognitive Agent Operating System

> Deep research design document for competing with Anthropic Claude Fable 5
> Architecture by Marcus (CEO) · June 2026 · ToonGine v1.7.1+

---

## 1. Background — What Makes Fable 5 Different

Anthropic's Fable 5 (released June 9, 2026, pulled June 12) introduced a new tier: **Mythos-level** — above Opus. Its key differentiators:

| Fable 5 Capability | Mechanism |
|---|---|
| Multi-day autonomous sessions | Internal planning loop + state persistence |
| Planning across stages | Hierarchical task decomposition |
| Delegating to sub-agents | Orchestration layer with worker spawning |
| Self-verification | Writes tests, uses vision, checks outputs |
| "Killing incorrect beliefs" | Confidence-weighted belief graph with decay |
| Emergent efficiency | Minimal friction between reasoning steps |
| Senior research scientist grade | Resource-aware direction picking |

We cannot match Fable 5's raw model quality (DeepSeek/Claude vs their proprietary Mythos weights). But we **can** match its architecture — and architecture is ~70% of the capability. Fable 5's secret is not just the model weights; it's the cognitive pipeline wrapping them.

---

## 2. Cognitive Model — Human Brain-Inspired Architecture

The human brain achieves multi-day autonomous work through specialized regions communicating via a global workspace. We mirror this:

```
BRAIN                         →  CAOS (ToonGine + Hermes)
─────────────────────────────────────────────────────────────
Prefrontal Cortex             →  Marcus (CEO) — planning, executive function
  - Working memory            →  .toon/state/active_plan.json
  - Goal representation       →  Task DAG with success criteria

Anterior Cingulate Cortex     →  Kahneman + Quinn — error detection, conflict
  - Error monitoring          →  Confidence decay, anomaly detection
  - Belief updating           →  P(hypothesis | evidence) recalculation

Basal Ganglia                 →  Diana (COO) — action selection, routing
  - Action gating             →  Priority scheduler, resource allocator
  - Habit learning            →  Reusable plan templates in .toon/plans/

Hippocampus                   →  .toon/state/ — memory consolidation
  - Episodic memory           →  Session checkpoints
  - Pattern completion        →  Plan template retrieval
  - Pattern separation        →  Delta detection between plan versions

Default Mode Network          →  Reflection Loop — self-evaluation
  - Self-reflection           →  Kahneman's after-action reviews
  - Mental time travel        →  Plan simulation (dry-run before execution)
  - Theory of mind            →  Agent intention modeling

Global Workspace              →  MCP tools + shared context
  - Consciousness             →  Active task broadcast to all agents
  - Attention                 →  Context prioritization (stratified injection)

Specialized Cortices          →  Department agents (10 departments)
  - Parallel processing       →  delegate_task(max_concurrent=3)
  - Domain expertise          →  Agent-specific MEMORY.md + toolsets
```

### Key Principle: Predictive Processing

The brain doesn't passively process — it **predicts** and then corrects prediction errors. CAOS mirrors this:

1. **Predict**: Marcus predicts what the solution looks like
2. **Execute**: Agents generate output based on prediction
3. **Compare**: Quinn compares output to prediction
4. **Update**: Kahneman identifies where predictions were wrong
5. **Repeat**: Marcus updates the plan, re-predicts

This is the same loop Fable 5 uses — it's what "killing incorrect beliefs" means.

---

## 3. System Architecture

```
                         ┌──────────────────────┐
                         │   User gives task     │
                         └──────────┬───────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────┐
│                   MARCUS — Executive Function                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 1. Load project graph (MCP: toon_graph_explore)         │  │
│  │ 2. Generate Task DAG (topological decomposition)        │  │
│  │ 3. Define success criteria per node                     │  │
│  │ 4. Write plan → .toon/plans/{uuid}/PLAN.md              │  │
│  │ 5. Predict expected outputs (Belief Graph)              │  │
│  │ 6. Hand off to Diana                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────────┘
                           │ delegate_task
                           ▼
┌───────────────────────────────────────────────────────────────┐
│                   DIANA — Action Selection                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 1. Parse Task DAG                                       │  │
│  │ 2. Topological sort → execution order                   │  │
│  │ 3. Critical Path Method → identify bottlenecks          │  │
│  │ 4. Spawn parallel workers (max 3)                       │  │
│  │ 5. Monitor completion, handle failures                  │  │
│  │ 6. Aggregate results                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────┬──────────────┬──────────────┬──────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ DEV Lead │   │ RAJ Back │   │ MIA Front│  ← 3 parallel workers
│ (coding) │   │ (API/DB) │   │ (UI/CSS) │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │ results
                    ▼
┌───────────────────────────────────────────────────────────────┐
│              KAHNEMAN + QUINN — Verification Layer             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ QUINN: Run tests, check types, lint, build              │  │
│  │ KAHNEMAN: Detect cognitive biases, framing errors       │  │
│  │ Compute: confidence score = P(correct | evidence)       │  │
│  │ Flag low-confidence nodes for re-work                    │  │
│  │ "Kill incorrect beliefs" if confidence < threshold       │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
               PASS ▼         FAIL ▼
          ┌──────────┐   ┌──────────┐
          │ MARCUS   │   │ MARCUS   │
          │ Final    │   │ Re-plan  │
          │ Synthesis│   │ Re-deleg │
          └──────────┘   └──────────┘
```

---

## 4. Core Algorithms

### 4.1 Task DAG Decomposition

**Goal**: Convert natural language task → executable dependency graph.

```
Input:  "Build auth system with login, signup, password reset"
Output: DAG = {
  nodes: [
    {id: 1, task: "Database schema", agent: "raj", deps: []},
    {id: 2, task: "API routes", agent: "raj", deps: [1]},
    {id: 3, task: "Login UI", agent: "mia", deps: [2]},
    {id: 4, task: "Signup UI", agent: "mia", deps: [2]},
    {id: 5, task: "Password reset", agent: "dev", deps: [1]},
    {id: 6, task: "Integration tests", agent: "quinn", deps: [3,4,5]},
  ],
  edges: [(1→2), (2→3), (2→4), (1→5), (3→6), (4→6), (5→6)]
}
```

**Algorithm**: `TaskDecomposer`

```python
def decompose(task: str, graph_context: dict) -> TaskDAG:
    # 1. Marcus analyzes task against project graph
    sub_tasks = marcus_analyze(task, graph_context)
    
    # 2. Assign each sub-task to best-fit agent
    for st in sub_tasks:
        st.agent = classify_task(st)  # → dev | raj | mia | other
    
    # 3. Infer dependencies
    # If task B references output of task A → A depends_on B
    dag = build_dependency_graph(sub_tasks)
    
    # 4. Detect cycles → topological sort to validate
    if has_cycle(dag):
        dag = resolve_cycles(dag)  # break cycles at weakest link
    
    # 5. Compute critical path
    dag.critical_path = compute_critical_path(dag)
    
    return dag
```

### 4.2 Belief Propagation & Confidence

**Goal**: Every agent assertion carries a confidence score. Low confidence triggers re-verification. "Killing incorrect beliefs" = detecting when confidence decays below threshold.

```
Belief = {
    hypothesis: str,        # "The login API handles rate limiting correctly"
    confidence: float,      # 0.0 — 1.0
    evidence: [str],        # supporting evidence
    contradictions: [str],  # contradictory evidence
    source_agent: str,      # who asserted this
    timestamp: int,         # when asserted
    decay_rate: float,      # confidence decay per hour
}
```

**Confidence Update Rule** (Bayesian):

```
P(H|E) = P(E|H) × P(H) / P(E)

Where:
  P(H)     = prior confidence
  P(E|H)   = likelihood (1.0 if evidence consistent, 0.3 if contradictory)
  P(E)     = marginal likelihood
  
After Quinn verifies:
  new_confidence = bayesian_update(
      prior=belief.confidence,
      evidence_likelihood=quinn_pass ? 1.0 : 0.3
  )
```

**Decay Function**:

```
confidence(t) = confidence(0) × e^(-decay_rate × t)

If confidence < THRESHOLD_KILL (0.3): "kill belief" → re-delegate
If confidence < THRESHOLD_WARN (0.6): flag for Kahneman review
```

### 4.3 Convergence Detection

**Goal**: Know when work is "done enough" to stop iterating.

```
Convergence metrics:
  1. Belief Entropy:    H = -Σ p(i) × log(p(i))
     → Low entropy = high certainty = nearing convergence
     
  2. Plan Delta:        Δ = Levenshtein(plan_t, plan_{t-1}) / |plan|
     → Small delta = plan stabilizing
     
  3. Pass Rate:         ρ = quinn_passed / quinn_total
     → ρ > 0.95 for 2 consecutive rounds = converged
     
  4. Time Budget:       Stop if elapsed > max_time
     → Fable 5's "days" = high time budget, not infinite
```

### 4.4 Priority Scheduling (Critical Path Method)

**Goal**: Maximize parallel throughput given max 3 concurrent agents.

```python
def schedule(dag: TaskDAG, max_parallel: int = 3) -> list[Round]:
    # 1. Topological sort
    order = topological_sort(dag)
    
    # 2. Assign rounds — earliest possible round per node
    rounds = []
    for node in order:
        ready_round = max(
            [r for dep in node.deps for r in rounds if dep in r.nodes] + [0]
        )
        # Find or create round
        round = find_available_round(rounds, ready_round, max_parallel)
        round.nodes.append(node)
    
    return rounds
```

### 4.5 Self-Verification Pipeline

```
For each agent output:
  1. QUINN: Syntax check (compile/lint)
  2. QUINN: Test execution (run test suite)
  3. QUINN: Type check (tsc --noEmit)
  4. KAHNEMAN: Cognitive bias detection
     - Anchoring? Confirmation bias? Overconfidence?
  5. Compare output to success criteria (from plan)
  6. Compute confidence score
  7. If PASS → mark complete, propagate confidence
  8. If FAIL → flag for Marcus re-delegation
```

---

## 5. Data Structures

### 5.1 Plan Format (`.toon/plans/{uuid}/PLAN.md`)

```yaml
---
id: "plan-abc123"
task: "Build auth system"
status: in_progress | completed | failed | killed
created: 2026-06-21T10:00:00Z
time_budget: 48h
agents_assigned: [marcus, diana, dev, raj, mia, quinn]
dag:
  nodes:
    - {id: 1, task: "Schema", agent: raj, deps: [], status: completed}
    - {id: 2, task: "API", agent: raj, deps: [1], status: in_progress}
    - {id: 3, task: "UI", agent: mia, deps: [2], status: pending}
  edges: [[1,2], [2,3]]
beliefs:
  - {hypothesis: "Auth flow secure", confidence: 0.72, agent: quinn}
  - {hypothesis: "Rate limiting works", confidence: 0.45, agent: kahneman, flagged: true}
checkpoints:
  - {at: "2026-06-21T14:00:00Z", version: 3, delta: "2 nodes completed"}
```

### 5.2 Belief Graph (`.toon/state/beliefs.json`)

```json
{
  "beliefs": [
    {
      "id": "b-001",
      "hypothesis": "Login endpoint handles invalid credentials",
      "confidence": 0.87,
      "evidence": ["test_login_invalid.py passes", "manual review OK"],
      "contradictions": [],
      "source": "quinn",
      "timestamp": 1718964000,
      "decay_rate": 0.05,
      "dependencies": ["b-000", "b-002"],
      "status": "alive"
    }
  ],
  "thresholds": {
    "kill": 0.30,
    "warn": 0.60,
    "confident": 0.85
  }
}
```

### 5.3 Agent State Vector (`.toon/state/agent_state.json`)

```json
{
  "marcus": {
    "active_plan": "plan-abc123",
    "current_phase": "verification",
    "cognitive_load": 0.65,
    "last_reflection": "2026-06-21T15:00:00Z"
  },
  "diana": {
    "active_rounds": 2,
    "pending_tasks": 5,
    "failed_tasks": 0,
    "efficiency": 0.88
  }
}
```

### 5.4 Checkpoint Tree (`.toon/state/checkpoints/`)

```
.toon/state/checkpoints/
  plan-abc123/
    v1__2026-06-21T10:00:00Z.json   # Initial plan
    v2__2026-06-21T12:00:00Z.json   # After schema complete
    v3__2026-06-21T14:00:00Z.json   # After API routes built
    v4__2026-06-21T16:00:00Z.json   # Current state
```

Each checkpoint is a full snapshot. Rollback = restore earlier version. Delta compression applied between versions.

---

## 6. Agent Pipeline — CAOS Runtime

### The Main Loop

```python
def caos_run(task: str) -> PlanResult:
    # BOOTSTRAP
    marcus = load_agent("marcus")
    graph = mcp_query("toon_graph_explore", task)
    
    # PHASE 1: Plan
    plan = marcus.plan(task, graph)
    plan.write(".toon/plans/{plan.id}/PLAN.md")
    checkpoint(plan, version=1)
    
    while not converged(plan) and not time_exceeded(plan):
        # PHASE 2: Orchestrate
        diana = load_agent("diana")
        rounds = diana.schedule(plan.dag, max_parallel=3)
        
        for round in rounds:
            # PHASE 3: Execute (parallel)
            results = delegate_tasks(round.nodes)  # up to 3 parallel
            
            # PHASE 4: Verify
            for result, node in zip(results, round.nodes):
                quinn_verdict = quinn.verify(result)
                kahneman_verdict = kahneman.audit(result)
                
                confidence = belief_update(
                    prior=plan.beliefs[node.id].confidence,
                    evidence=quinn_verdict.pass_rate
                )
                
                if confidence < KILL_THRESHOLD:
                    # "KILL INCORRECT BELIEF"
                    plan = marcus.replan(node, result.errors)
                    checkpoint(plan, version=plan.version + 1)
                    break  # restart with new plan
                
                plan.beliefs[node.id].confidence = confidence
                node.status = "completed" if confidence > CONFIDENT_THRESHOLD else "needs_review"
        
        # PHASE 5: Reflect
        delta = compute_delta(plan)
        if delta < CONVERGENCE_THRESHOLD and plan.pass_rate > 0.95:
            plan.status = "converged"
        
        checkpoint(plan, version=plan.version + 1)
        cron_check("30m")  # schedule next checkpoint
    
    # PHASE 6: Final Synthesis
    return marcus.synthesize(plan)
```

---

## 7. Features — What Makes CAOS Different

### 7.1 "Killing Incorrect Beliefs" (KIB)

Fable 5's signature capability. Our implementation:

```
1. Every agent output generates Belief entries
2. Belief confidence decays over time (Bayesian decay)
3. Kahneman + Quinn periodically audit beliefs
4. If confidence < 0.30 → Belief.status = "killed"
5. Marcus re-plans the affected sub-tree
6. Killed beliefs become negative training data (prevent repeats)
```

This mirrors how the human ACC (anterior cingulate cortex) detects errors and triggers belief updating.

### 7.2 Emergent Efficiency

Fable 5's "low friction" comes from **context reuse**. CAOS replicates this:

```
- MCP tools cache graph queries (no repeated analysis)
- Agent context is stratified (stat header + relevant nodes + delta)
- Plan templates are reusable (learn from past plans)
- Shared .toon/state/ eliminates context re-injection
- Confidence scores prevent unnecessary re-work
```

### 7.3 Multi-Day Persistence

```
- Cron checkpoints every 30 min → .toon/state/checkpoints/
- Session can be interrupted, resumed from latest checkpoint
- Agent state vectors track cognitive load (prevent burnout loops)
- Time budget enforcement prevents infinite loops
```

### 7.4 Resource-Aware Planning

Fable 5 "allocates resources." CAOS does the same:

```
- Diana's scheduler respects max_parallel=3
- Cognitive load tracking per agent
- Task priority based on critical path
- Time estimation from past similar tasks (template learning)
```

### 7.5 Self-Reflection (Kahneman Layer)

Every N iterations, Kahneman audits the entire plan:

```
1. Are we anchoring on first solution?
2. Confirmation bias — only seeking supporting evidence?
3. Overconfidence — all beliefs > 0.9 with weak evidence?
4. Sunk cost — continuing a failing approach?
5. Framing — task framed too narrowly?
```

---

## 8. Implementation Plan

### Phase 1 — Core Runtime (Week 1)

- [ ] Create `.toon/hermes/caos/` directory
- [ ] Build `orchestrator.py` — Marcus planning + Diana scheduling
- [ ] Build `verifier.py` — Quinn test runner + Kahneman bias audit
- [ ] Build `state_manager.py` — checkpoint/rollback persistence
- [ ] Define Plan and Belief data structures

### Phase 2 — Algorithms (Week 2)

- [ ] TaskDAG — decomposition + topological sort
- [ ] BeliefPropagation — Bayesian confidence updates
- [ ] ConvergenceDetector — entropy + delta + pass rate
- [ ] PriorityScheduler — critical path with parallel constraint

### Phase 3 — Integration (Week 3)

- [ ] Wire into `npx toongine run` command
- [ ] Wire into `npx toongine watch` for auto-trigger
- [ ] Cron checkpoint integration
- [ ] Dashboard tab: Plan Monitor (live DAG viz)

### Phase 4 — Hardening (Week 4)

- [ ] Template learning from past plans
- [ ] Cognitive load detection + auto-rest
- [ ] Multi-venture plan routing
- [ ] Benchmark: YVON-OS feature implementation end-to-end

---

## 9. Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| Task completion rate | >90% | Plans with status "converged" |
| Self-correction rate | >30% | % of beliefs killed and re-planned |
| Parallel utilization | >80% | Rounds with 3/3 agents active |
| Verification pass rate | >85% | Quinn pass ratio |
| Time efficiency | <2x estimate | Actual vs predicted duration |
| Cognitive bias flags | >1 per plan | Kahneman audit findings |
| Strike rate | <5% | Agent mistakes that repeated |
| Challenge resolution | >80% | Challenges that improved output |

---

## 10. The Opposition Layer — Adversarial Governance

> "If an agent makes the same mistake again, the Council threatens them so they can't make it again."

This is what makes CAOS feel like a **real organization**, not a script. Human teams have: disagreements, pushback, accountability, reputation, consequences. So do our agents.

### 10.1 Architecture — 5 Opposition Vectors

```
                    ┌──────────────────┐
                    │  ADVISORY COUNCIL │  ← Ultimate authority
                    │  Board + Marcus   │
                    │  + Diana + Felix  │
                    │  + Kahneman       │
                    └────────┬─────────┘
                             │ threatens, overrides, demotes
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  DEPARTMENT  │ │  DEPARTMENT  │ │  DEPARTMENT  │
    │  Technical   │◄├─┤  Marketing   │◄├─┤  Finance     │
    │  (Dev,Raj,   │ │ │  (Kai,Lena, │ │ │  (Felix)     │
    │   Mia,Quinn) │ │ │   Rio,Nate) │ │ │              │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           │   cross-dept   │   cross-dept   │
           │   CHALLENGE    │   CHALLENGE    │
           └────────────────┼────────────────┘
                            │
                    ┌───────┴───────┐
                    │  SELF-COUNTER │  ← Every agent
                    │  (extended    │     runs internal
                    │   thinking)   │     self-critique
                    └───────────────┘
                            │
                    ┌───────┴───────┐
                    │  COUNTER-USER │  ← Agents can
                    │  PROTOCOL     │     push back on
                    │               │     user requests
                    └───────────────┘
```

### 10.2 Vector 1: Self-Counter — Extended Thinking

Every agent runs **two passes** before outputting anything:

**Pass 1 — Generate**: Produce the solution, answer, or code.

**Pass 2 — Self-Counter**: The agent switches roles and attacks its own output.
- "What am I missing?"
- "Where could this fail?"
- "What assumptions did I make?"
- "If I were my worst critic, what would I say?"
- "Did I make this same mistake before?" (checks strike history)

```python
def self_counter(agent_output: str, agent_name: str, strike_history: list) -> CounterResult:
    """Agent critiques its own output before submitting."""
    
    counter_prompt = f"""
    You are {agent_name} in SELF-COUNTER mode.
    Attack your own output below. Find every flaw, assumption, and risk.
    
    YOUR OUTPUT:
    {agent_output}
    
    YOUR PAST MISTAKES (do not repeat):
    {strike_history[-5:]}
    
    CRITIQUE:
    1. Missing edge cases?
    2. Wrong assumptions?
    3. Repeated past mistakes?
    4. Simpler alternative?
    5. What would Quinn/Kahneman flag?
    """
    
    critique = agent_think(counter_prompt, extended_thinking=True)
    return CounterResult(
        original=agent_output,
        critique=critique,
        confidence=estimate_confidence(critique),
        revised=merge_with_critique(agent_output, critique) if critique.has_flaws else agent_output,
    )
```

### 10.3 Vector 2: Counter-User Protocol

Agents can **formally challenge** user requests. Not every time — only when:

| Trigger | Example |
|---|---|
| Security risk | "Deploy without auth checks" |
| Contradicts constitution | "Skip testing this time" |
| Repeats a known mistake | User asks for same broken pattern |
| Violates department policy | Marketing overrides legal compliance |
| Architecturally unsound | "Add this as a global variable" |

**Protocol:**

```
User Request → Agent evaluates
                    │
            ┌───────┴───────┐
            │ SAFE?         │
            └───────┬───────┘
        ┌───────────┴───────────┐
        ▼                       ▼
     YES                      NO
     Execute                  COUNTER-USER
        │                         │
        ▼                         ▼
    Deliver               ┌──────────────┐
                          │ Formal        │
                          │ Challenge     │
                          │ • Reason      │
                          │ • Evidence    │
                          │ • Alternative │
                          └──────┬───────┘
                                 │
                          ┌──────┴──────┐
                          │ USER        │
                          │ OVERRIDE?   │
                          └──────┬──────┘
                      ┌──────────┴──────────┐
                      ▼                     ▼
                   YES (force)           NO (accept)
                   Agent complies        Agent's alternative
                   but LOGS override     is used
                   → Council reviews
```

If user overrides and the result fails → Council flags the user. If user overrides and succeeds → agent learns, updates its threshold.

### 10.4 Vector 3: Cross-Department Challenge

Departments audit each other. This creates **adversarial quality control**.

```
Technical → challenges → Marketing
  "Your A/B test has no control group"
  "That copy makes claims the product can't deliver"

Marketing → challenges → Technical  
  "You're over-engineering — ship v1 faster"
  "Users don't care about that edge case"

Finance → challenges → Marketing
  "ROAS projection is unrealistic — show your math"

Legal → challenges → Everyone
  "That data collection needs consent disclosure"

Psychology (Kahneman) → challenges → Everyone
  "You're all anchored on last week's numbers"
```

**Challenge Protocol:**

```
1. Challenger files formal Challenge → .toon/challenges/{id}.md
   - What is wrong?
   - Evidence
   - Proposed fix
   
2. Challenged agent has 1 response cycle
   - Accept → implement fix
   - Reject → provide counter-evidence
   
3. If unresolved → escalates to Advisory Council
   - Council votes (Marcus, Diana, Felix, Kahneman, Board)
   - 3/5 majority required to override
   
4. Resolution recorded → .toon/challenges/resolved/
   - Feeds into agent training (don't repeat)
```

### 10.5 Vector 4: Advisory Council — The Threat System

The Council has real power. It's not advisory — it's **governance**.

**Council Members:**

| Seat | Agent | Power |
|---|---|---|
| CEO | Marcus | Tiebreaker, strategic override |
| COO | Diana | Process override, resource reallocation |
| Finance | Felix | Budget veto |
| Psychology | Kahneman | Bias veto (can block any decision on cognitive grounds) |
| Board | Board | Constitutional veto |

**Council Powers:**

1. **Threaten** — formal warning with consequences
2. **Demote** — reduce agent's confidence multiplier (0.5×)
3. **Suspend** — remove agent from active rotation for N hours
4. **Override** — reverse agent's decision
5. **Escalate** — bring issue to user with formal recommendation
6. **Constitutional Amendment** — change CAOS operating rules

### 10.6 Vector 5: Strike System — Consequences for Repeated Mistakes

The strike system makes agents **accountable**. Like a real workplace.

```
Strike = {
    agent: str,
    mistake_type: str,       # "hallucination", "security_gap", "repeated_bug"
    context_hash: str,        # SHA of the context (detect repeats)
    severity: 1-5,
    timestamp: float,
    issued_by: str,           # which agent/council detected it
    resolution: str,          # what was fixed
    repeat_count: int,        # how many times same context
}
```

**Escalation Path:**

```
Strike 1: Warning → agent notified, no penalty
Strike 2 (same context): Penalty → confidence multiplier 0.8×
Strike 3 (same context): Council review → agent must explain
Strike 4 (same context): Demotion → 0.5× confidence, restricted tools
Strike 5 (same context): Suspension → agent removed, replacement spawned
```

**"The Council threatens them":**

When an agent hits Strike 3, the Council sends a formal threat:

```
FROM: Advisory Council
TO: Dev-Lead
RE: THREAT — Strike 3: repeated security gap in auth middleware

Dev-Lead, you have made the SAME mistake in auth middleware 3 times:
  - Strike 1: 2026-06-15 — missing CSRF token validation
  - Strike 2: 2026-06-18 — same issue, different endpoint
  - Strike 3: 2026-06-21 — same issue, third occurrence

This is now a PATTERN. The Council rules:
  1. Your confidence multiplier is reduced to 0.5× for auth-related tasks
  2. All your auth code must pass Quinn + Kahneman review before merge
  3. Next occurrence = SUSPENSION and replacement by Raj

You have 1 response cycle to explain why this should not happen.
```

### 10.7 Full Agent Workflow — With Opposition

Every agent task now flows through the full opposition pipeline:

```
TASK ASSIGNED
      │
      ▼
┌─────────────────┐
│ PASS 1: GENERATE │  Agent produces output
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PASS 2: SELF-    │  Agent attacks own output
│ COUNTER          │  (extended thinking)
└────────┬────────┘
         │
    ┌────┴────┐
    │ COUNCIL │  Checks strike history
    │  CHECK  │  "Has this agent made this mistake before?"
    └────┬────┘
         │
    ┌────┴────┐
    │ CROSS-  │  Other departments can challenge
    │ DEPT    │  (async — within 5 min window)
    │ AUDIT   │
    └────┬────┘
         │
    ┌────┴────┐
    │ QUINN   │  Technical verification
    │ VERIFY  │
    └────┬────┘
         │
    ┌────┴────┐
    │KAHNEMAN │  Cognitive bias audit
    │ AUDIT   │
    └────┬────┘
         │
    ┌────┴────┐
    │ COUNCIL │  Final approval or rejection
    │ DECIDE  │
    └────┬────┘
         │
    ┌────┴────────────────┐
    ▼                     ▼
APPROVED              REJECTED
Deliver to user       → Strike issued
                      → Re-delegate
                      → Agent learns
```

### 10.8 Learning From Strikes

Strikes aren't just punishment — they're **training data**:

```python
def learn_from_strike(strike: Strike, agent_memory: dict):
    """When agent gets a strike, update its memory to prevent repeats."""
    
    # 1. Record the mistake pattern
    agent_memory["mistakes"].append({
        "context_hash": strike.context_hash,
        "type": strike.mistake_type,
        "resolution": strike.resolution,
    })
    
    # 2. Update confidence calibration
    # Agent that gets strikes should become LESS confident
    agent_memory["confidence_calibration"] -= 0.05
    
    # 3. Create a "negative template" — what NOT to do
    negative_template = f"""
    MISTAKE PATTERN (DO NOT REPEAT):
    Type: {strike.mistake_type}
    Context: {strike.context_hash}
    Resolution: {strike.resolution}
    """
    agent_memory["negative_examples"].append(negative_template)
    
    # 4. If 3+ strikes of same type → escalate to Council
    if strike.repeat_count >= 3:
        council_threaten(strike.agent, strike)
```

### 10.9 The Constitution — What Agents Cannot Do

The Council enforces a **constitution** (already in `.toon/docs/CONSTITUTION.toon`). Key rules that trigger counter-user or council override:

```
1. Never ship without Quinn verification
2. Never override a Kahneman bias flag without Council vote
3. Never repeat the same mistake 3 times (auto-suspension)
4. Never deploy to production without Felix budget approval
5. Never ignore a cross-department challenge without responding
6. Never make security changes without Legal review
7. Never bypass the self-counter pass
8. The user CAN override any rule — but the override is logged and reviewed
```

---

## 11. Updated Implementation Phases

### Phase 5 — Opposition Layer (Week 5)

- [ ] Build `self_counter.py` — extended thinking pass for all agents
- [ ] Build `challenge_protocol.py` — cross-department challenge system
- [ ] Build `council.py` — Advisory Council governance engine
- [ ] Build `strike_system.py` — strike tracking + escalation
- [ ] Build `counter_user.py` — formal user pushback protocol
- [ ] Wire opposition layer into CAOS pipeline
- [ ] Create `.toon/challenges/` and `.toon/strikes/` directories

---

## 12. Deep Research: How Top AI Companies Build Their Systems

### 12.1 Industry Algorithm Usage

| Algorithm | Company | Used For | CAOS Implementation |
|---|---|---|---|
| **Beam Search** | OpenAI, Anthropic | Task planning, chain-of-thought | `beam_search_plan()` — O(K·d·log K) |
| **MCTS** | DeepMind, Anthropic | Decision-making, "killing beliefs" | `MCTS.search()` + `kill_bad_paths()` |
| **Speculative Execution** | OpenAI | Inference acceleration, task pipelining | `SpeculativeExecutor` — predict next actions |
| **Fibonacci Heap** | OpenAI, Anthropic | Dynamic task scheduling | Diana's priority queue — O(1) decrease-key |
| **Bloom Filter** | Discord, Meta, Google | Fast duplicate detection | Strike pattern detection — O(k) lookup |
| **DPO/RLHF** | OpenAI, Anthropic | Agent preference learning | Strike system + belief updates |
| **Constitutional AI** | Anthropic | Self-critique, safety | Self-Counter + Council governance |
| **Mixture of Experts** | xAI (Grok) | Routing to best agent | Intent classifier → agent routing |

### 12.2 User Intent Understanding — How They Do It

**OpenAI (GPT-4):**
- Tokenizer breaks input → embedding → intent classifier → router
- Ambiguity detection triggers clarifying questions
- System prompt injection adds context

**Anthropic (Claude):**
- Constitutional classifier evaluates input safety
- Hierarchical task decomposition (beam search)
- Chain-of-thought for complex requests

**xAI (Grok):**
- Real-time context injection from X platform
- Mixture-of-experts routes to best module
- Multi-modal understanding (text + image context)

**CAOS Implementation:**
```
Raw user text → Clean → Extract keywords → Classify intent → Extract entities
→ Assess urgency → Calculate ambiguity → Route to agents → Suggest plan
→ Enrich with project graph → TOON compress → Deliver to agent
```

If ambiguity > 0.6: agent asks clarifying questions before proceeding.
If urgency = "critical": skip self-counter, go straight to execution.
If known mistake pattern detected: counter-user flag before execution.

### 12.3 Fallback & Failure Recovery — How They Handle It

**OpenAI:**
- Exponential backoff on API failures
- Model fallback: GPT-4 → GPT-3.5-turbo for non-critical tasks
- Graceful degradation: partial response if full fails

**Anthropic:**
- Multi-stage safety classifiers (pre-prompt, post-generation, pre-delivery)
- If safety flag: regenerate with stricter constraints
- If still fails: escalate to human review

**xAI:**
- Failed queries rerouted through different expert modules
- Real-time performance monitoring triggers automatic failover

**CAOS Implementation:**
6-level fallback chain:
1. RETRY_SAME — same agent, exponential backoff
2. RETRY_DIFFERENT — swap agent (dev→raj, mia→dev)
3. RETRY_REFINED — re-parse task, clearer requirements
4. ESCALATE_LEAD — department lead takes over
5. ESCALATE_COUNCIL — full council review
6. DEGRADE — deliver partial result instead of nothing

Bloom filter prevents retrying the exact same failing approach.
Fibonacci heap enables O(1) reprioritization when tasks fail.

### 12.4 TOON Pipeline — Everything Compressed

Every data structure flows through TOON compression:

| Data | Raw Size | TOON Size | Compression |
|---|---|---|---|
| Plan state (100 nodes) | ~50KB | ~2KB | 96% |
| Belief graph (50 beliefs) | ~15KB | ~800B | 95% |
| Strike history (100 entries) | ~20KB | ~1KB | 95% |
| User intent (parsed) | ~2KB | ~300B | 85% |
| Agent memory | ~100KB | ~3KB | 97% |

This is what makes the system viable for LLM context windows.
Agents receive 29 tokens of context instead of 4.5MB of raw data.

---

## 13. Memory Architecture — Agents That Learn

> "Agents build memory, update TOON files after every task, inject mistakes into graphs, and never get lost in long conversations."

### 13.1 Memory Types (Human-Brain Inspired)

| Type | What | Where | When Updated |
|---|---|---|---|
| **Episodic** | "What happened" — task logs, outcomes | `.toon/memory/{agent}/ep-*.json` | After every task |
| **Semantic** | "What I know" — facts, learnings | `.toon/memory/{agent}/sem-*.json` | After discoveries |
| **Procedural** | "How to do" — patterns that worked | `.toon/memory/{agent}/proc-*.json` | After success |
| **Mistake** | "What NOT to do" — errors, dead ends | `.toon/mistakes/{agent}-*.json` | After failure |
| **Working** | "Right now" — current state | `.toon/state/{agent}_state.json` | Continuously |

### 13.2 The Flow

```
SESSION START
    │
    ▼
┌─────────────────────────────────────────┐
│ inject_session_context(agent, task)      │
│                                          │
│ Loads:                                   │
│  - Top 5 relevant episodic memories     │
│  - Top 3 mistakes (DO NOT REPEAT)       │
│  - Top 3 procedural patterns            │
│  - Semantic facts about task domain     │
│  - Last session state vector            │
│  - Strike status + confidence multiplier│
│                                          │
│ All TOON-compressed → 29 tokens         │
└──────────────┬──────────────────────────┘
               │
               ▼
         TASK EXECUTES
               │
               ▼
┌─────────────────────────────────────────┐
│ update_after_task(agent, task, result)   │
│                                          │
│ Writes:                                  │
│  1. Episodic memory (what happened)     │
│  2. Procedural memory (if success)      │
│  3. Semantic facts (learnings extracted)│
│  4. Mistake node (if failed)            │
│  5. Updated state vector                │
│  6. Mistake → graph node (queryable)    │
│  7. Prevention rule generated           │
└──────────────┬──────────────────────────┘
               │
               ▼
         SESSION ENDS
               │
               ▼
┌─────────────────────────────────────────┐
│ update_after_session(agent, summary)     │
│                                          │
│ Actions:                                 │
│  - Save session summary                 │
│  - Update agent's MEMORY.md             │
│  - Consolidate last 100 memories        │
│  - TOON archive older memories          │
│  - Write new state vector               │
│  - Update memory.toon for injection     │
└─────────────────────────────────────────┘
```

### 13.3 Mistake Graph — Cross-Agent Learning

Mistakes become **queryable nodes** in the knowledge graph:

```
Mistake Node = {
    id: "mistake-dev-auth-csrf",
    agent: "dev",
    type: "security_gap",
    context: "auth middleware",
    context_hash: "a3f8...",
    resolution: "Added CSRF token validation to all POST routes",
    severity: 4,
    repeat_count: 3,
    prevention_rule: "IF working on auth THEN run security audit BEFORE commit"
}
```

When **any agent** works on a similar task:
1. Query mistake graph: "mistakes in auth context"
2. Returns: 3 past mistakes, their resolutions, prevention rules
3. Injected into agent context: "DO NOT REPEAT: Missing CSRF validation (dev, ×3)"
4. Prevention rule triggers: "IF auth THEN security audit first"

### 13.4 Session Injection — Never Get Lost

At session start, every agent receives:

```yaml
Session Context (TOON compressed, ~29 tokens):
  mistakes: [CSRF gap ×3, type error ×2]
  procedures: [test-first pattern, atomic commits]
  facts: [auth uses JWT, DB is Postgres]
  state: {tasks: 47, multiplier: 0.8}
  recent: [session-42: built login, session-43: fixed rate limit]
```

This means even after 100+ messages, the agent remembers:
- What it did before (episodic)
- What it learned (semantic)  
- What patterns work (procedural)
- What NOT to do (mistake graph)
- Its current state (working memory)

### 13.5 TOON Compression — Memory at Scale

| Memory Type | Without TOON | With TOON | Storage |
|---|---|---|---|
| 100 episodic memories | ~50KB | ~2KB | 96% saved |
| 50 semantic facts | ~10KB | ~500B | 95% saved |
| 30 mistakes | ~15KB | ~800B | 95% saved |
| Session injection | ~5KB | ~300B | 94% saved |

All stored in `.toon/memory/` — git-versioned, portable, Hermes-compatible.

---

## 14. References (Updated)

- **Global Workspace Theory** — Baars (1988), Dehaene (2014)
- **Predictive Processing** — Clark (2013), Friston (2010)
- **Anterior Cingulate Cortex** — Botvinick (2001), conflict monitoring theory
- **Bayesian Brain Hypothesis** — Knill & Pouget (2004)
- **MetaGPT** — Multi-agent meta-programming framework (Hong et al., 2023)
- **AutoGPT/BabyAGI** — Task-driven autonomous agents
- **Claude Fable 5** — Anthropic Mythos-level model capabilities (2026)
