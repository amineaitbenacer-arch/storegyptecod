'use client';

import { HONEYPOT_FIELD } from '../../lib/anti-bot';

/** Invisible field — real users never see/fill it; bots often do. */
export default function HoneypotField() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: 1,
        height: 1,
        overflow: 'hidden',
      }}
    >
      <label htmlFor={`hp-${HONEYPOT_FIELD}`}>Website</label>
      <input
        id={`hp-${HONEYPOT_FIELD}`}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
