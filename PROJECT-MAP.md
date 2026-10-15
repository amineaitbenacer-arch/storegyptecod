# خريطة المشروع — Dune Market (repo: `storegyptecod`)

> تقرير كامل: البنية، طريقة العمل، قاعدة البيانات، الأمان، ونقاط الدخول.
> آخر تحقّق: 15/10/2026 — السيرفر المحلي خدّام ومُجرّب.

---

## 1. شنو هو هاد المشروع

متجر **الدفع عند الاستلام (COD)** بالعربية (RTL)، السوق **السعودي**، الاسم التجاري **Dune Market**
(`www.dunemarket.site`). المنطق: صفحات هبوط (LP) لكل منتج + تتبع إعلانات Meta / TikTok / Snapchat + لوحة تحكم (Admin).

| العنصر | القيمة |
|---|---|
| اسم الحزمة | `storegyptecod` |
| الفريمورك | **Next.js 16.3.5** (App Router + Turbopack) |
| الواجهة | **React 19.2.8** + Tailwind v4 + CSS لكل كومبوننت |
| أنيميشن | `framer-motion`, `canvas-confetti` |
| قاعدة البيانات | **Neon Postgres** (`@neondatabase/serverless` — driver HTTP) |
| النشر | **Vercel** (`.vercel/project.json` → project `alfajrshop`) |
| Git | `github.com/amineaitbenacer-arch/storegyptecod` — فرع `main` |
| اللغة | عربي، `dir="rtl"`، خطوط Amiri + Tajawal |

**رابط المشروع على GitHub:** https://github.com/amineaitbenacer-arch/storegyptecod
**رابط النسخة المحلية:** http://localhost:3000 (غير منشور، غير متاح للناس)

---

## 2. شجرة الملفات

```
app/
  layout.tsx                  ← الجذر: الخطوط، البيكسلز، TrackVisit، CheckoutShieldBoot
  page.tsx                    ← "/" → StoreHome (المتجر كامل، 5 منتجات)
  admin/route.ts              ← يرجع admin-dashboard.html كما هو (بلا auth من السيرفر)
  api/
    orders/route.ts           ← POST إنشاء / GET جلب / PATCH·PUT تعديل / DELETE حذف
    analytics/route.ts        ← POST أحداث الزبون
    analytics/stats/route.ts  ← GET كل الأحداث (للِ Admin)
    products/route.ts         ← GET الكاطالوغ (للِ Admin)
    settings/route.ts         ← GET/POST أرقام البيكسل + التوكنات
  components/
    TrackVisit.tsx            ← pageview / lp / product + scroll 25/50/75/100
    AdPixels.tsx              ← تهيئة البيكسل + PageView ف كل صفحة
    CheckoutShieldBoot.tsx    ← كيبدا مؤقّت مضاد البوتات ف جميع الصفحات
    SaPhoneField.tsx          ← حقل الهاتف السعودي (05 مقفول)
    HoneypotField.tsx         ← حقل الفخ "website"
    LivePurchaseToast.tsx     ← إشعارات "فلان شرا دابا" (مصطنعة)
    BottomSheet / ProductShell / ProductLanding / ReturnPolicyPanel
  store/
    StoreHome.tsx             ← الصفحة الرئيسية (~1250 سطر) + السلة + إتمام الطلب
    StoreCheckoutSheet.tsx    ← نافذة إتمام طلب السلة
  product/[id]/               ← صفحة منتج عامة (ProductView، ~1030 سطر)
  product/antichoc/           ← صفحة قديمة "produit-1" (URL /product/antichoc)
  thankyou/page.tsx           ← صفحة الشكر + الكونفيتي + بيكسل Purchase
lib/
  productPages.ts (1524 سطر)  ← المصدر الرسمي للمنتجات (5 منتجات + كل النصوص)
  product-game-stick-lite.ts  ← إعدادات منتج game-stick-lite
  tracking.ts (698 سطر)       ← نسب الإعلان، visitorId، طابور الأحداث، السكرول
  pixels.ts (398 سطر)         ← fbq / ttq / snaptr (من جهة الزبون)
  pixel-ids.ts, pixel-boot.ts ← قراءة وإدخال أرقام البيكسل ف HTML
  db.ts                       ← اتصال Neon
  orders-store.ts (20k)       ← CRUD الطلبات + الجداول + fallback للفايلات
  analytics-store.ts          ← أحداث التحليل + منع التكرار
  settings-store.ts           ← إعدادات البيكسل/التوكنات (Neon أو فايل)
  bans-store.ts + ban-seeds   ← الحظر: IP / هاتف / visitor
  order-guard.ts              ← قواعد مضادة للغش (مستوى البيزنس)
  anti-bot.ts                 ← honeypot، js_token، المؤقّت، UA، بروفايلات وهمية
  order-rate-limit.ts         ← سقف المحاولات لكل IP
  phone.ts                    ← تحقّق أرقام سعودية + كشف الأرقام المزيفة
  submit-order.ts             ← المدخل الوحيد من الزبون لإنشاء طلب
  client-ip.ts, ip-gate.ts, money.ts, shipping.ts, cities.ts, offers.ts
  last-order.ts, return-policy.ts, order-messages.ts
middleware.ts                 ← حماية على POST /api/orders فقط
admin-dashboard.html (2994)   ← اللوحة كاملة (إحصائيات، طلبات، إعدادات، مصادر)
scripts/                      ← سكريبتات لمرة واحدة (استخراج، تصحيح صور)
public/                       ← صور المنتجات والأصول
```

