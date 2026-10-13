from pathlib import Path
import re

p = Path("lib/product-game-stick-lite.ts")
t = p.read_text(encoding="utf-8")
t = t.replace("/lp/", "/lp/")  # noop clarity
t = re.sub(r"(/products/game-stick-lite/lp/[^\"]+?)\.png", r"\1.jpg", t)
t = re.sub(r"(/products/game-stick-lite/lp/[^\"]+?)\.webp", r"\1.jpg", t)
p.write_text(t, encoding="utf-8")
print("updated", p)

p = Path("lib/productPages.ts")
t = p.read_text(encoding="utf-8")
t = re.sub(r"(/products/ipl-aybel/lp/[^\"]+?)\.png", r"\1.jpg", t)
p.write_text(t, encoding="utf-8")
print("updated", p)

for f in ["lib/product-game-stick-lite.ts", "lib/productPages.ts"]:
    text = Path(f).read_text(encoding="utf-8")
    for m in re.findall(r"/products/(?:game-stick-lite|ipl-aybel)/lp/[^\"]+", text):
        print(f"{f}: {m}")
