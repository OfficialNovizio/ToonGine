---
name: asset-delivery
description: File naming conventions, folder structure, file size limits, and delivery checklist for every YVON asset. Covers images and video. Version control for Atlas revision cycles. Load before organizing or delivering any batch.
version: 1.0.0
---

## Purpose

An asset Stark cannot find is an asset that doesn't exist. An asset with the wrong name is an asset that will be used in the wrong context. This skill makes delivery consistent so every file is immediately usable without asking Pixel what it is.

---

## File Naming Convention

### Standard format

```
[venture]-[campaign-slug]-[platform]-[##].[ext]
```

**Examples:**
```
novizio-summer26-feed-01.jpg
novizio-summer26-feed-02.jpg
novizio-summer26-stories-01.jpg
hourbour-launch-linkedin-01.jpg
hourbour-launch-yt-thumb-01.jpg
```

### Rules

| Rule | Detail |
|------|--------|
| All lowercase | No capitals, no spaces |
| Hyphens only | No underscores, no dots in the name segment |
| Two-digit numbering | `01`, `02` — not `1`, `2` |
| Campaign slug | Short, recognizable, consistent across the batch (e.g., `summer26`, `launch`, `brand-awareness`) |
| Platform code | See platform code reference below |
| Extension | `.jpg` for images (not `.jpeg`), `.mp4` for video |

### Platform codes

| Platform | Code |
|---------|------|
| Instagram Feed | `feed` |
| Instagram Stories | `stories` |
| Instagram Reels | `reels` |
| TikTok | `tiktok` |
| LinkedIn Post | `linkedin` |
| YouTube Thumbnail | `yt-thumb` |
| YouTube Shorts | `yt-shorts` |
| Multi-use / no specific platform | `multi` |

### Version control — when Atlas requests revision

Append `-v2`, `-v3` to the base name, not the number:

```
novizio-summer26-feed-v2-01.jpg   ← v2 revision of the full batch
novizio-summer26-feed-v2-02.jpg
```

Never overwrite v1 files. Keep all versions until Stark confirms which version is used.

---

## Folder Structure

Every delivery is organized by venture → campaign → platform:

```
[venture]/
  [campaign-slug]/
    images/
      feed/
      stories/
      multi/
    video/
      reels/
      tiktok/
      linkedin/
    raw/              ← original generation output (keep 14 days, then archive)
    rejected/         ← failed QC, named with rejection reason
    upscaled/         ← post-upscale, pre-format (intermediate stage)
```

**Examples:**
```
novizio/
  summer26/
    images/
      feed/
        novizio-summer26-feed-01.jpg
        novizio-summer26-feed-02.jpg
      stories/
        novizio-summer26-stories-01.jpg
    video/
      reels/
        novizio-summer26-reels-clip01-9x16.mp4
```

---

## File Size Limits — Platform Specs

### Images

| Platform | Max file size | Format | Notes |
|---------|--------------|--------|-------|
| Instagram Feed | 8 MB | JPG or PNG | Keep under 3 MB for fast load |
| Instagram Stories | 30 MB | JPG or PNG | |
| TikTok (cover image) | 10 MB | JPG | |
| LinkedIn Post | 5 MB | JPG or PNG | |
| YouTube Thumbnail | 2 MB | JPG or PNG | |

**Default export:** JPG at 85% quality. If file size is over limit after 85% → reduce to 80%. Never below 75% — visible quality loss.

### Video

| Platform | Max file size | Format | Frame rate |
|---------|--------------|--------|-----------|
| Instagram Reels | 4 GB | MP4 | 24–30 fps |
| TikTok | 287.6 MB (< 1 min) | MP4 | 24–30 fps |
| LinkedIn Video | 5 GB | MP4 | 24–30 fps |
| YouTube Shorts | 256 MB | MP4 | 24–30 fps |

---

## Delivery Checklist

Run before handing off any batch to Stark:

```
[ ] All files named per convention: [venture]-[campaign]-[platform]-[##].[ext]
[ ] Folder structure created and files in correct subfolders
[ ] File sizes checked against platform limits
[ ] All images exported at correct dimensions for target platform
[ ] All video files exported at correct ratio and resolution
[ ] QC pass rate ≥ 80% — if not, flagged to Atlas before delivery
[ ] Rejected files in /rejected/ with rejection reason in filename
[ ] Version is clear — v1 if first delivery, v2+ if revision
[ ] Delivery note sent to Stark with: batch name, image count, video count, platform breakdown
```

---

## Delivery Note Format

Send to Stark at every delivery:

```
Delivery: [venture] — [campaign] — [date]

Content:
- Images: [N] ([platform breakdown: N feed, N stories, N multi])
- Video: [N] ([platform breakdown: N reels, N tiktok])

QC summary:
- Pass rate: [%]
- Rejections: [N] — [reason if notable]

Location: [folder path]

Notes: [anything Stark should know — variation attempted, Atlas flag sent if applicable]
```
