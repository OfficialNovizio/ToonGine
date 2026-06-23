"""
CAOS — Cognitive Agent Operating System — Master Pipeline

Orchestrates: Marcus plans → Diana schedules → parallel agents execute
→ Quinn verifies → Kahneman audits → Council judges → agent learns.

Single entry point: caos_run("build auth system")
"""

import os, sys, json, time, hashlib
from pathlib import Path
from typing import Optional

# Ensure caos/ is on Python path for sibling imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# CAOS modules
from algorithms import (
    Plan, TaskNode, Belief, NodeStatus, PlanStatus,
    topological_sort, compute_critical_path,
    belief_update, belief_decay, should_kill_belief, should_warn_belief,
    kill_belief, check_convergence, schedule_rounds,
    detect_biases, plan_to_dict, dict_to_plan,
    KILL_THRESHOLD, WARN_THRESHOLD, CONFIDENT_THRESHOLD,
)

from self_counter import (
    self_counter, CounterResult, StrikeRecord,
    load_strike_history, check_repeated_mistakes,
)

from council import (
    issue_strike, check_agent_status, get_agent_confidence_multiplier,
    council_action, CouncilAction, check_constitution_violation,
    create_threat, format_threat_message,
)

from counter_user import (
    should_challenge_user, format_challenge_message,
    save_challenge, log_user_override, ChallengeLevel,
)

from challenge_protocol import (
    scan_for_cross_dept_challenges, file_challenge,
    escalate_to_council, get_open_challenges,
)

from discipline_gate import discipline_wrapper, DisciplineGate
from memory_system import SessionMemoryHook


# ═══════════════════════════════════════════════════════════════
# PIPELINE CONFIG
# ═══════════════════════════════════════════════════════════════

CAOS_CONFIG = {
    "max_parallel_agents": 3,
    "max_retries_per_node": 3,
    "checkpoint_interval_minutes": 30,
    "convergence_entropy_threshold": 0.3,
    "convergence_delta_threshold": 0.1,
    "convergence_pass_rate_threshold": 0.85,
    "council_majority": 3,  # 3 of 5
    "strike_escalation": {
        1: "warning",
        2: "penalty",
        3: "review",
        4: "demotion",
        5: "suspension",
    },
}

TOON_DIR = Path(".toon")
PLANS_DIR = TOON_DIR / "plans"
CHALLENGES_DIR = TOON_DIR / "challenges"
STRIKES_DIR = TOON_DIR / "strikes"
STATE_DIR = TOON_DIR / "state"
COUNCIL_DIR = TOON_DIR / "council"


# ═══════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════

