"""
CAOS — Cognitive Agent Operating System
Task DAG, Belief Propagation, Convergence Detection, Priority Scheduling

Part of ToonGine v1.7.1+ — competes with Anthropic Fable 5 architecture
"""

from dataclasses import dataclass, field
from typing import Optional
import json, math, hashlib, time
from collections import deque
from enum import Enum


# ═══════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════

class NodeStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    KILLED = "killed"  # belief was incorrect — re-plan needed

class PlanStatus(Enum):
    DRAFT = "draft"
    EXECUTING = "executing"
    CONVERGED = "converged"
    FAILED = "failed"
    TIMED_OUT = "timed_out"

@dataclass
class TaskNode:
    id: str
    task: str
    agent: str
    deps: list[str] = field(default_factory=list)
    status: NodeStatus = NodeStatus.PENDING
    result: Optional[str] = None
    confidence: float = 1.0
    retries: int = 0
    max_retries: int = 3
    estimated_minutes: int = 30

@dataclass
class Belief:
    id: str
    hypothesis: str
    confidence: float
    evidence: list[str] = field(default_factory=list)
    contradictions: list[str] = field(default_factory=list)
    source_agent: str = ""
    timestamp: float = field(default_factory=time.time)
    decay_rate: float = 0.05  # per hour
    dependencies: list[str] = field(default_factory=list)
    status: str = "alive"  # alive | killed | verified

@dataclass
class Plan:
    id: str
    task: str
    status: PlanStatus = PlanStatus.DRAFT
    nodes: list[TaskNode] = field(default_factory=list)
    edges: list[tuple[str, str]] = field(default_factory=list)
    beliefs: dict[str, Belief] = field(default_factory=dict)
    created: float = field(default_factory=time.time)
    time_budget_hours: float = 48.0
    version: int = 1
    critical_path: list[str] = field(default_factory=list)

@dataclass
class Checkpoint:
    plan_id: str
    version: int
    timestamp: float
    snapshot: dict  # full Plan serialization
    delta_from_prev: Optional[str] = None


# ═══════════════════════════════════════════════════════════════
# ALGORITHM 1: Task DAG — Topological Decomposition
# ═══════════════════════════════════════════════════════════════

def topological_sort(nodes: list[TaskNode], edges: list[tuple[str, str]]) -> list[str]:
    """Kahn's algorithm — O(V + E) topological sort."""
    adj = {n.id: [] for n in nodes}
    indegree = {n.id: 0 for n in nodes}
    
    for src, dst in edges:
        adj[src].append(dst)
        indegree[dst] = indegree.get(dst, 0) + 1
    
    queue = deque([nid for nid, deg in indegree.items() if deg == 0])
    result = []
    
    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in adj.get(node, []):
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    
    if len(result) != len(nodes):
        # Cycle detected — break at weakest confidence edge
        raise ValueError(f"Cycle detected in task DAG. Sorted {len(result)}/{len(nodes)} nodes.")
    
    return result


def compute_critical_path(nodes: list[TaskNode], edges: list[tuple[str, str]], 
                          topo_order: list[str]) -> list[str]:
    """Critical Path Method — longest path through DAG. O(V + E)."""
    node_map = {n.id: n for n in nodes}
    
    # Forward pass — earliest finish time
    eft = {nid: 0.0 for nid in topo_order}
    for nid in topo_order:
        node = node_map[nid]
        eft[nid] = max(
            [eft[dep] + node_map[dep].estimated_minutes for dep in node.deps] + [node.estimated_minutes]
        )
    
    # Backward pass — latest finish time
    total_time = max(eft.values())
    lft = {nid: total_time for nid in topo_order}
    
    for nid in reversed(topo_order):
        successors = [dst for src, dst in edges if src == nid]
        if successors:
            lft[nid] = min(
                lft[s] - node_map[nid].estimated_minutes for s in successors
            )
    
    # Critical path = nodes where EFT == LFT (zero slack)
    critical = [nid for nid in topo_order if abs(eft[nid] - lft.get(nid, 0)) < 0.001]
    return critical


def has_cycle(nodes: list[TaskNode], edges: list[tuple[str, str]]) -> bool:
    """Detect cycle in DAG."""
    try:
        topological_sort(nodes, edges)
        return False
    except ValueError:
        return True


# ═══════════════════════════════════════════════════════════════
# ALGORITHM 2: Belief Propagation — Bayesian Confidence
# ═══════════════════════════════════════════════════════════════

KILL_THRESHOLD = 0.30
WARN_THRESHOLD = 0.60
CONFIDENT_THRESHOLD = 0.85

def belief_update(prior: float, evidence_likelihood: float) -> float:
    """
    Bayesian belief update.
    P(H|E) = (P(E|H) × P(H)) / P(E)
    
    Simplified: new = prior × evidence_likelihood, normalized.
    evidence_likelihood = 1.0 (pass), 0.3 (fail), 0.6 (uncertain)
    """
    # Bayesian update with smoothing
    posterior = (prior * evidence_likelihood) / (prior * evidence_likelihood + (1 - prior) * (1 - evidence_likelihood))
    return max(0.0, min(1.0, posterior))


