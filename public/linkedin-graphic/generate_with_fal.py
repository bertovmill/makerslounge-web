#!/usr/bin/env python3
"""
MakersLounge #8 x v0 — LinkedIn Graphic v6
MAKERS/LOUNGE both white, tightly stacked. PARTNER-SHIP all caps bold.
@makersloungeto handle. Event banner style.
"""

import os
import requests
import numpy as np
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from io import BytesIO

W, H = 1920, 1080
FONTS_DIR = "/Users/bertomill/.claude/plugins/cache/anthropic-agent-skills/example-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"
BASE_DIR = "/Users/bertomill/makerslounge-web/public/linkedin-graphic"
OUT = os.path.join(BASE_DIR, "makerslounge-v0-partnership-v6.png")

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS_DIR, name), size)

print("Loading assets...")
bg_img = Image.open(os.path.join(BASE_DIR, "fal-background.png")).convert("RGBA")
bg_img = bg_img.resize((W, H), Image.LANCZOS)

# === EVENT PHOTO — crop bottom 10% ===
event_photo = Image.open(os.path.expanduser("~/Downloads/makerslounge-8.png")).convert("RGBA")
crop_h = int(event_photo.height * 0.90)
event_photo = event_photo.crop((0, 0, event_photo.width, crop_h))

photo_target_h = H - 80
photo_target_w = int(event_photo.width * (photo_target_h / event_photo.height))
photo_target_w = min(photo_target_w, 820)
photo_target_h = int(event_photo.height * (photo_target_w / event_photo.width))
event_photo = event_photo.resize((photo_target_w, photo_target_h), Image.LANCZOS)

photo_x = W - photo_target_w - 55
photo_y = (H - photo_target_h) // 2

# Fade mask with numpy
fade_arr = np.full((photo_target_h, photo_target_w), 255, dtype=np.uint8)
fade_width = 220
for x in range(min(fade_width, photo_target_w)):
    fade_arr[:, x] = np.minimum(fade_arr[:, x], int(255 * (x / fade_width) ** 1.3))
for y in range(min(50, photo_target_h)):
    val = int(255 * (y / 50))
    fade_arr[y, :] = np.minimum(fade_arr[y, :], val)
    fade_arr[photo_target_h - 1 - y, :] = np.minimum(fade_arr[photo_target_h - 1 - y, :], val)

