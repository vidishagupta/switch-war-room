import { v4 as uuidv4 } from 'uuid';
import { Incident, AgentMessage, IncidentStatus } from '../types/index.js';
import { SCENARIOS } from '../scenarios/index.js';
import { trustEngine } from '../trust/engine.js';
import { switchBridge } from '../switch/bridge.js';
import { AGENT_PERSONAS } from './personas.js';

export class IncidentOrchestrator {
  private incidents: Map<string, Incident> = new Map();

  constructor() {
    // Initialize with a default active incident for immediate testing
    this.createIncident('checkout-leak');
  }

  public getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  public createIncident(scenarioId: string = 'checkout-leak'): Incident {
    const scenario = SCENARIOS[scenarioId] || SCENARIOS['checkout-leak'];
    const id = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const incident: Incident = {
      id,
      title: scenario.title,
      service: scenario.service,
      severity: scenario.severity,
      status: 'triggered',
      scenarioId: scenario.id,
      description: scenario.description,
      stackTrace: scenario.stackTrace,
      telemetryLogs: scenario.telemetryLogs,
      rootCause: undefined,
      trustScore: 98,
      tokensUsed: 1250,
      estimatedCost: 0.0038,
      messages: [],
      audits: [],
      createdAt: now,
      updatedAt: now
    };

    // System Alert Message
    const alertMsg: AgentMessage = {
      id: uuidv4(),
      incidentId: id,
      sender: 'system',
      agentName: 'PagerDuty / Datadog Bot',
      avatar: '🚨',
      text: `**${scenario.severity} Incident Triggered for \`${scenario.service}\`**\n${scenario.description}\n\n*Switch War Room instantiated in #war-room-${id.toLowerCase()}. AI swarm dispatched.*`,
      timestamp: now
    };

    incident.messages.push(alertMsg);
    this.incidents.set(id, incident);

    // Broadcast creation
    switchBridge.dispatchToChannels(incident, alertMsg);

    // Automatically trigger initial agent triage response
    setTimeout(() => this.runTriageStep(id), 1200);

    return incident;
  }

  /**
   * Step 1: Detective Triage agent isolates the problem
   */
  public async runTriageStep(incidentId: string) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.status = 'triaging';
    const scenario = SCENARIOS[incident.scenarioId];

    // Record trust check on telemetry read
    trustEngine.evaluateAction(incident.id, 'Detective Triage', 'command_exec', `kubectl logs -n prod ${scenario.service}`);
    trustEngine.recordTokenUsage(1400);

    const triageMsg: AgentMessage = {
      id: uuidv4(),
      incidentId,
      sender: 'triage',
      agentName: AGENT_PERSONAS.triage.name,
      avatar: AGENT_PERSONAS.triage.avatar,
      text: `🔎 **Telemetry Analysis Completed in 1.4s**\n\nI traced the stack trace and matched the OOM crash logs against recent commits. The failure originates in \`${scenario.faultyFile}\`.\n\n**Root Cause:**\n${scenario.rootCauseAnalysis}\n\nHanding off to @Patch Engineer to generate an isolated reproduction and surgical bugfix.`,
      codeSnippet: {
        filename: scenario.faultyFile,
        code: scenario.faultyCode,
        language: 'typescript'
      },
      timestamp: new Date().toISOString()
    };

    incident.messages.push(triageMsg);
    incident.rootCause = scenario.rootCauseAnalysis;
    incident.updatedAt = new Date().toISOString();
    incident.trustScore = trustEngine.calculateTrustScore(incident.id);

    await switchBridge.dispatchToChannels(incident, triageMsg);

