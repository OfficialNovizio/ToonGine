"""
CAOS — Discipline Gate: Agents Cannot Speak Unless They Know

The 6 gates every agent MUST pass before outputting anything:
1. DATA GATE — gathered evidence from tools/graph/internet
2. LOGIC GATE — reasoning chain exists, not just conclusions
3. VERIFICATION GATE — Quinn checked the output
4. SELF-COUNTER GATE — agent attacked own output, resolved flaws
5. CONFIDENCE GATE — confidence > threshold, or "I'm not sure"
6. COUNCIL GATE — high-stakes decisions require Council approval

If ANY gate fails → agent returns "I need more" instead of guessing.
This is what separates real professionals from hallucinating chatbots.
"""

import json, time, os, hashlib
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class GateStatus(Enum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"      # Not applicable for this output type
    NEEDS_MORE = "needs_more" # Gate says: gather more data first

class OutputDiscipline(Enum):
    ALLOWED = "allowed"       # All gates passed, output is safe
    BLOCKED = "blocked"       # Gate failed, output refused
    NEEDS_DATA = "needs_data" # Can't answer — missing evidence
    NEEDS_VERIFICATION = "needs_verification"  # Output exists but unverified
    LOW_CONFIDENCE = "low_confidence"  # Not confident enough to assert

@dataclass
class GateResult:
    gate_name: str
    status: GateStatus
    reason: str = ""
    evidence: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)  # What's needed to pass

@dataclass
class DisciplineResult:
    """Final verdict after all gates checked."""
    verdict: OutputDiscipline
    gates_passed: int
    gates_total: int
    gate_results: list[GateResult]
    allowed_output: Optional[str] = None  # Only set if ALLOWED
    block_reason: Optional[str] = None    # Only set if BLOCKED
    what_agent_should_say: str = ""       # What the agent should tell the user


