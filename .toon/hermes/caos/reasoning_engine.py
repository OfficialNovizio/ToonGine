"""
CAOS — Reasoning Engine: What Makes Reasoning Great

Fable 5 beats other models in reasoning because it doesn't just generate text —
it builds evidence chains, derives from first principles, quantifies uncertainty,
and refuses to assert what it cannot prove.

THE FOUR PILLARS OF GREAT REASONING:

1. PROPER INFORMATION
   - First principles library (fundamental truths to derive from)
   - Domain knowledge graphs (how concepts relate)
   - Evidence chains (every claim traced to source)
   - Factual grounding (real data, not hallucination)

2. RULES & GUIDELINES
   - Logic validation (no circular reasoning, false dichotomies)
   - Bias detection (confirmation, anchoring, availability)
   - Uncertainty quantification (probability ranges, not false certainty)
   - Knowledge boundary awareness (what we know we don't know)

3. PROPER REQUESTED THINGS
   - Assumption surfacing (what's being assumed implicitly)
   - Requirement decomposition (what the user actually needs)
   - Tradeoff analysis (what's gained vs what's lost)
   - Alternative generation (other ways to solve this)

4. HOW TO IMPROVE
   - Bayesian belief updating (incorporate new evidence properly)
   - Mistake-to-principle conversion (wrong answer → better reasoning)
   - Pattern generalization (specific case → general rule)
   - Confidence calibration (is my confidence matching my accuracy?)

This engine wires into the CAOS pipeline at the KAHNEMAN AUDIT phase.
Kahneman calls ReasoningEngine.audit() before any output is delivered.
"""

import re, json, math, hashlib, time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from pathlib import Path


# ═══════════════════════════════════════════════════════════════
# TYPES
# ═══════════════════════════════════════════════════════════════

class LogicFallacy(Enum):
    """Common logical fallacies to detect."""
    CIRCULAR_REASONING = "circular_reasoning"
    FALSE_DICHOTOMY = "false_dichotomy"
    SLIPPERY_SLOPE = "slippery_slope"
    HASTY_GENERALIZATION = "hasty_generalization"
    APPEAL_TO_AUTHORITY = "appeal_to_authority"
    STRAW_MAN = "straw_man"
    POST_HOC = "post_hoc"
    BEGGING_THE_QUESTION = "begging_the_question"
    AD_HOMINEM = "ad_hominem"
    FALSE_EQUIVALENCE = "false_equivalence"
    APPEAL_TO_IGNORANCE = "appeal_to_ignorance"
    MOTIVATED_REASONING = "motivated_reasoning"

class Bias(Enum):
    """Cognitive biases to detect."""
    CONFIRMATION = "confirmation"        # Seeking evidence that confirms belief
    ANCHORING = "anchoring"              # Over-relying on first piece of info
    AVAILABILITY = "availability"         # Over-weighting recent/vivid info
    OVERCONFIDENCE = "overconfidence"     # Certainty > accuracy
    SURVIVORSHIP = "survivorship"         # Only seeing successes
    RECENCY = "recency"                   # Over-weighting recent events
    FRAMING = "framing"                   # Influenced by how info is presented
    SUNK_COST = "sunk_cost"               # Continuing because of past investment
    BANDWAGON = "bandwagon"               # Following because others do
    DUNNING_KRUGER = "dunning_kruger"     # Overestimating competence

@dataclass
class EvidenceNode:
    """A node in the evidence chain."""
    id: str
    claim: str
    source: str  # Where this evidence comes from
    source_type: str  # graph_query, file_read, internet, memory, test_output, etc.
    confidence: float  # 0-1
    timestamp: float = field(default_factory=time.time)

@dataclass
class EvidenceChain:
    """Chain of evidence supporting a conclusion."""
    conclusion: str
    nodes: list[EvidenceNode]
    chain_strength: float  # 0-1, overall strength of the chain
    
    def is_weak_chain(self) -> bool:
        """A chain is weak if it's a single source or low confidence."""
        return len(self.nodes) < 2 or self.chain_strength < 0.5

