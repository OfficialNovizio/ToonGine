---
name: video-production
description: Pixel's video batch management for Kling and Runway. Covers video QC criteria (motion stability, subject consistency, no flickering), platform format specs, batch sizing, and delivery format. Load when running any video generation batch.
version: 1.0.0
---

## Purpose

Video generation has different failure modes, different platform specs, and different delivery requirements than image production. This skill separates video production from image production so Pixel can run video batches with the same systematic discipline as image batches.

---

## Supported Tools

| Tool | Best for | YVON use case |
|------|----------|---------------|
| Kling 3.0 | High-quality social video, product motion, lifestyle | Novizio Instagram Reels, TikTok |
| Runway Gen-3 | Fast iteration, creative motion, transitions | Both ventures, short-form testing |

**Prompt format for Kling:** Load `../../../atlas/skills/prompt-systems/kling-3-prompter/SKILL.md` — Atlas writes the prompt, Pixel executes.

---

## Video QC Criteria

### Criterion 1 — Motion Stability

| Check | Pass | Fail |
|-------|------|------|
| Subject movement | Smooth, continuous, natural | Jitter, stutter, teleporting |
| Camera movement | Consistent direction if specified | Random drift or jump cut |
| Background stability | Static or consistent motion | Background morphing or flickering |

**Common failure cause:** Too many motion descriptors in the prompt (e.g., `slow zoom + pan left + subject walking`). Reduce to one motion instruction.

---

### Criterion 2 — Subject Consistency

| Check | Pass | Fail |
|-------|------|------|
| Face stability | Same face throughout clip | Face morphing mid-clip |
| Proportion stability | Subject proportions consistent frame to frame | Limbs or body changing size |
| Clothing consistency | Clothing details stay consistent | Pattern or colour shifting |

**Common failure cause:** Long duration clips (>5 seconds) with complex subjects. Shorten the clip or simplify the subject.

---

### Criterion 3 — Lighting and Colour Consistency

| Check | Pass | Fail |
|-------|------|------|
| Light source | Single consistent light source throughout | Shadow direction changing mid-clip |
| Colour temperature | Consistent warm/cool throughout | Visible colour shift between frames |
| Exposure | No sudden brightness jumps | Flickering brightness |

---

### Criterion 4 — Brand Compliance (Venture-Specific)

**Novizio:**
- No promotional text appearing in video (even for one frame)
- No flat, catalogue-style lighting — must be directional
- Motion must feel editorial, not commercial (avoid fast cuts or hype energy)

**Hourbour:**
- No money imagery appearing in any frame
- Device UI must be legible if shown — blurry or generic UI is a reject
- Tone must be calm and purposeful — avoid urgent or hype motion styles

---

## Batch Sizing — Video

| Batch size | When to use | Approval required |
|-----------|------------|------------------|
| 3–5 clips | Style test, new direction validation | Atlas approval |
| 10–15 clips | Campaign content run | Atlas approval |
| 20+ clips | Full content library | Stark approval |

**Rule:** Always run a 3-clip test batch before committing to a full video run. Video generation is significantly more expensive than image generation — waste is higher.

---

## Platform Format Specs

| Platform | Venture | Ratio | Resolution | Max duration |
|---------|---------|-------|-----------|-------------|
| Instagram Reels | Novizio | 9:16 | 1080×1920 | 90 sec (keep ≤ 30s for best reach) |
| TikTok | Novizio | 9:16 | 1080×1920 | 60 sec (keep ≤ 15s for best reach) |
| Instagram Feed (video) | Novizio | 4:5 or 1:1 | 1080×1350 / 1080×1080 | 60 sec |
| LinkedIn | Hourbour | 16:9 or 1:1 | 1920×1080 / 1080×1080 | 30 sec optimal |
| YouTube Shorts | Hourbour | 9:16 | 1080×1920 | 60 sec |

**File format:** MP4, H.264, AAC audio if applicable.
**Frame rate:** 24fps for editorial/Novizio feel; 30fps for clean/Hourbour feel.

---

## Video Production Pipeline

```
Stage 1: BRIEF CONFIRM   — Atlas's video prompt received, platform spec confirmed
Stage 2: TEST BATCH      — Generate 3 clips, run full QC criteria
Stage 3: REVIEW          — Pass all 4 criteria? Proceed. Fail? Apply prompt-variation-engine
Stage 4: FULL BATCH      — Approved style generates full run
Stage 5: FORMAT          — Export at platform spec (ratio, resolution, frame rate, file format)
Stage 6: DELIVER         — Named files ready for Stark review
```

**Never skip Stage 2.** A failed full batch wastes 5–10× more generation time than a failed test batch.

---

## Video Delivery Format

File naming for video:
```
[venture]-[campaign]-[platform]-[clip##]-[ratio].[ext]

Examples:
novizio-summer26-reels-clip01-9x16.mp4
hourbour-launch-linkedin-clip01-16x9.mp4
```

Delivery folder structure:
```
[venture]/[campaign]/video/
  raw/          ← unedited generation output (keep for 14 days)
  qc-pass/      ← passed QC, not yet formatted
  formatted/    ← platform-ready, named correctly
  rejected/     ← logged rejection reason in filename: clip01-REJECT-flickering.mp4
```
