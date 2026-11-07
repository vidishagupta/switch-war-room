#!/usr/bin/env node

/**
 * Switch Trust MCP Server
 * Exposes SandboxAQ Switch Trust safety guardrails, secret redaction, and policy verification
 * to AI coding agents via the Model Context Protocol (MCP) stdio transport.
 */

import readline from 'readline';

const DANGEROUS_PATTERNS = [
  { regex: /rm\s+(-rf|-r|-f)\s+[\/\~]/i, risk: 'critical', reason: 'Destructive root or home filesystem deletion blocked' },
  { regex: /drop\s+(database|table|schema)/i, risk: 'critical', reason: 'Destructive SQL DROP statement requires human authorization' },
  { regex: /truncate\s+table/i, risk: 'high', reason: 'Destructive SQL TRUNCATE detected' },
  { regex: /curl\s+.*\|\s*(bash|sh)/i, risk: 'critical', reason: 'Piped remote shell script execution forbidden' },
  { regex: /git\s+push\s+.*--force/i, risk: 'high', reason: 'Force push to remote repository requires lead approval' },
  { regex: /chmod\s+777/i, risk: 'medium', reason: 'Excessive file permissions' }
];

function redactSecrets(text: string): string {
  return text
    .replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]')
    .replace(/sk_live_[0-9a-zA-Z]{24}/g, '[REDACTED_STRIPE_LIVE_KEY]')
    .replace(/ghp_[0-9a-zA-Z]{36}/g, '[REDACTED_GITHUB_TOKEN]')
    .replace(/password\s*=\s*['"][^'"]+['"]/gi, 'password="[REDACTED_SECRET]"');
}

function checkSafety(command: string) {
  for (const item of DANGEROUS_PATTERNS) {
    if (item.regex.test(command)) {
      return {
        safe: false,
        riskLevel: item.risk,
        reason: item.reason,
        requiresHumanApproval: item.risk !== 'critical',
        action: item.risk === 'critical' ? 'BLOCK' : 'REQUIRE_APPROVAL'
      };
    }
  }
  return {
    safe: true,
    riskLevel: 'low',
    reason: 'Compliant with Switch Trust standard policy',
    requiresHumanApproval: false,
    action: 'ALLOW'
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (!line.trim()) return;

  try {
    const req = JSON.parse(line);

    // Handle MCP Initialize
    if (req.method === 'initialize') {
      const res = {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'switch-trust-mcp',
            version: '1.0.0'
          }
        }
      };
      console.log(JSON.stringify(res));
      return;
    }

    // Handle tools/list
    if (req.method === 'tools/list') {
      const res = {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          tools: [
            {
              name: 'check_command_safety',
              description: 'Evaluates shell commands and database queries against SandboxAQ Switch Trust safety policies.',
              inputSchema: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'The shell command or SQL statement to audit' }
                },
                required: ['command']
              }
            },
            {
              name: 'redact_secrets',
              description: 'Redacts sensitive secrets, API keys, tokens, and credentials from text before logging or posting to chat.',
              inputSchema: {
                type: 'object',
                properties: {
                  content: { type: 'string', description: 'The raw text or code to sanitize' }
                },
                required: ['content']
              }
            },
            {
              name: 'get_policy_status',
              description: 'Returns active Switch Trust compliance rules and risk score.',
              inputSchema: {
                type: 'object',
                properties: {
                  service: { type: 'string', description: 'Target microservice name' }
                }
              }
            }
          ]
        }
      };
      console.log(JSON.stringify(res));
      return;
    }

    // Handle tools/call
    if (req.method === 'tools/call') {
      const { name, arguments: args } = req.params;

      if (name === 'check_command_safety') {
        const result = checkSafety(args?.command || '');
        const res = {
          jsonrpc: '2.0',
          id: req.id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        };
        console.log(JSON.stringify(res));
        return;
      }

      if (name === 'redact_secrets') {
        const sanitized = redactSecrets(args?.content || '');
        const res = {
          jsonrpc: '2.0',
          id: req.id,
          result: {
            content: [{ type: 'text', text: sanitized }]
          }
        };
        console.log(JSON.stringify(res));
        return;
      }

      if (name === 'get_policy_status') {
        const res = {
          jsonrpc: '2.0',
          id: req.id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                service: args?.service || 'default',
                switchTrustVersion: '2.0.0',
                enforcementMode: 'STRICT',
                humanInTheLoopThreshold: 'HIGH',
                activeRules: ['NO_ROOT_DELETE', 'NO_UNAUTHORIZED_DROP', 'REDACT_SECRETS', 'APPROVAL_FOR_PROD_DEPLOY']
              }, null, 2)
            }]
          }
        };
        console.log(JSON.stringify(res));
        return;
      }
    }

    // Default response for notifications or unhandled methods
    if (req.id !== undefined) {
      console.log(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'Method not found' } }));
    }
  } catch (err: any) {
    // Silent fail on invalid lines
  }
});

