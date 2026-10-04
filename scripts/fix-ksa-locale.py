# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

reps = [
    ("🇲🇦", "🇸🇦"),
    ("قبل الأداء", "قبل الدفع"),
    ("15 REAL MOROCCAN REVIEWS", "15 REAL SAUDI REVIEWS"),
    ("بارد + سخون", "بارد + ساخن"),
    ("لكل الدار", "لكل المنزل"),
    ("لسخانيات الدار", "لسخانات المنزل"),
    ("صبيب ضغط ماء", "ضغط تدفق ماء"),
    ("بنفس القوة والصبيب", "بنفس القوة والتدفق"),
    ("السي عبد القادر - مكناس", "عبد القادر — الرياض"),
    ("فاطمة الزهراء - طنجة", "فاطمة الزهراء — جدة"),
    ("عمر المراكشي - مراكش", "عمر الحربي — الدمام"),
    ("كريم الفاسي (تقني) - فاس", "كريم العتيبي (تقني) — مكة المكرمة"),
    ("خديجة العلمي - الدار البيضاء", "خديجة العتيبي — الخبر"),
    ("عبد العالي السوسي - أكادير", "عبدالله السبيعي — أبها"),
    ("رشيد التازي - تازة", "رشيد القحطاني — تبوك"),
    ("مريم البقالي - تطوان", "مريم الشمري — المدينة"),
    ("سفيان الناصري - سلا", "سفيان الدوسري — الطائف"),
    ("أمينة السلاوي - الرباط", "أمينة المطيري — الرياض"),
    ("ياسين المرابط - المحمدية", "ياسين الزهراني — ينبع"),
    ("إلهام الدكالي - الجديدة", "إلهام الغامدي — جازان"),
    ("محمد البكاري - بني ملال", "محمد الشمري — حائل"),
    ("نجاة برادة - وجدة", "نجاة العنزي — نجران"),
    ("حسن الخمليشي - الحسيمة", "حسن البلوي — الجبيل"),
]

targets = [
    ROOT / "app" / "antichocBody.ts",
    ROOT / "app" / "product" / "[id]" / "ProductView.tsx",
    ROOT / "scripts" / "antichoc-checkout-sheet.html",
    ROOT / "app" / "store" / "StoreCheckoutSheet.tsx",
]

for path in targets:
    if not path.exists():
        print(f"SKIP missing {path}")
        continue
    text = path.read_text(encoding="utf-8")
    original = text
    changed = []
    for old, new in reps:
        count = text.count(old)
        if count:
            text = text.replace(old, new)
            changed.append(f"{count}x {old} -> {new}")
    if text != original:
        path.write_text(text, encoding="utf-8")
        print(f"UPDATED {path.relative_to(ROOT)}")
        for line in changed:
            print(f"  {line}")
    else:
        print(f"OK     {path.relative_to(ROOT)}")

# Final sweep for Morocco flag anywhere in app/
left = []
for path in (ROOT / "app").rglob("*"):
    if path.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx", ".html", ".css", ".md", ".json"}:
        continue
    try:
        data = path.read_text(encoding="utf-8")
    except Exception:
        continue
    if "🇲🇦" in data or "MOROCCAN" in data or "قبل الأداء" in data:
        left.append(str(path.relative_to(ROOT)))

print("REMAINING_ISSUES", left or "none")
