import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  FileCode, 
  Bot, 
  User, 
  Sparkles,
  GitPullRequest
} from 'lucide-react';
import { Incident, AgentMessage, ActionButton } from '../types';

interface WarRoomChatProps {
  incident: Incident;
  onExecuteAction: (action: string, approvedBy?: string) => void;
  onSendMessage: (text: string) => void;
  onOpenDiff: () => void;
}

export const WarRoomChat: React.FC<WarRoomChatProps> = ({
  incident,
  onExecuteAction,
  onSendMessage,
  onOpenDiff
}) => {
  const [inputText, setInputText] = useState('');
  const [showTelemetry, setShowTelemetry] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [incident.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const getSenderBadge = (sender: AgentMessage['sender']) => {
    switch (sender) {
      case 'triage':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">TRIAGE</span>;
      case 'patch':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">PATCH BOT</span>;
      case 'guardrail':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">SWITCH TRUST</span>;
      case 'comms':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">COMMS</span>;
      case 'user':
        return <span className="bg-slate-700 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded">TECH LEAD</span>;
      default:
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">ALERT</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[700px] shadow-2xl overflow-hidden">
      
      {/* War Room Channel Header */}
      <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-sm">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white font-mono">
                war-room-{incident.service}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Switch Live Mesh
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Synced across Slack, Discord & Web War Room
            </p>
          </div>
        </div>

        {/* Telemetry Toggle */}
        <button
          onClick={() => setShowTelemetry(!showTelemetry)}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-mono"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Raw Telemetry</span>
          {showTelemetry ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Telemetry Drawer */}
      {showTelemetry && (
        <div className="bg-slate-950 border-b border-slate-800 p-4 max-h-56 overflow-y-auto font-mono text-xs text-slate-300">
          <div className="font-bold text-rose-400 mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Stack Trace Ingested:
          </div>
          <pre className="text-slate-400 bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto text-[11px] mb-2 leading-relaxed">
            {incident.stackTrace}
          </pre>
          <div className="font-bold text-indigo-400 mb-1">Recent Telemetry Events:</div>
          <ul className="space-y-1 text-slate-400 text-[11px]">
            {incident.telemetryLogs.map((log, i) => (
              <li key={i} className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60 font-mono">
                {log}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {incident.messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
              msg.sender === 'user' 
                ? 'bg-indigo-950/20 border-indigo-800/40 ml-6' 
                : msg.sender === 'guardrail' 
                ? 'bg-amber-950/20 border-amber-600/30' 
                : msg.sender === 'patch'
                ? 'bg-emerald-950/20 border-emerald-600/30'
                : 'bg-slate-850/70 border-slate-800'
            }`}
          >
            {/* Sender Avatar */}
            <div className="text-2xl shrink-0 p-1 bg-slate-800/60 rounded-lg border border-slate-700/60">
              {msg.avatar}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-bold text-xs text-white tracking-tight">{msg.agentName}</span>
                {getSenderBadge(msg.sender)}
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Message text with bold/markdown aesthetic */}
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {msg.text}
              </div>

              {/* Code Snippet if present */}
              {msg.codeSnippet && (
                <div className="mt-3 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden font-mono text-xs">
                  <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      {msg.codeSnippet.filename}
                    </span>
                    <span className="uppercase text-[9px] text-slate-500 font-bold">{msg.codeSnippet.language}</span>
                  </div>
                  <pre className="p-3 text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                    <code>{msg.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {/* Diff banner if present */}
              {msg.diff && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={onOpenDiff}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>View Surgical Patch Diff ({msg.diff.filename})</span>
                  </button>
                </div>
              )}

              {/* Action Buttons (Human-in-the-Loop) */}
              {msg.actionRequired && msg.actions && incident.status === 'reviewing' && (
                <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap gap-2">
                  {msg.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => onExecuteAction(act.action)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                        act.style === 'primary'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          : act.style === 'secondary'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-850 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or instruction to the Switch swarm (e.g., 'What is the root cause?', 'Is this safe?')..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
          <span>💡 Tip: Ask the agents questions or give directions directly from Slack or this console.</span>
          <span>Switch Trust: STRICT</span>
        </div>
      </form>

    </div>
  );
};

