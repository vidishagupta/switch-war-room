import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

WIDTH = 1920
HEIGHT = 1080

def draw_gradient_background(draw, top_color, bottom_color):
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
        b = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

def create_intro():
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(11, 15, 25))
    draw = ImageDraw.Draw(img)
    draw_gradient_background(draw, (15, 23, 42), (8, 12, 22))

    # Glow orb effect
    draw.ellipse([WIDTH//2 - 400, 150, WIDTH//2 + 400, 750], fill=(79, 70, 229, 40))

    try:
        font_badge = ImageFont.truetype("arialbd.ttf", 24)
        font_title = ImageFont.truetype("arialbd.ttf", 72)
        font_sub = ImageFont.truetype("arial.ttf", 36)
        font_meta = ImageFont.truetype("arialbd.ttf", 28)
    except:
        font_badge = font_title = font_sub = font_meta = ImageFont.load_default()

    # Badge
    badge_text = "FLIP THE SWITCH HACKATHON • DEVTOOLS ACADEMY × WEMAKEDEVS"
    draw.rounded_rectangle([WIDTH//2 - 420, 260, WIDTH//2 + 420, 310], radius=15, fill=(49, 46, 129), outline=(99, 102, 241), width=2)
    draw.text((WIDTH//2, 285), badge_text, fill=(199, 210, 254), font=font_badge, anchor="mm")

    # Main Title
    draw.text((WIDTH//2, 420), "⚡ SwitchWarRoom", fill=(255, 255, 255), font=font_title, anchor="mm")
    draw.text((WIDTH//2, 510), "Autonomous Multi-Agent Incident Response & SRE Swarm", fill=(165, 180, 252), font=font_sub, anchor="mm")

    # Features Pill Row
    pills = ["🕵️ Forensic Triage", "🛠️ Automated Patching", "🛡️ Switch Trust Guardrails", "📋 Instant Post-Mortem"]
    pill_x = 240
    for p in pills:
        draw.rounded_rectangle([pill_x, 620, pill_x + 320, 680], radius=12, fill=(30, 41, 59), outline=(71, 85, 105), width=1)
        draw.text((pill_x + 160, 650), p, fill=(226, 232, 240), font=font_meta, anchor="mm")
        pill_x += 370

    # Footer attribution
    draw.text((WIDTH//2, 850), "Powered by Switch AI & SandboxAQ Switch Trust", fill=(148, 163, 184), font=font_meta, anchor="mm")

    img.save(os.path.join(ASSETS_DIR, 'scene0_intro.png'))
    print("✅ Created scene0_intro.png")

def create_outro():
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(11, 15, 25))
    draw = ImageDraw.Draw(img)
    draw_gradient_background(draw, (15, 23, 42), (8, 12, 22))

    try:
        font_badge = ImageFont.truetype("arialbd.ttf", 26)
        font_title = ImageFont.truetype("arialbd.ttf", 64)
        font_sub = ImageFont.truetype("arial.ttf", 34)
        font_link = ImageFont.truetype("arialbd.ttf", 32)
    except:
        font_badge = font_title = font_sub = font_link = ImageFont.load_default()

    # Badge
    draw.rounded_rectangle([WIDTH//2 - 280, 240, WIDTH//2 + 280, 295], radius=15, fill=(5, 150, 105), outline=(52, 211, 153), width=2)
    draw.text((WIDTH//2, 267), "DEPLOYED & OPEN SOURCE", fill=(255, 255, 255), font=font_badge, anchor="mm")

    # Title
    draw.text((WIDTH//2, 380), "Ready to Flip the Switch on AI Teammates?", fill=(255, 255, 255), font=font_title, anchor="mm")
    draw.text((WIDTH//2, 450), "Experience MTTR reduction from 45 minutes to 38 seconds", fill=(148, 163, 184), font=font_sub, anchor="mm")

    # Link Cards
    # Card 1: Live Demo
    draw.rounded_rectangle([320, 560, 920, 720], radius=16, fill=(30, 41, 59), outline=(99, 102, 241), width=2)
    draw.text((620, 600), "🌐 LIVE DEMO APPLICATION", fill=(129, 140, 248), font=font_badge, anchor="mm")
    draw.text((620, 660), "switch-war-room.vercel.app", fill=(255, 255, 255), font=font_link, anchor="mm")

    # Card 2: GitHub Repo
    draw.rounded_rectangle([1000, 560, 1600, 720], radius=16, fill=(30, 41, 59), outline=(52, 211, 153), width=2)
    draw.text((1300, 600), "⭐ GITHUB REPOSITORY", fill=(52, 211, 153), font=font_badge, anchor="mm")
    draw.text((1300, 660), "github.com/vidishagupta/switch-war-room", fill=(255, 255, 255), font=font_link, anchor="mm")

    # Footer
    draw.text((WIDTH//2, 860), "Thank you WeMakeDevs & DevTools Academy! ⚡", fill=(203, 213, 225), font=font_badge, anchor="mm")

    img.save(os.path.join(ASSETS_DIR, 'scene9_outro.png'))
    print("✅ Created scene9_outro.png")

if __name__ == '__main__':
    create_intro()
    create_outro()

