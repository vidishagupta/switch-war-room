import React, { useState } from 'react';
import { X, Radio, Terminal, Copy, Check, Zap } from 'lucide-react';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose }) => {
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!isOpen) return null;

  const sampleSlackCurl = `curl -X POST http://localhost:4000/api/switch/command \\
  -H "Content-Type: application/json" \\
  -d '{"command": "/switch-incident", "text": "checkout-leak", "user_name": "lead-sre"}'`;

  const copyCurl = () => {
    navigator.clipboard.writeText(sampleSlackCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Switch Mesh Integrations & Channels</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SWITCH AI POWERED
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bridges isolated terminal AI agents into shared team messaging platforms
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* How Switch Works Banner */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-3">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-xs mb-1">
                Why Switch Makes This Hackathon Project Special:
              </h3>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Standard AI coding agents (Claude Code, Antigravity, Cursor) operate in isolated individual developer terminals. 
                With <strong>Switch</strong>, this multi-agent incident response swarm is connected directly into <strong>Slack</strong>, <strong>Discord</strong>, and <strong>Microsoft Teams</strong>.
                Every teammate sees the logs, tests, proposed diffs, and can execute 1-click approvals without leaving chat.
              </p>
            </div>
          </div>

          {/* Supported Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xl mb-1">💬</div>
                <div className="font-bold text-white text-xs">Slack Block Kit</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supports interactive buttons, code snippets & slash commands (`/switch-incident`).
                </div>
              </div>
              <div className="mt-3 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Webhook Ready
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xl mb-1">🎮</div>
                <div className="font-bold text-white text-xs">Discord Webhooks</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Rich embeds with color-coded risk tiers, git diff links and live logs.
                </div>
              </div>
              <div className="mt-3 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Embeds Enabled
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xl mb-1">🖥️</div>
                <div className="font-bold text-white text-xs">Switch Console</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Integrates with `switch-buddy` desktop client & Switch Trust Gateway.
                </div>
              </div>
              <div className="mt-3 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Gateway Synced
              </div>
            </div>

          </div>

          {/* Sample Slash Command / Curl */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Trigger Incident via Switch API / Slack Command:
              </span>
              <button
                onClick={copyCurl}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
              {sampleSlackCurl}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
};
