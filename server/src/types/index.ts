export type IncidentSeverity = 'P1' | 'P2' | 'P3';

export type IncidentStatus = 
  | 'triggered'
  | 'triaging'
  | 'reproducing'
  | 'patching'
  | 'testing'
  | 'reviewing'
  | 'deploying'
  | 'resolved';

export type AgentRole = 'user' | 'triage' | 'patch' | 'guardrail' | 'comms' | 'system';

export interface ActionButton {
  label: string;
  action: string;
  style: 'primary' | 'danger' | 'secondary' | 'success';
  payload?: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  incidentId: string;
  sender: AgentRole;
  agentName: string;
  avatar: string;
  text: string;
  codeSnippet?: {
    filename: string;
    code: string;
    language: string;
  };
  diff?: {
    filename: string;
    oldCode: string;
    newCode: string;
  };
  trustVerification?: {
    score: number; // 0-100
    status: 'passed' | 'warning' | 'blocked';
    details: string;
  };
  actionRequired?: boolean;
  actions?: ActionButton[];
  timestamp: string;
}

export interface TrustAudit {
  id: string;
  incidentId: string;
  agent: string;
  actionType: 'command_exec' | 'file_write' | 'network_req' | 'pr_create' | 'deploy';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  status: 'allowed' | 'blocked' | 'requires_approval' | 'approved';
  approvedBy?: string;
  timestamp: string;
}

export interface IncidentScenario {
  id: string;
  name: string;
  service: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  stackTrace: string;
  telemetryLogs: string[];
  faultyFile: string;
  faultyCode: string;
  fixedCode: string;
  reproTestCode: string;
  rootCauseAnalysis: string;
  estimatedCostSaved: string;
}

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  scenarioId: string;
  description: string;
  stackTrace: string;
  telemetryLogs: string[];
  rootCause?: string;
  patchDiff?: {
    filename: string;
    oldCode: string;
    newCode: string;
  };
  prNumber?: number;
  prUrl?: string;
  trustScore: number;
  tokensUsed: number;
  estimatedCost: number;
  messages: AgentMessage[];
  audits: TrustAudit[];
  postMortem?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

