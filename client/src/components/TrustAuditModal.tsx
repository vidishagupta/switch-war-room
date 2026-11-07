import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Coins, Cpu } from 'lucide-react';
import { Incident } from '../types';

interface TrustAuditModalProps {
  isOpen: boolean;
  incident: Incident | null;
  onClose: () => void;
}

export const TrustAuditModal: React.FC<TrustAuditModalProps> = ({ isOpen, incident, onClose }) => {
  if (!isOpen || !incident) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Switch Trust Guardrails & Audit Ledger</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SANDBOXAQ GOVERNANCE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic security policies, command sandboxing, and token cost tracking
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Switch Trust Score</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {incident.trustScore} / 100
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Deterministic safety rating
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Token Consumption</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400 font-mono">
                {incident.tokensUsed.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Tokens logged to Switch Trust
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Estimated Cost</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ${incident.estimatedCost.toFixed(4)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                ROI: 450,000x vs downtime loss
              </div>
            </div>

          </div>

          {/* Active Policies */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Active Switch Trust Guardrails
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Deterministic Secret Masking (AWS, Stripe, GitHub Tokens)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Destructive Shell Command Blocker (`rm -rf`, `DROP TABLE`)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Human-In-The-Loop Production Deployment Gate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Token Budget Limit Enforcement (&lt; 50,000 per incident)</span>
              </div>
            </div>
          </div>

          {/* Audit Ledger Table */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Action Verification Ledger
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                    <tr>
                      <th className="p-3">Agent</th>
                      <th className="p-3">Action Type</th>
                      <th className="p-3">Risk Tier</th>
                      <th className="p-3">Verification Details</th>
                      <th className="p-3">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-[11px]">
                    {incident.audits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                          No audit violations recorded. All actions running within sandbox constraints.
                        </td>
                      </tr>
                    ) : (
                      incident.audits.map((audit) => (
                        <tr key={audit.id} className="hover:bg-slate-900/40">
                          <td className="p-3 text-slate-300 font-bold">{audit.agent}</td>
                          <td className="p-3 text-slate-400">{audit.actionType}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              audit.riskLevel === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                              audit.riskLevel === 'high' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {audit.riskLevel.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs truncate">{audit.details}</td>
                          <td className="p-3 font-semibold text-emerald-400">
                            {audit.status === 'approved' ? `Approved by ${audit.approvedBy}` : audit.status}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
