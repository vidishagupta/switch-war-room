import React from 'react';
import { X, GitPullRequest, ShieldCheck } from 'lucide-react';
import { Incident } from '../types';

interface DiffViewerModalProps {
  isOpen: boolean;
  incident: Incident | null;
  onClose: () => void;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({ isOpen, incident, onClose }) => {
  if (!isOpen || !incident || !incident.patchDiff) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Pull Request #{incident.prNumber || 482}: Surgical Hotfix</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VERIFIED BY VITEST
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target: {incident.patchDiff.filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Content Body */}
        <div className="p-6 overflow-y-auto font-mono text-xs space-y-4">
          
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Old Code (Red) */}
            <div className="border border-rose-900/60 rounded-xl overflow-hidden bg-rose-950/20">
              <div className="bg-rose-900/40 px-3 py-1.5 border-b border-rose-900/60 text-rose-300 font-bold flex items-center justify-between text-[11px]">
                <span>- OLD (VULNERABLE / LEAKING)</span>
                <span>BUG SOURCE</span>
              </div>
              <pre className="p-3 text-rose-200 overflow-x-auto text-[11px] leading-relaxed">
                <code>{incident.patchDiff.oldCode}</code>
              </pre>
            </div>

            {/* New Code (Green) */}
            <div className="border border-emerald-900/60 rounded-xl overflow-hidden bg-emerald-950/20">
              <div className="bg-emerald-900/40 px-3 py-1.5 border-b border-emerald-900/60 text-emerald-300 font-bold flex items-center justify-between text-[11px]">
                <span>+ NEW (FIXED & GUARDED)</span>
                <span>PATCHED</span>
              </div>
              <pre className="p-3 text-emerald-200 overflow-x-auto text-[11px] leading-relaxed">
                <code>{incident.patchDiff.newCode}</code>
              </pre>
            </div>

          </div>

          {/* Verification Badge */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-xs text-slate-200">
                  Switch Trust Compliance Evaluation: PASSED (98%)
                </div>
                <div className="text-[11px] text-slate-400">
                  Static analysis confirmed zero residual EventEmitter leaks and strict parameterization.
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
            >
              Done Reviewing
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
