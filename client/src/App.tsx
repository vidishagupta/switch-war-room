import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatusPipeline } from './components/StatusPipeline';
import { AgentCards } from './components/AgentCards';
import { WarRoomChat } from './components/WarRoomChat';
import { DiffViewerModal } from './components/DiffViewerModal';
import { TrustAuditModal } from './components/TrustAuditModal';
import { PostMortemModal } from './components/PostMortemModal';
import { IntegrationsModal } from './components/IntegrationsModal';
import { Incident, IncidentScenario } from './types';

export const App: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentIncidentId, setCurrentIncidentId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<IncidentScenario[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Modals state
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isPostMortemOpen, setIsPostMortemOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  const currentIncident = incidents.find(i => i.id === currentIncidentId) || incidents[0] || null;

  // Fetch initial scenarios and incidents
  useEffect(() => {
    fetch('/api/scenarios')
      .then(res => res.json())
      .then(data => setScenarios(data))
      .catch(err => console.error('Error fetching scenarios:', err));

    fetch('/api/incidents')
      .then(res => res.json())
      .then(data => {
        setIncidents(data);
        if (data.length > 0 && !currentIncidentId) {
          setCurrentIncidentId(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching incidents:', err));
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
                // Check if message already exists
                if (!target.messages.some(m => m.id === message.id)) {
                  target.messages.push(message);
                }
                // Refresh incident stats if needed
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
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
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
      const newInc = await res.json();
      setIncidents(prev => [newInc, ...prev]);
      setCurrentIncidentId(newInc.id);
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
    }
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
      const updated = await res.json();
      setIncidents(prev => prev.map(inc => inc.id === updated.id ? updated : inc));
    } catch (err) {
      console.error('Failed to execute action:', err);
    }
  };

  // Send Human Chat Message
  const handleSendMessage = async (text: string) => {
    if (!currentIncident) return;
    try {
      await fetch(`/api/incidents/${currentIncident.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, author: 'Lead SRE (You)' })
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
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