**فايلات بيانات محلية** (fallback بلا DB، وف Vercel الكتابة ممنوعة = read-only):
`orders.json`, `analytics.json`, `phone-bans.json`, `ip-bans.json`, `visitor-bans.json`,
`order-blocks.json`, `order-abuse-attempts.json`.

---

## 3. الروابط (Routes)

| الرابط | النوع | الوصف |
|---|---|---|
| `/` | client | المتجر: ستوريز، 5 منتجات، سلة، إتمام، آراء، سياسات |
| `/product/[id]` | client | صفحة منتج (`hilal-3in1`, `nujum-usb`, `kalb-robot-ai`, `ipl-aybel`) |
| `/product/antichoc` | client | صفحة قديمة (id داخلي `produit-1`، مخفية من المتجر والِ Admin) |
| `/thankyou` | client | تأكيد الطلب + تصحيح الرقم + بيكسل Purchase |
| `/admin` | server | يرجع `admin-dashboard.html` (بلا أي auth) |
| `/api/orders` | server | POST (محمي ضد البوتات)، GET / PATCH / PUT / DELETE |
| `/api/analytics` · `/api/analytics/stats` | server | كتابة / قراءة الأحداث |
| `/api/products` · `/api/settings` | server | الكاطالوغ / إعدادات البيكسل |

---

## 4. مسار الطلب من A إلى Z

```
الزائر (إعلان Meta/TikTok/Snap) → صفحة المنتج
  ├─ TrackVisit   : pageview / lp / product + scroll25-100 → POST /api/analytics
  ├─ AdPixels     : fbq(PageView) / ttq.page() / snaptr(PAGE_VIEW)
  ├─ tracking.ts  : visitorId ف localStorage + fbclid/ttclid/sccid + clickAt (مدة 7 أيام)
  └─ CheckoutShieldBoot : كيشعل المؤقّت المضاد للبوتات
        ↓ كليك "اطلب"
  submitOrderToApi()  ← lib/submit-order.ts : تنظيم الهاتف + حقول مضاد البوت
        ↓ POST /api/orders
  middleware.ts  → كيحبس إذا UA ديال بوت ولا IP محظور (403 BLOCKED)
  POST handler   → 1. evaluateAntiBot (honeypot، js_token، UA، sec-fetch-site، المؤقّت، بروفايل وهمي)
                   2. recordOrderAttempt (حد المحاولات: 6 ف 10 دقايق لكل IP)
                   3. تحقّق من رقم سعودي (05 + 8 أرقام، ومنع الأنماط المزيفة)
                   4. evaluateOrderGuard (الحظر، burst IP، تكرار مطابق، أرقام شبه متطابقة)
                   5. resolveAttributedSource (مصدر الإعلان + click IDs صحيحة)
                   6. insertOrder → Neon (فهرس unique على phone + product_id)
                   7. appendEvent('purchase')
        ↓
  إعادة توجيه لـ /thankyou → كونفيتي، Purchase لفايسبوك/تيكتوك/سناب، وواتساب الدعم
```

**مضاد البوتات (`lib/anti-bot.ts`)** — طبقة عامة على **جميع** المنتجات الحالية والمستقبلية:
- حقل الفخ `website` تعمّر → حظر
- `js_token` ماشي `dm1` → حظر
- User-Agent ديال بوت (curl، python، headless…) → حظر
- `sec-fetch-site: cross-site` → حظر
- وقت التعبئة: أقل من 600ms → حظر فوري؛ أقل من 2500ms → رفض ناعم 429 `TOO_FAST`
- اسم/مدينة وهمية (`aaa`، `123456`، `qwerty`، رابط، 6 أرقام…) → حظر