def belief_decay(belief: Belief, current_time: float = None) -> float:
    """Exponential decay: confidence(t) = confidence(0) × e^(-λt)"""
    if current_time is None:
        current_time = time.time()
    elapsed_hours = (current_time - belief.timestamp) / 3600.0
    return belief.confidence * math.exp(-belief.decay_rate * elapsed_hours)


def should_kill_belief(belief: Belief) -> bool:
    """Kill threshold: confidence below 0.30"""
    current = belief_decay(belief)
    return current < KILL_THRESHOLD


def should_warn_belief(belief: Belief) -> bool:
    """Warn threshold: confidence below 0.60"""
    current = belief_decay(belief)
    return current < WARN_THRESHOLD


def kill_belief(belief: Belief) -> Belief:
    """Mark belief as killed — triggers re-plan."""
    belief.status = "killed"
    belief.confidence = 0.0
    return belief


# ═══════════════════════════════════════════════════════════════
# ALGORITHM 3: Convergence Detection
# ═══════════════════════════════════════════════════════════════

def belief_entropy(beliefs: list[Belief]) -> float:
    """Shannon entropy of belief confidences. Low entropy = high certainty."""
    if not beliefs:
        return 0.0
    confidences = [b.confidence for b in beliefs if b.status == "alive"]
    if not confidences:
        return 0.0
    # Treat confidence as probability of correctness
    entropy = 0.0
    for c in confidences:
        if c > 0 and c < 1:
            entropy -= c * math.log2(c) + (1 - c) * math.log2(1 - c)
    return entropy / len(confidences)


def plan_delta(plan_v1: Plan, plan_v2: Plan) -> float:
    """Fraction of nodes that changed between plan versions. Lower = more stable."""
    ids1 = {n.id for n in plan_v1.nodes}
    ids2 = {n.id for n in plan_v2.nodes}
    if not ids1 and not ids2:
        return 0.0
    union = ids1 | ids2
    intersection = ids1 & ids2
    # 1 - Jaccard similarity
    return 1.0 - len(intersection) / len(union) if union else 0.0


def check_convergence(plan: Plan, prev_plan: Optional[Plan] = None) -> dict:
    """
    Multi-factor convergence check.
    Returns {converged: bool, metrics: dict}
    """
    alive_beliefs = [b for b in plan.beliefs.values() if b.status == "alive"]
    completed = sum(1 for n in plan.nodes if n.status == NodeStatus.COMPLETED)
    total = len(plan.nodes)
    failed = sum(1 for n in plan.nodes if n.status == NodeStatus.FAILED)
    
    metrics = {
        "entropy": belief_entropy(alive_beliefs),
        "completion_rate": completed / total if total else 0,
        "pass_rate": completed / (completed + failed) if (completed + failed) else 0,
        "delta": plan_delta(plan, prev_plan) if prev_plan else 1.0,
        "alive_beliefs": len(alive_beliefs),
        "killed_beliefs": sum(1 for b in plan.beliefs.values() if b.status == "killed"),
    }
    
    converged = (
        metrics["completion_rate"] > 0.90
        and metrics["pass_rate"] > 0.85
        and metrics["entropy"] < 0.3
        and metrics["delta"] < 0.1
    )
    
    return {"converged": converged, "metrics": metrics}


# ═══════════════════════════════════════════════════════════════
# ALGORITHM 4: Priority Scheduling — Critical Path + Parallel
# ═══════════════════════════════════════════════════════════════

@dataclass
class ExecutionRound:
    round_num: int
    nodes: list[TaskNode]

def schedule_rounds(plan: Plan, max_parallel: int = 3) -> list[ExecutionRound]:
    """
    Schedule task DAG into execution rounds.
    Each round: at most max_parallel nodes, all deps satisfied from prior rounds.
    """
    topo = topological_sort(plan.nodes, plan.edges)
    node_map = {n.id: n for n in plan.nodes}
    
    # Build reverse dependency map
    dep_count = {n.id: len(n.deps) for n in plan.nodes}
    children = {n.id: [] for n in plan.nodes}
    for src, dst in plan.edges:
        children[src].append(dst)
    
    rounds = []
    ready = [nid for nid in topo if dep_count[nid] == 0]
    completed = set()
    
    while ready:
        # Take up to max_parallel ready nodes
        round_nodes = []
        for nid in ready[:max_parallel]:
            node = node_map[nid]
            if node.status != NodeStatus.COMPLETED:
                round_nodes.append(node)
        
        if round_nodes:
            rounds.append(ExecutionRound(len(rounds), round_nodes))
        
        # Mark as completed, find newly ready nodes
        for node in round_nodes:
            completed.add(node.id)
            ready.remove(node.id)
        
        # Find nodes whose deps are all completed
        for nid in topo:
            if nid not in completed and nid not in ready:
                node = node_map[nid]
                if all(dep in completed for dep in node.deps):
                    ready.append(nid)
    
    return rounds


