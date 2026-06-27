---
name: risk-assessment-matrix
version: 1.0.0
description: Structured risk assessment across 5 domains (financial, operational, reputational, legal, strategic). Quantitative scoring with confidence intervals.
triggers:
  - "risk assessment"
  - "risk matrix"
  - "what are the risks"
  - "risk analysis"
  - "quantify the risk"
---

# Risk Assessment Matrix

Evaluate risk across 5 domains with quantitative methodology. Produce decision-grade output.

## Five Risk Domains

### 1. Financial Risk
- Runway impact: months consumed if worst-case
- Revenue at risk: % of ARR exposed
- Recovery cost: $ to remediate

### 2. Operational Risk
- Team bandwidth: person-weeks diverted
- System downtime: expected hours
- Recovery time: time to restore operations

### 3. Reputational Risk
- User impact: number affected
- Media exposure likelihood
- NPS impact estimate

### 4. Legal/Regulatory Risk
- Compliance gap: which regulation at risk
- Fine exposure: maximum penalty range
- Litigation probability: % chance

### 5. Strategic Risk
- Competitor advantage window created
- Roadmap delay: months
- First-mover loss: window closing

## Scoring Methodology
Score 1-5 on Likelihood and Impact. **Risk Score = L × I** (range 1-25).

| Score | Level | Response |
|-------|-------|----------|
| 1-4 | Low | Accept. Monitor quarterly. |
| 5-9 | Medium | Mitigate. Active controls. Monthly review. |
| 10-16 | High | Escalate. Council review. Contingency plan. |
| 17-25 | Critical | Avoid. Board vote. CEO accountable. |

## Confidence Annotation
- **High:** Historical data, multiple estimates agree
- **Medium:** Some data, expert consensus
- **Low:** Sparse data, high uncertainty — MUST flag

## Output Format
```yaml
risk_assessment:
  topic: <decision>
  date: YYYY-MM-DD
  domains:
    financial: {score: N, confidence: high|medium|low}
    operational: {score: N, confidence: high|medium|low}
    reputational: {score: N, confidence: high|medium|low}
    legal: {score: N, confidence: high|medium|low}
    strategic: {score: N, confidence: high|medium|low}
  aggregate_risk: low|medium|high|critical
  top_mitigations: [...]
  recommendation: proceed|proceed_with_caution|delay|avoid
```