**`lib/order-guard.ts`**: رقم سبام، هاتف محظور، visitor محظور، IP محظور، بلوك IP+منتج،
أكثر من 4 طلبات ف ساعة من نفس IP، تكرار مطابق (نفس الهاتف + نفس المنتج)،
و**أرقام شبه متطابقة** (مسافة Hamming 1–2 مقابل طلبات 7 أيام) → حظر.

**الهاتف السعودي (`lib/phone.ts`)**: الصيغة القياسية `05XXXXXXXX` (كيحوّل الأرقام العربية، وكيقبل
`+966`/`00966`). أنماط مرفوضة: `0500000000`، `0512121212`، التسلسلات، وأقل من 3 أرقام مورا `05`.
رقم ناقص ولا مزيف → **حظر IP دائم**.

---

## 5. قاعدة البيانات (Neon)

الجداول كيتصاوبو أوتوماتيكياً من أول استعمال:

| الجدول | الدور | المفتاح |
|---|---|---|
| `orders` | الطلبات (id, name, phone, city, address, offer, pieces, price, timestamp, status, note, source, fbclid, ttclid, sccid, utm_source, product_id, client_order_id, visitor_id, ip) | `id` |
| `analytics_events` | الفانِل: pageview, lp, product, addtocart, checkout, purchase, scroll* | `id` |
| `store_settings` | سطر واحد `id=1` فيه JSON (البيكسل + التوكنات) | `id` |
| `phone_bans` / `ip_bans` / `visitor_bans` | لوائح الحظر | PK نص |
| `order_blocks` | حظر مؤقّت لـ IP+منتج | `(ip, product_id)` |
| `order_abuse_attempts` | تاريخ الإساءة (تصعيد الحظر) | `id` |
| `order_attempt_limits` | حد المحاولات لكل IP | `ip` |

الفهرس الحاسم: `idx_orders_phone_product_active` — **unique** على `(phone, product_id)` مع استثناء
الطلبات الملغاة. هذا هو الحاجز الأخير ضد التكرار على مستوى الDB.

نقطة مهمة: إذا `DATABASE_URL` موجود، `insertOrder` **عمره ما كيكتب** ف `orders.json`
(باش ما يوقعش الحال: الطلب نجح + بيكسل Purchase طلع، ولكن الطلب ماشي ف `/admin`).
إذا ما كانش DB، كولشي كيرجع للفايلات JSON المحلية.

الحالات المقبولة: `Nouveau, Validé, Confirmé (قديم), Annulé, Pas de réponse, pending, confirmed, shipped, delivered, cancelled`.

---

## 6. نسب الإعلانات (`lib/tracking.ts`)

- `visitorId` (localStorage `sg_vid`) + المصدر (`sg_src`) + click IDs (`sg_click`) + آخر منتج (`sg_pid`)
- مدة النسب **7 أيام** (`ATTRIBUTION_WINDOW_MS`)
- `cleanClickId()` كيرمي القيم الوهمية (`{{fbclid}}`, `fbclid`, `null`, أقل من 12 حرف) — حيت قبل،
  `fbclid` مزيف كان كيخلي مبيعات تيكتوك تتنسَب غالطاً لـ Meta
- `sourceFromClick()` كيفضّل UTM + click-id المتناسقين، وإلا الـ ID الوحيد، وإلا `direct`
- `resolveAttributedSource()`: مصدر مدفوع بلا دليل (click-id ولا UTM ديال إعلان) كيرجع **direct**
- طابور `sg_track_q` ف localStorage، كيتفرّغ بـ `flushTrackingQueue()`

البيكسلز (`lib/pixels.ts`): `fbq` Meta، `ttq` TikTok، `snaptr` Snapchat
→ `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase` (مع `eventID`/`order_id` لمنع التكرار).
الأرقام مخزّنة ف DB وكيتزادو من السيرفر عبر `lib/pixel-boot.ts`.
**كولشي من جهة المتصفح — ما كاينش Conversions API من السيرفر.**

---

## 7. لوحة التحكم (`admin-dashboard.html`)

صفحة واحدة (HTML + Tailwind CDN + JS عادي) فيها 4 تابات:
- **Stats**: المبيعات، الزوار، الطلبات، التحويل، AOV، الفانِل، السرعة، أفضل مدينة/عرض/مصدر،
  توزيع الحالات، نسبة الإلغاء، المبيعات المؤكدة والصافية
- **Orders**: جدول + فلترة بالتاريخ + عمليات جماعية + شارة favicon "طلب جديد"
- **Settings**: أرقام البيكسل + توكنات Meta/TikTok/Snapchat (مورا passcode)
- **Sources**: النسب حسب المنتج / المنصة

---

## 8. الأمان — النقاط الخطيرة (حالة دابا، متحقّق منها ف الإنتاج)

