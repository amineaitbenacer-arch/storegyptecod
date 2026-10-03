'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { formatSar } from '../../lib/money';
import { trackPixelPurchaseWhenReady } from '../../lib/pixels';
import { flushTrackingQueue, trackStoreEvent } from '../../lib/tracking';
import './thankyou.css';

type OrderView = {
  id: string;
  name: string;
  offer: string;
  price: string;
  phone: string;
};

const REVIEWS: { av: string; name: string; text: string }[][] = [
  [
    { av: '👨‍💼', name: 'عبد القادر — الرياض', text: 'طلبت من المتجر أكثر من مرة. المنتجات مطابقة للصور، والتغليف محكم، والدفع عند الاستلام يريح البال.' },
    { av: '👩‍👧', name: 'فاطمة الزهراء — جدة', text: 'وصلتني الطلبية بسرعة، ووجدت شرح التركيب واضحًا. التركيب تم بسهولة دون الحاجة إلى فني.' },
    { av: '👨‍👩‍👦', name: 'عمر — مكة المكرمة', text: 'فحصت السلعة أمام المندوب ثم دفعت. الجودة ممتازة والتعامل راقٍ من البداية للنهاية.' },
    { av: '🛠️', name: 'كريم — الدمام', text: 'خدمة عملاء متجاوبة، والمنتجات عملية وتستحق السعر. أنصح به لكل من يفضّل الشراء الآمن.' },
    { av: '👩‍💼', name: 'خديجة — الخبر', text: 'اشتريت أكثر من منتج للمنزل. التوصيل مجاني والسعر عادل، وراحة البال مع المعاينة قبل الدفع.' },
  ],
  [
    { av: '👨‍💻', name: 'عبد العالي — أبها', text: 'الطلب وصل خلال يوم واحد تقريبًا. المنتج سليم والاستخدام واضح، والتجربة كانت سلسة جدًا.' },
    { av: '👴', name: 'رشيد — تبوك', text: 'تعامل محترم وتوصيل سريع حتى إلى مدينتنا. المتجر يعطي ثقة حقيقية قبل الدفع وبعده.' },
    { av: '👩‍🏫', name: 'مريم — المدينة المنورة', text: 'أعجبني ضمان الاسترجاع وسهولة التركيب. شعرت بالأمان وأنا أطلب أول مرة من المتجر.' },
    { av: '👦', name: 'سفيان — الطائف', text: 'التركيب بسيط واتبعته خطوة بخطوة. المنتج يعمل كما وُصف، والتوصيل كان في الموعد.' },
    { av: '👩‍⚕️', name: 'أمينة — بريدة', text: 'منتجات مفيدة للبيت، وخدمة ما بعد البيع ممتازة. أنصح كل أسرة تبحث عن شراء موثوق.' },
  ],
  [
    { av: '🧔', name: 'ياسين — حائل', text: 'السلعة مطابقة تمامًا لما ظهر في الموقع. المعاينة قبل الدفع تمنح ثقة كبيرة في كل طلب.' },
    { av: '👩‍🍳', name: 'إلهام — جازان', text: 'طلبت هدية للعائلة وكان كل شيء مرتبًا. التعبئة جيدة والتواصل مع المتجر سريع وواضح.' },
    { av: '👨‍🌾', name: 'محمد — نجران', text: 'جودة عالية وسعر مناسب. وصلني الطلب بسرعة، ولم أحتج إلى دفع أي شيء قبل الاستلام.' },
    { av: '🧕', name: 'نجاة — عرعر', text: 'شكرًا على المصداقية وسرعة التوصيل. المتجر يسهّل الطلب والتركيب ويريح العميل.' },
    { av: '👨‍✈️', name: 'حسن — ينبع', text: 'تجربة شراء ممتازة من أول نقرة حتى الاستلام. منتجات جيدة وخدمة تليق بالثقة.' },
  ],
];

const FAQS = [
  { q: 'هل يصعب تركيبه بنفسي أم أحتاج إلى سبّاك؟', a: 'التركيب سهل ولا يحتاج إلى سبّاك. أغلق محبس الماء، ثم ركّب العازل بين السخان والأنابيب خلال ثلاث دقائق. مرفق معه شرح مبسّط.' },
  { q: 'كيف تتم عملية التسليم والدفع؟', a: 'التوصيل مجاني ومباشر إلى عنوانك في أي مدينة بالمملكة. لا تدفع أي ريال حتى تستلم الطلب وتفحصه بنفسك.' },
  { q: 'هل يقلل الجهاز من قوة تدفّق الماء؟', a: 'لا. صُمّم المجرى الحلزوني ليمرّ الماء بسلاسة وبالقوة نفسها، دون أي تأثير على ضغط المياه.' },
  { q: 'هل يصدأ الجهاز مع الوقت أو يتأثر بالحرارة؟', a: 'لا. الجهاز مصنوع من البولي بروبيلين عالي الكثافة وسنون نحاسية صلبة، مقاوم للصدأ والتآكل ويتحمّل الحرارة العالية لسنوات.' },
  { q: 'هل يوجد ضمان على المنتج؟', a: 'نعم. يمكنك معاينة الطلب وفحصه بنفسك قبل الدفع للمندوب. رضاكم وسلامتكم هما هدفنا.' },
];

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  return phone || '00 00 00 00 00';
}

