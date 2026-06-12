---
name: pletor-model-selection
description: >-
  Use this skill whenever you need to recommend or assign a model to a Pletor node. Covers image models, video models, lipsync, audio, upscaling, and text LLMs. Always load this skill before setting the "model" field on any AI node in a workflow.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [art-direction, visual, mood-board, creative, brand-identity, image-prompt, workflow, process]
---

# Pletor — How to Choose Models

## Decision Framework

Ask three questions before picking a model:
1. **What is the output type?** (image / video / audio / text)
2. **What is the primary use case?** (product shot / social ad / animation / character / editorial…)
3. **What constraints apply?** (speed needed / budget / need style control / need text in image / need brand consistency…)

---

## IMAGE MODELS

### Go-to models — cover 80% of cases
Start here. These work for product shots, static ads, on-brand assets, character visuals, social media posts.

| Model | Best for | Notes |
|---|---|---|
| **Nano Banana 2** | Fast, versatile generation | Default first choice for most image tasks |
| **Nano Banana Pro** | On-brand assets needing quality bump | Use when Nano Banana 2 needs more fidelity |
| **Seedream 5.0 Lite** | Fast iteration, broad use cases | Good balance of speed and quality |
| **Seedream 4.5** | Quality product & lifestyle shots | Step up from 5.0 Lite for final outputs |

### Specialist models — use when go-to models fall short

| Need | Model(s) |
|---|---|
| Editorial / inspiration aesthetic | Recraft v4, Higgsfield Soul, Reve |
| On-brand with style control via prompt | Recraft v4 |
| On-brand with style control via reference images | Ideogram v3, Reve |
| Consistent brand style across assets | Flux 2, GPT Image 1.5 |
| Character & mascot visuals | Ideogram Character, GPT Image 1.5 |
| Fast visual iterations (speed > quality) | Grok Imagine Image, Flux 2 Klein, Nano Banana |
| Vector / layout-ready output | Recraft v4 |
| Social media post assembly | Any image model + Composer node |
| Text-in-image (accurate typography) | GPT Image 1.5, Ideogram v3 |
| Custom fine-tuned brand model | Contact Pletor team |

### Image model decision tree

```
Need an image?
  ↓
Start with Nano Banana 2
  ↓
Output not good enough?
  ├─ Need editorial/inspiration look → Recraft v4, Higgsfield Soul, or Reve
  ├─ Need consistent characters/mascots → Ideogram Character or GPT Image 1.5
  ├─ Need text inside the image → GPT Image 1.5 or Ideogram v3
  ├─ Need vector output → Recraft v4
  ├─ Need fast iterations → Grok Imagine Image or Flux 2 Klein
  └─ Need style reference control → Ideogram v3 or Reve
```

---

## VIDEO MODELS

### Go-to models — cover 80% of cases
Works for product videos, cinematic videos, animated illustrations from reference images.

| Model | Best for |
|---|---|
| **Kling 3.0** | Most versatile; quality product/cinematic video from image |
| **Veo 3.1** (Google) | High-quality cinematic video; good motion quality |
| **Seedance 1.5 Pro** | Reliable, cost-effective; broad use cases |

### Specialist models

| Need | Model(s) |
|---|---|
| Budget-friendly / high volume | Kling 2.6, Seedance 1.5 Pro, Grok Imagine Video |
| Lipsync / talking characters | Kling 3.0, Veed Fabric, Hedra Character 3 |
| Start frame + end frame control | Kling 2.5 Pro, Seedance Pro |
| Long videos (>10 seconds), UGC | Sora 2, Veed Fabric 1.0 |
| Animated illustrations | Kling 2.5, Seedance Pro, Hailuo 2.3, Grok Imagine |
| Stop-scrolling / high-impact creative | Sora 2 |
| Video editing (modify existing video) | Kling O3/O1 |
| Motion graphics | ⚠️ Not yet supported well by any model |

### Video workflow rule
> **Always prefer image-to-video over text-to-video.**
> Generate a still image first (Generate Image node), then animate it (Generate Video node).
> You get significantly more control over the visual output.

### Video model decision tree

```
Need a video?
  ↓
Do you have a reference image?
  ├─ YES → Generate Image first if needed → Kling 3.0 (default) or Veo 3.1
  └─ NO (text-to-video) → Kling 3.0 or Veo 3.1

Special case?
  ├─ Talking character / lipsync → Kling 3.0 + Lipsync node, or Hedra Character 3
  ├─ Long UGC content → Sora 2 or Veed Fabric 1.0
  ├─ Animated illustration → Kling 2.5 or Hailuo 2.3
  ├─ High volume / budget-sensitive → Kling 2.6 or Seedance 1.5 Pro
  └─ Edit existing footage → Kling O3/O1
```

---

## LIPSYNC MODELS

| Model | Use |
|---|---|
| **Veed Fabric 1.0** | Most popular. Works with video or still image — talking character |
| **Hedra Character 3** | Strong for portrait-to-character animation |
| **Kling 3.0** (via Lipsync node) | Integrated lipsync in Kling's video generation |

**Lipsync works with both video and still images** — you can animate a static portrait photo into a speaking character.

---

## AUDIO MODELS

Use the Generate Audio node for:
- Voiceover / narration from script
- Sound design

Pletor curates audio models in the Audio Models library — select based on language, voice style, and tone needed.

---

## UPSCALING MODELS

Pletor provides dedicated upscaling models for both images and video.

**When to upscale:**
- Add Upscale Image after any Generate Image node in a final production pipeline
- Add Upscale Video when resolution matters for the distribution format

Upscaling is almost always the last node in an image or video chain before output.

---

## TEXT MODELS (LLMs for Text Assistants)

Text Assistant nodes run LLMs for:
- Prompt enhancement
- Copy generation (headlines, CTAs, ad copy)
- Translation / localization
- Multi-input processing (combine user prompt + brand context)

Pletor's text model library is in the Text Models section. For most use cases, the default model is appropriate. Upgrade to a more powerful model if you need complex reasoning or long-form output.

---

## Model Selection Quick-Reference Card

| Task | Recommended |
|---|---|
| Product shot, static ad | Nano Banana 2 |
| On-brand lifestyle image | Nano Banana Pro or Seedream 4.5 |
| Editorial / fashion aesthetic | Recraft v4 or Higgsfield Soul |
| Text in image | GPT Image 1.5 or Ideogram v3 |
| Character / mascot | Ideogram Character |
| Fast prototyping | Grok Imagine Image or Nano Banana |
| Product video from photo | Kling 3.0 |
| Cinematic video | Veo 3.1 |
| Animated illustration | Kling 2.5 or Hailuo 2.3 |
| Talking character / lipsync | Kling 3.0 + Lipsync, or Veed Fabric |
| Long UGC video | Sora 2 |
| High volume video | Seedance 1.5 Pro or Kling 2.6 |
| Edit existing video | Kling O3/O1 |
