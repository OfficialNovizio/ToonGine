"""
CAOS — Mistake Rules Engine: Convert Every Mistake Into A Prevention Rule

This is how agents LEARN. Not just "remember" mistakes — but convert them
into queryable, matchable rules that prevent the same mistake from happening again.

Fable 5 "kills incorrect beliefs." We do that AND convert them into rules.

THE MISTAKE-TO-RULE PIPELINE:
1. Mistake detected (self-counter, Quinn, Kahneman, Council)
2. Extract pattern from mistake (what exactly went wrong)
3. Generalize into a prevention rule (IF situation X THEN check Y BEFORE doing Z)
4. Store in queryable rule database
5. Inject at session start (so agent sees "don't do what you did last time")
6. Match against current task (is this rule relevant to what I'm about to do?)
"""

import json, re, time, hashlib, os
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from pathlib import Path


# ═══════════════════════════════════════════════════════════════
# TYPES
# ═══════════════════════════════════════════════════════════════

class RuleTrigger(Enum):
    """When does this rule fire?"""
    BEFORE_TASK = "before_task"       # Check before starting a task
    DURING_TASK = "during_task"       # Check while executing
    BEFORE_COMMIT = "before_commit"   # Check before git commit
    BEFORE_DEPLOY = "before_deploy"   # Check before deploying
    ON_ERROR = "on_error"             # Check when specific error occurs
    ALWAYS = "always"                 # Always active

class RuleSeverity(Enum):
    HARD_BLOCK = "hard_block"     # BLOCK the action entirely
    REQUIRE_CHECK = "require_check"  # Require verification
    WARN = "warn"                 # Warn but allow
    SUGGEST = "suggest"           # Soft suggestion
    LEARNED = "learned"            # Auto-generated from mistake

@dataclass
class MistakeRecord:
    """A recorded mistake with full context."""
    id: str
    agent: str
    task: str
    description: str
    root_cause: str
    code_snippet: str          # The actual code that was wrong
    fix_snippet: str           # The fix that was applied
    pattern: str               # Regex pattern extracted from mistake
    severity: RuleSeverity
    timestamp: float = field(default_factory=time.time)
    occurrence_count: int = 1
    tags: list[str] = field(default_factory=list)

@dataclass
class PreventionRule:
    """A rule that prevents a specific mistake from happening again."""
    id: str
    rule_text: str             # Human-readable: "IF doing X, THEN check Y before Z"
    trigger: RuleTrigger
    severity: RuleSeverity
    pattern: str               # Regex to match against task/code
    check_function: str        # Name of check function to call
    source_mistakes: list[str] # Mistake IDs that created this rule
    prevention: str            # What to do instead
    created: float = field(default_factory=time.time)
    last_fired: float = 0.0
    fire_count: int = 0
    false_positive_count: int = 0
    
    @property
    def precision(self) -> float:
        """How often this rule was right."""
        total = self.fire_count + self.false_positive_count
        return self.fire_count / max(total, 1) if total > 0 else 0.5

@dataclass
class RuleMatch:
    """A rule that matched the current task."""
    rule: PreventionRule
    relevance: float           # 0-1 how relevant this rule is
    matched_on: str            # What text triggered the match
    action_required: str       # What the agent should do


# ═══════════════════════════════════════════════════════════════
# BUILT-IN PREVENTION RULES (from common mistakes)
# ═══════════════════════════════════════════════════════════════