| # | المشكلة | الخطورة | التفصيل |
|---|---|---|---|
| 1 | **`GET /api/orders` عمومي** | 🔴 خطير | كيرجع **كل** الطلبات (الاسم، الهاتف، المدينة، IP) بلا أي auth. متجرّب ف الإنتاج: 68 طلب بالواضح. |
| 2 | **`GET /api/settings?admin=true` عمومي** | 🔴 خطير | كيرجع **توكنات** TikTok/Meta/Snapchat. متجرّب ف الإنتاج: `tiktok_token` مكشوف (40 حرف). |
| 3 | **`GET /api/analytics/stats` عمومي** | 🟠 مرتفع | كل تاريخ التحليلات مكشوف. |
| 4 | **سلوحة الِ Admin مكتوبة ف HTML** | 🔴 خطير | `const PASS = "storegypte2026";` + `"antichoc2026"` ف `admin-dashboard.html`. أي واحد كيشوفها عبر `/admin`. |
| 5 | `POST/PATCH/PUT/DELETE /api/orders` | 🟠 مرتفع | بلا auth: أي واحد يقدر يعدّل/يمسح طلبات، ولا يبدّل إعدادات البيكسل عبر `POST /api/settings`. |
| 6 | `next.config.ts` بلا headers أمان | 🟡 متوسط | ما كاينش CSP، `X-Frame-Options`، `Referrer-Policy`… |
| 7 | تنبيه Next 16 | 🟡 متوسط | `middleware.ts` ولّى deprecated → خاص يتحوّل لـ `proxy.ts` (`npx @next/codemod@canary middleware-to-proxy .`). |

حتى يتصلّحو 1–5، الداتا ديال العملاء والتوكنات ديال الإعلانات مكشوفين للعموم.
حتى واحد من هاد الـ routes ما كيتحقّق من الهوية: الِ Dashboard كيتأكّد **غير ف المتصفح**،
وهاد الشي ما كيحميش الـ API اللي كيتصل بيها.

---

## 9. الاختبارات اللي درت

السيرفر: `./node_modules/.bin/next dev -p 3000` → **Ready in 7.7s** (Next 16.3.5، Turbopack).

| الاختبار | النتيجة |
|---|---|
| `GET /` | 200 · `<html lang="ar" dir="rtl">` · عنوان Dune Market · **5 بطاقات منتج** تلوّحو، الصور خدّامين، الطول 5856px |
| `GET /product/hilal-3in1` | 200 |
| `GET /product/antichoc` | 200 |
| `GET /thankyou` | 200 |
| `GET /admin` | 200 |
| `GET /api/products` | 200 |
| `GET /api/orders` | 200 · 69 طلب (Neon) — **عمومي** |
| `GET /api/analytics/stats` | 200 · 5919 حدث — **عمومي** |
| `GET /api/settings` | 200 · غير أرقام البيكسل (مزيان) |
| `GET /api/settings?admin=true` | 200 · **التوكنات مكشوفة** |

ما كاينش أخطاء ف السيرفر؛ غير التنبيه ديال `middleware` deprecated.
**ما تصاوبت حتى طلب حقيقي** فالاختبار (غير قراءة).

---

## 10. نقط على المنتج والنصوص

- الهيرو ديال المتجر كيعرض **مرّتين** سطر «الدفع عند الاستلام» (`fa-eye` + `fa-hand-holding-dollar`) —
  تكرار ف النص، خاص يتنقّى (`app/store/StoreHome.tsx`).
- `LivePurchaseToast` وبلوكات الآراء (`SOCIAL_PROOF`, `REVIEWS`) **مصطنعة/مولّدة** (أسماء ومدن عشوائية).
  مقصودة وظيفياً، ولكن خاص نعرفوها من ناحية القانون (إعلان مضلّل).
- الأثمنة والعروض كيتحكمو من `lib/productPages.ts` → `offers[]`؛ `pieces` الافتراضي = `offer.id` إذا ما كانش.
- رسوم التوصيل ثابتة `20 ريال` (`lib/shipping.ts`)، إلا إذا `shippingIncluded: true` على المنتج.
- واتساب الدعم: `+966566306804` (`lib/return-policy.ts`).
- `scripts/` فيه بزاف ديال سكريبتات المرة الواحدة (تحويل/تصحيح صور) — تاريخ، ما كيتنفّذوش ف البناء.

---

## 11. أوامر مفيدة

```bash
npm run dev      # next dev (port 3000)
npm run build    # next build
npm run start    # next start
```

**الخادم المحلي باقي خدّام دابا على المنفذ 3000** (PID 19648). باش توقّفو: `kill 19648`.
