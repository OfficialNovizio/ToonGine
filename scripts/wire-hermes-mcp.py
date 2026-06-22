#!/usr/bin/env python3
"""
Auto-wire ToonGine MCP bridge into ~/.hermes/config.yaml
Called by `npx toongine init` and `npx toongine hermes connect`.
"""
import sys, os, yaml, json
from pathlib import Path

HERMES_HOME = Path.home() / '.hermes'
CONFIG_PATH = HERMES_HOME / 'config.yaml'

TOONGINE_MCP = {
    'toongine': {
        'type': 'stdio',
        'command': 'python3',
        'args': [],  # filled dynamically with project path
    }
}

TOONGINE_PERMS = [
    'mcp__toongine__toon_graph_explore',
    'mcp__toongine__toon_graph_callers',
    'mcp__toongine__toon_graph_impact',
    'mcp__toongine__toon_graph_search',
    'mcp__toongine__toon_graph_status',
]


def wire(project_root: str) -> bool:
    """Add toongine MCP server + permissions to Hermes config. Returns True if written."""
    mcp_server_path = os.path.join(project_root, '.toon', 'hermes', 'mcp-server.py')

    if not os.path.exists(mcp_server_path):
        print(f'  ⚠️  mcp-server.py not found at {mcp_server_path} — skipping')
        return False

    # Load existing config or create empty one
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            config = yaml.safe_load(f) or {}
    else:
        HERMES_HOME.mkdir(parents=True, exist_ok=True)
        config = {}

    # Ensure mcpServers section exists
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
    mcp = config['mcpServers']

    # Add toongine MCP server with absolute path
    mcp['toongine'] = {
        'type': 'stdio',
        'command': 'python3',
        'args': [mcp_server_path, project_root],
    }

    # Ensure permissions section exists
    if 'permissions' not in config:
        config['permissions'] = {}
    if 'allow' not in config['permissions']:
        config['permissions']['allow'] = []
    existing_perms = set(config['permissions']['allow'])

    # Add toongine tool permissions
    added = 0
    for perm in TOONGINE_PERMS:
        if perm not in existing_perms:
            existing_perms.add(perm)
            added += 1
    config['permissions']['allow'] = sorted(existing_perms)

    # Write back, preserving existing formatting
    with open(CONFIG_PATH, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    print(f'  ✅ ToonGine MCP auto-wired → ~/.hermes/config.yaml')
    print(f'     Tools: {len(TOONGINE_PERMS)} ({added} new permissions)')
    return True


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: wire-hermes-mcp.py <project-root>', file=sys.stderr)
        sys.exit(1)

    project_root = os.path.abspath(sys.argv[1])
    try:
        wire(project_root)
    except Exception as e:
        print(f'  ⚠️  Hermes MCP wiring failed: {e}', file=sys.stderr)
        sys.exit(1)
