import React from 'react';
import { Bot, CheckCircle, ShieldAlert, Sparkles, Terminal, Activity } from 'lucide-react';
import { Incident } from '../types';

interface AgentCardsProps {
  incident: Incident | null;
}

interface AgentItem {
  id: string;
  name: string;
  role: string;
  badge: string;
  avatar: string;
  accent: string;
  borderAccent: string;
  description: string;
}

const AGENTS: AgentItem[] = [
  {
    id: 'triage',
    name: 'Detective Triage',
    role: 'Root Cause & Forensics',
    badge: 'DIAGNOSTICS',
    avatar: '🕵️',
    accent: 'text-blue-400 bg-blue-500/10',
    borderAccent: 'border-blue-500/30',
    description: 'Correlates Sentry stack traces, heap snapshots, and commit blame to isolate faults.'
  },
  {
    id: 'patch',
    name: 'Patch Engineer',
    role: 'Code Repair & Test Synthesis',
    badge: 'ENGINEERING',
    avatar: '🛠️',
    accent: 'text-emerald-400 bg-emerald-500/10',
    borderAccent: 'border-emerald-500/30',
    description: 'Generates automated reproduction unit tests and surgical code bugfixes.'
  },
  {
    id: 'guardrail',
    name: 'Switch Trust Sentinel',
    role: 'Guardrails & Human Gatekeeper',
    badge: 'TRUST & SAFETY',
    avatar: '🛡️',
    accent: 'text-amber-400 bg-amber-500/10',
    borderAccent: 'border-amber-500/30',
    description: 'Blocks destructive commands, masks secrets, and enforces human-in-the-loop approvals.'
  },
  {
    id: 'comms',
    name: 'Comms Commander',
    role: 'Incident Comms & Post-Mortem',
    badge: 'INCIDENT MGMT',
    avatar: '📋',
    accent: 'text-purple-400 bg-purple-500/10',
    borderAccent: 'border-purple-500/30',
    description: 'Syncs live updates to Slack/Discord channels and compiles blameless post-mortems.'
  }
];

export const AgentCards: React.FC<AgentCardsProps> = ({ incident }) => {
  const getAgentStatus = (agentId: string) => {
    if (!incident) return { status: 'Idle', active: false };

    switch (agentId) {
      case 'triage':
        if (incident.status === 'triggered' || incident.status === 'triaging') {
          return { status: 'Analyzing...', active: true };
        }
        return { status: 'Root Cause Found', active: false };

      case 'patch':
        if (incident.status === 'patching' || incident.status === 'reproducing') {
          return { status: 'Writing Fix...', active: true };
        }
        if (incident.patchDiff) {
          return { status: 'Patch Generated', active: false };
        }
        return { status: 'Awaiting Triage', active: false };

      case 'guardrail':
        if (incident.status === 'reviewing') {
          return { status: 'Human Gate Waiting', active: true };
        }
        return { status: 'Enforcing Sandbox', active: false };

      case 'comms':
        if (incident.status === 'deploying') {
          return { status: 'Broadcasting...', active: true };
        }
        if (incident.status === 'resolved') {
          return { status: 'Post-Mortem Published', active: false };
        }
        return { status: 'Syncing Mesh', active: false };

      default:
        return { status: 'Standby', active: false };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {AGENTS.map(agent => {
        const { status, active } = getAgentStatus(agent.id);

        return (
          <div
            key={agent.id}
            className={`bg-slate-900/80 border ${active ? 'border-indigo-500/60 shadow-lg shadow-indigo-500/10' : 'border-slate-800'} rounded-xl p-3.5 flex flex-col justify-between transition-all`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.avatar}</span>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight leading-none">{agent.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{agent.role}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${agent.accent}`}>
                  {agent.badge}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                {agent.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1 font-mono">
                <Activity className="w-3 h-3 text-slate-400" />
                State:
              </span>
              <span className={`font-semibold flex items-center gap-1.5 ${active ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />}
                {status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
