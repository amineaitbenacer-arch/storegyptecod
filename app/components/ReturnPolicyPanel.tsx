'use client';

import { useState } from 'react';
import {
  RETURN_EXCLUSIONS,
  RETURN_FOOT_NOTES,
  RETURN_FORM_TEMPLATE,
  RETURN_HIGHLIGHTS,
  RETURN_PROCESS,
  RETURN_RULES,
  RETURN_WHATSAPP,
  RETURN_WHATSAPP_URL,
} from '../../lib/return-policy';
import './return-policy.css';

type Props = {
  variant?: 'full' | 'compact';
  showTitle?: boolean;
};

export default function ReturnPolicyPanel({ variant = 'full', showTitle = true }: Props) {
  const [copied, setCopied] = useState<'phone' | 'form' | null>(null);

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
            <i className="fa-solid fa-scale-balanced" />
          </span>
          <div>
            <p className="rp-kicker">شفافية كاملة قبل وبعد الطلب</p>
            <h3>سياسة الاستبدال والاسترجاع</h3>
            <p className="rp-lead">
              حقّك محفوظ: استرجاع خلال 3 أيام واستبدال خلال 7 أيام من الاستلام — وفق البنود أدناه.
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
        <>
          <ol className="rp-rules">
            {RETURN_RULES.map((rule, i) => (
              <li key={i}>
                <em>{i + 1}</em>
                <span>{rule}</span>
              </li>
            ))}
          </ol>

          <div className="rp-block">
            <h4>
              <i className="fa-solid fa-route" aria-hidden /> آلية الإرجاع
            </h4>
            <ul>
              {RETURN_PROCESS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="rp-block rp-block-warn">
            <h4>
              <i className="fa-solid fa-triangle-exclamation" aria-hidden /> غير قابل للاستبدال/الإرجاع
            </h4>
            <p>
              لا يتم الاستبدال أو الإرجاع للمنتجات المفتوحة إذا لم يثبت عيب مصنعي. كذلك كل ما يخرج عن شروط
              الضمان مثل:
            </p>
            <div className="rp-chips">
              {RETURN_EXCLUSIONS.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>

          <ul className="rp-notes">
            {RETURN_FOOT_NOTES.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="rp-compact-list">
          <li>استرجاع 3 أيام · استبدال 7 أيام من الاستلام</li>
          <li>منتج خاطئ؟ الشحن على المتجر</li>
          <li>إرجاع لرغبة الزبون أو استبدال: رسوم شحن 25 ريال</li>
          <li>يجب أن يكون المنتج بحالته الأصلية مع الملحقات والتغليف</li>
          <li>الطلب عبر واتساب بعد تعبئة النموذج — رد خلال 48 ساعة</li>
        </ul>
      )}

      <div className="rp-wa">
        <div className="rp-wa-top">
          <strong>
            <i className="fa-brands fa-whatsapp" aria-hidden /> لطلب الاسترجاع / الاستبدال
          </strong>
          <span>عبّئ النموذج ثم راسلنا — نرد خلال 48 ساعة</span>
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
    </div>
  );
}
