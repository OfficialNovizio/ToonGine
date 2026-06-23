"""
CAOS — Agentic Coordinator: What Makes Agentic Tasks Great

Fable 5 beats other models in agentic tasks because it doesn't just delegate
blindly — it estimates resources, speculates ahead, matches capabilities to tasks,
and re-plans dynamically when things fail.

THE FOUR PILLARS OF GREAT AGENTIC COORDINATION:

1. PROPER INFORMATION
   - Agent capability matrix (who's good at what, with stats)
   - Resource estimation (time, tokens, complexity per task)
   - Coordination patterns (fan-out, pipeline, reduce, map-reduce)
   - Task dependency graph (what blocks what)

2. RULES & GUIDELINES
   - Delegation policies (who can delegate to whom)
   - Escalation paths (when to escalate vs retry)
   - Load balancing (don't overload any agent)
   - Failure recovery (retry, reassign, escalate)

3. PROPER REQUESTED THINGS
   - Goal refinement (make vague goals specific)
   - Constraint extraction (time, budget, quality)
   - Success criteria (measurable, not "it works")
   - Stakeholder mapping (who needs what)

4. HOW TO IMPROVE
   - Coordination pattern learning (what worked before)
   - Capability updating (agents get better/slower over time)
   - Speculative execution success rate tracking
   - Resource estimation accuracy calibration

This engine replaces the simple _marcus_plan() in pipeline.py with
a full coordination system that Fable 5 would respect.
"""

import json, time, math, hashlib
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from pathlib import Path


# ═══════════════════════════════════════════════════════════════
# TYPES
# ═══════════════════════════════════════════════════════════════

class CoordinationPattern(Enum):
    """Patterns for multi-agent coordination."""
    FAN_OUT = "fan_out"         # One → Many (parallel independent)
    PIPELINE = "pipeline"       # A → B → C (sequential handoff)
    REDUCE = "reduce"           # Many → One (aggregate results)
    MAP_REDUCE = "map_reduce"   # Fan-out → Reduce
    PAIR_PROGRAMMING = "pair"   # Two agents on same task
    REVIEW_CHAIN = "review"     # Generate → Review → Revise

class TaskCategory(Enum):
    """What kind of task this is — drives agent selection."""
    BACKEND_API = "backend_api"
    FRONTEND_UI = "frontend_ui"
    DATABASE = "database"
    DEVOPS_INFRA = "devops_infra"
    TESTING_QA = "testing_qa"
    SECURITY_AUDIT = "security_audit"
    PERFORMANCE = "performance"
    DOCUMENTATION = "documentation"
    ARCHITECTURE = "architecture"
    BUG_FIX = "bug_fix"
    UNKNOWN = "unknown"

@dataclass
class AgentCapability:
    """What an agent is good at, with performance history."""
    agent: str
    categories: list[TaskCategory]
    success_rate: float          # Historical success rate
    avg_time_minutes: float      # Average time per task
    max_complexity: float        # 0-1, max task complexity they handle
    specializations: list[str]   # Specific frameworks/tech they know
    current_load: int = 0        # Active tasks
    strike_count: int = 0        # Current strikes
    
    def fitness_score(self, category: TaskCategory, complexity: float) -> float:
        """How well this agent fits a task (0-1)."""
        score = 0.0
        
        # Category match
        if category in self.categories:
            score += 0.4
        elif category == TaskCategory.UNKNOWN:
            score += 0.2
        
        # Success rate
        score += self.success_rate * 0.3
        
        # Complexity handling
        if complexity <= self.max_complexity:
            score += 0.2
        else:
            score += 0.05
        
        # Load penalty
        score -= self.current_load * 0.1
        
        # Strike penalty
        score -= self.strike_count * 0.08
        
        return max(0.0, min(1.0, score))

@dataclass
class TaskDecomposition:
    """A decomposed task with estimated resources."""
    id: str
    description: str
    category: TaskCategory
    complexity: float            # 0-1
    estimated_minutes: float
    dependencies: list[str]      # Task IDs this depends on
    assigned_agent: str = ""
    coordination_pattern: CoordinationPattern = CoordinationPattern.FAN_OUT
    sub_tasks: list["TaskDecomposition"] = field(default_factory=list)
    success_criteria: list[str] = field(default_factory=list)
    risk_factors: list[str] = field(default_factory=list)

