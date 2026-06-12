---
name: pletor-advanced-nodes
description: >-
  Use this skill when a workflow requires advanced capabilities beyond basic generation: Composer for layout/composition, Logic nodes for automation and branching, Brand nodes for identity consistency, Lipsync/Subtitles for video character work, or Integration nodes for distribution. Load this skill when the user's prompt involves ads, localization, A/B testing, QA checkpoints, multi-step text processing, or publishing to external platforms.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [production, images, assets, upscaling, batch, generation, workflow, process]
---

# Pletor — Advanced Tools & Nodes

## When to Move Beyond Basic Generation

A basic workflow is: Input → Generate → Output.
You need advanced nodes when:
- You want **brand consistency** across all outputs
- You're building **ad creatives** that combine multiple elements
- You need **text processing / prompt engineering** in the workflow
- You want **localization or A/B variants** without manual rebuilding
- You need **QA checkpoints** before publishing
- You want to **animate characters** or add **speech to images**
- You're **distributing outputs** to social/ad platforms

---

## THE COMPOSER NODE — Your Layout Engine

### What it is
The Composer layers multiple elements (images, text, logos, video) into a single composed visual. It is a design canvas inside your workflow — not an AI generation model.

### When to use it
Use Composer whenever your workflow generates multiple elements that need to be **assembled into a final asset**:
- Ad creatives combining product shot + headline + logo + CTA
- Social posts with text overlay on generated background
- Localized variants (same layout, different text)
- A/B test variants (same layout, swapped elements)

### How to wire it
Connect each element as a separate input layer:
```
[Generate Image (background)] → Composer (layer 1)
[Upload Image (logo)]         → Composer (layer 2)
[Text Assistant (headline)]   → Composer (layer 3: text overlay)
[Text Prompt (CTA text)]      → Composer (layer 4: text overlay)
```
Inside Composer, set layer positions, sizes, and z-ordering.

### Power patterns with Composer

**Pattern: Localization at scale**
```
[Base Composition] → Composer
[Text Assistant (translate to FR/DE/ES...)] → Composer (text layer)
```
Run the agent N times with different language inputs — same layout, localized text.

**Pattern: A/B headline testing**
```
[Split Text (from list of headlines)] → [List Selector (pick #N)] → Composer
[Base Image]                                                      → Composer
```
Each run picks a different headline variant.

**Pattern: Static ad production**
1. Generate background/lifestyle image
2. Upload product shot → Remove Background
3. Generate headline text via Text Assistant
4. Feed all three + brand logo into Composer
5. Output: campaign-ready ad creative

---

## BRAND NODES — Enforcing Identity

### When you need them
Any workflow producing **public-facing creative content** should include brand nodes.

### Which brand nodes to use when

| Scenario | Add these brand nodes |
|---|---|
| Image/video generation needs to look on-brand | Visual References (upload style examples) |
| AI model needs to know who the brand is | Brand Context |
| Need to enforce specific creative rules | Brand Guidelines |
| Generating copy / captions / scripts | Brand Voice |
| Complex brand with full documentation | Brand Docs (PDF) |

### Wiring brand nodes
Connect brand nodes **directly into AI generation nodes**, not into input nodes:
```
[Visual References] → GenerateImage
[Brand Guidelines] → GenerateImage
[Brand Context]    → TextAssistant
[Brand Voice]      → TextAssistant
```

### Pro tip: Show, don't tell
Upload real examples (Visual References, Brand Voice) rather than describing your brand in text. The AI models learn faster from examples than from abstract descriptions.

---

## TEXT ASSISTANT NODE — The Prompt Engineer

### What it does
Runs an LLM with a custom system instruction. It's the most versatile node in Pletor.

### When to use a Text Assistant vs Prompt Concatenator

| Task | Use |
|---|---|
| Mechanically join two text strings | Prompt Concatenator (free, predictable) |
| Enhance a vague user prompt into a detailed generation prompt | Text Assistant |
| Combine user prompt + brand context intelligently | Text Assistant |
| Translate or localize copy | Text Assistant |
| Analyze an uploaded image or document | Text Assistant |
| Generate multiple ad headlines | Text Assistant |
| Extract structured data from a doc | Text Assistant |

### System instruction structure for Text Assistants
Always write system instructions with:
1. **Role**: What the LLM is (e.g., "You are a creative director at a luxury fashion brand")
2. **Task**: Exactly what to do with the inputs
3. **Output format**: How to structure the output (important when output feeds another node)
4. **Constraints**: Brand rules, word count limits, tone requirements

**Example — Prompt enhancer:**
```
You are an expert creative director specializing in luxury fashion photography.

Your task: Take the user's input prompt and rewrite it as a detailed, vivid image generation prompt.

Rules:
- Include lighting style, camera angle, background description, and mood
- Maintain the brand's editorial and sophisticated aesthetic
- Keep output under 150 words
- Output ONLY the enhanced prompt, no preamble
```

**Example — Ad copy generator:**
```
You are a performance marketing copywriter.

Your task: Generate 5 short ad headlines based on the product description and brand voice provided.

Format: Output as a numbered list, one headline per line.
Each headline: max 8 words, action-oriented, benefit-focused.
```

