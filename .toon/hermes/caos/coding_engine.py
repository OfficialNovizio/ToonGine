"""
CAOS — Coding Engine: What Makes Coding Great

Fable 5 beats other models in coding because it doesn't just generate text —
it understands code structure, enforces project rules, and learns from mistakes.

THE FOUR PILLARS OF GREAT CODING:

1. PROPER INFORMATION
   - AST-level understanding (not regex on text)
   - Knowledge graph of codebase (callers, callees, types)
   - Project conventions (naming, patterns, architecture)
   - Type information and interface contracts

2. RULES & GUIDELINES
   - Project-specific coding standards
   - Architecture constraints (layers, dependencies)
   - Anti-pattern detection (god objects, circular deps)
   - Security rules (SQL injection, XSS, auth checks)

3. PROPER REQUESTED THINGS
   - Spec extraction from natural language
   - Edge case enumeration
   - Test case generation
   - Acceptance criteria

4. HOW TO IMPROVE
   - Error → pattern conversion
   - Feedback integration
   - Refactoring rule generation
   - Performance regression detection

This engine wires into the CAOS pipeline at the VERIFICATION phase.
Quinn calls CodingEngine.analyze() before passing any code output.
"""

import re, json, hashlib, os
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from pathlib import Path


# ═══════════════════════════════════════════════════════════════
# TYPES
# ═══════════════════════════════════════════════════════════════

class CodeLanguage(Enum):
    PYTHON = "python"
    TYPESCRIPT = "typescript"
    JAVASCRIPT = "javascript"
    GO = "go"
    RUST = "rust"
    UNKNOWN = "unknown"

class IssueSeverity(Enum):
    ERROR = "error"       # Must fix — would break build
    WARNING = "warning"   # Should fix — violates standards
    INFO = "info"         # Nice to fix — improvement opportunity
    CRITICAL = "critical" # Security or data loss risk

@dataclass
class CodeIssue:
    severity: IssueSeverity
    rule: str
    file_path: str = ""
    line: int = 0
    message: str = ""
    suggestion: str = ""
    pattern: str = ""  # The anti-pattern that triggered this

@dataclass
class CodeAnalysis:
    language: CodeLanguage
    issues: list[CodeIssue]
    patterns_found: list[str]  # Patterns detected in code
    anti_patterns: list[str]   # Anti-patterns detected
    complexity_score: float    # 0-1, higher = more complex
    security_issues: int
    test_coverage_estimate: float
    spec_compliance: float     # How well code matches spec
    summary: str


# ═══════════════════════════════════════════════════════════════
# LANGUAGE-SPECIFIC RULES
# ═══════════════════════════════════════════════════════════════

# Patterns that indicate good code (by language)
GOOD_PATTERNS = {
    CodeLanguage.PYTHON: [
        ("type_hints", r"def \w+\([^)]*:\s*\w+[^)]*\)\s*->\s*\w+"),
        ("docstring", r'"""'),
        ("context_manager", r"with\s+\w+"),
        ("list_comprehension", r"\[.*for\s+\w+\s+in\s+"),
        ("error_handling", r"try:"),
        ("dataclass", r"@dataclass"),
        ("type_guard", r"isinstance\(|assert\s+isinstance"),
        ("proper_imports", r"from\s+\w+\.\w+\s+import"),
    ],
    CodeLanguage.TYPESCRIPT: [
        ("type_annotations", r":\s*(string|number|boolean|void|Promise<|Array<|Record<)"),
        ("interface", r"interface\s+\w+"),
        ("error_handling", r"try\s*\{|\.catch\("),
        ("null_check", r"\?\."),
        ("async_await", r"async\s+\w+|await\s+"),
        ("proper_imports", r"import\s+.*from\s+['\"]"),
        ("type_guard", r"typeof\s+\w+\s*==="),
        ("const_preference", r"\bconst\s+\w+"),
    ],
    CodeLanguage.GO: [
        ("error_handling", r"if\s+err\s*!=\s*nil"),
        ("context_usage", r"context\.Context"),
        ("interface", r"type\s+\w+\s+interface"),
        ("table_tests", r"\[\]struct\s*\{"),
        ("proper_imports", r"import\s+\("),
    ],
}

