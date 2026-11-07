import React, { useState } from 'react';
import { X, FileText, Copy, Check } from 'lucide-react';
import { Incident } from '../types';

interface PostMortemModalProps {
  isOpen: boolean;
  incident: Incident | null;
  onClose: () => void;
}

export const PostMortemModal: React.FC<PostMortemModalProps> = ({ isOpen, incident, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !incident || !incident.postMortem) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(incident.postMortem || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Automated Blameless Post-Mortem</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  COMMS COMMANDER
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready for immediate sync to Notion, Confluence & Jira
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Post Mortem Content */}
        <div className="p-6 overflow-y-auto font-sans text-xs text-slate-200 space-y-4 leading-relaxed">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-300">
            {incident.postMortem}
          </div>
        </div>

      </div>
    </div>
  );
};
