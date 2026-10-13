from PIL import Image, ImageOps
from pathlib import Path

src = Path("public/products/game-stick-lite/from-user/kit-packshot-official.png")
out = Path("public/products/game-stick-lite/lp/01-hero-kit-1x1.png")
im = Image.open(src).convert("RGBA")
w, h = im.size
side = max(w, h)
# ~12% padding so object-fit:cover never clips kit edges
pad_side = int(side * 1.14)
canvas = Image.new("RGBA", (pad_side, pad_side), (255, 255, 255, 255))
x = (pad_side - w) // 2
y = (pad_side - h) // 2
canvas.paste(im, (x, y), im)
final = canvas.convert("RGB").resize((1200, 1200), Image.Resampling.LANCZOS)
final.save(out, "PNG", optimize=True)
print("saved", out, final.size)

# upscale smaller marketing assets used in top-5 to 1200 for sharpness
lp = Path("public/products/game-stick-lite/lp")
for name in [
    "04-kit-with-64gb-card.png",
    "03-kit-white-bg.png",
]:
    p = lp / name
    im2 = Image.open(p).convert("RGB")
    if im2.size[0] < 1000:
        im2 = im2.resize((1200, 1200), Image.Resampling.LANCZOS)
        im2.save(p, "PNG", optimize=True)
        print("upscaled", name, im2.size)
    else:
        print("ok", name, im2.size)

for name in ["07-lifestyle-two-players.webp", "08-lifestyle-10000-games.jpg"]:
    p = lp / name
    im2 = Image.open(p).convert("RGB")
    fitted = ImageOps.fit(im2, (1200, 1200), Image.Resampling.LANCZOS)
    dest = lp / (name.rsplit(".", 1)[0] + ".jpg")
    fitted.save(dest, "JPEG", quality=92, optimize=True)
    print("fitted", dest.name, fitted.size)
