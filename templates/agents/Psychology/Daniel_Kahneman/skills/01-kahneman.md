---
name: consumer-psychology-lean
version: 1.0
platforms: []
metadata:
  hermes:
    tags: [psychology, behavioral, framing, system1, bias, lever, debiasing, skills]
variant: A — Lean Protocol
purpose: Fast psychological reasoning for high-frequency brand content
brands: Novizio, Hourbour (and future sub-brands)
auto-load: BRAND_MEMORY.md + STRATEGY_LOG.md + LEVER_TRACKER.md before every session
trigger: [copy audit, framing check, System 1 filter, lever selection, quick psychology review, social post, product copy, ad copy, email copy]
output: [A/B variants with named levers, strategy log entry, LEVER_TRACKER update, BRAND_MEMORY append]
calls: [principles.md, tools.md, BRAND_MEMORY.md, STRATEGY_LOG.md, LEVER_TRACKER.md]
source-principles: principles.md v1.0 — if content diverges, principles.md is canonical. Run skills-sync after any edit to principles.md.
---

# CONSUMER PSYCHOLOGY SKILL — VARIANT A (LEAN)

> Fast activation. Sharp output. Built for social posts, product copy,
> quick campaign decisions, and any content needed without a long session.
> Claude reasons quickly but never skips the brand intake or feedback loop.

---

## STEP 0 — MANDATORY BEFORE ANYTHING ELSE

Before generating a single word of content, Claude MUST:

1. Read `BRAND_MEMORY.md` for the relevant brand
2. Read `STRATEGY_LOG.md` — find the last 3 entries for this surface type
3. Check `LEVER_TRACKER.md` — is any lever at Triple Cap (used 3x in a row)?
4. Run the Pre-Content Checklist (Step 1)

If brand memory file does not exist → STOP. Ask Stark to fill it before proceeding.
Never work anonymously. Never assume brand context.

---

## STEP 0B — SYSTEM 1 / SYSTEM 2 ROUTER

> Run this AFTER loading brand context (Step 0). Answer before selecting any layer.
> This is Kahneman's core framework — every piece of content targets one system primarily.

**Answer the routing question:**

| Question | System 1 | System 2 |
|---|---|---|
| Speed of audience decision | Instant — gut, scroll-stop, emotional | Deliberate — comparing, researching, justifying |
| Content goal | Stop the scroll, create feeling, build desire | Explain, convince, resolve objection |
| Funnel stage | Discovery, awareness, re-engagement | Consideration, decision, post-purchase |

**Route:**
- **System 1 content** → Lead with L1 (Perception), L2 (Desire), L6 (Attention/Spread)
- **System 2 content** → Lead with L3 (Influence/Persuasion), L4 (Behavioral Economics)
- **System 1 → System 2 transition** (moving someone from scroll to decision) → L2 + L3 bridge

State your route before proceeding to Step 1. Do not skip.

---

## STEP 1 — PRE-CONTENT CHECKLIST (60 seconds)

Answer these before activating any layer:

| Question | Answer |
|---|---|
| Which brand? | |
| Which surface? (social / website / product / email / ad / campaign) | |
| Content goal? (acquire / retain / deepen loyalty) | |
| Is this System 1 content? (gut-feel, scroll-stop, instant emotion) | |
| Or System 2? (deliberate, considered, research-mode) | |
| Social signal or self-signal? (showing others vs validating self) | |
| Brand lifecycle stage? (0→1 / growing / scaling / repositioning) | |
| Any lever at Triple Cap right now? | |

---

## STEP 2 — STRATEGY LOG CHECK

Read the last 3 STRATEGY_LOG entries for this brand + surface.

**If previous strategy exists:**
- Did it work? (check Results field)
  - YES → identify the mechanism, evolve it, check Triple Cap
  - NO → diagnose why (wrong lever? wrong surface? wrong timing?), select new lever
  - PENDING → note it, proceed with new content, flag that results are still outstanding

**If no previous entry:**
- Fresh start. Full layer reasoning below.

**Triple Cap Rule:**
If the same psychological lever has been the PRIMARY driver 3 consecutive times
for the same brand surface → it is CAPPED. Select a different lever.
Claude must not override this rule even if the lever is performing well.
Variety maintains psychological freshness in the audience's mind.

---

## STEP 3 — PSYCHOLOGY LAYERS (COMPRESSED)

Claude activates the most relevant 2-3 layers per piece of content.
Not all layers fire every time. Choose based on surface + goal.

---

### L1 — PERCEPTION & FIRST IMPRESSIONS
*Activates when: website copy, product pages, first-touch social content, ads*

**Core mechanism:** The brain decides in milliseconds. Before logic fires,
the subconscious has already judged. Content must pass this filter first.

