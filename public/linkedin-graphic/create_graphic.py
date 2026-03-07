#!/usr/bin/env python3
"""
MakersLounge #8 x v0 by Vercel — LinkedIn Partnership Announcement Graphic
Design Philosophy: Launchpad Kinetics — REFINED
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

W, H = 1920, 1080
FONTS_DIR = "/Users/bertomill/.claude/plugins/cache/anthropic-agent-skills/example-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"
OUT = "/Users/bertomill/makerslounge-web/public/linkedin-graphic/makerslounge-v0-partnership.png"

# Palette
BG = (10, 11, 16)
CORAL = (232, 107, 82)
WHITE = (255, 255, 255)
ELECTRIC = (70, 130, 255)

img = Image.new("RGBA", (W, H), BG)

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS_DIR, name), size)

f_display = font("BigShoulders-Bold.ttf", 92)
f_display_sm = font("BigShoulders-Bold.ttf", 56)
f_sans = font("InstrumentSans-Regular.ttf", 20)
f_sans_lg = font("InstrumentSans-Regular.ttf", 24)
f_sans_bold = font("InstrumentSans-Bold.ttf", 15)
f_mono = font("GeistMono-Regular.ttf", 13)
f_mono_sm = font("GeistMono-Regular.ttf", 11)
f_mono_bold = font("GeistMono-Bold.ttf", 13)
f_number = font("GeistMono-Bold.ttf", 52)

# === GRID ===
grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(grid)
for x in range(0, W, 80):
    gd.line([(x, 0), (x, H)], fill=(255, 255, 255, 6 if x % 240 == 0 else 3), width=1)
for y in range(0, H, 80):
    gd.line([(0, y), (W, y)], fill=(255, 255, 255, 6 if y % 240 == 0 else 3), width=1)
img = Image.alpha_composite(img, grid)

# === ORBITAL ARCS — thicker, more visible ===
arcs = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ad = ImageDraw.Draw(arcs)

# Convergence center
cx, cy = 1200, 460

# Arc 1: Coral — sweeps from bottom-left up to convergence
for i in range(800):
    t = i / 800.0
    x = 150 + t * 1500
    y = 950 - math.sin(t * math.pi * 0.85) * 600
    # Thicker arc with glow
    base_opacity = int(55 * math.sin(t * math.pi * 0.85))
    for r in range(5, 0, -1):
        op = max(0, base_opacity - r * 10)
        if op > 0:
            ad.ellipse([x-r, y-r, x+r, y+r], fill=(232, 107, 82, op))

# Arc 2: Electric blue — sweeps from top-left down to convergence
for i in range(800):
    t = i / 800.0
    x = 150 + t * 1500
    y = 100 + math.sin(t * math.pi * 0.85) * 500
    base_opacity = int(45 * math.sin(t * math.pi * 0.85))
    for r in range(4, 0, -1):
        op = max(0, base_opacity - r * 9)
        if op > 0:
            ad.ellipse([x-r, y-r, x+r, y+r], fill=(70, 130, 255, op))

# Convergence glow — layered radial gradient
for r in range(180, 0, -1):
    opacity = int(18 * (1 - r/180) ** 1.5)
    if opacity > 0:
        ad.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(232, 107, 82, opacity))
for r in range(80, 0, -1):
    opacity = int(15 * (1 - r/80) ** 1.5)
    if opacity > 0:
        ad.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 255, 255, opacity))

# Bright convergence dot
for r in range(6, 0, -1):
    ad.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 255, 255, 30 + (6-r)*15))

# Orbital dots along arcs — data points
for i in range(30):
    t = i / 30.0
    if 0.15 < t < 0.95:
        x1 = 150 + t * 1500
        y1 = 950 - math.sin(t * math.pi * 0.85) * 600
        x2 = 150 + t * 1500
        y2 = 100 + math.sin(t * math.pi * 0.85) * 500
        ad.ellipse([x1-2, y1-2, x1+3, y1+3], fill=(232, 107, 82, 80))
        ad.ellipse([x2-2, y2-2, x2+3, y2+3], fill=(70, 130, 255, 60))

img = Image.alpha_composite(img, arcs)

# === GEOMETRIC MARKERS ===
marks = Image.new("RGBA", (W, H), (0, 0, 0, 0))
md = ImageDraw.Draw(marks)

# Cross markers
crosses = [
    (180, 200), (350, 130), (520, 280), (700, 170),
    (1500, 280), (1620, 170), (1720, 380), (1800, 240),
    (420, 820), (620, 870), (850, 920), (1050, 840),
    (1400, 700), (1550, 780), (1700, 650),
]
for mx, my in crosses:
    s = 5
    md.line([(mx-s, my), (mx+s, my)], fill=(255, 255, 255, 20), width=1)
    md.line([(mx, my-s), (mx, my+s)], fill=(255, 255, 255, 20), width=1)

# Reference circles
for rx, ry in [(280, 500), (460, 640), (1650, 580), (1520, 730), (1100, 300)]:
    md.ellipse([rx-3, ry-3, rx+3, ry+3], outline=(255, 255, 255, 25), width=1)

# Dashed connection lines from convergence point
for angle_deg in [30, 150, -45, -120]:
    angle = math.radians(angle_deg)
    for d in range(50, 200, 6):
        x = cx + d * math.cos(angle)
        y = cy + d * math.sin(angle)
        if 30 < x < W-30 and 30 < y < H-30:
            md.point((int(x), int(y)), fill=(255, 255, 255, 12))

img = Image.alpha_composite(img, marks)
draw = ImageDraw.Draw(img)

# === LEFT ACCENT LINES — paired vertical strokes ===
accent = Image.new("RGBA", (W, H), (0, 0, 0, 0))
acd = ImageDraw.Draw(accent)
for y in range(170, 750):
    t = (y - 170) / 580.0
    op_coral = int(30 * math.sin(t * math.pi))
    op_blue = int(22 * math.sin(t * math.pi))
    acd.point((56, y), fill=(232, 107, 82, op_coral))
    acd.point((57, y), fill=(232, 107, 82, max(0, op_coral - 10)))
    acd.point((50, y), fill=(70, 130, 255, op_blue))
img = Image.alpha_composite(img, accent)
draw = ImageDraw.Draw(img)

# === TYPOGRAPHY ===

# Top-left event designator
draw.text((80, 52), "EVENT  //  008", fill=(255, 255, 255, 130), font=f_mono)
draw.text((80, 72), "2026.03.02  —  TORONTO", fill=(255, 255, 255, 60), font=f_mono_sm)
draw.line([(80, 95), (300, 95)], fill=(255, 255, 255, 30), width=1)

# Main title
ty = 160
draw.text((80, ty), "MAKERS", fill=WHITE, font=f_display)
draw.text((80, ty + 95), "LOUNGE", fill=CORAL, font=f_display)

# Partnership connector
draw.text((80, ty + 205), "×", fill=(255, 255, 255, 90), font=f_display_sm)
draw.text((125, ty + 205), "v0", fill=WHITE, font=f_display_sm)
draw.text((215, ty + 222), "by Vercel", fill=(255, 255, 255, 130), font=f_sans_lg)

# Theme divider + label
draw.line([(80, ty + 280), (500, ty + 280)], fill=(232, 107, 82, 50), width=1)
draw.text((80, ty + 295), "PARTNER-SHIP", fill=(232, 107, 82, 200), font=f_sans_bold)
draw.text((225, ty + 296), "—  SHIP SOMETHING WITH SOMEONE YOU CARE ABOUT", fill=(255, 255, 255, 80), font=f_mono_sm)

# === METRICS ===
my = 770
draw.line([(80, my - 10), (480, my - 10)], fill=(255, 255, 255, 20), width=1)

def metric(x, y, num, label, color=WHITE):
    draw.text((x, y), num, fill=color, font=f_number)
    draw.text((x, y + 58), label, fill=(255, 255, 255, 80), font=f_mono_sm)

metric(80, my, "40", "MAKERS")
metric(215, my, "20", "PAIRS")
metric(350, my, "05", "DEMOS", CORAL)

draw.line([(80, my + 88), (480, my + 88)], fill=(255, 255, 255, 20), width=1)
draw.text((80, my + 102), "FROM IDEA TO LIVE APP IN UNDER 2 HOURS", fill=(255, 255, 255, 55), font=f_mono_sm)

# === RIGHT SIDE LABELS ===
# Near convergence
draw.text((cx - 55, cy - 170), "CONVERGENCE", fill=(255, 255, 255, 45), font=f_mono_sm)
draw.line([(cx - 55, cy - 155), (cx + 45, cy - 155)], fill=(255, 255, 255, 18), width=1)

# "SHIP" label with arrow below convergence
draw.text((cx - 15, cy + 55), "SHIP  ▲", fill=(232, 107, 82, 90), font=f_mono_bold)

# Right-side vertical text-like labels
draw.text((1700, 80), "v0.DEV", fill=(255, 255, 255, 40), font=f_mono_sm)
draw.text((1700, 96), "VERCEL", fill=(255, 255, 255, 30), font=f_mono_sm)

# Bottom-right event number
draw.text((1760, 940), "008", fill=(255, 255, 255, 35), font=font("GeistMono-Regular.ttf", 32))
draw.text((1760, 978), "TORONTO", fill=(255, 255, 255, 25), font=f_mono_sm)

# === CORNER BRACKETS ===
final = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fd = ImageDraw.Draw(final)
bs = 22
bc = (255, 255, 255, 22)
# TL
fd.line([(28, 28), (28, 28+bs)], fill=bc, width=1)
fd.line([(28, 28), (28+bs, 28)], fill=bc, width=1)
# TR
fd.line([(W-28, 28), (W-28, 28+bs)], fill=bc, width=1)
fd.line([(W-28, 28), (W-28-bs, 28)], fill=bc, width=1)
# BL
fd.line([(28, H-28), (28, H-28-bs)], fill=bc, width=1)
fd.line([(28, H-28), (28+bs, H-28)], fill=bc, width=1)
# BR
fd.line([(W-28, H-28), (W-28, H-28-bs)], fill=bc, width=1)
fd.line([(W-28, H-28), (W-28-bs, H-28)], fill=bc, width=1)

img = Image.alpha_composite(img, final)

# Flatten and save
img.convert("RGB").save(OUT, "PNG", quality=100)
print(f"Saved: {OUT} ({W}x{H})")
