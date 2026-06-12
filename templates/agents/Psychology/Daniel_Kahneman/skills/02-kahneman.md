---
name: consumer-psychology-deep
version: 1.0
platforms: []
metadata:
  hermes:
    tags: [psychology, behavioral, framing, system1, bias, lever, debiasing, skills]
variant: B — Deep Strategist
purpose: Full strategic reasoning for campaigns, repositioning, website architecture,
brands: Novizio, Hourbour (and future sub-brands)
auto-load: BRAND_MEMORY.md + STRATEGY_LOG.md + LEVER_TRACKER.md + PROPOSAL_TEMPLATE.md before every session
trigger: [campaign strategy, brand repositioning, website redesign, new product launch, high-stakes decision, full psychological audit, A/B test design, deep framing analysis]
output: [A/B variants with hypotheses + metrics, scored audit, strategy log entry, LEVER_TRACKER update, BRAND_MEMORY append, proposal if results exist]
calls: [principles.md, tools.md, BRAND_MEMORY.md, STRATEGY_LOG.md, LEVER_TRACKER.md, PROPOSAL_TEMPLATE.md]
source-principles: principles.md v1.0 — if content diverges, principles.md is canonical. Run skills-sync after any edit to principles.md.
prerequisite: PROPOSAL_TEMPLATE.md must exist before Phase 7 proposal trigger will work. Create it in memory/brands/[name]/ before first deep session.
---

# CONSUMER PSYCHOLOGY SKILL — VARIANT B (DEEP STRATEGIST)

> Slow is smooth. Smooth is fast.
> This variant is for decisions that matter — campaign strategy, brand repositioning,
> website redesigns, new product launches, and any content that will run at scale.
> Claude reasons fully before producing anything. No shortcuts.

---

## MANDATORY INTAKE — DO NOT SKIP ANY PART

Before any reasoning begins, Claude MUST load and read:

1. `BRAND_MEMORY.md` — full brand context for the relevant brand
2. `STRATEGY_LOG.md` — ALL previous entries for this brand/surface
3. `LEVER_TRACKER.md` — current Triple Cap status across all surfaces
4. `PROPOSAL_TEMPLATE.md` — check if any pending proposal awaits results

**If any file is missing:** STOP. Flag which file is missing and why it's needed
before proceeding. Do not approximate or assume brand context.

**Starting without full context is the single most common failure mode
in brand strategy. This skill is designed to prevent it.**

---

## PHASE 1 — BRAND CONTEXT SYNTHESIS

After reading Brand Memory File, Claude produces a 5-line internal synthesis:

```
Brand: [name]
Current perception: [how audience actually sees it now]
Desired perception: [where Stark wants it to be]
Gap: [what needs to shift and how large that gap is]
Lifecycle stage: [0→1 / growing / scaling / repositioning]
Biggest psychological opportunity right now: [one sentence]
```

This synthesis is NOT shown to the user unless asked.
It is the lens through which all layer reasoning happens.

---

## PHASE 1B — SYSTEM 1 / SYSTEM 2 ROUTER

> Run after Phase 1 brand synthesis. Brand context is now loaded — answer this precisely.

**This is the Kahneman identity question. Every campaign targets one system primarily.**

| Dimension | System 1 | System 2 |
|---|---|---|
| Decision speed | Milliseconds — automatic, emotional | Minutes — deliberate, evaluative |
| Audience state | Passive scrolling, emotional receptivity | Active research, comparison mode |
| Content goal | Create feeling, build desire, encode memory | Resolve objection, justify decision, explain value |
| Primary layers | L1, L2, L6, L7 | L3, L4 |
| Funnel stage | Discovery, awareness, brand-building | Consideration, decision, post-purchase |

**State explicitly:**
- Primary system target: System 1 / System 2 / Transition (S1→S2)
- Why: [one sentence based on brand lifecycle stage and content goal]
- Layer priority order: [list layers in activation order for this campaign]

