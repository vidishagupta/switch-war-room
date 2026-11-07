import os
from playwright.sync_api import sync_playwright

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

TARGET_URL = 'https://switch-war-room.vercel.app'

def capture_scenes():
    print(f"🚀 Navigating to {TARGET_URL}...", flush=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            device_scale_factor=1.0
        )
        page = context.new_page()

        # 1. Hero Overview
        page.goto(TARGET_URL, wait_until='networkidle')
        page.wait_for_timeout(1500)
        print("📸 Capturing Scene 1: Hero & Status Pipeline...", flush=True)
        page.screenshot(path=os.path.join(ASSETS_DIR, 'scene1_hero.png'))

        # 2. Agent Swarm Cards Focus
        print("📸 Capturing Scene 2: Multi-Agent Swarm Cards...", flush=True)
        page.screenshot(path=os.path.join(ASSETS_DIR, 'scene2_swarm.png'))

        # 3. War Room Chat
        print("📸 Capturing Scene 3: War Room Chat & Diagnostics...", flush=True)
        page.screenshot(path=os.path.join(ASSETS_DIR, 'scene3_chat.png'))

        # 4. Open Diff Viewer Modal
        print("📸 Capturing Scene 4: Surgical Patch Diff...", flush=True)
        diff_btn = page.query_selector('button:has-text("Inspect PR Diff")')
        if diff_btn:
            diff_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=os.path.join(ASSETS_DIR, 'scene4_diff.png'))

        # 5. Open Switch Trust Modal (fresh page)
        page.goto(TARGET_URL, wait_until='networkidle')
        page.wait_for_timeout(1000)
        print("📸 Capturing Scene 5: Switch Trust Guardrail Ledger...", flush=True)
        trust_btn = page.query_selector('button:has-text("Switch Trust:")')
        if trust_btn:
            trust_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=os.path.join(ASSETS_DIR, 'scene5_trust.png'))

        # 6. Click Approve Button & Capture Resolved State
        page.goto(TARGET_URL, wait_until='networkidle')
        page.wait_for_timeout(1000)
        print("📸 Capturing Scene 6: Human Sign-off & Hotfix Deployment...", flush=True)
        approve_btn = page.query_selector('button:has-text("Approve Fix & Deploy Hotfix")')
        if approve_btn:
            approve_btn.click()
            page.wait_for_timeout(1200)
            page.screenshot(path=os.path.join(ASSETS_DIR, 'scene6_resolved.png'))

        # 7. Open Post-Mortem Modal
        print("📸 Capturing Scene 7: Automated Blameless Post-Mortem...", flush=True)
        pm_btn = page.query_selector('button:has-text("Post-Mortem")')
        if pm_btn:
            pm_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=os.path.join(ASSETS_DIR, 'scene7_postmortem.png'))

        # 8. Open Switch Channels Integration Modal (fresh page)
        page.goto(TARGET_URL, wait_until='networkidle')
        page.wait_for_timeout(1000)
        print("📸 Capturing Scene 8: Switch Mesh Channels...", flush=True)
        chan_btn = page.query_selector('button:has-text("Switch Channels")')
        if chan_btn:
            chan_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=os.path.join(ASSETS_DIR, 'scene8_channels.png'))

        browser.close()
        print("✨ All screenshots captured successfully!", flush=True)

if __name__ == '__main__':
    capture_scenes()