def caos_run(task: str, user_id: str = "user", time_budget_hours: float = 48.0,
             auto_approve: bool = False) -> dict:
    """
    Main CAOS pipeline.
    
    Args:
        task: Natural language task (e.g., "Build auth system with login, signup")
        user_id: Who requested this
        time_budget_hours: Max time before timeout
        auto_approve: Skip user confirmation (for cron/autonomous mode)
    
    Returns:
        Final plan result with status, metrics, and output.
    """
    
    _ensure_directories()
    
    # ── PHASE 0: COUNCIL CHECK ────────────────────────────────────
    # Check if any agent has pending threats/suspensions
    council_status = _council_preamble()
    if council_status.get("blocked_agents"):
        return {
            "status": "blocked",
            "reason": f"Agents suspended: {council_status['blocked_agents']}",
            "message": "Resolve Council issues before proceeding.",
        }
    
    # ── PHASE 1: MARCUS PLANS ─────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  🧠 CAOS Pipeline — Processing: {task[:80]}")
    print(f"{'='*60}\n")
    
    print("  👑 PHASE 1: Marcus — Planning...")
    
    plan_id = f"plan-{hashlib.sha256(task.encode()).hexdigest()[:12]}"
    plan = Plan(
        id=plan_id,
        task=task,
        time_budget_hours=time_budget_hours,
    )
    
    # Marcus analyzes task → produces Task DAG
    # In production: call Hermes with MCP tools to analyze codebase
    plan = _marcus_plan(plan, task)
    
    print(f"     Plan: {plan.id}")
    print(f"     Nodes: {len(plan.nodes)}, Edges: {len(plan.edges)}")
    print(f"     Critical path: {len(plan.critical_path)} nodes")
    
    _checkpoint(plan, version=1)
    
    # ── PHASE 2: DIANA SCHEDULES ──────────────────────────────────
    print("\n  ⚙️  PHASE 2: Diana — Scheduling...")
    
    rounds = schedule_rounds(plan, CAOS_CONFIG["max_parallel_agents"])
    print(f"     Execution rounds: {len(rounds)}")
    for r in rounds:
        agents = [n.agent for n in r.nodes]
        print(f"     Round {r.round_num}: {agents}")
    
    # ── PHASE 3-5: EXECUTE → VERIFY → COUNCIL ─────────────────────
    round_num = 0
    max_rounds = len(rounds) * 3  # Allow re-delegation
    prev_plan = None
    
    while round_num < max_rounds and plan.status not in [PlanStatus.CONVERGED, PlanStatus.FAILED]:
        round_num += 1
        
        # Re-schedule (tasks may have changed)
        rounds = schedule_rounds(plan, CAOS_CONFIG["max_parallel_agents"])
        
        for execution_round in rounds:
            if not execution_round.nodes:
                continue
            
            print(f"\n  🔄 ROUND {round_num} — {len(execution_round.nodes)} agent(s)")
            
            for node in execution_round.nodes:
                if node.status == NodeStatus.COMPLETED:
                    continue
                
                print(f"\n     ▸ {node.agent} → {node.task[:60]}")
                
                # ── Check agent status ──────────────────────────
                agent_status = check_agent_status(node.agent)
                confidence_mult = agent_status["confidence_multiplier"]
                
                if agent_status["status"] == "suspended":
                    print(f"       ⛔ {node.agent} is SUSPENDED — skipping")
                    _reassign_node(plan, node, agent_status)
                    continue
                
                if confidence_mult < 1.0:
                    print(f"       ⚠️  {node.agent} confidence multiplier: {confidence_mult}")
                
                # ── Counter-User check ───────────────────────────
                user_challenge = should_challenge_user(node.task, node.agent, 
                                                        load_strike_history(node.agent))
                if user_challenge and user_challenge.level == ChallengeLevel.VETO:
                    print(f"       🛑 AGENT VETO: {user_challenge.reason[:80]}")
                    save_challenge(user_challenge)
                    if not auto_approve:
                        print(f"       ⏳ Awaiting user response...")
                        return {"status": "awaiting_user", "challenge": user_challenge}
                
                # ── PASS 1: Generate ────────────────────────────
                print(f"       📝 Generating...")
                output = _agent_generate(node)
                
                # ── PASS 2: Self-Counter ────────────────────────
                print(f"       🔍 Self-counter...")
                strikes = load_strike_history(node.agent)
                counter_result = self_counter(node.agent, output, strikes)
                
                if not counter_result.passed:
                    print(f"       ❌ Self-counter FAILED: {counter_result.flaws_found} flaws")
                    # Don't submit — re-generate
                    node.retries += 1
                    if node.retries >= CAOS_CONFIG["max_retries_per_node"]:
                        node.status = NodeStatus.FAILED
                        _issue_strike_for_node(node, "self_counter_failure", counter_result.critique)
                    continue
                
                print(f"       ✅ Self-counter passed (confidence: {counter_result.confidence})")
                
                # ── Cross-department challenge ───────────────────
                print(f"       🔀 Cross-dept audit...")
                challenges = scan_for_cross_dept_challenges(
                    counter_result.revised, "technical", node.agent, 
                    _get_department(node.agent), node.agent
                )
                for ch in challenges:
                    file_challenge(ch)
                    print(f"       ⚠️  Challenge filed: {ch.issue[:60]}")
                
                # ── Quinn verification ──────────────────────────
                print(f"       🧪 Quinn verifying...")
                quinn_result = _quinn_verify(counter_result.revised, node)
                
                # ── Kahneman audit ──────────────────────────────
                print(f"       🧠 Kahneman auditing...")
                elapsed = (time.time() - plan.created) / 3600
                bias_findings = detect_biases(plan, elapsed)
                if bias_findings:
                    print(f"       ⚠️  Bias detected: {bias_findings[0]['bias']}")
                
                # ── Belief update ───────────────────────────────
                evidence_quality = 1.0 if quinn_result.get("passed", False) else 0.3
                if bias_findings:
                    evidence_quality *= 0.7  # Bias reduces confidence
                
                node.confidence = belief_update(node.confidence, evidence_quality)
                
                belief = Belief(
                    id=f"b-{node.id}",
                    hypothesis=f"{node.task} is correctly implemented",
                    confidence=node.confidence,
                    evidence=[f"Quinn: {'PASS' if quinn_result.get('passed') else 'FAIL'}"],
                    source_agent=node.agent,
                )
                plan.beliefs[belief.id] = belief
                
                # ── Kill incorrect beliefs ──────────────────────
                if should_kill_belief(belief):
                    print(f"       💀 KILLING BELIEF: confidence {belief.confidence} < {KILL_THRESHOLD}")
                    kill_belief(belief)
                    node.status = NodeStatus.KILLED
                    _issue_strike_for_node(node, "killed_belief", 
                                          f"Confidence {belief.confidence} below threshold")
                    continue
                
                if should_warn_belief(belief):
                    print(f"       ⚠️  Low confidence: {belief.confidence} — flagged for review")
                
                # ── DISCIPLINE GATE: Don't speak unless you know ──
                print(f"       🛡️  Discipline Gate checking...")
                
                task_context = {
                    "task": node.task,
                    "evidence_sources": ["graph_query", "file_read"],
                    "verification": {
                        "checks": {
                            "quinn": quinn_result.get("passed", False),
                            "kahneman": len(bias_findings) == 0 if bias_findings else True,
                        }
                    },
                    "self_counter": {
                        "flaws_found": counter_result.flaws_found,
                        "passed": counter_result.passed,
                    },
                    "confidence": node.confidence,
                    "council_approved": node.confidence >= CONFIDENT_THRESHOLD,
                }
                
                discipline_result = discipline_wrapper(
                    counter_result.revised, node.agent, task_context
                )
                
                if not discipline_result["deliverable"]:
                    print(f"       🚫 BLOCKED by Discipline Gate: {discipline_result['blocked_reason'][:80]}")
                    print(f"       💬 Agent says: {discipline_result['output'][:100]}")
                    
                    # Agent cannot deliver — needs more data/verification
                    node.status = NodeStatus.IN_PROGRESS
                    node.result = discipline_result["output"]
                    
                    # Record the block for learning
                    _issue_strike_for_node(node, "discipline_blocked", 
                                          discipline_result["blocked_reason"])
                    continue
                
                print(f"       ✅ Discipline Gate passed ({discipline_result['gates_passed']}/{discipline_result['gates_total']} gates)")
                
                # ── Memory hook: update after task ──────────────
                memory_hook = SessionMemoryHook()
                memory_hook.on_task_complete(
                    node.agent, node.task,
                    {"status": "completed", "success": True, 
                     "confidence": node.confidence, "output": counter_result.revised},
                    session_id=f"caos-{plan.id}"
                )
                
                # ── Mark complete ───────────────────────────────
                if node.confidence >= CONFIDENT_THRESHOLD:
                    node.status = NodeStatus.COMPLETED
                    node.result = counter_result.revised
                    print(f"       ✅ COMPLETED (confidence: {node.confidence})")
                else:
                    node.status = NodeStatus.IN_PROGRESS
                    print(f"       🔄 Needs revision (confidence: {node.confidence})")
        
        # ── Convergence check ───────────────────────────────────
        convergence = check_convergence(plan, prev_plan)
        prev_plan = plan
        
        print(f"\n  📊 ROUND {round_num} METRICS:")
        for k, v in convergence["metrics"].items():
            print(f"     {k}: {v}")
        
        if convergence["converged"]:
            plan.status = PlanStatus.CONVERGED
            print(f"\n  🎉 PLAN CONVERGED!")
            break
        
        # ── Time budget check ──────────────────────────────────
        elapsed_hours = (time.time() - plan.created) / 3600
        if elapsed_hours > plan.time_budget_hours:
            plan.status = PlanStatus.TIMED_OUT
            print(f"\n  ⏰ TIME BUDGET EXCEEDED ({elapsed_hours:.1f}h > {plan.time_budget_hours}h)")
            break
        
        _checkpoint(plan, version=plan.version + 1)
        plan.version += 1
    
    # ── PHASE 6: MARCUS SYNTHESIZES ─────────────────────────────
    print(f"\n  📋 PHASE 6: Marcus — Final Synthesis")
    
    completed = sum(1 for n in plan.nodes if n.status == NodeStatus.COMPLETED)
    killed = sum(1 for n in plan.nodes if n.status == NodeStatus.KILLED)
    failed = sum(1 for n in plan.nodes if n.status == NodeStatus.FAILED)
    
    result = {
        "plan_id": plan.id,
        "task": plan.task,
        "status": plan.status.value,
        "nodes_total": len(plan.nodes),
        "nodes_completed": completed,
        "nodes_killed": killed,
        "nodes_failed": failed,
        "beliefs_alive": sum(1 for b in plan.beliefs.values() if b.status == "alive"),
        "beliefs_killed": sum(1 for b in plan.beliefs.values() if b.status == "killed"),
        "rounds": round_num,
        "elapsed_hours": (time.time() - plan.created) / 3600,
        "output": _synthesize_output(plan),
    }
    
    print(f"\n{'='*60}")
    print(f"  ✅ CAOS Pipeline Complete")
    print(f"     Status: {result['status']}")
    print(f"     Completed: {completed}/{len(plan.nodes)} nodes")
    print(f"     Killed beliefs: {result['beliefs_killed']}")
    print(f"     Time: {result['elapsed_hours']:.1f}h")
    print(f"{'='*60}\n")
    
    return result