# ═══════════════════════════════════════════════════════════════
# ALGORITHM 5: Kahneman Cognitive Bias Detection
# ═══════════════════════════════════════════════════════════════

BIAS_CHECKS = {
    "anchoring": "Are we anchored on the first solution? Have we explored alternatives?",
    "confirmation": "Are we only seeking evidence that confirms our approach?",
    "overconfidence": "Are all beliefs > 0.9 with weak evidence? Count: {count}",
    "sunk_cost": "Have we spent > 50% of time budget on a failing approach?",
    "framing": "Is the task framed too narrowly? Could there be a simpler framing?",
    "groupthink": "Are all agents agreeing too quickly? Dissent count: {count}",
}

def detect_biases(plan: Plan, elapsed_hours: float) -> list[dict]:
    """Kahneman audit — detect cognitive biases in current plan."""
    findings = []
    
    # Overconfidence check
    high_confidence = sum(1 for b in plan.beliefs.values() 
                          if b.status == "alive" and b.confidence > 0.9)
    if high_confidence > len(plan.beliefs) * 0.7 and len(plan.beliefs) > 3:
        findings.append({
            "bias": "overconfidence",
            "severity": "high",
            "detail": f"{high_confidence}/{len(plan.beliefs)} beliefs > 0.9 confidence",
        })
    
    # Sunk cost check
    if elapsed_hours > plan.time_budget_hours * 0.5:
        completed = sum(1 for n in plan.nodes if n.status == NodeStatus.COMPLETED)
        if completed < len(plan.nodes) * 0.3:
            findings.append({
                "bias": "sunk_cost",
                "severity": "high",
                "detail": f"{elapsed_hours:.1f}h elapsed, only {completed}/{len(plan.nodes)} completed",
            })
    
    # Anchoring check
    killed_count = sum(1 for b in plan.beliefs.values() if b.status == "killed")
    if killed_count == 0 and len(plan.beliefs) > 5:
        findings.append({
            "bias": "anchoring",
            "severity": "medium",
            "detail": "No beliefs killed — may be anchored on initial approach",
        })
    
    # Confirmation bias check
    beliefs_with_contradictions = sum(1 for b in plan.beliefs.values() if b.contradictions)
    if beliefs_with_contradictions == 0 and len(plan.beliefs) > 5:
        findings.append({
            "bias": "confirmation",
            "severity": "medium",
            "detail": "No contradictions recorded — may be ignoring disconfirming evidence",
        })
    
    return findings


# ═══════════════════════════════════════════════════════════════
# SERIALIZATION
# ═══════════════════════════════════════════════════════════════

def plan_to_dict(plan: Plan) -> dict:
    return {
        "id": plan.id,
        "task": plan.task,
        "status": plan.status.value,
        "nodes": [
            {"id": n.id, "task": n.task, "agent": n.agent, "deps": n.deps,
             "status": n.status.value, "result": n.result, "confidence": n.confidence,
             "retries": n.retries, "estimated_minutes": n.estimated_minutes}
            for n in plan.nodes
        ],
        "edges": [[src, dst] for src, dst in plan.edges],
        "beliefs": {
            bid: {
                "id": b.id, "hypothesis": b.hypothesis, "confidence": b.confidence,
                "evidence": b.evidence, "contradictions": b.contradictions,
                "source_agent": b.source_agent, "timestamp": b.timestamp,
                "decay_rate": b.decay_rate, "dependencies": b.dependencies, "status": b.status,
            }
            for bid, b in plan.beliefs.items()
        },
        "created": plan.created,
        "time_budget_hours": plan.time_budget_hours,
        "version": plan.version,
        "critical_path": plan.critical_path,
    }

def dict_to_plan(d: dict) -> Plan:
    plan = Plan(
        id=d["id"],
        task=d["task"],
        status=PlanStatus(d["status"]),
        created=d.get("created", time.time()),
        time_budget_hours=d.get("time_budget_hours", 48.0),
        version=d.get("version", 1),
        critical_path=d.get("critical_path", []),
    )
    plan.nodes = [
        TaskNode(
            id=n["id"], task=n["task"], agent=n["agent"], deps=n.get("deps", []),
            status=NodeStatus(n["status"]), result=n.get("result"),
            confidence=n.get("confidence", 1.0), retries=n.get("retries", 0),
            estimated_minutes=n.get("estimated_minutes", 30),
        )
        for n in d["nodes"]
    ]
    plan.edges = [tuple(e) for e in d.get("edges", [])]
    plan.beliefs = {
        bid: Belief(
            id=b["id"], hypothesis=b["hypothesis"], confidence=b["confidence"],
            evidence=b.get("evidence", []), contradictions=b.get("contradictions", []),
            source_agent=b.get("source_agent", ""), timestamp=b.get("timestamp", time.time()),
            decay_rate=b.get("decay_rate", 0.05), dependencies=b.get("dependencies", []),
            status=b.get("status", "alive"),
        )
        for bid, b in d.get("beliefs", {}).items()
    }
    return plan
