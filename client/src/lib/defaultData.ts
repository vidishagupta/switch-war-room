import { Incident, IncidentScenario } from '../types';

export const DEFAULT_SCENARIOS: IncidentScenario[] = [
  {
    id: 'checkout-leak',
    name: 'Memory Leak & Connection Exhaustion in Checkout Service',
    service: 'checkout-api',
    severity: 'P1',
    title: '[P1 Alert] High Memory Spike & HTTP 504 Gateway Timeouts on /v1/checkout/charge',
    description: 'Datadog Alert: Pod memory crossed 95% threshold in checkout-api-deployment. Kubelet restarted 8 pods in the last 15 minutes. Latency p99 increased from 140ms to 8.2s.',
    stackTrace: `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
1: 0xb09c10 node::Abort() [node]
2: 0xa1c3cb node::FatalError(char const*, char const*) [node]
3: 0xcf970e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [node]
...
at RedisEventBus.subscribe (src/events/redisBus.ts:42:14)
at processCheckout (src/services/checkout.ts:88:21)`,
    telemetryLogs: [
      '2026-11-07T16:21:04Z [ERROR] [checkout-api] RedisClient MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 101 error listeners added to [EventEmitter]',
      '2026-11-07T16:21:18Z [WARN] [checkout-api] Heap usage: 1.84GB / 2.0GB (92%)',
      '2026-11-07T16:21:45Z [ALERT] [k8s-event] Pod checkout-api-7b89d4-x9q2 OOMKilled (Exit Code 137)',
      '2026-11-07T16:22:01Z [CRITICAL] [ingress-nginx] 504 Gateway Timeout rate spike to 38.4%'
    ],
    faultyFile: 'src/services/checkout.ts',
    faultyCode: `export async function processCheckout(cart: CartSession, user: UserProfile): Promise<PaymentResult> {
  // CRITICAL BUG: New listener subscribed on EVERY transaction without cleanup or off()
  redisBus.on('payment_ack', (ack) => {
    logger.info(\`Received ack for \${ack.transactionId}\`);
  });

  const reservation = await inventoryClient.reserveItems(cart.items);
  const payment = await paymentGateway.charge(user.billingToken, cart.totalCents);
  
  await redisBus.publish('orders', { orderId: payment.orderId, status: 'CONFIRMED' });
  return payment;
}`,
    fixedCode: `export async function processCheckout(cart: CartSession, user: UserProfile): Promise<PaymentResult> {
  // FIXED: Scoped single-use listener with proper cleanup and timeout fallback
  const ackPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      redisBus.off('payment_ack', onAck);
      resolve(); // graceful fallback
    }, 3000);

    const onAck = (ack: { transactionId: string }) => {
      if (ack.transactionId === user.billingToken) {
        clearTimeout(timeout);
        redisBus.off('payment_ack', onAck);
        logger.info(\`Received ack for \${ack.transactionId}\`);
        resolve();
      }
    };

    redisBus.on('payment_ack', onAck);
  });

  const reservation = await inventoryClient.reserveItems(cart.items);
  const payment = await paymentGateway.charge(user.billingToken, cart.totalCents);
  await redisBus.publish('orders', { orderId: payment.orderId, status: 'CONFIRMED' });
  await ackPromise;
  
  return payment;
}`,
    reproTestCode: `import { describe, it, expect } from 'vitest';
import { processCheckout } from './checkout.js';
import { redisBus } from '../events/redisBus.js';

describe('Checkout Memory & Listener Leak Test', () => {
  it('should not leak event listeners across multiple checkout calls', async () => {
    const initialListeners = redisBus.listenerCount('payment_ack');
    const sessions = Array.from({ length: 50 }).map((_, i) => 
      processCheckout({ items: [], totalCents: 1000 }, { billingToken: \`tok_\${i}\` })
    );
    await Promise.all(sessions);
    expect(redisBus.listenerCount('payment_ack')).toBe(initialListeners);
  });
});`,
    rootCauseAnalysis: 'Unbounded event listener allocation inside processCheckout(). On each checkout request, an inline closure was bound to redisBus.on("payment_ack") without removing the listener. Under sustained load of 80 req/s, 4,800 listeners accumulated per minute until Node.js breached the 2GB heap limit and was OOMKilled by Kubernetes.',
    estimatedCostSaved: '$18,400 (prevented lost GMV & churn during peak morning hours)'
  },
  {
    id: 'sqli-auth',
    name: 'SQL Injection Vulnerability in User Search Directory',
    service: 'auth-directory',
    severity: 'P1',
    title: '[SECURITY P1] WAF Triggered: SQL Injection Attempt in /api/v2/users/search',
    description: 'AWS WAF / Cloudflare detected potential SQL syntax exploitation in query parameters on user search endpoint.',
    stackTrace: `QueryFailedError: syntax error at or near "OR"
at PostgresQueryRunner.query (src/driver/postgres/PostgresQueryRunner.ts:241:19)
at UserRepository.searchByEmail (src/repositories/UserRepository.ts:54:12)
Incoming Payload: email="admin@corp.com' OR '1'='1' --"`,
    telemetryLogs: [
      '2026-11-07T16:15:22Z [WARN] [waf-ruleset] Rule 942100 (SQLi Detection) fired',
      '2026-11-07T16:15:25Z [SECURITY] Sentinel ticket #SEC-892 opened: High-risk injection in UserRepository.ts'
    ],
    faultyFile: 'src/repositories/UserRepository.ts',
    faultyCode: `export async function searchByEmail(query: string, tenantId: string): Promise<UserRecord[]> {
  const rawQuery = \`SELECT id, email FROM users WHERE tenant_id = '\${tenantId}' AND email LIKE '%\${query}%'\`;
  return await db.query(rawQuery);
}`,
    fixedCode: `export async function searchByEmail(query: string, tenantId: string): Promise<UserRecord[]> {
  const safeQuery = \`SELECT id, email FROM users WHERE tenant_id = $1 AND email ILIKE $2\`;
  return await db.query(safeQuery, [tenantId, \`%\${query}%\`]);
}`,
    reproTestCode: `it('should safely escape malicious SQL payloads', async () => {
  const results = await searchByEmail("admin@corp.com' OR '1'='1", 'tenant_safe');
  expect(results).toEqual([]);
});`,
    rootCauseAnalysis: 'Interpolating untrusted user input directly into SQL strings in UserRepository.ts via template literals instead of using PostgreSQL positional parameters ($1, $2).',
    estimatedCostSaved: '$250,000+ (averted enterprise data breach and GDPR violation)'
  },
  {
    id: 'stripe-webhook',
    name: 'Stripe Webhook Signature Verification Panic',
    service: 'billing-service',
    severity: 'P2',
    title: '[P2 Alert] 100% Failure Rate on Stripe Webhook Events (400 Bad Request)',
    description: 'Stripe Dashboard alerts: 432 consecutive failed webhook deliveries due to body stream parsing order.',
    stackTrace: `StripeSignatureVerificationError: No signatures found matching the expected signature for payload.
at Stripe.Webhooks.constructEvent (/node_modules/stripe/lib/Webhooks.js:68:13)`,
    telemetryLogs: [
      '2026-11-07T16:10:00Z [INFO] Received stripe webhook event evt_1Q8b...',
      '2026-11-07T16:10:01Z [ERROR] StripeSignatureVerificationError: Expected payload buffer was parsed as JSON before verification'
    ],
    faultyFile: 'src/app.ts',
    faultyCode: `app.use(express.json());\napp.use('/webhooks/stripe', stripeWebhookRouter);`,
    fixedCode: `app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRouter);\napp.use(express.json());`,
    reproTestCode: `it('should accept raw buffer for signature verification', async () => {\n  const res = await request(app).post('/webhooks/stripe').send('{}');\n  expect(res.status).not.toBe(400);\n});`,
    rootCauseAnalysis: 'Express middleware ordering bug. express.json() was placed globally before the Stripe webhook endpoint, consuming the raw readable stream.',
    estimatedCostSaved: '$35,000 in delayed enterprise subscription activations'
  }
];