# ═══════════════════════════════════════════════════════════════
# INTERNAL FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def _ensure_directories():
    for d in [PLANS_DIR, CHALLENGES_DIR, STRIKES_DIR, STATE_DIR, COUNCIL_DIR]:
        d.mkdir(parents=True, exist_ok=True)

def _council_preamble() -> dict:
    """Check agent statuses before starting pipeline."""
    blocked = []
    for agent in ["dev", "raj", "mia", "quinn", "kai", "lena", "rio", "nate", "felix"]:
        status = check_agent_status(agent)
        if status["status"] == "suspended":
            blocked.append(agent)
    return {"blocked_agents": blocked}

def _marcus_plan(plan: Plan, task: str) -> Plan:
    """Marcus analyzes task and creates Task DAG.
    
    In production: calls Hermes with MCP graph tools to understand codebase,
    then decomposes task based on project structure.
    """
    # For now: simple keyword-based task decomposition
    task_lower = task.lower()
    
    nodes = []
    edges = []
    
    if "auth" in task_lower or "login" in task_lower or "signup" in task_lower:
        nodes = [
            TaskNode(id="n1", task="Design database schema for auth", agent="raj", 
                    estimated_minutes=30),
            TaskNode(id="n2", task="Build API routes for auth", agent="raj", 
                    deps=["n1"], estimated_minutes=45),
            TaskNode(id="n3", task="Build login UI component", agent="mia", 
                    deps=["n2"], estimated_minutes=30),
            TaskNode(id="n4", task="Build signup UI component", agent="mia", 
                    deps=["n2"], estimated_minutes=30),
            TaskNode(id="n5", task="Write integration tests", agent="quinn", 
                    deps=["n3", "n4"], estimated_minutes=20),
            TaskNode(id="n6", task="Security review", agent="dev", 
                    deps=["n2"], estimated_minutes=15),
        ]
        edges = [
            ("n1", "n2"), ("n2", "n3"), ("n2", "n4"),
            ("n3", "n5"), ("n4", "n5"), ("n2", "n6"),
        ]
    elif "ui" in task_lower or "frontend" in task_lower or "component" in task_lower:
        nodes = [
            TaskNode(id="n1", task="Design component architecture", agent="mia", 
                    estimated_minutes=20),
            TaskNode(id="n2", task="Build components", agent="mia", 
                    deps=["n1"], estimated_minutes=60),
            TaskNode(id="n3", task="API integration", agent="raj", 
                    deps=["n2"], estimated_minutes=30),
            TaskNode(id="n4", task="Visual QA review", agent="quinn", 
                    deps=["n3"], estimated_minutes=15),
        ]
        edges = [("n1", "n2"), ("n2", "n3"), ("n3", "n4")]
    elif "api" in task_lower or "backend" in task_lower or "route" in task_lower:
        nodes = [
            TaskNode(id="n1", task="Design API contract", agent="dev", 
                    estimated_minutes=20),
            TaskNode(id="n2", task="Build API routes", agent="raj", 
                    deps=["n1"], estimated_minutes=60),
            TaskNode(id="n3", task="Database queries", agent="raj", 
                    deps=["n2"], estimated_minutes=45),
            TaskNode(id="n4", task="Write API tests", agent="quinn", 
                    deps=["n3"], estimated_minutes=30),
            TaskNode(id="n5", task="Error handling", agent="dev", 
                    deps=["n2"], estimated_minutes=20),
        ]
        edges = [("n1", "n2"), ("n2", "n3"), ("n3", "n4"), ("n2", "n5")]
    else:
        nodes = [
            TaskNode(id="n1", task=f"Analyze: {task}", agent="dev", 
                    estimated_minutes=30),
            TaskNode(id="n2", task=f"Implement: {task}", agent="dev", 
                    deps=["n1"], estimated_minutes=120),
            TaskNode(id="n3", task=f"Verify: {task}", agent="quinn", 
                    deps=["n2"], estimated_minutes=20),
        ]
        edges = [("n1", "n2"), ("n2", "n3")]
    
    plan.nodes = nodes
    plan.edges = edges
    
    topo = topological_sort(nodes, edges)
    plan.critical_path = compute_critical_path(nodes, edges, topo)
    
    return plan

