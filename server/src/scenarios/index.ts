import { IncidentScenario } from '../types/index.js';

export const SCENARIOS: Record<string, IncidentScenario> = {
  'checkout-leak': {
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
4: 0xcf9a87 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [node]
...
at RedisEventBus.subscribe (src/events/redisBus.ts:42:14)
at processCheckout (src/services/checkout.ts:88:21)
at async /app/dist/controllers/paymentController.js:124:9`,
    telemetryLogs: [
      '2026-11-07T16:21:04Z [ERROR] [checkout-api] RedisClient MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 101 error listeners added to [EventEmitter]. Use emitter.setMaxListeners() to increase limit',
      '2026-11-07T16:21:18Z [WARN] [checkout-api] Heap usage: 1.84GB / 2.0GB (92%)',
      '2026-11-07T16:21:45Z [ALERT] [k8s-event] Pod checkout-api-7b89d4-x9q2 OOMKilled (Exit Code 137)',
      '2026-11-07T16:22:01Z [CRITICAL] [ingress-nginx] 504 Gateway Timeout rate spike to 38.4% on /v1/checkout/charge'
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
    
    // Simulate 50 concurrent checkout sessions
    const sessions = Array.from({ length: 50 }).map((_, i) => 
      processCheckout({ items: [], totalCents: 1000 }, { billingToken: \`tok_\${i}\` })
    );
    await Promise.all(sessions);

    const finalListeners = redisBus.listenerCount('payment_ack');
    expect(finalListeners).toBe(initialListeners);
  });
});`,
    rootCauseAnalysis: 'Unbounded event listener allocation inside `processCheckout()`. On each checkout request, an inline closure was bound to `redisBus.on("payment_ack")` without ever invoking `.off()` or removing the listener. Under sustained load of 80 req/s, 4,800 listeners were attached per minute, accumulating uncollected heap references until Node.js breached the 2GB V8 heap limit and was OOMKilled by Kubernetes.',
    estimatedCostSaved: '$18,400 (prevented lost GMV & churn during peak morning hours)'
  },

  'sqli-auth': {
    id: 'sqli-auth',
    name: 'SQL Injection Vulnerability in User Search Directory',
    service: 'auth-directory',
    severity: 'P1',
    title: '[SECURITY P1] WAF Triggered: SQL Injection Attempt in /api/v2/users/search',
    description: 'AWS WAF / Cloudflare detected potential SQL syntax exploitation in query parameters on user search endpoint. Security scanner flagged unparameterized raw SQL template string.',
    stackTrace: `QueryFailedError: syntax error at or near "OR"
at PostgresQueryRunner.query (src/driver/postgres/PostgresQueryRunner.ts:241:19)
at UserRepository.searchByEmail (src/repositories/UserRepository.ts:54:12)
at SearchController.search (src/controllers/SearchController.ts:31:28)
Incoming Payload: email="admin@corp.com' OR '1'='1' --"`,
    telemetryLogs: [
      '2026-11-07T16:15:22Z [WARN] [waf-ruleset] Rule 942100 (SQLi Detection) fired on host api.internal.corp',
      '2026-11-07T16:15:23Z [ERROR] [auth-directory] Unhandled Postgres Error: syntax error at or near "\'"',
      '2026-11-07T16:15:25Z [SECURITY] Automated Sentinel ticket #SEC-892 opened: High-risk injection in UserRepository.ts'
    ],
    faultyFile: 'src/repositories/UserRepository.ts',
    faultyCode: `export async function searchByEmail(query: string, tenantId: string): Promise<UserRecord[]> {
  // DANGEROUS: Raw string concatenation vulnerable to SQL Injection
  const rawQuery = \`
    SELECT id, email, full_name, role, tenant_id 
    FROM users 
    WHERE tenant_id = '\${tenantId}' AND email LIKE '%\${query}%'
  \`;
  return await db.query(rawQuery);
}`,
    fixedCode: `export async function searchByEmail(query: string, tenantId: string): Promise<UserRecord[]> {
  // FIXED: Parameterized prepared query prevents SQL injection
  const safeQuery = \`
    SELECT id, email, full_name, role, tenant_id 
    FROM users 
    WHERE tenant_id = $1 AND email ILIKE $2
  \`;
  const sanitizedTerm = \`%\${query.replace(/[%_\\\\]/g, '\\\\$&')}%\`;
  return await db.query(safeQuery, [tenantId, sanitizedTerm]);
}`,
    reproTestCode: `import { describe, it, expect } from 'vitest';
import { searchByEmail } from './UserRepository.js';

describe('SQL Injection Guardrail Test', () => {
  it('should safely escape malicious SQL payloads and return zero records', async () => {
    const maliciousInput = "admin@corp.com' OR '1'='1";
    const results = await searchByEmail(maliciousInput, 'tenant_safe_123');
    expect(results).toEqual([]);
  });
});`,
    rootCauseAnalysis: 'Interpolating untrusted user input directly into SQL strings in `UserRepository.ts`. The `query` parameter was spliced via JavaScript template literals instead of using PostgreSQL positional parameters (`$1, $2`). This allowed malicious quotes to break out of string literals.',
    estimatedCostSaved: '$250,000+ (averted enterprise data breach and GDPR violation)'
  },

  'stripe-webhook': {
    id: 'stripe-webhook',
    name: 'Stripe Webhook Signature Verification Panic',
    service: 'billing-service',
    severity: 'P2',
    title: '[P2 Alert] 100% Failure Rate on Stripe Webhook Events (400 Bad Request)',
    description: 'Stripe Dashboard alerts: 432 consecutive failed webhook deliveries. All payment fulfillment events failing HMAC signature check due to middleware parser ordering.',
    stackTrace: `StripeSignatureVerificationError: No signatures found matching the expected signature for payload.
Are you passing the raw request body you received from Stripe?
at Stripe.Webhooks.constructEvent (/node_modules/stripe/lib/Webhooks.js:68:13)
at stripeWebhookHandler (src/webhooks/stripe.ts:24:26)
at Layer.handle [as handle_request] (/node_modules/express/lib/router/layer.js:95:5)`,
    telemetryLogs: [
      '2026-11-07T16:10:00Z [INFO] [billing-service] Received stripe webhook event evt_1Q8b...',
      '2026-11-07T16:10:01Z [ERROR] [billing-service] StripeSignatureVerificationError: Expected payload buffer was parsed as JSON object before verification',
      '2026-11-07T16:11:30Z [WARN] [pagerduty] P2 Triggered: Subscription activations stalling'
    ],
    faultyFile: 'src/app.ts',
    faultyCode: `// Faulty middleware setup in express app
app.use(express.json()); // Consumes body stream prematurely!
app.use('/webhooks/stripe', stripeWebhookRouter);`,
    fixedCode: `// FIXED: Capture raw buffer specifically for Stripe webhook route before JSON parsing
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRouter);
app.use(express.json());`,
    reproTestCode: `import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('Stripe Webhook Raw Body Verification', () => {
  it('should accept raw buffer for signature verification without body parsing corruption', async () => {
    const res = await request(app)
      .post('/webhooks/stripe')
      .set('stripe-signature', 't=1600000000,v1=valid_mock_sig')
      .send(JSON.stringify({ type: 'customer.subscription.created' }));
    
    expect(res.status).not.toBe(400);
  });
});`,
    rootCauseAnalysis: 'Express middleware ordering bug introduced in recent refactor. `express.json()` was placed globally before the Stripe webhook endpoint, consuming the raw readable stream and turning req.body into a parsed object. Stripe signature verification requires the bit-for-bit exact raw payload bytes.',
    estimatedCostSaved: '$35,000 in delayed enterprise subscription activations'
  }
};

