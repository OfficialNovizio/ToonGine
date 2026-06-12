---
name: signal-vs-noise
description: Step-by-step anomaly investigation playbook. Run whenever a metric moves > 15% WoW or contradicts the established trend. Forces platform-wide elimination before account-specific conclusions.
version: 1.0.0
---

## Purpose

Most metric movements are noise. Calling noise a signal wastes execution resources. Calling signal noise allows a real problem to compound. This playbook makes the investigation repeatable and eliminates the most common analytical errors: jumping to account-specific conclusions before ruling out platform-wide causes.

---

## When to Run

- Any metric moves > 15% WoW (up or down)
- A metric contradicts 3+ prior weeks of trend
- Stark asks "why did X happen?"
- Kai is about to call something a trend

---

## The Investigation Sequence

### Step 1 — Confirm the data
Before investigating the cause, confirm the data is correct:
- Is the date range correct? (GA4 defaults to last 28 days — check it)
- Is this the same metric definition as prior periods? (GA4 changed session definitions in 2023)
- Is there a tracking gap? (Apify rate limits, API downtime)
- Is the sample size large enough? (< 100 sessions or < 50 engagements = high variance, not a signal)

### Step 2 — Check the baseline
Pull from `MEMORY-[venture].md` → Baselines section:
- What is the normal range for this metric?
- Is this movement outside the normal WoW variance — or within it?
- A 15% drop that sits within normal variance is noise. A 5% drop for the 4th consecutive week is a signal.

### Step 3 — WebSearch (mandatory before any account-specific conclusion)
Search for: `[platform] [metric] [month year] algorithm change` and `[platform] outage [date]`

Rule: Do not conclude an anomaly is account-specific until platform-wide causes are eliminated.

**Common platform-wide events to check:**
| Platform | Common causes |
|---------|--------------|
| Instagram | Algorithm reach changes, Reels weighting shifts, hashtag suppression waves |
| YouTube | CTR policy changes, thumbnail policy updates, recommendation algorithm shifts |
| LinkedIn | Feed algorithm changes, newsletter feature boosts, engagement rate redefinitions |
| GA4 | Sampling threshold changes, referral spam spikes, bot traffic events |

### Step 4 — Check for correlated account events
Did anything change on the account in the same period?
- New content type or posting frequency?
- Campaign launch or pause?
- Audience targeting change?
- Website change (for GA4)?

If yes → the anomaly may be account-caused, not platform-caused. Both can be true simultaneously.

### Step 5 — Classify

| Classification | Criteria | Minimum data required |
|---------------|----------|----------------------|
| **Strong signal** | 3+ consecutive periods in same direction | 3 weeks |
| **Early indicator** | 1–2 periods, platform-wide eliminated | 2 periods |
| **Noise** | Within normal variance OR platform-wide event confirmed | n/a |
| **Insufficient data** | < 2 periods, can't eliminate platform-wide | n/a |

### Step 6 — State confidence level
Every analysis must include one of:
- "Strong signal (3+ consecutive periods, platform-wide eliminated)."
- "Early indicator — need [N] more periods before classifying."
- "Noise — within normal variance / platform-wide event confirmed."
- "Insufficient data to classify."

---

## Platform-Specific Noise Patterns

**Instagram:**
- Tuesday/Wednesday: typically 10–20% lower engagement than Mon/Thu/Fri
- Sunday 8–11pm local: highest engagement window — deviation from this timing reads as a drop
- First post after a long gap: algorithm suppresses reach — not a trend

**YouTube:**
- First 24–48h: views and CTR spike then normalise — never benchmark from week 1
- Seasonal: December and August see lower B2C engagement; January sees spikes

**LinkedIn:**
- First 60 min after posting: algorithm amplifies or suppresses based on early engagement — timing affects total reach significantly
- Weekend posts: 30–50% lower reach than weekday posts on Hourbour's audience

**GA4:**
- Check sample rate on any report with > 500K sessions — sampling distorts conversion data
- Direct / none traffic spike: often a tracking issue (UTM parameters missing), not real traffic

---

## Output Rule
Every anomaly investigation ends with a named classification and a "so what" — the specific implication for the team. "Noise, continue monitoring" without a named trigger for action is not an acceptable conclusion.