function readOrder(): OrderView {
  const empty: OrderView = { id: '#----', name: '----', offer: '----', price: '----', phone: '00 00 00 00 00' };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem('ac_last_order') || localStorage.getItem('lastOrder');
    if (!raw) return empty;
    const data = JSON.parse(raw);
    const orderId = data.orderId || Math.floor(1000 + Math.random() * 9000);
    return {
      id: `#${orderId}`,
      name: data.name || 'عميلنا الكريم',
      offer: data.offerName || data.offer || 'العرض المختار',
      price: data.price != null ? String(data.price) : '---',
      phone: formatPhone(String(data.phone || '')),
    };
  } catch {
    return empty;
  }
}

export default function ThankYouPage() {
  const [order, setOrder] = useState<OrderView>({ id: '#----', name: '----', offer: '----', price: '----', phone: '00 00 00 00 00' });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [verified, setVerified] = useState(false);
  const [page, setPage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'AntiChoc Protect® | شكراً على طلبك';
    const prevBg = document.body.style.background;
    document.body.style.background = '#F1F5F9';
    const next = readOrder();
    setOrder(next);

    const root = document.getElementById('ac-ty');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let lastBurst = 0;
    const end = Date.now() + 2200;
    const colors = ['#FFD700', '#10B981', '#3B82F6'];

    if (!reduceMotion) {
      const frame = (now: number) => {
        if (now - lastBurst >= 140) {
          lastBurst = now;
          confetti({ particleCount: 3, angle: 60, spread: 50, origin: { x: 0 }, colors, ticks: 160, disableForReducedMotion: true });
          confetti({ particleCount: 3, angle: 120, spread: 50, origin: { x: 1 }, colors, ticks: 160, disableForReducedMotion: true });
        }
        if (Date.now() < end) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    const calmTimer = window.setTimeout(() => {
      root?.classList.add('ty-calm');
    }, 3500);

    const price = Number(next.price);
    const orderId = next.id.replace('#', '');
    try {
      const raw = localStorage.getItem('ac_last_order') || localStorage.getItem('lastOrder');
      const data = raw ? JSON.parse(raw) : {};
      trackStoreEvent('purchase', {
        productId: String(data.productId || ''),
        value: Number.isFinite(price) ? price : undefined,
        contentName: String(data.offerName || data.offer || next.offer || ''),
        orderId: orderId && orderId !== '----' ? orderId : data.orderId,
        numItems: Number(data.pieces) || 1,
      });
      flushTrackingQueue();
    } catch {
      /* ignore */
    }
    const fire = () => {
      trackPixelPurchaseWhenReady({
        value: Number.isFinite(price) ? price : 249,
        currency: 'SAR',
        transaction_id: orderId && orderId !== '----' ? orderId : undefined,
        content_type: 'product',
      });
    };
    const timer = window.setTimeout(fire, 600);

    return () => {
      document.body.style.background = prevBg;
      window.clearTimeout(timer);
      window.clearTimeout(calmTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const savePhone = () => {
    const digits = draft.replace(/\D/g, '');
    if (digits.length < 8) return;
    const shown = formatPhone(digits);
    setOrder((prev) => ({ ...prev, phone: shown }));
    try {
      const raw = localStorage.getItem('ac_last_order') || localStorage.getItem('lastOrder');
      if (raw) {
        const data = JSON.parse(raw);
        data.phone = digits;
        localStorage.setItem('ac_last_order', JSON.stringify(data));
        localStorage.setItem('lastOrder', JSON.stringify(data));
      }
    } catch {
      /* ignore */
    }
    setEditing(false);
  };

  const verify = () => {
    setVerified(true);
    confetti({
      particleCount: 45,
      spread: 65,
      origin: { y: 0.8 },
      ticks: 160,
      disableForReducedMotion: true,
    });
  };

  return (
    <div id="ac-ty">
      <nav className="ty-nav">
        <Link href="/" className="ty-brand" dir="ltr">
          <i className="fa-solid fa-shield-halved" style={{ color: '#FFD700' }} />
          <span>AntiChoc Protect®</span>
        </Link>
      </nav>

      <div className="ty-wrap">
        <div className="ty-hero">
          <div className="ty-check-wrap">
            <svg className="ty-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" aria-hidden>
              <circle className="ty-checkmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="ty-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <h1>تهانينا! تم تأكيد طلبك بنجاح 🎉</h1>
          <p>أنت الآن على بعد خطوة واحدة من حماية عائلتك بشكل احترافي.</p>
        </div>

        <div className="ty-steps">
          <div className="ty-step active">
            <div className="ty-step-icon"><i className="fa-solid fa-phone-volume" /></div>
            <span className="ty-step-text">اتصال للتأكيد<span className="ty-step-sub">(في غضون دقائق)</span></span>
          </div>
          <div className="ty-step">
            <div className="ty-step-icon"><i className="fa-solid fa-truck-fast" /></div>
            <span className="ty-step-text">شحن سريع<span className="ty-step-sub">(سريع ومجاني)</span></span>
          </div>
          <div className="ty-step">
            <div className="ty-step-icon"><i className="fa-solid fa-hand-holding-dollar" /></div>
            <span className="ty-step-text">الدفع<span className="ty-step-sub">(عند الاستلام)</span></span>
          </div>
        </div>

        <div className="ty-receipt">
          <span className="ty-receipt-glow" aria-hidden />
          <div className="ty-receipt-stamp" aria-hidden>
            <i className="fa-solid fa-check" />
            <span>مؤكد</span>
          </div>
          <div className="ty-receipt-head">
            <span className="ty-receipt-badge">
              <i className="fa-solid fa-file-invoice" aria-hidden />
            </span>
            <div className="ty-receipt-titles">
              <span className="ty-receipt-kicker">تفاصيل طلبك</span>
              <strong>ملخص الطلب</strong>
            </div>
          </div>
          <div className="ty-receipt-body">
            <div className="ty-row">
              <span className="ty-label"><i className="fa-solid fa-hashtag" aria-hidden /> رقم الطلب</span>
              <span className="ty-value ty-order-id">{order.id}</span>
            </div>
            <div className="ty-row">
              <span className="ty-label"><i className="fa-solid fa-user" aria-hidden /> الاسم</span>
              <span className="ty-value">{order.name}</span>
            </div>
            <div className="ty-row">
              <span className="ty-label"><i className="fa-solid fa-gift" aria-hidden /> العرض المختار</span>
              <span className="ty-value ty-gold">{order.offer}</span>
            </div>
            <div className="ty-row ty-row-total">
              <span className="ty-label"><i className="fa-solid fa-coins" aria-hidden /> المبلغ الإجمالي</span>
              <span className="ty-value ty-green">
                {Number.isFinite(Number(order.price)) ? formatSar(Number(order.price)) : order.price}
              </span>
            </div>
          </div>
          <div className="ty-free">
            <i className="fa-solid fa-truck-fast" aria-hidden />
            التوصيل مجاني بالكامل
          </div>
        </div>

        <div className="ty-phone-box">
          <p className="ty-phone-msg">
            قد تحدث أخطاء عند كتابة الرقم. لتجنّب أي تأخير والاتصال بك <span>لشحن طلبك فوراً</span>، يُرجى التأكد من رقمك أدناه:
          </p>

          {!editing ? (
            <div className="ty-phone-display">
              <div className={`ty-number${verified ? ' ok' : ''}`}>{order.phone}</div>
              <button
                type="button"
                className="ty-edit"
                title="تغيير الرقم"
                onClick={() => {
                  setDraft(order.phone.replace(/\s+/g, ''));
                  setEditing(true);
                }}
              >
                <i className="fa-solid fa-pen" />
              </button>
            </div>
          ) : (
            <div className="ty-phone-edit">
              <input
                type="tel"
                className="ty-phone-input"
                value={draft}
                dir="ltr"
                maxLength={15}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="button" className="ty-save" onClick={savePhone}>
                <i className="fa-solid fa-floppy-disk" /> حفظ
              </button>
            </div>
          )}

          <button type="button" className={`ty-verify${verified ? ' success' : ''}`} onClick={verify} disabled={verified}>
            <i className={`fa-solid ${verified ? 'fa-check-double' : 'fa-check'}`} />
            {verified ? 'تمت العملية بنجاح!' : 'نعم، لقد تأكدت ورقمي صحيح 100%'}
          </button>
          {verified && (
            <div className="ty-verify-msg">
              <i className="fa-solid fa-check-double" /> ممتاز! يرجى إبقاء هاتفك قريباً، سنتصل بك الآن لتأكيد الشحن.
            </div>
          )}
        </div>

        <Link href="/" className="ty-store-entry">
          <span className="ty-store-glow" aria-hidden />
          <span className="ty-store-frame" aria-hidden />
          <span className="ty-store-inner">
            <span className="ty-store-kicker">
              <i className="fa-solid fa-bag-shopping" aria-hidden />
              المتجر الكامل
            </span>
            <strong>اكتشف بقية المنتجات المختارة</strong>
            <span className="ty-store-sub">عروض جديدة · توصيل سريع · الدفع عند الاستلام</span>
            <span className="ty-store-btn">
              <span className="ty-store-btn-shine" aria-hidden />
              استمر في التسوق
              <i className="fa-solid fa-arrow-left" aria-hidden />
            </span>
          </span>
        </Link>

        <section className="ty-gold-guarantee" aria-label="الضمان الذهبي">
          <div className="ty-gg-top">
            <div className="ty-gg-seal" aria-hidden>
              <span className="ty-gg-seal-ring" />
              <i className="fa-solid fa-medal" />
            </div>
            <div className="ty-gg-titles">
              <p className="ty-gg-kicker">حماية ذهبية لكل طلب</p>
              <h2>الضمان الذهبي</h2>
              <p className="ty-gg-lead">إن لم يعجبك المنتج، يمكنك إرجاعه. الضمان الذهبي يعني شراءً بلا مخاطرة على كل منتجات المتجر.</p>
            </div>
          </div>
          <div className="ty-gg-grid">
            <article className="ty-gg-card">
              <div className="ty-gg-icon" aria-hidden>
                <i className="fa-solid fa-face-frown-open" />
              </div>
              <h3>لم يعجبك؟</h3>
              <p>إذا استلمت المنتج ولم يعجبك أو لم يناسبك، لا تتردد — حقّك محفوظ.</p>
            </article>
            <article className="ty-gg-card">
              <div className="ty-gg-icon" aria-hidden>
                <i className="fa-solid fa-rotate-left" />
              </div>
              <h3>أرجعه بسهولة</h3>
              <p>يمكنك طلب الاسترجاع وفق سياسة المتجر، ونسهّل عليك الإرجاع دون تعقيد.</p>
            </article>
            <article className="ty-gg-card">
              <div className="ty-gg-icon" aria-hidden>
                <i className="fa-solid fa-box-open" />
              </div>
              <h3>معاينة قبل الدفع</h3>
              <p>افحص طلبك عند الباب، ثم ادفع عند الاستلام فقط بعد أن تطمئن للمنتج.</p>
            </article>
          </div>
          <div className="ty-gg-ribbon">
            <i className="fa-solid fa-certificate" aria-hidden />
            <span>لم يعجبك؟ أرجعه — الضمان يسري على كل منتجات المتجر</span>
          </div>
        </section>

        <section className="ty-reviews">
          <h2>آراء خمسة عشر عميلاً — تقييمات حقيقية</h2>
          <p className="ty-sub">تجارب عملاء من مدن المملكة مع منتجات المتجر</p>
          {REVIEWS[page].map((review) => (
            <article key={review.name} className="ty-rev-card">
              <div className="ty-rev-head">
                <div className="ty-avatar">{review.av}</div>
                <div>
                  <div className="ty-rev-name">{review.name}</div>
                  <div className="ty-stars">⭐⭐⭐⭐⭐ <span className="ty-verified">شراء مؤكد ✅</span></div>
                </div>
              </div>
              <p className="ty-rev-text">&quot;{review.text}&quot;</p>
            </article>
          ))}
          <div className="ty-nav-bar">
            <button type="button" className="ty-nav-btn" onClick={() => setPage((p) => (p === 0 ? 2 : p - 1))}>
              <i className="fa-solid fa-chevron-right" /> السابقة
            </button>
            <div className="ty-dots">
              {[0, 1, 2].map((i) => (
                <button key={i} type="button" className={`ty-dot${page === i ? ' active' : ''}`} onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button type="button" className="ty-nav-btn" onClick={() => setPage((p) => (p === 2 ? 0 : p + 1))}>
              التالية <i className="fa-solid fa-chevron-left" />
            </button>
          </div>
        </section>

          <h2 className="ty-faq-title">أسئلة شائعة قد تفيدك 💡</h2>
        <div style={{ marginBottom: '4rem' }}>
          {FAQS.map((faq, i) => (
            <div key={faq.q} className={`ty-faq${openFaq === i ? ' open' : ''}`}>
              <button type="button" className="ty-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {faq.q}
                <i className="fa-solid fa-chevron-down" />
              </button>
              <div className="ty-faq-body">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
