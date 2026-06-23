"""
CAOS — Agent Registry: Single Source of Truth for All Agents

Every agent in the system is defined HERE. Not in pipeline.py, not in council.py,
not in agentic_coordinator.py. One file. One truth.

Supports: add, remove, edit, list, suspend, reinstate — at runtime, no code changes.

Usage:
    from agent_registry import AgentRegistry
    reg = AgentRegistry()
    
    # Add a new agent
    reg.add("nova", dept="frontend", categories=["frontend_ui", "testing_qa"],
            specializations=["React", "Next.js", "playwright"])
    
    # Remove an agent (archives, doesn't delete)
    reg.remove("old_agent")
    
    # Edit an agent
    reg.edit("raj", success_rate=0.92, specializations=["Python", "TypeScript", "Rust"])
    
    # List all active agents
    active = reg.active_agents()  # → ["dev", "raj", "mia", "quinn", ...]
    
    # Get department
    dept = reg.get_department("mia")  # → "frontend"
    
    # Get capability for coordinator
    cap = reg.get_capability("raj")  # → AgentCapability object
"""

import json, time, os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


# ═══════════════════════════════════════════════════════════════
# TYPES
# ═══════════════════════════════════════════════════════════════

class AgentStatus(Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"
    RETIRED = "retired"

class Department(Enum):
    TECHNICAL = "technical"
    FRONTEND = "frontend"
    BACKEND = "backend"  
    TESTING = "testing"
    SECURITY = "security"
    DESIGN = "design"
    MARKETING = "marketing"
    FINANCE = "finance"
    LEGAL = "legal"
    RESEARCH = "research"
    PSYCHOLOGY = "psychology"
    EXECUTIVE = "executive"
    OPERATIONS = "operations"
    UNKNOWN = "unknown"

class TaskCategory(Enum):
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
class AgentDefinition:
    """Complete definition of one agent."""
    name: str
    department: Department
    role: str                            # Human-readable role title
    status: AgentStatus = AgentStatus.ACTIVE
    council_member: bool = False         # Sits on the Advisory Council?
    council_vote_weight: int = 1         # Vote weight (CEO gets 2)
    can_delegate: bool = True            # Can spawn sub-agents?
    is_orchestrator: bool = False        # Can coordinate other agents?
    categories: list[str] = field(default_factory=list)  # TaskCategory values
    specializations: list[str] = field(default_factory=list)
    success_rate: float = 0.80
    avg_time_minutes: float = 45.0
    max_complexity: float = 0.7
    fallback_agent: str = ""             # Who takes over if suspended
    created: float = field(default_factory=time.time)
    archived_at: float = 0.0
    notes: str = ""


# ═══════════════════════════════════════════════════════════════
# DEFAULT AGENTS — The Core Team
# ═══════════════════════════════════════════════════════════════

DEFAULT_AGENTS = [
    # ── Executive ──────────────────────────────────────────────
    AgentDefinition("marcus", Department.EXECUTIVE, "CEO",
        council_member=True, council_vote_weight=2, 
        can_delegate=True, is_orchestrator=True,
        categories=["architecture", "unknown"],
        specializations=["system design", "strategic planning"],
        success_rate=0.90, avg_time_minutes=60, max_complexity=1.0,
        fallback_agent="diana"),
    AgentDefinition("diana", Department.OPERATIONS, "COO",
        council_member=True, council_vote_weight=1,
        can_delegate=True, is_orchestrator=True,
        categories=["devops_infra", "architecture"],
        specializations=["scheduling", "resource allocation", "operations"],
        success_rate=0.88, avg_time_minutes=45, max_complexity=0.9,
        fallback_agent="marcus"),
    
    # ── Technical ──────────────────────────────────────────────
    AgentDefinition("dev", Department.TECHNICAL, "Senior Engineer",
        categories=["architecture", "backend_api", "bug_fix", "performance"],
        specializations=["system design", "Go", "Rust", "distributed systems"],
        success_rate=0.85, avg_time_minutes=45, max_complexity=0.9,
        fallback_agent="raj"),
    AgentDefinition("raj", Department.BACKEND, "Backend Lead",
        categories=["backend_api", "database", "performance"],
        specializations=["Python", "TypeScript", "PostgreSQL", "API design"],
        success_rate=0.88, avg_time_minutes=40, max_complexity=0.85,
        fallback_agent="dev"),
    AgentDefinition("mia", Department.FRONTEND, "Frontend Lead",
        categories=["frontend_ui", "documentation"],
        specializations=["React", "Next.js", "CSS", "design systems"],
        success_rate=0.82, avg_time_minutes=35, max_complexity=0.75,
        fallback_agent="kai"),
    AgentDefinition("quinn", Department.TESTING, "QA Lead",
        categories=["testing_qa", "security_audit", "bug_fix"],
        specializations=["testing", "security audit", "code review", "CI/CD"],
        success_rate=0.92, avg_time_minutes=25, max_complexity=0.7,
        fallback_agent="dev"),
    AgentDefinition("kahneman", Department.PSYCHOLOGY, "Bias Auditor",
        council_member=True, council_vote_weight=1,
        can_delegate=False, is_orchestrator=False,
        categories=["testing_qa", "architecture"],
        specializations=["cognitive bias detection", "reasoning audit", "decision quality"],
        success_rate=0.95, avg_time_minutes=15, max_complexity=0.95,
        fallback_agent="quinn"),
    
    # ── Marketing / Design ─────────────────────────────────────
    AgentDefinition("kai", Department.DESIGN, "UI Designer",
        categories=["frontend_ui", "documentation"],
        specializations=["UI/UX", "accessibility", "design tokens"],
        success_rate=0.78, avg_time_minutes=30, max_complexity=0.65,
        fallback_agent="mia"),
    AgentDefinition("lena", Department.DESIGN, "UX Designer",
        categories=["frontend_ui", "documentation"],
        specializations=["animation", "responsive design", "mobile-first"],
        success_rate=0.80, avg_time_minutes=30, max_complexity=0.7,
        fallback_agent="kai"),
    
    # ── DevOps ─────────────────────────────────────────────────
    AgentDefinition("rio", Department.TECHNICAL, "DevOps Engineer",
        categories=["devops_infra", "performance"],
        specializations=["Docker", "Kubernetes", "CI/CD", "monitoring"],
        success_rate=0.84, avg_time_minutes=50, max_complexity=0.85,
        fallback_agent="dev"),
    
    # ── Backend Support ────────────────────────────────────────
    AgentDefinition("nate", Department.BACKEND, "Backend Developer",
        categories=["backend_api", "database"],
        specializations=["Node.js", "MongoDB", "Redis", "WebSocket"],
        success_rate=0.80, avg_time_minutes=35, max_complexity=0.7,
        fallback_agent="raj"),
    
    # ── Finance / Legal ────────────────────────────────────────
    AgentDefinition("felix", Department.FINANCE, "Financial Controller",
        council_member=True, council_vote_weight=1,
        categories=["architecture", "security_audit"],
        specializations=["security", "compliance", "system architecture"],
        success_rate=0.86, avg_time_minutes=40, max_complexity=0.9,
        fallback_agent="dev"),
    
    # ── Research ───────────────────────────────────────────────
    AgentDefinition("vette", Department.RESEARCH, "Research Lead",
        categories=["architecture", "documentation"],
        specializations=["research", "literature review", "competitive analysis"],
        success_rate=0.83, avg_time_minutes=50, max_complexity=0.8,
        fallback_agent="dev"),
    AgentDefinition("depth", Department.RESEARCH, "Deep Researcher",
        categories=["architecture", "documentation"],
        specializations=["deep research", "technical writing", "data analysis"],
        success_rate=0.81, avg_time_minutes=55, max_complexity=0.75,
        fallback_agent="vette"),
]

DEPARTMENT_AGENTS = {
    Department.EXECUTIVE: ["marcus"],
    Department.OPERATIONS: ["diana"],
    Department.TECHNICAL: ["dev", "rio"],
    Department.BACKEND: ["raj", "nate"],
    Department.FRONTEND: ["mia"],
    Department.TESTING: ["quinn"],
    Department.DESIGN: ["kai", "lena"],
    Department.MARKETING: ["kai", "lena"],
    Department.FINANCE: ["felix"],
    Department.LEGAL: [],
    Department.RESEARCH: ["vette", "depth"],
    Department.PSYCHOLOGY: ["kahneman"],
    Department.SECURITY: [],
}

# Default fallback chain: who takes over if no fallback specified
DEFAULT_FALLBACK_CHAIN = ["dev", "raj", "quinn"]


# ═══════════════════════════════════════════════════════════════
# AGENT REGISTRY
# ═══════════════════════════════════════════════════════════════

class AgentRegistry:
    """
    Single source of truth for all agents.
    
    Singleton pattern — everyone imports the same instance.
    """
    
    _instance = None
    
    def __new__(cls, toon_dir: str = ".toon"):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, toon_dir: str = ".toon"):
        if self._initialized:
            return
        self._initialized = True
        
        self.toon_dir = Path(toon_dir)
        self.registry_dir = self.toon_dir / "hermes" / "caos" / "registry"
        self.registry_dir.mkdir(parents=True, exist_ok=True)
        
        self.registry_file = self.registry_dir / "agents.json"
        self._agents: dict[str, AgentDefinition] = {}
        self._load()
    
    def _load(self):
        """Load agents from disk, or initialize with defaults."""
        if self.registry_file.exists():
            try:
                with open(self.registry_file) as f:
                    data = json.load(f)
                    for name, agent_data in data.get("agents", {}).items():
                        self._agents[name] = AgentDefinition(
                            name=name,
                            department=Department(agent_data["department"]),
                            role=agent_data.get("role", ""),
                            status=AgentStatus(agent_data.get("status", "active")),
                            council_member=agent_data.get("council_member", False),
                            council_vote_weight=agent_data.get("council_vote_weight", 1),
                            can_delegate=agent_data.get("can_delegate", True),
                            is_orchestrator=agent_data.get("is_orchestrator", False),
                            categories=agent_data.get("categories", []),
                            specializations=agent_data.get("specializations", []),
                            success_rate=agent_data.get("success_rate", 0.80),
                            avg_time_minutes=agent_data.get("avg_time_minutes", 45.0),
                            max_complexity=agent_data.get("max_complexity", 0.7),
                            fallback_agent=agent_data.get("fallback_agent", ""),
                            created=agent_data.get("created", time.time()),
                            archived_at=agent_data.get("archived_at", 0),
                            notes=agent_data.get("notes", ""),
                        )
                return
            except Exception as e:
                pass  # Fall through to defaults
        
        # Load defaults
        for agent in DEFAULT_AGENTS:
            self._agents[agent.name] = agent
        self._save()
    
    def _save(self):
        """Persist registry to disk."""
        data = {"agents": {}, "updated": time.time()}
        for name, agent in self._agents.items():
            data["agents"][name] = {
                "department": agent.department.value,
                "role": agent.role,
                "status": agent.status.value,
                "council_member": agent.council_member,
                "council_vote_weight": agent.council_vote_weight,
                "can_delegate": agent.can_delegate,
                "is_orchestrator": agent.is_orchestrator,
                "categories": agent.categories,
                "specializations": agent.specializations,
                "success_rate": agent.success_rate,
                "avg_time_minutes": agent.avg_time_minutes,
                "max_complexity": agent.max_complexity,
                "fallback_agent": agent.fallback_agent,
                "created": agent.created,
                "archived_at": agent.archived_at,
                "notes": agent.notes,
            }
        with open(self.registry_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    # ── QUERY ─────────────────────────────────────────────────
    
    def get(self, name: str) -> Optional[AgentDefinition]:
        """Get an agent by name."""
        return self._agents.get(name.lower())
    
    def exists(self, name: str) -> bool:
        """Check if an agent exists."""
        return name.lower() in self._agents
    
    def active_agents(self) -> list[str]:
        """List all active (non-archived, non-suspended) agent names."""
        return [n for n, a in self._agents.items() 
                if a.status == AgentStatus.ACTIVE]
    
    def all_agents(self) -> list[str]:
        """List ALL agent names including archived."""
        return list(self._agents.keys())
    
    def agents_by_department(self, dept: Department) -> list[str]:
        """Get agents in a department."""
        return [n for n, a in self._agents.items() 
                if a.department == dept and a.status == AgentStatus.ACTIVE]
    
    def council_members(self) -> list[str]:
        """Get council members."""
        return [n for n, a in self._agents.items() 
                if a.council_member and a.status == AgentStatus.ACTIVE]
    
    def orchestrators(self) -> list[str]:
        """Get agents that can orchestrate others."""
        return [n for n, a in self._agents.items() 
                if a.is_orchestrator and a.status == AgentStatus.ACTIVE]
    
    def get_department(self, name: str) -> str:
        """Get department string for an agent."""
        agent = self.get(name)
        return agent.department.value if agent else "unknown"
    
    def get_capability(self, name: str):
        """Get agent as AgentCapability for the coordinator."""
        from agentic_coordinator import AgentCapability, TaskCategory as TC
        agent = self.get(name)
        if not agent:
            return None
        
        try:
            categories = [TC(c) for c in agent.categories if c in TC._value2member_map_]
        except (AttributeError, ValueError):
            categories = []
        
        return AgentCapability(
            agent=agent.name,
            categories=categories,
            success_rate=agent.success_rate,
            avg_time_minutes=agent.avg_time_minutes,
            max_complexity=agent.max_complexity,
            specializations=agent.specializations,
        )
    
    def get_fallback(self, name: str) -> str:
        """Get fallback agent. If none specified, return from default chain."""
        agent = self.get(name)
        if agent and agent.fallback_agent and self.exists(agent.fallback_agent):
            if self.get(agent.fallback_agent).status == AgentStatus.ACTIVE:
                return agent.fallback_agent
        
        # Try default chain
        for fb in DEFAULT_FALLBACK_CHAIN:
            if fb != name and self.exists(fb) and self.get(fb).status == AgentStatus.ACTIVE:
                return fb
        
        # Last resort: first active agent that isn't this one
        for n in self.active_agents():
            if n != name:
                return n
        
        return name  # No fallback available
    
    # ── MUTATE ────────────────────────────────────────────────
    
    def add(self, name: str, dept: str = "technical", role: str = "",
            categories: list[str] = None, specializations: list[str] = None,
            success_rate: float = 0.80, avg_time_minutes: float = 45.0,
            max_complexity: float = 0.7, fallback_agent: str = "",
            council_member: bool = False, can_delegate: bool = True,
            is_orchestrator: bool = False, notes: str = "") -> AgentDefinition:
        """
        Add a new agent to the registry.
        
        Example:
            reg.add("nova", dept="frontend", role="UI Engineer",
                    categories=["frontend_ui", "testing_qa"],
                    specializations=["React", "Storybook", "playwright"])
        """
        name = name.lower().strip()
        
        if self.exists(name):
            raise ValueError(f"Agent '{name}' already exists. Use edit() to modify.")
        
        # Resolve department
        try:
            dept_enum = Department(dept)
        except ValueError:
            dept_enum = Department.UNKNOWN
        
        agent = AgentDefinition(
            name=name,
            department=dept_enum,
            role=role or name.title(),
            categories=categories or [],
            specializations=specializations or [],
            success_rate=success_rate,
            avg_time_minutes=avg_time_minutes,
            max_complexity=max_complexity,
            fallback_agent=fallback_agent,
            council_member=council_member,
            can_delegate=can_delegate,
            is_orchestrator=is_orchestrator,
            notes=notes,
        )
        
        self._agents[name] = agent
        self._save()
        
        # Initialize memory stores for new agent
        self._init_agent_stores(name)
        
        return agent
    
    def remove(self, name: str, archive: bool = True) -> bool:
        """
        Remove an agent. Archives by default (doesn't delete memories).
        
        Returns True if removed, False if not found.
        """
        agent = self.get(name)
        if not agent:
            return False
        
        if archive:
            agent.status = AgentStatus.ARCHIVED
            agent.archived_at = time.time()
            self._save()
        else:
            del self._agents[name.lower()]
            self._save()
        
        return True
    
    def edit(self, name: str, **kwargs) -> Optional[AgentDefinition]:
        """
        Edit an agent's properties.
        
        Example:
            reg.edit("raj", success_rate=0.92, 
                     specializations=["Python", "TypeScript", "Rust"])
        """
        agent = self.get(name)
        if not agent:
            return None
        
        for key, value in kwargs.items():
            if hasattr(agent, key):
                if key == "department" and isinstance(value, str):
                    try:
                        value = Department(value)
                    except ValueError:
                        continue
                if key == "status" and isinstance(value, str):
                    try:
                        value = AgentStatus(value)
                    except ValueError:
                        continue
                setattr(agent, key, value)
        
        self._save()
        return agent
    
    def suspend(self, name: str) -> bool:
        """Suspend an agent (can't take new tasks)."""
        return bool(self.edit(name, status=AgentStatus.SUSPENDED))
    
    def reinstate(self, name: str) -> bool:
        """Reinstate a suspended agent."""
        return bool(self.edit(name, status=AgentStatus.ACTIVE))
    
    # ── INTERNAL ──────────────────────────────────────────────
    
    def _init_agent_stores(self, name: str):
        """Initialize memory/strike directories for a new agent."""
        stores = [
            self.toon_dir / "memory" / name,
            self.toon_dir / "memory" / name / "sessions",
            self.toon_dir / "strikes",
            self.toon_dir / "state",
        ]
        for d in stores:
            d.mkdir(parents=True, exist_ok=True)
        
        # Initialize state file
        state_file = self.toon_dir / "state" / f"{name}_state.json"
        if not state_file.exists():
            with open(state_file, 'w') as f:
                json.dump({
                    "status": "fresh",
                    "total_tasks": 0,
                    "total_sessions": 0,
                    "created": time.time(),
                }, f, indent=2)


# ═══════════════════════════════════════════════════════════════
# GLOBAL INSTANCE
# ═══════════════════════════════════════════════════════════════

_registry = None

def get_registry(toon_dir: str = ".toon") -> AgentRegistry:
    """Get the global agent registry instance."""
    global _registry
    if _registry is None:
        _registry = AgentRegistry(toon_dir)
    return _registry


# ═══════════════════════════════════════════════════════════════
# CLICK CLI EXTENSION (for npx toongine agent ...)
# ═══════════════════════════════════════════════════════════════

def register_toongine_commands():
    """Register 'npx toongine agent' commands."""
    return {
        "command": "agent",
        "description": "Manage CAOS agents — add, remove, edit, list",
        "subcommands": {
            "list": {
                "description": "List all agents",
                "handler": lambda: _cli_list(),
            },
            "add": {
                "description": "Add a new agent",
                "usage": "npx toongine agent add <name> --dept frontend --role 'UI Engineer'",
                "handler": lambda args: _cli_add(args),
            },
            "remove": {
                "description": "Remove an agent (archives)",
                "usage": "npx toongine agent remove <name>",
                "handler": lambda args: _cli_remove(args),
            },
            "edit": {
                "description": "Edit an agent",
                "usage": "npx toongine agent edit <name> --success-rate 0.9",
                "handler": lambda args: _cli_edit(args),
            },
            "suspend": {
                "description": "Suspend an agent",
                "handler": lambda args: _cli_suspend(args),
            },
            "reinstate": {
                "description": "Reinstate a suspended agent",
                "handler": lambda args: _cli_reinstate(args),
            },
        },
    }

def _cli_list():
    reg = get_registry()
    print(f"\n{'='*60}")
    print(f"  CAOS Agent Registry")
    print(f"{'='*60}\n")
    
    for name in sorted(reg.all_agents()):
        agent = reg.get(name)
        status_icon = {"active": "✅", "suspended": "⛔", "archived": "📦", "retired": "👋"}
        icon = status_icon.get(agent.status.value, "❓")
        council = " 🏛️" if agent.council_member else ""
        orch = " 🎯" if agent.is_orchestrator else ""
        print(f"  {icon} {name:12s} | {agent.department.value:12s} | {agent.role:20s} | SR:{agent.success_rate:.0%}{council}{orch}")
    
    print(f"\n  Total: {len(reg.all_agents())} agents ({len(reg.active_agents())} active)")

def _cli_add(args):
    reg = get_registry()
    name = args.get("name", "")
    if not name:
        print("Usage: npx toongine agent add <name> [--dept ...] [--role ...]")
        return
    
    agent = reg.add(
        name=name,
        dept=args.get("dept", "technical"),
        role=args.get("role", name.title()),
        categories=args.get("categories", []),
        specializations=args.get("specializations", []),
        success_rate=float(args.get("success_rate", 0.80)),
    )
    print(f"✅ Agent '{agent.name}' added ({agent.department.value}, {agent.role})")

def _cli_remove(args):
    reg = get_registry()
    name = args.get("name", "")
    if not name:
        print("Usage: npx toongine agent remove <name>")
        return
    
    if reg.remove(name):
        print(f"📦 Agent '{name}' archived")
    else:
        print(f"❌ Agent '{name}' not found")

def _cli_edit(args):
    reg = get_registry()
    name = args.pop("name", None)
    if not name:
        print("Usage: npx toongine agent edit <name> [--key value ...]")
        return
    
    if reg.edit(name, **args):
        print(f"✅ Agent '{name}' updated")
    else:
        print(f"❌ Agent '{name}' not found")

def _cli_suspend(args):
    reg = get_registry()
    name = args.get("name", "")
    if reg.suspend(name):
        print(f"⛔ Agent '{name}' suspended")
    else:
        print(f"❌ Agent '{name}' not found")

def _cli_reinstate(args):
    reg = get_registry()
    name = args.get("name", "")
    if reg.reinstate(name):
        print(f"✅ Agent '{name}' reinstated")
    else:
        print(f"❌ Agent '{name}' not found")


# ═══════════════════════════════════════════════════════════════
# DIRECT TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    reg = AgentRegistry()
    
    print("=" * 60)
    print("  CURRENT AGENTS")
    print("=" * 60)
    _cli_list()
    
    print("\n" + "=" * 60)
    print("  ADDING NEW AGENT: nova")
    print("=" * 60)
    reg.add("nova", dept="frontend", role="UI Engineer",
            categories=["frontend_ui", "testing_qa"],
            specializations=["React", "Storybook", "playwright"],
            success_rate=0.85)
    
    print("\n" + "=" * 60)
    print("  EDITING AGENT: raj")
    print("=" * 60)
    reg.edit("raj", success_rate=0.92,
             specializations=["Python", "TypeScript", "Rust", "GraphQL"])
    
    print("\n" + "=" * 60)
    print("  COUNCIL MEMBERS")
    print("=" * 60)
    for name in reg.council_members():
        agent = reg.get(name)
        print(f"  🏛️  {name}: {agent.role} (vote weight: {agent.council_vote_weight})")
    
    print("\n" + "=" * 60)
    print("  DEPARTMENT: backend")
    print("=" * 60)
    for name in reg.agents_by_department(Department.BACKEND):
        agent = reg.get(name)
        print(f"  {name}: {agent.role}")
    
    print("\n" + "=" * 60)
    print("  FALLBACK CHAIN")
    print("=" * 60)
    for name in ["mia", "quinn", "nova"]:
        fb = reg.get_fallback(name)
        print(f"  {name} → {fb}")