@dataclass
class FirstPrinciple:
    """A fundamental truth that can't be reduced further."""
    id: str
    statement: str
    domain: str  # math, physics, cs, economics, etc.
    confidence: float  # Should be 0.95+ for true first principles
    derivation: str  # How this principle is derived or proven

@dataclass
class Uncertainty:
    """Quantified uncertainty about a claim."""
    claim: str
    confidence: float       # Point estimate 0-1
    lower_bound: float      # Lower bound of confidence interval
    upper_bound: float      # Upper bound of confidence interval
    evidence_count: int
    sources: list[str]
    unknowns: list[str]     # What we know we don't know
    assumptions: list[str]  # What we're assuming

@dataclass
class ReasoningAudit:
    """Complete audit of reasoning quality."""
    passed: bool
    fallacies: list[tuple[LogicFallacy, str]]  # (fallacy, location in text)
    biases: list[tuple[Bias, str, float]]      # (bias, location, confidence)
    evidence_chain: Optional[EvidenceChain]
    uncertainty: Optional[Uncertainty]
    assumptions_surfaced: list[str]
    alternatives_considered: list[str]
    first_principles_used: list[str]
    missing_evidence: list[str]
    suggestion: str  # What to improve
    score: float     # 0-1 overall reasoning quality


# ═══════════════════════════════════════════════════════════════
# FIRST PRINCIPLES LIBRARY
# ═══════════════════════════════════════════════════════════════

FIRST_PRINCIPLES = {
    "cs": [
        FirstPrinciple("fp-turing", "Any computable function can be computed by a Turing machine", 
                       "cs", 0.99, "Church-Turing thesis"),
        FirstPrinciple("fp-halting", "It is impossible to determine whether an arbitrary program halts",
                       "cs", 0.99, "Turing's halting problem proof (1936)"),
        FirstPrinciple("fp-complexity", "Algorithms have time and space complexity bounds",
                       "cs", 0.99, "Computational complexity theory"),
        FirstPrinciple("fp-cap", "You cannot achieve 100% availability + 100% consistency + partition tolerance simultaneously",
                       "cs", 0.95, "CAP theorem (Brewer 2000)"),
        FirstPrinciple("fp-state", "Distributed systems must handle partial failures",
                       "cs", 0.95, "Fallacies of distributed computing"),
        FirstPrinciple("fp-interface", "Program against interfaces, not implementations",
                       "cs", 0.90, "Dependency inversion principle"),
        FirstPrinciple("fp-single-responsibility", "A module should have one reason to change",
                       "cs", 0.90, "SOLID principles"),
    ],
    "security": [
        FirstPrinciple("fp-least-privilege", "Every module must operate with minimum necessary privileges",
                       "security", 0.95, "Principle of least privilege (Saltzer & Schroeder 1975)"),
        FirstPrinciple("fp-defense-depth", "Security requires multiple independent layers of defense",
                       "security", 0.95, "Defense in depth principle"),
        FirstPrinciple("fp-never-trust-input", "All input is untrusted until validated",
                       "security", 0.99, "Fundamental security principle"),
        FirstPrinciple("fp-kerckhoffs", "Security should not depend on secrecy of the algorithm",
                       "security", 0.99, "Kerckhoffs's principle (1883)"),
    ],
    "math": [
        FirstPrinciple("fp-bayes", "Beliefs should update proportionally to evidence strength",
                       "math", 0.95, "Bayes' theorem: P(H|E) = P(E|H)P(H)/P(E)"),
        FirstPrinciple("fp-law-large-numbers", "Sample mean converges to population mean as sample size grows",
                       "math", 0.99, "Law of large numbers"),
        FirstPrinciple("fp-regression-mean", "Extreme observations tend to be followed by less extreme ones",
                       "math", 0.95, "Regression toward the mean"),
    ],
}

