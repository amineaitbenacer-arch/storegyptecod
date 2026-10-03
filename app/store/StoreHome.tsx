'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS, type StoreProduct } from '../../lib/products';
import { formatSar } from '../../lib/money';
import { trackStoreEvent } from '../../lib/tracking';
import './store.css';

const CART_KEY = 'store_cart_v1';

type CartItem = { id: string; name: string; price: number; qty: number };

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function ProductCard({
  product,
  index,
  onAdd,
}: {
  product: StoreProduct;
  index: number;
  onAdd: (product: StoreProduct) => void;
}) {
  return (
    <article
      className={`duo-card${index === 0 ? ' duo-card-lead' : ''}`}
      style={{ animationDelay: `${0.15 + index * 0.12}s` }}
    >
      <Link href={product.href} className="duo-media-link" aria-label={product.name}>
        <div className="duo-media">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:760px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            priority={index < 2}
          />
          <span className="duo-badge" style={{ background: product.badgeColor || undefined }}>
            {product.badge}
          </span>
          <span className="duo-index" aria-hidden>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </Link>

      <div className="duo-body">
        <div className="duo-meta">
          <span className="duo-type">{product.type}</span>
          <span className="duo-emoji" aria-hidden>
            {product.emoji}
          </span>
        </div>
        <h3 className="duo-name">
          <Link href={product.href}>{product.name}</Link>
        </h3>
        <p className="duo-desc">{product.shortDesc}</p>

        <div className="duo-price-block">
          <span className="duo-old">{formatSar(product.oldPrice)}</span>
          <strong className="duo-price">{formatSar(product.price)}</strong>
        </div>

        <div className="duo-actions">
          <Link href={product.href} className="duo-cta duo-cta-order">
            اضغط للطلب
            <i className="fa-solid fa-arrow-left" aria-hidden />
          </Link>
          <button
            type="button"
            className="duo-cta duo-cta-cart"
            onClick={() => onAdd(product)}
          >
            أضف إلى السلة
            <i className="fa-solid fa-cart-plus" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

const COMPANY = {
  name: 'AntiChoc Protect',
  legal: 'المتجر الرسمي',
  tag: 'حماية المنزل · ثقة الأسرة',
};

const MENU_SECTIONS = [
  {
    icon: 'fa-truck-fast',
    title: 'التوصيل والشحن',
    body: 'توصيل مجاني إلى باب منزلك في جميع مدن المملكة خلال 24–72 ساعة حسب المدينة. يصلك الطلب مع إمكانية المعاينة قبل الدفع.',
  },
  {
    icon: 'fa-hand-holding-dollar',
    title: 'الدفع عند الاستلام',
    body: 'لا تدفع أي ريال قبل أن تستلم الطلب وتفحصه بنفسك أمام المندوب. إن لم يعجبك المنتج يمكنك رفضه فورًا بدون رسوم.',
  },
  {
    icon: 'fa-rotate-left',
    title: 'كيفية الاسترجاع',
    body: 'يمكنك رفض الاستلام عند المعاينة إن لم يناسبك المنتج. بعد الاستلام، تواصل معنا خلال 48 ساعة لأي مشكلة في الجودة وسنساعدك في الاستبدال أو الحل المناسب.',
  },
  {
    icon: 'fa-shield-halved',
    title: 'الضمان والجودة',
    body: 'منتجات مختارة بعناية مع ضمان جودة واضح. نفحص الطلبات قبل الشحن، ونلتزم بما يظهر في صور ومواصفات صفحة المنتج.',
  },
  {
    icon: 'fa-headset',
    title: 'خدمة العملاء',
    body: 'فريقنا يتواصل معك هاتفيًا لتأكيد الطلب والتوصيل. لأي استفسار حول المقاس أو التركيب أو حالة الشحنة، نحن هنا لمساعدتك.',
  },
  {
    icon: 'fa-box-open',
    title: 'ماذا تستلم؟',
    body: 'تستلم المنتج مطابقًا للصور والوصف، مع إمكانية فتح العلبة والمعاينة قبل الدفع. أي فرق واضح يحق لك رفض الاستلام.',
  },
];

const POLICY_BLOCKS = [
  {
    id: 'terms',
    icon: 'fa-file-contract',
    title: 'شروط الاستخدام',
    body: 'باستخدامك للمتجر فإنك توافق على تقديم بيانات صحيحة للتوصيل، واستقبال مكالمة التأكيد، واستلام الطلب في العنوان المحدد. نحتفظ بحق إلغاء الطلبات ذات البيانات غير الصحيحة لحماية الزبون والمتجر.',
  },
  {
    id: 'policy',
    icon: 'fa-scale-balanced',
    title: 'سياسة الاسترجاع',
    body: 'يمكنك معاينة المنتج قبل الدفع ورفضه إن لم يناسبك. بعد الاستلام، إذا ظهرت مشكلة جودة واضحة تواصل معنا خلال 48 ساعة وسنعالج الأمر بالاستبدال أو الحل المناسب وفق سياسة الضمان الذهبي.',
  },
  {
    id: 'payment',
    icon: 'fa-wallet',
    title: 'طرق الدفع',
    body: 'الدفع عند الاستلام فقط — نقدًا للمندوب بعد فحص المنتج. لا نطلب تحويلًا مسبقًا ولا بيانات بطاقة. هذا يحميك ويقلّل أي مخاطرة قبل الاستلام.',
  },
  {
    id: 'delivery',
    icon: 'fa-box-open',
    title: 'كيفية الاستلام',
    body: 'بعد تأكيد الطلب هاتفيًا، يصلك المندوب إلى باب المنزل. افتح الطرد، عاين المنتج، ثم ادفع إن أعجبك. إن لم يعجبك يحق لك الرفض فورًا دون رسوم.',
  },
];

const ORDER_STEPS = [
  { n: '01', title: 'اختر المنتج', text: 'اضغط للطلب وأكمل بياناتك في أقل من دقيقة.' },
  { n: '02', title: 'تأكيد هاتفي', text: 'نتصل بك بسرعة لتأكيد العنوان وموعد التوصيل.' },
  { n: '03', title: 'استلام وادفع', text: 'عاين عند الباب، ثم ادفع عند الاستلام فقط.' },
];

const SOCIAL_PROOF = [
  { av: '👨‍👧', name: 'سعيد — الرياض', text: 'الطلب وصل بسرعة، والمعاينة قبل الدفع أعطتني ثقة كاملة.' },
  { av: '👩‍👦', name: 'نادية — جدة', text: 'تعامل راقٍ وتأكيد واضح على الهاتف. أنصح بالشراء من هنا.' },
  { av: '🛠️', name: 'يوسف — الدمام', text: 'المنتج مطابق للصور، والتوصيل منظم بدون تأخير.' },
];

export default function StoreHome() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState('');
  const [openPolicy, setOpenPolicy] = useState<string | null>('payment');

  useEffect(() => {
    const items = readCart();
    setCartCount(items.reduce((n, i) => n + i.qty, 0));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const applyHash = () => {
      const id = window.location.hash.replace('#', '');
      if (POLICY_BLOCKS.some((b) => b.id === id)) setOpenPolicy(id);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter(
      (p) =>
        p.name.includes(query.trim()) ||
        p.type.includes(query.trim()) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [query]);

  function addToCart(product: StoreProduct) {
    const items = readCart();
    const existing = items.find((i) => i.id === product.id);
    if (existing) existing.qty += 1;
    else items.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    writeCart(items);
    setCartCount(items.reduce((n, i) => n + i.qty, 0));
    setToast(`تمت إضافة «${product.name}» إلى السلة`);
    trackStoreEvent('addtocart', {
      productId: product.id,
      value: product.price,
      contentName: product.name,
    });
  }

  return (
    <div className="store-page">
      <div className="store-sky" aria-hidden />
      <div className="store-orb store-orb-a" aria-hidden />
      <div className="store-orb store-orb-b" aria-hidden />

      <div className="store-shell">
        <nav className="store-nav">
          <button
            type="button"
            className="store-burger"
            aria-label="فتح القائمة"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="store-nav-center">
            <div className="store-brand-lockup">
              <span className="store-mark" aria-hidden>
                A
              </span>
              <div>
                <strong className="store-nav-title" dir="ltr">
                  {COMPANY.name}
                </strong>
                <span className="store-nav-sub">{COMPANY.legal}</span>
              </div>
            </div>

            <label className="store-search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden />
              <input
                type="search"
                placeholder="ابحث عن منتج..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </label>
          </div>

          <button
            type="button"
            className="store-cart-btn"
            aria-label={`السلة (${cartCount})`}
            onClick={() =>
              setToast(
                cartCount > 0
                  ? `سلتك فيها ${cartCount} منتج — أكمل الطلب من صفحة المنتج`
                  : 'السلة فارغة حاليًا'
              )
            }
          >
            <i className="fa-solid fa-bag-shopping" aria-hidden />
            {cartCount > 0 ? <em className="store-cart-count">{cartCount}</em> : null}
          </button>
        </nav>

        <header className="store-hero">
          <div className="store-company" dir="ltr">
            <span className="store-company-seal" aria-hidden>
              <i className="fa-solid fa-shield-halved" />
            </span>
            <div>
              <p className="store-company-name">{COMPANY.name}®</p>
              <p className="store-company-tag">{COMPANY.tag}</p>
            </div>
          </div>
          <p className="store-kicker">توصيل سريع · الدفع عند الاستلام · ضمان ذهبي</p>
          <h1 className="store-title">المتجر الرسمي</h1>
          <p className="store-lead">منتجات مختارة بعناية — جودة واضحة، طلب بضغطة واحدة، وثقة من أول اتصال حتى باب المنزل</p>
          <div className="store-hero-stats" aria-label="مؤشرات الثقة">
            <div>
              <strong>+4٬800</strong>
              <span>طلب مكتمل</span>
            </div>
            <div>
              <strong>98%</strong>
              <span>رضا العملاء</span>
            </div>
            <div>
              <strong>24–72س</strong>
              <span>متوسط التوصيل</span>
            </div>
          </div>
        </header>

        <section className="store-duo" aria-label="المنتجات">
          <div className="store-duo-head">
            <h2>اختر منتجك</h2>
            <span>{filtered.length} منتجات مختارة</span>
          </div>

          {filtered.length === 0 ? (
            <div className="store-empty">لا توجد منتجات مطابقة لبحثك</div>
          ) : (
            <div className={`store-duo-grid${filtered.length === 1 ? ' is-single' : ''}`}>
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onAdd={addToCart} />
              ))}
            </div>
          )}
        </section>

        <section className="store-trust" aria-label="مزايا المتجر">
          <article>
            <i className="fa-solid fa-truck-fast" aria-hidden />
            <strong>توصيل مجاني</strong>
            <span>إلى باب المنزل</span>
          </article>
          <article>
            <i className="fa-solid fa-hand-holding-dollar" aria-hidden />
            <strong>الدفع عند الاستلام</strong>
            <span>بدون مخاطرة</span>
          </article>
          <article>
            <i className="fa-solid fa-rotate-left" aria-hidden />
            <strong>الضمان الذهبي</strong>
            <span>إن لم يعجبك أرجعه</span>
          </article>
        </section>

        <section className="store-flow" aria-label="كيف يتم الطلب">
          <div className="store-section-intro">
            <h2>كيف تتم العملية؟</h2>
            <p>خطوات واضحة ترفع نسبة التأكيد والاستلام — بلا تعقيد.</p>
          </div>
          <div className="store-flow-grid">
            {ORDER_STEPS.map((step) => (
              <article key={step.n} className="store-flow-card">
                <span className="store-flow-n">{step.n}</span>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="store-proof" aria-label="آراء العملاء">
          <div className="store-section-intro">
            <h2>ماذا يقول عملاؤنا؟</h2>
            <p>تجارب حقيقية تساعد على الطلب بثقة أعلى.</p>
          </div>
          <div className="store-proof-grid">
            {SOCIAL_PROOF.map((r) => (
              <article key={r.name} className="store-proof-card">
                <div className="store-proof-head">
                  <span aria-hidden>{r.av}</span>
                  <div>
                    <strong>{r.name}</strong>
                    <em>⭐⭐⭐⭐⭐</em>
                  </div>
                </div>
                <p>&quot;{r.text}&quot;</p>
              </article>
            ))}
          </div>
        </section>

        <section className="store-policies" id="policies" aria-label="الشروط والسياسات">
          <div className="store-section-intro">
            <h2>الشروط · السياسة · الدفع · الاستلام</h2>
            <p>كل ما يحتاجه الزبون قبل الطلب — بوضوح وشفافية.</p>
          </div>
          <div className="store-policy-list">
            {POLICY_BLOCKS.map((block) => {
              const open = openPolicy === block.id;
              return (
                <div key={block.id} className={`store-policy${open ? ' open' : ''}`} id={block.id}>
                  <button
                    type="button"
                    className="store-policy-btn"
                    aria-expanded={open}
                    onClick={() => setOpenPolicy(open ? null : block.id)}
                  >
                    <span className="store-policy-icon" aria-hidden>
                      <i className={`fa-solid ${block.icon}`} />
                    </span>
                    <strong>{block.title}</strong>
                    <i className={`fa-solid fa-chevron-down store-policy-chevron`} aria-hidden />
                  </button>
                  <div className="store-policy-body">{block.body}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="store-cvr" aria-label="لماذا تطلب الآن">
          <div className="store-cvr-inner">
            <h2>لماذا يطلب الناس من هنا؟</h2>
            <ul>
              <li>
                <i className="fa-solid fa-phone-volume" aria-hidden />
                تأكيد هاتفي سريع يقلّل الأخطاء ويرفع نسبة نجاح الطلب
              </li>
              <li>
                <i className="fa-solid fa-door-open" aria-hidden />
                معاينة عند الباب قبل الدفع — راحة بال كاملة
              </li>
              <li>
                <i className="fa-solid fa-clock" aria-hidden />
                توصيل خلال 24–72 ساعة حسب المدينة
              </li>
              <li>
                <i className="fa-solid fa-medal" aria-hidden />
                ضمان ذهبي: إن لم يعجبك المنتج يمكنك إرجاعه وفق السياسة
              </li>
            </ul>
            <a href="#policies" className="store-cvr-link">
              اقرأ الشروط وطرق الدفع
              <i className="fa-solid fa-arrow-down" aria-hidden />
            </a>
          </div>
        </section>

        <footer className="store-footer">
          <div className="store-footer-brand" dir="ltr">
            <span className="store-mark" aria-hidden>
              A
            </span>
            <div>
              <strong>{COMPANY.name}®</strong>
              <span>{COMPANY.legal} — {COMPANY.tag}</span>
            </div>
          </div>
          <nav className="store-footer-links" aria-label="روابط السياسات">
            <a href="#terms">شروط الاستخدام</a>
            <a href="#policy">سياسة الاسترجاع</a>
            <a href="#payment">طرق الدفع</a>
            <a href="#delivery">كيفية الاستلام</a>
          </nav>
          <p className="store-footer-note">جودة مضمونة · خدمة سريعة · ثقة الزبون أولاً</p>
        </footer>
      </div>

      {/* قائمة الهمبرغر الجانبية */}
      <div
        className={`store-drawer-bg${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <aside
        className={`store-drawer${menuOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="معلومات المتجر"
      >
        <div className="store-drawer-head">
          <div>
            <strong dir="ltr">{COMPANY.name}®</strong>
            <span>معلومات تهمك قبل الطلب</span>
          </div>
          <button type="button" className="store-drawer-close" aria-label="إغلاق" onClick={() => setMenuOpen(false)}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>

        <div className="store-drawer-body">
          <div className="store-drawer-quick">
            {POLICY_BLOCKS.map((b) => (
              <a
                key={b.id}
                href={`#${b.id}`}
                onClick={() => {
                  setOpenPolicy(b.id);
                  setMenuOpen(false);
                }}
              >
                {b.title}
              </a>
            ))}
          </div>
          {MENU_SECTIONS.map((s) => (
            <article key={s.title} className="store-drawer-card">
              <div className="store-drawer-icon">
                <i className={`fa-solid ${s.icon}`} aria-hidden />
              </div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </aside>

      {toast ? (
        <div className="store-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
