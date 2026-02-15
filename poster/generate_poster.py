#!/usr/bin/env python3
"""
MakersLounge 36x48 inch booth poster — v7.
Rich gradient cards with grain texture, inspired by AceEternityUI WobbleCards.
"""

import os
import io
import math
import random
import qrcode
from PIL import Image as PILImage, ImageFilter, ImageEnhance, ImageDraw

from reportlab.lib.units import inch
from reportlab.lib.colors import Color, HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

# ── Dimensions ──────────────────────────────────────────────
W = 36 * inch
H = 48 * inch

# ── Colors ──────────────────────────────────────────────────
BG       = HexColor("#FAFAF9")
BLUE     = HexColor("#0066FF")
TEAL     = HexColor("#00B8C4")
ORANGE   = HexColor("#FF9500")
YELLOW   = HexColor("#FFDD00")
CORAL    = HexColor("#E54B4B")
DARK     = HexColor("#1D1B2E")
MUTED    = HexColor("#94918A")
WHITE    = HexColor("#FFFFFF")
BORDER   = HexColor("#E8E7E5")

L_CORAL  = HexColor("#F08080")
L_TEAL   = HexColor("#7ECDC0")
L_PEACH  = HexColor("#F5C5A3")

GRAD = [BLUE, TEAL, ORANGE, YELLOW]

# Rich gradient palettes for cards (top → bottom)
GRAD_BLUE = [HexColor("#1A44AA"), HexColor("#0055DD"), HexColor("#2266EE"), HexColor("#0044BB")]
GRAD_TEAL = [HexColor("#006E7A"), HexColor("#009AAA"), HexColor("#1ABBCC"), HexColor("#007888")]
GRAD_ORANGE = [HexColor("#AA6200"), HexColor("#DD7E00"), HexColor("#EE9922"), HexColor("#BB7000")]

