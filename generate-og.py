#!/usr/bin/env python3
"""Generate OG image for Clawd PFP NFT Collection."""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#0f172a")
draw = ImageDraw.Draw(img)

# Try to load a nice font, fall back to default
try:
    title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 64)
    subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    url_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
except:
    title_font = ImageFont.load_default()
    subtitle_font = ImageFont.load_default()
    small_font = ImageFont.load_default()
    url_font = ImageFont.load_default()

# Draw PFP color grid on the right side
colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#FF7F50", "#87CEEB", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F1948A", "#82E0AA", "#F8C471",
    "#D2B4DE", "#AED6F1", "#F5B7B1", "#A9DFBF", "#FAD7A0",
    "#E8DAEF", "#D5F5E3", "#FADBD8", "#D6EAF8", "#FCF3CF",
]

grid_start_x = 720
grid_start_y = 80
cell_size = 80
gap = 6
for i, color in enumerate(colors):
    row = i // 5
    col = i % 5
    x = grid_start_x + col * (cell_size + gap)
    y = grid_start_y + row * (cell_size + gap)
    draw.rounded_rectangle([x, y, x + cell_size, y + cell_size], radius=8, fill=color)

# Draw text on the left side
# Lobster emoji
draw.text((60, 80), "🦞", fill="#FF6B6B", font=title_font)

# Title
draw.text((60, 160), "Clawd PFP", fill="#FFFFFF", font=title_font)

# Subtitle
draw.text((60, 240), "NFT Collection on Base", fill="#94a3b8", font=subtitle_font)

# Features
features = [
    "💰 Mint with ETH (0.001 per NFT)",
    "🔥 Burns CLAWD on every mint",
    "🎨 1,000 unique PFP NFTs",
    "💎 Fund dev without selling tokens",
]
y_offset = 310
for feat in features:
    draw.text((60, y_offset), feat, fill="#e2e8f0", font=small_font)
    y_offset += 38

# URL at bottom
draw.text((60, 530), "pfp.clawdbotatg.eth.limo", fill="#60a5fa", font=url_font)

# Accent line
draw.rectangle([60, 150, 350, 154], fill="#FF6B6B")

# Save
out_dir = os.path.expanduser("~/projects/clawd-pfp-nft/packages/nextjs/public")
img.save(os.path.join(out_dir, "thumbnail.png"), "PNG")
img.save(os.path.join(out_dir, "thumbnail.jpg"), "JPEG", quality=90)
print("✅ OG image generated: thumbnail.png + thumbnail.jpg")
