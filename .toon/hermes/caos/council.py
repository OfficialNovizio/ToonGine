"""
CAOS — Advisory Council + Strike System

The Council has real power. It threatens, demotes, suspends, and overrides agents.
Strikes escalate: Warning → Penalty → Council Review → Demotion → Suspension.
"""

import json, os, time, hashlib
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ═══════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════

class StrikeLevel(Enum):
    WARNING = 1     # No penalty
    PENALTY = 2     # Confidence multiplier 0.8×
    REVIEW = 3      # Council review required
    DEMOTION = 4    # Confidence 0.5×, restricted tools
    SUSPENSION = 5  # Agent removed, replacement spawned

class CouncilAction(Enum):
    THREATEN = "threaten"
    DEMOTE = "demote"
    SUSPEND = "suspend"
    OVERRIDE = "override"
    ESCALATE = "escalate"
    AMEND = "amend"

@dataclass
class Strike:
    id: str
    agent: str
    mistake_type: str
    context_hash: str
    severity: int  # 1-5
    timestamp: float
    issued_by: str
    resolution: str
    repeat_count: int = 1

@dataclass  
class CouncilMember:
    name: str
    role: str
    vote_weight: int  # 1 = normal, 2 = tiebreaker
    active: bool = True

@dataclass
class CouncilVote:
    action: CouncilAction
    target_agent: str
    reason: str
    votes_for: int
    votes_against: int
    passed: bool
    timestamp: float

@dataclass
class CouncilThreat:
    """Formal threat from the Council to an agent."""
    id: str
    to_agent: str
    strike_number: int
    pattern: str
    consequences: list[str]
    deadline_response_hours: int = 1
    resolved: bool = False
    agent_response: Optional[str] = None


# ═══════════════════════════════════════════════════════════════
# COUNCIL MEMBERS
# ═══════════════════════════════════════════════════════════════

COUNCIL = [
    CouncilMember("marcus", "CEO", vote_weight=2),      # Tiebreaker
    CouncilMember("diana", "COO", vote_weight=1),
    CouncilMember("felix", "Finance", vote_weight=1),
    CouncilMember("kahneman", "Psychology", vote_weight=1),  # Bias veto
    CouncilMember("board", "Board", vote_weight=1),         # Constitutional veto
]

COUNCIL_BY_NAME = {m.name: m for m in COUNCIL}
MAJORITY_THRESHOLD = 3  # 3 of 5


# ═══════════════════════════════════════════════════════════════
# STRIKE SYSTEM
# ═══════════════════════════════════════════════════════════════

def compute_context_hash(mistake_context: str) -> str:
    """Hash the context to detect repeated mistakes."""
    return hashlib.sha256(mistake_context.encode()).hexdigest()[:16]


def issue_strike(agent: str, mistake_type: str, context: str,
                 severity: int, issued_by: str, resolution: str,
                 strikes_path: str = ".toon/strikes/") -> Strike:
    """Issue a strike to an agent. Escalates if repeated context."""
    
    # Load existing strikes
    existing = load_strikes(agent, strikes_path)
    
    ctx_hash = compute_context_hash(context)
    
    # Check if this exact context has been struck before
    repeat_count = 1
    for s in existing:
        if s.context_hash == ctx_hash:
            repeat_count = s.repeat_count + 1
    
    strike = Strike(
        id=f"strike-{agent}-{int(time.time())}",
        agent=agent,
        mistake_type=mistake_type,
        context_hash=ctx_hash,
        severity=severity,
        timestamp=time.time(),
        issued_by=issued_by,
        resolution=resolution,
        repeat_count=repeat_count,
    )
    
    existing.append(strike)
    save_strikes(agent, existing, strikes_path)
    
    # Auto-escalate based on repeat count
    if repeat_count >= 5:
        council_action(CouncilAction.SUSPEND, agent, 
                       f"Strike {repeat_count}: repeated {mistake_type}")
    elif repeat_count >= 4:
        council_action(CouncilAction.DEMOTE, agent,
                       f"Strike {repeat_count}: repeated {mistake_type}")
    elif repeat_count >= 3:
        create_threat(agent, strike, repeat_count)
    
    return strike


def load_strikes(agent: str, strikes_path: str = ".toon/strikes/") -> list[Strike]:
    """Load all strikes for an agent."""
    filepath = os.path.join(strikes_path, f"{agent}.json")
    if not os.path.exists(filepath):
        return []
    
    with open(filepath) as f:
        data = json.load(f)
    
    return [
        Strike(
            id=s["id"], agent=s["agent"], mistake_type=s["mistake_type"],
            context_hash=s["context_hash"], severity=s["severity"],
            timestamp=s["timestamp"], issued_by=s["issued_by"],
            resolution=s["resolution"], repeat_count=s.get("repeat_count", 1),
        )
        for s in data
    ]


