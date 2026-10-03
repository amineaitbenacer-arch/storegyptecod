'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProductPageConfig, OfferPack } from '../../lib/productPages';
import { CITIES } from '../../lib/cities';
import { formatSar } from '../../lib/money';
import { trackingFields, trackStoreEvent } from '../../lib/tracking';
import './product-landing.css';

export default function ProductLanding({ product }: { product: ProductPageConfig }) {
  const router = useRouter();
  const [mainIdx, setMainIdx] = useState(0);
  const [offer, setOffer] = useState<OfferPack>(product.offers.find((o) => o.popular) || product.offers[0]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  const save = useMemo(() => offer.oldPrice - offer.price, [offer]);
  const openSheet = useCallback(() => {
    trackStoreEvent('addtocart', {
      productId: product.id,
      value: offer.price,
      contentName: offer.name,
    });
    setSheetOpen(true);
  }, [product.id, offer.price, offer.name]);

  async function submit() {
    const clean = phone.replace(/\D/g, '');
    if (!name.trim() || !city || !address.trim() || clean.length !== 10) {
      setPhoneError(clean.length !== 10 ? '⚠️ رقم الهاتف يجب أن يكون 10 أرقام' : '');
      return;
    }
    setLoading(true);
    trackStoreEvent('checkout', {
      productId: product.id,
      value: offer.price,
      contentName: offer.name,
    });
    const orderData = {
      orderId: Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      phone: clean,
      city,
      address: address.trim(),
      offer: offer.name,
      offerName: `${product.brand} — ${offer.name}`,
      price: offer.price,
      pieces: offer.id,
      packId: offer.id,
      ...trackingFields(),
      productId: product.id,
    };
    localStorage.setItem('lastOrder', JSON.stringify(orderData));
    localStorage.setItem('ac_last_order', JSON.stringify(orderData));
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
    } catch {
      /* offline */
    }
    router.push('/thankyou');
  }

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <div className="pl-top">
          <Link href="/" className="pl-back">
            ← المتجر
          </Link>
          <span className="pl-brand">
            {product.emoji} {product.brand}
          </span>
        </div>

        <div className="pl-marquee">{product.marquee}</div>

        <section className="pl-section">
          <div className="pl-warning">{product.warning}</div>

          <div className="pl-hero-img">
            <span className="pl-hero-badge">{product.heroBadge}</span>
            <Image
              src={product.images[mainIdx]}
              alt={product.heroTitle}
              fill
              priority
              sizes="(max-width:720px) 100vw, 560px"
              style={{ objectFit: 'cover' }}
            />
          </div>

          <div className="pl-thumbs">
            {product.images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={`pl-thumb${mainIdx === i ? ' active' : ''}`}
                onClick={() => setMainIdx(i)}
              >
                <Image src={src} alt="" fill sizes="80px" style={{ objectFit: 'cover' }} />
              </button>
            ))}
          </div>

          <div className="pl-title-wrap">
            <span className="pl-type-badge">{product.badge}</span>
            <h1>{product.heroTitle}</h1>
            <p>{product.heroSubtitle}</p>
          </div>

          <div className="pl-price-block">
            <div className="pl-price-row">
              <span className="pl-price-new">{formatSar(offer.price)}</span>
              <span className="pl-price-old">{formatSar(offer.oldPrice)}</span>
              <span className="pl-save">توفير {formatSar(save)}</span>
            </div>
            <div className="pl-save-bar">وفّرت {formatSar(save)} مع توصيل مجاني</div>
          </div>

          <div className="pl-offers">
            <div className="pl-offers-head">📦 اختر العرض المناسب:</div>
            {product.offers.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`pl-offer${offer.id === o.id ? ' selected' : ''}${o.popular ? ' popular' : ''}`}
                onClick={() => setOffer(o)}
              >
                {o.badge && <span className="pl-offer-badge">{o.badge}</span>}
                <span className="pl-radio">{offer.id === o.id && <span />}</span>
                <span className="pl-offer-info">
                  <strong>{o.name}</strong>
                  <small>{o.sub}</small>
                </span>
                <span className="pl-offer-prices">
                  <s>{formatSar(o.oldPrice)}</s>
                  <b>{formatSar(o.price)}</b>
                </span>
              </button>
            ))}
          </div>

          <button type="button" className="pl-cta" onClick={openSheet}>
            {product.ctaLabel} — {formatSar(offer.price)}
          </button>
          <div className="pl-reassure">🛡️ ضمان الجودة • 🚚 توصيل مجاني • 🤝 معاينة قبل الدفع</div>

          <div className="pl-trust-grid">
            {product.trustCards.map((c) => (
              <div key={c.title} className="pl-trust-card">
                <span>{c.icon}</span>
                <div>
                  <strong>{c.title}</strong>
                  <p>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pl-block pl-pain">
          <h2>{product.painTitle}</h2>
          <p>{product.painText}</p>
          <div className="pl-pain-list">
            {product.painItems.map((item) => (
              <div key={item.title} className="pl-pain-item">
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pl-block pl-solution">
          <h2>{product.solutionTitle}</h2>
          <p>{product.solutionText}</p>
          <div className="pl-solution-img">
            <Image src={product.solutionImage} alt="" fill sizes="560px" style={{ objectFit: 'contain' }} />
          </div>
        </section>

        <section className="pl-block">
          <h2>{product.stepsTitle}</h2>
          <div className="pl-steps">
            {product.steps.map((step, i) => (
              <div key={step} className="pl-step">
                <span>{i + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="pl-block">
          <h2>⭐ آراء الزبائن</h2>
          {product.reviews.map((r) => (
            <div key={r.name} className="pl-review">
              <div className="pl-review-head">
                <span>{r.avatar}</span>
                <div>
                  <strong>{r.name}</strong>
                  <div>⭐⭐⭐⭐⭐ شراء مؤكد ✅</div>
                </div>
              </div>
              <p>{r.text}</p>
            </div>
          ))}
        </section>

        <section className="pl-block pl-guarantee">
          <div className="pl-guarantee-inner">
            <div className="pl-guarantee-badge">🏆 ضمان 100%</div>
            <h2>{product.guaranteeTitle}</h2>
            <p>{product.guaranteeText}</p>
          </div>
        </section>

        <section className="pl-block">
          <h2>أسئلة شائعة</h2>
          {product.faqs.map((f, i) => (
            <div key={f.q} className={`pl-faq${openFaq === i ? ' open' : ''}`}>
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                <span>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p>{f.a}</p>}
            </div>
          ))}
        </section>

        <section className="pl-block">
          <button type="button" className="pl-cta" onClick={openSheet}>
            تأكيد الطلب — {formatSar(offer.price)}
          </button>
        </section>

        <div className="pl-sticky">
          <div>
            <small>المجموع عند الاستلام</small>
            <strong>
              {formatSar(offer.price)}
            </strong>
          </div>
          <button type="button" onClick={openSheet}>
            اطلب الآن
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div className="pl-sheet-bg" onClick={() => setSheetOpen(false)}>
          <div className="pl-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="pl-sheet-handle" />
            <button type="button" className="pl-sheet-close" onClick={() => setSheetOpen(false)}>
              ✕
            </button>
            <h2>أكمل طلبك</h2>

            <div className="pl-offers">
              {product.offers.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`pl-offer${offer.id === o.id ? ' selected' : ''}`}
                  onClick={() => setOffer(o)}
                >
                  <span className="pl-radio">{offer.id === o.id && <span />}</span>
                  <span className="pl-offer-info">
                    <strong>{o.name}</strong>
                    <small>{o.sub}</small>
                  </span>
                  <span className="pl-offer-prices">
                    <b>{formatSar(o.price)}</b>
                  </span>
                </button>
              ))}
            </div>

            <input className="pl-input" placeholder="الاسم الكامل *" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              className={`pl-input${phoneError ? ' error' : ''}`}
              placeholder="رقم الجوال (05XXXXXXXX) *"
              inputMode="numeric"
              value={phone}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(v);
                setPhoneError(v && v.length < 10 ? '⚠️ 10 أرقام' : '');
              }}
            />
            {phoneError && <p className="pl-err">{phoneError}</p>}
            <select className="pl-input" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">اختر المدينة *</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input className="pl-input" placeholder="العنوان الكامل *" value={address} onChange={(e) => setAddress(e.target.value)} />

            <div className="pl-total">
              <span>المجموع عند الاستلام</span>
              <strong>{formatSar(offer.price)}</strong>
              <small>🚚 التوصيل مجاني</small>
            </div>

            <button type="button" className="pl-cta" disabled={loading} onClick={submit}>
              {loading ? '⏳ جاري الإرسال...' : '✅ أكّد الطلب الآن'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
