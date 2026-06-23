"""
CAOS — Agent Memory System

Memory types (human-brain inspired):
1. Episodic — "what happened" (task logs, session events)
2. Semantic — "what I know" (facts, project knowledge, concepts)
3. Procedural — "how to do" (patterns, workflows, successful approaches)
4. Mistake — "what NOT to do" (errors, strikes, dead ends)
5. Working — "right now" (current task state, active plan)

All memories:
- Update after EVERY task/session
- Compress via TOON for context injection
- Inject into agent at session start
- Queryable via MCP graph tools
"""

import os, json, time, hashlib
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from pathlib import Path
from collections import OrderedDict


# ═══════════════════════════════════════════════════════════════
# MEMORY TYPES
# ═══════════════════════════════════════════════════════════════

class MemoryType(Enum):
    EPISODIC = "episodic"     # What happened
    SEMANTIC = "semantic"     # What I know
    PROCEDURAL = "procedural" # How to do
    MISTAKE = "mistake"       # What NOT to do
    WORKING = "working"       # Right now

@dataclass
class Memory:
    id: str
    agent: str
    type: MemoryType
    content: str
    context_hash: str         # SHA of the task context
    confidence: float = 1.0   # How certain is this memory?
    timestamp: float = field(default_factory=time.time)
    session_id: str = ""
    tags: list[str] = field(default_factory=list)
    toon_compressed: str = "" # TOON version for injection

@dataclass 
class MistakeNode:
    """A mistake stored as a queryable node in the knowledge graph."""
    id: str
    agent: str
    mistake_type: str
    context: str
    context_hash: str
    resolution: str
    severity: int            # 1-5
    repeat_count: int
    timestamp: float
    related_nodes: list[str] # graph node IDs this mistake relates to
    prevention_rule: str     # "IF X THEN check Y first"


# ═══════════════════════════════════════════════════════════════
# MEMORY MANAGER — Core Engine
# ═══════════════════════════════════════════════════════════════

