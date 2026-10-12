'use client';

import { useRef } from 'react';
import { ORDER_ALREADY_RECORDED_MSG } from '../../lib/order-messages';
import { draftFromPhoneTail, PHONE_TOO_LONG_MSG } from '../../lib/phone';
import './sa-phone-field.css';

type Props = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  variant?: 'store' | 'product';
};

export default function SaPhoneField({ id, value, onChange, error, variant = 'store' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const full = value.startsWith('05') ? value : '05';
  const tail = full.slice(2);
  const tooLong = full.length > 10;
  const message = tooLong ? PHONE_TOO_LONG_MSG : error || '';
  const isOkMessage = message === ORDER_ALREADY_RECORDED_MSG;
  const ready = !message && full.length === 10;
  const fieldState = message ? (isOkMessage ? ' ok' : ' error') : ready ? ' ready' : '';

  function focusTail() {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }

  return (
    <div className="sa-phone-wrap">
      <div className={`sa-phone ${variant}${fieldState}`}>
        <span className="sa-phone-prefix" onMouseDown={(e) => e.preventDefault()} onClick={focusTail}>
          05
        </span>
        <input
          ref={inputRef}
          id={id}
          className="sa-phone-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          enterKeyHint="next"
          placeholder="XXXXXXXX"
          aria-label="رقم الجوال، يبدأ بـ 05"
          aria-invalid={message && !isOkMessage ? true : undefined}
          value={tail}
          onChange={(e) => onChange(draftFromPhoneTail(e.target.value))}
        />
      </div>
      {message ? (
        <p className={`sa-phone-err${isOkMessage ? ' ok' : ''}`}>{message}</p>
      ) : null}
    </div>
  );
}
