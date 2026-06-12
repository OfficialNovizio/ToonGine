---
name: production-pipeline
description: >-
  YVON Production Pipeline for Pixel. 5-stage pipeline: Generate plus QC plus Upscale plus Format plus Deliver. Batch management, platform export specs, and rejection handling.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [development, nextjs, typescript, architecture, vercel, api-routes, build, yvon]
---


# Production Pipeline

Pixel's 5-stage image production pipeline. Execute in order. Never skip a stage.

## Stage 1: Generate

**Input:** Approved prompt from Atlas's Prompt Architecture
**Process:** Run generation with model-specific parameters. Generate 4-8 variants per prompt.
**Output:** Raw image set with seed metadata

**Batch Table Entry:**

```
| Batch ID | Venture | Campaign | Prompt Count | Model | Date |
```

## Stage 2: QC

**Input:** Generated image set + Atlas's 3 Quality Criteria
**Process:** Evaluate each variant against Atlas's quality bar
**Output:** Pass list (images approved) / Reject list (images + reason)

**QC Checklist:**
- Face/hand quality: no AI artifacts (blur, extra fingers, warped features)
- Background consistency: matches Style Spec setting?
- Color harmony: aligns with brand palette?
- Composition rule followed: as specified in prompt?
- No unexpected elements: nothing in "Avoid" list present?

**If all variants fail:** Flag to Atlas with specific failure reasons. Do not proceed.

## Stage 3: Upscale

**Input:** QC-passed images at original resolution
**Process:** Apply AI upscaling to target resolution
**Output:** High-resolution images (see Platform Specs below)

**Rules:**
- Upscale before any other processing
- Check upscaled output at 100% to verify quality is acceptable
- If upscaling introduces artifacts: revert and try different upscale method

## Stage 4: Format

**Input:** Upscaled images
**Process:** Resize + compress per platform specs

**Platform Export Specs:**

| Platform | Format | Dimensions | Ratio | Max Size | Filename Pattern |
|----------|--------|------------|-------|----------|-----------------|
| Instagram Post | JPEG | 1080x1080 | 1:1 | less than 30MB | `{venture}_{campaign}_{seq}_ig.jpg` |
| Instagram Story/Reel | JPEG | 1080x1920 | 9:16 | less than 30MB | `{venture}_{campaign}_{seq}_igr.jpg` |
| LinkedIn Post | JPEG | 1200x627 | 1.91:1 | less than 8MB | `{venture}_{campaign}_{seq}_li.jpg` |
| TikTok Cover | JPEG | 1080x1920 | 9:16 | less than 287MB | `{venture}_{campaign}_{seq}_tt.jpg` |
| Website Hero | WebP | 1920x1080 | 16:9 | less than 500KB | `{venture}_{campaign}_{seq}_web.webp` |
| Product Photo | WebP | 1200x1200 | 1:1 | less than 1MB | `{venture}_{campaign}_{seq}_prod.webp` |

## Stage 5: Deliver

**Input:** Formatted, named files
**Process:** Deliver assets to the destination (Opus for scheduling, Lena for copy pairing, etc.)
**Output:** Delivery confirmation with file count and format summary

**Delivery Report:**

```
## Asset Delivery -- {Venture} -- {Campaign}
| Format | Count | Status |
|--------|-------|--------|

**Total:** [X] files
**Destination:** [Where delivered]
**Rejections:** [N] with reasons if any
**Feedback to Atlas:** [Prompt architecture revision notes if quality was low]
```

## Rejection Protocol

When images are rejected:
1. Log rejection reason with specific image reference
2. Categorize: prompt issue (Atlas's problem) vs model limitation (switch model) vs quality bar mismatch (clarify with Atlas)
3. If more than 20% rejection rate on a batch: Atlas must revise prompt architecture before next generation
4. Track rejection patterns: if "hands" appears 3+ times, add hand-specific guidance to all future prompts
