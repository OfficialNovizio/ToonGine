"""
CAOS — Cross-Department Challenge Protocol

Departments audit each other. Creates adversarial quality control.
Mirrors how real organizations have checks and balances.
"""

import json, os, time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ChallengeStatus(Enum):
    OPEN = "open"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    RESOLVED = "resolved"

@dataclass
class DeptChallenge:
    id: str
    from_dept: str
    from_agent: str
    to_dept: str
    to_agent: str
    issue: str
    evidence: str
    proposed_fix: str
    severity: int  # 1-5
    status: ChallengeStatus = ChallengeStatus.OPEN
    timestamp: float = field(default_factory=time.time)
    response: Optional[str] = None
    resolved_by: Optional[str] = None  # "challenged" | "council"


# Challenge templates — common cross-department challenges
CHALLENGE_TEMPLATES = {
    "technical_to_marketing": [
        {
            "trigger_keywords": ["a/b test", "ab test", "experiment"],
            "challenge": "A/B test methodology audit",
            "check": "Does the test have: control group, statistical significance threshold, clear success metric?",
        },
        {
            "trigger_keywords": ["claim", "promise", "guarantee"],
            "challenge": "Marketing claim vs product capability",
            "check": "Can the product actually deliver what the copy promises?",
        },
    ],
    "marketing_to_technical": [
        {
            "trigger_keywords": ["refactor", "rewrite", "architecture"],
            "challenge": "Over-engineering check",
            "check": "Is this rewrite worth the engineering cost vs shipping faster?",
        },
        {
            "trigger_keywords": ["edge case", "corner case", "rare"],
            "challenge": "Edge case prioritization",
            "check": "Are we optimizing for 0.1% of users at the cost of 99.9%?",
        },
    ],
    "finance_to_all": [
        {
            "trigger_keywords": ["cost", "budget", "spend", "resource"],
            "challenge": "Budget impact analysis",
            "check": "Is the cost justified by projected ROI? What's the break-even?",
        },
    ],
    "legal_to_all": [
        {
            "trigger_keywords": ["data", "user", "personal", "collect", "track"],
            "challenge": "Data privacy compliance",
            "check": "Does this require user consent? Is it GDPR/CCPA compliant?",
        },
    ],
    "psychology_to_all": [
        {
            "trigger_keywords": ["obvious", "clearly", "definitely", "surely"],
            "challenge": "Overconfidence detection",
            "check": "Are we overconfident? What's the base rate for this type of claim?",
        },
    ],
}


def scan_for_cross_dept_challenges(agent_output: str, from_dept: str, 
                                    from_agent: str, to_dept: str, 
                                    to_agent: str) -> list[DeptChallenge]:
    """
    Scan an agent's output for potential cross-department challenges.
    Called by the audit layer after self-counter.
    """
    challenges = []
    output_lower = agent_output.lower()
    
    # Find applicable challenge templates
    template_key = f"{from_dept}_to_{to_dept}"
    generic_key = f"{from_dept}_to_all"
    
    templates = CHALLENGE_TEMPLATES.get(template_key, [])
    templates += CHALLENGE_TEMPLATES.get(generic_key, [])
    
    for template in templates:
        for keyword in template["trigger_keywords"]:
            if keyword in output_lower:
                challenge = DeptChallenge(
                    id=f"dc-{from_agent}-{to_agent}-{int(time.time())}",
                    from_dept=from_dept,
                    from_agent=from_agent,
                    to_dept=to_dept,
                    to_agent=to_agent,
                    issue=f"{template['challenge']}: {template['check']}",
                    evidence=f"Output contains trigger: '{keyword}'",
                    proposed_fix=f"Review and address: {template['check']}",
                    severity=3,
                )
                challenges.append(challenge)
                break  # One challenge per template
    
    return challenges


def file_challenge(challenge: DeptChallenge, path: str = ".toon/challenges/"):
    """Persist a cross-department challenge."""
    os.makedirs(os.path.join(path, "open"), exist_ok=True)
    
    filepath = os.path.join(path, "open", f"{challenge.id}.json")
    with open(filepath, 'w') as f:
        json.dump({
            "id": challenge.id,
            "from_dept": challenge.from_dept,
            "from_agent": challenge.from_agent,
            "to_dept": challenge.to_dept,
            "to_agent": challenge.to_agent,
            "issue": challenge.issue,
            "evidence": challenge.evidence,
            "proposed_fix": challenge.proposed_fix,
            "severity": challenge.severity,
            "status": challenge.status.value,
            "timestamp": challenge.timestamp,
            "response": challenge.response,
            "resolved_by": challenge.resolved_by,
        }, f, indent=2)


def resolve_challenge(challenge_id: str, resolution: str, 
                      accepted: bool, resolved_by: str = "challenged",
                      challenges_path: str = ".toon/challenges/"):
    """Resolve a challenge — move from open/ to resolved/."""
    
    # Find the challenge file
    open_path = os.path.join(challenges_path, "open")
    resolved_path = os.path.join(challenges_path, "resolved")
    os.makedirs(resolved_path, exist_ok=True)
    
    for filename in os.listdir(open_path):
        if challenge_id in filename:
            with open(os.path.join(open_path, filename)) as f:
                data = json.load(f)
            
            data["status"] = "accepted" if accepted else "rejected"
            data["response"] = resolution
            data["resolved_by"] = resolved_by
            
            # Move to resolved
            with open(os.path.join(resolved_path, filename), 'w') as f:
                json.dump(data, f, indent=2)
            
            # Remove from open
            os.remove(os.path.join(open_path, filename))
            return True
    
    return False


def escalate_to_council(challenge: DeptChallenge, 
                        challenges_path: str = ".toon/challenges/"):
    """Escalate unresolved challenge to Advisory Council."""
    from council import council_action, CouncilAction
    
    challenge.status = ChallengeStatus.ESCALATED
    
    # Move to escalated
    escalated_path = os.path.join(challenges_path, "escalated")
    os.makedirs(escalated_path, exist_ok=True)
    
    # Council votes
    result = council_action(
        CouncilAction.OVERRIDE,
        challenge.to_agent,
        f"Cross-dept challenge from {challenge.from_dept}: {challenge.issue}"
    )
    
    return result


def get_open_challenges(to_agent: str = None, 
                        challenges_path: str = ".toon/challenges/") -> list[DeptChallenge]:
    """Get all open challenges, optionally filtered by target agent."""
    open_path = os.path.join(challenges_path, "open")
    if not os.path.exists(open_path):
        return []
    
    challenges = []
    for filename in os.listdir(open_path):
        if filename.endswith('.json'):
            with open(os.path.join(open_path, filename)) as f:
                data = json.load(f)
                if to_agent and data.get("to_agent") != to_agent:
                    continue
                challenges.append(DeptChallenge(
                    id=data["id"],
                    from_dept=data["from_dept"],
                    from_agent=data["from_agent"],
                    to_dept=data["to_dept"],
                    to_agent=data["to_agent"],
                    issue=data["issue"],
                    evidence=data["evidence"],
                    proposed_fix=data["proposed_fix"],
                    severity=data["severity"],
                    status=ChallengeStatus(data["status"]),
                    timestamp=data["timestamp"],
                    response=data.get("response"),
                    resolved_by=data.get("resolved_by"),
                ))
    
    return sorted(challenges, key=lambda c: c.timestamp)