# Logical fallacy detection patterns
FALLACY_PATTERNS = {
    LogicFallacy.CIRCULAR_REASONING: [
        (r"\b(because|since)\s+it\s+is\b", "Concluding 'because it is' — circular"),
        (r"\bthe\s+reason\s+is\s+because\s+it\b", "The reason is because it is"),
    ],
    LogicFallacy.FALSE_DICHOTOMY: [
        (r"\b(either|only two|binary)\s+(choice|option|way|path)\b", "Presenting as only two options"),
        (r"\byou('re| are) either.*or\b", "Either/or framing without middle ground"),
    ],
    LogicFallacy.HASTY_GENERALIZATION: [
        (r"\b(always|never|everyone|no one|all|none)\b.*\b(one|once|single|only)\b", "Generalizing from single case"),
        (r"\bclearly\b.*\b(must|has to|obviously)\b", "Asserting without evidence"),
    ],
    LogicFallacy.APPEAL_TO_AUTHORITY: [
        (r"\b(according to|as .+ says|.+ proved)\b(?!.*(study|data|evidence|paper|research))", "Appealing to authority without evidence"),
        (r"\bexperts?\s+(say|agree|believe)\b", "Appeal to unnamed experts"),
    ],
    LogicFallacy.SLIPPERY_SLOPE: [
        (r"\bif\s+we\s+let\b.*\bthen\b.*\bnext\b.*\band\s+then\b", "Slippery slope chain"),
        (r"\b(this|that)\s+(will|could|might)\s+lead\s+to\b.*\bwhich\s+(will|could)\s+lead\s+to\b", "Cascading unsupported consequences"),
    ],
    LogicFallacy.MOTIVATED_REASONING: [
        (r"\b(as|since)\s+(we|I)\s+(want|need|prefer|like)\b", "Reasoning from desired conclusion"),
        (r"\b(it|this)\s+must\s+be\b.*\b(because|since)\s+it\s+feels?\b", "Reasoning from feeling"),
    ],
    LogicFallacy.POST_HOC: [
        (r"\b(after|since|following)\b.*\b(therefore|thus|hence|so)\b", "Post hoc ergo propter hoc"),
        (r"\b(happened|occurred|changed).*\b(so|therefore|thus)\b.*\b(caused|led to|resulted in)\b", "Assuming causation from sequence"),
    ],
}

# Cognitive bias detection patterns
BIAS_PATTERNS = {
    Bias.CONFIRMATION: [
        (r"\b(as|just\s+as)\s+(we|I)\s+(expected|predicted|thought|knew)\b", "Confirming own prediction"),
        (r"\b(this|that|it)\s+(confirms|proves|shows)\s+(our|my)\b", "Seeking confirmation"),
    ],
    Bias.OVERCONFIDENCE: [
        (r"\b(certainly|definitely|absolutely|undoubtedly|without\s+doubt)\b", "Absolute certainty words"),
        (r"\b100%|one hundred percent|zero chance|no way\b", "Extreme probability claims"),
    ],
    Bias.ANCHORING: [
        (r"\b(starting|beginning|initial)\s+(from|with|at)\b", "Anchoring to initial value"),
    ],
    Bias.AVAILABILITY: [
        (r"\b(recently|just\s+(saw|read|heard)|in\s+the\s+news)\b", "Over-weighting recent/vivid"),
        (r"\b(famous|well-known|popular)\s+example\b", "Relying on memorable examples"),
    ],
    Bias.SURVIVORSHIP: [
        (r"\b(look\s+at|consider)\s+(all\s+the|these)\s+(successful|winners)\b", "Only looking at successes"),
    ],
}


# ═══════════════════════════════════════════════════════════════
# REASONING ENGINE
# ═══════════════════════════════════════════════════════════════