This routing decision locks in before Phase 2. Do not revise it based on what's convenient later.

---

## PHASE 2 — STRATEGY LOG ANALYSIS

**Read all previous entries for this brand + surface.**

Produce a strategy audit:

**What has been tried:**
List all levers used, in order, for this surface.

**What worked and why:**
For each successful entry — identify the psychological mechanism that drove success.
Not just "it got engagement" — WHY did that lever connect with this audience at that time?

**What failed and why:**
For each failed entry — diagnose the failure.
Was it the wrong lever for the lifecycle stage?
Wrong timing? Wrong surface? Execution failure vs strategy failure?
This distinction matters — a good strategy executed badly is different from a bad strategy.

**Pattern recognition:**
What does the audience consistently respond to?
What do they consistently ignore?
What has never been tested that the psychology layers suggest would work?

**Triple Cap audit:**
Which levers are approaching or at cap?
Which levers have been underused?

---

## PHASE 3 — DEEP PSYCHOLOGY LAYERS

Unlike Variant A, all 8 layers are considered for every piece of work.
Claude determines which are PRIMARY (drive the content) and which are SECONDARY
(inform but don't lead). A piece of content can have 1 primary and up to 2 secondary layers.

---

### L1 — PERCEPTION & FIRST IMPRESSIONS
*The subconscious filter. Everything passes through here first.*

**Full reasoning depth:**

System 1 (fast, automatic, emotional) fires before System 2 (slow, deliberate, logical).
95% of purchasing decisions are driven at the System 1 level.
This means the feeling of the content must be right before the logic of the content matters.

**Processing fluency:**
Content that is easy to process feels more true and more trustworthy.
This applies to: sentence length, visual hierarchy, word choice complexity,
layout breathing room, and font legibility.
Simple does not mean cheap. Apple's entire brand is built on fluency as luxury.

**Halo effect:**
One strong signal colors all other signals.
A single premium element (photography quality, typeface, first sentence)
elevates the perceived quality of everything around it.
The inverse is equally true — one cheap signal contaminates everything.

**Thin-slicing:**
Audiences form accurate brand impressions in under 100ms.
The brand's visual and verbal identity must be consistent enough to
carry the right impression in that window — every single time.

**Pattern interrupt:**
Breaking expected format forces attention at the neurological level.
But pattern interrupts must be brand-congruent — breaking format while
staying true to brand identity. Random disruption reads as cheap. Intentional
disruption reads as confident.

**Deep question for this layer:**
*What does someone feel about this brand in the first 2 seconds —
and is that feeling the exact feeling the brand needs them to have?*

**Runtime research:** Search current examples in this category where
perception and pricing are misaligned — brands that charge premium
but feel mid-tier, or charge mid-tier but feel premium. Extract the
specific signals causing the misalignment.

---

### L2 — DESIRE ARCHITECTURE
*The engine of purchase. Built on identity, not product.*

**Full reasoning depth:**

Jobs-to-be-Done theory: people hire products to make progress in their lives.
The progress is emotional and social as much as functional.
A fashion brand is never hired to "cover the body." It's hired to signal belonging,
attract attention, mark a transition, or claim an identity.

**Identity-based desire:**
People buy who they want to become, not what they currently need.
The aspiration gap — the distance between current self and desired self —
is the psychological space where brand desire lives.
Content that narrows this gap with the brand as the vehicle creates desire.
Content that ignores this gap and focuses on product features creates comparison.

**The authenticity requirement:**
Desire built on false aspiration collapses when the product fails to deliver.
Desire built on authentic brand truth compounds — each purchase reinforces identity,
each reinforcement deepens loyalty, each deepened loyalty produces advocacy.

**JTBD activation map for fashion:**
- "I want to feel like I belong to a world I admire" → social identity desire
- "I want to feel like myself more fully" → authentic self desire
- "I want to signal that I've arrived / I'm different / I know something others don't" → status desire
- "I want to feel good in my own skin" → self-validation desire

**Deep question for this layer:**
*Who does the customer become — in their own mind and in others' eyes —
the moment they're associated with this brand?*
That answer is the content. Write it as if you're describing the person, not the product.

---

### L3 — INFLUENCE & PERSUASION
*The mechanics of the yes. Use with precision, never with excess.*

**Full Cialdini framework with fashion-specific application:**

**Reciprocity:**
Give value unconditionally before asking for anything.
In fashion: education (how to style), behind-the-scenes access, early information.
The psychological debt created by genuine generosity precedes purchase naturally.
Warning: forced or transactional reciprocity (gimmicky freebies) creates the opposite effect.

**Commitment & Consistency:**
Once someone takes a small action, they are psychologically motivated to stay consistent.
Wishlists, follows, shares, saves — each micro-commitment increases purchase likelihood.
In fashion: "save this for later" activates commitment before the customer is ready to buy.

**Social Proof:**
People follow what people like them do.
Most powerful when the proof-giver is perceived as a peer, not a celebrity.
Micro-social proof (a customer in the same city, same lifestyle) outperforms
macro-social proof (millions of customers) for fashion DTC brands.
Warning: social proof before a brand has traction reads as desperate. Time it correctly.

**Authority:**
Signals of expertise, craft, or knowledge elevate perceived quality.
In fashion: material sourcing stories, process transparency, designer credibility,
editorial placement. Authority must feel earned not claimed.

**Liking:**
People buy from brands they like. Liking is built through:
shared values, genuine personality, aesthetic resonance, humor, and familiarity.
In fashion: brand voice is the primary liking mechanism. Get it wrong and
no amount of scarcity or social proof will compensate.

**Scarcity:**
Scarcity is the most powerful lever in fashion — and the most abused.
Real scarcity (limited production, seasonal drops) creates genuine urgency.
Fake scarcity (artificial countdown timers, manufactured stock alerts) destroys trust permanently.
Rule: only use scarcity as a lever when scarcity is actually true.

**Unity:**
Shared identity. "We are the same kind of people."
The most powerful long-term loyalty lever.
In fashion: aesthetic tribes, subculture alignment, shared values.
Unity takes the longest to build and produces the most durable loyalty.

**Combination rules:**
Maximum 2 Cialdini principles active in a single piece of content.
Mixing more than 2 creates psychological noise and reads as manipulative.

---

### L4 — BEHAVIORAL ECONOMICS
*How decisions actually get made. Often contrary to what people say.*

**Full framework:**

**Loss aversion:**
Losses feel approximately twice as painful as equivalent gains feel good.
"Don't miss your chance" outperforms "here's your opportunity" at the neurological level.
Application: frame CTAs and urgency content around what is lost by not acting,
not what is gained by acting.

**Anchoring:**
The first number or value seen sets the reference frame for all subsequent evaluation.
In fashion pricing: showing a higher-priced item first makes the target item feel
like the reasonable choice. Never introduce your lowest price first.

**Decoy effect:**
When 3 options exist, the middle option appears most rational.
In product tiers, collections, or bundle offers — structure so the
preferred customer choice is positioned as the clear "smart middle."

**Paradox of choice:**
More options produce more anxiety and less decision-making.
Edit ruthlessly. A curated selection of 6 products converts better than
a sprawling grid of 60 — particularly for premium and aspirational brands.

**Peak-end rule:**
People remember experiences by their peak moment and their ending —
not the average. The unboxing experience, the post-purchase email,
the thank you note — these ending moments are disproportionately
powerful in shaping brand memory and repeat purchase intent.

**Mental accounting:**
People categorize purchases differently based on framing.
A $300 jacket purchased as a "wardrobe investment" feels different from
the same jacket purchased as an "impulse buy." Content can shift which
mental account the purchase is placed in — dramatically affecting willingness to pay.

**Deep question for this layer:**
*What mental account does the customer put this purchase in —
and is the content framing it to land in the most favorable one?*

---

### L5 — BRAND MEMORY & DISTINCTIVENESS
*Being thought of first. Being remembered always.*

**Full framework:**

**Mental availability (Byron Sharp):**
Brands grow by being thought of first in the buying moment.
Mental availability is built through consistent, distinctive, repeated signals —
not through targeting only in-market buyers.
Application: some content must reach people who are NOT currently buying,
so the brand is mentally available when they are ready.

**Distinctive assets:**
One repeatable visual or verbal signature builds recognition faster than
varied creative ever will. This feels counterintuitive but is empirically established.
The asset can be: a color, a phrase, a layout approach, a photo style, a tone.
Once identified — protect it. Repeat it. Never abandon it for novelty.

**Emotional encoding:**
The brain stores emotionally charged experiences in long-term memory.
Neutral content is processed and forgotten. Emotional content is stored.
Stories encode emotionally. Specifications do not.
Rule: lead with story, close with fact — never the reverse.

**Jungian archetypes:**
Every strong brand maps to one consistent personality archetype.
This archetype should inform voice, visual aesthetic, content topics, and
the kind of customer the brand attracts.

Fashion archetype map:
- Rebel: Supreme, Vivienne Westwood, Rick Owens
- Creator: Comme des Garçons, Maison Margiela
- Lover: Chanel, Agent Provocateur, Valentine
- Hero: Nike, Under Armour, Gymshark
- Sage: Eileen Fisher, Cos, Muji
- Explorer: Patagonia, Arc'teryx, Salehe Bembury collabs
- Ruler: Louis Vuitton, Hermès, Brunello Cucinelli
- Innocent: Sézane, Jacquemus in early days, Rouje

**Deep question for this layer:**
*If this brand were a person walking into a room —
who are they, how do they dress, how do they speak,
and who notices them first?*

---

### L6 — ATTENTION, RETENTION & SPREAD
*Getting seen. Being remembered. Getting shared.*

**Full framework:**

**Curiosity gap (Loewenstein):**
The brain is physiologically motivated to close open information loops.
Introducing a gap between what the audience knows and what they want to know
creates forward momentum. They must keep reading/watching/clicking to close the gap.
Application: hooks that imply information without revealing it.
"We changed one thing about how we make this. Nobody noticed for 6 months."

**Zeigarnik effect:**
Unfinished things are remembered more vividly than completed things.
Application: serialized content, cliffhangers, "part 2" mechanics,
campaigns that run across multiple posts before resolving.
The audience's need for closure keeps them engaged and returning.

**Von Restorff effect:**
The isolated item — the one that doesn't fit the pattern — is remembered.
Application: in a feed of highly produced fashion content, raw authenticity stands out.
In a feed of raw authenticity, high production stands out.
Always ask: what is the norm in this space? Then consider breaking it intentionally.

**Emotional contagion:**
High-arousal emotions spread. Low-arousal emotions stay contained.
Awe, excitement, outrage, and inspiration spread 3x more than sadness or contentment.
Application: identify what high-arousal emotion this brand can authentically generate
and build spread mechanics around it. Do not manufacture emotion — find what's real.

**Pattern interrupt:**
The first 2-3 seconds of any content are the spread/scroll decision point.
Breaking the expected format in this window forces neurological attention.
Expected formats are platform-specific and change — research what's current.

**Participation mechanics:**
Content spreads fastest when the audience plays a role in it.
Tags, challenges, duets, UGC prompts, opinions requested — any mechanic
that gives the audience a reason to engage rather than just consume.

**Deep question for this layer:**
*Why would someone share this with a specific person they know?
Who is that person and what does sharing this say about the sharer?*
If you can't answer — it won't spread.

---

### L7 — SOCIAL, TRIBAL & CULTURAL PSYCHOLOGY
*Belonging. Status. Identity. The deepest purchase drivers in fashion.*

**Full framework:**

**In-group/out-group dynamics:**
Every strong brand community knows who it's for — and implicitly, who it's not for.
This is not exclusion for its own sake — it's identity clarity.
A brand that tries to be for everyone signals no identity at all.
Application: name the tribe. Give it markers. Make membership feel meaningful.

**Tribal identity signals:**
Language, references, aesthetics, and behaviors that mark belonging.
In fashion: how you describe fit, fabric, construction. What you reference.
What you refuse to do. What you celebrate. What you reject.
Tribe members recognize each other through these signals — the brand's job
is to create and protect them.

**Status signaling in fashion:**
Fashion is one of the most status-laden consumer categories.
Status can be: overt (luxury logos), covert (quiet luxury), counter-status
(deliberately anti-status, which is itself a status signal).
The brand must know which status register it operates in — and be consistent.
Mixing registers confuses the audience and erodes perceived value.

**Cultural congruence:**
Content that is psychologically sound but culturally out of sync still fails.
The cultural moment shifts constantly. A brand that felt aspirational in 2022
might feel tone-deaf in 2026 with identical content.
Application: research the current cultural conversation in this category before
every major campaign. Adjust tone, reference points, and imagery accordingly.

**Cause alignment:**
When a brand addresses issues that matter to its audience, emotional bonds deepen.
This only works when the alignment is authentic — performative cause marketing
is immediately identified and damages trust more than no stance at all.

**Deep question for this layer:**
*What does it say about a person that they wear/use/follow this brand?
Is that what this brand wants it to say? Is it what the target customer wants it to say?*

---

### L8 — TIMING & CONTEXT PSYCHOLOGY
*The same content at the wrong time fails. Timing is a psychological variable.*

**Full framework:**

**Content touchpoint psychology:**
Different moments in the customer journey require completely different psychological approaches.

| Touchpoint | Psychological state | What works |
|---|---|---|
| First discovery | Curious, skeptical | L1 (perception) + L2 (desire hook) |
| Consideration | Evaluating, comparing | L3 (social proof + authority) + L4 (anchoring) |
| Decision | Ready but hesitant | L3 (scarcity + commitment) + L4 (loss aversion) |
| Post-purchase | Justifying, excited | L4 (peak-end rule) + L5 (identity reinforcement) |
| Loyalty | Belonging | L7 (tribal) + L3 (unity) |
| Re-engagement | Lapsed, possibly skeptical | L6 (curiosity gap) + L2 (aspirational gap) |

**Platform timing:**
Psychological receptivity varies by platform, time of day, and day of week.
Research current platform-specific timing data at runtime — do not rely on
static guidelines as these shift with algorithm changes.

**Cultural calendar:**
Certain cultural moments create heightened psychological receptivity for specific levers.
Map major brand content to cultural moments — not just commercial holidays
but micro-cultural moments relevant to the brand's tribe.

**Deep question for this layer:**
*Where is this person in their relationship with this brand right now —
and what psychological state are they in at the moment this content reaches them?*

---

## PHASE 4 — LAYER SELECTION & REASONING

After considering all 8 layers, Claude states:

**Primary layer:** [layer name + specific principle]
*Reason: [why this layer is primary for this brand at this stage on this surface]*

**Secondary layer(s):** [up to 2, with principles]
*Reason: [why these complement without conflicting]*

**Layers deliberately NOT activated and why:**
[This shows the reasoning is intentional, not random]

---

## PHASE 5 — A/B VARIANT GENERATION

Always produce exactly 2 variants. Each must test a genuinely different
psychological lever — not tonal rewrites of the same approach.

**Variant A:**
Primary lever: [layer + principle — be specific]
Psychological hypothesis: [what this lever is betting on about this audience]
Content: [the actual output]
Predicted response: [what psychological reaction this should trigger]
Measure by: [what metric confirms the hypothesis]

**Variant B:**
Primary lever: [layer + principle — be specific]
Psychological hypothesis: [what this lever is betting on — different bet from A]
Content: [the actual output]
Predicted response: [what psychological reaction this should trigger]
Measure by: [what metric confirms the hypothesis]

**Run recommendation:**
Which to run first: [A or B]
Reason: [based on lifecycle stage, what's been tried, and what the brand needs most now]
Sample size needed before calling a winner: [realistic estimate]

---

## PHASE 6 — OUTPUT SCORING AUDIT

Claude scores the output before delivering. Not pass/fail — scored.

| Dimension | Score (1-5) | Notes |
|---|---|---|
| System 1 filter pass | | Does it land in 2 seconds? |
| Lever intentionality | | Is the lever explicit and correct? |
| Brand memory alignment | | Consistent with Brand Memory File? |
| Perception impact | | Does it move toward desired perception? |
| Distinctiveness | | Would someone know it's this brand without a logo? |
| Spread potential | | Why would someone share this? |
| Triple Cap compliance | | Lever not at cap? |
| Variant differentiation | | Are A and B genuinely different psychological bets? |

**Minimum acceptable score: 4/5 across all dimensions.**
If any dimension scores 3 or below — revise that element before delivering.
If any dimension scores 1-2 — do not deliver. Rebuild from that layer.

---

## PHASE 7 — SESSION END WRITES

Claude generates the following entries. Stark pastes them, or MCP filesystem tool writes them if configured.

### 7A — Write to STRATEGY_LOG.md

```
---
Date: [auto]
Brand: [brand name]
Surface: [social / website / product / email / ad / campaign]
Skill variant used: B — Deep Strategist
Goal: [acquire / retain / deepen loyalty]
Brand lifecycle stage: [0→1 / growing / scaling / repositioning]
Touchpoint type: [first discovery / consideration / decision / post-purchase / loyalty / re-engagement]

Layers activated:
  Primary: [layer + principle]
  Secondary: [layer(s) + principle(s)]
  Deliberately excluded: [layers + reasons]

Variant A:
  Primary lever: [name]
  Hypothesis: [one sentence]
  Measure by: [metric]

Variant B:
  Primary lever: [name]
  Hypothesis: [one sentence]
  Measure by: [metric]

Run recommendation: [A or B + reason]

Output scores:
  System 1 filter: X/5
  Lever intentionality: X/5
  Brand memory alignment: X/5
  Perception impact: X/5
  Distinctiveness: X/5
  Spread potential: X/5
  Triple Cap compliance: X/5
  Variant differentiation: X/5

Triple Cap status: [lever name — count X/3 per surface]

Results: [PENDING]
Diagnosis: [fill when results come in]
Mechanism confirmed/rejected: [fill when results come in]
Next cycle direction: [fill when results come in]
---
```

### 7B — Append to LEVER_TRACKER.md

Add one row to relevant brand + surface table:
```
| [N] | [YYYY-MM-DD] | [primary lever name] | L[1-8] | [ACTIVE / CAPPED] |
```
Update Cap Status Summary. If count = 3 → mark CAPPED, alert in output.

### 7C — Append to BRAND_MEMORY.md (self-improving)

Add one line to the brand's audience psychology section:
```
[YYYY-MM-DD] Deep psychology note: [what was learned about audience system targeting, layer performance, or archetype fit this session]
```

### 7D — Append to MEMORY.md (cross-reference)

```
[YYYY-MM-DD] — STRATEGY_LOG entry written (Deep): [brand] / [surface] / [primary lever] — [outcome: PENDING]
```

### 7E — Proposal trigger (if previous cycle results exist)

**Condition:** Previous STRATEGY_LOG entry has Results field filled (not PENDING).

**Primary delivery:**
- Generate full proposal from PROPOSAL_TEMPLATE.md
- Send via Gmail MCP → Subject: `[Brand] Strategy Proposal — [Date] — Action Required`
- Write to Supabase via YVON dashboard

**Fallback (if MCP not configured):**
- Write proposal to STRATEGY_LOG.md marked `PROPOSAL_PENDING`
- Include in next Marcus CEO brief under "Kahneman Proposal Ready"
- Alert Stark in session output: "Proposal ready — MCP unavailable, saved to STRATEGY_LOG"

Trigger manually with: `@kahneman results --brand "[name]" --surface "[surface]" --date "[date]"`

---

## PROPOSAL TRIGGER CONDITIONS

A proposal is generated and sent when ALL of the following are true:
1. A previous Strategy Log entry has Results field filled (not PENDING)
2. At least one full cycle has completed (variant ran, results collected)
3. Enough data exists to make a directional recommendation

**Proposal contains:**
- What was run (variant, lever, surface)
- What the results showed (numbers + interpretation)
- Psychological diagnosis (why it worked or didn't — mechanism level)
- Recommended next move with rationale
- A/B variants for next cycle (pre-built)
- Triple Cap status update
- Overall brand perception progress assessment

**Proposal delivery:**
- Email to Stark via Gmail MCP
- Written to YVON Supabase (CEO dashboard view)
- Subject line: `[Brand] Strategy Proposal — [Date] — Action Required`

---

## MECHANISM EXTRACTION PROTOCOL (runtime research)

When researching brand examples at runtime:

**Step 1 — Find the move:**
Search for real brand examples relevant to the current task.
Prioritize: current (within 18 months), both large AND small brands,
fashion and adjacent categories, examples with measurable outcomes.

**Step 2 — Extract the mechanism:**
What psychological lever did this brand pull?
Which of the 8 layers does this activate?
Why did it work for this brand at this stage?

**Step 3 — Assess transferability:**
What would need to be true about our brand for this mechanism to work?
Is our brand at the right lifecycle stage?
Does our audience share the same psychological profile?
Do we have the brand equity required for this lever to activate?

**Step 4 — Engineer natively:**
Never reference the source brand in output.
Extract the mechanism. Apply it in a way that is native to this brand's
voice, aesthetic, archetype, and stage.

**Step 5 — Document:**
Note the source example and extracted mechanism in the session log
for future reference — but keep it internal, not in client-facing output.

---

## TRIPLE CAP RULE — FULL DEFINITION

The same psychological lever cannot be the PRIMARY driver for more than
3 consecutive pieces of content on the same brand surface.

Tracking: `LEVER_TRACKER.md` per brand per surface.

**Why:** Audiences adapt. Repeated activation of the same lever produces
diminishing psychological returns. By the 4th repetition, the audience
has learned to filter it — it becomes invisible. Variety maintains
psychological freshness and prevents the brand from becoming predictable.

**What counts as same lever:**
Same Cialdini principle, same layer, same core mechanism.
Evolving execution (different copy, visual, format) does NOT reset the cap.
Only switching the PRIMARY lever resets it.

**Cap reset:**
Using a different primary lever once resets the previous lever's count.

**Override condition:**
No override. The Triple Cap Rule is absolute.
Even if a lever is performing well — after 3 consecutive uses, switch.
The goal is long-term brand health, not short-term metric optimization.

---

*Variant B is the full strategic instrument. For fast, high-frequency content
work — use 01-kahneman.md. When in doubt about which to use:
high-stakes or first-time content → Variant B.
Recurring or quick-turnaround content → Variant A.*

---

## LEARNED LAYER ACTIVATIONS (auto-updated — Hermes self-improving pattern)

> Kahneman appends one line here after each deep session when results are confirmed.
> Format: `[YYYY-MM-DD] [brand] [surface] — [layer] [lever] → [worked/failed] — [mechanism note]`
> This table becomes the brand's psychological intelligence over time. Never edit manually.

### Novizio
<!-- entries appended by session end protocol when results confirmed -->

### Hourbour
<!-- entries appended by session end protocol when results confirmed -->