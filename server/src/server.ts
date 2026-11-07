import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { orchestrator } from './agents/orchestrator.js';
import { SCENARIOS } from './scenarios/index.js';
import { trustEngine } from './trust/engine.js';
import { switchBridge } from './switch/bridge.js';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    // Send initial handshake
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Connect the Switch bridge to broadcast over WebSocket
  switchBridge.setBroadcastCallback((event, data) => {
    const payload = JSON.stringify({ type: event, data });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  });

  // REST API Routes

  // List all incidents
  app.get('/api/incidents', (req, res) => {
    res.json(orchestrator.getAllIncidents());
  });

  // Get specific incident
  app.get('/api/incidents/:id', (req, res) => {
    const incident = orchestrator.getIncident(req.params.id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.json(incident);
  });

  // Create new incident from scenario
  app.post('/api/incidents', (req, res) => {
    const { scenarioId } = req.body;
    const incident = orchestrator.createIncident(scenarioId);
    res.status(201).json(incident);
  });

  // Execute human action (e.g. Approve Fix)
  app.post('/api/incidents/:id/action', async (req, res) => {
    const { action, approvedBy } = req.body;
    const incident = await orchestrator.handleAction(req.params.id, action, approvedBy);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.json(incident);
  });

  // Send human message in channel
  app.post('/api/incidents/:id/chat', async (req, res) => {
    const { message, author } = req.body;
    try {
      const reply = await orchestrator.handleHumanChatMessage(req.params.id, message, author);
      res.json(reply);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // List available scenarios
  app.get('/api/scenarios', (req, res) => {
    res.json(Object.values(SCENARIOS));
  });

  // Get Switch Trust Audit logs
  app.get('/api/trust/audits', (req, res) => {
    const incidentId = req.query.incidentId as string | undefined;
    res.json(trustEngine.getAudits(incidentId));
  });

  // Get Switch Trust Stats
  app.get('/api/trust/stats', (req, res) => {
    res.json({
      usage: trustEngine.recordTokenUsage(0),
      totalAudits: trustEngine.getAudits().length
    });
  });

  // Switch Platform Webhook (Inbound from Slack / Discord)
  app.post('/api/switch/webhook', async (req, res) => {
    const { incidentId, user, text, action } = req.body;
    if (action && incidentId) {
      const updated = await orchestrator.handleAction(incidentId, action, user || 'Slack User');
      res.json({ ok: true, incident: updated });
      return;
    }

    if (text && incidentId) {
      const reply = await orchestrator.handleHumanChatMessage(incidentId, text, user || 'Slack User');
      res.json({ ok: true, reply });
      return;
    }

    res.json({ ok: true, message: 'Switch Webhook processed' });
  });

  // Switch Slash Command Endpoint (e.g., /switch-incident, /switch-approve)
  app.post('/api/switch/command', async (req, res) => {
    const { command, text, user_name } = req.body;
    if (command === '/switch-incident') {
      const scenarioKey = text || 'checkout-leak';
      const inc = orchestrator.createIncident(scenarioKey);
      res.json({
        response_type: 'in_channel',
        text: `🚨 Created Switch Incident *${inc.id}*: ${inc.title}`
      });
      return;
    }

    res.json({
      response_type: 'ephemeral',
      text: `Switch Command recognized: ${command}`
    });
  });

  return { app, server };
}
