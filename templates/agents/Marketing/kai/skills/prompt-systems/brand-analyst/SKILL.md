---
name: brand-analyst
description: >-
  Use this skill whenever the user provides a website URL and wants a brand analysis, brand DNA breakdown, visual identity audit, tone of voice study, or creative direction reference. Trigger when the user says things like "analyze this brand", "give me a brand breakdown", "what's the visual identity of", "analyze this website", "what's the brand DNA", or "I need to understand how this brand communicates". Also trigger when the user pastes a URL with creative or strategic intent. This skill produces a structured, art-director-grade brand analysis covering positioning, visual language, photography direction, typography, color, and tone of voice — suitable as a creative brief reference or onboarding document for a new brand project.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [analytics, data, kpi, competitor, trend, market-gap, ga4, prompt]
---

# Brand Analyst

Produce a precise, professional brand DNA analysis from a website. Write as a senior art director or brand strategist would — no vague superlatives, no filler. Every observation must be specific, visual, and actionable.

---

## Workflow

### 1. Fetch the website

Use `web_fetch` on the URL provided. If the homepage is sparse, also fetch:
- `/about` or `/about-us`
- A product or collection page
- A campaign or editorial page if detectable

Look for: hero copy, product descriptions, mission statements, visual styling cues described in CSS/class names, font references, image alt text, and any brand voice in UI microcopy.

Use `image_search` with the brand name to pull visual references — product shots, campaign imagery, packaging — to inform the photography and visual tone section.

### 2. Compile the analysis

Structure the output exactly as shown below. Do not add preamble or meta-commentary. Deliver the analysis directly.

---

## Output Format

Use this exact structure. Write in tight, declarative sentences. Avoid adjective stacks. Be precise.

---

### 📷 BRAND IDENTITY

**Brand name**
**Sector / category**
**Founded / origin** *(if determinable)*
**Brand archetype** *(e.g. The Sage, The Creator, The Outlaw — use classic archetypes if applicable)*
**One-line brand essence** *(what the brand ultimately sells beyond the product — e.g. "Permission to take up space" / "The quiet confidence of craft")*

---

### 🎯 POSITIONING

**Target audience**
Describe with precision: demographics, psychographics, lifestyle markers, cultural references. Avoid generic descriptions like "millennials who care about quality." Instead: "Design-literate urban professionals, 28–42, who read Kinfolk and buy Aesop. Distrust mass marketing. Value provenance."

**Competitive space**
Where does it sit on the market map? Premium / accessible / luxury / disruptive? Who are the implicit competitors and how does this brand differentiate?

**Brand promise**
The core value proposition, as the brand implies it — not their tagline, but the underlying contract with the customer.

**Cultural positioning**
What world does this brand inhabit? What references, movements, or aesthetics does it align with or borrow from?

---

### 🎨 VISUAL IDENTITY

**Primary palette**
List colors with approximate hex values where determinable. Note dominant, secondary, and accent usage.

**Typography**
Identify typefaces used (or closest match). Describe their role: headline font vs. body vs. UI. Note weight, tracking, and any distinctive typographic gestures (e.g., "all-caps lockups", "tight tracking on display type", "humanist sans for approachability").

**Logo & mark**
Describe the logo style: wordmark / lettermark / symbol. Note geometry, weight, any distinctive feature. What does the mark communicate about the brand's register?

**Grid & layout language**
How is space used? Generous white space / dense editorial / asymmetric / rigidly geometric? Any recurring compositional motifs?

**Iconography & graphic devices**
Any recurring visual elements: lines, shapes, textures, illustration style, pattern language.

---

### 📷 PHOTOGRAPHY & VISUAL TONE

**Lighting style**
Describe with specificity: natural diffused light / hard directional / studio flat / golden-hour warmth / high-contrast chiaroscuro / clinical overexposed. Is shadow used or avoided?

**Colour grade**
Describe the grade: warm/cool, saturated/desaturated, lifted blacks, crushed highlights, matte finish, filmic grain. Reference a recognizable aesthetic if appropriate (e.g., "desaturated Scandinavian palette", "warm terracotta-shifted film tones").

**Typical composition**
How are subjects framed? Close crop / wide environmental / overhead flat-lay / editorial candid / formal symmetry? What's usually in frame?

**Surfaces, props, materials**
What textures and objects recur? (e.g., raw linen, poured concrete, glazed ceramic, unvarnished oak, worn leather) What materials are *never* used?

**Model direction & casting**
If people appear: how are they cast and directed? Expressive / neutral / candid / stylized / diverse / type-cast? What does the casting say about the brand's world?

**Overall mood**
One to three sentences capturing the feeling of the visual world. What emotion does it elicit? What should *not* be in this brand's imagery?

---

### ✍️ TONE OF VOICE

**Voice character**
Describe the brand's voice as a person: "Speaks like a well-traveled architect who doesn't need to explain themselves" / "The confident older sister who gives direct advice without moralizing."

**Writing style**
Sentence length, rhythm, punctuation style, use of fragments. Does it use questions? Commands? Whisper or declare?

**Key vocabulary**
10–15 words or phrases that feel native to this brand. These should be words a copywriter would reach for when writing in-brand.

**Vocabulary to avoid**
8–12 words or phrases that would feel instantly off-brand. Include any overused category clichés this brand deliberately sidesteps.

**Content themes**
What subjects does the brand return to? What stories does it tell about itself?

**What the brand never says**
Describe the self-censorship at work — the register, topics, or attitudes the brand would never adopt.

---

### 📋 CREATIVE DIRECTION SUMMARY

A closing paragraph (4–6 sentences) synthesizing the above into a working creative brief orientation. Written as if briefing a photographer, designer, or copywriter walking into their first day on this account. What is the single most important thing to understand about this brand's creative world?

---

## Craft Notes

- If information is genuinely unavailable from the website, say "Not determinable from available content" — do not fabricate.
- Where inference is needed, clearly mark it as such: *(inferred)*.
- Prioritize observed evidence over assumption. Ground every claim in something visible on the site.
- Use the vocabulary of the craft: colour theory, typographic terminology, photographic language, brand strategy terms. This document should be legible to a creative director.
- Avoid: "innovative," "cutting-edge," "passionate," "dedicated," "seamless," "world-class," "elevate," "journey." If the brand uses these words, flag them as weaknesses in the tone of voice section.
