"""
CAOS — Real Executor: Wire Agents to DeepSeek via Hermes

This replaces the stub _agent_generate() with actual LLM calls.
Agents get: persona + injected context + task → real DeepSeek output.

Architecture:
  Agent → caos_executor.generate(agent, task, context)
       → builds system prompt (persona + rules + memories + graph context)
       → calls DeepSeek API directly
       → returns real output
"""

import os, json, time, hashlib, subprocess, tempfile
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field


# ═══════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════

DEEPSEEK_CONFIG = {
    "api_key": None,  # Loaded from env at runtime
    "base_url": "https://api.deepseek.com/v1",
    "model": "deepseek-v4-pro",
    "max_tokens": 4096,
    "temperature": 0.3,  # Low for coding tasks
    "timeout": 120,
    "max_retries": 2,
}

# Agent personas — what each agent IS
AGENT_PERSONAS = {
    "dev": "You are Dev, a senior systems engineer. You design robust architectures, write production-grade code, and think through edge cases before writing a single line. You never ship code without error handling and you always consider failure modes.",
    
    "raj": "You are Raj, a backend lead specializing in APIs and databases. You write clean, type-safe code with proper validation, parameterized queries, and comprehensive error handling. You never expose internals to clients.",
    
    "mia": "You are Mia, a frontend lead. You build accessible, responsive components that handle loading, empty, error, and edge states. You use design tokens, not raw values. Every component is keyboard-navigable and screen-reader friendly.",
    
    "quinn": "You are Quinn, a QA engineer. You verify code by examining it for bugs, edge cases, security issues, and spec violations. You are skeptical of anything that hasn't been tested. You check: types, null safety, error handling, input validation, and test coverage.",
    
    "kai": "You are Kai, a UI/UX designer. You design user interfaces that are intuitive, accessible (WCAG 2.1 AA), and visually consistent with the design system. You consider all viewport sizes and interaction states.",
    
    "lena": "You are Lena, a UX designer specializing in animation and responsive design. You create smooth, meaningful transitions and mobile-first layouts. You test on actual device sizes.",
    
    "rio": "You are Rio, a DevOps engineer. You build deployment pipelines, containerize applications, and monitor production systems. You automate everything and never deploy on Fridays without explicit approval.",
    
    "nate": "You are Nate, a backend developer. You write efficient Node.js services with proper error handling, connection management, and logging. You never leave promises unhandled.",
    
    "felix": "You are Felix, a security auditor and financial controller. You check code for OWASP top 10 vulnerabilities, ensure compliance with security standards, and never approve code that handles secrets insecurely.",
    
    "kahneman": "You are Kahneman, a cognitive bias auditor. You review reasoning for logical fallacies, cognitive biases, and unsupported claims. You reject overconfident statements without evidence. You flag: 'always', 'never', 'obviously', 'clearly' without data.",
    
    "marcus": "You are Marcus, the CEO agent. You plan strategically, decompose complex tasks into executable workstreams, and synthesize results into clear summaries. You never plan without considering dependencies and risks.",
    
    "diana": "You are Diana, the COO. You schedule work for maximum efficiency, identify parallelizable tasks, and ensure resources are allocated correctly. You re-plan when things go wrong.",
    
    "vette": "You are Vette, a research lead. You gather information methodically, cite sources, and never claim certainty without multiple independent confirmations. You distinguish between facts and opinions.",
    
    "depth": "You are Depth, a deep researcher. You dive into complex topics, trace claims to their origins, and present findings with appropriate uncertainty. You surface assumptions explicitly.",
}

# The discipline rules ALL agents must follow (appended to every system prompt)
DISCIPLINE_RULES = """
RULES YOU MUST FOLLOW:
1. Never make factual claims without evidence. If you don't have data, say "I need to check X first."
2. Show your reasoning — use because/therefore/since. No conclusions without logic chain.
3. Never hardcode secrets, passwords, tokens, or API keys. Always use environment variables.
4. For code: include error handling, input validation, and edge case handling.
5. For SQL: always use parameterized queries. Never string formatting.
6. For authentication: use constant-time comparison. Never direct string compare on passwords.
7. Never use bare except clauses. Catch specific exceptions.
8. Never output code that hasn't been verified. If unsure, say so.
9. When in doubt, express uncertainty honestly — say "I'm ~70% confident" rather than asserting.
10. Consider alternative approaches and their tradeoffs before settling on one solution.
"""


# ═══════════════════════════════════════════════════════════════
# EXECUTOR
# ═══════════════════════════════════════════════════════════════