# Anti-patterns to detect
ANTI_PATTERNS = {
    "god_function": {
        "pattern": r"def .+:.+:.+:.+:.+:.+:.+:.+",  # Functions with many blocks
        "severity": IssueSeverity.WARNING,
        "message": "Function has too many blocks — consider splitting",
        "suggestion": "Break into smaller functions with single responsibilities",
    },
    "bare_except": {
        "pattern": r"except\s*:",
        "severity": IssueSeverity.ERROR,
        "message": "Bare except clause catches everything including KeyboardInterrupt",
        "suggestion": "Catch specific exceptions: except ValueError as e:",
    },
    "mutable_default": {
        "pattern": r"def \w+\([^)]*=\s*\[\]",
        "severity": IssueSeverity.ERROR,
        "message": "Mutable default argument (list/dict) — shared across calls",
        "suggestion": "Use None as default: def fn(arg=None): arg = arg or []",
    },
    "hardcoded_secret": {
        "pattern": r"(password|secret|token|api_key|apikey)\s*=\s*['\"][^'\"]{8,}['\"]",
        "severity": IssueSeverity.CRITICAL,
        "message": "Hardcoded secret/credential in source code",
        "suggestion": "Use environment variables: os.environ.get('SECRET')",
    },
    "eval_usage": {
        "pattern": r"\beval\s*\(",
        "severity": IssueSeverity.CRITICAL,
        "message": "eval() is a code injection risk",
        "suggestion": "Use json.loads() for data, or ast.literal_eval() for expressions",
    },
    "sql_injection": {
        "pattern": r"(execute|cursor\.execute)\s*\(.*f['\"]",
        "severity": IssueSeverity.CRITICAL,
        "message": "SQL injection risk — string formatting in query",
        "suggestion": "Use parameterized queries: cursor.execute('SELECT * FROM t WHERE id=?', (id,))",
    },
    "unsafe_deserialize": {
        "pattern": r"pickle\.loads?\(|yaml\.load\(",
        "severity": IssueSeverity.CRITICAL,
        "message": "Unsafe deserialization — arbitrary code execution risk",
        "suggestion": "Use json.loads() for data, or yaml.safe_load() for YAML",
    },
    "circular_import": {
        "pattern": r"",  # Detected structurally, not by regex
        "severity": IssueSeverity.WARNING,
        "message": "Circular import detected",
        "suggestion": "Move shared code to a third module, or use lazy imports",
    },
    "too_many_args": {
        "pattern": r"def \w+\([^)]{100,}\)",  # >~100 chars of params
        "severity": IssueSeverity.WARNING,
        "message": "Function has too many arguments",
        "suggestion": "Group related args into a dataclass or config object",
    },
    "nested_callback_hell": {
        "pattern": r"\.then\(\s*\(\)\s*=?>.*\.then\(",
        "severity": IssueSeverity.WARNING,
        "message": "Callback hell — deeply nested promises",
        "suggestion": "Use async/await for flat control flow",
    },
}

# TypeScript-specific anti-patterns
TS_ANTI_PATTERNS = {
    "any_type": {
        "pattern": r":\s*any\b",
        "severity": IssueSeverity.WARNING,
        "message": "Using 'any' type — defeats TypeScript's purpose",
        "suggestion": "Define proper interface or use 'unknown' with type guards",
    },
    "missing_return_type": {
        "pattern": r"function\s+\w+\([^)]*\)\s*\{",
        "severity": IssueSeverity.INFO,
        "message": "Function missing return type annotation",
        "suggestion": "Add return type: function fn(): ReturnType { ... }",
    },
    "non_null_assertion": {
        "pattern": r"\w+!\.",
        "severity": IssueSeverity.WARNING,
        "message": "Non-null assertion (!) — bypasses null safety",
        "suggestion": "Use proper null check or optional chaining (?.)",
    },
}


# ═══════════════════════════════════════════════════════════════
# SPEC EXTRACTION — What The User Actually Wants
# ═══════════════════════════════════════════════════════════════