def _agent_generate(node: TaskNode) -> str:
    """Agent generates output. In production: calls Hermes with agent persona."""
    # Placeholder — would call Hermes delegate_task or direct LLM
    return f"[{node.agent}] Generated output for: {node.task}"

def _quinn_verify(output: str, node: TaskNode) -> dict:
    """Quinn verifies agent output. In production: runs tests, checks types."""
    # Heuristic: if output is empty or too short, fail
    if not output or len(output) < 10:
        return {"passed": False, "reason": "Output too short", "issues": ["empty output"]}
    return {"passed": True, "reason": "Verification passed", "issues": []}

def _reassign_node(plan: Plan, node: TaskNode, agent_status: dict):
    """Reassign a node when agent is suspended."""
    replacements = {"dev": "raj", "raj": "dev", "mia": "dev", "quinn": "kahneman"}
    new_agent = replacements.get(node.agent, "dev")
    print(f"       🔄 Reassigning {node.agent} → {new_agent}")
    node.agent = new_agent

def _issue_strike_for_node(node: TaskNode, mistake_type: str, context: str):
    """Issue a strike based on node failure."""
    strike = issue_strike(
        agent=node.agent,
        mistake_type=mistake_type,
        context=context,
        severity=3,
        issued_by="caos_pipeline",
        resolution=f"Node {node.id} failed: {node.task}",
    )
    
    # If strike escalates to 3+, council threatens
    if strike.repeat_count >= 3:
        threat = create_threat(node.agent, strike, strike.repeat_count)
        print(f"\n{'='*60}")
        print(format_threat_message(threat))
        print(f"{'='*60}\n")

