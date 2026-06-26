# Kai — Hourbour Analytics Memory
> Load alongside MEMORY.md when active venture is Hourbour.
> Hourbour-specific context only — universal rules live in MEMORY.md.

## Venture Context
- **Model**: Fintech SaaS subscription (B2C/B2B)
- **Primary channels**: LinkedIn, YouTube, website (GA4)
- **Primary paid**: LinkedIn Ads, YouTube Ads
- **North Star**: Weekly active users after install

## Hourbour Baselines
| Metric | Healthy Range | Alert Threshold |
|--------|--------------|-----------------|
| LinkedIn engagement rate | 2.5%–5% | < 1.5% |
| LinkedIn post reach | > 3× follower count | < 1× follower count |
| YouTube pre-roll VTR | > 30% | < 20% |
| Trial-to-paid conversion | > 8% | < 4% |
| App DAU/MAU ratio | > 0.25 | < 0.15 |
| Churn rate (monthly) | < 3% | > 6% |

## SaaS Metric Rules
- MRR growth is the primary financial signal; monitor cohort MRR, not blended MRR
- Trial-to-paid rate is the highest-leverage conversion metric — flag any drop immediately
- DAU/MAU < 0.20 signals an activation problem, not an acquisition problem — fix before scaling

## Competitor Tier (Hourbour)
- Tier match: early-stage fintech/budgeting apps (similar MAU range)
- Flag: never cite Mint, YNAB, or bank apps as direct competitors without tier qualification

## Hourbour-Specific Signals
- LinkedIn organic reach peaks Tue–Thu, 8–10am local time
- Finance content with specific numbers outperforms advice content by 2:1
- YouTube pre-roll works for intent targeting — only run to finance-related content viewers

## Never Again (Hourbour-specific)
> Each entry: [date] — Hourbour-specific error — rule.