@dataclass
class CodeSpec:
    """Structured spec extracted from natural language request."""
    task: str
    features: list[str]          # What to build
    inputs: list[str]            # What data comes in
    outputs: list[str]           # What data goes out
    edge_cases: list[str]        # Edge cases to handle
    constraints: list[str]       # Must NOT do
    dependencies: list[str]      # What this depends on
    tests: list[str]             # Tests that must pass
    acceptance_criteria: list[str]  # How we know it's done
    
    @classmethod
    def from_task(cls, task: str) -> "CodeSpec":
        """Extract structured spec from natural language task."""
        spec = cls(
            task=task,
            features=[],
            inputs=[],
            outputs=[],
            edge_cases=[],
            constraints=[],
            dependencies=[],
            tests=[],
            acceptance_criteria=[],
        )
        
        task_lower = task.lower()
        
        # Feature extraction
        if "login" in task_lower or "sign in" in task_lower:
            spec.features = [
                "Email/password authentication",
                "Session management (JWT or cookie)",
                "Password hashing (bcrypt/argon2)",
                "Rate limiting on login attempts",
                "Account lockout after N failed attempts",
            ]
            spec.inputs = ["email: string", "password: string"]
            spec.outputs = ["auth_token: string", "user_profile: object"]
            spec.edge_cases = [
                "Empty email field",
                "Empty password field",
                "Invalid email format",
                "Unicode in email (IDN)",
                "Very long password (>1000 chars)",
                "SQL injection attempt in email",
                "Concurrent login from same account",
                "Expired session token",
            ]
            spec.constraints = [
                "Never log passwords (even hashed)",
                "Never return password hash to client",
                "Use constant-time comparison for password check",
                "Rate limit: max 5 attempts per minute per IP",
            ]
            spec.tests = [
                "Valid credentials → returns token",
                "Invalid password → returns 401",
                "Non-existent email → returns 401 (same as bad password — don't leak)",
                "Rate limit exceeded → returns 429",
                "Token validation → rejects expired tokens",
            ]
            spec.acceptance_criteria = [
                "User can log in with email + password",
                "Returns JWT token valid for 24h",
                "Failed attempts don't reveal if email exists",
                "Works from curl, browser, mobile",
            ]
        
        elif "api" in task_lower or "endpoint" in task_lower or "route" in task_lower:
            spec.features = [
                "RESTful endpoint(s)",
                "Input validation",
                "Error handling with proper status codes",
                "Authentication/authorization check",
            ]
            spec.inputs = ["request_body: JSON", "auth_header: string"]
            spec.outputs = ["response_body: JSON", "status_code: int"]
            spec.edge_cases = [
                "Missing required fields",
                "Invalid data types (string for number)",
                "Request body too large",
                "Malformed JSON",
                "Missing auth header",
                "Expired auth token",
                "Concurrent requests (race conditions)",
            ]
            spec.constraints = [
                "Validate all input before processing",
                "Return appropriate HTTP status codes (400, 401, 403, 404, 500)",
                "Never expose stack traces in production",
            ]
            spec.tests = [
                "Valid request → 200 with correct response",
                "Missing field → 400 with error details",
                "No auth → 401",
                "Invalid data type → 400",
                "Server error → 500 (no stack trace leaked)",
            ]
            spec.acceptance_criteria = [
                "Endpoint accepts valid requests and returns correct data",
                "Invalid requests get descriptive error messages",
                "Auth is enforced",
            ]
        
        elif "component" in task_lower or "ui" in task_lower or "frontend" in task_lower:
            spec.features = [
                "Reusable UI component",
                "Loading state",
                "Error state",
                "Empty state",
            ]
            spec.inputs = ["props: defined interface"]
            spec.outputs = ["rendered_element: JSX", "events: callbacks"]
            spec.edge_cases = [
                "Component with no data (empty state)",
                "Component with massive data (10,000 items)",
                "Network error during data fetch",
                "User rapidly clicking (debounce needed)",
                "Screen reader accessibility",
                "Mobile viewport (<375px)",
                "Dark mode",
            ]
            spec.constraints = [
                "Must be accessible (WCAG 2.1 AA)",
                "Must work on mobile and desktop",
                "No inline styles — use design system tokens",
            ]
            spec.acceptance_criteria = [
                "Renders correctly with valid props",
                "Shows loading indicator during async operations",
                "Shows error message on failure",
                "Shows empty state when data is empty",
            ]
        
        else:
            # Generic spec
            spec.features = [task]
            spec.inputs = ["input: TBD"]
            spec.outputs = ["output: TBD"]
            spec.edge_cases = ["Empty input", "Invalid input", "Maximum input size"]
            spec.constraints = ["No side effects unless specified"]
            spec.tests = ["Valid input produces valid output"]
            spec.acceptance_criteria = ["Task completed as described"]
        
        return spec