BUILT_IN_RULES = [
    PreventionRule(
        id="rule-001",
        rule_text="IF writing authentication code THEN use constant-time comparison, never direct string compare",
        trigger=RuleTrigger.DURING_TASK,
        severity=RuleSeverity.HARD_BLOCK,
        pattern=r"\b(auth|login|signup|password|token|jwt|session)\b",
        check_function="check_auth_security",
        source_mistakes=[],
        prevention="Use secrets.compare_digest() or timing-safe comparison. Never use == for passwords.",
    ),
    PreventionRule(
        id="rule-002",
        rule_text="IF writing SQL queries THEN use parameterized queries, never string formatting",
        trigger=RuleTrigger.DURING_TASK,
        severity=RuleSeverity.HARD_BLOCK,
        pattern=r"\b(sql|query|database|db|execute|cursor|SELECT|INSERT|UPDATE|DELETE)\b",
        check_function="check_sql_injection",
        source_mistakes=["mistake-sql-fstring-001", "mistake-sql-injection-002"],
        prevention="Use cursor.execute('SELECT ... WHERE id=?', (id,)) — never f-strings or % formatting.",
    ),
    PreventionRule(
        id="rule-003",
        rule_text="IF deploying to production THEN verify all tests pass AND security audit done",
        trigger=RuleTrigger.BEFORE_DEPLOY,
        severity=RuleSeverity.HARD_BLOCK,
        pattern=r"\b(deploy|production|release|ship|publish)\b",
        check_function="check_deploy_gates",
        source_mistakes=[],
        prevention="Run full test suite + security scan before deploy. Never deploy on Friday.",
    ),
    PreventionRule(
        id="rule-004",
        rule_text="IF handling user input THEN sanitize and validate BEFORE any processing",
        trigger=RuleTrigger.DURING_TASK,
        severity=RuleSeverity.HARD_BLOCK,
        pattern=r"\b(input|form|user|request|body|params|query)\b",
        check_function="check_input_validation",
        source_mistakes=["mistake-xss-001", "mistake-injection-003"],
        prevention="Validate type, length, format. Sanitize HTML. Never trust input.",
    ),
    PreventionRule(
        id="rule-005",
        rule_text="IF writing async code THEN handle promise rejections and timeouts",
        trigger=RuleTrigger.DURING_TASK,
        severity=RuleSeverity.WARN,
        pattern=r"\b(async|await|promise|then\(|\.catch)\b",
        check_function="check_async_error_handling",
        source_mistakes=["mistake-unhandled-promise-001"],
        prevention="Always .catch() or try/catch around await. Set timeouts for network calls.",
    ),
    PreventionRule(
        id="rule-006",
        rule_text="IF committing code THEN run linter and type checker first",
        trigger=RuleTrigger.BEFORE_COMMIT,
        severity=RuleSeverity.HARD_BLOCK,
        pattern=r"\b(commit|push|merge|PR|pull request)\b",
        check_function="check_pre_commit",
        source_mistakes=["mistake-lint-fail-ci-001"],
        prevention="Run: npm run lint && npm run typecheck && npm test before committing.",
    ),
    PreventionRule(
        id="rule-007",
        rule_text="IF modifying database schema THEN create a reversible migration",
        trigger=RuleTrigger.DURING_TASK,
        severity=RuleSeverity.HARD_BLOCK,
        pattern=r"\b(migration|schema|alter|drop|add column|create table)\b",
        check_function="check_migration_safety",
        source_mistakes=["mistake-irreversible-migration-001"],
        prevention="Every migration MUST have a down/rollback. Test both directions.",
    ),
    PreventionRule(
        id="rule-008",
        rule_text="IF writing API endpoints THEN add rate limiting",
        trigger=RuleTrigger.DURING_TASK,
        severity=RuleSeverity.WARN,
        pattern=r"\b(api|endpoint|route|POST|GET|PUT|DELETE)\b",
        check_function="check_rate_limiting",
        source_mistakes=["mistake-no-rate-limit-001"],
        prevention="Add rate limiting middleware: max N requests per minute per IP/user.",
    ),
    PreventionRule(
        id="rule-009",
        rule_text="IF handling errors THEN never expose stack traces to the client",
        trigger=RuleTrigger.DURING_TASK,
        severity=RuleSeverity.HARD_BLOCK,
        pattern=r"\b(error|exception|catch|try|500|stack)\b",
        check_function="check_error_exposure",
        source_mistakes=["mistake-stack-trace-leak-001"],
        prevention="In production: return generic 500. Log stack traces server-side only.",
    ),
    PreventionRule(
        id="rule-010",
        rule_text="IF writing configuration THEN use environment variables, never hardcode secrets",
        trigger=RuleTrigger.DURING_TASK,
        severity=RuleSeverity.HARD_BLOCK,
        pattern=r"\b(config|env|secret|key|token|password|credential)\b",
        check_function="check_hardcoded_secrets",
        source_mistakes=["mistake-hardcoded-secret-001"],
        prevention="Use process.env.SECRET or os.environ.get('SECRET'). Never commit secrets.",
    ),
]


