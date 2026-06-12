---
name: pletor-node-basics
description: >-
  Core knowledge for building Pletor workflows. Use this skill whenever the user wants to create, design, or describe a Pletor workflow — even partially. Covers node categories, how nodes connect, data flow, workflow logic, and prompt structure best practices. Trigger this skill any time you see words like "Pletor workflow", "agent", "canvas", "nodes", "build a workflow", "automate creative", or when the user describes a creative output goal and you need to translate it into a node chain.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [coo, operations, workflow, planning, sprint, milestones, process, automation]
---

# Pletor Node Basics

Pletor is a no-code workflow builder for AI-powered visual marketing. Workflows are built
by connecting **nodes** on a canvas. Data flows **left → right** from inputs through
processing to outputs.

---

## Node Categories

### 1. Provide Context (Inputs & Brand)

These nodes feed information into the workflow. They have no AI processing.

| Node | What it does |
|------|-------------|
| **Text Prompt** | User-typed instruction (the creative brief) |
| **Upload Image** | Static or user-uploaded image reference |
| **Upload Video / Audio / File** | Other media or document inputs |
| **Brand Context** | Company name, positioning, audience |
| **Visual References** | Reference images that anchor the visual style |
| **Brand Guidelines** | Creative do's/don'ts, colors, layout rules |
| **Brand Voice** | Writing samples and tone-of-voice examples |
| **Brand Docs** | Full brand books as PDF/CSV/JSON/TXT |

> **Best practice:** Always add Brand Context + Visual References for brand-safe output.
> Layer multiple brand nodes — each adds a different dimension of consistency.

---

### 2. Use AI (Generation & Text)

These nodes run AI models. They are the creative engines.

| Node | What it does |
|------|-------------|
| **Generate Image** | Text-to-image or image-to-image |
| **Edit Image** | Modify an existing image with text instructions |
| **Generate Video** | Text-to-video or image-to-video |
| **Generate Lipsync** | Animate a portrait/video character to speak audio |
| **Generate Audio** | Voice or sound design generation |
| **Text Assistant** | Pre-built LLM expert (prompt enhancer, copy writer, analyzer) |
| **Generate Text** | Raw LLM with custom instructions |
| **Upscale Image / Video** | Resolution enhancement post-generation |
| **Remove Background** | Strip image/video background to transparent |
| **Edit Video** | Modify video content with text instructions |
| **Extract Video Frame** | Pull a still frame from video (useful as image input) |

---

### 3. Automate (Logic & Integration)

These nodes control flow, combine data, and connect to external services.

| Node | What it does |
|------|-------------|
| **Composer** | Layer images, text, logos into a final composed visual or video |
| **Prompt Concatenator** | Mechanically join multiple text inputs into one prompt |
| **Split Text** | Break text into parts by delimiter |
| **List Selector** | Pick one item from a list by index |
| **Human Review** | Pause workflow for manual approval before continuing |
| **Router** | Reuse one node's output in multiple downstream nodes |
| **Rename Asset** | Set custom filenames (supports dynamic naming patterns) |
| **Merge Videos** | Combine multiple video clips into one |
| **Google Drive** | Pull assets in or push outputs out |
| **Meta / TikTok / Instagram** | Publish directly to ad platforms |

---

## Workflow Logic Patterns

### The Golden Rule
**Always put a Text Assistant between user input and generation nodes.**

Raw user prompts are rarely optimal for AI models. A Text Assistant enhances, combines,
and structures the prompt before it reaches the generator — this dramatically improves
output quality and consistency.

### Core Patterns

**Pattern 1 — Simple Generation**
```
Text Prompt → [Text Assistant: Enhance Prompt] → Generate Image → Upscale Image
```

**Pattern 2 — Brand-safe Image**
```
Text Prompt ───┐
Brand Context ─┼─ Text Assistant → Generate Image
Visual Refs ───┘
```

**Pattern 3 — Image-to-Video (recommended over text-to-video)**
```
Upload Image → [Text Assistant] → Generate Image → Generate Video
```
Generate a still image first for far more control over the final video.

**Pattern 4 — Product Shot with Custom Background**
```
Upload Image → Generate Image → Remove Background → Composer
```

**Pattern 5 — Ad Creative with Localization**
```
Text Prompt ───┐
Brand Nodes ───┼─ Text Assistant → Generate Image → Composer
Logo Upload ───┘
                   → Localization Text Assistant ───→ Text Prompt (language)
```

**Pattern 6 — Lipsync Talking Character**
```
Upload Image/Video → Generate Lipsync (+ audio input or text-to-speech)
```

---

## Prompt Structure Best Practices

When writing instructions for **Text Assistant** or **Generate Text** nodes, structure prompts clearly:

### For Image Generation Prompts
```
[Subject/Character] → [Action/Pose] → [Setting/Background] → [Style/Mood] →
[Lighting] → [Camera/Composition] → [Brand/Color cues]
```
Example:
> "A confident woman in her 30s holding a coffee cup, seated in a modern co-working
> space, warm natural light from the left, editorial lifestyle photography,
> Leica 35mm aesthetic, brand palette: off-white and forest green"

### For Text Assistant Instructions
Be explicit about:
1. **Role**: "You are a creative director specializing in luxury brand photography."
2. **Task**: "Enhance the user's raw prompt into a detailed image generation prompt."
3. **Format**: "Return only the final prompt, no explanation."
4. **Constraints**: "Always include the brand color palette: [colors]. Never include human faces."

### For Video Generation Prompts
```
[Subject] → [Motion/Action description] → [Camera movement] → [Duration/Pace] → [Style]
```
Key: describe motion explicitly. Video models respond to verbs.
Example:
> "A bottle of perfume rotating slowly on a marble surface, camera gently pushes in,
> soft diffused studio lighting, cinematic, 5-second loop"

---

## Building Approach

Choose one of two strategies:

- **Input-led**: Start with what you have (product image, brief) → add transformation nodes forward
- **Output-led**: Start with the desired output (Instagram ad) → pick the right AI node → work backwards to define inputs

Start simple (2–3 nodes), test, then add complexity. Test individual nodes in isolation before running the full chain.

---

## Workflow Description Format

When describing a workflow to a user, always output:

1. **Goal**: one sentence describing what the workflow produces
2. **Node Chain**: step-by-step list with node type and its role
3. **Key Configuration Notes**: any critical settings, model choices, or prompt tips
4. **Optional Enhancements**: nodes to add for more power (brand nodes, human review, etc.)

See `skills/workflow/model-selection/SKILL.md` (Atlas) for model choices, and `skills/workflow/advanced-nodes/SKILL.md` (Pixel) for Composer, Logic nodes, and integration nodes in depth.