    // Automatically progress to patch step
    setTimeout(() => this.runPatchStep(incidentId), 1800);
  }

  /**
   * Step 2: Patch Engineer creates the reproducing test and code fix
   */
  public async runPatchStep(incidentId: string) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.status = 'patching';
    const scenario = SCENARIOS[incident.scenarioId];

    trustEngine.evaluateAction(incident.id, 'Patch Engineer', 'file_write', `git checkout -b hotfix/${scenario.service}-${incident.id}`);
    trustEngine.recordTokenUsage(2100);

    const patchMsg: AgentMessage = {
      id: uuidv4(),
      incidentId,
      sender: 'patch',
      agentName: AGENT_PERSONAS.patch.name,
      avatar: AGENT_PERSONAS.patch.avatar,
      text: `🛠️ **Hotfix Branch & Reproduction Test Ready**\n\nI synthesized an automated reproduction test that replicates the bug under synthetic load, and implemented the fix in \`${scenario.faultyFile}\`.\n\nDiff generated for Pull Request \`#${Math.floor(100 + Math.random() * 900)}\`. Requesting Switch Trust review before requesting deployment approval.`,
      diff: {
        filename: scenario.faultyFile,
        oldCode: scenario.faultyCode,
        newCode: scenario.fixedCode
      },
      codeSnippet: {
        filename: 'test/repro.test.ts',
        code: scenario.reproTestCode,
        language: 'typescript'
      },
      timestamp: new Date().toISOString()
    };

    incident.patchDiff = {
      filename: scenario.faultyFile,
      oldCode: scenario.faultyCode,
      newCode: scenario.fixedCode
    };

    incident.messages.push(patchMsg);
    incident.updatedAt = new Date().toISOString();
    await switchBridge.dispatchToChannels(incident, patchMsg);

    // Hand off to Switch Trust Guardrail step
    setTimeout(() => this.runTrustVerificationStep(incidentId), 1500);
  }

  /**
   * Step 3: Switch Trust Gatekeeper validates safety and requests human sign-off
   */
  public async runTrustVerificationStep(incidentId: string) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.status = 'reviewing';
    const scenario = SCENARIOS[incident.scenarioId];

    // Evaluate proposed deploy/merge via Switch Trust Engine
    const evalResult = trustEngine.evaluateAction(
      incident.id,
      'Switch Trust Sentinel',
      'deploy',
      `Deploy hotfix to cluster prod-us-east-1 for service ${scenario.service}`
    );

    incident.audits = trustEngine.getAudits(incident.id);
    incident.trustScore = trustEngine.calculateTrustScore(incident.id);

    const trustMsg: AgentMessage = {
      id: uuidv4(),
      incidentId,
      sender: 'guardrail',
      agentName: AGENT_PERSONAS.guardrail.name,
      avatar: AGENT_PERSONAS.guardrail.avatar,
      text: `🛡️ **Switch Trust Guardrail Audit: Human-in-the-Loop Sign-Off Required**\n\n• **Static Security Policy:** ✅ Passed (0 hardcoded secrets, 0 SQL injections, clean linting)\n• **Reproduction Vitest Test:** ✅ 100% Passed (1/1 tests green, leak eliminated)\n• **Risk Level:** **HIGH** (Modifies live production service \`${scenario.service}\`)\n• **Switch Trust Compliance:** 96/100\n\n⚠️ **Human-in-the-Loop Gate:** Under company policy, autonomous deployment to production requires human team authorization in this channel.`,
      trustVerification: {
        score: 96,
        status: 'warning',
        details: 'Policy Requires Human Approval for Production Deployment'
      },
      actionRequired: true,
      actions: [
        {
          label: '✅ Approve Fix & Deploy Hotfix',
          action: 'approve_hotfix',
          style: 'primary',
          payload: { incidentId }
        },
        {
          label: '🧪 Run Canary Staging Only (10%)',
          action: 'run_canary',
          style: 'secondary',
          payload: { incidentId }
        },
        {
          label: '❌ Reject & Request Redo',
          action: 'reject_fix',
          style: 'danger',
          payload: { incidentId }
        }
      ],
      timestamp: new Date().toISOString()
    };

    incident.messages.push(trustMsg);
    incident.updatedAt = new Date().toISOString();
    await switchBridge.dispatchToChannels(incident, trustMsg);
  }

  /**
   * Step 4: Human triggers approval or interaction
   */
  public async handleAction(incidentId: string, actionName: string, approvedBy: string = 'Human Tech Lead'): Promise<Incident | undefined> {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    if (actionName === 'approve_hotfix' || actionName === 'run_canary') {
      incident.status = 'deploying';

      // Approve in audit log
      const pendingAudit = incident.audits.find(a => a.status === 'requires_approval');
      if (pendingAudit) {
        trustEngine.approveAudit(pendingAudit.id, approvedBy);
      }

      const humanAckMsg: AgentMessage = {
        id: uuidv4(),
        incidentId,
        sender: 'user',
        agentName: approvedBy,
        avatar: '👨‍💻',
        text: `Approved by **${approvedBy}** in Slack #war-room-${incident.id.toLowerCase()}. Proceeding with ${actionName === 'run_canary' ? 'Canary deployment (10%)' : 'immediate hotfix deployment'}.`,
        timestamp: new Date().toISOString()
      };
      incident.messages.push(humanAckMsg);
      await switchBridge.dispatchToChannels(incident, humanAckMsg);

      // Trigger resolution after brief simulated rollout
      setTimeout(() => this.runResolveStep(incidentId, approvedBy), 1600);
    } else if (actionName === 'reject_fix') {
      const rejectMsg: AgentMessage = {
        id: uuidv4(),
        incidentId,
        sender: 'user',
        agentName: approvedBy,
        avatar: '👨‍💻',
        text: `Fix rejected by **${approvedBy}**. Please investigate alternative fix strategy.`,
        timestamp: new Date().toISOString()
      };
      incident.messages.push(rejectMsg);
      await switchBridge.dispatchToChannels(incident, rejectMsg);
    }

    return incident;
  }

  /**
   * Step 5: Incident Resolution & Automated Post-Mortem by Comms Commander
   */
  public async runResolveStep(incidentId: string, approvedBy: string) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    const scenario = SCENARIOS[incident.scenarioId];
    incident.status = 'resolved';
    incident.resolvedAt = new Date().toISOString();
    incident.prNumber = 482;
    incident.prUrl = `https://github.com/org/repo/pull/482`;

    const postMortemMarkdown = `### 📋 Blameless Post-Mortem: ${scenario.title}
**Incident ID:** ${incident.id} | **Severity:** ${scenario.severity} | **Service:** ${scenario.service}
**Lead Responder:** Human Lead (${approvedBy}) + Switch AI Swarm
**Estimated Business Impact Avoided:** ${scenario.estimatedCostSaved}

#### 1. Executive Summary
On ${new Date(incident.createdAt).toUTCString()}, an alert fired for \`${scenario.service}\`. The Switch War Room was instantiated. The AI swarm detected root cause in 1.4s, synthesized a passing reproduction test, and drafted a surgical patch with zero human coding required. Deployment was authorized by ${approvedBy} and rolled out safely.

#### 2. Root Cause Analysis
${scenario.rootCauseAnalysis}

#### 3. Preventative Action Items
- [x] Merge PR #${incident.prNumber} into \`main\` (Completed by @Patch Engineer)
- [ ] Add linting rule in ESLint to disallow unremoved EventEmitter listeners in route handlers
- [ ] Configure Prometheus alert threshold for Heap Usage at 80% to allow pre-emptive autoscaling
- [ ] Enable Switch Trust continuous CI guardrail for all pull requests
`;

    incident.postMortem = postMortemMarkdown;

    const commsMsg: AgentMessage = {
      id: uuidv4(),
      incidentId,
      sender: 'comms',
      agentName: AGENT_PERSONAS.comms.name,
      avatar: AGENT_PERSONAS.comms.avatar,
      text: `🎉 **Incident Resolved! Hotfix Deployed & Verified Healthy**\n\n• **Service Status:** 🟢 All pods reporting 200 OK. P99 latency restored to 120ms.\n• **PR Status:** Merged into \`main\` [PR #482](${incident.prUrl})\n• **Post-Mortem:** Automated Blameless Post-Mortem compiled below and synced to Notion / Jira.`,
      codeSnippet: {
        filename: `POST-MORTEM-${incident.id}.md`,
        code: postMortemMarkdown,
        language: 'markdown'
      },
      timestamp: new Date().toISOString()
    };

    incident.messages.push(commsMsg);
    incident.updatedAt = new Date().toISOString();
    incident.trustScore = 100;
    await switchBridge.dispatchToChannels(incident, commsMsg);
  }

  /**
   * Conversational interaction from Slack/Discord or Web Chat
   */
  public async handleHumanChatMessage(incidentId: string, userText: string, authorName: string = 'Engineer'): Promise<AgentMessage> {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error('Incident not found');

    const scenario = SCENARIOS[incident.scenarioId];

    // Add user message
    const userMsg: AgentMessage = {
      id: uuidv4(),
      incidentId,
      sender: 'user',
      agentName: authorName,
      avatar: '👨‍💻',
      text: userText,
      timestamp: new Date().toISOString()
    };
    incident.messages.push(userMsg);
    await switchBridge.dispatchToChannels(incident, userMsg);

    // Generate intelligent AI response based on message content
    const lower = userText.toLowerCase();
    let replySender: 'triage' | 'patch' | 'guardrail' | 'comms' = 'triage';
    let replyText = '';

    if (lower.includes('cost') || lower.includes('save') || lower.includes('impact') || lower.includes('postmortem') || lower.includes('post-mortem')) {
      replySender = 'comms';
      replyText = `📊 **Business Impact Summary:**\nPrevented downtime loss is estimated at **${scenario.estimatedCostSaved}**. Total AI token cost for this incident was only **$${incident.estimatedCost}** (Switch ROI: 450,000x). Complete post-mortem is available in the Post-Mortem tab.`;
    } else if (lower.includes('safe') || lower.includes('security') || lower.includes('guardrail') || lower.includes('trust') || lower.includes('policy')) {
      replySender = 'guardrail';
      replyText = `🛡️ **Switch Trust Report:** Current trust rating is **${incident.trustScore}/100**. All static checks passed. Secret scanning detected 0 leaked API keys. Sandbox isolation verified.`;
    } else if (lower.includes('diff') || lower.includes('code') || lower.includes('test') || lower.includes('fix') || lower.includes('pr')) {
      replySender = 'patch';
      replyText = `🛠️ **Engineering Patch Details:** The fix modifies \`${scenario.faultyFile}\`. A standalone reproduction test has verified that the memory leak/bug is 100% neutralized without breaking any existing API contracts.`;
    } else {
      replySender = 'triage';
      replyText = `🕵️ **Triage Response:** In response to "${userText}": Telemetry confirms the incident is localized to service \`${scenario.service}\`. The multi-agent swarm is actively maintaining state synchronization across Slack and the War Room.`;
    }

    const persona = AGENT_PERSONAS[replySender];
    const aiMsg: AgentMessage = {
      id: uuidv4(),
      incidentId,
      sender: replySender,
      agentName: persona.name,
      avatar: persona.avatar,
      text: replyText,
      timestamp: new Date().toISOString()
    };

    incident.messages.push(aiMsg);
    incident.updatedAt = new Date().toISOString();
    await switchBridge.dispatchToChannels(incident, aiMsg);

    return aiMsg;
  }
}

export const orchestrator = new IncidentOrchestrator();

