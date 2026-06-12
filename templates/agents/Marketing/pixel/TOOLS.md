# TOOLS.md — Pixel, Production Manager

## Memory (via /api/settings)
```
GET /api/settings?type=memory&agentId=pixel-production&ventureId=<activeVentureId>
POST /api/settings — keys: current_status, recent_tasks, production_log
```

## Venture Context
```
GET /api/venture?ventureId=<activeVentureId>
```

## Future Generation Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Midjourney MCP | Primary batch generation pipeline | Planned |
| DALL-E API (`/api/image-generate`) | Alternative / fallback generation | Planned |
| Replicate MCP | Upscaling pipeline (Real-ESRGAN) | Planned |
| Stable Diffusion MCP | Local generation for large batches | Planned |
