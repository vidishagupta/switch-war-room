import asyncio
import os
import edge_tts

AUDIO_DIR = os.path.join(os.path.dirname(__file__), 'audio')
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "en-US-ChristopherNeural"  # Professional, crisp, friendly tech voice

SCENES = [
    {
        "id": "scene0",
        "image": "scene0_intro.png",
        "narration": "When a mission-critical outage strikes in production, isolated terminal AI tools leave engineering teams in the dark. Introducing SwitchWarRoom, an autonomous multi-agent incident response swarm powered by Switch.",
        "caption": "SwitchWarRoom: Autonomous Multi-Agent Incident Response Swarm"
    },
    {
        "id": "scene1",
        "image": "scene1_hero.png",
        "narration": "SwitchWarRoom bridges autonomous coding agents directly into shared team channels like Slack, Discord, and this live console. When a P1 alert fires, a dedicated war room is instantiated with real-time state tracking.",
        "caption": "P1 Outage Detected: Autonomous incident war room initialized via Switch"
    },
    {
        "id": "scene2",
        "image": "scene2_swarm.png",
        "narration": "Instead of a single bot, an elite squad of four specialized agents coordinates the response: Detective Triage for diagnostics, Patch Engineer for code repair, Switch Trust Sentinel for security, and Comms Commander.",
        "caption": "The Agent Swarm: 4 specialized AI teammates collaborating in real-time"
    },
    {
        "id": "scene3",
        "image": "scene3_chat.png",
        "narration": "In under two seconds, Detective Triage isolates the root cause from Sentry telemetry: an uncleaned Redis event listener causing memory leaks in checkout.ts, and hands off to Patch Engineer.",
        "caption": "Automated Forensics: Root cause isolated in 1.4s with stack trace analysis"
    },
    {
        "id": "scene4",
        "image": "scene4_diff.png",
        "narration": "Next, Patch Engineer synthesizes a passing Vitest reproduction test, validates the leak under synthetic load, and crafts a surgical bugfix diff, completely ready for pull request review.",
        "caption": "Test Synthesis & Fix: Vitest reproduction test and surgical PR diff"
    },
    {
        "id": "scene5",
        "image": "scene5_trust.png",
        "narration": "Here, SandboxAQ's Switch Trust halts unauthorized execution. It evaluates static security, blocks dangerous bash commands, redacts leaked secrets, and monitors token costs down to a fraction of a cent.",
        "caption": "Switch Trust Governance: Secret redaction, policy enforcement & token audit"
    },
    {
        "id": "scene6",
        "image": "scene6_resolved.png",
        "narration": "With our strict Human-in-the-Loop gate, the on-call tech lead clicks 'Approve Fix'. The hotfix rolls out immediately, restoring healthy status across all pods in seconds.",
        "caption": "Human-in-the-Loop Gate: 1-click authorization via Slack or console"
    },
    {
        "id": "scene7",
        "image": "scene7_postmortem.png",
        "narration": "Within seconds of resolution, Comms Commander compiles an automated Blameless Post-Mortem, complete with executive summary and preventative action items ready for Notion and Jira.",
        "caption": "Instant Post-Mortem: Blameless post-mortem ready for Jira and Notion sync"
    },
    {
        "id": "scene8",
        "image": "scene8_channels.png",
        "narration": "Powered by Switch, this entire workflow seamlessly synchronizes across Slack Block Kit, Discord embeds, and the Switch Console desktop app, keeping the entire organization aligned.",
        "caption": "Switch Mesh: Seamless synchronization across Slack, Discord & Desktop"
    },
    {
        "id": "scene9",
        "image": "scene9_outro.png",
        "narration": "SwitchWarRoom reduces Mean Time to Resolution from forty-five minutes to under forty seconds. Open source and live on Vercel. Thank you WeMakeDevs and DevTools Academy!",
        "caption": "Try it Live: switch-war-room.vercel.app | GitHub: vidishagupta/switch-war-room"
    }
]

async def generate_scene_audio(scene):
    out_path = os.path.join(AUDIO_DIR, f"{scene['id']}.mp3")
    print(f"🎙️ Synthesizing AI Voice for {scene['id']}...", flush=True)
    communicate = edge_tts.Communicate(scene['narration'], VOICE)
    await communicate.save(out_path)
    print(f"✅ Generated {out_path}", flush=True)

async def main():
    for scene in SCENES:
        await generate_scene_audio(scene)
    print("✨ All audio narration synthesized successfully!", flush=True)

if __name__ == '__main__':
    asyncio.run(main())
