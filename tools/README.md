# ToonGine — Tools Reference

Each tool can be run via the TOONGINE CLI or directly from this directory.

## CLI Commands (recommended)

```bash
npx toongine doctor         # Full health check
npx toongine integrate      # Wire engine into project (safe, non-destructive)
npx toongine graph          # Rebuild knowledge graphs
npx toongine init           # Initialize new project structure
npx toongine dashboard      # Open live dashboard (port 4200)
```

## Bash Tools (direct execution)

| Tool | Purpose | When to use |
|------|---------|-------------|
| `toongine-doctor` | Full health check: engine, .toon/, v3, schemas, graphs, CIE wiring, build | Any time you want to verify system health |
| `toongine-graph` | Detect graph tools → run them → absorb output into `.toon/graphs/` | After `npm update graphify` or new code |
| `toongine-absorb` | Safe migration: compress originals → `.toon/`, archive originals | When ready to switch to `.toon/` as source of truth |
| `toongine-rollback` | Restore originals from `.toon/.archive/<timestamp>/` | If absorption caused issues |
| `toongine-sync` | Bidirectional sync: keep originals ↔ `.toon/` in sync | During development when both sources are needed |
| `toongine-clean` | Remove empty dirs, deduplicate agent folders, rebuild engine.bin | Periodic maintenance |
| `toongine-reindex` | Recompile `.toon/v3/engine.bin` from current `.toon/` tree | After syncing new content |

## Common Workflows

### Fresh install
```bash
npm install toongine          # auto-runs postinstall (integrate + init)
npx toongine doctor                  # verify
bash tools/toongine-graph            # build graphs
bash tools/toongine-sync --once      # initial sync
```

### Update graph tools
```bash
npm update graphify
pip install --upgrade code-review-graph
bash tools/toongine-graph --rebuild
bash tools/toongine-reindex
```

### Migrate to .toon/ as source of truth
```bash
bash tools/toongine-absorb --dry-run  # preview
bash tools/toongine-absorb             # apply
npm run build                      # verify
bash tools/toongine-doctor             # health check
```

### Rollback migration
```bash
bash tools/toongine-rollback           # list available snapshots
bash tools/toongine-rollback 2026-06-12_143000  # restore specific snapshot
npm run build                      # verify
```

### Development (keep both in sync)
```bash
bash tools/toongine-sync --watch &     # auto-sync originals → .toon/ every 30s
npm run dev                        # develop normally
# ... make changes to agent-department/ docs/ etc ...
# sync keeps .toon/ updated automatically
```