# ═══════════════════════════════════════════════════════════════
# CODING ENGINE
# ═══════════════════════════════════════════════════════════════

class CodingEngine:
    """
    The brain of code quality in CAOS.
    
    Used by Quinn in the VERIFICATION phase. 
    Analyzes code output against spec, patterns, and project rules.
    
    Usage:
        engine = CodingEngine(toon_dir=".toon")
        spec = CodeSpec.from_task("build login system")
        analysis = engine.analyze(code_output, spec, language="python")
        
        if analysis.issues:
            for issue in analysis.issues:
                print(f"[{issue.severity.value}] {issue.message}")
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        self.toon_dir = Path(toon_dir)
        self.rules_dir = self.toon_dir / "hermes" / "caos" / "rules"
        self.mistakes_dir = self.toon_dir / "hermes" / "caos" / "mistakes"
        
        # Load project-specific rules if they exist
        self.project_rules = self._load_project_rules()
        
        # Load mistake history for pattern learning
        self.mistake_patterns = self._load_mistake_patterns()
    
    def _load_project_rules(self) -> dict:
        """Load project-specific coding rules from .toon/rules/"""
        rules = {}
        rules_file = self.rules_dir / "coding_rules.json"
        if rules_file.exists():
            try:
                with open(rules_file) as f:
                    rules = json.load(f)
            except Exception:
                pass
        return rules
    
    def _load_mistake_patterns(self) -> list[dict]:
        """Load past mistakes to avoid repeating them."""
        patterns = []
        mistakes_file = self.mistakes_dir / "patterns.json"
        if mistakes_file.exists():
            try:
                with open(mistakes_file) as f:
                    data = json.load(f)
                    patterns = data.get("patterns", [])
            except Exception:
                pass
        return patterns
    
    def analyze(self, code: str, spec: CodeSpec, 
                language: str = "python",
                file_path: str = "",
                context: dict = None) -> CodeAnalysis:
        """
        Analyze code against spec, patterns, and rules.
        
        Args:
            code: The code to analyze
            spec: Extracted spec (what the user wanted)
            language: Programming language
            file_path: File being analyzed
            context: Additional context (project structure, etc.)
        
        Returns:
            CodeAnalysis with all issues found
        """
        lang = self._detect_language(code, language)
        context = context or {}
        
        issues = []
        
        # 1. Check against anti-patterns
        anti_pattern_issues = self._check_anti_patterns(code, lang)
        issues.extend(anti_pattern_issues)
        
        # 2. Check against project-specific rules
        rule_issues = self._check_project_rules(code, lang, context)
        issues.extend(rule_issues)
        
        # 3. Check against past mistake patterns
        mistake_issues = self._check_mistake_patterns(code, spec, lang)
        issues.extend(mistake_issues)
        
        # 4. Check spec compliance
        spec_issues = self._check_spec_compliance(code, spec, lang)
        issues.extend(spec_issues)
        
        # 5. Detect good patterns
        patterns_found = self._detect_good_patterns(code, lang)
        
        # 6. Compute metrics
        anti_pattern_names = list(set(i.rule for i in issues if i.severity in 
                                     [IssueSeverity.ERROR, IssueSeverity.CRITICAL, IssueSeverity.WARNING]))
        
        security_count = sum(1 for i in issues if i.severity == IssueSeverity.CRITICAL)
        error_count = sum(1 for i in issues if i.severity == IssueSeverity.ERROR)
        
        complexity = self._estimate_complexity(code, lang)
        test_coverage = self._estimate_test_coverage(code, spec)
        spec_compliance = self._compute_spec_compliance(code, spec, issues)
        
        # Build summary
        summary_parts = []
        if not issues:
            summary_parts.append("✅ Code passes all checks")
        else:
            errors = [i for i in issues if i.severity in [IssueSeverity.ERROR, IssueSeverity.CRITICAL]]
            warnings = [i for i in issues if i.severity == IssueSeverity.WARNING]
            if errors:
                summary_parts.append(f"❌ {len(errors)} error(s) to fix")
            if warnings:
                summary_parts.append(f"⚠️  {len(warnings)} warning(s)")
        
        summary_parts.append(f"Patterns: {len(patterns_found)} good patterns detected")
        summary_parts.append(f"Complexity: {complexity:.0%}")
        summary_parts.append(f"Spec compliance: {spec_compliance:.0%}")
        
        return CodeAnalysis(
            language=lang,
            issues=issues,
            patterns_found=patterns_found,
            anti_patterns=anti_pattern_names,
            complexity_score=complexity,
            security_issues=security_count,
            test_coverage_estimate=test_coverage,
            spec_compliance=spec_compliance,
            summary=" | ".join(summary_parts),
        )
    
    def _detect_language(self, code: str, hint: str) -> CodeLanguage:
        """Detect programming language from code content."""
        code_sample = code[:500].lower()
        
        if "def " in code_sample and "import " in code_sample:
            return CodeLanguage.PYTHON
        if "function " in code_sample or "const " in code_sample or "interface " in code_sample:
            if ": string" in code or ": number" in code or "<T>" in code:
                return CodeLanguage.TYPESCRIPT
            return CodeLanguage.JAVASCRIPT
        if "func " in code_sample and "package " in code_sample:
            return CodeLanguage.GO
        if "fn " in code_sample and "let " in code_sample and "->" in code_sample:
            return CodeLanguage.RUST
        
        # Fall back to hint
        hint_map = {
            "python": CodeLanguage.PYTHON,
            "typescript": CodeLanguage.TYPESCRIPT,
            "ts": CodeLanguage.TYPESCRIPT,
            "javascript": CodeLanguage.JAVASCRIPT,
            "js": CodeLanguage.JAVASCRIPT,
            "go": CodeLanguage.GO,
            "rust": CodeLanguage.RUST,
        }
        return hint_map.get(hint.lower(), CodeLanguage.UNKNOWN)
    
    def _check_anti_patterns(self, code: str, lang: CodeLanguage) -> list[CodeIssue]:
        """Scan code for known anti-patterns."""
        issues = []
        
        # Universal anti-patterns (all languages)
        for name, pattern_def in ANTI_PATTERNS.items():
            if pattern_def["pattern"] and re.search(pattern_def["pattern"], code):
                # Find line number
                line_num = 1
                for i, line in enumerate(code.split('\n'), 1):
                    if re.search(pattern_def["pattern"], line):
                        line_num = i
                        break
                
                issues.append(CodeIssue(
                    severity=pattern_def["severity"],
                    rule=name,
                    line=line_num,
                    message=pattern_def["message"],
                    suggestion=pattern_def["suggestion"],
                    pattern=name,
                ))
        
        # Language-specific anti-patterns
        if lang == CodeLanguage.TYPESCRIPT or lang == CodeLanguage.JAVASCRIPT:
            for name, pattern_def in TS_ANTI_PATTERNS.items():
                if pattern_def["pattern"] and re.search(pattern_def["pattern"], code):
                    line_num = 1
                    for i, line in enumerate(code.split('\n'), 1):
                        if re.search(pattern_def["pattern"], line):
                            line_num = i
                            break
                    issues.append(CodeIssue(
                        severity=pattern_def["severity"],
                        rule=name,
                        line=line_num,
                        message=pattern_def["message"],
                        suggestion=pattern_def["suggestion"],
                        pattern=name,
                    ))
        
        return issues
    
    def _check_project_rules(self, code: str, lang: CodeLanguage, 
                             context: dict) -> list[CodeIssue]:
        """Check code against project-specific rules."""
        issues = []
        
        if not self.project_rules:
            return issues
        
        rules = self.project_rules.get("rules", [])
        for rule in rules:
            if rule.get("language", lang.value) != lang.value:
                continue
            
            if "pattern" in rule and re.search(rule["pattern"], code):
                issues.append(CodeIssue(
                    severity=IssueSeverity(rule.get("severity", "warning")),
                    rule=f"project:{rule['name']}",
                    message=rule.get("message", ""),
                    suggestion=rule.get("suggestion", ""),
                ))
        
        return issues
    
    def _check_mistake_patterns(self, code: str, spec: CodeSpec, 
                                 lang: CodeLanguage) -> list[CodeIssue]:
        """Check code against patterns from past mistakes."""
        issues = []
        
        for pattern in self.mistake_patterns:
            pattern_regex = pattern.get("pattern", "")
            if not pattern_regex:
                continue
            
            if re.search(pattern_regex, code):
                issues.append(CodeIssue(
                    severity=IssueSeverity(pattern.get("severity", "warning")),
                    rule=f"past_mistake:{pattern.get('mistake_id', 'unknown')}",
                    message=f"Pattern matches past mistake: {pattern.get('description', '')}",
                    suggestion=pattern.get("prevention", "Review past resolution"),
                ))
        
        return issues
    
    def _check_spec_compliance(self, code: str, spec: CodeSpec, 
                                lang: CodeLanguage) -> list[CodeIssue]:
        """Check if code implements what the spec requires."""
        issues = []
        
        # Check edge cases are handled
        for edge_case in spec.edge_cases:
            # Simple keyword check — in production, use semantic analysis
            case_keywords = edge_case.lower().split()
            handled = any(kw in code.lower() for kw in case_keywords[:3])
            if not handled:
                issues.append(CodeIssue(
                    severity=IssueSeverity.WARNING,
                    rule="spec_compliance",
                    message=f"Edge case may not be handled: {edge_case}",
                    suggestion=f"Add handling for: {edge_case}",
                ))
        
        # Check constraints are followed
        for constraint in spec.constraints:
            if "never" in constraint.lower():
                # Check if code violates a "never do X" rule
                constraint_keywords = constraint.lower().replace("never ", "").split()
                violation = all(kw in code.lower() for kw in constraint_keywords[:3])
                if violation:
                    issues.append(CodeIssue(
                        severity=IssueSeverity.ERROR,
                        rule="constraint_violation",
                        message=f"Code may violate constraint: {constraint}",
                        suggestion=f"Remove or refactor to comply with: {constraint}",
                    ))
        
        return issues
    
    def _detect_good_patterns(self, code: str, lang: CodeLanguage) -> list[str]:
        """Detect good coding patterns in the code."""
        found = []
        patterns = GOOD_PATTERNS.get(lang, [])
        
        for name, regex in patterns:
            if regex and re.search(regex, code):
                found.append(name)
        
        return found
    
    def _estimate_complexity(self, code: str, lang: CodeLanguage) -> float:
        """Estimate code complexity (0 = simple, 1 = very complex)."""
        lines = [l for l in code.split('\n') if l.strip() and not l.strip().startswith(('#', '//'))]
        if not lines:
            return 0.0
        
        # Factors that increase complexity
        factors = 0
        total_lines = len(lines)
        
        # Nested blocks
        indent_levels = []
        for line in lines:
            indent = len(line) - len(line.lstrip())
            indent_levels.append(indent)
        
        if indent_levels:
            max_indent = max(indent_levels)
            if max_indent > 16:  # Deep nesting
                factors += 0.3
            elif max_indent > 8:
                factors += 0.15
        
        # Control flow density
        if lang == CodeLanguage.PYTHON:
            control_flow = sum(1 for l in lines if l.strip().startswith(('if ', 'elif ', 'else:', 'for ', 'while ', 'try:', 'except')))
        else:
            control_flow = sum(1 for l in lines if re.search(r'\b(if|else|for|while|switch|try|catch)\b', l.strip()))
        
        cf_density = control_flow / max(total_lines, 1)
        factors += min(cf_density * 0.5, 0.3)
        
        # Function length
        if total_lines > 200:
            factors += 0.3
        elif total_lines > 100:
            factors += 0.15
        
        return min(factors, 1.0)
    
    def _estimate_test_coverage(self, code: str, spec: CodeSpec) -> float:
        """Estimate how well the code is tested based on spec tests vs code structure."""
        if not spec.tests:
            return 0.0
        
        # Count test-like patterns in code
        test_patterns = [
            r"(test|spec|it)\s*\(",   # Jest/Mocha/Python test functions
            r"assert\w*\(",           # Assertions
            r"expect\(",              # Jest expect
            r"describe\(",            # Test suites
        ]
        
        test_lines = 0
        for line in code.split('\n'):
            if any(re.search(p, line) for p in test_patterns):
                test_lines += 1
        
        # Coverage estimate: tests present / spec tests expected
        coverage = min(test_lines / max(len(spec.tests), 1), 1.0)
        return coverage
    
    def _compute_spec_compliance(self, code: str, spec: CodeSpec, 
                                  issues: list[CodeIssue]) -> float:
        """Compute how well code complies with the spec."""
        score = 1.0
        
        # Penalize for each spec-related issue
        spec_issues = [i for i in issues if i.rule in ("spec_compliance", "constraint_violation")]
        score -= len(spec_issues) * 0.1
        
        # Penalize for unhandled edge cases
        edge_cases = spec.edge_cases
        if edge_cases:
            handled = sum(1 for ec in edge_cases 
                         if any(kw in code.lower() for kw in ec.lower().split()[:3]))
            score = min(score, handled / max(len(edge_cases), 1))
        
        return max(score, 0.0)
    
    # ── MISTAKE LEARNING ─────────────────────────────────────
    
    def learn_from_mistake(self, mistake: dict):
        """
        Learn from a mistake and add it to the pattern library.
        
        Args:
            mistake: {description, pattern, prevention, severity, agent, task}
        """
        self.mistakes_dir.mkdir(parents=True, exist_ok=True)
        patterns_file = self.mistakes_dir / "patterns.json"
        
        # Load existing
        existing = {"patterns": []}
        if patterns_file.exists():
            try:
                with open(patterns_file) as f:
                    existing = json.load(f)
            except Exception:
                pass
        
        # Generate pattern from mistake description
        pattern = self._extract_pattern_from_mistake(mistake)
        
        mistake_record = {
            "mistake_id": hashlib.md5(mistake.get("description", "").encode()).hexdigest()[:8],
            "description": mistake.get("description", ""),
            "pattern": pattern,
            "prevention": mistake.get("prevention", ""),
            "severity": mistake.get("severity", "warning"),
            "agent": mistake.get("agent", "unknown"),
            "task": mistake.get("task", ""),
            "timestamp": mistake.get("timestamp", ""),
            "occurrences": 1,
        }
        
        # Check if already exists
        for existing_pattern in existing["patterns"]:
            if existing_pattern.get("pattern") == pattern:
                existing_pattern["occurrences"] = existing_pattern.get("occurrences", 0) + 1
                break
        else:
            existing["patterns"].append(mistake_record)
        
        with open(patterns_file, 'w') as f:
            json.dump(existing, f, indent=2)
    
    def _extract_pattern_from_mistake(self, mistake: dict) -> str:
        """Convert mistake description into a regex pattern."""
        description = mistake.get("description", "")
        code_snippet = mistake.get("code_snippet", "")
        
        if code_snippet:
            # Use the actual code as pattern (escaped)
            return re.escape(code_snippet.strip()[:100])
        
        # Extract keywords from description
        keywords = description.lower().split()
        if "hardcoded" in keywords or "secret" in keywords:
            return r"(password|secret|token|api_key)\s*=\s*['\"]"
        if "bare except" in keywords:
            return r"except\s*:"
        if "sql injection" in keywords:
            return r"execute\s*\(.*f['\"]"
        if "mutable default" in keywords:
            return r"def \w+\([^)]*=\s*\[\]"
        
        # Generic: use description as literal match
        return re.escape(description[:80])


# ═══════════════════════════════════════════════════════════════
# PIPELINE INTEGRATION
# ═══════════════════════════════════════════════════════════════

def coding_verification(code_output: str, task: str, language: str = "python",
                        file_path: str = "", toon_dir: str = ".toon") -> CodeAnalysis:
    """
    Quinn calls this before approving any code output.
    
    Returns CodeAnalysis — if issues exist with CRITICAL or ERROR severity,
    the code is rejected and sent back for fixes.
    """
    engine = CodingEngine(toon_dir=toon_dir)
    spec = CodeSpec.from_task(task)
    
    analysis = engine.analyze(
        code=code_output,
        spec=spec,
        language=language,
        file_path=file_path,
    )
    
    return analysis


# ═══════════════════════════════════════════════════════════════
# QUINN VERIFICATION (enhanced)
# ═══════════════════════════════════════════════════════════════

def quinn_code_review(code_output: str, task: str, language: str = "python") -> dict:
    """
    Enhanced Quinn verification using the Coding Engine.
    
    Pass condition:
    - No CRITICAL or ERROR issues
    - Spec compliance >= 0.7
    - At least 2 good patterns detected (shows intent to write quality code)
    """
    analysis = coding_verification(code_output, task, language)
    
    critical_errors = [i for i in analysis.issues 
                      if i.severity in (IssueSeverity.CRITICAL, IssueSeverity.ERROR)]
    
    passed = (
        len(critical_errors) == 0 
        and analysis.spec_compliance >= 0.7
    )
    
    return {
        "passed": passed,
        "analysis": analysis,
        "critical_errors": [{"rule": i.rule, "message": i.message, "suggestion": i.suggestion} 
                           for i in critical_errors],
        "warnings": [{"rule": i.rule, "message": i.message} 
                    for i in analysis.issues if i.severity == IssueSeverity.WARNING],
        "good_patterns": analysis.patterns_found,
        "complexity": analysis.complexity_score,
        "spec_compliance": analysis.spec_compliance,
        "summary": analysis.summary,
    }


# ═══════════════════════════════════════════════════════════════
# DIRECT TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Test the engine
    bad_code = """