class ReasoningEngine:
    """
    The brain of reasoning quality in CAOS.
    
    Used by Kahneman in the AUDIT phase.
    Audits agent output for logical fallacies, biases, weak evidence,
    and missing assumptions.
    
    Usage:
        engine = ReasoningEngine()
        audit = engine.audit(agent_output, agent_name, task_context)
        
        if not audit.passed:
            agent must revise reasoning
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        self.toon_dir = Path(toon_dir)
        self.principles_dir = self.toon_dir / "hermes" / "caos" / "principles"
        
        # Load custom first principles
        self.custom_principles = self._load_custom_principles()
    
    def _load_custom_principles(self) -> dict:
        """Load project-specific first principles."""
        principles = {}
        principles_file = self.principles_dir / "first_principles.json"
        if principles_file.exists():
            try:
                with open(principles_file) as f:
                    data = json.load(f)
                    for domain, prins in data.items():
                        principles[domain] = [
                            FirstPrinciple(**p) for p in prins
                        ]
            except Exception:
                pass
        
        # Merge with built-in
        all_principles = dict(FIRST_PRINCIPLES)
        all_principles.update(principles)
        return all_principles
    
    def audit(self, agent_output: str, agent_name: str,
              task_context: dict) -> ReasoningAudit:
        """
        Full reasoning audit.
        
        Returns ReasoningAudit — passed=False means the reasoning is flawed.
        """
        
        # 1. Detect logical fallacies
        fallacies = self._detect_fallacies(agent_output)
        
        # 2. Detect cognitive biases
        biases = self._detect_biases(agent_output, task_context)
        
        # 3. Build evidence chain
        evidence_chain = self._build_evidence_chain(agent_output, task_context)
        
        # 4. Quantify uncertainty
        uncertainty = self._quantify_uncertainty(agent_output, task_context, evidence_chain)
        
        # 5. Surface assumptions
        assumptions = self._surface_assumptions(agent_output, task_context)
        
        # 6. Check first principles
        principles_used = self._check_first_principles(agent_output, task_context)
        
        # 7. Check alternatives considered
        alternatives = self._check_alternatives(agent_output)
        
        # 8. Identify missing evidence
        missing_evidence = self._identify_missing_evidence(agent_output, evidence_chain)
        
        # Calculate score
        score = self._compute_score(
            fallacies, biases, evidence_chain, uncertainty,
            len(assumptions), len(alternatives), len(missing_evidence)
        )
        
        # Determine pass/fail
        critical_issues = len(fallacies) + len([b for b in biases if b[2] > 0.7])
        passed = (
            critical_issues == 0
            and (evidence_chain is None or not evidence_chain.is_weak_chain())
            and (uncertainty is None or uncertainty.confidence >= 0.5)
        )
        
        # Build suggestion
        suggestion = self._build_suggestion(
            fallacies, biases, evidence_chain, uncertainty,
            assumptions, alternatives, missing_evidence
        )
        
        return ReasoningAudit(
            passed=passed,
            fallacies=fallacies,
            biases=biases,
            evidence_chain=evidence_chain,
            uncertainty=uncertainty,
            assumptions_surfaced=assumptions,
            alternatives_considered=alternatives,
            first_principles_used=principles_used,
            missing_evidence=missing_evidence,
            suggestion=suggestion,
            score=score,
        )
    
    def _detect_fallacies(self, text: str) -> list[tuple[LogicFallacy, str]]:
        """Detect logical fallacies in the reasoning."""
        found = []
        text_lower = text.lower()
        
        for fallacy, patterns in FALLACY_PATTERNS.items():
            for pattern, description in patterns:
                match = re.search(pattern, text_lower)
                if match:
                    # Extract context around the match
                    start = max(0, match.start() - 40)
                    end = min(len(text_lower), match.end() + 40)
                    context = text_lower[start:end]
                    found.append((fallacy, context[:80]))
                    break  # One match per fallacy type
        
        return found
    
    def _detect_biases(self, text: str, context: dict) -> list[tuple[Bias, str, float]]:
        """Detect cognitive biases in the reasoning. Returns (bias, location, confidence)."""
        found = []
        text_lower = text.lower()
        
        for bias, patterns in BIAS_PATTERNS.items():
            for pattern, description in patterns:
                match = re.search(pattern, text_lower)
                if match:
                    start = max(0, match.start() - 30)
                    end = min(len(text_lower), match.end() + 30)
                    location = text_lower[start:end][:80]
                    # Confidence based on pattern specificity
                    confidence = 0.7 if len(pattern) > 30 else 0.5
                    found.append((bias, location, confidence))
                    break
        
        # Context-specific bias checks
        confidence = context.get("confidence", 0.5)
        if confidence > 0.9:
            found.append((
                Bias.OVERCONFIDENCE,
                f"Reported confidence {confidence:.0%} is extremely high",
                0.8
            ))
        
        return found
    
    def _build_evidence_chain(self, text: str, context: dict) -> Optional[EvidenceChain]:
        """Build evidence chain from the output and context."""
        evidence_sources = context.get("evidence_sources", [])
        verification = context.get("verification", {})
        
        nodes = []
        
        # Add explicit evidence from sources
        for i, source in enumerate(evidence_sources[:10]):
            source_type = "explicit_source"
            source_conf = 0.7  # Default confidence for explicit sources
            
            if "graph" in str(source).lower():
                source_type = "graph_query"
                source_conf = 0.65
            elif "file" in str(source).lower():
                source_type = "file_read"
                source_conf = 0.75
            elif "test" in str(source).lower():
                source_type = "test_output"
                source_conf = 0.80
            elif "internet" in str(source).lower():
                source_type = "internet_search"
                source_conf = 0.50  # Internet needs extra verification
            elif "memory" in str(source).lower():
                source_type = "previous_memory"
                source_conf = 0.60
            
            nodes.append(EvidenceNode(
                id=f"e-{i}",
                claim=str(source)[:100],
                source=str(source),
                source_type=source_type,
                confidence=source_conf,
            ))
        
        # Add verification evidence
        if verification:
            checks = verification.get("checks", {})
            for check_name, passed in checks.items():
                nodes.append(EvidenceNode(
                    id=f"e-verify-{check_name}",
                    claim=f"Verification check '{check_name}': {'PASSED' if passed else 'FAILED'}",
                    source=f"verification:{check_name}",
                    source_type="test_output" if "test" in check_name.lower() else "quinn_check",
                    confidence=0.85 if passed else 0.2,
                ))
        
        if not nodes:
            return None
        
        # Compute chain strength
        if nodes:
            avg_confidence = sum(n.confidence for n in nodes) / len(nodes)
            diversity = len(set(n.source_type for n in nodes)) / max(len(nodes), 1)
            chain_strength = (avg_confidence * 0.6 + diversity * 0.4)
        else:
            chain_strength = 0.0
        
        return EvidenceChain(
            conclusion=text[:100] if len(text) > 100 else text,
            nodes=nodes,
            chain_strength=chain_strength,
        )
    
    def _quantify_uncertainty(self, text: str, context: dict,
                               evidence_chain: Optional[EvidenceChain]) -> Optional[Uncertainty]:
        """Quantify uncertainty in the agent's conclusions."""
        confidence = context.get("confidence", 0.5)
        evidence_sources = context.get("evidence_sources", [])
        evidence_count = len(evidence_sources)
        
        # Bayesian-inspired uncertainty quantification
        # Prior: 0.5 (complete uncertainty)
        # Evidence strength: how much each source moves the needle
        prior = 0.5
        evidence_strength = 0.15 if evidence_count > 0 else 0.0
        
        # Posterior = prior updated by evidence
        if evidence_count > 0:
            # Each piece of evidence reduces uncertainty
            posterior = prior + (1 - prior) * (1 - math.exp(-evidence_count * evidence_strength))
        else:
            posterior = prior
        
        # Adjust with chain strength if available
        if evidence_chain:
            posterior = (posterior + evidence_chain.chain_strength) / 2
        
        # Confidence interval: ±20% of the gap to 1.0
        gap = 1.0 - posterior
        lower = max(0.0, posterior - gap * 0.2)
        upper = min(1.0, posterior + gap * 0.2)
        
        # What we know we don't know
        unknowns = self._identify_unknowns(text, context)
        assumptions = self._surface_assumptions(text, context)
        
        return Uncertainty(
            claim=text[:80],
            confidence=posterior,
            lower_bound=lower,
            upper_bound=upper,
            evidence_count=evidence_count,
            sources=[str(s)[:60] for s in evidence_sources],
            unknowns=unknowns,
            assumptions=assumptions,
        )
    
    def _identify_unknowns(self, text: str, context: dict) -> list[str]:
        """Identify what the agent doesn't know."""
        unknowns = []
        text_lower = text.lower()
        
        # Agent explicitly says it doesn't know
        uncertainty_markers = [
            r"\b(i'm|i am|we are|we're)\s+not\s+sure\b",
            r"\b(i|we)\s+don't\s+know\b",
            r"\b(unclear|uncertain|unknown|ambig)\b",
            r"\b(might|may|could|possibly|perhaps)\b",
            r"\b(needs?\s+(more|further|additional))\b",
        ]
        
        for marker in uncertainty_markers:
            if re.search(marker, text_lower):
                # Extract the sentence
                for sentence in text_lower.split('. '):
                    if re.search(marker, sentence):
                        unknowns.append(sentence[:100].strip())
        
        if not unknowns:
            # Agent didn't express any uncertainty — that's itself a red flag
            unknowns.append("Agent did not identify any unknowns — possible overconfidence")
        
        return unknowns[:5]
    
    def _surface_assumptions(self, text: str, context: dict) -> list[str]:
        """Surface implicit assumptions in the reasoning."""
        assumptions = []
        text_lower = text.lower()
        
        # Common implicit assumptions
        assumption_markers = [
            (r"\b(assuming|assume|if we assume)\b", "Explicit assumption"),
            (r"\b(should|must|has to|need to)\b", "Implicit obligation/requirement"),
            (r"\b(will|going to|is expected to)\b", "Future prediction assumed certain"),
            (r"\b(obviously|clearly|of course|naturally)\b", "Assumed without justification"),
            (r"\b(the|our|this)\s+(system|code|app|project)\s+(has|uses|is)\b", "Assumption about current state"),
        ]
        
        for pattern, assumption_type in assumption_markers:
            match = re.search(pattern, text_lower)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(text_lower), match.end() + 50)
                assumptions.append(f"[{assumption_type}] {text_lower[start:end][:100]}")
        
        # Context-based assumptions
        task = context.get("task", "")
        if task and "should" not in text_lower and "must" not in text_lower:
            assumptions.append("No explicit constraints or requirements stated")
        
        return assumptions[:5]
    
    def _check_first_principles(self, text: str, context: dict) -> list[str]:
        """Check which first principles are used or violated."""
        principles_found = []
        text_lower = text.lower()
        task_lower = context.get("task", "").lower()
        
        # Determine relevant domains
        domains = ["cs"]  # Default
        if "security" in task_lower or "auth" in task_lower or "password" in task_lower:
            domains.append("security")
        if "math" in task_lower or "algorithm" in task_lower or "optimization" in task_lower:
            domains.append("math")
        
        for domain in domains:
            for fp in self.custom_principles.get(domain, FIRST_PRINCIPLES.get(domain, [])):
                # Check if principle's concepts appear in the reasoning
                fp_keywords = set(fp.statement.lower().split()) & set(
                    "principle theorem law theorem lemma axiom rule constraint requirement".split()
                )
                
                # More lenient: check if any significant words from the principle appear
                fp_words = [w for w in fp.statement.lower().split() 
                           if len(w) > 4 and w not in ("every", "that", "must", "have", "with", "from", "than", "this", "they", "their")]
                
                if any(w in text_lower for w in fp_words[:3]):
                    principles_found.append(fp.statement[:120])
        
        return principles_found[:5]
    
    def _check_alternatives(self, text: str) -> list[str]:
        """Check if alternatives were considered."""
        alternatives = []
        text_lower = text.lower()
        
        alternative_markers = [
            r"\b(alternatively|another (way|approach|option)|on the other hand)\b",
            r"\b(instead of|rather than|as opposed to)\b",
            r"\b(we could|one could|you could|might instead)\b",
            r"\b(option [a-z\d]|approach [a-z\d]|solution [a-z\d])\b",
            r"\b(trade.?off|pros?.{0,10}cons?|advantage.{0,20}disadvantage)\b",
        ]
        
        for marker in alternative_markers:
            if re.search(marker, text_lower):
                # Extract the alternative
                for sentence in text_lower.split('. '):
                    if re.search(marker, sentence):
                        alternatives.append(sentence[:120].strip())
        
        if not alternatives and len(text) > 500:
            alternatives.append("⚠️  No alternatives considered — output presents single path")
        
        return alternatives[:5]
    
    def _identify_missing_evidence(self, text: str, 
                                    evidence_chain: Optional[EvidenceChain]) -> list[str]:
        """Identify what evidence is missing."""
        missing = []
        
        if evidence_chain is None:
            missing.append("No evidence chain at all — output is pure assertion")
            return missing
        
        # Check source diversity
        source_types = set(n.source_type for n in evidence_chain.nodes)
        expected_sources = {"graph_query", "file_read", "test_output", "documentation"}
        missing_sources = expected_sources - source_types
        if missing_sources:
            missing.append(f"Missing evidence types: {missing_sources}")
        
        # Check for assertions without backing
        text_lower = text.lower()
        claim_markers = [
            r"\b(is|are|was|were)\s+(the|a)\s+(best|worst|fastest|slowest|only)\b",
            r"\b(proved|proven|guaranteed|certain)\b",
        ]
        
        for marker in claim_markers:
            if re.search(marker, text_lower) and evidence_chain.chain_strength < 0.6:
                missing.append(f"Strong claim '{marker}' without strong evidence (chain strength: {evidence_chain.chain_strength:.0%})")
        
        return missing[:5]
    
    def _compute_score(self, fallacies: list, biases: list, 
                       evidence_chain: Optional[EvidenceChain],
                       uncertainty: Optional[Uncertainty],
                       assumption_count: int, alternative_count: int,
                       missing_evidence_count: int) -> float:
        """Compute overall reasoning score 0-1."""
        score = 1.0
        
        # Penalties
        score -= len(fallacies) * 0.15  # Each fallacy is serious
        score -= len([b for b in biases if b[2] > 0.7]) * 0.10
        score -= len([b for b in biases if b[2] <= 0.7]) * 0.05
        
        if evidence_chain:
            if evidence_chain.is_weak_chain():
                score -= 0.15
            score = min(score, evidence_chain.chain_strength * 0.8 + 0.2)
        else:
            score -= 0.30  # No evidence chain
        
        if uncertainty and uncertainty.confidence < 0.4:
            score -= 0.10
        
        score -= missing_evidence_count * 0.08
        score -= max(0, (3 - min(assumption_count, 3))) * 0.05  # Penalty for not surfacing assumptions
        score -= max(0, (1 - alternative_count)) * 0.05  # No alternatives is bad
        
        # Bonuses
        if alternative_count >= 2:
            score += 0.05
        if assumption_count >= 3:
            score += 0.05
        if evidence_chain and len(evidence_chain.nodes) >= 3:
            score += 0.05
        
        return max(0.0, min(1.0, score))
    
    def _build_suggestion(self, fallacies: list, biases: list,
                          evidence_chain: Optional[EvidenceChain],
                          uncertainty: Optional[Uncertainty],
                          assumptions: list[str], alternatives: list[str],
                          missing_evidence: list[str]) -> str:
        """Build actionable improvement suggestion."""
        suggestions = []
        
        if fallacies:
            fallacy_names = [f[0].value for f in fallacies]
            suggestions.append(f"Fix logical fallacies: {', '.join(fallacy_names)}")
        
        if biases:
            bias_names = [b[0].value for b in biases]
            suggestions.append(f"Address cognitive biases: {', '.join(bias_names)}")
        
        if evidence_chain is None or evidence_chain.is_weak_chain():
            suggestions.append("Strengthen evidence chain: add multiple independent sources (graph, files, tests)")
        
        if missing_evidence:
            suggestions.append(f"Gather missing evidence: {', '.join(missing_evidence[:3])}")
        
        if len(alternatives) < 2:
            suggestions.append("Consider at least 2 alternative approaches with tradeoffs")
        
        if len(assumptions) < 2:
            suggestions.append("Surface implicit assumptions — what are you assuming without stating?")
        
        if not suggestions:
            suggestions.append("Reasoning passes all checks")
        
        return " | ".join(suggestions)
    
    # ── BAYESIAN BELIEF UPDATING ─────────────────────────────
    
    def update_belief(self, prior: float, evidence_strength: float, 
                      evidence_reliability: float = 0.7) -> float:
        """
        Bayesian belief update.
        
        Args:
            prior: Prior belief (0-1)
            evidence_strength: How strongly evidence supports belief (0-1)
            evidence_reliability: How reliable is the evidence source (0-1)
        
        Returns:
            Posterior belief
        """
        # P(H|E) = P(E|H) * P(H) / P(E)
        # P(E|H) = evidence_strength * evidence_reliability + (1-evidence_reliability)*0.5
        likelihood = evidence_strength * evidence_reliability + (1 - evidence_reliability) * 0.5
        
        # P(E) = P(E|H)*P(H) + P(E|~H)*P(~H)
        marginal = likelihood * prior + (1 - likelihood) * (1 - prior)
        
        if marginal == 0:
            return prior
        
        posterior = (likelihood * prior) / marginal
        return max(0.01, min(0.99, posterior))  # Never 0 or 1


