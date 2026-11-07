import React from 'react';
import { 
  ShieldCheck, 
  Radio, 
  PlusCircle, 
  ExternalLink, 
  FileText, 
  History, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { Incident, IncidentScenario } from '../types';

interface HeaderProps {
  currentIncident: Incident | null;
  scenarios: IncidentScenario[];
  wsConnected: boolean;
  onTriggerScenario: (scenarioId: string) => void;
  onOpenAudit: () => void;
  onOpenPostMortem: () => void;
  onOpenIntegrations: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentIncident,
  scenarios,
  wsConnected,
  onTriggerScenario,
  onOpenAudit,
  onOpenPostMortem,
  onOpenIntegrations
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Live Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                SwitchWarRoom
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Switch AI Swarm
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                {wsConnected ? 'Connected to Switch Mesh' : 'Reconnecting...'}
              </span>
              <span>•</span>
              <span>DevTools Academy x WeMakeDevs</span>
            </div>
          </div>
        </div>

        {/* Center / Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trust Score Button */}
          <button 
            onClick={onOpenAudit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all shadow-sm"
            title="View Switch Trust Guardrails & Audit Ledger"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Switch Trust:</span>
            <span className="font-bold text-emerald-400">
              {currentIncident ? `${currentIncident.trustScore}/100` : '100%'}
            </span>
          </button>

          {/* Post Mortem Button */}
          {currentIncident?.postMortem && (
            <button
              onClick={onOpenPostMortem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Post-Mortem</span>
            </button>
          )}

          {/* Integrations (Slack/Discord) */}
          <button
            onClick={onOpenIntegrations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            <Radio className="w-4 h-4 text-indigo-400" />
            <span>Switch Channels</span>
          </button>

          {/* Scenario Trigger Dropdown */}
          <div className="relative group">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onTriggerScenario(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              aria-label="Simulate New Incident Scenario"
              className="appearance-none bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 pr-8 rounded-lg cursor-pointer transition-all shadow-md shadow-indigo-600/20 border border-indigo-400/30"
            >
              <option value="" disabled>Simulate Incident ▾</option>
              {scenarios.map(sc => (
                <option key={sc.id} value={sc.id} className="bg-slate-900 text-slate-200">
                  [{sc.severity}] {sc.name}
                </option>
              ))}
            </select>
            <Sparkles className="w-3.5 h-3.5 text-white/80 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>
    </header>
  );
};
