'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import SaPhoneField from '../components/SaPhoneField';
import { formatSar } from '../../lib/money';
import { SHIPPING_FEE_SAR, orderTotalWithShipping } from '../../lib/shipping';
import './store-checkout-sheet.css';

export type CheckoutCartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  oldPrice?: number;
};

type Props = {
  open: boolean;
  items: CheckoutCartItem[];
  total: number;
  name: string;
  phone: string;
  city: string;
  phoneError: string;
  submitting: boolean;
  onBack: () => void;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onCity: (v: string) => void;
  onSubmit: () => void;
};

export default function StoreCheckoutSheet({
  open,
  items,
  total,
  name,
  phone,
  city,
  phoneError,
  submitting,
  onBack,
  onName,
  onPhone,
  onCity,
  onSubmit,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const lead = items[0];
  const pieces = items.reduce((n, i) => n + i.qty, 0);
  const leadOld =
    lead?.oldPrice && lead.oldPrice > lead.price ? lead.oldPrice * lead.qty : undefined;
  const grandTotal = orderTotalWithShipping(total);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const keepFieldVisible = (el: HTMLElement) => {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        const vv = window.visualViewport;
        if (!vv) return;
        const keyboardPad = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        sheet.style.paddingBottom = `${Math.max(18, keyboardPad + 18)}px`;
        sheet.style.maxHeight = `${Math.min(vv.height * 0.96, window.innerHeight * 0.92)}px`;
      }, 120);
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') {
        keepFieldVisible(t);
      }
    };

    const onViewport = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const keyboardPad = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      sheet.style.paddingBottom = `${Math.max(18, keyboardPad + 18)}px`;
      sheet.style.maxHeight = `${Math.min(vv.height * 0.96, window.innerHeight * 0.92)}px`;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        sheet.contains(active) &&
        (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')
      ) {
        active.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    };

    sheet.addEventListener('focusin', onFocusIn);
    window.visualViewport?.addEventListener('resize', onViewport);
    window.visualViewport?.addEventListener('scroll', onViewport);
    onViewport();

    return () => {
      sheet.removeEventListener('focusin', onFocusIn);
      window.visualViewport?.removeEventListener('resize', onViewport);
      window.visualViewport?.removeEventListener('scroll', onViewport);
      sheet.style.paddingBottom = '';
      sheet.style.maxHeight = '';
    };
  }, [open]);

  if (!open || !lead) return null;

  return (
    <div
      className={`store-ac-sheet-bg${open ? ' open' : ''}`}
      onClick={onBack}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className="store-ac-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="استكمال الطلب"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="store-ac-sheet-handle" aria-hidden />

        <div className="store-ac-sheet-head">
          <h2 className="store-ac-sheet-title">🚀 استكمال الطلب</h2>
          <button type="button" className="store-ac-close" aria-label="رجوع للسلة" onClick={onBack}>
            ×
          </button>
        </div>

        <div className="store-ac-offer">
          <div className="store-ac-offer-badge">طلبك المختار</div>
          <div className="store-ac-offer-top">
            <div className="store-ac-offer-thumb">
              <Image src={lead.image} alt="" fill sizes="56px" style={{ objectFit: 'cover' }} />
            </div>
            <div className="store-ac-offer-info">
              <span className="store-ac-offer-tag">
                {items.length > 1 ? `${items.length} منتجات` : 'منتج السلة'}
              </span>
              <div className="store-ac-offer-name">
                {items.length === 1 ? `${lead.name} × ${lead.qty}` : `${pieces} قطعة في طلبك`}
              </div>
              <div className="store-ac-offer-sub">الدفع عند الاستلام · توصيل {formatSar(SHIPPING_FEE_SAR)} 🚚</div>
            </div>
            <div className="store-ac-offer-pricing">
              <div className="store-ac-offer-price">{formatSar(grandTotal)}</div>
              {leadOld ? <div className="store-ac-offer-old">{formatSar(leadOld)}</div> : null}
            </div>
          </div>

          {items.length > 1 ? (
            <div className="store-ac-lines">
              {items.map((item) => (
                <div key={item.id} className="store-ac-line">
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <b>{formatSar(item.price * item.qty)}</b>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="store-ac-congrats">
          <i className="fa-solid fa-gift" aria-hidden />
          <span>اختيار ذكي — طلبك جاهز للإرسال مع المعاينة قبل الدفع</span>
        </div>

        <div className="store-ac-trust">
          <div className="store-ac-trust-item">
            <span aria-hidden>🚚</span>
            <div>
              <strong>توصيل {formatSar(SHIPPING_FEE_SAR)}</strong>
              <em>لجميع مدن السعودية 🇸🇦</em>
            </div>
          </div>
          <div className="store-ac-trust-item">
            <span aria-hidden>🤝</span>
            <div>
              <strong>المعاينة قبل الدفع</strong>
              <em>تفحص المنتج قبل الدفع</em>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <input
            className="store-ac-inp"
            type="text"
            placeholder="👤 الاسم الكامل"
            value={name}
            onChange={(e) => onName(e.target.value)}
            autoComplete="name"
            enterKeyHint="next"
            required
          />
          <SaPhoneField variant="store" value={phone} error={phoneError} onChange={onPhone} />
          <input
            className="store-ac-inp"
            type="text"
            placeholder="📍 المدينة"
            value={city}
            onChange={(e) => onCity(e.target.value)}
            autoComplete="address-level2"
            enterKeyHint="done"
            required
          />

          <div className="store-ac-sum">
            <div className="store-ac-sum-row">
              <span>مجموع المنتجات</span>
              <b>{formatSar(total)}</b>
            </div>
            <div className="store-ac-sum-row">
              <span>التوصيل</span>
              <b>{formatSar(SHIPPING_FEE_SAR)}</b>
            </div>
            <div className="store-ac-total">
              <span>المجموع عند الاستلام:</span>
              <strong>{formatSar(grandTotal)}</strong>
            </div>
          </div>

          <button type="submit" className="store-ac-submit pulse" disabled={submitting}>
            {submitting ? '⏳ جاري تسجيل الطلب...' : '🛒 اطلب الآن'}
          </button>
          <div className="store-ac-privacy">🔒 معلوماتك آمنة ومشفرة 100%</div>
        </form>

        <button type="button" className="store-ac-back" onClick={onBack}>
          ← رجوع للسلة
        </button>
      </div>
    </div>
  );
}
