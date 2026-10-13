"""Compress product LP images for a smaller git push."""
from pathlib import Path
from PIL import Image

ROOTS = [
    Path("public/products/game-stick-lite/lp"),
    Path("public/products/ipl-aybel/lp"),
]
MAX = 1100
QUALITY = 82

for root in ROOTS:
    if not root.exists():
        continue
    for path in sorted(root.iterdir()):
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue
        im = Image.open(path).convert("RGB")
        w, h = im.size
        scale = min(1.0, MAX / max(w, h))
        if scale < 1:
            im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        out = path.with_suffix(".jpg")
        im.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        kb = out.stat().st_size / 1024
        print(f"{out} -> {kb:.0f}KB {im.size}")
        if out != path and path.exists():
            path.unlink()
            print(f"  removed {path.name}")