def _get_department(agent: str) -> str:
    """Map agent to department."""
    dept_map = {
        "dev": "technical", "raj": "technical", "mia": "technical", "quinn": "technical",
        "kai": "marketing", "lena": "marketing", "rio": "marketing", "nate": "marketing",
        "felix": "finance", "kahneman": "psychology",
        "comply": "legal", "docs": "legal", "guard": "legal",
        "vette": "research", "depth": "research", "synth": "research",
    }
    return dept_map.get(agent, "technical")

def _checkpoint(plan: Plan, version: int):
    """Save plan checkpoint."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    checkpoint_path = STATE_DIR / "checkpoints" / plan.id
    checkpoint_path.mkdir(parents=True, exist_ok=True)
    
    filepath = checkpoint_path / f"v{version}__{int(time.time())}.json"
    with open(filepath, 'w') as f:
        json.dump(plan_to_dict(plan), f, indent=2)

def _synthesize_output(plan: Plan) -> str:
    """Marcus produces final synthesis."""
    completed = [n for n in plan.nodes if n.status == NodeStatus.COMPLETED]
    killed = [n for n in plan.nodes if n.status == NodeStatus.KILLED]
    
    output = f"# Plan: {plan.task}\n\n"
    output += f"Status: {plan.status.value}\n\n"
    
    output += "## Completed\n"
    for n in completed:
        output += f"- [{n.agent}] {n.task} (confidence: {n.confidence})\n"
    
    if killed:
        output += "\n## Killed / Re-planned\n"
        for n in killed:
            output += f"- [{n.agent}] {n.task} — belief was incorrect\n"
    
    output += f"\n## Beliefs\n"
    for b in plan.beliefs.values():
        status_icon = "✅" if b.status == "alive" else "💀"
        output += f"- {status_icon} {b.hypothesis} ({b.confidence})\n"
    
    return output


# ═══════════════════════════════════════════════════════════════
# TOONGINE INTEGRATION
# ═══════════════════════════════════════════════════════════════

def register_toongine_command():
    """Register 'npx toongine run' as the CAOS entry point."""
    return {
        "command": "run",
        "description": "Execute a task through the CAOS autonomous pipeline",
        "usage": "npx toongine run \"build auth system\"",
        "handler": caos_run,
    }


if __name__ == "__main__":
    task = sys.argv[1] if len(sys.argv) > 1 else "Build auth system"
    result = caos_run(task)
    print(json.dumps(result, indent=2))
