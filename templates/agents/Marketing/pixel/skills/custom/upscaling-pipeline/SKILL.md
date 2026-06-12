---
name: upscaling-pipeline
description: Image and video upscaling for YVON production. Covers tool selection, scale factors, quality thresholds, batch ordering (upscale while next batch generates), and when to reject post-upscale.
version: 1.0.0
---

## Purpose

Upscaling is not optional polish — it is a required production stage before delivery. AI-generated images at base resolution are rarely platform-ready. This skill makes upscaling systematic: right tool, right scale factor, right quality gate, right batch sequencing.

---

## Image Upscaling

### Scale Factor Guide

| Base resolution | Target platform | Scale factor | Output |
|----------------|----------------|-------------|--------|
| 512×512 | Any | 4× | 2048×2048 |
| 768×768 | Instagram Feed | 2× | 1536×1536 (crop to 1080×1080) |
| 1024×1024 | Instagram Feed | 2× | 2048×2048 (crop to 1080×1080) |
| 1024×1280 | Instagram 4:5 | 2× | 2048×2560 (crop to 1080×1350) |
| 512×912 | Stories / Reels | 4× | 2048×3648 (crop to 1080×1920) |

**Rule:** Always upscale to at least 2× the final delivery resolution before cropping. Never upscale directly to exact delivery dimensions — leave headroom for crop adjustments.

---

### Tool Selection

| Tool | Best for | Avoid when |
|------|----------|-----------|
| Real-ESRGAN (4× General) | Photorealistic images, lifestyle, editorial | Flat design or illustration |
| Real-ESRGAN (4× Anime) | Illustration, graphic style | Realistic photography |
| Topaz Gigapixel AI | Maximum quality, final hero images | Quick batch runs (slow) |
| Stable Diffusion img2img (upscale) | Adding detail at upscale stage | When prompt fidelity must be preserved exactly |
| Lanczos (software) | Emergency / no tool available | Never for hero images |

**Default for YVON production:** Real-ESRGAN 4× General for Novizio lifestyle/editorial. Real-ESRGAN 4× General for Hourbour people-with-devices.

---

### Quality Gate — Post-Upscale Check

Run these checks after upscaling before formatting:

| Check | Pass | Fail → Action |
|-------|------|--------------|
| Detail integrity | Fine details (fabric texture, hair, UI elements) are sharper, not smeared | Re-upscale with different tool |
| No hallucinated detail | Upscaler has not invented new elements not in original | Reject — return to generation |
| No over-sharpening | Edges look natural, no halo artefacts | Reduce sharpening setting, re-run |
| Face quality | Face detail is improved, not degraded | Run face-enhance pass separately |
| Text clarity | Any intentional text is more legible, not distorted | Run text-focused upscale or reject |

**Rule:** If an image passes QC before upscaling but fails post-upscale, do not deliver the pre-upscale version. Fix the upscaling. The base image passes; only the upscale technique failed.

---

## Video Upscaling

Video upscaling is slower and riskier than image upscaling. Approach with more caution.

### When to upscale video

| Condition | Action |
|-----------|--------|
| Output is < 1080p and platform requires 1080p | Upscale required |
| Output is 1080p and platform requires 1080p | No upscale needed |
| Output has visible compression artifacts | Re-generate at higher quality setting instead of upscaling |

**Rule:** Re-generation beats upscaling for video quality issues. Only upscale when re-generation is not feasible (budget, time).

### Video upscale tools

| Tool | Use case |
|------|---------|
| Topaz Video AI | Primary tool — frame interpolation + upscale |
| Real-ESRGAN (video mode) | Faster, lower quality than Topaz |

**Default settings (Topaz Video AI):**
- Model: Proteus (for realistic content) / Iris (for faces)
- Enhancement: 2× scale
- Frame rate: match original (do not change frame rate at upscale stage)

### Post-upscale video check

| Check | Pass | Fail |
|-------|------|------|
| Motion smoothness | Motion unchanged or improved | Motion blur or ghosting introduced |
| Face stability | Face detail improved | Face flickering or morphing introduced by upscaler |
| Edge detail | Subject edges sharper | Halo or ringing around edges |

---

## Batch Sequencing — Parallel Staging

Pixel runs overlapping stages to maximize throughput:

```
[Batch A: Generate] → [Batch A: QC] → [Batch A: Upscale] → [Batch A: Format] → [Deliver]
                                ↓
                      [Batch B: Generate] → [Batch B: QC] → [Batch B: Upscale] → ...
```

**Rule:** Start Batch B generation while Batch A is upscaling. Never wait for full delivery of Batch A before starting Batch B. The bottleneck is upscaling (slowest stage) — parallel staging keeps the pipeline moving.

**Exception:** Do not start Batch B if Batch A's QC pass rate is < 60%. Investigate prompt before spending more generation budget.

---

## Upscaling Log Format

After every upscaling run, append to MEMORY.md:

```
[date] — [venture] — [campaign] — [tool used] — [scale factor] — [pass rate post-upscale] — [notes]
```

If a tool consistently degrades a specific type of image (e.g., Real-ESRGAN smearing fabric texture), log it and update the tool selection guide in this skill.
