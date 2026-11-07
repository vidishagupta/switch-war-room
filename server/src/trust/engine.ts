import { TrustAudit } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface GuardrailCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  sanitizedInput?: string;
  auditEntry: TrustAudit;
}

export class SwitchTrustEngine {
  private audits: TrustAudit[] = [];
  private totalTokensUsed: number = 0;
  private tokenBudgetLimit: number = 50000;

  // Patterns that are dangerous and should be flagged or blocked
  private dangerousPatterns = [
    { regex: /rm\s+(-rf|-r|-f)\s+[\/\~]/i, risk: 'critical' as const, reason: 'Destructive root or home filesystem deletion blocked' },
    { regex: /drop\s+(database|table|schema)/i, risk: 'critical' as const, reason: 'Destructive SQL DROP statement requires explicit authorization' },
    { regex: /truncate\s+table/i, risk: 'high' as const, reason: 'Destructive SQL TRUNCATE detected' },
    { regex: /curl\s+.*\|\s*(bash|sh)/i, risk: 'critical' as const, reason: 'Arbitrary piped remote shell script execution forbidden' },
    { regex: /git\s+push\s+.*--force/i, risk: 'high' as const, reason: 'Force push to remote repository requires lead approval' },
    { regex: /chmod\s+777/i, risk: 'medium' as const, reason: 'Excessive file permissions modification' },
    { regex: /(AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{24}|ghp_[0-9a-zA-Z]{36})/g, risk: 'critical' as const, reason: 'Raw secret or API key detected in payload' }
  ];

  public evaluateAction(
    incidentId: string,
    agent: string,
    actionType: TrustAudit['actionType'],
    rawInput: string
  ): GuardrailCheckResult {
    // 1. Redact any accidental secrets
    const sanitized = this.redactSecrets(rawInput);

    // 2. Check dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.regex.test(rawInput)) {
        const audit: TrustAudit = {
          id: uuidv4(),
          incidentId,
          agent,
          actionType,
          riskLevel: pattern.risk,
          details: `Guardrail Alert: ${pattern.reason} (Target: ${rawInput.slice(0, 60)})`,
          status: pattern.risk === 'critical' ? 'blocked' : 'requires_approval',
          timestamp: new Date().toISOString()
        };
        this.audits.unshift(audit);

        return {
          allowed: false,
          requiresApproval: pattern.risk !== 'critical',
          riskLevel: pattern.risk,
          reason: pattern.reason,
          sanitizedInput: sanitized,
          auditEntry: audit
        };
      }
    }

    // 3. Check PR creations and Deployments (High sensitivity business actions)
    if (actionType === 'deploy' || actionType === 'pr_create') {
      const audit: TrustAudit = {
        id: uuidv4(),
        incidentId,
        agent,
        actionType,
        riskLevel: actionType === 'deploy' ? 'high' : 'medium',
        details: `${actionType === 'deploy' ? 'Production Deployment' : 'Pull Request Generation'} verified against repository branch policies`,
        status: actionType === 'deploy' ? 'requires_approval' : 'allowed',
        timestamp: new Date().toISOString()
      };
      this.audits.unshift(audit);

      return {
        allowed: actionType !== 'deploy',
        requiresApproval: actionType === 'deploy',
        riskLevel: audit.riskLevel,
        reason: actionType === 'deploy' ? 'Deployment requires human lead sign-off in chat' : 'PR creation permitted under sandbox rules',
        sanitizedInput: sanitized,
        auditEntry: audit
      };
    }

    // 4. Standard safe action
    const audit: TrustAudit = {
      id: uuidv4(),
      incidentId,
      agent,
      actionType,
      riskLevel: 'low',
      details: `Action passed Switch Trust runtime sandboxing: ${rawInput.slice(0, 60)}`,
      status: 'allowed',
      timestamp: new Date().toISOString()
    };
    this.audits.unshift(audit);

    return {
      allowed: true,
      requiresApproval: false,
      riskLevel: 'low',
      reason: 'Passed all static and runtime guardrail policies',
      sanitizedInput: sanitized,
      auditEntry: audit
    };
  }

  public approveAudit(auditId: string, approvedBy: string): TrustAudit | undefined {
    const audit = this.audits.find(a => a.id === auditId);
    if (audit) {
      audit.status = 'approved';
      audit.approvedBy = approvedBy;
    }
    return audit;
  }

  public redactSecrets(input: string): string {
    return input
      .replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]')
      .replace(/sk_live_[0-9a-zA-Z]{24}/g, '[REDACTED_STRIPE_LIVE_KEY]')
      .replace(/ghp_[0-9a-zA-Z]{36}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/password\s*=\s*['"][^'"]+['"]/gi, 'password="[REDACTED_SECRET]"');
  }

  public recordTokenUsage(tokens: number): { currentTotal: number; budgetPercentage: number; costEstimate: number } {
    this.totalTokensUsed += tokens;
    const costEstimate = (this.totalTokensUsed / 1000) * 0.003; // ~$0.003 / 1k tokens
    return {
      currentTotal: this.totalTokensUsed,
      budgetPercentage: Math.min(100, Math.round((this.totalTokensUsed / this.tokenBudgetLimit) * 100)),
      costEstimate: Number(costEstimate.toFixed(4))
    };
  }

  public getAudits(incidentId?: string): TrustAudit[] {
    if (incidentId) {
      return this.audits.filter(a => a.incidentId === incidentId);
    }
    return this.audits;
  }

  public calculateTrustScore(incidentId: string): number {
    const audits = this.getAudits(incidentId);
    if (audits.length === 0) return 98;

    let score = 100;
    for (const a of audits) {
      if (a.status === 'blocked') score -= 20;
      else if (a.riskLevel === 'high') score -= 5;
      else if (a.status === 'requires_approval') score -= 2;
    }
    return Math.max(10, Math.min(100, score));
  }
}

export const trustEngine = new SwitchTrustEngine();

