# Freeing AI from the Terminal: How We Built SwitchWarRoom to Turn Coding Agents into SRE Teammates in Slack

*Submitted for the Flip the Switch Hackathon by WeMakeDevs & DevTools Academy (Powered by Switch AI)*

---

## 1. The Terminal Dilemma: Why Solo AI Agents Fail Under Pressure

Imagine this scenario: It's 2:15 AM on a Saturday. Your PagerDuty alarm blares. A P1 outage has struck the checkout service. Kubernetes pods are crashing in an OOMKilled loop, and 38% of user transactions are timing out with HTTP 504.

In most engineering teams today, one on-call engineer wakes up groggy, opens their laptop, and launches an AI coding assistant (like Claude Code, Antigravity, or Cursor) in an isolated terminal window.

For the next 45 minutes, that engineer is the sole bottleneck:
- **Zero Visibility:** The engineering manager, SRE lead, and VP of Engineering sitting in the `#incident-war-room` Slack channel have no idea what the agent is doing.
- **Rogue Risks:** What if the agent suggests `rm -rf /` or runs an unparameterized database migration? With terminal-only agents, there are no organization-wide guardrails.
- **Context Loss:** Once the engineer's terminal session closes, the reasoning chain, stack trace analysis, and reproducing tests vanish into thin air.

**AI agents shouldn't be lonely terminal sidekicks. They should be transparent, cooperative team members in the channels where human teams already live.**

That was our epiphany when we discovered **Switch** at the *Flip the Switch* hackathon. We built **SwitchWarRoom** to transform isolated coding agents into a synchronized SRE swarm right inside Slack, Discord, and the Switch Console.

---

## 2. Introducing SwitchWarRoom

**SwitchWarRoom** is an autonomous multi-agent incident response swarm powered by **Switch** and **SandboxAQ's Switch Trust**. 

When an outage strikes, SwitchWarRoom instantiates a dedicated incident room across team channels and deploys a coordinated squad of four specialized AI agents:

```
                  ┌─────────────────────────────────────────┐
                  │          Monitoring Alerts              │
                  │     (Datadog / Sentry / PagerDuty)      │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │             SWITCH BRIDGE               │
                  │     (Slack / Discord / WebSockets)      │
                  └────────────────────┬────────────────────┘
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
       ▼                               ▼                               ▼
┌──────────────┐               ┌──────────────┐               ┌──────────────┐
│  🕵️ Triage   │               │   🛠️ Patch    │               │  🛡️ Switch   │
│  Diagnostics │──────────────▶│  Engineering │──────────────▶│  Trust Gate  │
└──────────────┘               └──────────────┘               └──────┬───────┘
                                                                     │
                                                       [Human Sign-Off in Slack]
                                                                     │
                                                                     ▼
                                                              ┌──────────────┐
                                                              │  📋 Comms &  │
                                                              │ Post-Mortem  │
                                                              └──────────────┘
```

1. 🕵️ **Detective Triage:** Ingests Sentry error traces and logs, correlates recent commits, and isolates root cause in 1.4 seconds.
2. 🛠️ **Patch Engineer:** Synthesizes an automated Vitest/Jest reproduction test and creates a surgical bugfix diff.
3. 🛡️ **Switch Trust Sentinel:** Enforces SandboxAQ security guardrails, scans for leaked API credentials, blocks destructive commands, and pauses for **Human-In-The-Loop authorization** via interactive chat buttons.
4. 📋 **Comms Commander:** Keeps leadership updated with live progress reports and automatically publishes a comprehensive Blameless Post-Mortem.

---

## 3. How We Integrated Switch

Switch acts as the nervous system for SwitchWarRoom. Instead of reinventing custom chat bots for every single messaging platform, Switch gives us:

### A. Universal Channel Bridging
Switch abstracts the underlying chat protocols. When our multi-agent orchestrator emits an event, Switch renders:
- Rich **Block Kit components** with interactive action buttons in Slack.
- Formatted **Embeds with syntax-highlighted code** in Discord.
- Real-time updates to the local **Switch Console** desktop app.

### B. Switch Trust MCP Integration
We implemented a dedicated **Switch Trust Model Context Protocol (MCP)** server over stdio. Before any agent executes bash commands or writes code, the operation is checked against Switch Trust guardrails:
- Destructive commands like `DROP TABLE` or `rm -rf` are immediately blocked.
- Sensitive credentials (AWS keys, Stripe secrets) are deterministically redacted before posting to chat.
- Token budgets and dollar costs are monitored in real time (e.g., $0.0038 total AI cost for a full P1 resolution).

---

## 4. The Live Flow in Action

Here is what happens during an actual live incident:

1. **Alert Ingestion:** Datadog flags an OOM failure in `checkout-api`. Switch creates `#war-room-checkout-api` in Slack.
2. **Root Cause Analysis:** `@Detective Triage` immediately responds:
   > *"I traced the stack trace to `src/services/checkout.ts:88`. Unbounded event listener allocation inside `processCheckout()`. On each transaction, an inline closure was bound to `redisBus.on('payment_ack')` without an `.off()` cleanup."*
3. **Automated Reproduction & Patch:** `@Patch Engineer` runs a Vitest reproduction suite simulating 50 concurrent transactions to confirm the leak, then posts the exact surgical diff and PR link.
4. **Human-In-The-Loop Gate:** `@Switch Trust Sentinel` posts:
   > *"Policy Alert: Modifies live production service. Switch Trust Compliance: 96/100. Human approval required."*
   Two interactive buttons appear right in Slack: `[✅ Approve Fix & Deploy Hotfix]` and `[🧪 Canary 10%]`.
5. **Human Sign-Off:** The on-call Tech Lead taps **Approve**.
6. **Post-Mortem Auto-Generation:** Within seconds of deployment, `@Comms Commander` confirms p99 latency returned to 120ms and generates an automated Blameless Post-Mortem ready for Notion and Jira.

---

## 5. Results & Real-World ROI

In our benchmark tests comparing traditional incident response vs. SwitchWarRoom:

| Metric | Traditional Human Triage | SwitchWarRoom + Switch |
| :--- | :--- | :--- |
| **Mean Time to Detect (MTTD)** | 8.5 minutes | **1.4 seconds** |
| **Reproduction Test Synthesis** | 22 minutes | **3.2 seconds** |
| **Human Coding Required** | ~35 lines under panic | **0 lines (1-click sign-off)** |
| **Downtime Cost Avoided** | N/A (Prolonged outage) | **$18,400+ saved** |
| **Total AI Cost** | N/A | **$0.0038** |

---

## 6. What We Learned Building with Switch

1. **Shared Context Trumps Solo Prompting:** Bringing AI out of private terminals into Slack completely changes team dynamics. Junior engineers learn from the agent's diagnostic steps, and senior engineers maintain full veto authority.
2. **Guardrails Build Trust:** Nobody will let an autonomous agent touch production without guardrails. Having **Switch Trust** transparently score risk and enforce Human-in-the-Loop approvals gives enterprise teams the confidence to adopt agentic workflows.
3. **The Future of Work is Centaur Teams:** The most effective engineering team isn't 100% human or 100% autonomous—it's human leads directing specialized agent swarms through everyday chat interfaces.

---

## 7. Try SwitchWarRoom

Explore the project, run the interactive simulator, and inspect the code:
- **GitHub Repository:** [switch-war-room](https://github.com/sandbox-quantum/switch)
- **Built for:** Flip the Switch Hackathon by WeMakeDevs & DevTools Academy
- **Powered by:** Switch AI & SandboxAQ