# ═══════════════════════════════════════════════════════════════
# PIPELINE INTEGRATION: KAHNEMAN AUDIT
# ═══════════════════════════════════════════════════════════════

def kahneman_audit(agent_output: str, agent_name: str, 
                   task_context: dict) -> ReasoningAudit:
    """
    Kahneman calls this before any output is delivered.
    
    Returns ReasoningAudit — if passed=False, the output is rejected
    and the agent must fix its reasoning.
    """
    engine = ReasoningEngine()
    return engine.audit(agent_output, agent_name, task_context)


# ═══════════════════════════════════════════════════════════════
# DIRECT TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    engine = ReasoningEngine()
    
    # Test 1: Bad reasoning (fallacies, no evidence, overconfident)
    bad_output = """The system is obviously secure because we used encryption.
    All secure systems use encryption, therefore our system is secure.
    Experts agree that encryption is sufficient for security.
    We must choose between perfect security and usability — there's no middle ground."""
    
    print("=" * 60)
    print("  BAD REASONING AUDIT")
    print("=" * 60)
    audit = engine.audit(bad_output, "dev", {"task": "security review"})
    print(f"  Passed: {audit.passed}")
    print(f"  Score: {audit.score:.0%}")
    print(f"  Fallacies: {[f[0].value for f in audit.fallacies]}")
    print(f"  Biases: {[b[0].value for b in audit.biases]}")
    print(f"  Missing evidence: {audit.missing_evidence}")
    print(f"  Suggestion: {audit.suggestion}")
    
    # Test 2: Good reasoning (evidence, alternatives, acknowledged uncertainty)
    good_output = """Based on file analysis of auth.py (3 endpoints detected) and 
    test results (5/5 unit tests pass), the login system handles the happy path correctly.
    
    However, we should note: the edge case of concurrent logins is untested.
    We could handle this through database-level locks, or application-level 
    optimistic concurrency — the tradeoff is complexity vs scalability.
    
    Given that we have high test coverage but no concurrency tests,
    I'm about 70% confident the system is production-ready. We need 
    load testing to verify."""
    
    print()
    print("=" * 60)
    print("  GOOD REASONING AUDIT")
    print("=" * 60)
    audit2 = engine.audit(good_output, "quinn", {
        "task": "verify login system",
        "evidence_sources": ["file_read:auth.py", "test_output:5/5 pass"],
        "verification": {"checks": {"unit_tests": True, "integration_tests": True}},
        "confidence": 0.7,
    })
    print(f"  Passed: {audit2.passed}")
    print(f"  Score: {audit2.score:.0%}")
    print(f"  Fallacies: {[f[0].value for f in audit2.fallacies]}")
    print(f"  Biases: {[b[0].value for b in audit2.biases]}")
    if audit2.evidence_chain:
        print(f"  Evidence chain strength: {audit2.evidence_chain.chain_strength:.0%}")
    if audit2.uncertainty:
        print(f"  Uncertainty: {audit2.uncertainty.confidence:.0%} (range: {audit2.uncertainty.lower_bound:.0%}-{audit2.uncertainty.upper_bound:.0%})")
    print(f"  Alternatives: {audit2.alternatives_considered}")
    print(f"  Assumptions: {audit2.assumptions_surfaced}")
    print(f"  Suggestion: {audit2.suggestion}")
