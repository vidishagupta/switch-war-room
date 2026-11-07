export interface AgentPersonaConfig {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  badge: string;
  description: string;
}

export const AGENT_PERSONAS: Record<string, AgentPersonaConfig> = {
  triage: {
    id: 'triage',
    name: 'Detective Triage',
    role: 'Root Cause & Telemetry Forensics',
    avatar: '🕵️',
    color: 'from-blue-500 to-cyan-500',
    badge: 'DIAGNOSTICS',
    description: 'Ingests logs, traces call stacks, and isolates failing components within seconds.'
  },
  patch: {
    id: 'patch',
    name: 'Patch Engineer',
    role: 'Code Repair & Test Synthesis',
    avatar: '🛠️',
    color: 'from-emerald-500 to-teal-500',
    badge: 'ENGINEERING',
    description: 'Synthesizes minimal reproducing tests, writes targeted code fixes, and submits clean PRs.'
  },
  guardrail: {
    id: 'guardrail',
    name: 'Switch Trust Sentinel',
    role: 'Security & Human-in-the-Loop Gatekeeper',
    avatar: '🛡️',
    color: 'from-amber-500 to-red-500',
    badge: 'TRUST & SAFETY',
    description: 'Enforces SandboxAQ Switch Trust policies, blocks destructive operations, and requests human sign-off.'
  },
  comms: {
    id: 'comms',
    name: 'Comms Commander',
    role: 'Incident Comms & Post-Mortem Scribe',
    avatar: '📋',
    color: 'from-purple-500 to-indigo-500',
    badge: 'INCIDENT MGMT',
    description: 'Drafts real-time stakeholder updates, logs action items, and generates blameless post-mortems.'
  }
};
