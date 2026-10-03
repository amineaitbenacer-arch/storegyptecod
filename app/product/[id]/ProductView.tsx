'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { OfferPack, ProductPageConfig } from '../../../lib/productPages';
import { CITIES } from '../../../lib/cities';
import { formatSar } from '../../../lib/money';
import { SHIPPING_FEE_SAR, orderTotalWithShipping } from '../../../lib/shipping';
import { saveLastOrder, thankYouHref } from '../../../lib/last-order';
import { isValidOrderPhone, normalizePhone, submitOrderToApi } from '../../../lib/submit-order';
import { flushTrackingQueue, trackingFields, trackStoreEvent } from '../../../lib/tracking';

function pickOffer(product: ProductPageConfig) {
  return product.offers.find((o) => o.popular) || product.offers[0];
}

export default function ProductView({ product }: { product: ProductPageConfig }) {
  const [offer, setOffer] = useState<OfferPack>(() => pickOffer(product));
  const [imgIdx, setImgIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reviewPhase, setReviewPhase] = useState(0);
  const [mounted, setMounted] = useState(false);

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
  const [address, setAddress] = useState('');
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
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sheetOpen]);

  const navLabel = useMemo(() => {
    if (offer.pieces) {
      const label = offer.pieces === 1 ? 'قطعة' : 'قطع';
      return `${offer.pieces} ${label} · ${formatSar(offer.price)}`;
    }
    return formatSar(offer.price);
  }, [offer]);

  function choose(next: OfferPack) {
    setOffer(next);
  }

  function openSheet() {
    trackStoreEvent('addtocart', {
      productId: product.id,
      value: orderTotalWithShipping(offer.price),
      contentName: offer.name,
    });
    setFormError('');
    setSheetOpen(true);
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
    if (!name.trim() || !city || !address.trim()) {
      setFormError('كمّل الاسم والمدينة والعنوان.');
      return;
    }
    if (!isValidOrderPhone(clean)) {
      setFormError('رقم الجوال يجب أن يكون 10 أرقام.');
      return;
    }
    setFormError('');
    setLoading(true);
    const orderId = `pl-${Date.now().toString(36)}`;
    const payable = orderTotalWithShipping(offer.price);
    trackStoreEvent('checkout', {
      productId: product.id,
      value: payable,
      contentName: offer.name,
    });
    const orderData = {
      orderId,
      name: name.trim(),
      phone: clean,
      city,
      address: address.trim(),
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

  const sheet = (
    <div className={`sheet-bg${sheetOpen ? ' open' : ''}`} onClick={() => setSheetOpen(false)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="استكمال الطلب">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 className="sheet-title" style={{ margin: 0 }}>
            استكمال الطلب
          </h2>
          <button type="button" className="close-btn" onClick={() => setSheetOpen(false)} aria-label="إغلاق">
            ×
          </button>
        </div>

        <div className="order-preview">
          <img src={product.catalogImage || heroSrc} alt="" width={48} height={48} />
          <div>
            <div className="op-name">{offer.name}</div>
            <div className="op-price">{formatSar(offer.price)}</div>
          </div>
        </div>

        {offers}

        <form
          className="pv-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input className="form-inp" placeholder="الاسم الكامل" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="form-inp"
            placeholder="رقم الجوال (05XXXXXXXX)"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
          <select className="form-inp" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">المدينة</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input className="form-inp" placeholder="العنوان بالتفصيل" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />

          {formError && <p className="pv-form-error">{formError}</p>}

          <div className="total-box checkout-sum">
            <div className="checkout-sum-row">
              <span>المنتج</span>
              <b>{formatSar(offer.price)}</b>
            </div>
            <div className="checkout-sum-row">
              <span>التوصيل</span>
              <b>{formatSar(SHIPPING_FEE_SAR)}</b>
            </div>
            <div className="checkout-sum-total">
              <span>المجموع عند الاستلام</span>
              <strong>{formatSar(total)}</strong>
            </div>
          </div>

          <button type="submit" className="offer-cta-main" disabled={loading}>
            {loading ? 'جاري تسجيل الطلب...' : `أكّد الطلب — ${formatSar(total)}`}
          </button>
          <div className="privacy">الدفع عند الاستلام بعد ما تشوف السلعة</div>
        </form>
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
            <button type="button" className="nav-aov-btn" onClick={goToOffers} aria-label="الانتقال إلى العروض">
              <span className="aov-text">{navLabel}</span>
            </button>
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

          <div className="hero-title-area">
            <div className="hero-title-badge">{product.badge}</div>
            <h1 className="prod-name-new">{product.heroTitle}</h1>
          </div>

          <div className="price-block">
            <div className="price-header-row">
              <div className="price-new-large">
                <span className="latin-nums">{offer.price}</span> <small>ريال</small>
              </div>
              <div className="price-old-sub">{formatSar(offer.oldPrice)}</div>
              <div className="price-save-mini">توفير {formatSar(save)}</div>
            </div>
            <div className="price-save-badge">وفّرت {formatSar(save)} اليوم — عرض محدود</div>
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

          <div className="trust-cadre-container">
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

          {product.featureStrip && product.featureStrip.length > 0 && (
            <div className="pv-feature-strip">
              {product.featureStrip.map((f) => (
                <div key={f.title} className="pv-feature-chip">
                  <span className="pv-feature-ico" aria-hidden="true">
                    {f.icon}
                  </span>
                  <div>
                    <strong>{f.title}</strong>
                    <p>{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {product.storyBeats && product.storyBeats.length > 0 && (
        <section className="product-visual-description-section pv-story-section">
          <div className="container">
            <div className="pvd-header text-center">
              <span className="pvd-badge">تفاصيل المنتج بالصور</span>
              <h2 className="section-heading">لماذا العائلات تطلبه اليوم؟</h2>
              <p className="section-subheading">كل صورتين شرح… ثم صورة مربعة 1:1 تثبت الكلام</p>
            </div>

            {product.storyBeats.map((beat, i) => (
              <div key={beat.imageTitle || beat.image} className="pv-beat">
                <div className="pv-beat-frames">
                  {beat.frames.map((frame) => (
                    <div key={frame.title} className="pv-frame-card">
                      {frame.icon && (
                        <span className="pv-frame-ico" aria-hidden="true">
                          {frame.icon}
                        </span>
                      )}
                      <h3>{frame.title}</h3>
                      <p>{frame.text}</p>
                    </div>
                  ))}
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
                  <span className="pv-beat-num">{i + 1} / {product.storyBeats!.length}</span>
                </figure>
              </div>
            ))}

            <button type="button" className="offer-cta-main" onClick={openSheet} style={{ marginTop: '0.5rem' }}>
              {product.ctaLabel} — {formatSar(offer.price)}
            </button>
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
          <div className="gold-guarantee-box premium-gold-animated">
            <div className="guarantee-badge">الضمان الذهبي</div>
            <h3>{product.guaranteeTitle}</h3>
            <p>{product.guaranteeText}</p>
            {product.guaranteePoints && product.guaranteePoints.length > 0 && (
              <ul className="pv-guarantee-list">
                {product.guaranteePoints.map((point) => (
                  <li key={point}>
                    <i className="fa-solid fa-circle-check" aria-hidden="true" /> {point}
                  </li>
                ))}
              </ul>
            )}
            <div className="guarantee-footer-tag">سياسة استرجاع واضحة — رضاك قبل أي ريال</div>
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
          <button type="button" className="offer-cta-main" onClick={openSheet}>
            {product.ctaLabel} — {formatSar(offer.price)}
          </button>
        </div>
      </section>

      {mounted && sheetOpen && createPortal(sheet, document.body)}
      {mounted && createPortal(buyBar, document.body)}
    </div>
  );
}
