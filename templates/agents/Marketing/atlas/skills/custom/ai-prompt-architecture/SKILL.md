---
name: ai-prompt-architecture
description: >-
  AI Image Prompt Architecture for Pixel. Model-specific parameter optimization, consistency across batches, seed management, rejection pattern analysis.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [development, nextjs, typescript, architecture, vercel, api-routes, build, yvon]
---


# AI Prompt Architecture

Technical framework for generating consistent, high-quality image batches across AI models.

## Prompt Structure Template

Build every prompt from these components in order:

[Subject], [Setting], [Lighting]. [Style descriptor], [Composition]. [Mood adjectives]

### Component Guidelines

- Subject: Who/what is the focus. "A woman in a cream linen blazer"
- Setting: Environment, background. "standing against a textured plaster wall"
- Lighting: Light quality and direction. "soft north-facing morning light"
- Style: Genre, visual tradition. "editorial fashion photography"
- Composition: Framing, camera angle. "medium shot, rule of thirds"
- Mood: Emotional tone. "effortless, quiet confidence"

## Model-Specific Parameters

### Midjourney

- `--ar` for aspect ratio (1:1, 16:9, 9:16)
- `--style raw` for less AI interpretation
- `--s 100-250` for less stylization (tighter to prompt)
- `--v 6` for latest model version

### DALL-E

- Include style keywords directly in the prompt
- Specify "photorealistic" for photo-like output
- Use "no text, no watermark" in negative guidance

### Krea / Flux

- Use clear subject descriptions
- Add camera/lens terms for photographic quality
- Specify lighting conditions for mood control

## Seed Management for Batch Consistency

- Same seed produces similar composition
- Different seed, same prompt: tests model variation range
- Lock seed for variations of a single concept (change one component, keep seed)
- Document every seed: record seed, output quality, usable yes/no

**Seed Log Format:**

```
Batch: {id} | Model: {name} | Prompts: {n}
Seed -> Quality -> Verdict
1234567 -> Sharp, natural -> PASS
2345678 -> Slight artifact on hand -> FAIL
3456789 -> Background too busy -> FAIL
```

## Consistency Across Batches

1. **Style anchor**: Include the same style phrase in every prompt ("editorial minimalism, natural lighting, clean backgrounds")
2. **Color lock**: Specify exact colors ("warm cream tones, sage green accent, charcoal shadows")
3. **Reference image**: When possible, use image prompting with a brand-coherent reference
4. **Avoid list**: Lock the avoid list across all prompts for a venture

## Rejection Pattern Analysis

Track which prompt elements correlate with low-quality outputs:

- If specific hand poses fail repeatedly (>30% rejection rate), avoid hands in prompts; crop or reframe
- If complex backgrounds fail (>25%), simplify background description
- If multiple subjects fail (>40%), generate single subject, composite later
- If specific text in image fails (>60%), add text in post-production, not generation

Update the Style Spec based on rejection data. If a pattern exceeds 25% rejection rate, it should be added to the Avoid list.

## Novizio Prompt Guidelines

- Style terms: editorial, fashion photography, natural light, textured
- Colors: warm neutrals, muted tones, brand palette accents
- Mood: confident, effortless, editorial
- Lighting: soft, natural, directional

## Hourbour Prompt Guidelines

- Style terms: clean, modern, tech-forward, professional
- Colors: white space, brand palette, light backgrounds
- Mood: trustworthy, confident, approachable
- Lighting: bright, clean, evenly lit