# ── Fonts ───────────────────────────────────────────────────
FD = "/Users/bertomill/.claude/plugins/cache/anthropic-agent-skills/example-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"
pdfmetrics.registerFont(TTFont("BricolageGrotesque-Bold", os.path.join(FD, "BricolageGrotesque-Bold.ttf")))
pdfmetrics.registerFont(TTFont("InstrumentSans", os.path.join(FD, "InstrumentSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("InstrumentSans-Bold", os.path.join(FD, "InstrumentSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("GeistMono", os.path.join(FD, "GeistMono-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Outfit-Bold", os.path.join(FD, "Outfit-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Outfit", os.path.join(FD, "Outfit-Regular.ttf")))

# ── Helpers ─────────────────────────────────────────────────

def rrect(c, x, y, w, h, r, fill=None, stroke=None, sw=0, alpha=1.0):
    c.saveState()
    fc = fill
    if alpha < 1.0 and fc:
        fc = Color(fc.red, fc.green, fc.blue, alpha)
    if fc: c.setFillColor(fc)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(sw)
    p = c.beginPath()
    p.roundRect(x, y, w, h, r)
    c.drawPath(p, fill=1 if fc else 0, stroke=1 if stroke else 0)
    c.restoreState()


def make_organic_band(w_px, h_px, blur_r=25):
    """Create an organic gradient band with overlapping radial blobs.
    Simulates a frozen frame of the BackgroundGradientAnimation effect.
    Uses the MakersLounge brand colors (blue, teal, orange, yellow).
    """
    img = PILImage.new("RGB", (w_px, h_px), (0, 40, 120))

    # Blob definitions: (cx_frac, cy_frac, radius_frac, r, g, b, alpha)
    blobs = [
        # Blue blobs
        (0.05, 0.5, 0.45, 0, 102, 255, 255),
        (0.22, 0.3, 0.35, 20, 80, 220, 200),
        # Teal/cyan blobs
        (0.30, 0.7, 0.40, 0, 184, 196, 230),
        (0.45, 0.4, 0.35, 0, 160, 210, 200),
        # Transition blob
        (0.55, 0.6, 0.30, 80, 200, 180, 180),
        # Orange blobs
        (0.65, 0.5, 0.40, 255, 149, 0, 240),
        (0.72, 0.3, 0.30, 230, 120, 20, 200),
        # Yellow/gold blobs
        (0.85, 0.5, 0.45, 255, 210, 0, 250),
        (0.95, 0.6, 0.35, 255, 180, 20, 220),
        # Accent blobs for organic feel
        (0.15, 0.8, 0.25, 60, 140, 255, 150),
        (0.50, 0.2, 0.28, 0, 200, 180, 160),
        (0.78, 0.8, 0.28, 255, 170, 50, 180),
    ]

    overlay = PILImage.new("RGBA", (w_px, h_px), (0, 0, 0, 0))

    for cx_f, cy_f, rad_f, r_c, g_c, b_c, peak_a in blobs:
        layer = PILImage.new("RGBA", (w_px, h_px), (0, 0, 0, 0))
        lpx = layer.load()
        cx = int(cx_f * w_px)
        cy = int(cy_f * h_px)
        max_r = rad_f * max(w_px, h_px)

        for yy in range(h_px):
            for xx in range(w_px):
                d = math.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
                if d < max_r:
                    t = 1.0 - (d / max_r)
                    t = t * t * (3 - 2 * t)  # smoothstep
                    a = int(peak_a * t)
                    lpx[xx, yy] = (r_c, g_c, b_c, a)

        overlay = PILImage.alpha_composite(overlay, layer)

    # Composite overlay onto base
    base = img.convert("RGBA")
    result = PILImage.alpha_composite(base, overlay)

    # Heavy blur for that soft, flowing look
    result = result.filter(ImageFilter.GaussianBlur(radius=blur_r))

    return result


def draw_organic_band(c, x, y, w, h, band_img):
    """Draw a pre-generated organic gradient band on the canvas."""
    buf = io.BytesIO()
    band_img.save(buf, format="PNG")
    buf.seek(0)
    c.drawImage(ImageReader(buf), x, y, w, h, mask='auto')


def prepare_photo(path, target_aspect=3.2, brightness=1.25, corner_r=40):
    """Load a photo, crop to landscape strip focusing on people, brighten, round corners."""
    img = PILImage.open(path).convert("RGBA")
    w, h = img.size

    # Crop to target aspect ratio, focusing on center-bottom (people, not ceiling)
    target_h = int(w / target_aspect)
    if target_h < h:
        # Crop from center-bottom: take bottom 65% as center of crop
        center_y = int(h * 0.55)
        top = max(0, center_y - target_h // 2)
        bottom = top + target_h
        if bottom > h:
            bottom = h
            top = bottom - target_h
        img = img.crop((0, top, w, bottom))

    # Brighten for print
    rgb = img.convert("RGB")
    enhancer = ImageEnhance.Brightness(rgb)
    rgb = enhancer.enhance(brightness)
    # Slight contrast boost
    enhancer = ImageEnhance.Contrast(rgb)
    rgb = enhancer.enhance(1.1)
    img = rgb.convert("RGBA")

    # Round corners with alpha mask
    w, h = img.size
    mask = PILImage.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, w, h], radius=corner_r, fill=255)
    img.putalpha(mask)

    return img


def grad_bar(c, x, y, w, h, colors):
    n = max(int(w / 2), 200)
    sw = w / n
    nc = len(colors)
    c.saveState()
    for i in range(n):
        t = i / max(n - 1, 1)
        st = t * (nc - 1)
        idx = min(int(st), nc - 2)
        lt = st - idx
        a, b = colors[idx], colors[idx + 1]
        c.setFillColor(Color(
            a.red + (b.red - a.red) * lt,
            a.green + (b.green - a.green) * lt,
            a.blue + (b.blue - a.blue) * lt))
        c.rect(x + i * sw, y, sw + 1, h, fill=1, stroke=0)
    c.restoreState()


def grad_card(c, x, y, w, h, r, colors):
    """Draw a vertical gradient (top→bottom) clipped to a rounded rect."""
    c.saveState()
    p = c.beginPath()
    p.roundRect(x, y, w, h, r)
    c.clipPath(p, stroke=0)

    n = max(int(h / 2), 150)
    sh = h / n
    nc = len(colors)

    for i in range(n):
        t = i / max(n - 1, 1)
        st = t * (nc - 1)
        idx = min(int(st), nc - 2)
        lt = st - idx
        a, b = colors[idx], colors[idx + 1]
        c.setFillColor(Color(
            a.red + (b.red - a.red) * lt,
            a.green + (b.green - a.green) * lt,
            a.blue + (b.blue - a.blue) * lt))
        # Draw from top down
        c.rect(x, y + h - (i + 1) * sh, w, sh + 1, fill=1, stroke=0)

    c.restoreState()


def make_grain(w_px, h_px, intensity=30, seed=42):
    """Create a light film grain texture as a PIL RGBA image (white specks)."""
    random.seed(seed)
    pixels = []
    for _ in range(w_px * h_px):
        # Light/white grain — bright pixels with subtle alpha
        v = random.randint(230, 255)
        a = random.randint(0, intensity)
        pixels.extend([v, v, v, a])
    img = PILImage.frombytes("RGBA", (w_px, h_px), bytes(pixels))
    return img


def make_radial_glow(w_px, h_px, cx_frac, cy_frac, radius_frac, brightness=220, peak_alpha=90, seed=0):
    """Create a radial glow highlight as a PIL RGBA image.
    cx_frac, cy_frac: center of glow as fraction of dimensions (0-1).
    radius_frac: radius as fraction of max(w,h).
    """
    img = PILImage.new("RGBA", (w_px, h_px), (0, 0, 0, 0))
    px = img.load()
    cx = int(cx_frac * w_px)
    cy = int(cy_frac * h_px)
    max_r = radius_frac * max(w_px, h_px)

    for yy in range(h_px):
        for xx in range(w_px):
            d = math.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
            if d < max_r:
                t = 1.0 - (d / max_r)
                # Smooth falloff (ease-out cubic)
                t = t * t * (3 - 2 * t)
                a = int(peak_alpha * t)
                px[xx, yy] = (brightness, brightness, brightness, a)
    return img


def make_background_gradient(w_px, h_px, blur_radius=40):
    """Create an AceEternityUI-style multi-radial background gradient.
    Four radial color sources at corners, composited and blurred.
    Colors from the CSS: teal (BL), purple (TR), gold (BR), blue (TL).
    """
    # Use RGBA so we get nice compositing
    img = PILImage.new("RGBA", (w_px, h_px), (0, 0, 0, 0))

    # Radial gradient sources: (cx_frac, cy_frac, color_rgb, radius_frac, peak_alpha)
    sources = [
        (0.0, 1.0, (0, 204, 177), 0.90, 150),    # bottom-left: teal #00ccb1
        (1.0, 0.0, (123, 97, 255), 0.90, 130),    # top-right: purple #7b61ff
        (1.0, 1.0, (255, 196, 20), 0.80, 140),    # bottom-right: gold #ffc414
        (0.0, 0.0, (28, 160, 251), 0.90, 150),    # top-left: blue #1ca0fb
    ]

    for cx_f, cy_f, (r_c, g_c, b_c), rad_f, peak_a in sources:
        layer = PILImage.new("RGBA", (w_px, h_px), (0, 0, 0, 0))
        lpx = layer.load()
        cx = int(cx_f * w_px)
        cy = int(cy_f * h_px)
        max_r = rad_f * max(w_px, h_px)

        for yy in range(h_px):
            for xx in range(w_px):
                d = math.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
                if d < max_r:
                    t = 1.0 - (d / max_r)
                    t = t * t  # quadratic falloff
                    a = int(peak_a * t)
                    lpx[xx, yy] = (r_c, g_c, b_c, a)

        img = PILImage.alpha_composite(img, layer)

    # Apply gaussian blur for the soft glow
    img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    return img


def grain_overlay(c, x, y, w, h, r, grain_img):
    """Draw a grain texture overlay clipped to a rounded rect."""
    c.saveState()
    p = c.beginPath()
    p.roundRect(x, y, w, h, r)
    c.clipPath(p, stroke=0)

    buf = io.BytesIO()
    grain_img.save(buf, format="PNG")
    buf.seek(0)
    c.drawImage(ImageReader(buf), x, y, w, h, mask='auto')
    c.restoreState()


def logo_icon(c, cx, cy, size):
    cr = size * 0.22
    off = size * 0.28
    sq = size * 0.65
    rrect(c, cx - off, cy - off, sq, sq, cr, fill=L_CORAL, alpha=0.9)
    rrect(c, cx - sq * 0.15, cy + off * 0.3, sq, sq, cr, fill=L_TEAL, alpha=0.85)
    rrect(c, cx + off * 0.5, cy - off * 0.2, sq, sq, cr, fill=L_PEACH, alpha=0.85)


def make_qr(url, px=1000):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=30, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1D1B2E", back_color="#FFFFFF")
    return img.resize((px, px), PILImage.LANCZOS)


def ctxt(c, text, font, size, y):
    c.setFont(font, size)
    c.drawString((W - c.stringWidth(text, font, size)) / 2, y, text)


# ── Poster ──────────────────────────────────────────────────

def create_poster():
    out = os.path.join(os.path.dirname(__file__), "MakersLounge_Booth_Poster_36x48.pdf")
    c = canvas.Canvas(out, pagesize=(W, H))
    M = 2.0 * inch
    CW = W - 2 * M

    # ── Background ──
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Background forms ──
    s1 = 16 * inch
    rrect(c, W * 0.25, H * 0.22, s1, s1, s1 * 0.18, fill=L_TEAL, alpha=0.07)
    rrect(c, W * 0.05, H * 0.15, s1, s1, s1 * 0.18, fill=L_PEACH, alpha=0.06)
    rrect(c, W * 0.40, H * 0.08, s1, s1, s1 * 0.18, fill=L_CORAL, alpha=0.05)
    s2 = 9 * inch
    rrect(c, -3 * inch, -2 * inch, s2, s2, s2 * 0.18, fill=L_CORAL, alpha=0.06)

    # ════════════════════════════════════════
    TOP_BAND = 0.7 * inch
    BOT_BAND = 2.5 * inch

    # Generate organic gradient bands (AceEternityUI-style flowing blobs)
    print("  Generating organic gradient bands...")
    top_band_img = make_organic_band(800, 40, blur_r=12)
    bot_band_img = make_organic_band(800, 120, blur_r=20)

    draw_organic_band(c, 0, H - TOP_BAND, W, TOP_BAND, top_band_img)

    # ════════════════════════════════════════
    # LOGO
    # ════════════════════════════════════════
    y = H - 2.8 * inch
    icon_sz = 2.4 * inch
    ix = M + icon_sz * 0.4
    iy = y - icon_sz * 0.08
    logo_icon(c, ix, iy, icon_sz)

    lx = ix + icon_sz * 0.6 + 0.3 * inch
    ly = iy + icon_sz * 0.04
    c.setFont("Outfit-Bold", 115)
    c.setFillColor(DARK)
    c.drawString(lx, ly, "Makers Lounge")

    # ════════════════════════════════════════
    # HEADLINE
    # ════════════════════════════════════════
    y = H - 6.5 * inch
    HL = 180
    LH = 210

    c.setFont("Outfit-Bold", HL)
    c.setFillColor(DARK)
    c.drawString(M, y, "We help makers in their")
    y -= LH
    c.setFillColor(CORAL)
    bj = "building journey"
    c.drawString(M, y, bj)

    # What we offer — compact bullet list
    y -= 1.6 * inch
    bullet_items = [
        "Monthly events: pitch nights, skills matchmaking & more",
        "AI-powered matching platform",
        "AI workshops",
        "Weekly newsletter & other tools",
    ]
    c.setFont("InstrumentSans", 40)
    c.setFillColor(MUTED)
    for item in bullet_items:
        c.drawString(M + 10, y, "\u2022  " + item)
        y -= 56

    # ════════════════════════════════════════
    # GROUP PHOTO
    # ════════════════════════════════════════
    y -= 0.6 * inch
    print("  Processing group photo...")
    photo_path = os.path.join(os.path.dirname(__file__),
                              "..", "public", "dba5992d-1304-4369-9497-02c9b26fb855.png")
    photo_img = prepare_photo(photo_path, target_aspect=3.2, brightness=1.3, corner_r=60)
    photo_w = CW
    photo_h = CW / 3.2  # match the crop aspect ratio
    photo_y = y - photo_h

    photo_buf = io.BytesIO()
    photo_img.save(photo_buf, format="PNG")
    photo_buf.seek(0)
    c.drawImage(ImageReader(photo_buf), M, photo_y, photo_w, photo_h, mask='auto')

    y = photo_y

    # ════════════════════════════════════════
    # VALUE PROPS — rich gradient cards with grain
    # ════════════════════════════════════════
    y -= 1.6 * inch

    c.setFont("GeistMono", 32)
    c.setFillColor(MUTED)
    c.drawString(M, y, "HOW IT WORKS")

    y -= 1.0 * inch

    props = [
        ("Make", "Bring your project\nor start one\nwith us", GRAD_BLUE),
        ("Share", "Demo or share your\nproject to get\nfeedback & support", GRAD_TEAL),
        ("Connect", "Meet other makers\nand get AI-powered\nmatches", GRAD_ORANGE),
    ]

    gap = 0.55 * inch
    cw = (CW - 2 * gap) / 3
    ch = 6.0 * inch
    pad = 0.8 * inch
    card_r = 30

    # Pre-generate grain textures (light white specks)
    print("  Generating grain textures...")
    grains = [make_grain(300, 500, intensity=25, seed=40 + i) for i in range(3)]

    # Radial glow positions per card — organic highlight spots
    # (cx_frac, cy_frac, radius_frac, brightness, peak_alpha)
    glow_specs = [
        (0.75, 0.20, 0.70, 255, 110),  # Blue: upper-right glow
        (0.30, 0.30, 0.65, 245, 100),  # Teal: center-left glow
        (0.65, 0.18, 0.60, 255, 115),  # Orange: upper-right glow
    ]
    print("  Generating radial glows...")
    glows = [make_radial_glow(300, 500, *spec) for spec in glow_specs]

    for i, (heading, desc, grad_colors) in enumerate(props):
        cx = M + i * (cw + gap)
        cy = y - ch

        # Rich gradient fill
        grad_card(c, cx, cy, cw, ch, card_r, grad_colors)

        # Radial glow overlay — organic highlight
        grain_overlay(c, cx, cy, cw, ch, card_r, glows[i])

        # Light grain overlay — white specks
        grain_overlay(c, cx, cy, cw, ch, card_r, grains[i])

        # Card content clipped to rounded rect
        c.saveState()
        p = c.beginPath()
        p.roundRect(cx, cy, cw, ch, card_r)
        c.clipPath(p, stroke=0)

        # Heading — large bold white
        c.setFont("Outfit-Bold", 105)
        c.setFillColor(WHITE)
        c.drawString(cx + pad, cy + ch - pad - 0.8 * inch, heading)

        # Description — smaller white
        c.setFont("InstrumentSans", 46)
        c.setFillColor(Color(1, 1, 1, 0.85))
        ty = cy + ch - pad - 2.2 * inch
        for tl in desc.split("\n"):
            c.drawString(cx + pad, ty, tl)
            ty -= 54

        c.restoreState()

    # ════════════════════════════════════════
    # CTA + QR
    # ════════════════════════════════════════
    y = y - ch - 2.0 * inch

    # CTA text with subtle shadow
    cta = "Join for free - scan to start"
    c.setFont("Outfit-Bold", 80)
    # Shadow pass
    c.setFillColor(Color(0, 0, 0, 0.08))
    ctxt(c, cta, "Outfit-Bold", 80, y - 4)
    # Main text
    c.setFillColor(CORAL)
    ctxt(c, cta, "Outfit-Bold", 80, y)

    # QR — 9 inches (big and easy to scan), no card background
    y -= 1.0 * inch
    qr_sz = 9.0 * inch
    qr_img = make_qr("https://makerslounge.ca")
    buf = io.BytesIO()
    qr_img.save(buf, format="PNG")
    buf.seek(0)
    qr_r = ImageReader(buf)

    qr_x = (W - qr_sz) / 2
    qr_y = y - qr_sz

    # Subtle shadow behind QR
    c.saveState()
    c.setFillColor(Color(0, 0, 0, 0.06))
    c.rect(qr_x + 6, qr_y - 6, qr_sz, qr_sz, fill=1, stroke=0)
    c.restoreState()

    c.drawImage(qr_r, qr_x, qr_y, qr_sz, qr_sz, mask='auto')

    # ════════════════════════════════════════
    # BOTTOM BAND
    # ════════════════════════════════════════
    draw_organic_band(c, 0, 0, W, BOT_BAND, bot_band_img)

    c.setFillColor(WHITE)
    row1 = "X @makersloungeto     Instagram @makersloungeto"
    row2 = "LinkedIn @makerslounge     Substack @makerslounge"
    ctxt(c, row1, "GeistMono", 40, BOT_BAND / 2 + 30)
    ctxt(c, row2, "GeistMono", 40, BOT_BAND / 2 - 30)

    # ── Done ──
    c.showPage()
    c.save()
    print(f"Poster saved to: {out}")
    return out


if __name__ == "__main__":
    create_poster()