corner_mask = Image.new("L", (photo_target_w, photo_target_h), 255)
cmd = ImageDraw.Draw(corner_mask)
cmd.rounded_rectangle([(0, 0), (photo_target_w - 1, photo_target_h - 1)], radius=20, fill=255)
cmd.rectangle([(0, 0), (photo_target_w // 2, photo_target_h)], fill=255)
final_mask_arr = np.minimum(fade_arr, np.array(corner_mask))

photo_with_fade = event_photo.copy()
photo_with_fade.putalpha(Image.fromarray(final_mask_arr))

# Warm glow behind photo
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gcx = photo_x + photo_target_w // 2
gcy = photo_y + photo_target_h // 2
for r in range(300, 0, -2):
    opacity = int(10 * (1 - r / 300))
    gd.ellipse([gcx - r * 1.6, gcy - r, gcx + r * 1.6, gcy + r],
               fill=(207, 99, 75, opacity))
bg_img = Image.alpha_composite(bg_img, glow)
bg_img.paste(photo_with_fade, (photo_x, photo_y), photo_with_fade)

# === EFFECTS ===
# Coral light leak bottom-left
leak = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ld = ImageDraw.Draw(leak)
for r in range(400, 0, -2):
    op = int(6 * (1 - r / 400) ** 1.5)
    ld.ellipse([(-100 - r), (H - 200 - r), (-100 + r), (H - 200 + r)],
               fill=(207, 99, 75, op))
bg_img = Image.alpha_composite(bg_img, leak)

# Bokeh particles
particles = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ppd = ImageDraw.Draw(particles)
random.seed(42)
for _ in range(35):
    px = random.randint(100, W - 100)
    py = random.randint(80, H - 80)
    size = random.uniform(1.5, 4)
    if random.random() < 0.4:
        color = (232, 140, 100, random.randint(15, 50))
    elif random.random() < 0.6:
        color = (255, 255, 255, random.randint(10, 35))
    else:
        color = (120, 170, 255, random.randint(10, 30))
    ppd.ellipse([px - size, py - size, px + size, py + size], fill=color)
    if size > 2.5:
        for gr in range(int(size * 4), 0, -1):
            gop = max(0, color[3] // 4 - gr)
            ppd.ellipse([px - gr, py - gr, px + gr, py + gr],
                        fill=(color[0], color[1], color[2], gop))
bg_img = Image.alpha_composite(bg_img, particles)

# Light streak
streak = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(streak)
streak_y = 520
for x in range(200, W - 200):
    t = (x - 200) / (W - 400)
    intensity = math.exp(-((t - 0.45) ** 2) / 0.08) * 18
    if intensity > 1:
        sd.line([(x, streak_y - 1), (x, streak_y + 1)],
                fill=(255, 255, 255, int(intensity)))
bg_img = Image.alpha_composite(bg_img, streak)

# === DARKEN LEFT ===
text_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
tod = ImageDraw.Draw(text_overlay)
for x in range(W):
    if x < W * 0.5:
        alpha = int(175 * (1 - x / (W * 0.5)) ** 0.7)
    elif x < W * 0.65:
        t = (x - W * 0.5) / (W * 0.15)
        alpha = int(25 * (1 - t))
    else:
        alpha = 0
    tod.line([(x, 0), (x, H)], fill=(6, 7, 12, alpha))

overall = Image.new("RGBA", (W, H), (6, 7, 12, 30))
bg_img = Image.alpha_composite(bg_img, overall)
bg_img = Image.alpha_composite(bg_img, text_overlay)

# === LOGOS — pronounced ===
ml_logo = Image.open("/Users/bertomill/makerslounge-web/public/icon-512.png").convert("RGBA")
ml_logo = ml_logo.resize((160, 160), Image.LANCZOS)

v0_url = "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/vercel-v0-icon.png"
v0_resp = requests.get(v0_url)
v0_logo = Image.open(BytesIO(v0_resp.content)).convert("RGBA")
v0_arr = np.array(v0_logo)
mask = v0_arr[:, :, 3] > 50
v0_arr[mask, 0] = 255
v0_arr[mask, 1] = 255
v0_arr[mask, 2] = 255
v0_logo = Image.fromarray(v0_arr)
v0_logo = v0_logo.resize((150, 150), Image.LANCZOS)

# === TYPOGRAPHY ===
canvas = bg_img.copy()
draw = ImageDraw.Draw(canvas)

# The event banner uses a tight, bold condensed sans — BigShoulders is perfect for this
f_title = font("BigShoulders-Bold.ttf", 185)
f_partner = font("BigShoulders-Bold.ttf", 80)
f_body = font("InstrumentSans-Regular.ttf", 30)
f_x_font = font("InstrumentSans-Regular.ttf", 50)
f_mono = font("GeistMono-Regular.ttf", 18)
f_tag = font("InstrumentSans-Bold.ttf", 20)
f_handle = font("InstrumentSans-Bold.ttf", 18)

WHITE = (255, 255, 255)
WARM_WHITE = (252, 248, 244)
CORAL = (207, 99, 75)

# -- Logos with glow --
# Increased padding: ~90px from edges instead of ~70
logo_y = 60
logo_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
lgd = ImageDraw.Draw(logo_glow)
PAD = 90  # left/right/bottom padding
for r in range(60, 0, -2):
    op = int(5 * (1 - r / 60))
    lgd.ellipse([PAD + 75 - r, logo_y + 75 - r, PAD + 75 + r, logo_y + 75 + r],
                fill=(207, 99, 75, op))
canvas = Image.alpha_composite(canvas, logo_glow)
draw = ImageDraw.Draw(canvas)
canvas.paste(ml_logo, (PAD, logo_y), ml_logo)
draw.text((PAD + 168, logo_y + 42), "×", fill=(255, 255, 255, 150), font=f_x_font)
canvas.paste(v0_logo, (PAD + 225, logo_y + 5), v0_logo)

# -- MAKERS / LOUNGE — both white, exactly touching using pixel-perfect mask measurement --
ty = 235

# Render MAKERS to a temp image to find exact bottom pixel of ink
makers_tmp = Image.new("L", (900, 250), 0)
makers_tmp_draw = ImageDraw.Draw(makers_tmp)
makers_tmp_draw.text((0, 0), "MAKERS", fill=255, font=f_title)
makers_arr = np.array(makers_tmp)
# Find the actual last row with ink pixels
makers_rows = np.where(makers_arr.max(axis=1) > 0)[0]
makers_first_ink = makers_rows[0]
makers_last_ink = makers_rows[-1]
makers_ink_h = makers_last_ink - makers_first_ink + 1

# Same for LOUNGE
lounge_tmp = Image.new("L", (900, 250), 0)
lounge_tmp_draw = ImageDraw.Draw(lounge_tmp)
lounge_tmp_draw.text((0, 0), "LOUNGE", fill=255, font=f_title)
lounge_arr = np.array(lounge_tmp)
lounge_rows = np.where(lounge_arr.max(axis=1) > 0)[0]
lounge_first_ink = lounge_rows[0]

# Draw MAKERS
draw.text((PAD, ty), "MAKERS", fill=WHITE, font=f_title)

# LOUNGE exactly touching: position so lounge's first ink pixel is right after makers' last ink pixel
# ty + makers_last_ink = the y of the last ink row of MAKERS
# We want lounge drawn so its first ink row is at (ty + makers_last_ink + 1)
lounge_y = ty + makers_last_ink + 1 - lounge_first_ink - 4  # nudge 4px up
draw.text((PAD, lounge_y), "LOUNGE", fill=WHITE, font=f_title)

# -- #8: PARTNER-SHIP — all caps, bold, WHITE, with gap from LOUNGE --
lounge_last_ink = lounge_y + lounge_rows[-1]
partner_y = lounge_last_ink + 35  # visible gap between LOUNGE and PARTNER-SHIP
draw.text((PAD + 5, partner_y), "#8: PARTNER-SHIP", fill=WHITE, font=f_partner)

# -- Coral accent line --
accent = Image.new("RGBA", (W, H), (0, 0, 0, 0))
acd = ImageDraw.Draw(accent)
partner_bbox = f_partner.getbbox("#8: PARTNER-SHIP")
line_y = partner_y + partner_bbox[3] + 10
acd.line([(PAD + 5, line_y), (PAD + 550, line_y)], fill=(255, 255, 255, 150), width=3)
canvas = Image.alpha_composite(canvas, accent)
draw = ImageDraw.Draw(canvas)

# -- Stats --
draw.text((PAD + 5, line_y + 15), "40 makers    ·    20 pairs    ·    5 demos", fill=(255, 255, 255, 170), font=f_body)

# -- "Powered by v0 · Vercel" pill --
tag = Image.new("RGBA", (W, H), (0, 0, 0, 0))
td = ImageDraw.Draw(tag)
td.rounded_rectangle([(PAD, H - 115), (PAD + 300, H - 72)], radius=20, fill=(255, 255, 255, 22))
td.rounded_rectangle([(PAD, H - 115), (PAD + 300, H - 72)], radius=20, outline=(255, 255, 255, 15), width=1)
td.text((PAD + 22, H - 110), "POWERED BY V0 · VERCEL", fill=(255, 255, 255, 120), font=f_tag)
canvas = Image.alpha_composite(canvas, tag)
draw = ImageDraw.Draw(canvas)

# -- Bottom right: handle + site + location (with increased right padding) --
br_x = W - PAD - 210
draw.text((br_x, H - 115), "@makersloungeto", fill=(255, 255, 255, 100), font=f_handle)
draw.text((br_x, H - 89), "makerslounge.ca", fill=(255, 255, 255, 75), font=f_mono)
draw.text((br_x, H - 65), "TORONTO · MARCH 2026", fill=(255, 255, 255, 55), font=f_mono)

# === FILM GRAIN — only in the background/bottom-left area, not on text/logos/photo ===
# Apply grain to the background layer BEFORE compositing text/logos/photo
# We'll create a grain layer masked to the bottom-left dark area only
grain_noise = np.random.normal(loc=0, scale=14, size=(H, W)).astype(np.float32)

# Create a mask that fades grain out away from bottom-left corner
# and keeps it away from text/logo/photo regions
grain_mask = np.zeros((H, W), dtype=np.float32)
for y in range(H):
    for x in range(W):
        # Stronger in bottom-left, fading toward top-right
        x_factor = max(0, 1 - x / (W * 0.45))  # fade out past ~45% width
        y_factor = max(0, (y - H * 0.55) / (H * 0.45)) if y > H * 0.55 else 0  # only bottom 45%
        grain_mask[y, x] = x_factor * y_factor

# Apply masked grain
canvas_rgb = canvas.convert("RGB")
canvas_arr = np.array(canvas_rgb).astype(np.float32)
grain_applied = grain_noise * grain_mask
for c in range(3):
    canvas_arr[:, :, c] = np.clip(canvas_arr[:, :, c] + grain_applied, 0, 255)
final = Image.fromarray(canvas_arr.astype(np.uint8))
final.save(OUT, "PNG", quality=100)
print(f"\nDone! Saved: {OUT}")
print(f"Size: {W}x{H}")
