"""
CAOS — Counter-User Protocol

Agents can formally push back on user requests that are dangerous,
contradict the constitution, or repeat known mistakes.
"""

import json, os, time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ChallengeLevel(Enum):
    ADVISORY = "advisory"     # "Consider this alternative..."
    WARNING = "warning"        # "This has risks: ..."
    VETO = "veto"             # "I cannot do this because..."

@dataclass
class UserChallenge:
    id: str
    agent: str
    level: ChallengeLevel
    user_request: str
    reason: str
    evidence: str
    alternative: str
    timestamp: float = field(default_factory=time.time)
    status: str = "pending"  # pending | accepted | overridden
    user_response: Optional[str] = None


# Conditions that trigger counter-user
COUNTER_TRIGGERS = {
    "security_risk": {
        "level": ChallengeLevel.VETO,
        "keywords": ["skip auth", "no auth", "bypass security", "plaintext password",
                      "hardcode token", "disable ssl", "allow all origins"],
    },
    "constitution_violation": {
        "level": ChallengeLevel.VETO,
        "keywords": ["skip test", "no review", "bypass council", "ignore quinn"],
    },
    "repeated_mistake": {
        "level": ChallengeLevel.WARNING,
        "keywords": [],  # Detected via strike history, not keywords
    },
    "architectural_concern": {
        "level": ChallengeLevel.ADVISORY,
        "keywords": ["global variable", "god class", "circular dependency",
                      "monolith", "no abstraction"],
    },
    "data_loss_risk": {
        "level": ChallengeLevel.VETO,
        "keywords": ["drop table", "delete all", "rm -rf", "truncate",
                      "without backup", "force push"],
    },
    "performance_concern": {
        "level": ChallengeLevel.ADVISORY,
        "keywords": ["n+1 query", "no index", "select *", "no cache",
                      "synchronous", "blocking"],
    },
}


def should_challenge_user(user_request: str, agent_name: str,
                          agent_strikes: list) -> Optional[UserChallenge]:
    """Determine if an agent should push back on a user request."""
    
    request_lower = user_request.lower()
    
    for trigger_name, trigger in COUNTER_TRIGGERS.items():
        for keyword in trigger["keywords"]:
            if keyword in request_lower:
                return UserChallenge(
                    id=f"uc-{agent_name}-{int(time.time())}",
                    agent=agent_name,
                    level=trigger["level"],
                    user_request=user_request,
                    reason=f"Triggered: {trigger_name} — matched '{keyword}'",
                    evidence=f"Request contains prohibited pattern: {keyword}",
                    alternative=suggest_alternative(trigger_name, user_request),
                )
    
    # Check strike history for repeated patterns
    for strike in agent_strikes[-5:]:
        if strike.mistake_type.lower().replace('_', ' ') in request_lower:
            return UserChallenge(
                id=f"uc-{agent_name}-{int(time.time())}",
                agent=agent_name,
                level=ChallengeLevel.WARNING,
                user_request=user_request,
                reason=f"Repeated mistake pattern: {strike.mistake_type}",
                evidence=f"You previously made this mistake (strike {strike.repeat_count}): {strike.resolution}",
                alternative=f"Instead: follow the resolution from strike: {strike.resolution}",
            )
    
    return None


def suggest_alternative(trigger: str, request: str) -> str:
    """Suggest an alternative approach when pushing back."""
    alternatives = {
        "security_risk": "Add proper authentication/authorization before proceeding.",
        "constitution_violation": "Follow the standard pipeline: generate → self-counter → verify → council.",
        "architectural_concern": "Consider a modular approach with proper separation of concerns.",
        "data_loss_risk": "Create a backup/snapshot before any destructive operation.",
        "performance_concern": "Add caching, batching, or async processing to avoid bottleneck.",
    }
    return alternatives.get(trigger, "Reconsider the approach with safety and quality in mind.")


def format_challenge_message(challenge: UserChallenge) -> str:
    """Format a counter-user challenge as a human-readable message."""
    
    emoji = {"advisory": "💡", "warning": "⚠️", "veto": "🛑"}
    e = emoji.get(challenge.level.value, "⚠️")
    
    return f"""
{e} COUNTER-USER CHALLENGE — {challenge.level.value.upper()}
From: {challenge.agent}

REQUEST:
  {challenge.user_request[:200]}

REASON:
  {challenge.reason}

EVIDENCE:
  {challenge.evidence}

ALTERNATIVE:
  {challenge.alternative}

STATUS: Awaiting user response.
  Type /accept to use my alternative
  Type /override to force the original request (will be logged)
  Type /explain to discuss further
"""


# ═══════════════════════════════════════════════════════════════
# Challenge Persistence
# ═══════════════════════════════════════════════════════════════

def save_challenge(challenge: UserChallenge, path: str = ".toon/challenges/user/"):
    """Save a counter-user challenge to disk."""
    os.makedirs(path, exist_ok=True)
    
    with open(os.path.join(path, f"{challenge.id}.json"), 'w') as f:
        json.dump({
            "id": challenge.id,
            "agent": challenge.agent,
            "level": challenge.level.value,
            "user_request": challenge.user_request,
            "reason": challenge.reason,
            "evidence": challenge.evidence,
            "alternative": challenge.alternative,
            "timestamp": challenge.timestamp,
            "status": challenge.status,
            "user_response": challenge.user_response,
        }, f, indent=2)


def load_pending_challenges(path: str = ".toon/challenges/user/") -> list[UserChallenge]:
    """Load all pending counter-user challenges."""
    if not os.path.exists(path):
        return []
    
    challenges = []
    for filename in os.listdir(path):
        if filename.endswith('.json'):
            with open(os.path.join(path, filename)) as f:
                data = json.load(f)
                if data.get("status") == "pending":
                    challenges.append(UserChallenge(
                        id=data["id"],
                        agent=data["agent"],
                        level=ChallengeLevel(data["level"]),
                        user_request=data["user_request"],
                        reason=data["reason"],
                        evidence=data["evidence"],
                        alternative=data["alternative"],
                        timestamp=data["timestamp"],
                        status=data["status"],
                        user_response=data.get("user_response"),
                    ))
    
    return sorted(challenges, key=lambda c: c.timestamp, reverse=True)


# ═══════════════════════════════════════════════════════════════
# Override Logging
# ═══════════════════════════════════════════════════════════════

def log_user_override(challenge: UserChallenge, user_decision: str,
                      path: str = ".toon/council/overrides/"):
    """Log when user overrides an agent's challenge.
    Council reviews these periodically."""
    os.makedirs(path, exist_ok=True)
    
    override = {
        "challenge_id": challenge.id,
        "agent": challenge.agent,
        "level": challenge.level.value,
        "original_request": challenge.user_request,
        "agent_concern": challenge.reason,
        "user_decision": user_decision,  # "accepted" or "overridden"
        "timestamp": time.time(),
    }
    
    with open(os.path.join(path, f"override-{int(time.time())}.json"), 'w') as f:
        json.dump(override, f, indent=2)
    
    # If user overrides and it was a VETO → notify Council
    if challenge.level == ChallengeLevel.VETO and user_decision == "overridden":
        flag_for_council_review(challenge)


def flag_for_council_review(challenge: UserChallenge):
    """Flag a user override for Council review."""
    from council import council_action, CouncilAction
    
    council_action(
        CouncilAction.ESCALATE,
        "user",
        f"User overrode VETO from {challenge.agent}: {challenge.reason}"
    )
