'use client';

import { useEffect, useState } from 'react';
import { CITIES } from '../../lib/cities';
import './live-purchase-toast.css';

type ToastItem = {
  name: string;
  city: string;
  verb: 'اشترى' | 'اشترت';
};

/** أسماء عربية قصيرة + كنى شائعة — بدون لقب عائلة */
const MALE: ToastItem['name'][] = [
  'أحمد',
  'محمد',
  'خالد',
  'فهد',
  'سعد',
  'عمر',
  'يوسف',
  'عبدالله',
  'سلطان',
  'تركي',
  'بندر',
  'ناصر',
  'أبو محمد',
  'أبو عبدالله',
  'أبو فهد',
];

const FEMALE: ToastItem['name'][] = [
  'آمال',
  'نورة',
  'سارة',
  'فاطمة',
  'ريم',
  'لينا',
  'هند',
  'مها',
  'جواهر',
  'أم نورة',
  'أم محمد',
  'أم عبدالله',
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function nextToast(prevName?: string): ToastItem {
  const female = Math.random() < 0.45;
  const pool = female ? FEMALE : MALE;
  let name = pick(pool);
  if (pool.length > 1 && name === prevName) {
    name = pick(pool.filter((n) => n !== prevName));
  }
  return {
    name,
    city: pick(CITIES),
    verb: female ? 'اشترت' : 'اشترى',
  };
}

type Props = {
  hidden?: boolean;
};

const SHOW_MS = 3800;
const OUT_MS = 720;
const CYCLE_MS = 7000; // كل ~7 ثوانٍ وحدة جديدة
const GAP_MS = Math.max(800, CYCLE_MS - SHOW_MS - OUT_MS);
const FIRST_DELAY_MS = 3200;

export default function LivePurchaseToast({ hidden = false }: Props) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const [phase, setPhase] = useState<'in' | 'out' | 'idle'>('idle');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (hidden) {
      setPhase('idle');
      setItem(null);
      return;
    }

    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    let gapTimer: number | undefined;
    let cancelled = false;
    let lastName = '';

    const schedule = (delayMs: number) => {
      showTimer = window.setTimeout(() => {
        if (cancelled) return;
        if (document.hidden) {
          schedule(CYCLE_MS);
          return;
        }
        const next = nextToast(lastName);
        lastName = next.name;
        setItem(next);
        setTick((n) => n + 1);
        setPhase('in');
        hideTimer = window.setTimeout(() => {
          if (cancelled) return;
          setPhase('out');
          gapTimer = window.setTimeout(() => {
            if (cancelled) return;
            setPhase('idle');
            setItem(null);
            schedule(GAP_MS);
          }, OUT_MS);
        }, SHOW_MS);
      }, delayMs);
    };

    schedule(FIRST_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(gapTimer);
    };
  }, [hidden]);

  if (hidden || !item || phase === 'idle') return null;

  return (
    <div
      key={tick}
      className={`lp-live-toast lp-live-toast--${phase}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="lp-live-toast-main">
        <span className="lp-live-toast-mark" aria-hidden>
          <img src="/images/logo-mark.png" alt="" width={40} height={40} />
        </span>
        <div className="lp-live-toast-copy">
          <p className="lp-live-toast-text">
            <span className="lp-live-toast-verb">{item.verb}</span>{' '}
            <strong className="lp-live-toast-name">{item.name}</strong>
          </p>
          <p className="lp-live-toast-sub">
            من <span className="lp-live-toast-city">{item.city}</span> · من هنا
          </p>
        </div>
      </div>
      <div className="lp-live-toast-brand">
        <img src="/images/logo-mark.png" alt="" width={18} height={18} />
        <span className="lp-live-toast-brand-name">Dune Market</span>
      </div>
    </div>
  );
}