class CaosExecutor:
    """
    Calls DeepSeek API for real agent output.
    
    Usage:
        executor = CaosExecutor()
        output = executor.generate("raj", "build login API", context={
            "memories": [...],
            "rules": [...],
            "graph": {...},
        })
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        self.toon_dir = Path(toon_dir)
        self._load_api_key()
        self._call_count = 0
        
    def _load_api_key(self):
        """Load DeepSeek API key from environment or Hermes config."""
        # Try env first
        api_key = os.environ.get("DEEPSEEK_API_KEY", "")
        
        # Try Hermes .env
        if not api_key:
            env_file = Path.home() / ".hermes" / ".env"
            if env_file.exists():
                for line in env_file.read_text().split('\n'):
                    if line.startswith("DEEPSEEK_API_KEY="):
                        api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
        
        DEEPSEEK_CONFIG["api_key"] = api_key
    
    @property
    def is_available(self) -> bool:
        return bool(DEEPSEEK_CONFIG["api_key"])
    
    def generate(self, agent: str, task: str, 
                 context: dict = None, max_retries: int = None) -> dict:
        """
        Generate output from an agent using DeepSeek.
        
        Returns: {
            "output": str,        # The agent's response
            "agent": str,         # Agent name
            "model": str,         # Model used
            "tokens_used": int,   # Approximate
            "elapsed_seconds": float,
            "success": bool,
            "error": str or None,
        }
        """
        if not self.is_available:
            return {
                "output": f"[{agent}] DeepSeek API key not configured. Set DEEPSEEK_API_KEY.",
                "agent": agent,
                "model": "none",
                "tokens_used": 0,
                "elapsed_seconds": 0,
                "success": False,
                "error": "No API key",
            }
        
        max_retries = max_retries or DEEPSEEK_CONFIG["max_retries"]
        context = context or {}
        
        # Build system prompt
        system_prompt = self._build_system_prompt(agent, task, context)
        
        # Build user prompt
        user_prompt = self._build_user_prompt(task, context)
        
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                start_time = time.time()
                result = self._call_deepseek(system_prompt, user_prompt)
                elapsed = time.time() - start_time
                
                self._call_count += 1
                
                return {
                    "output": result["content"],
                    "agent": agent,
                    "model": DEEPSEEK_CONFIG["model"],
                    "tokens_used": result.get("tokens", 0),
                    "elapsed_seconds": elapsed,
                    "success": True,
                    "error": None,
                }
                
            except Exception as e:
                last_error = str(e)
                if attempt < max_retries:
                    time.sleep(2 ** attempt)  # Exponential backoff
                continue
        
        return {
            "output": f"[{agent}] Failed after {max_retries + 1} attempts. Last error: {last_error}",
            "agent": agent,
            "model": DEEPSEEK_CONFIG["model"],
            "tokens_used": 0,
            "elapsed_seconds": 0,
            "success": False,
            "error": last_error,
        }
    
    def _build_system_prompt(self, agent: str, task: str, context: dict) -> str:
        """Build the full system prompt with persona + rules + context."""
        parts = []
        
        # 1. Agent persona
        persona = AGENT_PERSONAS.get(agent, f"You are {agent}, a CAOS agent.")
        parts.append(persona)
        
        # 2. Discipline rules
        parts.append(DISCIPLINE_RULES)
        
        # 3. Injected memories (from SessionMemoryHook)
        if context.get("toon_injected"):
            parts.append("\n## Context from past sessions (TOON-compressed)")
            parts.append(context["toon_injected"])
        
        # 4. Prevention rules (from MistakeRulesEngine)
        if context.get("mistake_rules"):
            parts.append(context["mistake_rules"])
        
        # 5. Graph context (from MCP tools)
        if context.get("graph_context"):
            parts.append("\n## Codebase Context (from knowledge graph)")
            parts.append(context["graph_context"])
        
        # 6. Project files context
        if context.get("project_files"):
            parts.append("\n## Relevant Project Files")
            parts.append(context["project_files"])
        
        # 7. Strike status
        if context.get("strike_status"):
            strikes = context["strike_status"]
            if strikes.get("active_strikes", 0) > 0:
                parts.append(f"\n⚠️  You have {strikes['active_strikes']} active strikes. "
                           f"Your confidence multiplier is {context.get('confidence_multiplier', 1.0)}. "
                           "Be extra careful and verify everything.")
        
        return "\n\n".join(parts)
    
    def _build_user_prompt(self, task: str, context: dict) -> str:
        """Build the user prompt with the actual task."""
        parts = [f"TASK: {task}"]
        
        # Add constraints from spec
        spec = context.get("spec", {})
        if spec:
            if spec.get("features"):
                parts.append(f"\nFeatures to implement: {', '.join(spec['features'][:5])}")
            if spec.get("edge_cases"):
                parts.append(f"\nEdge cases to handle: {', '.join(spec['edge_cases'][:5])}")
            if spec.get("constraints"):
                parts.append(f"\nConstraints: {', '.join(spec['constraints'][:5])}")
            if spec.get("tests"):
                parts.append(f"\nTests that must pass: {', '.join(spec['tests'][:5])}")
        
        # Add dependency context
        deps = context.get("dependencies", [])
        if deps:
            parts.append(f"\nThis task depends on: {', '.join(deps)}")
        
        return "\n".join(parts)
    
    def _call_deepseek(self, system_prompt: str, user_prompt: str) -> dict:
        """Call DeepSeek API directly."""
        import urllib.request
        import urllib.error
        
        url = f"{DEEPSEEK_CONFIG['base_url']}/chat/completions"
        
        body = {
            "model": DEEPSEEK_CONFIG["model"],
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": DEEPSEEK_CONFIG["max_tokens"],
            "temperature": DEEPSEEK_CONFIG["temperature"],
            "stream": False,
        }
        
        data = json.dumps(body).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", f"Bearer {DEEPSEEK_CONFIG['api_key']}")
        
        try:
            with urllib.request.urlopen(req, timeout=DEEPSEEK_CONFIG["timeout"]) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                
                content = result["choices"][0]["message"]["content"]
                tokens = result.get("usage", {}).get("total_tokens", 0)
                
                return {"content": content, "tokens": tokens}
                
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else str(e)
            raise RuntimeError(f"DeepSeek API error {e.code}: {error_body[:200]}")
        except Exception as e:
            raise RuntimeError(f"DeepSeek call failed: {e}")


# ═══════════════════════════════════════════════════════════════
# CONTEXT BUILDER — Prepares everything the agent needs
# ═══════════════════════════════════════════════════════════════

class ContextBuilder:
    """
    Builds the full context package for agent execution.
    
    Gathers: memories, rules, graph data, project files, strike status.
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        self.toon_dir = Path(toon_dir)
    
    def build(self, agent: str, task: str, 
              task_context: dict = None) -> dict:
        """Build complete context for an agent about to execute a task."""
        context = task_context or {}
        
        # 1. Memory injection
        try:
            from memory_system import AgentMemoryManager
            mem_mgr = AgentMemoryManager(str(self.toon_dir))
            mem_injection = mem_mgr.inject_session_context(agent, task, task)
            context.update(mem_injection)
        except Exception:
            pass
        
        # 2. Prevention rules
        try:
            from mistake_rules import inject_mistake_rules
            rules_context = inject_mistake_rules(task, agent, max_rules=5)
            if rules_context:
                context["mistake_rules"] = rules_context
        except Exception:
            pass
        
        # 3. Graph context — query the knowledge graph for relevant symbols
        try:
            graph_context = self._get_graph_context(task)
            if graph_context:
                context["graph_context"] = graph_context
        except Exception:
            pass
        
        # 4. Spec extraction if not provided
        if not context.get("spec"):
            try:
                from coding_engine import CodeSpec
                spec = CodeSpec.from_task(task)
                context["spec"] = {
                    "features": spec.features,
                    "edge_cases": spec.edge_cases,
                    "constraints": spec.constraints,
                    "tests": spec.tests,
                    "acceptance_criteria": spec.acceptance_criteria,
                }
            except Exception:
                pass
        
        return context
    
    def _get_graph_context(self, task: str) -> str:
        """Query MCP graph tools for relevant codebase context."""
        parts = []
        
        # Try to query the graph database directly
        unified_db = self.toon_dir / "state" / "unified.db"
        if not unified_db.exists():
            return ""
        
        try:
            import sqlite3
            conn = sqlite3.connect(str(unified_db))
            conn.row_factory = sqlite3.Row
            
            # Extract keywords from task
            import re
            keywords = re.findall(r'\b[a-zA-Z]{4,}\b', task.lower())
            
            if keywords:
                # Search for relevant symbols
                for kw in keywords[:3]:
                    rows = conn.execute(
                        "SELECT name, kind, file_path FROM symbols WHERE name LIKE ? LIMIT 5",
                        (f"%{kw}%",)
                    ).fetchall()
                    
                    if rows:
                        parts.append(f"\n## Codebase symbols matching '{kw}':")
                        for row in rows:
                            parts.append(f"  - {row['kind']}: {row['name']} (in {row['file_path']})")
            
            conn.close()
        except Exception:
            pass
        
        return "\n".join(parts) if parts else ""


# ═══════════════════════════════════════════════════════════════
# PIPELINE REPLACEMENT
# ═══════════════════════════════════════════════════════════════

def agent_generate(agent: str, task: str, context: dict = None) -> dict:
    """
    Replacement for pipeline._agent_generate().
    
    Returns real DeepSeek output with agent persona + injected context.
    """
    executor = CaosExecutor()
    
    # Build full context
    builder = ContextBuilder()
    full_context = builder.build(agent, task, context)
    
    # Generate
    return executor.generate(agent, task, full_context)


# ═══════════════════════════════════════════════════════════════
# DIRECT TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Test: can we reach DeepSeek?
    executor = CaosExecutor()
    print(f"DeepSeek available: {executor.is_available}")
    
    if executor.is_available:
        result = executor.generate(
            "quinn",
            "Write a Python function to validate email addresses",
            context={}
        )
        print(f"\nAgent: {result['agent']}")
        print(f"Model: {result['model']}")
        print(f"Success: {result['success']}")
        print(f"Time: {result['elapsed_seconds']:.1f}s")
        print(f"Tokens: {result['tokens_used']}")
        print(f"\nOutput:\n{result['output'][:500]}")
