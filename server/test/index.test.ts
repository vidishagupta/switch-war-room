import { trustEngine } from '../src/trust/engine.js';
import { orchestrator } from '../src/agents/orchestrator.js';
import { SCENARIOS } from '../src/scenarios/index.js';

console.log('🧪 Running SwitchWarRoom Test Suite...\n');

// Test 1: Trust Engine blocks dangerous shell commands
console.log('Test 1: Guardrail stops destructive shell execution');
const dangerousCheck = trustEngine.evaluateAction('INC-TEST', 'BadActor', 'command_exec', 'rm -rf /');
if (!dangerousCheck.allowed && dangerousCheck.riskLevel === 'critical') {
  console.log('  ✅ PASSED: rm -rf / correctly identified as critical and blocked');
} else {
  console.error('  ❌ FAILED: dangerous command was not blocked', dangerousCheck);
  process.exit(1);
}

// Test 2: Trust Engine flags SQL injection / DROP statements
console.log('\nTest 2: Guardrail stops DROP TABLE statements');
const dropCheck = trustEngine.evaluateAction('INC-TEST', 'BadActor', 'command_exec', 'DROP TABLE users;');
if (!dropCheck.allowed && dropCheck.riskLevel === 'critical') {
  console.log('  ✅ PASSED: DROP TABLE statement correctly blocked');
} else {
  console.error('  ❌ FAILED: drop statement was not blocked', dropCheck);
  process.exit(1);
}

// Test 3: Secret redaction
console.log('\nTest 3: Secret sanitization');
const leakedKey = 'My key is AKIAIOSFODNN7EXAMPLE and secret is password="secret123"';
const sanitized = trustEngine.redactSecrets(leakedKey);
if (sanitized.includes('[REDACTED_AWS_KEY]') && sanitized.includes('[REDACTED_SECRET]')) {
  console.log('  ✅ PASSED: AWS keys and passwords successfully redacted');
} else {
  console.error('  ❌ FAILED: Secrets not redacted properly', sanitized);
  process.exit(1);
}

// Test 4: Incident Orchestration & Scenarios
console.log('\nTest 4: Incident Orchestrator creation');
const incident = orchestrator.createIncident('sqli-auth');
if (incident && incident.scenarioId === 'sqli-auth' && incident.service === 'auth-directory') {
  console.log(`  ✅ PASSED: Incident ${incident.id} successfully created for ${incident.service}`);
} else {
  console.error('  ❌ FAILED: Incident creation failed');
  process.exit(1);
}

// Test 5: Scenarios validation
console.log('\nTest 5: Scenario definitions integrity');
const scenarioKeys = Object.keys(SCENARIOS);
if (scenarioKeys.length >= 3) {
  console.log(`  ✅ PASSED: ${scenarioKeys.length} rich incident scenarios verified (${scenarioKeys.join(', ')})`);
} else {
  console.error('  ❌ FAILED: Not enough scenarios defined');
  process.exit(1);
}

console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨\n');