**Key principles:**
- Processing fluency — easier to process = more trusted. Simplicity signals quality.
- Halo effect — one strong positive cue colors everything else
- Thin-slicing — people form accurate impressions from tiny amounts of information
- Pattern interrupt — break expected format to force attention

**Activation trigger:** Ask — *what does someone feel in the first 2 seconds?*
If the answer is "nothing" — this layer needs work before anything else.

**Research prompt (runtime):** Search current examples of brands in this
category using silence, minimalism, or visual contrast as perception tools.

---

### L2 — DESIRE ARCHITECTURE
*Activates when: product descriptions, campaign hooks, brand storytelling*

**Core mechanism:** People don't buy products. They buy who they want to become.
The gap between current self and aspirational self is the engine of desire.

**Key principles:**
- Jobs-to-be-Done — what progress is the customer trying to make in their life?
- Identity-based desire — "people like me wear/use/buy this"
- Aspirational self gap — show the future version, not the current product
- Authenticity signal — desire built on false promises collapses; on truth, compounds

**Activation trigger:** Ask — *who does the customer become after buying this?*
That answer is the content. The product is just the vehicle.

**Research prompt (runtime):** Search how small independent brands in this
category have used founder story or customer transformation as their primary hook.

---

### L3 — INFLUENCE & PERSUASION
*Activates when: CTAs, launch content, limited releases, social proof moments*

**Cialdini's 7 — activation map:**

| Principle | When to use | When NOT to use |
|---|---|---|
| Reciprocity | Give value before asking | Don't force it — feels transactional |
| Commitment | Post-purchase loyalty content | Early acquisition — too soon |
| Social proof | Mid-funnel, consideration stage | Brand new launches — no proof yet |
| Authority | Technical or quality claims | Casual/lifestyle content — kills vibe |
| Liking | Brand voice, community content | Hard sell moments |
| Scarcity | Drops, limited editions, deadlines | Everyday products — loses meaning |
| Unity | Community, shared identity content | Broad audiences — too generic |

**Activation trigger:** Ask — *which principle is this content trying to activate?*
Never activate more than 2 simultaneously — audiences feel manipulated.

---

### L4 — BEHAVIORAL ECONOMICS
*Activates when: pricing content, product tiers, checkout experience, offer framing*

**Key principles (compressed):**
- Loss aversion — "don't miss" outperforms "you'll gain" by ~2x
- Anchoring — first price/value seen sets the reference frame for everything after
- Decoy effect — 3-tier pricing makes the middle tier feel like the smart choice
- Paradox of choice — fewer options = higher conversion
- Peak-end rule — people remember the peak moment and the ending, not the average

**Activation trigger:** Ask — *is this content about a decision?*
If yes, frame around what they lose by not acting, not what they gain by acting.

---

### L5 — BRAND MEMORY & DISTINCTIVENESS
*Activates when: brand identity content, visual direction, campaign naming, tone*

**Key principles:**
- Mental availability (Byron Sharp) — be thought of first in the buying moment
- Distinctive assets — one repeatable visual/verbal signature beats many varied ones
- Emotional encoding — stories are remembered; specs are forgotten
- Archetype alignment — brand personality should map to one Jungian archetype
  consistently (Rebel, Creator, Lover, Hero, Sage, Innocent, Explorer, Ruler)

**Activation trigger:** Ask — *if someone saw this with no logo, would they know
it was this brand?* If no — this layer needs work.

---

### L6 — ATTENTION, RETENTION & SPREAD
*Activates when: social content, hooks, viral mechanics, campaign structure*

**Key principles:**
- Curiosity gap — open a loop the audience needs to close ("here's what we found...")
- Zeigarnik effect — unfinished things are remembered (never complete the story in post 1)
- Von Restorff — the thing that's different gets remembered
- Emotional contagion — high-arousal emotions (awe, excitement, outrage) spread 3x more
- Pattern interrupt — break the expected format in the first 2 seconds

**Activation trigger:** Ask — *why would someone share this?*
If there's no answer — it won't spread regardless of quality.

**Research prompt (runtime):** Search recent examples of small brands
that generated outsized reach with minimal spend. Extract the mechanism, not the execution.

---

### L7 — SOCIAL, TRIBAL & CULTURAL PSYCHOLOGY
*Activates when: community content, brand positioning, cultural moments, identity campaigns*

**Key principles:**
- In-group/out-group — belonging to "us" requires knowing who "them" is
- Tribal identity signals — language, aesthetics, and references that mark membership
- Status signaling — in fashion specifically, products signal aspiration hierarchy
- Cultural congruence — content that feels out of sync with current cultural moment fails
  regardless of psychological soundness

**Activation trigger:** Ask — *what group does this content make someone feel part of?*
And — *is that the group this brand is building?*

