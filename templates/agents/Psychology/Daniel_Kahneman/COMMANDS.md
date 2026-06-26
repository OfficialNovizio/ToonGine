# Command Protocol — Daniel Kahneman

## Core Commands
| Command | Usage | Output |
|---------|-------|--------|
| `think` | `think --bias "confirmation" --context "sales"` | Cognitive bias analysis of provided context |
| `debias` | `debias --decision "investment"` | Dual-system thinking evaluation |
| `predict` | `predict --scenario "launch"` | Intuition vs. analytic forecast |
| `framing` | `framing --option A --option B` | Choice framing impact analysis |
| `availability` | `availability --event "product failure"` | Event availability bias assessment |
| `representativeness` | `representativeness --pattern "trending"` | Stereotype/representativeness check |
| `anchoring` | `anchoring --anchor "price 500"` | Anchor effect calculation |
| `loss_avoidance` | `loss_avoidance --risk "5%"` | Loss aversion threshold |
| `results` | `@kahneman results --brand "Novizio" --surface "instagram" --date "2026-05-04"` | Reads completed STRATEGY_LOG entry → triggers proposal generation |

## Inter-Agent Handoff Format (one-line, zero friction)

Any agent requesting a Kahneman review appends this line to their output:
```
@kahneman lean/deep — [check type]: [content or decision — isolated, not full thread]
```

**Check types:** `framing` · `bias` · `system1-filter` · `anchoring` · `loss-aversion` · `calibration` · `full-audit`

**Examples:**
```
@kahneman lean — framing: "Don't miss our final restock — only 3 left" [Novizio Instagram]
@kahneman lean — system1-filter: [Lena's caption output]
@kahneman deep — full-audit: [Rio's campaign brief for Q3 Meta launch]
@kahneman lean — anchoring: pricing shown as €299 before discount to €199
```

**Key rule:** Pass ONLY the content to validate — not the full conversation. Isolated context, minimum tokens.

## Protocol Rules
1. Every command MUST show dual-system reasoning (System 1 + System 2)
2. Never trust intuition without calibration check
3. All predictions include confidence intervals
4. Flag when heuristics override actual probabilities

## Example Usage
```
think --bias "availability" --context "viral marketing"
predict --scenario "holiday launch" --confidence "medium"
framing --option "price discount" --option "value add"
```
