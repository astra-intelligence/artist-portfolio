#!/usr/bin/env python3
"""Render the 1200x630 Open Graph card for Thomasene Art (artist-portfolio).

Matches the site's light-mode palette (warm cream background, terracotta
primary, dark brown foreground) and Fraunces serif + Outfit sans type system.
Reproducible: python3 scripts/render-og.py -> src/app/opengraph-image.png
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

# Site palette (light mode, from src/app/globals.css)
BG = (245, 240, 230)          # oklch(0.962 0.012 88) warm cream
FG = (66, 58, 50)             # oklch(0.24 0.02 55) dark brown
PRIMARY = (150, 78, 40)       # oklch(0.42 0.11 32) terracotta
MUTED = (120, 110, 100)       # muted foreground
BORDER = (210, 200, 185)      # oklch(0.85 0.018 78)
CARD = (250, 247, 240)        # oklch(0.985 0.008 90)

SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
SERIF_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# Subtle top accent bar (terracotta) like the site's h-1 bg-primary
d.rectangle([0, 0, W, 8], fill=PRIMARY)

# Decorative frame
d.rectangle([40, 40, W - 40, H - 40], outline=BORDER, width=2)

# Eyebrow label
eyebrow = ImageFont.truetype(SANS_BOLD, 30)
d.text((80, 110), "ORIGINAL WORK", font=eyebrow, fill=PRIMARY)

# Artist name (serif italic, large)
name = ImageFont.truetype(SERIF, 150)
d.text((80, 170), "Thomasene Art", font=name, fill=FG)

# Tagline
tagline = ImageFont.truetype(SERIF, 52)
d.text((80, 380), "Art that inspires and captivates", font=tagline, fill=FG)

# Location / domain pill
pill = ImageFont.truetype(SANS, 34)
d.rounded_rectangle([80, 500, 420, 560], radius=30, fill=CARD, outline=BORDER, width=2)
d.text((110, 512), "thomasene.art", font=pill, fill=MUTED)

# Small paint-brush motif (terracotta dot + stroke) bottom-right
d.ellipse([W - 200, H - 150, W - 120, H - 70], fill=PRIMARY)
d.arc([W - 320, H - 190, W - 120, H - 30], start=200, end=340, fill=PRIMARY, width=6)

img.save("src/app/opengraph-image.png")
print("wrote src/app/opengraph-image.png", img.size)
