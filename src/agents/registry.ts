// src/agents/registry.ts — Agent Registry
// Loads all manifest.toon files, validates them, provides lookup

import * as fs from 'fs'
import * as path from 'path'
import { AgentManifest, validateManifest, ManifestValidation } from './manifest-schema'

export { AgentManifest } from './manifest-schema'

export interface RegistryState {
  agents: AgentManifest[]
  validations: ManifestValidation[]
  total: number
  valid: number
  errors: number
}

export function loadRegistry(projectRoot: string): RegistryState {
  const agentDir = path.join(projectRoot, '.toon', 'memory', 'agent-department');
  const agents: AgentManifest[] = []
  const validations: ManifestValidation[] = []

  if (!fs.existsSync(agentDir)) {
    return { agents, validations, total: 0, valid: 0, errors: 0 }
  }

  function scanDir(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(full)
      } else if (entry.name === 'manifest.toon') {
        try {
          const raw = fs.readFileSync(full, 'utf-8')
          // YAML-like parsing (simple key: value format)
          const manifest = parseManifest(raw)
          const validation = validateManifest(manifest)
          validations.push(validation)
          if (validation.valid) {
            agents.push(manifest as AgentManifest)
          }
        } catch (e: any) {
          validations.push({
            valid: false,
            agent_id: path.relative(agentDir, path.dirname(full)),
            errors: [e.message],
            warnings: [],
          })
        }
      }
    }
  }

  scanDir(agentDir)

  return {
    agents,
    validations,
    total: validations.length,
    valid: agents.length,
    errors: validations.filter(v => !v.valid).length,
  }
}

export function getAgent(registry: RegistryState, id: string): AgentManifest | undefined {
  return registry.agents.find(a => a.agent.id === id)
}

export function getAgentsByDept(registry: RegistryState, dept: string): AgentManifest[] {
  return registry.agents.filter(a => a.agent.department === dept)
}

export function getAgentsByLevel(registry: RegistryState, level: number): AgentManifest[] {
  return registry.agents.filter(a => a.agent.level === level)
}

export function getCouncilMembers(registry: RegistryState): AgentManifest[] {
  return registry.agents.filter(a => a.council_role)
}

// Simple manifest parser (handles YAML-like format)
function parseManifest(raw: string): any {
  const lines = raw.split('\n')
  const result: any = { agent: {}, purpose: [], skills: [], tools: [], dependencies: [] }
  let currentSection = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Section headers
    if (trimmed === 'agent:') { currentSection = 'agent'; continue }
    if (trimmed === 'purpose:') { currentSection = 'purpose'; continue }
    if (trimmed === 'skills:') { currentSection = 'skills'; continue }
    if (trimmed === 'tools:') { currentSection = 'tools'; continue }
    if (trimmed === 'dependencies:') { currentSection = 'dependencies'; continue }
    if (trimmed === 'council_role:') { currentSection = 'council_role'; result.council_role = {}; continue }

    if (currentSection === 'agent') {
      const match = trimmed.match(/^(\w+):\s*(.+)/)
      if (match) {
        const key = match[1]
        let value: any = match[2].trim()
        if (key === 'level') value = parseInt(value)
        result.agent[key] = value
      }
    } else if (currentSection === 'council_role') {
      const match = trimmed.match(/^(\w+):\s*(.+)/)
      if (match && result.council_role) {
        const key = match[1]
        let value: any = match[2].trim()
        if (key === 'vote_weight') value = parseInt(value)
        result.council_role[key] = value
      }
    } else if (currentSection === 'purpose' || currentSection === 'skills' || currentSection === 'tools' || currentSection === 'dependencies') {
      const item = trimmed.replace(/^[-*]\s*/, '')
      if (item) result[currentSection].push(item)
    }
  }

  return result
}

// Auto-generate manifest from existing agent files
export function autoGenerateManifest(agentDir: string): AgentManifest {
  const agentName = path.basename(agentDir)
  const deptName = path.basename(path.dirname(agentDir))

  // Read AGENT.md for metadata
  const agentMd = path.join(agentDir, 'AGENT.md')
  const skillsMd = path.join(agentDir, 'SKILLS.md')
  const memoryMd = path.join(agentDir, 'MEMORY.md')

  let personality = ''
  if (fs.existsSync(agentMd)) {
    const content = fs.readFileSync(agentMd, 'utf-8')
    const match = content.match(/#\s*(.+?)\s*[-–—]\s*(.+)/)
    if (match) {
      personality = match[2].trim()
    }
  }

  // Extract skills from SKILLS.md
  const skills: string[] = []
  if (fs.existsSync(skillsMd)) {
    const content = fs.readFileSync(skillsMd, 'utf-8')
    const matches = content.matchAll(/[-*]\s+(.+)/g)
    for (const m of matches) {
      const skill = m[1].trim().replace(/`/g, '')
      if (skill && !skill.includes('[')) skills.push(skill)
    }
  }

  // Determine tools from agent role
  const tools = ['web_search', 'terminal', 'file', 'browser']
  const isCommand = ['CEO', 'COO', 'Command'].some(d => deptName.includes(d) || agentName.includes('marcus') || agentName.includes('diana'))
  const isExecutive = isCommand || deptName === 'Finance' || deptName === 'Psychology'

  if (isCommand) {
    tools.push('delegate_task', 'cronjob', 'memory', 'send_message', 'session_search')
  } else if (isExecutive) {
    tools.push('session_search')
  }

  // Determine level
  const level: 1 | 2 | 3 = isCommand ? 1 : (isExecutive ? 2 : 3)

  const manifest: AgentManifest = {
    agent: {
      id: `${agentName}-${deptName.toLowerCase().replace(/\s+/g, '-')}`,
      name: agentName.charAt(0).toUpperCase() + agentName.slice(1),
      title: personality || deptName + ' Specialist',
      department: deptName,
      level,
      hermes_profile: 'yvon',
      hermes_skill: `yvon/${agentName}`,
    },
    purpose: [`${deptName} operations and ${personality || 'specialized tasks'}`],
    skills,
    tools,
    dependencies: [],
  }

  return manifest
}