class AgentMemoryManager:
    """
    Manages all 5 memory types for every agent.
    
    Flow:
    1. Session start → inject memories into agent context
    2. During task → working memory updated
    3. Task complete → all memories updated, mistakes recorded
    4. Session end → memories consolidated, TOON compressed
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        self.toon_dir = Path(toon_dir)
        self.memory_dir = self.toon_dir / "memory"
        self.mistakes_dir = self.toon_dir / "mistakes"
        self.state_dir = self.toon_dir / "state"
        
        for d in [self.memory_dir, self.mistakes_dir, self.state_dir]:
            d.mkdir(parents=True, exist_ok=True)
        
        # Per-agent memory stores (loaded on demand)
        self._memory_cache: dict[str, dict] = {}
    
    # ── SESSION START: Inject Memories ──────────────────────────
    
    def inject_session_context(self, agent: str, task: str, 
                                task_context: str) -> dict:
        """
        Called at session start. Injects all relevant memories into agent context.
        Returns a dict that becomes part of the agent's system prompt.
        
        What gets injected:
        - Top 5 relevant episodic memories (similar past tasks)
        - Top 3 mistakes (what NOT to repeat)
        - Top 3 procedural memories (patterns that worked)
        - Semantic facts about the project
        - Last session's state vector
        - Strike status + confidence multiplier
        """
        
        context_hash = hashlib.sha256(task_context.encode()).hexdigest()[:16]
        
        injection = {
            "agent": agent,
            "session_start": time.time(),
            "context_hash": context_hash,
            "memories": self._load_relevant_memories(agent, task, task_context),
            "mistakes": self._load_relevant_mistakes(agent, task_context),
            "procedures": self._load_procedural_memories(agent, task),
            "semantic_facts": self._load_semantic_facts(agent, task),
            "last_state": self._load_last_state(agent),
            "strike_status": self._get_strike_status(agent),
            "confidence_multiplier": self._get_confidence_multiplier(agent),
            "recent_sessions": self._get_recent_sessions(agent, limit=3),
        }
        
        # TOON compress for LLM context window
        injection["toon_injected"] = self._toon_compress_injection(injection)
        
        return injection
    
    def _load_relevant_memories(self, agent: str, task: str, 
                                 context: str, limit: int = 5) -> list[dict]:
        """Load episodic memories relevant to current task."""
        episodic = self._load_memories(agent, MemoryType.EPISODIC)
        
        # Score relevance by keyword overlap with task
        task_keywords = set(task.lower().split())
        scored = []
        for mem in episodic:
            mem_keywords = set(mem.get("tags", [])) | set(mem["content"].lower().split())
            relevance = len(task_keywords & mem_keywords)
            scored.append((relevance, mem))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [m[1] for m in scored[:limit]]
    
    def _load_relevant_mistakes(self, agent: str, context: str, 
                                 limit: int = 3) -> list[dict]:
        """Load mistakes relevant to current context. Prevent repeats."""
        mistakes = self._load_memories(agent, MemoryType.MISTAKE)
        context_hash = hashlib.sha256(context.encode()).hexdigest()[:16]
        
        # Prioritize: exact context match > similar type > recent
        scored = []
        for m in mistakes:
            score = 0
            if m.get("context_hash") == context_hash:
                score += 100  # Exact match — highest priority
            score += m.get("repeat_count", 1) * 10  # Repeated mistakes
            score += (time.time() - m["timestamp"]) / 86400 * -1  # Recent > old
            scored.append((score, m))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [m[1] for m in scored[:limit]]
    
    def _load_procedural_memories(self, agent: str, task: str, 
                                   limit: int = 3) -> list[dict]:
        """Load successful patterns for similar tasks."""
        procedural = self._load_memories(agent, MemoryType.PROCEDURAL)
        
        task_keywords = set(task.lower().split())
        scored = []
        for mem in procedural:
            mem_kw = set(mem.get("tags", []))
            relevance = len(task_keywords & mem_kw)
            scored.append((relevance, mem))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [m[1] for m in scored[:limit] if m[0] > 0]
    
    def _load_semantic_facts(self, agent: str, task: str) -> list[dict]:
        """Load facts the agent knows about the project."""
        semantic = self._load_memories(agent, MemoryType.SEMANTIC)
        
        task_keywords = set(task.lower().split())
        relevant = [m for m in semantic 
                    if any(kw in m["content"].lower() for kw in task_keywords)]
        
        return relevant[:5]
    
    def _load_last_state(self, agent: str) -> dict:
        """Load agent's state from last session."""
        state_file = self.state_dir / f"{agent}_state.json"
        if state_file.exists():
            with open(state_file) as f:
                return json.load(f)
        return {"status": "fresh", "total_tasks": 0, "total_sessions": 0}
    
    def _get_strike_status(self, agent: str) -> dict:
        """Get current strike status."""
        strikes_file = self.state_dir / "strikes" / f"{agent}.json"
        if strikes_file.exists():
            with open(strikes_file) as f:
                strikes = json.load(f)
            recent = [s for s in strikes if time.time() - s["timestamp"] < 30 * 86400]
            return {
                "active_strikes": len(recent),
                "max_repeat": max((s.get("repeat_count", 0) for s in recent), default=0),
                "status": "clean" if len(recent) == 0 else "flagged",
            }
        return {"active_strikes": 0, "max_repeat": 0, "status": "clean"}
    
    def _get_confidence_multiplier(self, agent: str) -> float:
        """Get confidence multiplier based on strike history."""
        status = self._get_strike_status(agent)
        max_repeat = status["max_repeat"]
        
        if max_repeat >= 5: return 0.0
        elif max_repeat >= 4: return 0.5
        elif max_repeat >= 2: return 0.8
        return 1.0
    
    def _get_recent_sessions(self, agent: str, limit: int = 3) -> list[dict]:
        """Get recent session summaries."""
        sessions_dir = self.memory_dir / agent / "sessions"
        if not sessions_dir.exists():
            return []
        
        sessions = sorted(sessions_dir.glob("*.json"), 
                         key=lambda p: p.stat().st_mtime, reverse=True)
        
        recent = []
        for sf in sessions[:limit]:
            with open(sf) as f:
                recent.append(json.load(f))
        return recent
    
    # ── TASK COMPLETE: Update All Memories ─────────────────────
    
    def update_after_task(self, agent: str, task: str, result: dict,
                          session_id: str):
        """
        Called after every task completes.
        Updates ALL memory types based on what happened.
        """
        
        context_hash = hashlib.sha256(task.encode()).hexdigest()[:16]
        now = time.time()
        
        # 1. Episodic: record what happened
        self._add_memory(agent, Memory(
            id=f"ep-{agent}-{int(now)}",
            agent=agent,
            type=MemoryType.EPISODIC,
            content=f"Task: {task}\nResult: {result.get('status')}\nOutput: {str(result.get('output',''))[:200]}",
            context_hash=context_hash,
            confidence=1.0,
            session_id=session_id,
            tags=self._extract_tags(task),
        ))
        
        # 2. Procedural: if task succeeded, record the pattern
        if result.get("success") or result.get("status") == "converged":
            self._add_memory(agent, Memory(
                id=f"proc-{agent}-{int(now)}",
                agent=agent,
                type=MemoryType.PROCEDURAL,
                content=f"Successful approach for: {task}\nMethod: {result.get('approach','')[:200]}",
                context_hash=context_hash,
                confidence=result.get("confidence", 0.85),
                session_id=session_id,
                tags=self._extract_tags(task),
            ))
        
        # 3. Semantic: extract facts learned
        if result.get("learnings"):
            for learning in result["learnings"]:
                self._add_memory(agent, Memory(
                    id=f"sem-{agent}-{int(now)}-{hashlib.sha256(learning.encode()).hexdigest()[:8]}",
                    agent=agent,
                    type=MemoryType.SEMANTIC,
                    content=learning,
                    context_hash=context_hash,
                    confidence=0.9,
                    session_id=session_id,
                    tags=self._extract_tags(task),
                ))
        
        # 4. Mistake: if task failed, record the mistake
        if not result.get("success") and result.get("status") not in ["converged", "completed"]:
            mistake = Memory(
                id=f"mist-{agent}-{int(now)}",
                agent=agent,
                type=MemoryType.MISTAKE,
                content=f"MISTAKE: {task}\nError: {result.get('error','')[:200]}\nResolution: {result.get('resolution','')[:200]}",
                context_hash=context_hash,
                confidence=1.0,
                session_id=session_id,
                tags=["mistake"] + self._extract_tags(task),
            )
            self._add_memory(agent, mistake)
            
            # Also add to mistake graph for cross-agent learning
            self._add_mistake_node(agent, task, result, context_hash)
        
        # 5. Update state vector
        self._update_state(agent, task, result)
        
        # 6. Consolidate to TOON
        self._consolidate_to_toon(agent)
    
    # ── SESSION END: Consolidate ────────────────────────────────
    
    def update_after_session(self, agent: str, session_id: str, 
                              session_summary: dict):
        """
        Called at session end. Consolidates all memories.
        - Summarizes the session
        - Archives old memories (keep last 100, TOON-compress older)
        - Updates agent's TOON MEMORY.md
        """
        
        # Save session summary
        sessions_dir = self.memory_dir / agent / "sessions"
        sessions_dir.mkdir(parents=True, exist_ok=True)
        
        with open(sessions_dir / f"{session_id}.json", 'w') as f:
            json.dump({
                "session_id": session_id,
                "timestamp": time.time(),
                "tasks_completed": session_summary.get("tasks_completed", 0),
                "mistakes_made": session_summary.get("mistakes", 0),
                "beliefs_killed": session_summary.get("beliefs_killed", 0),
                "learnings": session_summary.get("learnings", []),
                "state_snapshot": session_summary.get("state", {}),
            }, f, indent=2)
        
        # Update agent's MEMORY.md with new learnings
        self._update_agent_memory_md(agent)
        
        # Consolidate: keep last 100, TOON archive older
        self._consolidate_memories(agent, keep_recent=100)
        
        # Update state vector
        state = self._load_last_state(agent)
        state["total_sessions"] = state.get("total_sessions", 0) + 1
        state["total_tasks"] = state.get("total_tasks", 0) + session_summary.get("tasks_completed", 0)
        state["last_session"] = session_id
        state["last_active"] = time.time()
        
        self.state_dir.mkdir(parents=True, exist_ok=True)
        with open(self.state_dir / f"{agent}_state.json", 'w') as f:
            json.dump(state, f, indent=2)
    
    # ── MISTAKE GRAPH INTEGRATION ──────────────────────────────
    
    def _add_mistake_node(self, agent: str, task: str, result: dict, 
                          context_hash: str):
        """
        Add mistake as a queryable node in the knowledge graph.
        Other agents can query this to avoid repeating the same mistake.
        """
        
        mistake = MistakeNode(
            id=f"mistake-{agent}-{context_hash}",
            agent=agent,
            mistake_type=result.get("error_type", "unknown"),
            context=task,
            context_hash=context_hash,
            resolution=result.get("resolution", "unknown"),
            severity=result.get("severity", 3),
            repeat_count=result.get("repeat_count", 1),
            timestamp=time.time(),
            related_nodes=result.get("affected_files", []),
            prevention_rule=self._generate_prevention_rule(agent, task, result),
        )
        
        # Save to mistake directory
        self.mistakes_dir.mkdir(parents=True, exist_ok=True)
        mistake_file = self.mistakes_dir / f"{mistake.id}.json"
        
        with open(mistake_file, 'w') as f:
            json.dump({
                "id": mistake.id,
                "agent": mistake.agent,
                "type": mistake.mistake_type,
                "context": mistake.context,
                "context_hash": mistake.context_hash,
                "resolution": mistake.resolution,
                "severity": mistake.severity,
                "repeat_count": mistake.repeat_count,
                "timestamp": mistake.timestamp,
                "related": mistake.related_nodes,
                "prevention": mistake.prevention_rule,
            }, f, indent=2)
        
        # In production: also insert into unified.db as a node
        # INSERT INTO nodes (id, kind, name, content) 
        # VALUES (?, 'mistake', ?, ?)
    
    def _generate_prevention_rule(self, agent: str, task: str, 
                                   result: dict) -> str:
        """Generate a rule that prevents this mistake from recurring."""
        error_type = result.get("error_type", "unknown")
        context = task[:100]
        
        rules = {
            "security_gap": f"IF working on {context} THEN run security audit BEFORE commit",
            "type_error": f"IF working on {context} THEN run tsc --noEmit BEFORE submit",
            "test_failure": f"IF working on {context} THEN run test suite BEFORE declaring done",
            "hallucination": f"IF making claims about {context} THEN verify against codebase FIRST",
            "repeated_bug": f"IF fixing {context} THEN check strike history for past attempts",
        }
        
        return rules.get(error_type, f"IF {context} THEN double-check with self-counter")
    
    # ── MEMORY PERSISTENCE ─────────────────────────────────────
    
    def _add_memory(self, agent: str, memory: Memory):
        """Add a memory and persist to disk."""
        agent_dir = self.memory_dir / agent
        agent_dir.mkdir(parents=True, exist_ok=True)
        
        # TOON compress
        memory.toon_compressed = self._toon_compress(memory)
        
        # Save
        mem_file = agent_dir / f"{memory.id}.json"
        with open(mem_file, 'w') as f:
            json.dump({
                "id": memory.id,
                "agent": memory.agent,
                "type": memory.type.value,
                "content": memory.content,
                "context_hash": memory.context_hash,
                "confidence": memory.confidence,
                "timestamp": memory.timestamp,
                "session_id": memory.session_id,
                "tags": memory.tags,
                "toon": memory.toon_compressed,
            }, f, indent=2)
    
    def _load_memories(self, agent: str, mem_type: MemoryType) -> list[dict]:
        """Load all memories of a type for an agent."""
        agent_dir = self.memory_dir / agent
        if not agent_dir.exists():
            return []
        
        memories = []
        for mem_file in sorted(agent_dir.glob("*.json")):
            with open(mem_file) as f:
                data = json.load(f)
                if data.get("type") == mem_type.value:
                    memories.append(data)
        
        return memories
    
    def _consolidate_memories(self, agent: str, keep_recent: int = 100):
        """Keep last N memories active, TOON-archive older ones."""
        agent_dir = self.memory_dir / agent
        if not agent_dir.exists():
            return
        
        all_mems = sorted(agent_dir.glob("*.json"),
                         key=lambda p: p.stat().st_mtime, reverse=True)
        
        if len(all_mems) > keep_recent:
            archive_dir = self.memory_dir / agent / "archive"
            archive_dir.mkdir(exist_ok=True)
            
            for old_file in all_mems[keep_recent:]:
                # Move to archive
                old_file.rename(archive_dir / old_file.name)
    
    def _consolidate_to_toon(self, agent: str):
        """Compress all active memories into TOON format for LLM injection."""
        all_mems = []
        for mem_type in MemoryType:
            all_mems.extend(self._load_memories(agent, mem_type))
        
        # Sort by recency + confidence
        all_mems.sort(key=lambda m: m["timestamp"] * m.get("confidence", 1), reverse=True)
        
        # Top 50 memories → TOON
        toon_lines = ["---", f"# {agent} Memory (TOON)", ""]
        
        abbrev = {}
        abbrev_id = 0
        
        def ab(word):
            nonlocal abbrev_id
            if len(word) > 5 and word not in abbrev:
                abbrev[word] = f'§{abbrev_id}'
                abbrev_id += 1
            return abbrev.get(word, word)
        
        for mem in all_mems[:50]:
            mem_type = mem["type"][:3].upper()
            content = ab(mem["content"][:60])
            confidence = f"{mem.get('confidence', 1):.2f}"
            toon_lines.append(f"{mem_type}|{confidence}|{content}")
        
        if abbrev:
            toon_lines.append("---")
            for word, token in sorted(abbrev.items(), key=lambda x: int(x[1][1:])):
                toon_lines.append(f"{token}={word}")
        
        # Save TOON memory file
        toon_file = self.memory_dir / agent / "MEMORY.toon"
        toon_file.write_text('\n'.join(toon_lines))
    
    def _update_agent_memory_md(self, agent: str):
        """
        Update the agent's MEMORY.md with new learnings.
        This is what Hermes loads when spawning the agent.
        """
        agent_md_path = self.toon_dir / "agents" / self._get_agent_path(agent) / "MEMORY.md"
        
        if not agent_md_path.exists():
            return
        
        existing = agent_md_path.read_text()
        
        # Append recent learnings section
        recent_learnings = self._load_memories(agent, MemoryType.SEMANTIC)[-5:]
        recent_mistakes = self._load_memories(agent, MemoryType.MISTAKE)[-3:]
        
        learnings_section = "\n\n## Recent Learnings (Auto-Updated)\n"
        for l in recent_learnings:
            learnings_section += f"- {l['content'][:120]}\n"
        
        mistakes_section = "\n## Recent Mistakes (DO NOT REPEAT)\n"
        for m in recent_mistakes:
            mistakes_section += f"- {m['content'][:120]}\n"
        
        # Replace or append
        if "## Recent Learnings" in existing:
            # Remove old auto-updated section and replace
            parts = existing.split("## Recent Learnings")
            existing = parts[0]
        
        agent_md_path.write_text(existing + learnings_section + mistakes_section)
    
    def _update_state(self, agent: str, task: str, result: dict):
        """Update agent's state vector after task."""
        state = self._load_last_state(agent)
        state["last_task"] = task[:100]
        state["last_task_status"] = result.get("status", "unknown")
        state["total_tasks"] = state.get("total_tasks", 0) + 1
        
        if not result.get("success") and result.get("status") not in ["converged"]:
            state["consecutive_failures"] = state.get("consecutive_failures", 0) + 1
        else:
            state["consecutive_failures"] = 0
        
        self.state_dir.mkdir(parents=True, exist_ok=True)
        with open(self.state_dir / f"{agent}_state.json", 'w') as f:
            json.dump(state, f, indent=2)
    
    # ── HELPERS ────────────────────────────────────────────────
    
    def _extract_tags(self, text: str) -> list[str]:
        """Extract tags from task description."""
        keywords = ["auth", "login", "api", "database", "ui", "component",
                    "deploy", "test", "security", "performance", "bug", "fix",
                    "refactor", "build", "design", "migration"]
        return [kw for kw in keywords if kw in text.lower()]
    
    def _toon_compress(self, memory: Memory) -> str:
        """TOON compress a single memory."""
        content = memory.content[:100]
        tags = ','.join(memory.tags[:5])
        return f"{memory.type.value[:3]}|{memory.confidence:.2f}|{content}|{tags}"
    
    def _toon_compress_injection(self, injection: dict) -> str:
        """TOON compress entire session injection for LLM context."""
        lines = ["---", f"# Session Context: {injection['agent']}", ""]
        
        # Mistakes first (most important to prevent)
        if injection["mistakes"]:
            lines.append("## DO NOT REPEAT:")
            for m in injection["mistakes"]:
                lines.append(f"  - {m['content'][:80]}")
        
        # Then procedures
        if injection["procedures"]:
            lines.append("## PATTERNS THAT WORK:")
            for p in injection["procedures"]:
                lines.append(f"  - {p['content'][:80]}")
        
        # Then state
        state = injection["last_state"]
        lines.append(f"## STATE: {state.get('total_tasks',0)} tasks, "
                     f"multiplier: {injection['confidence_multiplier']}x")
        
        return '\n'.join(lines)
    
    def _get_agent_path(self, agent: str) -> str:
        """Map agent name to file path."""
        paths = {
            "marcus": "CEO/marcus",
            "diana": "COO/diana",
            "dev": "Technical/dev",
            "raj": "Technical/raj",
            "mia": "Technical/mia",
            "quinn": "Technical/quinn",
            "kai": "Marketing/kai",
            "lena": "Marketing/lena",
            "felix": "Finance/felix",
            "kahneman": "Psychology/kahneman",
        }
        return paths.get(agent, f"Technical/{agent}")


