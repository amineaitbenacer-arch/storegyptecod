'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { OfferPack, ProductPageConfig } from '../../../lib/productPages';
import { formatSar } from '../../../lib/money';
import { SHIPPING_FEE_SAR, orderTotalWithShipping } from '../../../lib/shipping';
import { saveLastOrder, thankYouHref } from '../../../lib/last-order';
import { isValidOrderPhone, normalizePhone, submitOrderToApi } from '../../../lib/submit-order';
import { flushTrackingQueue, trackingFields, trackStoreEvent } from '../../../lib/tracking';

function pickOffer(product: ProductPageConfig) {
  // أول عرض = الأرخص — يظهر محددًا عند دخول الصفحة
  return product.offers[0];
}

export default function ProductView({ product }: { product: ProductPageConfig }) {
  const [offer, setOffer] = useState<OfferPack>(() => pickOffer(product));
  const [imgIdx, setImgIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetOffersOpen, setSheetOffersOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reviewPhase, setReviewPhase] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [navOfferIdx, setNavOfferIdx] = useState(0);

  const reviewPages = useMemo(() => {
    const pages: (typeof product.reviews)[] = [];
    for (let i = 0; i < product.reviews.length; i += 5) {
      pages.push(product.reviews.slice(i, i + 5));
    }
    return pages.length ? pages : [[]];
  }, [product.reviews]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const save = offer.oldPrice - offer.price;
  const total = orderTotalWithShipping(offer.price);
  const pieces = offer.pieces ?? offer.id;
  const heroSrc = product.images[imgIdx] || product.images[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (product.offers.length < 2) return;
    const timer = setInterval(() => {
      setNavOfferIdx((i) => (i + 1) % product.offers.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [product.offers.length]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    if (!sheetOpen) {
      document.getElementById('antichoc-root')?.classList.remove('checkout-open');
      setSheetOffersOpen(false);
    }
    return () => {
      document.body.style.overflow = '';
      document.getElementById('antichoc-root')?.classList.remove('checkout-open');
    };
  }, [sheetOpen]);

  function choose(next: OfferPack) {
    setOffer(next);
  }

  function chooseFromSheet(next: OfferPack) {
    setOffer(next);
    setSheetOffersOpen(false);
  }

  function openSheet() {
    trackStoreEvent('addtocart', {
      productId: product.id,
      value: orderTotalWithShipping(offer.price),
      contentName: offer.name,
    });
    setFormError('');
    setSheetOffersOpen(false);
    setSheetOpen(true);
    document.getElementById('antichoc-root')?.classList.add('checkout-open');
  }

  function goToOffers() {
    const el = document.getElementById('product-offers');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    document.querySelector('.hero-offers-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function submit() {
    const clean = normalizePhone(phone);
    if (!name.trim() || !city.trim()) {
      setFormError('عافاك كمل جميع المعلومات (الاسم، الهاتف والمدينة).');
      return;
    }
    if (!isValidOrderPhone(clean)) {
      setFormError('⚠️ تأكد من رقم الهاتف (يجب أن يحتوي على 10 أرقام على الأقل)');
      return;
    }
    setFormError('');
    setLoading(true);
    const orderId = `pl-${Date.now().toString(36)}`;
    const payable = orderTotalWithShipping(offer.price);
    const cityTrim = city.trim();
    trackStoreEvent('checkout', {
      productId: product.id,
      value: payable,
      contentName: offer.name,
    });
    const orderData = {
      orderId,
      name: name.trim(),
      phone: clean,
      city: cityTrim,
      address: cityTrim,
      offer: offer.name,
      offerName: `${product.brand} — ${offer.name}`,
      price: payable,
      subtotal: offer.price,
      shippingFee: SHIPPING_FEE_SAR,
      pieces,
      packId: offer.id,
      timestamp: new Date().toISOString(),
      ...trackingFields(),
      productId: product.id,
    };
    try {
      const saved = await submitOrderToApi(orderData);
      trackStoreEvent('purchase', {
        productId: product.id,
        value: payable,
        contentName: orderData.offerName,
        orderId,
        numItems: pieces,
      });
      flushTrackingQueue();
      saveLastOrder({ ...orderData, orderId, serverOrderId: saved.orderId });
      window.location.assign(thankYouHref(orderId));
    } catch {
      setFormError('ما تسجّلش الطلب. عاود المحاولة.');
      setLoading(false);
    }
  }

  const offers = (
    <div className="hero-offers-grid">
      {product.offers.map((o) => {
        const selected = offer.id === o.id;
        return (
          <button
            key={o.id}
            type="button"
            className={`hero-offer-card${selected ? ' selected' : ''}`}
            aria-pressed={selected}
            onClick={() => choose(o)}
          >
            {o.badge && <span className="hero-offer-badge">{o.badge}</span>}
            <span className="hero-offer-radio" />
            <span className="hero-offer-info">
              <span className="hero-offer-title">{o.name}</span>
              <span className="hero-offer-sub">{o.sub}</span>
            </span>
            <span className="hero-offer-price-tag">
              <span className="old-p">{formatSar(o.oldPrice)}</span>
              <span className={`new-p${o.popular ? ' highlight' : ''}`}>{formatSar(o.price)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const activeTag = offer.badge || (offer.popular ? 'الأكثر طلبًا' : 'العرض الأساسي');
  const showAov = offer.id !== product.offers[0]?.id;
  const aovMsg = offer.popular
    ? `مبروك! تم اختيار العرض الأكثر طلبًا وتفعيل الخصم — وفّرت ${formatSar(save)}.`
    : `أقوى توفير. وفّرت ${formatSar(save)} وحصلت على أفضل قيمة.`;
  const phoneInvalid = Boolean(formError && formError.includes('الهاتف'));

  const sheet = (
    <div
      className={`sheet-bg${sheetOpen ? ' open' : ''}`}
      id="sheetBg"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSheetOpen(false);
      }}
    >
      <div className="sheet" id="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="استكمال الطلب">
        <div className="sheet-handle" />

        <div id="formState">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 className="sheet-title" style={{ margin: 0, fontSize: '1.15rem' }}>
              🚀 استكمال الطلب
            </h2>
            <button type="button" className="close-btn" onClick={() => setSheetOpen(false)} aria-label="إغلاق">
              &times;
            </button>
          </div>

          <div
            className={`sheet-selected-offer-card${sheetOffersOpen ? ' active' : ''}`}
            id="sheet-offer-trigger"
            title="انقر لتغيير العرض أو الترقية"
            role="button"
            tabIndex={0}
            onClick={() => setSheetOffersOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSheetOffersOpen((v) => !v);
              }
            }}
          >
            <div className="sheet-offer-live-badge">
              <span className="sheet-live-dot" /> 🎁 انقر لتغيير العرض أو اختيار باقة أكبر
            </div>
            <div className="sheet-offer-card-top">
              <img
                src={product.catalogImage || heroSrc}
                id="sheet-preview-img"
                alt={product.heroTitle}
                className="sheet-card-thumb"
                loading="lazy"
              />
              <div className="sheet-offer-card-info">
                <div className="sheet-active-tag" id="sheet-active-badge">
                  {activeTag}
                </div>
                <div className="sheet-active-title" id="sheet-bundle-name">
                  {offer.name}
                </div>
                <div className="sheet-active-sub" id="sheet-bundle-sub">
                  {offer.sub} • توصيل {formatSar(SHIPPING_FEE_SAR)} 🚚
                </div>
              </div>
              <div className="sheet-active-pricing">
                <div className="sheet-active-price" id="sheet-preview-price">
                  {formatSar(offer.price)}
                </div>
                <div className="sheet-active-old" id="sheet-preview-old-price">
                  {formatSar(offer.oldPrice)}
                </div>
              </div>
            </div>
            <div className="sheet-change-cta-bar">
              <span className="sheet-change-text">
                <i className="fa-solid fa-arrows-rotate fa-spin-pulse" aria-hidden="true" />{' '}
                <strong>اضغط هنا لتبديل العرض أو ترقية طلبك</strong>
              </span>
              <span className="sheet-chevron-badge">
                <i className="fa-solid fa-chevron-down" id="sheet-chevron-arrow" aria-hidden="true" />
              </span>
            </div>
          </div>

          <div className={`sheet-offers-drawer${sheetOffersOpen ? ' open' : ''}`} id="sheet-offers-drawer">
            <div className="sod-header">
              <span className="sod-title">
                <i className="fa-solid fa-layer-group" aria-hidden="true" /> اختر الباقة المناسبة لمنزلك:
              </span>
              <span className="sod-pill">وفر أكثر مع الباقات الأكبر ⚡️</span>
            </div>
            <div className="sod-grid">
              {product.offers.map((o, idx) => {
                const selected = offer.id === o.id;
                const offerSave = o.oldPrice - o.price;
                const isLast = idx === product.offers.length - 1;
                const badgeClass = o.popular ? 'gold' : isLast ? 'green' : '';
                const badgeText = o.popular
                  ? `⭐ ${o.badge || 'الأكثر طلباً في المملكة'}`
                  : isLast
                    ? `🔥 ${o.badge || 'أفضل قيمة'}`
                    : o.badge;
                const saveClass = o.popular ? 'save-green' : isLast ? 'save-gold' : '';
                const priceClass = o.popular ? 'highlight' : isLast ? 'super-green' : '';
                return (
                  <div
                    key={o.id}
                    className={`sod-card${selected ? ' selected' : ''}`}
                    id={`sod-card-${o.id}`}
                    data-pack={o.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => chooseFromSheet(o)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        chooseFromSheet(o);
                      }
                    }}
                  >
                    {badgeText && <div className={`sod-badge ${badgeClass}`.trim()}>{badgeText}</div>}
                    <div className="sod-radio">
                      <i className="fa-solid fa-check" aria-hidden="true" />
                    </div>
                    <div className="sod-body">
                      <div className="sod-title-row">
                        <span className="sod-name">{o.name}</span>
                      </div>
                      <div className="sod-desc">{o.sub}</div>
                      {offerSave > 0 && (
                        <div className={`sod-save-tag ${saveClass}`.trim()}>
                          {o.popular
                            ? `وفرت ${formatSar(offerSave)} + توصيل ${formatSar(SHIPPING_FEE_SAR)}`
                            : isLast
                              ? `وفرت ${formatSar(offerSave)} كاش اليوم!`
                              : `توفير ${formatSar(offerSave)} اليوم`}
                        </div>
                      )}
                    </div>
                    <div className="sod-prices">
                      <span className="sod-old">{formatSar(o.oldPrice)}</span>
                      <span className={`sod-new ${priceClass}`.trim()}>{formatSar(o.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            id="sheet-aov-congrats"
            className="sheet-aov-congrats"
            style={{ display: showAov ? 'flex' : 'none' }}
          >
            <i className="fa-solid fa-gift" aria-hidden="true" />{' '}
            <span id="sheet-aov-msg">{aovMsg}</span>
          </div>

          <div className="trust-cadre-mini">
            <div className="tc-mini-item">
              <span className="tc-mini-icon">🚚</span>
              <div className="tc-mini-text">
                <strong>توصيل {formatSar(SHIPPING_FEE_SAR)}</strong>
                <span>جميع مدن السعودية 🇸🇦</span>
              </div>
            </div>
            <div className="tc-mini-item">
              <span className="tc-mini-icon">🤝</span>
              <div className="tc-mini-text">
                <strong>المعاينة قبل الدفع</strong>
                <span>تفحص المنتج قبل الدفع 📦</span>
              </div>
            </div>
          </div>

          <form
            id="express-order-form"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <input
              type="text"
              id="inp-name"
              className="form-inp"
              placeholder="👤 الاسم الكامل"
              required
              autoComplete="name"
              enterKeyHint="next"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="tel"
              id="inp-phone"
              className="form-inp"
              placeholder="📱 رقم الجوال (05XXXXXXXX)"
              required
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                if (formError) setFormError('');
              }}
              style={phoneInvalid ? { border: '2px solid #ef4444' } : undefined}
            />
            <p
              id="phone-error"
              style={{
                display: phoneInvalid ? 'block' : 'none',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                marginTop: '-8px',
                marginBottom: '12px',
                marginRight: '5px',
              }}
            >
              ⚠️ تأكد من رقم الهاتف (يجب أن يحتوي على 10 أرقام على الأقل)
            </p>
            <input
              type="text"
              id="inp-city"
              className="form-inp"
              placeholder="📍 المدينة"
              required
              autoComplete="address-level2"
              enterKeyHint="done"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            {formError && !phoneInvalid && <p className="pv-form-error">{formError}</p>}

            <div className="total-box checkout-sum">
              <div className="checkout-sum-row">
                <span>مجموع المنتجات</span>
                <b id="sheet-subtotal-price">{formatSar(offer.price)}</b>
              </div>
              <div className="checkout-sum-row">
                <span>التوصيل</span>
                <b id="sheet-shipping-price">{formatSar(SHIPPING_FEE_SAR)}</b>
              </div>
              <div className="checkout-sum-total">
                <span>المجموع عند الاستلام:</span>
                <strong id="sheet-total-price">{formatSar(total)}</strong>
              </div>
            </div>

            <button type="submit" className="submit-btn pulse-btn" disabled={loading}>
              {loading ? 'جاري تسجيل الطلب... ⏳' : '🛒 اطلب الآن'}
            </button>
            <div className="privacy">🔒 معلوماتك آمنة ومضمونة 100%</div>
          </form>
        </div>
      </div>
    </div>
  );

  const buyBar = (
    <div className="buy-bar">
      <div className="bar-price">
        <span className="bar-old">{formatSar(offer.oldPrice)}</span>
        <div className="bar-new">
          <span className="latin-nums">{offer.price}</span> <small>ريال</small>
        </div>
      </div>
      <button type="button" className="buy-btn" onClick={openSheet}>
        {product.ctaLabel}
      </button>
    </div>
  );

  return (
    <div id="antichoc-root" className="ac-root">
      <div className="top-marquee-banner">
        <div className="marquee-content">
          <span>{product.marquee}</span>
          <span>{product.marquee}</span>
        </div>
      </div>

      <nav className="nav luxury-navbar">
        <div className="container nav-inner-container">
          <div className="nav-brand-text">
            <Link href="/" className="nav-title-main nav-store-link">
              Dune Market
            </Link>
          </div>
          <div className="nav-logo-center">
            <Link href="/" className="nav-logo-link" aria-label="المتجر الكامل — كل المنتجات">
              <img src="/images/logo-mark.png" alt="Dune Market" width={42} height={42} className="nav-logo-mark" />
            </Link>
          </div>
          <div className="nav-actions">
            <div
              id="nav-offer-badge-bg"
              role="button"
              tabIndex={0}
              className={`nav-offer-badge${navOfferIdx === product.offers.length - 1 ? ' is-hot' : ''}`}
              onClick={goToOffers}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  goToOffers();
                }
              }}
              aria-label="الانتقال إلى العروض"
            >
              {product.offers.map((o, i) => {
                const pcs = o.pieces ?? o.id;
                const label = pcs === 1 ? 'قطعة' : 'قطع';
                return (
                  <span
                    key={o.id}
                    className={`nav-offer-item offer-item-${i + 1}${i === navOfferIdx ? ' is-active' : ''}`}
                  >
                    {pcs} {label} · {formatSar(o.price)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="container">
          <div className="warning-pill">
            <span>{product.warning}</span>
          </div>

          <div className="hero-image-fullbleed">
            <div className="hero-badge-top-right">{product.heroBadge}</div>
            <img id="hero-main-img" src={heroSrc} alt={product.heroTitle} />
          </div>

          <div className="thumb-gallery">
            {product.images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`thumb-img${imgIdx === i ? ' active' : ''}`}
                onClick={() => setImgIdx(i)}
              />
            ))}
          </div>

          <div className="hero-dark-bar">{product.heroSubtitle}</div>

          <div className="pv-social-proof" aria-label="تقييم المنتج 4.7 من 5">
            <div className="pv-sp-top">
              <div className="pv-sp-score-block">
                <strong className="pv-sp-score">
                  <span className="latin-nums">4.7</span>
                  <small>/5</small>
                </strong>
                <div className="pv-sp-stars" aria-hidden="true">
                  <span className="on">★</span>
                  <span className="on">★</span>
                  <span className="on">★</span>
                  <span className="on">★</span>
                  <span className="half">★</span>
                </div>
                <div className="pv-sp-meter" aria-hidden="true">
                  <span style={{ width: '94%' }} />
                </div>
              </div>
              <div className="pv-sp-meta">
                <div className="pv-sp-faces" aria-hidden="true">
                  <span>أ</span>
                  <span>س</span>
                  <span>ن</span>
                  <span>م</span>
                </div>
                <div className="pv-sp-copy">
                  <strong>+2,840 تقييم حقيقي</strong>
                  <em>94% يقولون: يستاهل السعر</em>
                </div>
              </div>
            </div>
            <div className="pv-sp-chips">
              <span className="pv-sp-chip live">
                <i className="pv-sp-dot" aria-hidden="true" />
                ادفع بعد المعاينة
              </span>
              <span className="pv-sp-chip">جودة مضمونة</span>
              <span className="pv-sp-chip">اختيار الأمهات</span>
              <span className="pv-sp-chip">هدية تبهِر</span>
            </div>
          </div>

          <div className="hero-title-area">
            <div className="hero-title-badge">{product.badge}</div>
            <h1 className="prod-name-new">{product.heroTitle}</h1>
          </div>

          <div className="pv-price-compact">
            <div className="pv-price-main">
              <span className="pv-price-now">
                <span className="latin-nums">{offer.price}</span> <small>ريال</small>
              </span>
              <span className="pv-price-was">{formatSar(offer.oldPrice)}</span>
            </div>
            <div className="pv-price-save">وفّرت {formatSar(save)} اليوم — عرض محدود</div>
          </div>

          <div className="hero-offers-wrapper" id="product-offers">
            <div className="hero-offers-header">
              <span className="hero-offers-label">اختر العرض</span>
              <span className="hero-offers-sub-badge">الدفع عند الاستلام</span>
            </div>
            {offers}
          </div>

          <div className="cta-block-wrap">
            <button type="button" className="offer-cta-main" onClick={openSheet}>
              {product.ctaLabel} — {formatSar(offer.price)}
            </button>
            <div className="cta-reassurance">
              <span>ضمان ذهبي</span>
              <span className="dot">•</span>
              <span>معاينة قبل الدفع</span>
              <span className="dot">•</span>
              <span>الدفع عند الاستلام</span>
            </div>
          </div>
        </div>
      </section>

      {product.storyBeats && product.storyBeats.length > 0 && (
        <section className="product-visual-description-section pv-story-section">
          <div className="container">
            <div className="pvd-header text-center">
              <span className="pvd-badge">تفاصيل المنتج بالصور</span>
              <h2 className="section-heading">لماذا العائلات تطلبه اليوم؟</h2>
              <p className="section-subheading">تفاصيل واضحة وصورة واحدة قبل ما تطلب</p>
            </div>

            {product.storyBeats.map((beat, i) => (
              <div key={beat.imageTitle || beat.image} className="pv-beat">
                <div className="pv-info-cadre">
                  <div className="pv-info-list">
                    {beat.frames.map((frame) => (
                      <div key={frame.title} className="pv-info-row">
                        {frame.icon && (
                          <span className="pv-info-ico" aria-hidden="true">
                            {frame.icon}
                          </span>
                        )}
                        <div className="pv-info-body">
                          <strong>{frame.title}</strong>
                          <p>{frame.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <figure className="pv-beat-photo">
                  {beat.imageBadge && <span className="pv-story-badge">{beat.imageBadge}</span>}
                  <div className="pv-square">
                    <img src={beat.image} alt={beat.imageTitle || product.heroTitle} />
                  </div>
                  {(beat.imageTitle || beat.imageText) && (
                    <figcaption>
                      {beat.imageTitle && <strong>{beat.imageTitle}</strong>}
                      {beat.imageText && <span>{beat.imageText}</span>}
                    </figcaption>
                  )}
                </figure>

                {beat.bridge && (
                  <div className="pv-info-cadre pv-bridge-cadre">
                    {beat.bridge.badge && (
                      <div className="pv-info-cadre-badge">{beat.bridge.badge}</div>
                    )}
                    <h3 className="pv-bridge-title">{beat.bridge.title}</h3>
                    <p className="pv-bridge-text">{beat.bridge.text}</p>
                    {beat.bridge.bullets && beat.bridge.bullets.length > 0 && (
                      <ul className="pv-bridge-bullets">
                        {beat.bridge.bullets.map((b) => (
                          <li key={b}>
                            <i className="fa-solid fa-circle-check" aria-hidden="true" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}

            {product.featureStrip && product.featureStrip.length > 0 && (
              <div className="pv-info-cadre">
                <div className="pv-info-cadre-badge">مميزات سريعة</div>
                <div className="pv-info-list">
                  {product.featureStrip.map((f) => (
                    <div key={f.title} className="pv-info-row">
                      <span className="pv-info-ico" aria-hidden="true">
                        {f.icon}
                      </span>
                      <div className="pv-info-body">
                        <strong>{f.title}</strong>
                        <p>{f.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="offer-cta-main" onClick={openSheet} style={{ marginTop: '0.5rem' }}>
              {product.ctaLabel} — {formatSar(offer.price)}
            </button>
          </div>
        </section>
      )}

      {!product.storyBeats?.length && product.featureStrip && product.featureStrip.length > 0 && (
        <section className="pv-story-section">
          <div className="container">
            <div className="pv-info-cadre">
              <div className="pv-info-cadre-badge">مميزات سريعة</div>
              <div className="pv-info-list">
                {product.featureStrip.map((f) => (
                  <div key={f.title} className="pv-info-row">
                    <span className="pv-info-ico" aria-hidden="true">
                      {f.icon}
                    </span>
                    <div className="pv-info-body">
                      <strong>{f.title}</strong>
                      <p>{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="emotional-pain-section">
        <div className="container">
          <h2 className="section-heading">{product.painTitle}</h2>
          <p className="section-subheading">{product.painText}</p>
          <div className="pain-list-grid">
            {product.painItems.map((item) => (
              <div key={item.title} className="pain-item">
                <span className="pv-emoji" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="installation-section">
        <div className="container">
          <h2 className="section-heading">{product.solutionTitle}</h2>
          <p className="section-subheading">{product.solutionText}</p>
          <img className="pv-solution-img" src={product.solutionImage} alt={product.solutionTitle} />
          <h3 className="section-heading pv-steps-title">{product.stepsTitle}</h3>
          <div className="steps-wrapper">
            {product.steps.map((step, i) => (
              <div key={step} className="step-card">
                <div className="step-badge">الخطوة {i + 1}</div>
                <h3>{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="container">
          <h2 className="section-heading">آراء 15 عميل من المملكة</h2>
          <p className="section-subheading">
            المرحلة {reviewPhase + 1} من {reviewPages.length} — شراء مؤكد وتجارب حقيقية
          </p>
          <div className="reviews-carousel-wrapper">
            <div className="review-page active">
              {reviewPages[reviewPhase]?.map((review) => (
                <article key={review.name} className="review-card">
                  <div className="review-head">
                    <div className="reviewer-avatar">{review.avatar}</div>
                    <div>
                      <div className="reviewer-name">{review.name}</div>
                      <div className="review-stars">
                        ★★★★★ <span className="verified-tag">شراء مؤكد</span>
                      </div>
                    </div>
                  </div>
                  <p className="review-text">{review.text}</p>
                </article>
              ))}
            </div>
            {reviewPages.length > 1 && (
              <div className="reviews-nav-bar">
                <button
                  type="button"
                  className="rev-nav-btn"
                  onClick={() => setReviewPhase((p) => (p <= 0 ? reviewPages.length - 1 : p - 1))}
                >
                  السابقة
                </button>
                <div className="rev-page-indicators">
                  {reviewPages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`rev-dot${reviewPhase === i ? ' active' : ''}`}
                      onClick={() => setReviewPhase(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="rev-nav-btn"
                  onClick={() => setReviewPhase((p) => (p >= reviewPages.length - 1 ? 0 : p + 1))}
                >
                  التالية
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="guarantee-section">
        <div className="container">
          <div className="premium-gold-animated">
            <div className="gold-guarantee-box">
              <div className="guarantee-badge">🏆 الضمان الذهبي 100%</div>
              <div className="guarantee-icon" aria-hidden="true">
                <i className="fa-solid fa-medal" />
              </div>
              <h3>{product.guaranteeTitle}</h3>
              <p>{product.guaranteeText}</p>
              {product.guaranteePoints && product.guaranteePoints.length > 0 && (
                <ul className="pv-guarantee-list">
                  {product.guaranteePoints.map((point) => (
                    <li key={point}>
                      <i className="fa-solid fa-circle-check" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="guarantee-footer-tag">
                <i className="fa-solid fa-handshake" aria-hidden="true" /> نتحمل نحن المخاطرة — رضاك قبل أي ريال ❤️
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <h2 className="section-heading">أسئلة شائعة</h2>
          <div className="faq-accordion">
            {product.faqs.map((faq, i) => (
              <div key={faq.q} className={`faq-item${openFaq === i ? ' active' : ''}`}>
                <button type="button" className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span aria-hidden="true">{openFaq === i ? '−' : '+'}</span>
                </button>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-order-section">
        <div className="container offer-container-box">
          <h2 className="section-heading">اختر العرض وأكّد الطلب</h2>
          <div className="hero-offers-wrapper" id="sheet-offers">{offers}</div>
          {product.offersPromoImage && (
            <img
              className="pv-offers-promo"
              src={product.offersPromoImage}
              alt="اختيار الباقة"
            />
          )}
          <button type="button" className="offer-cta-main" onClick={openSheet}>
            {product.ctaLabel} — {formatSar(offer.price)}
          </button>
        </div>
      </section>

      <section className="trust-cadre-container pv-trust-bottom" aria-label="مزايا الطلب">
        <div className="container">
          <div className="trust-cadre-grid">
            {product.trustCards.map((card) => (
              <div key={card.title} className="trust-cadre-card">
                <div className="trust-cadre-icon-wrap delivery">{card.icon}</div>
                <div className="trust-cadre-content">
                  <h4>{card.title}</h4>
                  <p>{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {mounted && sheetOpen && createPortal(sheet, document.body)}
      {mounted && createPortal(buyBar, document.body)}
    </div>
  );
}
