import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Coins, 
  GitPullRequest, 
  Server, 
  ShieldAlert, 
  Terminal 
} from 'lucide-react';
import { Incident, IncidentStatus } from '../types';

interface StatusPipelineProps {
  incident: Incident;
  onOpenDiff: () => void;
}

const STEPS: { key: IncidentStatus; label: string }[] = [
  { key: 'triggered', label: '1. Ingest' },
  { key: 'triaging', label: '2. Forensics' },
  { key: 'patching', label: '3. Patch & Test' },
  { key: 'reviewing', label: '4. Trust Gate' },
  { key: 'deploying', label: '5. Deploy' },
  { key: 'resolved', label: '6. Resolved' }
];

export const StatusPipeline: React.FC<StatusPipelineProps> = ({ incident, onOpenDiff }) => {
  const getStepIndex = (status: IncidentStatus) => {
    switch (status) {
      case 'triggered': return 0;
      case 'triaging': return 1;
      case 'reproducing':
      case 'patching':
      case 'testing': return 2;
      case 'reviewing': return 3;
      case 'deploying': return 4;
      case 'resolved': return 5;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(incident.status);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
      {/* Top Details Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-start md:items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
            incident.severity === 'P1' 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            {incident.severity}
          </span>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{incident.title}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono text-indigo-400">
                <Server className="w-3.5 h-3.5" />
                {incident.service}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Started: {new Date(incident.createdAt).toLocaleTimeString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <Coins className="w-3.5 h-3.5" />
                Est. AI Cost: ${incident.estimatedCost.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Action / Pull Request link */}
        <div className="flex items-center gap-2">
          {incident.patchDiff && (
            <button
              onClick={onOpenDiff}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Inspect PR Diff</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentIndex || incident.status === 'resolved';
            const isCurrent = idx === currentIndex && incident.status !== 'resolved';

            return (
              <div 
                key={step.key}
                className={`p-2.5 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                  isDone 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                    : isCurrent 
                    ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-300 shadow-md shadow-indigo-500/10' 
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700 shrink-0" />
                  )}
                  <span>{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