def save_strikes(agent: str, strikes: list[Strike], strikes_path: str = ".toon/strikes/"):
    """Save strikes to disk."""
    os.makedirs(strikes_path, exist_ok=True)
    
    with open(os.path.join(strikes_path, f"{agent}.json"), 'w') as f:
        json.dump([
            {
                "id": s.id, "agent": s.agent, "mistake_type": s.mistake_type,
                "context_hash": s.context_hash, "severity": s.severity,
                "timestamp": s.timestamp, "issued_by": s.issued_by,
                "resolution": s.resolution, "repeat_count": s.repeat_count,
            }
            for s in strikes
        ], f, indent=2)


def get_agent_confidence_multiplier(agent: str, strikes_path: str = ".toon/strikes/") -> float:
    """Get confidence multiplier based on strike history.
    Clean record = 1.0×. Demoted = 0.5×."""
    strikes = load_strikes(agent, strikes_path)
    
    # Count recent strikes (last 30 days)
    recent = [s for s in strikes if time.time() - s.timestamp < 30 * 86400]
    
    # Count max repeat for any single context
    max_repeat = max((s.repeat_count for s in recent), default=0)
    
    if max_repeat >= 5:
        return 0.0   # Suspended
    elif max_repeat >= 4:
        return 0.5   # Demoted
    elif max_repeat >= 2:
        return 0.8   # Penalty
    else:
        return 1.0   # Clean


def check_agent_status(agent: str, strikes_path: str = ".toon/strikes/") -> dict:
    """Full status check for an agent."""
    strikes = load_strikes(agent, strikes_path)
    recent = [s for s in strikes if time.time() - s.timestamp < 30 * 86400]
    
    max_repeat = max((s.repeat_count for s in recent), default=0)
    multiplier = get_agent_confidence_multiplier(agent, strikes_path)
    
    status = "active"
    if max_repeat >= 5:
        status = "suspended"
    elif max_repeat >= 4:
        status = "demoted"
    elif max_repeat >= 3:
        status = "under_review"
    elif max_repeat >= 2:
        status = "penalized"
    
    return {
        "agent": agent,
        "status": status,
        "total_strikes": len(recent),
        "max_repeat": max_repeat,
        "confidence_multiplier": multiplier,
        "recent_mistakes": [
            {"type": s.mistake_type, "repeat": s.repeat_count, "when": s.timestamp}
            for s in recent[-5:]
        ],
    }


# ═══════════════════════════════════════════════════════════════
# COUNCIL ACTIONS
# ═══════════════════════════════════════════════════════════════

def council_vote(action: CouncilAction, target_agent: str, reason: str,
                 voters: list[str] = None) -> CouncilVote:
    """Council votes on an action. 3/5 majority required."""
    
    if voters is None:
        voters = [m.name for m in COUNCIL if m.active]
    
    # In production: each council member would actually deliberate
    # For now: weighted vote based on action type
    votes_for = 0
    votes_against = 0
    
    for voter in voters:
        member = COUNCIL_BY_NAME.get(voter)
        if not member:
            continue
        
        # Kahneman always votes against if cognitive bias suspected
        if voter == "kahneman" and "bias" in reason.lower():
            votes_for += member.vote_weight
        # Board always votes on constitutional issues
        elif voter == "board" and ("constitution" in reason.lower() or "rule" in reason.lower()):
            votes_for += member.vote_weight
        # Default: vote for (agents trust each other unless proven otherwise)
        else:
            votes_for += member.vote_weight
    
    total_weight = sum(COUNCIL_BY_NAME[v].vote_weight for v in voters)
    passed = votes_for >= MAJORITY_THRESHOLD
    
    return CouncilVote(
        action=action,
        target_agent=target_agent,
        reason=reason,
        votes_for=votes_for,
        votes_against=total_weight - votes_for,
        passed=passed,
        timestamp=time.time(),
    )


def council_action(action: CouncilAction, target_agent: str, reason: str):
    """Execute a council action after voting."""
    
    vote = council_vote(action, target_agent, reason)
    
    if not vote.passed:
        return {"action": action.value, "passed": False, "reason": "Vote failed"}
    
    if action == CouncilAction.THREATEN:
        return {"action": "threaten", "passed": True, "target": target_agent}
    
    elif action == CouncilAction.DEMOTE:
        return {
            "action": "demote",
            "passed": True,
            "target": target_agent,
            "effect": "confidence_multiplier = 0.5",
            "duration_hours": 24,
        }
    
    elif action == CouncilAction.SUSPEND:
        return {
            "action": "suspend",
            "passed": True,
            "target": target_agent,
            "effect": "agent removed from rotation",
            "replacement": find_replacement(target_agent),
        }
    
    elif action == CouncilAction.OVERRIDE:
        return {
            "action": "override",
            "passed": True,
            "target": target_agent,
            "effect": "decision reversed",
        }
    
    return {"action": action.value, "passed": True}


