# SwitchWarRoom: 3-Minute Demo Pitch & Video Script

**Target Track:** Flip the Switch Hackathon — Best Business Workflow  
**Host:** WeMakeDevs & DevTools Academy (Powered by Switch)  
**Presenter:** SwitchWarRoom Team  

---

### [0:00 - 0:30] The Problem: Why Terminal Agents Fall Short
> *"Hey everyone! We are thrilled to present **SwitchWarRoom** for the Flip the Switch Hackathon.*  
>  
> *Today, AI coding assistants like Claude Code and Cursor are incredible, but they are trapped in isolated local terminal windows. When an urgent production outage strikes at 2 AM, having one engineer secretly prompting an AI tool in their private terminal creates chaos. The rest of the engineering team sitting in Slack has zero visibility, no way to collaborate, and no guardrails against destructive commands.*  
>  
> *We asked: What if AI agents could step out of the terminal and become collaborative teammates in our Slack and Discord channels? That’s why we built SwitchWarRoom, powered by Switch."*

---

### [0:30 - 1:15] Architecture & Introducing the Agent Swarm
*(Screen: Show the SwitchWarRoom Web Console & Slack Channel side by side)*

> *"SwitchWarRoom uses **Switch** to bridge four specialized AI agents directly into incident channels:*  
>  
> 1. *First is **Detective Triage**, who analyzes stack traces and isolated root causes in seconds.*  
> 2. *Second is **Patch Engineer**, who creates reproducing tests and surgical pull requests.*  
> 3. *Third is **Switch Trust Sentinel**, enforcing SandboxAQ guardrails to prevent unsafe commands, redact secrets, and gate risky deployments.*  
> 4. *And fourth is **Comms Commander**, keeping stakeholders updated and generating blameless post-mortems.*  
>  
> *Let’s watch a live P1 incident unfold in real time."*

---

### [1:15 - 2:15] The Live Demo: From P1 Alert to 1-Click Resolution
*(Screen: Trigger the 'Memory Leak in Checkout Service' scenario)*

> *"A P1 alert fires from Datadog: The checkout service is crashing with out-of-memory errors. Instantly, Switch creates the war room channel.*  
>  
> *Watch how quickly Detective Triage identifies the root cause: an unbounded event listener leak in `checkout.ts` on Redis acknowledgments.*  
>  
> *Next, Patch Engineer steps in. It writes an automated Vitest reproduction test that simulates 50 concurrent requests, reproduces the leak, and creates a surgical bugfix.*  
>  
> *Clicking on 'Inspect PR Diff', you can see the clean before-and-after comparison with proper event cleanup.*  
>  
> *Now, notice what **Switch Trust** does: Because this changes a mission-critical production service, the Switch Trust Sentinel halts autonomous execution. It verifies that zero API keys are exposed, verifies the test passed 100%, and issues an interactive **Human-in-the-Loop** approval button in chat.*  
>  
> *As the Tech Lead, I click **'Approve Fix & Deploy'**.*  
>  
> *Immediately, the hotfix deploys, all pods report green, and Comms Commander automatically compiles an executive summary and full Blameless Post-Mortem ready for Notion."*

---

### [2:15 - 2:45] Switch Trust MCP & Conversational Flexibility
*(Screen: Open the Switch Trust Modal & type a question in chat)*

> *"Let's open the **Switch Trust Ledger**. Here, judges can see our Model Context Protocol (MCP) server in action—tracking real-time token spend ($0.0038 for the entire incident!), blocking dangerous shell commands like `rm -rf`, and auditing compliance.*  
>  
> *And because Switch supports two-way conversational context, I can ask any question right here in chat: 'What was the estimated business impact?' and Comms Commander replies instantly with the GMV saved."*

---

### [2:45 - 3:00] Closing & Impact
> *"With SwitchWarRoom, we reduced Mean Time to Resolution from 45 minutes down to 38 seconds—without writing a single line of manual code under pressure, and with strict enterprise guardrails.*  
>  
> *Thank you to WeMakeDevs and DevTools Academy for powering the future of collaborative AI with Switch. Flip the switch, and let’s build together!"*