class DisciplineGate:
    """
    Wraps every agent output. Nothing escapes without passing all gates.
    
    Usage:
        gate = DisciplineGate()
        result = gate.check(agent_output, agent_name, task_context)
        
        if result.verdict == OutputDiscipline.ALLOWED:
            deliver_to_user(result.allowed_output)
        else:
            agent_says(result.what_agent_should_say)  # "I need more data on X"
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        self.toon_dir = toon_dir
        
        # Confidence thresholds
        self.CONFIDENCE_REQUIRED = 0.75     # Must be this confident to assert
        self.CONFIDENCE_WITH_EVIDENCE = 0.60 # OK with strong evidence
        self.CONFIDENCE_FLOOR = 0.40         # Below this: refuse to answer
        
        # What counts as "evidence"
        self.EVIDENCE_SOURCES = [
            "graph_query",      # Data from MCP graph tools
            "file_read",        # Read from actual files
            "test_output",      # Test results
            "internet_search",  # Web search results
            "api_response",     # API data
            "documentation",    # Official docs
            "previous_memory",  # Past session memory
            "quinn_check",      # Quinn verified
            "kahneman_audit",   # Kahneman reviewed
        ]
        
        # High-stakes topics that REQUIRE Council approval
        self.HIGH_STAKES_TOPICS = [
            "deploy", "production", "security", "authentication",
            "authorization", "encryption", "secret", "token",
            "password", "database migration", "data deletion",
            "user data", "payment", "billing", "compliance",
        ]
    
    def check(self, agent_output: str, agent_name: str, 
              task_context: dict) -> DisciplineResult:
        """
        Run all 6 gates. Return verdict.
        If any gate fails, agent CANNOT output the original text.
        """
        
        gate_results = []
        
        # ── GATE 1: Data Gate ──────────────────────────────────
        data_result = self._check_data_gate(agent_output, task_context)
        gate_results.append(data_result)
        
        # ── GATE 2: Logic Gate ─────────────────────────────────
        logic_result = self._check_logic_gate(agent_output)
        gate_results.append(logic_result)
        
        # ── GATE 3: Verification Gate ──────────────────────────
        verify_result = self._check_verification_gate(agent_output, task_context)
        gate_results.append(verify_result)
        
        # ── GATE 4: Self-Counter Gate ──────────────────────────
        counter_result = self._check_self_counter_gate(agent_output, agent_name, task_context)
        gate_results.append(counter_result)
        
        # ── GATE 5: Confidence Gate ────────────────────────────
        confidence_result = self._check_confidence_gate(agent_output, task_context)
        gate_results.append(confidence_result)
        
        # ── GATE 6: Council Gate (high-stakes only) ────────────
        council_result = self._check_council_gate(agent_output, task_context)
        gate_results.append(council_result)
        
        # Determine verdict
        failed_gates = [g for g in gate_results if g.status == GateStatus.FAILED]
        needs_more_gates = [g for g in gate_results if g.status == GateStatus.NEEDS_MORE]
        passed_gates = [g for g in gate_results if g.status == GateStatus.PASSED]
        
        gates_total = len([g for g in gate_results if g.status != GateStatus.SKIPPED])
        gates_passed = len(passed_gates)
        
        if needs_more_gates:
            # Agent needs to gather more data before speaking
            missing_info = []
            for g in needs_more_gates:
                missing_info.extend(g.missing)
            
            return DisciplineResult(
                verdict=OutputDiscipline.NEEDS_DATA,
                gates_passed=gates_passed,
                gates_total=gates_total,
                gate_results=gate_results,
                block_reason=f"Missing evidence: {', '.join(missing_info[:5])}",
                what_agent_should_say=self._build_needs_data_message(agent_name, needs_more_gates),
            )
        
        if failed_gates:
            # Agent tried to output something that failed a gate
            return DisciplineResult(
                verdict=OutputDiscipline.BLOCKED,
                gates_passed=gates_passed,
                gates_total=gates_total,
                gate_results=gate_results,
                block_reason=f"Failed gates: {[g.gate_name for g in failed_gates]}",
                what_agent_should_say=self._build_blocked_message(agent_name, failed_gates),
            )
        
        # All gates passed
        return DisciplineResult(
            verdict=OutputDiscipline.ALLOWED,
            gates_passed=gates_passed,
            gates_total=gates_total,
            gate_results=gate_results,
            allowed_output=agent_output,
            what_agent_should_say="",
        )
    
    # ── GATE 1: DATA ──────────────────────────────────────────
    
    def _check_data_gate(self, output: str, context: dict) -> GateResult:
        """
        Has the agent gathered data from tools/graph/internet?
        Cannot assert facts without evidence.
        """
        # Skip DATA gate for pure code — verified by syntax/type/test
        code_indicators = ["def ", "import ", "class ", "return ", "async def", "```python"]
        is_pure_code = any(ci in output for ci in code_indicators)
        lines = output.split('\n')
        code_ratio = sum(1 for l in lines if l.strip() and not l.strip().startswith(('#','//','/*','*','<!--','"',"'''"))) / max(len(lines), 1)
        if is_pure_code and code_ratio > 0.6:
            return GateResult(gate_name="DATA", status=GateStatus.PASSED,
                reason="Pure code — DATA gate skipped (verified by syntax/type/test)")
        
        evidence = context.get("evidence_sources", [])
        
        # Count how many evidence sources the agent used
        valid_evidence = [e for e in evidence if e in self.EVIDENCE_SOURCES]
        
        # Check if output makes factual claims without evidence
        factual_claims = self._detect_factual_claims(output)
        
        if factual_claims and not valid_evidence:
            return GateResult(
                gate_name="DATA",
                status=GateStatus.NEEDS_MORE,
                reason=f"Making {len(factual_claims)} factual claims with NO evidence sources",
                missing=[f"Evidence for: {claim[:60]}" for claim in factual_claims[:3]],
            )
        
        if factual_claims and len(valid_evidence) < len(factual_claims) * 0.5:
            return GateResult(
                gate_name="DATA",
                status=GateStatus.NEEDS_MORE,
                reason=f"Only {len(valid_evidence)} sources for {len(factual_claims)} claims",
                missing=["More evidence sources needed"],
                evidence=valid_evidence,
            )
        
        return GateResult(
            gate_name="DATA",
            status=GateStatus.PASSED,
            reason=f"Evidence: {len(valid_evidence)} sources" if valid_evidence else "No factual claims made",
            evidence=valid_evidence,
        )
    
    def _detect_factual_claims(self, text: str) -> list[str]:
        """Detect sentences that make factual assertions."""
        claims = []
        
        # Patterns that indicate a factual claim
        claim_patterns = [
            "is ", "are ", "was ", "were ", "will ", "has ", "have ",
            "uses ", "requires ", "needs ", "supports ", "contains ",
            "the ",  # Too broad, need context
        ]
        
        sentences = text.replace('\n', '. ').split('. ')
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:  # Too short to be a claim
                continue
            # Check if it makes an assertion
            if any(sentence.lower().startswith(p) for p in claim_patterns):
                claims.append(sentence[:120])
        
        return claims[:10]
    
    # ── GATE 2: LOGIC ─────────────────────────────────────────
    
    def _check_logic_gate(self, output: str) -> GateResult:
        """
        Does the agent show its reasoning? 
        No conclusions without evidence of reasoning chain.
        """
        output_lower = output.lower()
        
        # Signs of reasoning in the output
        reasoning_signals = [
            "because", "therefore", "since", "given that",
            "as a result", "this means", "the reason", "due to",
            "if ", "then ", "else ", "when ", "unless",
            "first", "second", "finally", "step 1", "step 2",
            "alternatively", "however", "on the other hand",
        ]
        
        reasoning_count = sum(1 for s in reasoning_signals if s in output_lower)
        
        # Skip LOGIC gate for pure code output (no natural language to reason about)
        code_indicators = ["def ", "import ", "class ", "return ", "async def", "```python", "```typescript"]
        is_pure_code = any(ci in output for ci in code_indicators)
        code_ratio = sum(1 for line in output.split('\n') if line.strip() and not line.strip().startswith(('#', '//', '/*', '*', '<!--'))) / max(len(output.split('\n')), 1)
        
        if is_pure_code and code_ratio > 0.6:
            return GateResult(
                gate_name="LOGIC",
                status=GateStatus.PASSED,
                reason="Pure code output — LOGIC gate skipped (verified by syntax/type/test checks instead)",
            )
        
        # If output is long but has no reasoning signals → suspicious
        if len(output) > 200 and reasoning_count < 2:
            return GateResult(
                gate_name="LOGIC",
                status=GateStatus.NEEDS_MORE,
                reason=f"Output ({len(output)} chars) lacks reasoning structure. Only {reasoning_count} reasoning signals found.",
                missing=["Show reasoning chain: why this conclusion?", "Include because/therefore/since"],
            )
        
        # Check for "just conclusions" pattern — list of assertions without explanation
        lines = output.split('\n')
        assertion_lines = [l for l in lines if l.strip().startswith(('- ', '* ', '1.', '2.'))]
        
        if len(assertion_lines) > 3 and reasoning_count < len(assertion_lines):
            return GateResult(
                gate_name="LOGIC",
                status=GateStatus.NEEDS_MORE,
                reason=f"{len(assertion_lines)} assertions but only {reasoning_count} reasoning signals",
                missing=["Explain WHY for each assertion"],
            )
        
        return GateResult(
            gate_name="LOGIC",
            status=GateStatus.PASSED,
            reason=f"Reasoning signals: {reasoning_count}",
        )
    
    # ── GATE 3: VERIFICATION ──────────────────────────────────
    
    def _check_verification_gate(self, output: str, context: dict) -> GateResult:
        """
        Has Quinn verified the output?
        Code must compile, tests must pass, types must check.
        """
        verification = context.get("verification", {})
        
        # If this is code output, verification is required
        is_code = self._is_code_output(output)
        
        if is_code and not verification:
            return GateResult(
                gate_name="VERIFICATION",
                status=GateStatus.NEEDS_MORE,
                reason="Code output requires Quinn verification before delivery",
                missing=["Run Quinn: syntax check, type check, test execution"],
            )
        
        if verification:
            checks = verification.get("checks", {})
            all_passed = all(checks.values()) if checks else False
            
            if not all_passed:
                failed_checks = [k for k, v in checks.items() if not v]
                return GateResult(
                    gate_name="VERIFICATION",
                    status=GateStatus.FAILED,
                    reason=f"Failed checks: {failed_checks}",
                    missing=["Fix issues and re-verify"],
                )
            
            return GateResult(
                gate_name="VERIFICATION",
                status=GateStatus.PASSED,
                reason=f"All checks passed: {list(checks.keys())}",
            )
        
        return GateResult(
            gate_name="VERIFICATION",
            status=GateStatus.SKIPPED,
            reason="Not code output",
        )
    
    def _is_code_output(self, output: str) -> bool:
        """Detect if output contains code."""
        code_signals = [
            "function ", "const ", "let ", "var ", "import ", "export ",
            "def ", "class ", "interface ", "type ", "```", "<?php",
            "package ", "module ", "require(", "from ", "}",
            "return ", "async ", "await ",
        ]
        return any(s in output for s in code_signals)
    
    # ── GATE 4: SELF-COUNTER ──────────────────────────────────
    
    def _check_self_counter_gate(self, output: str, agent_name: str, 
                                  context: dict) -> GateResult:
        """
        Has the agent attacked its own output?
        Every agent must self-critique before submitting.
        """
        self_counter_result = context.get("self_counter")
        
        if not self_counter_result:
            return GateResult(
                gate_name="SELF-COUNTER",
                status=GateStatus.NEEDS_MORE,
                reason=f"{agent_name} has not self-critiqued this output",
                missing=["Run self_counter() before submitting"],
            )
        
        flaws_found = self_counter_result.get("flaws_found", 0)
        passed = self_counter_result.get("passed", False)
        
        if not passed and flaws_found > 0:
            return GateResult(
                gate_name="SELF-COUNTER",
                status=GateStatus.FAILED,
                reason=f"Self-counter found {flaws_found} flaws — must fix before submitting",
                missing=["Address all flaws found by self-counter"],
            )
        
        return GateResult(
            gate_name="SELF-COUNTER",
            status=GateStatus.PASSED,
            reason=f"Self-counter passed (found {flaws_found} minor issues, all resolved)",
        )
    
    # ── GATE 5: CONFIDENCE ────────────────────────────────────
    
    def _check_confidence_gate(self, output: str, context: dict) -> GateResult:
        """
        Is the agent confident enough to assert this?
        Low confidence → say "I'm not sure" instead of guessing.
        """
        confidence = context.get("confidence", 0.5)
        
        if confidence < self.CONFIDENCE_FLOOR:
            return GateResult(
                gate_name="CONFIDENCE",
                status=GateStatus.FAILED,
                reason=f"Confidence {confidence:.2f} is below floor {self.CONFIDENCE_FLOOR}",
                missing=[],
            )
        
        evidence_count = len(context.get("evidence_sources", []))
        
        if confidence < self.CONFIDENCE_REQUIRED and evidence_count < 2:
            return GateResult(
                gate_name="CONFIDENCE",
                status=GateStatus.NEEDS_MORE,
                reason=f"Confidence {confidence:.2f} needs more evidence to reach {self.CONFIDENCE_REQUIRED}",
                missing=["Gather more evidence to increase confidence"],
            )
        
        if confidence < self.CONFIDENCE_REQUIRED:
            return GateResult(
                gate_name="CONFIDENCE",
                status=GateStatus.NEEDS_MORE,
                reason=f"Confidence {confidence:.2f} < required {self.CONFIDENCE_REQUIRED}",
                missing=["Increase confidence through verification"],
            )
        
        return GateResult(
            gate_name="CONFIDENCE",
            status=GateStatus.PASSED,
            reason=f"Confidence: {confidence:.2f}",
        )
    
    # ── GATE 6: COUNCIL ───────────────────────────────────────
    
    def _check_council_gate(self, output: str, context: dict) -> GateResult:
        """
        Is this a high-stakes output requiring Council approval?
        Deploy, security, data changes → must pass Council vote.
        """
        output_lower = output.lower()
        task_lower = context.get("task", "").lower()
        
        # Check if topic is high-stakes
        is_high_stakes = any(
            topic in output_lower or topic in task_lower
            for topic in self.HIGH_STAKES_TOPICS
        )
        
        if not is_high_stakes:
            return GateResult(
                gate_name="COUNCIL",
                status=GateStatus.SKIPPED,
                reason="Not a high-stakes output",
            )
        
        council_approved = context.get("council_approved", False)
        
        if not council_approved:
            return GateResult(
                gate_name="COUNCIL",
                status=GateStatus.FAILED,
                reason=f"High-stakes output ({self._detect_high_stakes_topic(output, task_lower)}) requires Council vote",
                missing=["Submit to Council for vote (Marcus, Diana, Felix, Kahneman, Board)"],
            )
        
        return GateResult(
            gate_name="COUNCIL",
            status=GateStatus.PASSED,
            reason="Council approved (3/5 majority)",
        )
    
    def _detect_high_stakes_topic(self, output: str, task: str) -> str:
        combined = (output + " " + task).lower()
        for topic in self.HIGH_STAKES_TOPICS:
            if topic in combined:
                return topic
        return "unknown"
    
    # ── MESSAGE BUILDERS ──────────────────────────────────────
    
    def _build_needs_data_message(self, agent_name: str, 
                                   failed_gates: list[GateResult]) -> str:
        """Build message for when agent needs more data."""
        
        missing_items = []
        for gate in failed_gates:
            missing_items.extend(gate.missing[:2])
        
        missing_list = "\n".join(f"  - {m}" for m in missing_items[:5])
        
        return f"""[{agent_name}] I cannot answer this yet. I need to gather more information:

