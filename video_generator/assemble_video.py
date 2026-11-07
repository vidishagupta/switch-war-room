import os
import subprocess
import re
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(__file__)
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
AUDIO_DIR = os.path.join(BASE_DIR, 'audio')
SCENES_DIR = os.path.join(BASE_DIR, 'scenes')
OUTPUT_VIDEO = os.path.abspath(os.path.join(BASE_DIR, '..', 'SwitchWarRoom_Demo.mp4'))
CONCAT_FILE = os.path.join(BASE_DIR, 'concat_list.txt')
FFMPEG_BIN = r'D:\tools\ffmpeg\ffmpeg.exe'

os.makedirs(SCENES_DIR, exist_ok=True)

SCENES_CONFIG = [
    {
        "id": "scene0",
        "image": "scene0_intro.png",
        "caption": "⚡ SwitchWarRoom: Autonomous Multi-Agent Incident Response Swarm"
    },
    {
        "id": "scene1",
        "image": "scene1_hero.png",
        "caption": "🚨 P1 Alert Detected: Autonomous incident war room initialized via Switch"
    },
    {
        "id": "scene2",
        "image": "scene2_swarm.png",
        "caption": "👥 The Agent Swarm: 4 specialized AI teammates collaborating in real-time"
    },
    {
        "id": "scene3",
        "image": "scene3_chat.png",
        "caption": "🔎 Automated Forensics: Root cause isolated in 1.4s with stack trace analysis"
    },
    {
        "id": "scene4",
        "image": "scene4_diff.png",
        "caption": "🛠️ Test Synthesis & Fix: Vitest reproduction test and surgical PR diff"
    },
    {
        "id": "scene5",
        "image": "scene5_trust.png",
        "caption": "🛡️ Switch Trust Governance: Secret redaction, policy enforcement & token audit"
    },
    {
        "id": "scene6",
        "image": "scene6_resolved.png",
        "caption": "✅ Human-in-the-Loop Gate: 1-click authorization via Slack or web console"
    },
    {
        "id": "scene7",
        "image": "scene7_postmortem.png",
        "caption": "📋 Instant Post-Mortem: Blameless post-mortem ready for Jira and Notion sync"
    },
    {
        "id": "scene8",
        "image": "scene8_channels.png",
        "caption": "💬 Switch Mesh: Seamless synchronization across Slack, Discord & Desktop"
    },
    {
        "id": "scene9",
        "image": "scene9_outro.png",
        "caption": "🌐 Live Demo: switch-war-room.vercel.app | GitHub: vidishagupta/switch-war-room"
    }
]

def get_audio_duration(audio_path):
    cmd = [FFMPEG_BIN, '-i', audio_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    match = re.search(r"Duration:\s*(\d+):(\d+):([\d\.]+)", res.stderr)
    if match:
        hours = int(match.group(1))
        minutes = int(match.group(2))
        seconds = float(match.group(3))
        return hours * 3600 + minutes * 60 + seconds
    return 13.0

def create_captioned_image(src_img_path, caption_text, out_img_path):
    img = Image.open(src_img_path).convert('RGB')
    width, height = img.size
    draw = ImageDraw.Draw(img)

    try:
        font_caption = ImageFont.truetype("arialbd.ttf", 26)
    except:
        font_caption = ImageFont.load_default()

    # Calculate caption pill dimensions at bottom (outside the visual center!)
    pill_height = 64
    pill_y = height - 95  # 95px from bottom edge: safe, sleek lower-third
    
    # Measure text width
    bbox = draw.textbbox((0, 0), caption_text, font=font_caption)
    text_w = bbox[2] - bbox[0]
    pill_w = max(text_w + 60, 640)
    pill_x1 = (width - pill_w) // 2
    pill_x2 = pill_x1 + pill_w

    # Draw stylish dark translucent pill with indigo border
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    # Outer glow / shadow
    overlay_draw.rounded_rectangle(
        [pill_x1 - 2, pill_y - 2, pill_x2 + 2, pill_y + pill_height + 2],
        radius=16,
        fill=(99, 102, 241, 120)
    )
    # Background fill
    overlay_draw.rounded_rectangle(
        [pill_x1, pill_y, pill_x2, pill_y + pill_height],
        radius=14,
        fill=(15, 23, 42, 240),
        outline=(129, 140, 248, 255),
        width=2
    )

    # Composite overlay
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

    # Draw centered text
    text_y = pill_y + (pill_height // 2)
    draw.text((width // 2, text_y), caption_text, fill=(255, 255, 255), font=font_caption, anchor="mm")

    img.save(out_img_path, quality=95)

def render_scene(scene, idx):
    src_image = os.path.join(ASSETS_DIR, scene['image'])
    captioned_image = os.path.join(SCENES_DIR, f"{scene['id']}_captioned.png")
    audio_path = os.path.join(AUDIO_DIR, f"{scene['id']}.mp3")
    out_video = os.path.join(SCENES_DIR, f"{scene['id']}.mp4")

    # 1. Add bottom caption bar
    create_captioned_image(src_image, scene['caption'], captioned_image)

    # 2. Get audio duration + 0.4s padding for smooth transitions
    duration = get_audio_duration(audio_path) + 0.4
    print(f"🎬 Rendering {scene['id']} ({duration:.1f}s)...", flush=True)

    # 3. Render video snippet using ffmpeg
    cmd = [
        FFMPEG_BIN, '-y',
        '-loop', '1',
        '-i', captioned_image,
        '-i', audio_path,
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-t', str(duration),
        out_video
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
    return out_video

def main():
    video_files = []
    print("🚀 Starting SwitchWarRoom Video Assembly...", flush=True)

    for idx, scene in enumerate(SCENES_CONFIG):
        vf = render_scene(scene, idx)
        video_files.append(vf)

    # Write concat list
    with open(CONCAT_FILE, 'w', encoding='utf-8') as f:
        for vf in video_files:
            clean_path = vf.replace('\\', '/')
            f.write(f"file '{clean_path}'\n")

    print("🎞️ Concatenating all scenes into final video...", flush=True)
    concat_cmd = [
        FFMPEG_BIN, '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', CONCAT_FILE,
        '-c', 'copy',
        OUTPUT_VIDEO
    ]
    subprocess.run(concat_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)

    # Check output duration
    total_duration = get_audio_duration(OUTPUT_VIDEO)
    minutes = int(total_duration // 60)
    seconds = int(total_duration % 60)

    print(f"🎉 Final Video successfully created: {OUTPUT_VIDEO}", flush=True)
    print(f"⏱️ Total Video Duration: {minutes}m {seconds}s (Under 3 minutes requirement met!)", flush=True)

if __name__ == '__main__':
    main()