def find_replacement(suspended_agent: str) -> str:
    """Find a replacement when an agent is suspended."""
    replacements = {
        "dev": "raj",
        "raj": "dev",
        "mia": "dev",
        "quinn": "kahneman",
        "kai": "lena",
        "lena": "rio",
        "rio": "nate",
        "nate": "kai",
    }
    return replacements.get(suspended_agent, "dev")


# ═══════════════════════════════════════════════════════════════
# FORMAL THREATS
# ═══════════════════════════════════════════════════════════════

def create_threat(agent: str, strike: Strike, repeat_count: int) -> CouncilThreat:
    """Create a formal Council threat when agent hits 3+ strikes."""
    
    consequences = [
        f"Confidence multiplier reduced to 0.5× for {strike.mistake_type}-related tasks",
        f"All {strike.mistake_type} work must pass Quinn + Kahneman review",
        f"Next occurrence = SUSPENSION and replacement",
    ]
    
    pattern = f"Strike {repeat_count}: repeated {strike.mistake_type}"
    
    threat = CouncilThreat(
        id=f"threat-{agent}-{int(time.time())}",
        to_agent=agent,
        strike_number=repeat_count,
        pattern=pattern,
        consequences=consequences,
    )
    
    # Save threat to disk
    save_threat(threat)
    
    return threat


def save_threat(threat: CouncilThreat, path: str = ".toon/council/threats/"):
    """Save threat to disk."""
    os.makedirs(path, exist_ok=True)
    
    with open(os.path.join(path, f"{threat.id}.json"), 'w') as f:
        json.dump({
            "id": threat.id,
            "to_agent": threat.to_agent,
            "strike_number": threat.strike_number,
            "pattern": threat.pattern,
            "consequences": threat.consequences,
            "deadline_response_hours": threat.deadline_response_hours,
            "resolved": threat.resolved,
            "agent_response": threat.agent_response,
        }, f, indent=2)


def format_threat_message(threat: CouncilThreat) -> str:
    """Format a Council threat as a human-readable message."""
    
    return f"""
FROM: Advisory Council (Marcus, Diana, Felix, Kahneman, Board)
TO: {threat.to_agent.upper()}
RE: THREAT — {threat.pattern}

{threat.to_agent}, you have made the SAME mistake {threat.strike_number} times.
This is now a PATTERN. The Council rules:

{chr(10).join(f'  {i+1}. {c}' for i, c in enumerate(threat.consequences))}

You have {threat.deadline_response_hours} hour(s) to explain why this should not happen again.
"""


# ═══════════════════════════════════════════════════════════════
# CROSS-DEPARTMENT CHALLENGE
# ═══════════════════════════════════════════════════════════════

@dataclass
class Challenge:
    id: str
    from_dept: str
    to_dept: str
    issue: str
    evidence: str
    proposed_fix: str
    status: str = "open"  # open | accepted | rejected | escalated
    timestamp: float = field(default_factory=time.time)

def file_challenge(from_dept: str, to_dept: str, issue: str, 
                   evidence: str, proposed_fix: str,
                   challenges_path: str = ".toon/challenges/") -> Challenge:
    """File a cross-department challenge."""
    
    challenge = Challenge(
        id=f"challenge-{from_dept}-{to_dept}-{int(time.time())}",
        from_dept=from_dept,
        to_dept=to_dept,
        issue=issue,
        evidence=evidence,
        proposed_fix=proposed_fix,
    )
    
    os.makedirs(challenges_path, exist_ok=True)
    with open(os.path.join(challenges_path, f"{challenge.id}.json"), 'w') as f:
        json.dump({
            "id": challenge.id,
            "from_dept": challenge.from_dept,
            "to_dept": challenge.to_dept,
            "issue": challenge.issue,
            "evidence": challenge.evidence,
            "proposed_fix": challenge.proposed_fix,
            "status": challenge.status,
            "timestamp": challenge.timestamp,
        }, f, indent=2)
    
    return challenge


# ═══════════════════════════════════════════════════════════════
# CONSTITUTION ENFORCEMENT
# ═══════════════════════════════════════════════════════════════

CONSTITUTION = [
    "Never ship without Quinn verification",
    "Never override a Kahneman bias flag without Council vote",
    "Never repeat the same mistake 3 times (auto-suspension)",
    "Never deploy to production without Felix budget approval",
    "Never ignore a cross-department challenge without responding",
    "Never make security changes without Legal review",
    "Never bypass the self-counter pass",
    "The user CAN override any rule — but the override is logged and reviewed",
]

def check_constitution_violation(action: str, agent: str) -> Optional[str]:
    """Check if an action violates the CAOS constitution.
    Returns the violated rule or None."""
    
    action_lower = action.lower()
    
    for rule in CONSTITUTION:
        rule_keywords = rule.lower().split()
        # Check if action contradicts the rule
        if "never" in rule.lower():
            prohibited = rule.lower().split("never ")[1].split(" without")[0].split(" (")[0]
            if prohibited in action_lower:
                return rule
    
    return None