---

## LOGIC NODES — Automation & Control Flow

### Split Text + List Selector (pair)
**Use case:** Process multiple items from a single text input.

```
Text Assistant (generates "headline1\nheadline2\nheadline3")
  → Split Text (delimiter: \n)
    → [output_1] → GenerateImage (variation 1)
    → [output_2] → GenerateImage (variation 2)
    → [output_3] → GenerateImage (variation 3)
```

Or to pick one specific item:
```
Split Text → List Selector (index: 2) → GenerateImage
```

### Prompt Concatenator
**Use case:** Join multiple text inputs before a generation node when no LLM processing is needed.
```
[TextPrompt]     → PromptConcatenator → GenerateImage
[BrandGuidelines]→
```
- Faster than Text Assistant, no credits consumed
- Use only when you want a mechanical join, not intelligent processing

### Human Review
**Use case:** Any production pipeline where quality matters before output is published.

Insert after any generation node that produces content for review:
```
GenerateImage → HumanReview → Composer → MetaAds
```
The workflow pauses, a human approves or rejects the asset, then execution continues.

### Router
**Use case:** Send one node's output to multiple downstream nodes without duplicating or re-running.
```
GenerateImage → Router → RemoveBackground
                      → ChangeAspectRatio (1:1 for Instagram)
                      → ChangeAspectRatio (9:16 for TikTok)
                      → UpscaleImage
```
The image is generated once; Router distributes it to all four paths.

### Rename Asset
**Use case:** Organized file naming, especially before Google Drive export.
```
GenerateImage → RenameAsset (pattern: "{brand}_{format}_{date}") → GoogleDrive
```

---

## LIPSYNC & TALKING CHARACTER WORKFLOWS

### When to use lipsync
- Turn a still portrait into a speaking character for video ads
- Animate a brand mascot speaking a script
- Create UGC-style testimonial videos

### Standard lipsync workflow
```
[Upload Image (portrait/character)]  →  [GenerateLipsync]  →  [AddSubtitles]
[GenerateAudio (voiceover script)]   →
```

### Advanced: Full character video creation
```
[TextPrompt (script)]     → [GenerateAudio]        →  [GenerateLipsync]
[UploadImage (character)] →                         →  [AddSubtitles]
[TextAssistant (enhance)] → [GenerateImage (scene)] →  [MergeVideos]
```

### Lipsync best practices
- Use a clean, front-facing portrait with neutral expression for best results
- Lipsync works with both real photos and AI-generated character images
- After lipsync, add Subtitles for social media accessibility

---

## VIDEO COMPOSITION WORKFLOWS

### Merge Videos
Combine multiple clips sequentially:
```
[GenerateVideo (intro)] → MergeVideos
[GenerateVideo (product demo)] →
[GenerateVideo (outro)] →
         ↓
[Final combined video]
```

### Extract Video Frame
Use as a bridge between video and image workflows:
```
UploadVideo → ExtractVideoFrame → GenerateImage (reference)
                              → EditImage
```

---

## INTEGRATION NODES — Publishing Outputs

### Google Drive
Best practice for any workflow producing assets at scale:
```
Composer → RenameAsset → GoogleDrive (target folder)
```
Supports dynamic folder paths. Connect before ending any batch workflow.

### Meta Ads / TikTok / Instagram
Push creative outputs directly to ad libraries or social accounts:
```
Composer → MetaAds (campaign + ad set config)
         → TikTok (post settings)
```

**Rule:** Always add a Human Review node before any integration node that publishes externally.

---

## Advanced Workflow: Full Ad Production Pipeline

```
[TextPrompt: campaign brief]
[UploadImage: product photo]
[BrandContext]
[VisualReferences]
[BrandGuidelines]
        ↓
[TextAssistant: enhance prompt + write headline]
        ↓
[Split Text: separate image prompt from headline]
        ↓
         ├──[GenerateImage (background/lifestyle)] ──────────────────────┐
         ├──[Router → product] → [RemoveBackground] ───────────────────── [Composer]
         ├──[ListSelector (headline)] ──────────────────────────────────── [Composer]
         └──[UploadImage (logo)] ────────────────────────────────────────── [Composer]
                                                                               ↓
                                                                      [HumanReview]
                                                                               ↓
                                                                        [RenameAsset]
                                                                               ↓
                                                             [GoogleDrive] + [MetaAds]
```

---

## Summary: Which Advanced Node Do I Need?

| Goal | Use |
|---|---|
| Combine visual elements into final layout | Composer |
| Keep outputs on-brand visually | Visual References + Brand Guidelines |
| Keep copy/text on-brand | Brand Voice + Brand Context |
| Enhance a vague prompt | Text Assistant |
| Join two text inputs without LLM | Prompt Concatenator |
| Split one text into multiple items | Split Text |
| Add QA gate before publishing | Human Review |
| Route one output to multiple nodes | Router |
| Animate character or portrait to speak | Lipsync node + Generate Audio |
| Create video from multiple clips | Merge Videos |
| Export to ad platforms | MetaAds / TikTok integration nodes |
| Organized file export | Rename Asset + Google Drive |