@dataclass 
class CoordinationPlan:
    """Full coordination plan for a task."""
    task: str
    decompositions: list[TaskDecomposition]
    estimated_total_minutes: float
    critical_path_minutes: float
    parallel_gain: float         # How much parallelism helps (1x = none, Nx = N times faster)
    agent_assignments: dict[str, str]  # task_id → agent
    execution_order: list[list[str]]   # Rounds of parallel task IDs
    fallback_plan: list[tuple[str, str]]  # (task_id, fallback_agent)


# ═══════════════════════════════════════════════════════════════
# AGENT CAPABILITY MATRIX — loaded from AgentRegistry (single source of truth)
# The registry lives at .toon/hermes/caos/agent_registry.py
# Use: from agent_registry import get_registry; reg = get_registry()
# No hardcoded agents here anymore — add/remove/edit agents via registry.


# ═══════════════════════════════════════════════════════════════
# AGENTIC COORDINATOR
# ═══════════════════════════════════════════════════════════════

class AgenticCoordinator:
    """
    The brain of multi-agent coordination in CAOS.
    
    Replaces simple keyword-based _marcus_plan() with proper:
    - Task decomposition by category and complexity
    - Agent selection by capability matching
    - Speculative execution scheduling
    - Dynamic re-planning on failure
    
    Usage:
        coord = AgenticCoordinator()
        plan = coord.plan("Build auth system with login and signup")
        # plan.agent_assignments → {"n1": "raj", "n2": "quinn", ...}
        # plan.execution_order → [["n1", "n3"], ["n2", "n4"], ...]
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        self.toon_dir = Path(toon_dir)
        self.capabilities_file = self.toon_dir / "hermes" / "caos" / "capabilities.json"
        
        # Load capabilities (with history)
        self.capabilities = self._load_capabilities()
        
        # Coordination pattern history
        self.pattern_history = self._load_pattern_history()
    
    def _load_capabilities(self) -> dict[str, AgentCapability]:
        """Load agent capabilities from AgentRegistry (single source of truth)."""
        from agent_registry import get_registry, TaskCategory as RegCat
        reg = get_registry(str(self.toon_dir))
        
        caps = {}
        for name in reg.active_agents():
            agent = reg.get(name)
            if not agent:
                continue
            
            # Map registry categories to coordinator TaskCategory
            categories = []
            for cat_str in agent.categories:
                try:
                    categories.append(TaskCategory(cat_str))
                except ValueError:
                    pass
            
            caps[name] = AgentCapability(
                agent=name,
                categories=categories,
                success_rate=agent.success_rate,
                avg_time_minutes=agent.avg_time_minutes,
                max_complexity=agent.max_complexity,
                specializations=agent.specializations,
            )
        
        return caps
    
    def _load_pattern_history(self) -> dict:
        """Load which coordination patterns worked for which task types."""
        pattern_file = self.toon_dir / "hermes" / "caos" / "pattern_history.json"
        if pattern_file.exists():
            try:
                with open(pattern_file) as f:
                    return json.load(f)
            except Exception:
                pass
        return {}
    
    def plan(self, task: str, time_budget_hours: float = 48.0,
             context: dict = None) -> CoordinationPlan:
        """
        Create a full coordination plan for a task.
        
        This is what Marcus calls instead of the simple keyword-based planner.
        """
        context = context or {}
        
        # 1. Decompose task
        decompositions = self._decompose(task, time_budget_hours)
        
        # 2. Match agents to tasks
        agent_assignments = {}
        for decomp in decompositions:
            best_agent = self._select_best_agent(decomp)
            if best_agent:
                decomp.assigned_agent = best_agent
                agent_assignments[decomp.id] = best_agent
        
        # 3. Build execution order (topological sort with parallelism)
        execution_order = self._schedule_execution(decompositions)
        
        # 4. Build fallback plan
        fallback_plan = []
        for decomp in decompositions:
            fallback = self._select_fallback_agent(decomp)
            if fallback:
                fallback_plan.append((decomp.id, fallback))
        
        # 5. Calculate metrics
        total_minutes = sum(d.estimated_minutes for d in decompositions)
        critical_path = self._compute_critical_path(decompositions, execution_order)
        
        # Parallel gain: how much faster with parallelism vs sequential
        sequential_time = total_minutes
        parallel_time = sum(
            max((decompositions[int(tid[1:])-1].estimated_minutes if tid.startswith('n') and tid[1:].isdigit() else d.estimated_minutes)
                for tid in round_tasks if any(tid == d.id for d in decompositions))
            for round_tasks in execution_order
        ) if execution_order else total_minutes
        parallel_gain = sequential_time / max(parallel_time, 1) if parallel_time > 0 else 1.0
        
        return CoordinationPlan(
            task=task,
            decompositions=decompositions,
            estimated_total_minutes=total_minutes,
            critical_path_minutes=critical_path,
            parallel_gain=parallel_gain,
            agent_assignments=agent_assignments,
            execution_order=execution_order,
            fallback_plan=fallback_plan,
        )
    
    def _decompose(self, task: str, time_budget_hours: float) -> list[TaskDecomposition]:
        """Decompose task into sub-tasks with categories and complexity."""
        task_lower = task.lower()
        decompositions = []
        
        # Detect task categories from keywords
        categories = self._detect_categories(task_lower)
        
        if "auth" in task_lower or "login" in task_lower or "signup" in task_lower:
            decompositions = [
                TaskDecomposition("n1", "Design database schema for auth", 
                    TaskCategory.DATABASE, 0.5, 30, [],
                    success_criteria=["Schema supports email+password", "Indexed on email", "Normalized"],
                    risk_factors=["Schema changes break existing data"]),
                TaskDecomposition("n2", "Build API endpoints (login, signup, logout)",
                    TaskCategory.BACKEND_API, 0.6, 45, ["n1"],
                    success_criteria=["POST /login returns JWT", "POST /signup creates user", "Rate limited"],
                    risk_factors=["JWT secret leakage", "SQL injection", "Timing attacks"]),
                TaskDecomposition("n3", "Build login UI component",
                    TaskCategory.FRONTEND_UI, 0.4, 30, ["n2"],
                    success_criteria=["Email + password fields", "Loading state", "Error messages"],
                    risk_factors=["XSS in error messages", "CSRF"]),
                TaskDecomposition("n4", "Build signup UI component",
                    TaskCategory.FRONTEND_UI, 0.4, 30, ["n2"],
                    success_criteria=["Form validation", "Password strength indicator", "Terms checkbox"],
                    risk_factors=["XSS", "Weak password acceptance"]),
                TaskDecomposition("n5", "Write integration tests",
                    TaskCategory.TESTING_QA, 0.5, 25, ["n2", "n3", "n4"],
                    success_criteria=["5/5 tests pass", "Edge cases covered", "CI green"],
                    risk_factors=["Flaky tests", "Missing edge cases"]),
                TaskDecomposition("n6", "Security audit",
                    TaskCategory.SECURITY_AUDIT, 0.7, 20, ["n2"],
                    success_criteria=["OWASP top 10 checked", "No critical findings", "Token handling secure"],
                    risk_factors=["Undetected vulnerabilities"]),
            ]
        
        elif "api" in task_lower or "endpoint" in task_lower:
            decompositions = [
                TaskDecomposition("n1", "Design API contract (OpenAPI spec)",
                    TaskCategory.ARCHITECTURE, 0.5, 25, [],
                    success_criteria=["OpenAPI 3.0 spec", "All endpoints documented", "Error codes defined"]),
                TaskDecomposition("n2", "Implement API routes",
                    TaskCategory.BACKEND_API, 0.6, 60, ["n1"],
                    success_criteria=["All routes respond", "Input validated", "Proper HTTP codes"]),
                TaskDecomposition("n3", "Add database layer",
                    TaskCategory.DATABASE, 0.5, 45, ["n1"],
                    success_criteria=["Migrations created", "Queries parameterized", "Indexes optimal"]),
                TaskDecomposition("n4", "Write API tests",
                    TaskCategory.TESTING_QA, 0.4, 30, ["n2", "n3"],
                    success_criteria=["Happy path tested", "Error cases tested", "Rate limit tested"]),
                TaskDecomposition("n5", "Add error handling middleware",
                    TaskCategory.BACKEND_API, 0.3, 20, ["n2"],
                    success_criteria=["All errors caught", "No stack traces in prod", "Proper 500 handling"]),
            ]
        
        elif "ui" in task_lower or "component" in task_lower or "frontend" in task_lower:
            decompositions = [
                TaskDecomposition("n1", "Design component API (props interface)",
                    TaskCategory.ARCHITECTURE, 0.3, 15, [],
                    success_criteria=["TypeScript interfaces defined", "Variant props documented"]),
                TaskDecomposition("n2", "Build component structure",
                    TaskCategory.FRONTEND_UI, 0.5, 40, ["n1"],
                    success_criteria=["Renders all variants", "Keyboard accessible", "Screen reader friendly"]),
                TaskDecomposition("n3", "Add styling (design tokens)",
                    TaskCategory.FRONTEND_UI, 0.4, 30, ["n2"],
                    success_criteria=["Matches design system", "Dark mode support", "Responsive"]),
                TaskDecomposition("n4", "Write component tests",
                    TaskCategory.TESTING_QA, 0.4, 20, ["n2"],
                    success_criteria=["All states tested", "Interaction tested", "Accessibility tested"]),
            ]
        
        elif "database" in task_lower or "schema" in task_lower or "migration" in task_lower:
            decompositions = [
                TaskDecomposition("n1", "Design schema",
                    TaskCategory.DATABASE, 0.6, 30, [],
                    success_criteria=["Normalized (3NF)", "Indexes defined", "Foreign keys set"]),
                TaskDecomposition("n2", "Write migrations",
                    TaskCategory.DATABASE, 0.4, 20, ["n1"],
                    success_criteria=["Up migration works", "Down migration reverts", "No data loss"]),
                TaskDecomposition("n3", "Add query layer",
                    TaskCategory.BACKEND_API, 0.5, 35, ["n2"],
                    success_criteria=["Parameterized queries", "Connection pooling", "Error handling"]),
            ]
        
        elif "bug" in task_lower or "fix" in task_lower:
            decompositions = [
                TaskDecomposition("n1", "Reproduce bug",
                    TaskCategory.BUG_FIX, 0.4, 15, [],
                    success_criteria=["Bug reproduced", "Root cause identified"]),
                TaskDecomposition("n2", "Write failing test",
                    TaskCategory.TESTING_QA, 0.3, 10, ["n1"],
                    success_criteria=["Test fails with current code"]),
                TaskDecomposition("n3", "Implement fix",
                    TaskCategory.BUG_FIX, 0.5, 30, ["n1", "n2"],
                    success_criteria=["Test passes", "No regression", "Edge cases handled"]),
                TaskDecomposition("n4", "Verify fix",
                    TaskCategory.TESTING_QA, 0.3, 10, ["n3"],
                    success_criteria=["All tests pass", "Original bug scenario fixed"]),
            ]
        
        else:
            # Generic decomposition
            decompositions = [
                TaskDecomposition("n1", f"Analyze requirements for: {task}",
                    TaskCategory.ARCHITECTURE, 0.5, 20, []),
                TaskDecomposition("n2", f"Implement: {task}",
                    TaskCategory.UNKNOWN, 0.6, 90, ["n1"]),
                TaskDecomposition("n3", f"Test: {task}",
                    TaskCategory.TESTING_QA, 0.4, 25, ["n2"]),
                TaskDecomposition("n4", f"Review: {task}",
                    TaskCategory.SECURITY_AUDIT, 0.4, 15, ["n3"]),
            ]
        
        return decompositions
    
    def _detect_categories(self, task_lower: str) -> list[TaskCategory]:
        """Detect task categories from keywords."""
        cats = []
        
        if any(k in task_lower for k in ("api", "endpoint", "route", "backend")):
            cats.append(TaskCategory.BACKEND_API)
        if any(k in task_lower for k in ("ui", "frontend", "component", "page", "screen")):
            cats.append(TaskCategory.FRONTEND_UI)
        if any(k in task_lower for k in ("database", "schema", "migration", "query", "sql")):
            cats.append(TaskCategory.DATABASE)
        if any(k in task_lower for k in ("deploy", "docker", "kubernetes", "ci/cd", "infra")):
            cats.append(TaskCategory.DEVOPS_INFRA)
        if any(k in task_lower for k in ("test", "qa", "quality", "verify")):
            cats.append(TaskCategory.TESTING_QA)
        if any(k in task_lower for k in ("security", "auth", "audit", "vulnerab")):
            cats.append(TaskCategory.SECURITY_AUDIT)
        if any(k in task_lower for k in ("perf", "optimize", "speed", "slow", "fast")):
            cats.append(TaskCategory.PERFORMANCE)
        if any(k in task_lower for k in ("doc", "readme", "document")):
            cats.append(TaskCategory.DOCUMENTATION)
        if any(k in task_lower for k in ("architect", "design", "system", "structure")):
            cats.append(TaskCategory.ARCHITECTURE)
        if any(k in task_lower for k in ("bug", "fix", "issue", "error", "crash")):
            cats.append(TaskCategory.BUG_FIX)
        
        return cats or [TaskCategory.UNKNOWN]
    
    def _select_best_agent(self, task: TaskDecomposition) -> Optional[str]:
        """Select the best agent for a task based on capability matching."""
        best_agent = None
        best_score = 0.0
        
        for agent_name, cap in self.capabilities.items():
            score = cap.fitness_score(task.category, task.complexity)
            
            # Preference for matching specializations
            for spec in cap.specializations:
                if spec.lower() in task.description.lower():
                    score += 0.1
            
            if score > best_score:
                best_score = score
                best_agent = agent_name
        
        return best_agent
    
    def _select_fallback_agent(self, task: TaskDecomposition) -> Optional[str]:
        """Select a fallback agent (second-best) for when primary fails."""
        best = self._select_best_agent(task)
        
        best_agent = None
        best_score = 0.0
        
        for agent_name, cap in self.capabilities.items():
            if agent_name == best:
                continue  # Skip the primary
            score = cap.fitness_score(task.category, task.complexity)
            if score > best_score:
                best_score = score
                best_agent = agent_name
        
        return best_agent if best_score > 0.3 else None
    
    def _schedule_execution(self, tasks: list[TaskDecomposition]) -> list[list[str]]:
        """Schedule tasks into parallel execution rounds (topological sort)."""
        # Build dependency graph
        task_map = {t.id: t for t in tasks}
        in_degree = {t.id: len(t.dependencies) for t in tasks}
        dependents = {t.id: [] for t in tasks}
        
        for t in tasks:
            for dep in t.dependencies:
                if dep in dependents:
                    dependents[dep].append(t.id)
        
        # Topological sort into rounds
        rounds = []
        ready = [t.id for t in tasks if in_degree[t.id] == 0]
        
        while ready:
            rounds.append(sorted(ready))
            next_ready = []
            
            for tid in ready:
                for dep_id in dependents.get(tid, []):
                    in_degree[dep_id] -= 1
                    if in_degree[dep_id] == 0:
                        next_ready.append(dep_id)
            
            ready = next_ready
        
        return rounds
    
    def _compute_critical_path(self, tasks: list[TaskDecomposition],
                                execution_order: list[list[str]]) -> float:
        """Compute critical path duration."""
        if not tasks:
            return 0.0
        
        task_map = {t.id: t for t in tasks}
        
        # Longest path to each node
        longest = {t.id: t.estimated_minutes for t in tasks}
        
        for round_tasks in execution_order:
            for tid in round_tasks:
                task = task_map.get(tid)
                if task:
                    for dep in task.dependencies:
                        if dep in longest:
                            longest[tid] = max(
                                longest.get(tid, 0),
                                longest[dep] + task.estimated_minutes
                            )
        
        return max(longest.values()) if longest else 0.0
    
    # ── SPECULATIVE EXECUTION ────────────────────────────────
    
    def can_speculate(self, task_a: TaskDecomposition, 
                      task_b: TaskDecomposition) -> bool:
        """
        Can we start task B before task A finishes?
        
        Speculative execution: start dependent tasks early when
        the dependency is likely to succeed (high success rate agent).
        """
        # B depends on A
        if task_a.id not in task_b.dependencies:
            return True  # No dependency, always parallelizable
        
        # Check if A's assigned agent has high success rate
        agent = self.capabilities.get(task_a.assigned_agent)
        if agent and agent.success_rate > 0.85:
            # High confidence A will succeed → start B speculatively
            return True
        
        # Check if A's output is predictable enough
        if task_a.complexity < 0.4:
            return True
        
        return False
    
    def spec_execution_order(self, tasks: list[TaskDecomposition]) -> list[list[str]]:
        """
        Build execution order with speculative parallelism.
        Tasks that can_speculate are scheduled earlier.
        """
        base_order = self._schedule_execution(tasks)
        
        # In production: adjust order to pull forward speculatable tasks
        # For now: return base order with speculative annotations
        return base_order
    
    # ── DYNAMIC RE-PLANNING ──────────────────────────────────
    
    def replan_on_failure(self, failed_task_id: str, 
                          tasks: list[TaskDecomposition],
                          reason: str) -> CoordinationPlan:
        """
        Re-plan when a task fails.
        
        Strategies:
        1. Reassign to fallback agent
        2. Split task into smaller sub-tasks
        3. Escalate to council if critical path
        """
        task_map = {t.id: t for t in tasks}
        failed_task = task_map.get(failed_task_id)
        
        if not failed_task:
            return self.plan(f"Handle failure: {reason}")
        
        # Try fallback agent
        fallback = self._select_fallback_agent(failed_task)
        if fallback:
            failed_task.assigned_agent = fallback
            failed_task.risk_factors.append(f"Reassigned from {failed_task.assigned_agent} to {fallback} due to: {reason}")
        
        # Rebuild plan
        return self.plan(f"Re-plan after {failed_task_id} failure: {reason}")
    
    # ── CAPABILITY LEARNING ──────────────────────────────────
    
    def update_capability(self, agent: str, task_category: TaskCategory,
                          success: bool, time_taken_minutes: float):
        """Update agent capability based on task outcome."""
        cap = self.capabilities.get(agent)
        if not cap:
            return
        
        # Update success rate (exponential moving average)
        alpha = 0.1  # Weight for new data
        new_success = 1.0 if success else 0.0
        cap.success_rate = (1 - alpha) * cap.success_rate + alpha * new_success
        
        # Update average time
        cap.avg_time_minutes = (1 - alpha) * cap.avg_time_minutes + alpha * time_taken_minutes
        
        # Persist
        self._save_capabilities()
    
    def _save_capabilities(self):
        """Save updated capabilities to disk."""
        self.capabilities_file.parent.mkdir(parents=True, exist_ok=True)
        
        data = {}
        for agent, cap in self.capabilities.items():
            data[agent] = {
                "success_rate": cap.success_rate,
                "avg_time_minutes": cap.avg_time_minutes,
                "max_complexity": cap.max_complexity,
            }
        
        with open(self.capabilities_file, 'w') as f:
            json.dump(data, f, indent=2)


# ═══════════════════════════════════════════════════════════════
# PIPELINE INTEGRATION
# ═══════════════════════════════════════════════════════════════

def marcus_coordinate(task: str, time_budget_hours: float = 48.0,
                      context: dict = None) -> CoordinationPlan:
    """
    Marcus calls this instead of _marcus_plan() in pipeline.py.
    
    Returns a full CoordinationPlan with agent assignments and execution order.
    """
    coordinator = AgenticCoordinator()
    return coordinator.plan(task, time_budget_hours, context)


# ═══════════════════════════════════════════════════════════════
# DIRECT TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    coordinator = AgenticCoordinator()
    
    tasks = [
        "Build auth system with login and signup",
        "Create REST API for product catalog",
        "Build responsive dashboard component",
        "Fix login timeout bug",
    ]
    
    for task in tasks:
        print(f"\n{'='*60}")
        print(f"  TASK: {task}")
        print(f"{'='*60}")
        
        plan = coordinator.plan(task)
        
        print(f"  Decomposed into: {len(plan.decompositions)} tasks")
        print(f"  Estimated total: {plan.estimated_total_minutes} min")
        print(f"  Critical path: {plan.critical_path_minutes} min")
        print(f"  Parallel gain: {plan.parallel_gain:.1f}x")
        print(f"  Execution rounds: {len(plan.execution_order)}")
        
        for i, round_tasks in enumerate(plan.execution_order):
            agents = [plan.agent_assignments.get(tid, "?") for tid in round_tasks]
            print(f"    Round {i+1}: {list(zip(round_tasks, agents))}")
        
        print(f"  Fallbacks: {plan.fallback_plan}")
        
        # Show agent selection rationale
        print(f"\n  Agent assignments:")
        for tid, agent in plan.agent_assignments.items():
            cap = coordinator.capabilities.get(agent)
            task_obj = next((t for t in plan.decompositions if t.id == tid), None)
            if cap and task_obj:
                score = cap.fitness_score(task_obj.category, task_obj.complexity)
                print(f"    {tid} → {agent} (fitness: {score:.0%}, category: {task_obj.category.value})")
