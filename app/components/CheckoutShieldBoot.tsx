'use client';

import { useEffect } from 'react';
import { markCheckoutReady } from '../../lib/submit-order';

/**
 * Global boot — runs on every store page (home, any product, future LPs).
 * Starts the anti-bot fill timer so protection is ON by default, not per-product.
 */
export default function CheckoutShieldBoot() {
  useEffect(() => {
    markCheckoutReady();
  }, []);

  return null;
}