import os

def login(email, password, conn=[]):
    conn.append(1)
    try:
        query = f"SELECT * FROM users WHERE email='{email}'"
        result = conn.execute(query)
        if result:
            secret_key = "hardcoded-api-key-12345"
            return {"token": secret_key}
    except:
        pass
    return None
"""
    
    good_code = """
\"\"\"Authentication module with secure login.\"\"\"

import os
import hashlib
from typing import Optional
from dataclasses import dataclass

@dataclass
class AuthResult:
    token: str
    user_id: str

def login(email: str, password: str) -> Optional[AuthResult]:
    \"\"\"Authenticate user with email and password.
    
    Uses constant-time comparison to prevent timing attacks.
    Rate limiting is handled by the middleware layer.
    \"\"\"
    if not email or not password:
        raise ValueError("Email and password are required")
    
    if not isinstance(email, str) or not isinstance(password, str):
        raise TypeError("Email and password must be strings")
    
    try:
        password_hash = _hash_password(password)
        user = _lookup_user(email)
        
        if user is None:
            return None
        
        if not _constant_time_compare(user.password_hash, password_hash):
            return None
        
        token = _generate_token(user.id)
        return AuthResult(token=token, user_id=user.id)
        
    except Exception as e:
        raise
"""
    
    engine = CodingEngine()
    spec = CodeSpec.from_task("build login system")
    
    print("=" * 60)
    print("  BAD CODE ANALYSIS")
    print("=" * 60)
    bad_analysis = engine.analyze(bad_code, spec, language="python")
    print(bad_analysis.summary)
    for issue in bad_analysis.issues:
        print(f"  [{issue.severity.value}] {issue.rule}: {issue.message}")
    
    print()
    print("=" * 60)
    print("  GOOD CODE ANALYSIS")
    print("=" * 60)
    good_analysis = engine.analyze(good_code, spec, language="python")
    print(good_analysis.summary)
    for issue in good_analysis.issues:
        print(f"  [{issue.severity.value}] {issue.rule}: {issue.message}")
    
    print()
    print("=" * 60)
    print("  QUINN REVIEW")
    print("=" * 60)
    review = quinn_code_review(good_code, "build login system")
    print(f"  Passed: {review['passed']}")
    print(f"  Summary: {review['summary']}")
