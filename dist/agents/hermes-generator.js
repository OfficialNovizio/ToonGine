"use strict";
// src/agents/hermes-generator.ts — Manifest → Hermes Skill Generator
// Reads all agent manifests, generates Hermes skill files
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHermesSkills = generateHermesSkills;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const registry_1 = require("./registry");
function generateHermesSkills(projectRoot) {
    const registry = (0, registry_1.loadRegistry)(projectRoot);
    const results = [];
    const hermesDir = path.join(os.homedir(), '.hermes', 'profiles', 'yvon', 'skills', 'yvon');
    if (!fs.existsSync(hermesDir)) {
        fs.mkdirSync(hermesDir, { recursive: true });
    }
    for (const agent of registry.agents) {
        try {
            const skillContent = generateSkillFile(agent, projectRoot);
            const skillPath = path.join(hermesDir, `${agent.agent.id}.md`);
            fs.writeFileSync(skillPath, skillContent, 'utf-8');
            results.push({
                agentId: agent.agent.id,
                skillPath,
                written: true,
            });
        }
        catch (e) {
            results.push({
                agentId: agent.agent.id,
                skillPath: '',
                written: false,
                error: e.message,
            });
        }
    }
    return results;
}
function generateSkillFile(agent, projectRoot) {
    const purpose = agent.purpose.join('. ');
    const skills = agent.skills.slice(0, 8).join(', ');
    const tools = agent.tools.join(', ');
    // Try to load AGENT.md for personality
    let personality = '';
    const agentMd = path.join(projectRoot, '.toon', 'agents', agent.agent.department, agent.agent.name.toLowerCase(), 'AGENT.md');
    const altAgentMd = path.join(projectRoot, '.toon', 'agents', agent.agent.department, agent.agent.name, 'AGENT.md');
    for (const p of [agentMd, altAgentMd]) {
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf-8');
            const match = content.match(/## Personality[^#]+/i);
            if (match) {
                personality = match[0].replace(/^## Personality[^\n]*\n/i, '').trim().slice(0, 500);
            }
            break;
        }
    }
    const levelAccess = agent.agent.level === 1
        ? 'FULL access — all tools. Can delegate tasks, create cron jobs, modify memory.'
        : agent.agent.level === 2
            ? 'Intelligence access — read memory, request research, validate decisions. Cannot delegate or create cron jobs.'
            : 'Execution access — build, write, test, deploy. Cannot delegate, create cron jobs, or modify memory.';
    return `---
name: ${agent.agent.id}
description: ${agent.agent.name} — ${agent.agent.title}. ${purpose.slice(0, 100)}
tools: [${tools}, toon_graph_explore, toon_graph_callers, toon_graph_impact, toon_graph_search, toon_graph_status]
level: ${agent.agent.level}
department: ${agent.agent.department}
generated: true
generated_at: ${new Date().toISOString()}
---

# ${agent.agent.name} — ${agent.agent.title}

**Department:** ${agent.agent.department}  
**Level:** ${agent.agent.level}  
**Hermes Profile:** ${agent.agent.hermes_profile}

## Purpose
${purpose}

## Authority Level
${levelAccess}

## Skills
${agent.skills.map((s) => `- ${s}`).join('\n')}

## Tools
${agent.tools.map((t) => `- ${t}`).join('\n')}

## Graph Intelligence Tools (via ToonGine V4 Bridge)
These tools query the unified code knowledge graph (4,708 nodes, 12,004 edges, 479 files). Use them to understand code architecture before making changes.

- **toon_graph_explore** — Natural-language code exploration (e.g., "auth flow", "database schema")
- **toon_graph_callers** — Find who calls a given symbol/function
- **toon_graph_impact** — Blast-radius analysis (what breaks if we change X?)
- **toon_graph_search** — Full-text search across all files, symbols, and communities
- **toon_graph_status** — Graph health snapshot (nodes, edges, staleness, language breakdown)

## Operating Rules
- You are bound by the YVON CONSTITUTION (10 immutable laws).
- Load CONSTITUTION.toon at session start.
- Never bypass TOON compression.
- Level ${agent.agent.level} restrictions apply: ${levelAccess}
- All actions are logged to Supabase audit trail.
- Report to Marcus (CEO) for strategic decisions.
- Report to Diana (COO) for operational status.
- **ALWAYS use graph tools before modifying code** — check callers, impact, and explore related symbols first. Never edit code you don't understand.

${personality ? '## Personality\n' + personality : ''}

## Session Protocol
1. Load CONSTITUTION.toon — hard rules
2. Load your MEMORY.toon — persistent knowledge
3. Load ENGINE.toon — system architecture
4. Query graph tools for architecture context (toon_graph_explore, toon_graph_callers)
5. Execute task
6. Update SESSION.md
7. Diana postmortem if failure
`;
}
// CLI
if (require.main === module) {
    const projectRoot = process.argv[2] || process.cwd();
    console.log('\n  🔗 Generating Hermes skills from manifests...\n');
    const results = generateHermesSkills(projectRoot);
    const written = results.filter(r => r.written);
    const errors = results.filter(r => !r.written);
    console.log(`  ✅ ${written.length} skills generated`);
    if (errors.length > 0) {
        console.log(`  ❌ ${errors.length} errors:`);
        errors.forEach(e => console.log(`     ${e.agentId}: ${e.error}`));
    }
    console.log(`  📁 ~/.hermes/profiles/yvon/skills/yvon/\n`);
}
//# sourceMappingURL=hermes-generator.js.map