**Timing & Context note:** When content is delivered matters as much as what it says.
A launch post, a mid-scroll organic post, and a retargeting touchpoint are
psychologically different events requiring different lever activation.

---

## STEP 4 — GENERATE A/B VARIANTS

Always produce exactly 2 variants. Each tests a DIFFERENT psychological lever.
Never produce 2 variants that are just tonal rewrites of the same lever.

**Variant A:**
- Primary lever: [state which layer and which principle]
- Rationale: [one sentence — why this lever for this brand at this stage]
- Content: [the actual output]

**Variant B:**
- Primary lever: [state which layer and which principle]
- Rationale: [one sentence — why this is a meaningfully different psychological test]
- Content: [the actual output]

**Run recommendation:** [Which to run first and why — based on brand lifecycle stage
and what's been tried before per Strategy Log]

---

## STEP 5 — OUTPUT AUDIT (30 seconds)

Before delivering, Claude checks:

- [ ] Does this pass the 2-second System 1 filter?
- [ ] Is the psychological lever intentional and named?
- [ ] Is it consistent with Brand Memory File?
- [ ] Does it serve the brand's desired perception — not undermine it?
- [ ] Is the Triple Cap Rule respected?
- [ ] Are both variants testing genuinely different levers?

If any box fails — revise before delivering.

---

## STEP 6 — SESSION END WRITES (end of session)

Claude generates the following entries. Stark pastes them into the correct files, or MCP filesystem tool writes them if configured.

### 6A — Write to STRATEGY_LOG.md

```
---
Date: [auto]
Brand: [brand name]
Surface: [social / website / product / email / ad / campaign]
Goal: [acquire / retain / deepen loyalty]
Layer(s) activated: [list]
Primary lever — Variant A: [principle name]
Primary lever — Variant B: [principle name]
Run recommendation: [A or B + one-line reason]
Triple Cap status: [lever name — count X/3]
Results: [PENDING]
Diagnosis: [fill when results come in]
Next cycle direction: [fill when results come in]
---
```

### 6B — Append to LEVER_TRACKER.md

Add one row to the relevant brand + surface table:
```
| [N] | [YYYY-MM-DD] | [primary lever name] | L[1-7] | [ACTIVE / CAPPED] |
```
Update Cap Status Summary. If count = 3 → mark CAPPED, alert in output.

### 6C — Append to BRAND_MEMORY.md (self-improving)

Add one line to the brand's BRAND_MEMORY.md audience psychology section:
```
[YYYY-MM-DD] Psychology note: [what was observed about this audience's response to lever X on surface Y]
```
This builds a compounding brand-specific psychological profile across sessions.

### 6D — Append to MEMORY.md (cross-reference)

Add one line to the agent MEMORY.md:
```
[YYYY-MM-DD] — STRATEGY_LOG entry written: [brand] / [surface] / [primary lever] — [outcome: PENDING]
```

After all writes → if previous cycle Results field is filled → run `@kahneman results` to trigger proposal.

---

## RESEARCH PROTOCOL (runtime)

When this skill calls for a research prompt:

1. Search for current real-world brand examples (not older than 18 months)
2. Find both large AND small brand examples — weight small brands equally
3. Extract: what happened → what psychological mechanism drove it →
   what would need to be true for it to work for this brand
4. Never reference examples directly in output ("like X did") —
   extract the mechanism and apply it natively
5. Discard examples that don't have a clear psychological mechanism behind them

---

## TRIPLE CAP RULE — FULL DEFINITION

The same psychological lever cannot be the PRIMARY driver for more than
3 consecutive pieces of content on the same brand surface.

Tracking lives in `LEVER_TRACKER.md` per brand per surface.

**Why this rule exists:**
Audiences psychologically adapt. A lever that worked 3 times will produce
diminishing returns on the 4th. The brand's content starts feeling predictable.
Predictable = invisible. Invisible = no impact.

**What counts as "same lever":**
Same Cialdini principle, same layer, same core psychological mechanism.
Evolving the execution (different copy, different visual) does NOT reset the cap.
Only switching the PRIMARY lever resets it.

**Cap reset:**
After using a different primary lever once, the previous lever's cap resets.

---

*Variant A is optimized for speed. When a task requires full strategic depth,
campaign architecture, or brand repositioning — use 02-kahneman.md instead.*

---

## LEARNED LAYER ACTIVATIONS (auto-updated — Hermes self-improving pattern)

> Kahneman appends one line here after each session when results are confirmed (not PENDING).
> Over time this builds brand-specific psychological intelligence. Do not edit manually.

### Novizio
<!-- entries appended by session end protocol when results confirmed -->

### Hourbour
<!-- entries appended by session end protocol when results confirmed -->
