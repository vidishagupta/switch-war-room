import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatusPipeline } from './components/StatusPipeline';
import { AgentCards } from './components/AgentCards';
import { WarRoomChat } from './components/WarRoomChat';
import { DiffViewerModal } from './components/DiffViewerModal';
import { TrustAuditModal } from './components/TrustAuditModal';
import { PostMortemModal } from './components/PostMortemModal';
import { IntegrationsModal } from './components/IntegrationsModal';
import { Incident, IncidentScenario, AgentMessage } from './types';
import { DEFAULT_SCENARIOS, createInitialIncident } from './lib/defaultData';

export const App: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([createInitialIncident()]);
  const [currentIncidentId, setCurrentIncidentId] = useState<string | null>(incidents[0].id);
  const [scenarios, setScenarios] = useState<IncidentScenario[]>(DEFAULT_SCENARIOS);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Modals state
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isPostMortemOpen, setIsPostMortemOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  const currentIncident = incidents.find(i => i.id === currentIncidentId) || incidents[0] || null;

  // Fetch initial scenarios and incidents from backend if available
  useEffect(() => {
    fetch('/api/scenarios')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setScenarios(data);
      })
      .catch(() => {
        // Fallback to DEFAULT_SCENARIOS
      });

    fetch('/api/incidents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setIncidents(data);
          setCurrentIncidentId(data[0].id);
        }
      })
      .catch(() => {
        // Fallback to local state
      });
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'message_created') {
            const { incidentId, message } = payload.data;

            setIncidents(prev => {
              const updated = [...prev];
              const target = updated.find(inc => inc.id === incidentId);
              if (target) {
                if (!target.messages.some(m => m.id === message.id)) {
                  target.messages.push(message);
                }
                fetch(`/api/incidents/${incidentId}`)
                  .then(res => res.json())
                  .then(refreshed => {
                    setIncidents(curr => curr.map(c => c.id === incidentId ? refreshed : c));
                  })
                  .catch(() => {});
              }
              return updated;
            });
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 4000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWebSocket();

    return () => {
      ws?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Trigger scenario
  const handleTriggerScenario = async (scenarioId: string) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      if (res.ok) {
        const newInc = await res.json();
        setIncidents(prev => [newInc, ...prev]);
        setCurrentIncidentId(newInc.id);
        return;
      }
    } catch {
      // Backend not running, use client simulation
    }

    const clientNewInc = createInitialIncident(scenarioId);
    setIncidents(prev => [clientNewInc, ...prev]);
    setCurrentIncidentId(clientNewInc.id);
  };

  // Execute Human Action (e.g. Approve Fix)
  const handleExecuteAction = async (action: string, approvedBy: string = 'Tech Lead') => {
    if (!currentIncident) return;
    try {
      const res = await fetch(`/api/incidents/${currentIncident.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, approvedBy })
      });
      if (res.ok) {
        const updated = await res.json();
        setIncidents(prev => prev.map(inc => inc.id === updated.id ? updated : inc));
        return;
      }
    } catch {
      // Fallback to client-side simulation
    }

    // Client-side execution
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== currentIncident.id) return inc;
      const now = new Date().toISOString();
      const updatedMessages: AgentMessage[] = [
        ...inc.messages,
        {
          id: `m-action-${Date.now()}`,
          incidentId: inc.id,
          sender: 'user',
          agentName: approvedBy,
          avatar: '👨‍💻',
          text: `Approved by **${approvedBy}** in Slack #war-room-${inc.id.toLowerCase()}. Proceeding with ${action === 'run_canary' ? 'Canary deployment (10%)' : 'immediate hotfix deployment'}.`,
          timestamp: now
        },
        {
          id: `m-resolve-${Date.now()}`,
          incidentId: inc.id,
          sender: 'comms',
          agentName: 'Comms Commander',
          avatar: '📋',
          text: `🎉 **Incident Resolved! Hotfix Deployed & Verified Healthy**\n\n• **Service Status:** 🟢 All pods reporting 200 OK. P99 latency restored to 120ms.\n• **PR Status:** Merged into \`main\` [PR #482](${inc.prUrl})\n• **Post-Mortem:** Automated Blameless Post-Mortem compiled below and synced to Notion / Jira.`,
          codeSnippet: {
            filename: `POST-MORTEM-${inc.id}.md`,
            code: `### 📋 Blameless Post-Mortem: ${inc.title}\n**Incident ID:** ${inc.id} | **Severity:** ${inc.severity} | **Service:** ${inc.service}\n**Lead Responder:** Human Lead (${approvedBy}) + Switch AI Swarm\n\n#### 1. Executive Summary\nRoot cause was isolated in 1.4s by Detective Triage. Reproduction test and surgical hotfix synthesized by Patch Engineer. Sign-off provided by ${approvedBy}.\n\n#### 2. Preventative Action Items\n- [x] Merge PR #482 into main (Completed)\n- [ ] Add linting rule to prevent unremoved listeners\n- [ ] Enable Switch Trust continuous CI guardrail`,
            language: 'markdown'
          },
          timestamp: now
        }
      ];

      return {
        ...inc,
        status: 'resolved',
        resolvedAt: now,
        trustScore: 100,
        postMortem: `### 📋 Blameless Post-Mortem: ${inc.title}\n**Incident ID:** ${inc.id} | **Severity:** ${inc.severity} | **Service:** ${inc.service}\n\n#### 1. Executive Summary\nRoot cause was isolated in 1.4s by Detective Triage. Reproduction test and surgical hotfix synthesized by Patch Engineer. Sign-off provided by ${approvedBy}.\n\n#### 2. Preventative Action Items\n- [x] Merge PR #482 into main (Completed)\n- [ ] Add linting rule to prevent unremoved listeners\n- [ ] Enable Switch Trust continuous CI guardrail`,
        messages: updatedMessages
      };
    }));
  };

  // Send Human Chat Message
  const handleSendMessage = async (text: string) => {
    if (!currentIncident) return;
    try {
      const res = await fetch(`/api/incidents/${currentIncident.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, author: 'Lead SRE (You)' })
      });
      if (res.ok) return;
    } catch {
      // Fallback to client-side simulation
    }

    // Client-side reply
    const now = new Date().toISOString();
    const lower = text.toLowerCase();
    let replySender: 'triage' | 'patch' | 'guardrail' | 'comms' = 'triage';
    let replyName = 'Detective Triage';
    let replyAvatar = '🕵️';
    let replyText = `In response to "${text}": Telemetry is clean and state is synchronized across channels.`;

    if (lower.includes('cost') || lower.includes('save') || lower.includes('postmortem') || lower.includes('impact')) {
      replySender = 'comms';
      replyName = 'Comms Commander';
      replyAvatar = '📋';
      replyText = `📊 **Business Impact Summary:** Total AI cost for this incident was only **$0.0142** (Switch ROI: 450,000x). Complete post-mortem is available in the Post-Mortem tab.`;
    } else if (lower.includes('safe') || lower.includes('trust') || lower.includes('security') || lower.includes('guardrail')) {
      replySender = 'guardrail';
      replyName = 'Switch Trust Sentinel';
      replyAvatar = '🛡️';
      replyText = `🛡️ **Switch Trust Report:** Current trust rating is **${currentIncident.trustScore}/100**. Secret scanning detected 0 leaked API keys. Sandbox isolation verified.`;
    } else if (lower.includes('code') || lower.includes('diff') || lower.includes('fix') || lower.includes('test')) {
      replySender = 'patch';
      replyName = 'Patch Engineer';
      replyAvatar = '🛠️';
      replyText = `🛠️ **Patch Details:** Surgical fix generated in \`${currentIncident.patchDiff?.filename}\`. Vitest suite passed with 100% green coverage.`;
    }

    setIncidents(prev => prev.map(inc => {
      if (inc.id !== currentIncident.id) return inc;
      return {
        ...inc,
        messages: [
          ...inc.messages,
          {
            id: `m-u-${Date.now()}`,
            incidentId: inc.id,
            sender: 'user',
            agentName: 'Lead SRE (You)',
            avatar: '👨‍💻',
            text,
            timestamp: now
          },
          {
            id: `m-a-${Date.now()}`,
            incidentId: inc.id,
            sender: replySender,
            agentName: replyName,
            avatar: replyAvatar,
            text: replyText,
            timestamp: now
          }
        ]
      };
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <Header
        currentIncident={currentIncident}
        scenarios={scenarios}
        wsConnected={wsConnected}
        onTriggerScenario={handleTriggerScenario}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenPostMortem={() => setIsPostMortemOpen(true)}
        onOpenIntegrations={() => setIsIntegrationsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {currentIncident ? (
          <div>
            {/* Status & Pipeline */}
            <StatusPipeline
              incident={currentIncident}
              onOpenDiff={() => setIsDiffOpen(true)}
            />

            {/* Agent Swarm View */}
            <AgentCards incident={currentIncident} />

            {/* Interactive War Room Chat */}
            <WarRoomChat
              incident={currentIncident}
              onExecuteAction={handleExecuteAction}
              onSendMessage={handleSendMessage}
              onOpenDiff={() => setIsDiffOpen(true)}
            />
          </div>
        ) : (
          <div className="text-center py-24 text-slate-400">
            <div className="text-4xl mb-3">🚨</div>
            <h2 className="text-base font-bold text-white mb-2">No Active Incident</h2>
            <p className="text-xs mb-4">Select a scenario above to simulate an autonomous incident response.</p>
          </div>
        )}
      </main>

      {/* Modals */}
      <DiffViewerModal
        isOpen={isDiffOpen}
        incident={currentIncident}
        onClose={() => setIsDiffOpen(false)}
      />

      <TrustAuditModal
        isOpen={isAuditOpen}
        incident={currentIncident}
        onClose={() => setIsAuditOpen(false)}
      />

      <PostMortemModal
        isOpen={isPostMortemOpen}
        incident={currentIncident}
        onClose={() => setIsPostMortemOpen(false)}
      />

      <IntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          SwitchWarRoom • Built for the <strong>Flip the Switch Hackathon</strong> by DevTools Academy & WeMakeDevs • Powered by <strong>Switch AI</strong>
        </p>
      </footer>

    </div>
  );
};
