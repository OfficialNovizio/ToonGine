"""
CAOS — Memory MCP Tools

These are the tools Hermes agents call at runtime to search their own memory.
Registered automatically with Hermes MCP bridge via toongine init.

Tools:
- memory_search(query, agent?, type?, limit?) → Search all memories since forever
- memory_recall(start_date, end_date?, agent?) → Recall by date range
- memory_mistakes(context?, agent?, since_days?) → Find past mistakes
- memory_decisions(agent?, since_days?) → Recall all decisions
- memory_conversation(session_id?, since_days?) → Recall conversations
- memory_stats(agent?) → Get memory statistics
- memory_store_decision(agent, decision, context, stakeholders?) → Store a decision
"""

import json, time, os, sys
from pathlib import Path

# Add caos/ to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from memory_store import HybridMemoryManager

# Initialize the memory manager
_memory = HybridMemoryManager()


# ═══════════════════════════════════════════════════════════════
# MCP TOOL DEFINITIONS
# ═══════════════════════════════════════════════════════════════

def memory_search(query: str, agent: str = None, 
                  memory_type: str = None, limit: int = 10) -> dict:
    """
    Search ALL agent memories including from months ago.
    Use this when you need to remember something from the past.
    
    Examples:
    - memory_search("auth architecture decision")
    - memory_search("deployment", agent="dev", memory_type="mistake")
    """
    results = _memory.memory_search(query, agent, memory_type, limit)
    
    return {
        "query": query,
        "results": len(results),
        "memories": [
            {
                "agent": r["agent"],
                "type": r["memory_type"],
                "content": r["content"][:300],
                "date": time.strftime("%Y-%m-%d", time.localtime(r["timestamp"])),
                "snippet": r.get("snippet", "")[:200],
            }
            for r in results
        ],
    }


def memory_recall(start_date: str, end_date: str = None,
                  agent: str = None) -> dict:
    """
    Recall all memories from a specific time period.
    
    Args:
        start_date: ISO date string "2026-03-01"
        end_date: ISO date string "2026-03-31" (default: now)
        agent: Optional agent filter
    
    Example:
    - memory_recall("2026-03-01", "2026-03-31", agent="dev")
    """
    from datetime import datetime
    
    start_ts = datetime.fromisoformat(start_date).timestamp()
    end_ts = datetime.fromisoformat(end_date).timestamp() if end_date else time.time()
    
    results = _memory.memory_recall_period(start_ts, end_ts, agent)
    
    # Group by type
    by_type = {}
    for r in results:
        t = r["memory_type"]
        if t not in by_type:
            by_type[t] = []
        by_type[t].append({
            "content": r["content"][:200],
            "date": time.strftime("%Y-%m-%d", time.localtime(r["timestamp"])),
        })
    
    return {
        "period": f"{start_date} to {end_date or 'now'}",
        "agent": agent or "all",
        "total": len(results),
        "by_type": {t: len(mems) for t, mems in by_type.items()},
        "highlights": [
            m["content"][:150] for m in results[:5]
        ],
    }


def memory_mistakes(context: str = None, agent: str = None,
                    since_days: int = None, min_severity: int = 1) -> dict:
    """
    Find past mistakes — prevents repeating errors. Call BEFORE starting a task.
    
    Args:
        context: What task are you about to do? ("auth middleware")
        agent: Whose mistakes to check (None = all agents)
        since_days: How far back? (None = all time, even months ago)
        min_severity: Minimum severity level (1-5)
    
    Example:
    - memory_mistakes(context="auth middleware", since_days=90)
    """
    results = _memory.long_term_memory.recall_mistakes(
        context, agent, since_days, min_severity
    )
    
    return {
        "warning": f"Found {len(results)} past mistakes. DO NOT REPEAT.",
        "mistakes": [
            {
                "agent": r["agent"],
                "content": r["content"][:200],
                "date": time.strftime("%Y-%m-%d", time.localtime(r["timestamp"])),
                "severity": json.loads(r.get("metadata_json", "{}")).get("severity", 3),
                "repeat_count": json.loads(r.get("metadata_json", "{}")).get("repeat_count", 1),
                "snippet": r.get("snippet", "")[:200],
            }
            for r in results
        ],
    }


def memory_decisions(agent: str = None, since_days: int = None,
                     limit: int = 20) -> dict:
    """
    Recall all decisions made. Critical for institutional knowledge.
    
    Args:
        agent: Whose decisions (None = all)
        since_days: How far back? (None = ALL decisions ever made)
    
    Example:
    - memory_decisions(since_days=180)  # decisions from last 6 months
    """
    results = _memory.memory_decisions(agent, since_days)
    
    return {
        "total_decisions": len(results),
        "agent": agent or "all",
        "period": f"last {since_days} days" if since_days else "all time",
        "decisions": [
            {
                "agent": r["agent"],
                "decision": r["content"][:250],
                "date": time.strftime("%Y-%m-%d", time.localtime(r["timestamp"])),
            }
            for r in results[:limit]
        ],
    }


