'use client';

import { useState } from 'react';
import {
  RETURN_FORM_TEMPLATE,
  RETURN_HIGHLIGHTS,
  RETURN_POLICY_FAQS,
  RETURN_WHATSAPP,
  RETURN_WHATSAPP_URL,
} from '../../lib/return-policy';
import './return-policy.css';

type Props = {
  variant?: 'full' | 'compact';
  showTitle?: boolean;
  /** إخفاء واتساب/النموذج (مثلاً صفحة الشكر) */
  showContact?: boolean;
};

export default function ReturnPolicyPanel({
  variant = 'full',
  showTitle = true,
  showContact = true,
}: Props) {
  const [copied, setCopied] = useState<'phone' | 'form' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  async function copyText(text: string, kind: 'phone' | 'form') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`rp-panel rp-${variant}`}>
      {showTitle ? (
        <header className="rp-head">
          <span className="rp-badge" aria-hidden>
            <i className="fa-solid fa-shield-halved" />
          </span>
          <div>
            <p className="rp-kicker">اشترِ بثقة — حقّك محفوظ</p>
            <h3>الضمان الذهبي</h3>
            <p className="rp-lead">
              معاينة قبل الدفع، ودعم سريع، وضمان واضح — تشتري وقلبك مرتاح.
            </p>
          </div>
        </header>
      ) : null}

      <div className="rp-highlights">
        {RETURN_HIGHLIGHTS.map((h) => (
          <article key={h.title} className="rp-hi">
            <i className={`fa-solid ${h.icon}`} aria-hidden />
            <strong>{h.title}</strong>
            <span>{h.text}</span>
          </article>
        ))}
      </div>

      {variant === 'full' ? (
        <div className="rp-faqs" aria-label="أسئلة شائعة حول الضمان">
          <p className="rp-faqs-title">أسئلة شائعة — اضغط على السؤال</p>
          {RETURN_POLICY_FAQS.map((faq, i) => {
            const open = openFaq === i;
            return (
              <div key={faq.q} className={`rp-faq${open ? ' open' : ''}`}>
                <button
                  type="button"
                  className="rp-faq-btn"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                >
                  <span>{faq.q}</span>
                  <i className="fa-solid fa-chevron-down" aria-hidden />
                </button>
                <div className="rp-faq-body">{faq.a}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="rp-compact-list">
          <li>معاينة المنتج عند الباب قبل الدفع</li>
          <li>استرجاع 3 أيام · استبدال 7 أيام إن احتجت</li>
          <li>منتج خاطئ؟ الشحن علينا ونصلّح الوضع فورًا</li>
          <li>دعم سريع خلال 48 ساعة — تشتري بقلب مرتاح</li>
        </ul>
      )}

      {showContact ? (
        <div className="rp-wa">
          <div className="rp-wa-top">
            <strong>
              <i className="fa-brands fa-whatsapp" aria-hidden /> دعم سريع لأي استفسار
            </strong>
            <span>راسلنا متى ما احتجت — نرد خلال 48 ساعة</span>
          </div>

          <div className="rp-phone-row">
            <div className="rp-phone-card" dir="ltr">
              <i className="fa-solid fa-phone" aria-hidden />
              <a href={RETURN_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                {RETURN_WHATSAPP}
              </a>
            </div>
            <button
              type="button"
              className="rp-copy-btn"
              onClick={() => copyText(RETURN_WHATSAPP, 'phone')}
              aria-label="نسخ رقم الواتساب"
              title="نسخ الرقم"
            >
              <i className={`fa-solid ${copied === 'phone' ? 'fa-check' : 'fa-copy'}`} aria-hidden />
              {copied === 'phone' ? 'تم النسخ' : 'نسخ'}
            </button>
          </div>

          <pre className="rp-form" dir="rtl">
            {RETURN_FORM_TEMPLATE}
          </pre>
          <div className="rp-form-actions">
            <button type="button" className="rp-copy-btn soft" onClick={() => copyText(RETURN_FORM_TEMPLATE, 'form')}>
              <i className={`fa-solid ${copied === 'form' ? 'fa-check' : 'fa-copy'}`} aria-hidden />
              {copied === 'form' ? 'تم نسخ النموذج' : 'نسخ النموذج'}
            </button>
            <a className="rp-wa-link" href={RETURN_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-whatsapp" aria-hidden />
              فتح واتساب
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