{missing_list}

I will not guess or make assumptions without proper evidence. Let me collect what's needed and come back with a verified answer."""
    
    def _build_blocked_message(self, agent_name: str, 
                                failed_gates: list[GateResult]) -> str:
        """Build message for when agent output is blocked."""
        
        reasons = [f"{g.gate_name}: {g.reason}" for g in failed_gates]
        reasons_text = "\n".join(f"  - {r}" for r in reasons[:5])
        
        return f"""[{agent_name}] I cannot deliver this output. It failed the following quality gates:

{reasons_text}

I need to fix these issues before I can share any results. This is to ensure I only deliver verified, evidence-backed, properly reasoned output."""
    
    def _build_low_confidence_message(self, agent_name: str, 
                                       confidence: float) -> str:
        """Build message for low confidence."""
        return f"[{agent_name}] I'm not confident enough to assert this (confidence: {confidence:.0%}). I'd rather say 'I'm not sure' than give you wrong information. Let me gather more evidence and try again."


# ═══════════════════════════════════════════════════════════════
# INTEGRATION WITH CAOS PIPELINE
# ═══════════════════════════════════════════════════════════════

def discipline_wrapper(agent_output: str, agent_name: str, 
                       task_context: dict) -> dict:
    """
    Wrap every agent output through the discipline gate.
    
    Call this before any agent delivers output to user.
    
    Returns:
        {
            "deliverable": bool,         # Can this be shown to user?
            "output": str,                # What to show (original or "I need more")
            "gate_results": list[dict],   # Full gate report
            "blocked_reason": str|null    # Why it was blocked
        }
    """
    gate = DisciplineGate()
    result = gate.check(agent_output, agent_name, task_context)
    
    return {
        "deliverable": result.verdict == OutputDiscipline.ALLOWED,
        "output": result.allowed_output if result.verdict == OutputDiscipline.ALLOWED else result.what_agent_should_say,
        "verdict": result.verdict.value,
        "gates_passed": result.gates_passed,
        "gates_total": result.gates_total,
        "gate_results": [
            {
                "gate": g.gate_name,
                "status": g.status.value,
                "reason": g.reason,
                "missing": g.missing,
            }
            for g in result.gate_results
        ],
        "blocked_reason": result.block_reason,
    }
