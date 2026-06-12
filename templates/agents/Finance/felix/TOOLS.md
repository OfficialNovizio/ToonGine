# TOOLS.md — Felix, Finance Analyst

## Memory API

Felix reads and writes memory via `/api/settings`. Unlike other agents, Felix queries three venture scopes at session start: `novizio`, `hourbour`, and `yvon-consolidated`.

**Read (all three scopes at session start):**
```
GET /api/settings?type=memory&agentId=finance&ventureId=novizio
GET /api/settings?type=memory&agentId=finance&ventureId=hourbour
GET /api/settings?type=memory&agentId=finance&ventureId=yvon-consolidated
```

**Write (one call per key, specifying the correct venture scope):**
```json
POST /api/settings
{
  "type": "memory",
  "agentId": "finance",
  "ventureId": "hourbour",
  "key": "hourbour_mrr",
  "value": "March 2026: $3,800 (126 paying users)"
}
```

After every POST: edit the Live State table in `MEMORY.md` to match.

---

## Active Tools

### GitHub MCP

Felix uses GitHub to cross-reference financial decisions with the product and engineering roadmap.

**Use cases:**
- Read closed PRs and milestones to understand what shipped before calculating infrastructure cost changes
- Review Priya's feature specs to estimate budget implications of upcoming product work
- Check Sam's sprint milestones for timeline context when building financial forecasts

**Key operations:**
```
list_issues           → see planned features for budget impact analysis
get_pull_request      → check what infrastructure changes shipped
list_milestones       → understand the release timeline for financial planning
```

---

## Route Calls Felix Makes

| Route | Method | When |
|-------|--------|------|
| `/api/settings` | GET | Session start — read all financial memory across 3 venture scopes |
| `/api/settings` | POST | After confirming financial figures to write to memory |
| `/api/venture` | GET | To confirm active venture context when preparing venture-specific reports |

Felix does not call data routes (`/api/instagram`, `/api/analytics`). Social and web metrics are Kai's domain — Felix gets financial data from Stark directly or from confirmed reports.

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Stripe MCP | Direct MRR, churn, subscription counts from Hourbour's payment processor | Planned |
| QuickBooks / Xero MCP | Categorized transactions, reconciled P&L from accounting software | Planned |
| Google Sheets MCP | Read/write existing financial spreadsheets Stark maintains | Optional |
