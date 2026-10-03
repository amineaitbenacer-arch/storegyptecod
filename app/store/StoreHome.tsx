'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS, type StoreProduct } from '../../lib/products';
import { formatSar } from '../../lib/money';
import { SHIPPING_FEE_SAR, orderTotalWithShipping } from '../../lib/shipping';
import { saveLastOrder, thankYouHref } from '../../lib/last-order';
import { isValidOrderPhone, normalizePhone, submitOrderToApi } from '../../lib/submit-order';
import { flushTrackingQueue, trackingFields, trackStoreEvent } from '../../lib/tracking';
import StoreCheckoutSheet from './StoreCheckoutSheet';
import ReturnPolicyPanel from '../components/ReturnPolicyPanel';
import './store.css';

const CART_KEY = 'store_cart_v1';

type CartItem = { id: string; name: string; price: number; qty: number; image: string };

function enrichItem(raw: Partial<CartItem>): CartItem | null {
  if (!raw?.id) return null;
  const catalog = PRODUCTS.find((p) => p.id === raw.id);
  return {
    id: raw.id,
    name: raw.name || catalog?.name || 'منتج',
    price: Number(raw.price) || catalog?.price || 0,
    qty: Math.max(1, Number(raw.qty) || 1),
    image: raw.image || catalog?.image || '/images/hero_anti_choc_product_1789640183592.png',
  };
}

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(enrichItem).filter((i): i is CartItem => !!i);
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
            sizes="(max-width:760px) 50vw, 50vw"
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
            <span className="duo-cta-long">اضغط للطلب</span>
            <span className="duo-cta-short">اطلب</span>
            <i className="fa-solid fa-arrow-left" aria-hidden />
          </Link>
          <button
            type="button"
            className="duo-cta duo-cta-cart"
            onClick={() => onAdd(product)}
            aria-label="أضف إلى السلة"
          >
            <span className="duo-cta-long">أضف إلى السلة</span>
            <span className="duo-cta-short">سلة</span>
            <i className="fa-solid fa-cart-plus" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

const COMPANY = {
  name: 'Dune Market',
  legal: 'ONLINE STORE',
  tag: 'حماية المنزل · ثقة الأسرة',
};