def memory_conversation(session_id: str = None, 
                        since_days: int = None) -> dict:
    """
    Recall past conversations and what was discussed.
    
    Args:
        session_id: Specific session to recall (None = recent)
        since_days: How far back for recent conversations
    
    Example:
    - memory_conversation(since_days=30)
    """
    results = _memory.memory_conversation(session_id, since_days=since_days)
    
    # Group by session
    by_session = {}
    for r in results:
        sid = r.get("session_id", "unknown")
        if sid not in by_session:
            by_session[sid] = []
        by_session[sid].append(r["content"][:200])
    
    return {
        "sessions": len(by_session),
        "messages": len(results),
        "by_session": {
            sid: len(msgs) for sid, msgs in by_session.items()
        },
        "excerpts": [
            {
                "session": sid,
                "agent": results[i]["agent"],
                "content": msgs[0][:200] if msgs else "",
                "date": time.strftime("%Y-%m-%d", time.localtime(results[i]["timestamp"])),
            }
            for i, (sid, msgs) in enumerate(by_session.items())
            if i < 5
        ],
    }


def memory_stats(agent: str = None) -> dict:
    """
    Get memory statistics — how much does this agent/store remember?
    
    Example:
    - memory_stats(agent="dev")
    - memory_stats()  # entire store stats
    """
    return _memory.memory_stats(agent)


def memory_store_decision(agent: str, decision: str, context: str,
                          stakeholders: list = None,
                          session_id: str = "manual") -> dict:
    """
    Store an important decision for institutional memory.
    Other agents can recall this later.
    
    Args:
        agent: Who made the decision
        decision: What was decided
        context: Why was this decided
        stakeholders: Who else was involved
        session_id: Current session ID
    
    Example:
    - memory_store_decision("marcus", "Use JWT for auth", "Easier than sessions",
                            stakeholders=["dev", "raj"])
    """
    _memory.store_decision(agent, decision, context, session_id, stakeholders)
    return {
        "stored": True,
        "agent": agent,
        "decision": decision[:100],
        "timestamp": time.strftime("%Y-%m-%d %H:%M"),
    }


# ═══════════════════════════════════════════════════════════════
# MCP TOOL REGISTRY (for Hermes auto-wiring)
# ═══════════════════════════════════════════════════════════════

MEMORY_MCP_TOOLS = {
    "memory_search": {
        "description": "Search ALL agent memories including from months ago. Use when you need to remember something from the past.",
        "parameters": {
            "query": {"type": "string", "description": "What to search for"},
            "agent": {"type": "string", "description": "Optional: filter by agent name"},
            "memory_type": {"type": "string", "description": "Optional: mistake, decision, episodic, etc."},
            "limit": {"type": "integer", "description": "Max results (default 10)"},
        },
    },
    "memory_recall": {
        "description": "Recall all memories from a specific time period. 'What happened in March?'",
        "parameters": {
            "start_date": {"type": "string", "description": "ISO date: '2026-03-01'"},
            "end_date": {"type": "string", "description": "ISO date: '2026-03-31' (default: now)"},
            "agent": {"type": "string", "description": "Optional: filter by agent"},
        },
    },
    "memory_mistakes": {
        "description": "Find past mistakes before starting a task. Prevents repeating errors from months ago.",
        "parameters": {
            "context": {"type": "string", "description": "What task are you about to do?"},
            "agent": {"type": "string", "description": "Whose mistakes to check"},
            "since_days": {"type": "integer", "description": "How far back? None = all time"},
        },
    },
    "memory_decisions": {
        "description": "Recall all decisions made. 'What did we decide about the database?'",
        "parameters": {
            "agent": {"type": "string", "description": "Whose decisions"},
            "since_days": {"type": "integer", "description": "How far back? None = all decisions ever"},
        },
    },
    "memory_conversation": {
        "description": "Recall past conversations. 'What did we talk about last session?'",
        "parameters": {
            "session_id": {"type": "string", "description": "Specific session to recall"},
            "since_days": {"type": "integer", "description": "Recent conversations from last N days"},
        },
    },
    "memory_stats": {
        "description": "Get memory statistics for an agent or the entire store.",
        "parameters": {
            "agent": {"type": "string", "description": "Optional: agent name (omit for store stats)"},
        },
    },
    "memory_store_decision": {
        "description": "Store an important decision so other agents can recall it later.",
        "parameters": {
            "agent": {"type": "string", "description": "Who made the decision"},
            "decision": {"type": "string", "description": "What was decided"},
            "context": {"type": "string", "description": "Why this decision"},
            "stakeholders": {"type": "array", "description": "Other agents involved"},
            "session_id": {"type": "string", "description": "Current session ID"},
        },
    },
}

# Tool handler mapping
TOOL_HANDLERS = {
    "memory_search": memory_search,
    "memory_recall": memory_recall,
    "memory_mistakes": memory_mistakes,
    "memory_decisions": memory_decisions,
    "memory_conversation": memory_conversation,
    "memory_stats": memory_stats,
    "memory_store_decision": memory_store_decision,
}


def handle_tool_call(tool_name: str, arguments: dict) -> dict:
    """MCP tool dispatch."""
    handler = TOOL_HANDLERS.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}
    
    try:
        return handler(**arguments)
    except Exception as e:
        return {"error": str(e), "tool": tool_name}