export function createInitialIncident(scenarioId: string = 'checkout-leak'): Incident {
  const sc = DEFAULT_SCENARIOS.find(s => s.id === scenarioId) || DEFAULT_SCENARIOS[0];
  const now = new Date().toISOString();
  const id = `INC-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    id,
    title: sc.title,
    service: sc.service,
    severity: sc.severity,
    status: 'reviewing',
    scenarioId: sc.id,
    description: sc.description,
    stackTrace: sc.stackTrace,
    telemetryLogs: sc.telemetryLogs,
    rootCause: sc.rootCauseAnalysis,
    patchDiff: {
      filename: sc.faultyFile,
      oldCode: sc.faultyCode,
      newCode: sc.fixedCode
    },
    prNumber: 482,
    prUrl: 'https://github.com/vidishagupta/switch-war-room/pull/482',
    trustScore: 96,
    tokensUsed: 4750,
    estimatedCost: 0.0142,
    audits: [
      {
        id: 'aud-1',
        incidentId: id,
        agent: 'Detective Triage',
        actionType: 'command_exec',
        riskLevel: 'low',
        details: `kubectl logs -n prod ${sc.service}`,
        status: 'allowed',
        timestamp: now
      },
      {
        id: 'aud-2',
        incidentId: id,
        agent: 'Patch Engineer',
        actionType: 'file_write',
        riskLevel: 'medium',
        details: `git checkout -b hotfix/${sc.service}-${id}`,
        status: 'allowed',
        timestamp: now
      },
      {
        id: 'aud-3',
        incidentId: id,
        agent: 'Switch Trust Sentinel',
        actionType: 'deploy',
        riskLevel: 'high',
        details: `Deploy hotfix to cluster prod-us-east-1 for service ${sc.service}`,
        status: 'requires_approval',
        timestamp: now
      }
    ],
    messages: [
      {
        id: 'm-1',
        incidentId: id,
        sender: 'system',
        agentName: 'PagerDuty / Datadog Bot',
        avatar: '🚨',
        text: `**${sc.severity} Incident Triggered for \`${sc.service}\`**\n${sc.description}\n\n*Switch War Room instantiated in #war-room-${id.toLowerCase()}. AI swarm dispatched.*`,
        timestamp: now
      },
      {
        id: 'm-2',
        incidentId: id,
        sender: 'triage',
        agentName: 'Detective Triage',
        avatar: '🕵️',
        text: `🔎 **Telemetry Analysis Completed in 1.4s**\n\nI traced the stack trace and matched the OOM crash logs against recent commits. The failure originates in \`${sc.faultyFile}\`.\n\n**Root Cause:**\n${sc.rootCauseAnalysis}\n\nHanding off to @Patch Engineer to generate an isolated reproduction and surgical bugfix.`,
        codeSnippet: {
          filename: sc.faultyFile,
          code: sc.faultyCode,
          language: 'typescript'
        },
        timestamp: now
      },
      {
        id: 'm-3',
        incidentId: id,
        sender: 'patch',
        agentName: 'Patch Engineer',
        avatar: '🛠️',
        text: `🛠️ **Hotfix Branch & Reproduction Test Ready**\n\nI synthesized an automated reproduction test that replicates the bug under synthetic load, and implemented the fix in \`${sc.faultyFile}\`.\n\nDiff generated for Pull Request \`#482\`. Requesting Switch Trust review before requesting deployment approval.`,
        diff: {
          filename: sc.faultyFile,
          oldCode: sc.faultyCode,
          newCode: sc.fixedCode
        },
        codeSnippet: {
          filename: 'test/repro.test.ts',
          code: sc.reproTestCode,
          language: 'typescript'
        },
        timestamp: now
      },
      {
        id: 'm-4',
        incidentId: id,
        sender: 'guardrail',
        agentName: 'Switch Trust Sentinel',
        avatar: '🛡️',
        text: `🛡️ **Switch Trust Guardrail Audit: Human-in-the-Loop Sign-Off Required**\n\n• **Static Security Policy:** ✅ Passed (0 hardcoded secrets, 0 SQL injections, clean linting)\n• **Reproduction Vitest Test:** ✅ 100% Passed (1/1 tests green, leak eliminated)\n• **Risk Level:** **HIGH** (Modifies live production service \`${sc.service}\`)\n• **Switch Trust Compliance:** 96/100\n\n⚠️ **Human-in-the-Loop Gate:** Under company policy, autonomous deployment to production requires human team authorization in this channel.`,
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
            payload: { incidentId: id }
          },
          {
            label: '🧪 Run Canary Staging Only (10%)',
            action: 'run_canary',
            style: 'secondary',
            payload: { incidentId: id }
          },
          {
            label: '❌ Reject & Request Redo',
            action: 'reject_fix',
            style: 'danger',
            payload: { incidentId: id }
          }
        ],
        timestamp: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };
}