# ═══════════════════════════════════════════════════════════════
# MISTAKE RULES ENGINE
# ═══════════════════════════════════════════════════════════════

class MistakeRulesEngine:
    """
    Converts mistakes into prevention rules and matches them against tasks.
    
    Usage:
        engine = MistakeRulesEngine()
        
        # Record a mistake
        engine.record_mistake(agent="dev", task="build auth", 
                              description="Used f-string in SQL query",
                              code_snippet='f"SELECT * FROM users WHERE email={email}"',
                              fix_snippet='cursor.execute("SELECT * FROM users WHERE email=?", (email,))')
        
        # Get rules relevant to current task
        matches = engine.match_rules("Build login API with database queries")
        for match in matches:
            print(f"⚠️  {match.rule.rule_text}")
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        self.toon_dir = Path(toon_dir)
        self.rules_dir = self.toon_dir / "hermes" / "caos" / "rules"
        self.mistakes_dir = self.toon_dir / "hermes" / "caos" / "mistakes"
        
        self.rules_dir.mkdir(parents=True, exist_ok=True)
        self.mistakes_dir.mkdir(parents=True, exist_ok=True)
        
        # Load rules (built-in + learned)
        self.rules: list[PreventionRule] = self._load_rules()
        
        # Load mistake history
        self.mistakes: list[MistakeRecord] = self._load_mistakes()
    
    def _load_rules(self) -> list[PreventionRule]:
        """Load all prevention rules."""
        rules_file = self.rules_dir / "prevention_rules.json"
        rules = list(BUILT_IN_RULES)
        
        if rules_file.exists():
            try:
                with open(rules_file) as f:
                    data = json.load(f)
                    for r in data.get("rules", []):
                        rules.append(PreventionRule(
                            id=r["id"],
                            rule_text=r["rule_text"],
                            trigger=RuleTrigger(r["trigger"]),
                            severity=RuleSeverity(r["severity"]),
                            pattern=r["pattern"],
                            check_function=r.get("check_function", ""),
                            source_mistakes=r.get("source_mistakes", []),
                            prevention=r.get("prevention", ""),
                            created=r.get("created", time.time()),
                            last_fired=r.get("last_fired", 0),
                            fire_count=r.get("fire_count", 0),
                            false_positive_count=r.get("false_positive_count", 0),
                        ))
            except Exception:
                pass
        
        return rules
    
    def _load_mistakes(self) -> list[MistakeRecord]:
        """Load mistake history."""
        mistakes_file = self.mistakes_dir / "history.json"
        if mistakes_file.exists():
            try:
                with open(mistakes_file) as f:
                    data = json.load(f)
                    return [MistakeRecord(**m) for m in data.get("mistakes", [])]
            except Exception:
                pass
        return []
    
    # ── RECORDING ────────────────────────────────────────────
    
    def record_mistake(self, agent: str, task: str, description: str,
                       root_cause: str = "", code_snippet: str = "",
                       fix_snippet: str = "", tags: list[str] = None) -> MistakeRecord:
        """
        Record a mistake and automatically generate a prevention rule from it.
        """
        
        # Generate ID
        mistake_id = f"mistake-{hashlib.md5(f'{agent}{task}{description}'.encode()).hexdigest()[:8]}"
        
        # Extract pattern from mistake
        pattern = self._extract_pattern(code_snippet, description, root_cause)
        
        # Create mistake record
        mistake = MistakeRecord(
            id=mistake_id,
            agent=agent,
            task=task,
            description=description,
            root_cause=root_cause or description,
            code_snippet=code_snippet,
            fix_snippet=fix_snippet,
            pattern=pattern or "",
            severity=RuleSeverity.LEARNED,
            tags=tags or [],
        )
        
        # Check if similar mistake exists
        for existing in self.mistakes:
            if existing.pattern and pattern and self._patterns_similar(existing.pattern, pattern):
                existing.occurrence_count += 1
                existing.timestamp = time.time()
                self._save_mistakes()
                return existing
        
        self.mistakes.append(mistake)
        
        # Auto-generate a prevention rule from this mistake
        rule = self._generate_rule_from_mistake(mistake)
        if rule:
            self._add_rule(rule)
        
        self._save_mistakes()
        return mistake
    
    def _extract_pattern(self, code: str, description: str, root_cause: str) -> str:
        """Extract a regex pattern from a mistake."""
        if code:
            # Use the actual problematic code as a pattern
            # Escape special regex chars and limit length
            return re.escape(code.strip()[:120])
        
        # Extract keywords from description
        combined = f"{description} {root_cause}".lower()
        
        if "f-string" in combined or "f'" in combined or 'f"' in combined or "format" in combined:
            if "sql" in combined or "query" in combined:
                return r"(execute|cursor|query).*[f'\"].*\b(WHERE|SELECT|INSERT|FROM)\b"
        
        if "hardcoded" in combined or "secret" in combined:
            return r"(password|secret|token|api_key|apikey)\s*=\s*['\"][^'\"]{4,}['\"]"
        
        if "bare except" in combined:
            return r"except\s*:"
        
        if "mutable default" in combined:
            return r"def \w+\([^)]*=\s*(\[\]|\{\})"
        
        if "xss" in combined or "cross site" in combined:
            return r"(innerHTML|dangerouslySetInnerHTML|document\.write)"
        
        if "race condition" in combined or "concurrent" in combined:
            return r"(+=|\.update\(|\.save\().*async"
        
        # Generic: use description keywords
        words = [w for w in description.split() if len(w) > 4]
        if words:
            return '|'.join(re.escape(w) for w in words[:5])
        
        return re.escape(description[:80])
    
    def _patterns_similar(self, p1: str, p2: str) -> bool:
        """Check if two regex patterns are similar (same mistake type)."""
        # Simple: check overlap in non-regex characters
        chars1 = set(c for c in p1 if c.isalpha())
        chars2 = set(c for c in p2 if c.isalpha())
        if not chars1 or not chars2:
            return False
        overlap = len(chars1 & chars2) / len(chars1 | chars2)
        return overlap > 0.6
    
    def _generate_rule_from_mistake(self, mistake: MistakeRecord) -> Optional[PreventionRule]:
        """Auto-generate a prevention rule from a mistake."""
        
        # Build rule text from mistake
        if "sql" in mistake.description.lower() or "query" in mistake.description.lower():
            rule_text = "IF writing database queries THEN use parameterized queries, never string formatting"
            trigger = RuleTrigger.DURING_TASK
            check_function = "check_sql_injection"
            prevention = "Use parameterized queries: cursor.execute('SELECT ... WHERE id=?', (id,))"
        elif "secret" in mistake.description.lower() or "hardcoded" in mistake.description.lower():
            rule_text = "IF writing configuration or credentials THEN use environment variables"
            trigger = RuleTrigger.DURING_TASK
            check_function = "check_hardcoded_secrets"
            prevention = "Use process.env.SECRET or os.environ.get('SECRET'). Never hardcode."
        elif "except" in mistake.description.lower() and "bare" in mistake.description.lower():
            rule_text = "IF writing error handling THEN catch specific exceptions, never bare except"
            trigger = RuleTrigger.DURING_TASK
            check_function = "check_exception_handling"
            prevention = "Catch specific exceptions: except ValueError as e:"
        elif "mutable" in mistake.description.lower():
            rule_text = "IF defining function defaults THEN use None, not mutable objects"
            trigger = RuleTrigger.DURING_TASK
            check_function = "check_mutable_defaults"
            prevention = "Use None as default: def fn(arg=None): arg = arg or []"
        elif "deploy" in mistake.description.lower() or "production" in mistake.description.lower():
            rule_text = f"IF deploying THEN check: {mistake.description}"
            trigger = RuleTrigger.BEFORE_DEPLOY
            check_function = "check_deploy_safety"
            prevention = mistake.fix_snippet or "Verify all gates pass before deploying"
        elif "test" in mistake.description.lower():
            rule_text = f"IF modifying {mistake.task[:40]} THEN run the specific test: {mistake.description}"
            trigger = RuleTrigger.BEFORE_COMMIT
            check_function = "check_related_tests"
            prevention = mistake.fix_snippet or "Run related tests before committing"
        else:
            # Generic rule
            rule_text = f"IF working on {mistake.task[:40]} THEN remember: {mistake.description}"
            trigger = RuleTrigger.DURING_TASK
            check_function = "check_custom_rule"
            prevention = mistake.fix_snippet or mistake.root_cause
        
        rule_id = f"rule-learned-{mistake.id}"
        
        # Check if similar rule exists
        for existing in self.rules:
            if existing.pattern and mistake.pattern:
                if self._patterns_similar(existing.pattern, mistake.pattern):
                    existing.fire_count += 1
                    existing.source_mistakes.append(mistake.id)
                    existing.last_fired = time.time()
                    self._save_rules()
                    return None  # Don't duplicate
        
        return PreventionRule(
            id=rule_id,
            rule_text=rule_text,
            trigger=trigger,
            severity=RuleSeverity.LEARNED,
            pattern=mistake.pattern,
            check_function=check_function,
            source_mistakes=[mistake.id],
            prevention=prevention,
        )
    
    # ── MATCHING ─────────────────────────────────────────────
    
    def match_rules(self, task: str, code: str = "", context: dict = None) -> list[RuleMatch]:
        """
        Get all rules relevant to the current task.
        
        Returns rules sorted by relevance, with action_required.
        Agents MUST check these before proceeding.
        """
        matches = []
        task_lower = task.lower()
        code_lower = code.lower() if code else ""
        search_text = f"{task_lower} {code_lower}"
        
        for rule in self.rules:
            if not rule.pattern:
                continue
            
            # Check if rule pattern matches the task
            try:
                pattern_match = re.search(rule.pattern, search_text, re.IGNORECASE)
            except re.error:
                continue
            
            if pattern_match:
                # Calculate relevance
                relevance = 0.5  # Base relevance
                
                # Higher relevance for learned rules from similar tasks
                if rule.severity == RuleSeverity.LEARNED:
                    relevance += 0.2
                
                # Higher relevance for rules that have fired before (proven useful)
                if rule.fire_count > 0:
                    relevance += min(rule.precision * 0.3, 0.3)
                
                # Higher relevance for hard blocks
                if rule.severity == RuleSeverity.HARD_BLOCK:
                    relevance += 0.2
                
                # Build action required
                if rule.severity == RuleSeverity.HARD_BLOCK:
                    action = f"🛑 BLOCKED until: {rule.prevention}"
                elif rule.severity == RuleSeverity.REQUIRE_CHECK:
                    action = f"⚠️  VERIFY: {rule.prevention}"
                elif rule.severity == RuleSeverity.WARN:
                    action = f"⚠️  Warning: {rule.prevention}"
                else:
                    action = f"💡 Consider: {rule.prevention}"
                
                matches.append(RuleMatch(
                    rule=rule,
                    relevance=min(relevance, 1.0),
                    matched_on=pattern_match.group()[:60],
                    action_required=action,
                ))
                
                # Update rule stats
                rule.last_fired = time.time()
                rule.fire_count += 1
        
        # Sort by relevance
        matches.sort(key=lambda m: m.relevance, reverse=True)
        
        self._save_rules()
        return matches
    
    def hard_blocks(self, task: str, code: str = "") -> list[RuleMatch]:
        """Get only HARD_BLOCK rules — these must be resolved before proceeding."""
        return [m for m in self.match_rules(task, code) 
                if m.rule.severity == RuleSeverity.HARD_BLOCK]
    
    # ── SESSION INJECTION ────────────────────────────────────
    
    def get_session_context(self, task: str, agent: str, 
                            max_rules: int = 5,
                            max_mistakes: int = 3) -> str:
        """
        Build context string for injection at session start.
        
        Returns condensed text that tells the agent:
        1. Relevant prevention rules for this task
        2. Past mistakes from this agent (don't repeat these)
        3. Patterns this agent should check for
        """
        parts = []
        
        # 1. Relevant rules
        matches = self.match_rules(task)[:max_rules]
        if matches:
            parts.append("## Prevention Rules (active for this task)")
            for m in matches:
                icon = "🛑" if m.rule.severity == RuleSeverity.HARD_BLOCK else "⚠️" if m.rule.severity == RuleSeverity.REQUIRE_CHECK else "💡"
                parts.append(f"- {icon} {m.rule.rule_text}")
                if m.rule.prevention:
                    parts.append(f"  → {m.rule.prevention}")
        
        # 2. Past mistakes from this agent
        agent_mistakes = [m for m in self.mistakes if m.agent == agent]
        agent_mistakes.sort(key=lambda m: m.timestamp, reverse=True)
        
        if agent_mistakes:
            parts.append(f"\n## Your Past Mistakes ({agent})")
            for m in agent_mistakes[:max_mistakes]:
                parts.append(f"- {m.description}")
                if m.fix_snippet:
                    parts.append(f"  Fixed with: {m.fix_snippet[:80]}")
        
        # 3. Patterns to watch for
        patterns_to_watch = set()
        for m in matches:
            patterns_to_watch.add(m.rule.pattern)
        
        # Also add patterns from this agent's mistakes
        for m in agent_mistakes[:max_mistakes]:
            if m.pattern:
                patterns_to_watch.add(m.pattern)
        
        if patterns_to_watch:
            parts.append(f"\n## Pattern Watchlist")
            for i, p in enumerate(list(patterns_to_watch)[:5], 1):
                # Decode pattern for display (remove regex escapes)
                readable = p.replace('\\b', '').replace('\\s', ' ').replace('\\', '')
                parts.append(f"- Watch for: '{readable[:60]}'")
        
        return '\n'.join(parts) if parts else "No relevant rules or past mistakes for this task."
    
    # ── PERSISTENCE ──────────────────────────────────────────
    
    def _add_rule(self, rule: PreventionRule):
        """Add a rule to the list and save."""
        self.rules.append(rule)
        self._save_rules()
    
    def _save_rules(self):
        """Save rules to disk."""
        data = {
            "rules": [
                {
                    "id": r.id,
                    "rule_text": r.rule_text,
                    "trigger": r.trigger.value,
                    "severity": r.severity.value,
                    "pattern": r.pattern,
                    "check_function": r.check_function,
                    "source_mistakes": r.source_mistakes,
                    "prevention": r.prevention,
                    "created": r.created,
                    "last_fired": r.last_fired,
                    "fire_count": r.fire_count,
                    "false_positive_count": r.false_positive_count,
                }
                for r in self.rules
            ]
        }
        with open(self.rules_dir / "prevention_rules.json", 'w') as f:
            json.dump(data, f, indent=2)
    
    def _save_mistakes(self):
        """Save mistakes to disk."""
        data = {
            "mistakes": [
                {
                    "id": m.id,
                    "agent": m.agent,
                    "task": m.task,
                    "description": m.description,
                    "root_cause": m.root_cause,
                    "code_snippet": m.code_snippet,
                    "fix_snippet": m.fix_snippet,
                    "pattern": m.pattern,
                    "severity": m.severity.value,
                    "timestamp": m.timestamp,
                    "occurrence_count": m.occurrence_count,
                    "tags": m.tags,
                }
                for m in self.mistakes
            ]
        }
        with open(self.mistakes_dir / "history.json", 'w') as f:
            json.dump(data, f, indent=2)
    
    # ── FEEDBACK LOOP ────────────────────────────────────────
    
    def mark_rule_feedback(self, rule_id: str, was_helpful: bool):
        """Let agents mark whether a rule was actually helpful."""
        for rule in self.rules:
            if rule.id == rule_id:
                if was_helpful:
                    rule.fire_count += 1
                else:
                    rule.false_positive_count += 1
                
                # If rule is consistently wrong, degrade severity
                if rule.precision < 0.3 and rule.fire_count + rule.false_positive_count > 5:
                    if rule.severity == RuleSeverity.HARD_BLOCK:
                        rule.severity = RuleSeverity.WARN
                    elif rule.severity == RuleSeverity.REQUIRE_CHECK:
                        rule.severity = RuleSeverity.SUGGEST
                
                self._save_rules()
                break


# ═══════════════════════════════════════════════════════════════
# PIPELINE INTEGRATION
# ═══════════════════════════════════════════════════════════════

def inject_mistake_rules(task: str, agent: str, max_rules: int = 5) -> str:
    """
    Called at session start to inject relevant prevention rules.
    
    This is part of SessionMemoryHook.inject_session_context().
    """
    engine = MistakeRulesEngine()
    return engine.get_session_context(task, agent, max_rules=max_rules)


def check_before_task(task: str, agent: str, code: str = "") -> list[RuleMatch]:
    """
    Called before an agent starts a task.
    Returns hard blocks that MUST be addressed.
    """
    engine = MistakeRulesEngine()
    return engine.hard_blocks(task, code)


# ═══════════════════════════════════════════════════════════════
# DIRECT TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    engine = MistakeRulesEngine()
    
    # Test 1: Record a mistake
    print("=" * 60)
    print("  RECORDING MISTAKES")
    print("=" * 60)
    
    engine.record_mistake(
        agent="raj",
        task="build login API",
        description="Used f-string in SQL query causing SQL injection vulnerability",
        root_cause="String formatting in SQL query",
        code_snippet='cursor.execute(f"SELECT * FROM users WHERE email=\'{email}\'")',
        fix_snippet='cursor.execute("SELECT * FROM users WHERE email=?", (email,))',
        tags=["sql", "security", "injection"],
    )
    
    engine.record_mistake(
        agent="dev",
        task="deploy to production",
        description="Deployed to production without running test suite — 3 tests broke",
        root_cause="Skipped pre-deploy verification",
        code_snippet="",
        fix_snippet="Run: npm test && npm run lint && npm run build before deploy",
        tags=["deploy", "testing", "process"],
    )
    
    # Test 2: Match rules against a new task
    print("\n" + "=" * 60)
    print("  MATCHING RULES FOR: Build login API with database")
    print("=" * 60)
    
    matches = engine.match_rules("Build login API with SQL database queries")
    for m in matches:
        print(f"  {m.action_required}")
        print(f"    Relevance: {m.relevance:.0%}")
        print(f"    Matched: {m.matched_on}")
    
    # Test 3: Get hard blocks
    print("\n" + "=" * 60)
    print("  HARD BLOCKS")
    print("=" * 60)
    blocks = engine.hard_blocks("Deploy the new auth system to production")
    for b in blocks:
        print(f"  🛑 {b.rule.rule_text}")
        print(f"    → {b.rule.prevention}")
    
    # Test 4: Session injection
    print("\n" + "=" * 60)
    print("  SESSION INJECTION (what agent sees)")
    print("=" * 60)
    context = engine.get_session_context(
        task="Build authentication system with login and signup",
        agent="raj",
    )
    print(context)