const MENU_SECTIONS = [
  {
    icon: 'fa-truck-fast',
    title: 'التوصيل والشحن',
    body: 'توصيل بـ 20 ريال إلى باب منزلك في جميع مدن المملكة خلال 24–72 ساعة حسب المدينة. يصلك الطلب مع إمكانية المعاينة قبل الدفع.',
  },
  {
    icon: 'fa-hand-holding-dollar',
    title: 'الدفع عند الاستلام',
    body: 'لا تدفع أي ريال قبل أن تستلم الطلب وتفحصه بنفسك أمام المندوب. إن لم يعجبك المنتج يمكنك رفضه فورًا بدون رسوم.',
  },
  {
    icon: 'fa-rotate-left',
    title: 'كيفية الاسترجاع',
    body: 'استرجاع خلال 3 أيام واستبدال خلال 7 أيام من الاستلام. راسلنا على واتساب بعد تعبئة نموذج الطلب — نرد خلال 48 ساعة وفق سياسة الاستبدال والاسترجاع.',
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
    title: 'سياسة الاستبدال والاسترجاع',
    body: 'سياسة كاملة: استرجاع 3 أيام · استبدال 7 أيام · واتساب +966566306804',
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
  { av: '👩‍💼', name: 'خديجة — الخبر', text: 'اشتريت أكثر من مرة. الجودة ثابتة والدفع عند الاستلام يريح البال.' },
  { av: '🧔', name: 'ياسين — مكة', text: 'خدمة ممتازة من التأكيد حتى باب المنزل. تجربة شراء آمنة.' },
  { av: '👩‍🏫', name: 'مريم — المدينة', text: 'طلبت بثقة بسبب المعاينة قبل الدفع. المنتج كما وُصف تمامًا.' },
];

const TRUST_PILLS = [
  { icon: 'fa-truck-fast', color: '#ea580c', bg: '#fff7ed', text: 'توصيل آمن وسريع لجميع المدن' },
  { icon: 'fa-hand-holding-dollar', color: '#2563eb', bg: '#eff6ff', text: 'الدفع عند الاستلام فقط' },
  { icon: 'fa-medal', color: '#ca8a04', bg: '#fffbeb', text: 'ضمان ذهبي — استرجاع 3 أيام / استبدال 7 أيام' },
  { icon: 'fa-headset', color: '#0f766e', bg: '#f0fdfa', text: 'تأكيد هاتفي ودعم قبل وبعد الطلب' },
  { icon: 'fa-shield-halved', color: '#b45309', bg: '#fff7ed', text: 'منتجات مختارة لحماية المنزل' },
  { icon: 'fa-box-open', color: '#059669', bg: '#ecfdf5', text: 'معاينة المنتج قبل الدفع' },
];

type StoryItem = {
  id: string;
  label: string;
  ring: string;
  image?: string;
  icon?: string;
  title: string;
  text: string;
};

const STORIES: StoryItem[] = [
  {
    id: 's1',
    label: 'الأكثر مبيعًا',
    ring: '#d97706',
    image: '/images/hero_anti_choc_product_1789640183592.png',
    title: 'عازل AntiChoc Protect',
    text: 'حماية حقيقية من تسرب الكهرباء في السخان — الأكثر طلبًا في المتجر.',
  },
  {
    id: 's2',
    label: 'ضمان ذهبي',
    ring: '#ca8a04',
    icon: 'fa-medal',
    title: 'الضمان الذهبي',
    text: 'استرجاع 3 أيام واستبدال 7 أيام من الاستلام — سياسة واضحة وواتساب جاهز.',
  },
  {
    id: 's3',
    label: 'عند الاستلام',
    ring: '#2563eb',
    icon: 'fa-hand-holding-dollar',
    title: 'ادفع بعد المعاينة',
    text: 'لا تدفع أي ريال قبل أن تفحص طلبك أمام المندوب عند باب المنزل.',
  },
  {
    id: 's4',
    label: 'توصيل سريع',
    ring: '#ea580c',
    icon: 'fa-truck-fast',
    title: 'إلى باب بيتك',
    text: 'توصيل بـ 20 ريال خلال 24–72 ساعة حسب المدينة — لجميع أنحاء المملكة.',
  },
  {
    id: 's5',
    label: 'اختيارنا',
    ring: '#0f766e',
    image: '/images/new_box.jpg',
    title: 'منتجات مختارة',
    text: 'كل منتج في المتجر مختار بعناية لسهولة الطلب وثقة الأسرة.',
  },
];

export default function StoreHome() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<'items' | 'checkout'>('items');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState('');
  const [openPolicy, setOpenPolicy] = useState<string | null>('payment');
  const [openDrawerFaq, setOpenDrawerFaq] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cartBump, setCartBump] = useState(0);
  const [cartShake, setCartShake] = useState(false);
  const [cartPop, setCartPop] = useState<{ delta: number; total: number } | null>(null);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [seenStories, setSeenStories] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [navCartHidden, setNavCartHidden] = useState(false);

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((n, i) => n + i.price * i.qty, 0), [cart]);
  const activeStory = storyIndex != null ? STORIES[storyIndex] : null;
  const showCartTicket = mounted && !cartOpen && navCartHidden;

  function syncCart(items: CartItem[]) {
    writeCart(items);
    setCart(items);
  }

  function showCartChange(delta: number, total: number) {
    if (delta === 0) return;
    setCartBump((n) => n + 1);
    setCartShake(true);
    setCartPop({ delta, total });
  }

  useEffect(() => {
    setMounted(true);
    syncCart(readCart());
  }, []);

  useEffect(() => {
    const navCart = document.querySelector('.store-cart-btn');
    if (!navCart) return;
    const io = new IntersectionObserver(
      ([entry]) => setNavCartHidden(!entry.isIntersecting),
      { threshold: 0.15, rootMargin: '-8px 0px 0px 0px' }
    );
    io.observe(navCart);
    return () => io.disconnect();
  }, [mounted]);

  useEffect(() => {
    const anyOpen = menuOpen || cartOpen || storyIndex != null;
    if (!anyOpen) {
      document.body.style.overflow = '';
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (storyIndex != null) setStoryIndex(null);
      else if (cartStep === 'checkout') setCartStep('items');
      else if (cartOpen) {
        setCartOpen(false);
        setCartStep('items');
      } else setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, cartOpen, cartStep, storyIndex]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!cartPop) return;
    const t = window.setTimeout(() => setCartPop(null), 1400);
    return () => window.clearTimeout(t);
  }, [cartPop, cartBump]);

  useEffect(() => {
    if (!cartShake) return;
    const t = window.setTimeout(() => setCartShake(false), 450);
    return () => window.clearTimeout(t);
  }, [cartShake, cartBump]);

  useEffect(() => {
    const applyHash = () => {
      const id = window.location.hash.replace('#', '');
      if (POLICY_BLOCKS.some((b) => b.id === id)) setOpenPolicy(id);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  useEffect(() => {
    if (storyIndex == null) return;
    const story = STORIES[storyIndex];
    setSeenStories((prev) => ({ ...prev, [story.id]: true }));
    const t = window.setTimeout(() => {
      if (storyIndex < STORIES.length - 1) setStoryIndex(storyIndex + 1);
      else setStoryIndex(null);
    }, 4500);
    return () => window.clearTimeout(t);
  }, [storyIndex]);

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
    else
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        image: product.image,
      });
    const total = items.reduce((n, i) => n + i.qty, 0);
    syncCart(items);
    showCartChange(1, total);
    setToast(`تمت الإضافة — لديك ${total} في السلة`);
    setMenuOpen(false);
    setCartStep('items');
    trackStoreEvent('addtocart', {
      productId: product.id,
      value: product.price,
      contentName: product.name,
    });
  }

  function setQty(id: string, next: number) {
    const prev = readCart();
    const before = prev.reduce((n, i) => n + i.qty, 0);
    const items = prev
      .map((i) => (i.id === id ? { ...i, qty: next } : i))
      .filter((i) => i.qty > 0);
    const total = items.reduce((n, i) => n + i.qty, 0);
    syncCart(items);
    showCartChange(total - before, total);
  }

  function removeItem(id: string) {
    const prev = readCart();
    const removed = prev.find((i) => i.id === id)?.qty || 0;
    const items = prev.filter((i) => i.id !== id);
    const total = items.reduce((n, i) => n + i.qty, 0);
    syncCart(items);
    showCartChange(-removed, total);
    if (items.length === 0) setCartStep('items');
  }

  function openCart() {
    setMenuOpen(false);
    setStoryIndex(null);
    setCartStep('items');
    setCart(readCart());
    setCartOpen(true);
  }

  function closeCart() {
    setCartOpen(false);
    setCartStep('items');
  }

  function startCheckout() {
    if (cart.length === 0) {
      setToast('السلة فارغة — أضف منتجًا أولًا');
      return;
    }
    trackStoreEvent('checkout', {
      productId: cart[0]?.id || 'cart',
      value: orderTotalWithShipping(cartTotal),
      contentName: cart.map((i) => i.name).join(' + '),
    });
    setCartStep('checkout');
  }

  async function submitOrder() {
    const clean = normalizePhone(phone);
    if (!name.trim() || !city.trim()) {
      setPhoneError('⚠️ كمّل الاسم والمدينة');
      return;
    }
    if (!isValidOrderPhone(clean)) {
      setPhoneError('⚠️ تأكد من رقم الهاتف (10 أرقام، مثال 0612345678)');
      return;
    }
    setPhoneError('');
    setSubmitting(true);

    const offerLabel =
      cart.length === 1
        ? `${cart[0].name} × ${cart[0].qty}`
        : cart.map((i) => `${i.name} × ${i.qty}`).join(' · ');
    const orderId = `st-${Date.now().toString(36)}`;
    const productId = cart[0]?.id || 'cart';
    const payableTotal = orderTotalWithShipping(cartTotal);
    const orderData = {
      orderId,
      name: name.trim(),
      phone: clean,
      city: city.trim(),
      address: city.trim(),
      offer: offerLabel,
      offerName: offerLabel,
      subtotal: cartTotal,
      shippingFee: SHIPPING_FEE_SAR,
      price: payableTotal,
      pieces: cartCount,
      packId: 0,
      items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      timestamp: new Date().toISOString(),
      ...trackingFields(),
      productId,
    };

    try {
      const saved = await submitOrderToApi(orderData);
      const finalOrder = {
        ...orderData,
        orderId,
        serverOrderId: saved.orderId,
      };

      trackStoreEvent('purchase', {
        productId,
        value: payableTotal,
        contentName: offerLabel,
        orderId,
        numItems: cartCount,
      });
      flushTrackingQueue();

      saveLastOrder(finalOrder);
      writeCart([]);
      setCart([]);
      setCartOpen(false);
      setSubmitting(false);
      // Hard navigation so thank-you always reads fresh storage
      window.location.assign(thankYouHref(orderId));
    } catch (error) {
      console.error('[checkout] submit failed', error);
      setPhoneError('⚠️ ما تسجّلش الطلب — عاود المحاولة (تحقق من الإنترنت)');
      setSubmitting(false);
    }
  }

  return (
    <div className="store-page store-atlas">
      <div className="atlas-marquee" aria-hidden>
        <div className="atlas-marquee-track">
          <span>توصيل آمن لجميع المدن · الدفع عند الاستلام · ضمان ذهبي · معاينة قبل الدفع</span>
          <span>توصيل آمن لجميع المدن · الدفع عند الاستلام · ضمان ذهبي · معاينة قبل الدفع</span>
          <span>توصيل آمن لجميع المدن · الدفع عند الاستلام · ضمان ذهبي · معاينة قبل الدفع</span>
        </div>
      </div>

      <div className="store-shell">
        <nav className="store-nav atlas-nav">
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
            <Link href="/" className="store-brand-lockup" aria-label="المتجر الكامل — كل المنتجات">
              <span className="store-mark" aria-hidden>
                <Image src="/images/logo-mark.png" alt="" width={42} height={42} priority />
              </span>
              <div>
                <strong className="store-nav-title" dir="ltr">
                  {COMPANY.name}
                </strong>
                <span className="store-nav-sub">{COMPANY.legal}</span>
              </div>
            </Link>

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
            className={`store-cart-btn${cartShake ? ' is-bump' : ''}${cartCount > 0 ? ' has-items' : ''}`}
            aria-label={`السلة (${cartCount})`}
            aria-expanded={cartOpen}
            onClick={openCart}
          >
            <span className="store-cart-ring" aria-hidden />
            <i className="fa-solid fa-bag-shopping" aria-hidden />
            {cartCount > 0 ? (
              <em className="store-cart-count bump" key={`n-${cartCount}-${cartBump}`}>
                {cartCount}
              </em>
            ) : null}
            {cartPop ? (
              <span
                className={`store-cart-pop${cartPop.delta > 0 ? ' up' : ' down'}`}
                key={`pop-${cartBump}`}
              >
                <b>{cartPop.delta > 0 ? `+${cartPop.delta}` : `${cartPop.delta}`}</b>
                <small>{cartPop.total > 0 ? `${cartPop.total} في السلة` : 'فارغة'}</small>
              </span>
            ) : null}
          </button>
        </nav>

        <section className="atlas-stories" aria-label="قصص المتجر">
          {STORIES.map((story, i) => (
            <button
              key={story.id}
              type="button"
              className={`atlas-story${seenStories[story.id] ? ' seen' : ''}`}
              onClick={() => setStoryIndex(i)}
            >
              <span className="atlas-story-ring" style={{ background: story.ring }}>
                <span className="atlas-story-inner">
                  {story.image ? (
                    <Image src={story.image} alt="" width={64} height={64} />
                  ) : (
                    <i className={`fa-solid ${story.icon}`} aria-hidden />
                  )}
                </span>
              </span>
              <em>{story.label}</em>
            </button>
          ))}
        </section>

        <label className="store-search store-search-mobile">
          <i className="fa-solid fa-magnifying-glass" aria-hidden />
          <input
            type="search"
            placeholder="ابحث عن منتج..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>

        <header className="store-hero atlas-hero">
          <h1 className="store-title atlas-brand">المتجر الرسمي</h1>
          <p className="store-lead">
            اطلب بثقة: المنتج يوصلك لباب البيت، تعاينه بنفسك، وتدفع فقط إن أعجبك.
          </p>

          <ul className="atlas-trust-list" aria-label="لماذا تطلب من هنا">
            <li>
              <i className="fa-solid fa-eye" aria-hidden />
              <span>معاينة عند الباب قبل الدفع — بلا مخاطرة</span>
            </li>
            <li>
              <i className="fa-solid fa-hand-holding-dollar" aria-hidden />
              <span>الدفع عند الاستلام فقط — لا تحويل مسبق</span>
            </li>
            <li>
              <i className="fa-solid fa-phone-volume" aria-hidden />
              <span>تأكيد هاتفي سريع + توصيل بـ 20 ريال لبابك</span>
            </li>
          </ul>

          <a href="#products" className="atlas-cta">
            ابدأ شراء بثقة
            <i className="fa-solid fa-arrow-down" aria-hidden />
          </a>
        </header>

        <section className="rev-marquee" aria-label="آراء العملاء">
          <div className="rev-marquee-frame" aria-hidden />
          <div className="rev-marquee-head">
            <span className="rev-marquee-kicker">⭐ تقييمات حقيقية</span>
            <h2>ماذا يقول عملاؤنا؟</h2>
            <p>تجارب حقيقية تساعد على الطلب بثقة أعلى.</p>
          </div>
          <div className="rev-marquee-viewport">
            <div className="rev-marquee-track">
              {[...SOCIAL_PROOF, ...SOCIAL_PROOF].map((r, i) => (
                <article
                  key={`${r.name}-${i}`}
                  className="rev-marquee-card"
                  aria-hidden={i >= SOCIAL_PROOF.length}
                >
                  <div className="rev-marquee-card-top">
                    <span className="rev-marquee-av" aria-hidden>
                      {r.av}
                    </span>
                    <div>
                      <strong>{r.name}</strong>
                      <em>⭐⭐⭐⭐⭐</em>
                    </div>
                    <span className="rev-marquee-badge">شراء مؤكد</span>
                  </div>
                  <p>&quot;{r.text}&quot;</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="store-duo" id="products" aria-label="المنتجات">
          <div className="store-duo-head">
            <h2>اختر منتجك</h2>
            <span>{filtered.length} منتجات مختارة</span>
          </div>

          {filtered.length === 0 ? (
            <div className="store-empty">لا توجد منتجات مطابقة لبحثك</div>
          ) : (
            <div className="store-duo-grid">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onAdd={addToCart} />
              ))}
            </div>
          )}
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

        <div className="atlas-pills" aria-label="مزايا المتجر">
          <div className="atlas-pills-track">
            {[...TRUST_PILLS, ...TRUST_PILLS].map((pill, i) => (
              <span
                key={`${pill.text}-${i}`}
                className="atlas-pill"
                style={{ color: pill.color, background: pill.bg, borderColor: `${pill.color}33` }}
                aria-hidden={i >= TRUST_PILLS.length}
              >
                <span className="atlas-pill-dot" style={{ background: pill.color }} aria-hidden />
                <i className={`fa-solid ${pill.icon}`} aria-hidden />
                {pill.text}
              </span>
            ))}
          </div>
        </div>

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
                  <div className={`store-policy-body${block.id === 'policy' ? ' is-rich' : ''}`}>
                    {block.id === 'policy' ? <ReturnPolicyPanel variant="full" /> : block.body}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="store-cvr" aria-label="لماذا تطلب الآن">
          <div className="store-cvr-inner">
            <h2>لماذا يطلب الناس من هنا؟</h2>
            <div className="store-cvr-list">
              <div className="store-cvr-row">
                <i className="fa-solid fa-phone-volume" aria-hidden />
                <span>تأكيد هاتفي سريع يقلّل الأخطاء ويرفع نسبة نجاح الطلب</span>
              </div>
              <div className="store-cvr-row">
                <i className="fa-solid fa-door-open" aria-hidden />
                <span>معاينة عند الباب قبل الدفع — راحة بال كاملة</span>
              </div>
              <div className="store-cvr-row">
                <i className="fa-solid fa-clock" aria-hidden />
                <span>توصيل خلال 24–72 ساعة حسب المدينة</span>
              </div>
              <div className="store-cvr-row">
                <i className="fa-solid fa-medal" aria-hidden />
                <span>ضمان ذهبي واضح: استرجاع 3 أيام واستبدال 7 أيام وفق السياسة</span>
              </div>
            </div>
          </div>
        </section>

        <section className="store-gold" id="gold-guarantee" aria-label="الضمان الذهبي">
          <div className="store-gold-frame" aria-hidden />
          <div className="store-gold-glow" aria-hidden />
          <div className="store-gold-top">
            <div className="store-gold-seal" aria-hidden>
              <span className="store-gold-ring" />
              <i className="fa-solid fa-medal" />
            </div>
            <div className="store-gold-titles">
              <p className="store-gold-kicker">وعد المتجر لكل طلب — بلا مخاطرة</p>
              <h2>الضمان الذهبي + سياسة الاسترجاع</h2>
              <p className="store-gold-lead">
                شراء بثقة: استرجاع خلال 3 أيام واستبدال خلال 7 أيام من الاستلام. سياسة واضحة، واتساب جاهز،
                ورد خلال 48 ساعة.
              </p>
            </div>
          </div>
          <div className="store-gold-grid">
            <article>
              <span className="store-gold-step">1</span>
              <div className="store-gold-icon" aria-hidden>
                <i className="fa-solid fa-calendar-check" />
              </div>
              <strong>3 أيام للاسترجاع</strong>
              <span>من تاريخ استلام المنتج — حقّك مكتوب وواضح.</span>
            </article>
            <article>
              <span className="store-gold-step">2</span>
              <div className="store-gold-icon" aria-hidden>
                <i className="fa-solid fa-right-left" />
              </div>
              <strong>7 أيام للاستبدال</strong>
              <span>بدّل المنتج خلال أسبوع وفق بنود السياسة.</span>
            </article>
            <article>
              <span className="store-gold-step">3</span>
              <div className="store-gold-icon" aria-hidden>
                <i className="fa-brands fa-whatsapp" />
              </div>
              <strong>واتساب + نموذج جاهز</strong>
              <span>انسخ الرقم والنموذج، راسلنا، ونرد خلال 48 ساعة.</span>
            </article>
          </div>
          <div className="store-gold-policy">
            <ReturnPolicyPanel variant="compact" showTitle={false} />
            <a href="#policy" className="store-gold-policy-link">
              اقرأ السياسة كاملة
              <i className="fa-solid fa-arrow-left" aria-hidden />
            </a>
          </div>
          <div className="store-gold-ribbon">
            <i className="fa-solid fa-certificate" aria-hidden />
            <span>لم يعجبك؟ أرجعه خلال 3 أيام — أو استبدله خلال 7 أيام — يسري على كل منتجات المتجر</span>
          </div>
        </section>

        <footer className="store-footer">
          <div className="store-footer-panel">
            <div className="store-footer-brand" dir="ltr">
              <span className="store-mark" aria-hidden>
                <Image src="/images/logo-mark.png" alt="" width={42} height={42} />
              </span>
              <div>
                <strong>{COMPANY.name}</strong>
                <span>{COMPANY.legal}</span>
              </div>
            </div>
            <p className="store-footer-tag">{COMPANY.tag}</p>

            <nav className="store-footer-grid" aria-label="روابط السياسات">
              <a href="#terms" className="store-footer-card">
                <i className="fa-solid fa-file-contract" aria-hidden />
                <strong>شروط الاستخدام</strong>
              </a>
              <a href="#policy" className="store-footer-card">
                <i className="fa-solid fa-scale-balanced" aria-hidden />
                <strong>سياسة الاسترجاع</strong>
              </a>
              <a href="#payment" className="store-footer-card">
                <i className="fa-solid fa-wallet" aria-hidden />
                <strong>طرق الدفع</strong>
              </a>
              <a href="#delivery" className="store-footer-card">
                <i className="fa-solid fa-box-open" aria-hidden />
                <strong>كيفية الاستلام</strong>
              </a>
            </nav>

            <a href="#products" className="store-footer-cta">
              <i className="fa-solid fa-bag-shopping" aria-hidden />
              ابدأ شراء بثقة
              <i className="fa-solid fa-arrow-up" aria-hidden />
            </a>
            <p className="store-footer-note">جودة مضمونة · خدمة سريعة · ثقة الزبون أولاً</p>
          </div>
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
          <div className="store-drawer-brand">
            <Image src="/images/logo-mark.png" alt="" width={36} height={36} />
            <div>
              <strong dir="ltr">{COMPANY.name}</strong>
              <span>معلومات تهمك قبل الطلب</span>
            </div>
          </div>
          <button type="button" className="store-drawer-close" aria-label="إغلاق" onClick={() => setMenuOpen(false)}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>

        <div className="store-drawer-body">
          <p className="store-drawer-faq-label">السياسات والشروط</p>
          <div className="store-drawer-faq">
            {POLICY_BLOCKS.map((b) => {
              const key = `policy-${b.id}`;
              const open = openDrawerFaq === key;
              return (
                <div key={b.id} className={`store-drawer-faq-item${open ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="store-drawer-faq-btn"
                    aria-expanded={open}
                    onClick={() => setOpenDrawerFaq(open ? null : key)}
                  >
                    <span className="store-drawer-icon" aria-hidden>
                      <i className={`fa-solid ${b.icon}`} />
                    </span>
                    <strong>{b.title}</strong>
                    <i className="fa-solid fa-chevron-down store-drawer-faq-chevron" aria-hidden />
                  </button>
                  <div className={`store-drawer-faq-body${b.id === 'policy' ? ' is-rich' : ''}`}>
                    {b.id === 'policy' ? <ReturnPolicyPanel variant="compact" /> : b.body}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="store-drawer-faq-label">أسئلة شائعة</p>
          <div className="store-drawer-faq">
            {MENU_SECTIONS.map((s, i) => {
              const key = `menu-${i}`;
              const open = openDrawerFaq === key;
              return (
                <div key={s.title} className={`store-drawer-faq-item${open ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="store-drawer-faq-btn"
                    aria-expanded={open}
                    onClick={() => setOpenDrawerFaq(open ? null : key)}
                  >
                    <span className="store-drawer-icon" aria-hidden>
                      <i className={`fa-solid ${s.icon}`} />
                    </span>
                    <strong>{s.title}</strong>
                    <i className="fa-solid fa-chevron-down store-drawer-faq-chevron" aria-hidden />
                  </button>
                  <div className="store-drawer-faq-body">{s.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* سلة Shopify-style — portal فوق كل شيء */}
      {mounted
        ? createPortal(
            <>
              <div
                className={`shop-cart-root${cartOpen && cartStep === 'items' ? ' open' : ''}`}
                aria-hidden={!cartOpen || cartStep !== 'items'}
              >
                <button
                  type="button"
                  className="shop-cart-overlay"
                  aria-label="إغلاق السلة"
                  onClick={closeCart}
                />
                <aside
                  className="shop-cart-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-label="سلة المشتريات"
                >
                  <div className="shop-cart-head">
                    <div className="shop-cart-title">
                      <strong>سلتك</strong>
                      <span>{cartCount > 0 ? `${cartCount} منتج` : 'فارغة'}</span>
                    </div>
                    <button type="button" className="shop-cart-x" aria-label="إغلاق" onClick={closeCart}>
                      <i className="fa-solid fa-xmark" aria-hidden />
                    </button>
                  </div>

                  <div className="shop-cart-body">
                    {cart.length === 0 ? (
                      <div className="shop-cart-empty">
                        <i className="fa-solid fa-bag-shopping" aria-hidden />
                        <p>سلتك فارغة</p>
                        <span>أضف منتجاتك ثم أكمل الطلب من هنا</span>
                        <button type="button" onClick={closeCart}>
                          متابعة التسوق
                        </button>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <article key={item.id} className="shop-cart-line">
                          <div className="shop-cart-thumb">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="72px"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div className="shop-cart-info">
                            <div className="shop-cart-top">
                              <h3>{item.name}</h3>
                              <button
                                type="button"
                                className="shop-cart-del"
                                aria-label="حذف"
                                onClick={() => removeItem(item.id)}
                              >
                                <i className="fa-solid fa-trash-can" aria-hidden />
                              </button>
                            </div>
                            <strong>{formatSar(item.price)}</strong>
                            <div className="shop-qty">
                              <button
                                type="button"
                                aria-label="إنقاص"
                                onClick={() => setQty(item.id, item.qty - 1)}
                              >
                                −
                              </button>
                              <em>{item.qty}</em>
                              <button
                                type="button"
                                aria-label="زيادة"
                                onClick={() => setQty(item.id, item.qty + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  {cart.length > 0 ? (
                    <div className="shop-cart-foot">
                      <div className="shop-cart-sub">
                        <span>المجموع</span>
                        <strong>{formatSar(cartTotal)}</strong>
                      </div>
                      <button type="button" className="shop-cart-cta" onClick={startCheckout}>
                        إتمام الشراء
                      </button>
                      <button type="button" className="shop-cart-continue" onClick={closeCart}>
                        متابعة التسوق
                      </button>
                    </div>
                  ) : null}
                </aside>
              </div>

              <StoreCheckoutSheet
                open={cartOpen && cartStep === 'checkout'}
                items={cart.map((i) => ({
                  ...i,
                  oldPrice: PRODUCTS.find((p) => p.id === i.id)?.oldPrice,
                }))}
                total={cartTotal}
                name={name}
                phone={phone}
                city={city}
                phoneError={phoneError}
                submitting={submitting}
                onBack={() => setCartStep('items')}
                onName={setName}
                onPhone={(v) => {
                  setPhone(v);
                  setPhoneError(
                    v.length > 0 && v.length < 10
                      ? '⚠️ تأكد من رقم الهاتف (يجب أن يحتوي على 10 أرقام)'
                      : ''
                  );
                }}
                onCity={setCity}
                onSubmit={submitOrder}
              />
            </>,
            document.body
          )
        : null}

      {activeStory && storyIndex != null ? (
        <div
          className="atlas-story-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={activeStory.title}
          onClick={() => {
            if (storyIndex < STORIES.length - 1) setStoryIndex(storyIndex + 1);
            else setStoryIndex(null);
          }}
        >
          <div className="atlas-story-bars" aria-hidden>
            {STORIES.map((s, i) => (
              <span key={s.id} className={i < storyIndex ? 'done' : i === storyIndex ? 'active' : ''} />
            ))}
          </div>
          <button
            type="button"
            className="atlas-story-close"
            aria-label="إغلاق"
            onClick={(e) => {
              e.stopPropagation();
              setStoryIndex(null);
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="atlas-story-content" style={{ ['--story-ring' as string]: activeStory.ring }}>
            {activeStory.image ? (
              <div className="atlas-story-media">
                <Image src={activeStory.image} alt="" fill sizes="100vw" style={{ objectFit: 'contain' }} />
              </div>
            ) : (
              <div className="atlas-story-iconbig">
                <i className={`fa-solid ${activeStory.icon}`} aria-hidden />
              </div>
            )}
            <h3>{activeStory.title}</h3>
            <p>{activeStory.text}</p>
            <span className="atlas-story-hint">اضغط للانتقال</span>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="store-toast" role="status">
          <i className="fa-solid fa-circle-check" aria-hidden />
          <span>{toast}</span>
        </div>
      ) : null}

      {showCartTicket ? (
        <button
          type="button"
          className={`store-cart-ticket${cartShake ? ' is-bump' : ''}${cartCount > 0 ? ' has-items' : ''}`}
          onClick={openCart}
          aria-label={`فتح السلة (${cartCount})`}
        >
          <i className="fa-solid fa-bag-shopping" aria-hidden />
          <span className="store-cart-ticket-label">السلة</span>
          {cartCount > 0 ? (
            <em className="store-cart-ticket-count" key={`t-${cartCount}-${cartBump}`}>
              {cartCount}
            </em>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