# ═══════════════════════════════════════════════════════════════
# TOONGINE INTEGRATION — Auto-trigger after session
# ═══════════════════════════════════════════════════════════════

class SessionMemoryHook:
    """
    Integrates with ToonGine/Hermes to auto-trigger memory updates.
    
    Hooks into:
    - After each delegate_task completes
    - After caos_run finishes
    - On session end (user disconnects)
    """
    
    def __init__(self):
        self.memory_manager = AgentMemoryManager()
    
    def on_task_complete(self, agent: str, task: str, result: dict, 
                         session_id: str):
        """Called after every delegated task finishes."""
        self.memory_manager.update_after_task(agent, task, result, session_id)
    
    def on_plan_complete(self, plan_id: str, agents: list[str], 
                         results: dict, session_id: str):
        """Called after full CAOS plan finishes."""
        for agent in agents:
            agent_results = results.get(agent, {})
            task = agent_results.get("task", f"Plan: {plan_id}")
            self.memory_manager.update_after_task(agent, task, agent_results, session_id)
    
    def on_before_task(self, agent: str, task: str, 
                       task_context: str) -> dict:
        """Called before agent starts a task. Injects memories."""
        return self.memory_manager.inject_session_context(agent, task, task_context)
    
    def on_session_end(self, agents: list[str], session_id: str,
                       summary: dict):
        """Called when session ends. Consolidates all memories."""
        for agent in agents:
            self.memory_manager.update_after_session(agent, session_id, summary)
