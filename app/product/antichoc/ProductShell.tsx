'use client';

import { useEffect } from 'react';
import AntichocMarkup from './AntichocMarkup';
import { formatSar, formatSarHtml } from '../../../lib/money';
import { saveLastOrder, thankYouHref } from '../../../lib/last-order';
import { isValidOrderPhone, normalizePhone, submitOrderToApi } from '../../../lib/submit-order';
import { flushTrackingQueue, trackingFields, trackStoreEvent } from '../../../lib/tracking';

type Bundle = { id: number; name: string; price: number };

export default function ProductShell() {
  useEffect(() => {
    let currentBundle: Bundle = {
      id: 1,
      name: 'طقم الحماية الأساسي (2 قطع) 🛡️',
      price: 179,
    };
    let currentReviewPage = 1;
    const totalReviewPages = 3;
    let offerIdx = 1;
    let offerTimer: ReturnType<typeof setInterval> | undefined;
    let countdownTimer: ReturnType<typeof setInterval> | undefined;

    const $ = (sel: string, root: ParentNode = document) => root.querySelector(sel) as HTMLElement | null;
    const $$ = (sel: string, root: ParentNode = document) =>
      Array.from(root.querySelectorAll(sel)) as HTMLElement[];

    function changeImage(thumbEl: HTMLElement) {
      const mainImg = document.getElementById('hero-main-img') as HTMLImageElement | null;
      const img = thumbEl as HTMLImageElement;
      if (mainImg && img?.src) mainImg.src = img.src;
      $$('.thumb-gallery .thumb-img').forEach((t) => t.classList.remove('active'));
      thumbEl.classList.add('active');
    }

    function openSheet() {
      trackStoreEvent('addtocart');
      const bg = document.getElementById('sheetBg');
      if (bg) {
        // ثابت على الـ viewport — مايتقصّاش داخل #antichoc-root
        if (bg.parentElement !== document.body) {
          document.body.appendChild(bg);
        }
        bg.classList.add('open');
        bg.style.setProperty('opacity', '1', 'important');
        bg.style.setProperty('pointer-events', 'all', 'important');
      }
      document.body.style.overflow = 'hidden';
      document.getElementById('antichoc-root')?.classList.add('checkout-open');
      selectModalPack(currentBundle.id);
    }

    function forceCloseSheet() {
      const bg = document.getElementById('sheetBg');
      bg?.classList.remove('open');
      bg?.style.removeProperty('opacity');
      bg?.style.removeProperty('pointer-events');
      document.body.style.overflow = '';
      document.getElementById('antichoc-root')?.classList.remove('checkout-open');
      document.getElementById('sheet-offers-drawer')?.classList.remove('open');
      document.getElementById('sheet-offer-trigger')?.classList.remove('active');
    }

    function closeSheet(e?: Event) {
      const t = e?.target as HTMLElement | undefined;
      if (t && t.id !== 'sheetBg' && !t.classList.contains('close-btn') && !t.closest?.('.close-btn')) {
        if (e && t.id !== 'sheetBg' && !t.classList.contains('close-btn')) return;
      }
      forceCloseSheet();
    }

    function toggleSheetOfferDrawer() {
      document.getElementById('sheet-offers-drawer')?.classList.toggle('open');
      document.getElementById('sheet-offer-trigger')?.classList.toggle('active');
    }

    function selectModalPack(packId: number | string, fromUserClick?: boolean) {
      const id = parseInt(String(packId), 10) || 1;
      let price = 179;
      let oldPrice = 399;
      let saveAmount = 220;
      let name = 'طقم قطعتين (سخان واحد)';
      let subtext = 'عازل مزدوج للماء البارد والساخن • توصيل مجاني';
      let tag = 'العرض الأساسي';

      if (id === 2) {
        price = 249;
        oldPrice = 599;
        saveAmount = 350;
        name = 'عبوة أربع قطع (حمّامان)';
        subtext = `حماية لسخانين • وفّرت ${formatSar(350)} اليوم`;
        tag = 'الأكثر طلبًا';
      } else if (id === 3) {
        price = 299;
        oldPrice = 899;
        saveAmount = 600;
        name = 'عبوة ست قطع (ثلاثة حمّامات)';
        subtext = `حماية شاملة للمنزل • وفّرت ${formatSar(600)}`;
        tag = 'أعلى توفير وأفضل قيمة';
      }

      currentBundle = { id, price, name };

      $$('.hero-offer-card, .offer-card, .sod-card').forEach((card) => {
        const pack = parseInt(card.getAttribute('data-pack') || '0', 10);
        const isSelected = pack === id;
        card.classList.toggle('selected', isSelected);
        card.classList.remove('offer-pop');
        card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        card.setAttribute('role', 'radio');

        // نقطة الراديو واضحة 100%
        const radio = card.querySelector('.hero-offer-radio, .offer-radio, .sod-radio') as HTMLElement | null;
        if (radio) {
          radio.innerHTML = isSelected ? '<span class="offer-radio-dot"></span>' : '';
        }
      });

      if (fromUserClick) {
        const selectedCard = document.querySelector(
          `.hero-offer-card.selected, .offer-card.selected, .sod-card.selected`
        ) as HTMLElement | null;
        if (selectedCard) {
          void selectedCard.offsetWidth;
          selectedCard.classList.add('offer-pop');
        }
      }

      // تحديث بادج النافبار إن وُجد
      const navBadge = document.querySelector('.nav-offer-item, #nav-offer-badge-bg .offer-item-1, .nav-offer-live');
      const navPriceEls = document.querySelectorAll('.nav-offer-item .new-p, #nav-live-price');
      navPriceEls.forEach((el) => {
        (el as HTMLElement).textContent = `${price} ريال`;
      });
      if (navBadge && fromUserClick) {
        (navBadge as HTMLElement).classList.add('offer-pop');
      }

      $$('.price-new-large').forEach((el) => {
        el.innerHTML = formatSarHtml(price);
      });
      $$('.price-old-sub').forEach((el) => {
        el.innerHTML = formatSarHtml(oldPrice);
      });
      $$('.price-save-mini').forEach((el) => {
        el.innerHTML = `توفير ${formatSarHtml(saveAmount)}`;
      });
      $$('.price-save-badge').forEach((el) => {
        el.innerHTML = `وفّرت ${formatSarHtml(saveAmount)} اليوم مع توصيل مجاني`;
      });
      $$('.offer-cta-main').forEach((btn) => {
        btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> اشترِ الآن — ${formatSarHtml(price)}`;
      });

      const setText = (idSel: string, text: string) => {
        const el = document.getElementById(idSel);
        if (el) el.textContent = text;
      };
      const setHtml = (idSel: string, html: string) => {
        const el = document.getElementById(idSel);
        if (el) el.innerHTML = html;
      };
      setText('sheet-bundle-name', name);
      setText('sheet-bundle-sub', subtext);
      setText('sheet-active-badge', tag);
      setHtml('sheet-preview-price', formatSarHtml(price));
      setHtml('sheet-preview-old-price', formatSarHtml(oldPrice));
      setHtml('sheet-total-price', formatSarHtml(price));

      const stickyNew = $('.buy-bar .bar-new');
      if (stickyNew) stickyNew.innerHTML = formatSarHtml(price);
      const stickyOld = $('.buy-bar .bar-old');
      if (stickyOld) stickyOld.innerHTML = formatSarHtml(oldPrice);

      const aovCongrats = document.getElementById('sheet-aov-congrats') as HTMLElement | null;
      const aovMsg = document.getElementById('sheet-aov-msg');
      if (aovCongrats && aovMsg) {
        if (id === 2) {
          aovCongrats.style.display = 'flex';
          aovMsg.textContent = `اختيار ذكي. وفّرت ${formatSar(350)} وحصلت على حماية كاملة لحمّامين.`;
        } else if (id === 3) {
          aovCongrats.style.display = 'flex';
          aovMsg.textContent = `أقوى توفير. وفّرت ${formatSar(600)} وحصلت على حماية قصوى لحمّامات المنزل.`;
        } else {
          aovCongrats.style.display = 'none';
        }
      }

      if (fromUserClick) {
        setTimeout(() => {
          document.getElementById('sheet-offers-drawer')?.classList.remove('open');
          document.getElementById('sheet-offer-trigger')?.classList.remove('active');
        }, 280);
      }
    }

    async function handleOrderSubmit(event: Event) {
      event.preventDefault();
      const form =
        (event.target as HTMLElement)?.closest?.('form') as HTMLFormElement | null ||
        (document.getElementById('express-order-form') as HTMLFormElement | null);
      const submitBtn = (form?.querySelector('button[type="submit"]') ||
        document.querySelector('#express-order-form button[type="submit"]')) as HTMLButtonElement | null;
      const name = (document.getElementById('inp-name') as HTMLInputElement)?.value.trim() || '';
      const phone = (document.getElementById('inp-phone') as HTMLInputElement)?.value.trim() || '';
      const city = (document.getElementById('inp-city') as HTMLInputElement)?.value.trim() || '';
      const addressInp = document.getElementById('inp-address') as HTMLInputElement | null;
      const address = addressInp?.value.trim() || city;

      if (!name || !phone || !city) {
        alert('عافاك كمل جميع المعلومات (الاسم، الهاتف والمدينة).');
        return;
      }

      const phoneInput = document.getElementById('inp-phone') as HTMLInputElement | null;
      const phoneError = document.getElementById('phone-error') as HTMLElement | null;
      const cleanPhone = normalizePhone(phone);
      if (!isValidOrderPhone(cleanPhone)) {
        if (phoneInput) phoneInput.style.border = '2px solid #ef4444';
        if (phoneError) phoneError.style.display = 'block';
        alert('⚠️ تأكد من رقم الهاتف (10 أرقام)');
        return;
      }
      if (phoneError) phoneError.style.display = 'none';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'جاري تسجيل الطلب... ⏳';
      }
      const productId = window.location.pathname.match(/^\/product\/([^/?#]+)/)?.[1] || 'produit-1';
      trackStoreEvent('checkout', {
        productId,
        value: currentBundle.price,
        contentName: currentBundle.name,
      });

      const fullLocation = address && address !== city ? `${city} - ${address}` : city;
      const orderId = `ac-${Date.now().toString(36)}`;
      const pieces = currentBundle.id === 1 ? 2 : currentBundle.id === 2 ? 4 : 6;
      const orderData = {
        orderId,
        name,
        phone: cleanPhone,
        city,
        address: fullLocation,
        offer: currentBundle.name,
        offerName: currentBundle.name,
        pieces,
        price: currentBundle.price,
        packId: currentBundle.id,
        timestamp: new Date().toISOString(),
        ...trackingFields(),
        productId,
      };

      try {
        const saved = await submitOrderToApi(orderData);
        const finalOrder = { ...orderData, orderId, serverOrderId: saved.orderId };
        trackStoreEvent('purchase', {
          productId,
          value: currentBundle.price,
          contentName: currentBundle.name,
          orderId,
          numItems: pieces,
        });
        flushTrackingQueue();
        saveLastOrder(finalOrder);
        window.location.assign(thankYouHref(orderId));
      } catch {
        alert('⚠️ ما تسجّلش الطلب — عاود المحاولة');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'أكد الطلب الآن 🔒';
        }
      }
    }

    function toggleFaq(btn: HTMLElement) {
      btn.parentElement?.classList.toggle('active');
    }

    function setReviewPage(pageIndex: number) {
      currentReviewPage = pageIndex;
      $$('.review-page').forEach((p) => p.classList.remove('active'));
      $$('.rev-dot').forEach((d) => d.classList.remove('active'));
      document.getElementById(`review-page-${pageIndex}`)?.classList.add('active');
      document.getElementById(`dot-page-${pageIndex}`)?.classList.add('active');
    }

    function nextReviewPage() {
      setReviewPage(currentReviewPage >= totalReviewPages ? 1 : currentReviewPage + 1);
    }

    function prevReviewPage() {
      setReviewPage(currentReviewPage <= 1 ? totalReviewPages : currentReviewPage - 1);
    }

    function scrollToTop() {
      const heroOffers = document.querySelector('.hero-offers-wrapper') || document.querySelector('.hero-offers-grid');
      if (heroOffers) heroOffers.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function runClickCode(code: string, el: HTMLElement, event: Event) {
      const trimmed = code.trim();
      if (trimmed.startsWith('selectModalPack(')) {
        const m = trimmed.match(/selectModalPack\((\d+)/);
        if (m) selectModalPack(Number(m[1]), true);
        return;
      }
      if (trimmed.startsWith('selectPageOffer')) {
        const m = trimmed.match(/selectPageOffer\((\d+)\)/);
        if (m) selectModalPack(Number(m[1]), true);
        return;
      }
      if (trimmed.startsWith('changeImage(')) {
        changeImage(el);
        return;
      }
      if (trimmed.startsWith('openSheet') || trimmed.startsWith('openOrderModal')) {
        openSheet();
        return;
      }
      if (trimmed.startsWith('closeSheet')) {
        closeSheet(event);
        return;
      }
      if (el.classList.contains('close-btn')) {
        forceCloseSheet();
        return;
      }
      if (trimmed.startsWith('toggleSheetOfferDrawer')) {
        toggleSheetOfferDrawer();
        return;
      }
      if (trimmed.startsWith('toggleFaq')) {
        toggleFaq(el);
        return;
      }
      if (trimmed.startsWith('nextReviewPage')) {
        nextReviewPage();
        return;
      }
      if (trimmed.startsWith('prevReviewPage')) {
        prevReviewPage();
        return;
      }
      if (trimmed.startsWith('setReviewPage')) {
        const m = trimmed.match(/setReviewPage\((\d+)\)/);
        if (m) setReviewPage(Number(m[1]));
        return;
      }
      if (trimmed.startsWith('scrollToTop') || trimmed.startsWith('scrollToOffers')) {
        scrollToTop();
        return;
      }
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // Never hijack checkout form / submit (sheetBg has data-ac-click that was blocking submit)
      if (
        target.closest('#express-order-form') ||
        target.closest('form[data-ac-submit]') ||
        target.closest('button[type="submit"]')
      ) {
        return;
      }

      if (target.closest('.close-btn')) {
        forceCloseSheet();
        return;
      }
      // Backdrop only — not clicks bubbling from the sheet panel
      if (target.id === 'sheetBg') {
        forceCloseSheet();
        return;
      }

      const el = target.closest('[data-ac-click]') as HTMLElement | null;
      if (!el) return;
      if (el.id === 'sheetBg' && target.closest('.sheet')) return;

      const code = el.getAttribute('data-ac-click');
      if (!code) return;
      e.preventDefault();
      runClickCode(code, el, e);
    }

    function onSubmit(e: Event) {
      const form = e.target as HTMLElement;
      if (form.id === 'express-order-form' || form.getAttribute('data-ac-submit')) {
        handleOrderSubmit(e);
      }
    }

    function onScroll() {
      const floatBtn = document.getElementById('floating-top-btn');
      if (!floatBtn) return;
      const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const threshold = Math.max(700, docHeight * 0.45);
      floatBtn.classList.toggle('visible', window.scrollY > threshold);
    }

    offerTimer = setInterval(() => {
      const item1 = document.querySelector('.offer-item-1') as HTMLElement | null;
      const item2 = document.querySelector('.offer-item-2') as HTMLElement | null;
      const item3 = document.querySelector('.offer-item-3') as HTMLElement | null;
      const bg = document.getElementById('nav-offer-badge-bg') as HTMLElement | null;
      if (!item1 || !item2 || !item3 || !bg) return;
      offerIdx = (offerIdx % 3) + 1;
      [item1, item2, item3].forEach((it) => {
        it.style.transform = 'translateY(-100%)';
        it.style.opacity = '0';
      });
      if (offerIdx === 1) {
        item1.style.transform = 'translateY(0)';
        item1.style.opacity = '1';
        bg.style.background = 'linear-gradient(135deg, #FFD700 0%, #D97706 100%)';
      } else if (offerIdx === 2) {
        item2.style.transform = 'translateY(0)';
        item2.style.opacity = '1';
        bg.style.background = 'linear-gradient(135deg, #FFD700 0%, #D97706 100%)';
      } else {
        item3.style.transform = 'translateY(0)';
        item3.style.opacity = '1';
        bg.style.background = 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)';
      }
    }, 2500);

    let totalSeconds = 14 * 60 + 59;
    countdownTimer = setInterval(() => {
      const timerEl = document.getElementById('header-timer');
      if (!timerEl) return;
      if (totalSeconds <= 0) totalSeconds = 14 * 60 + 59;
      totalSeconds--;
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      timerEl.textContent = `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
    }, 1000);

    // شبكة أمان: أي صندوق داكن / نص باهت → أبيض مقروء
    function enforceWhiteReadability(root: ParentNode = document) {
      const skip = '.sheet, .sheet-bg, .buy-bar, .top-marquee-banner, .offer-cta-main, .buy-btn, .btn-primary-cta, .hero-offer-badge, .eb-header-badge, .comp-featured-badge, .hero-badge-top-right, .pvd-step-num';
      root.querySelectorAll('#antichoc-root [style*="background"], #antichoc-root [style*="color"]').forEach((node) => {
        const el = node as HTMLElement;
        if (el.closest(skip)) return;
        const style = el.getAttribute('style') || '';
        if (/#0[Bb]0[Ff]17|#111827|#0[Ff]172[Aa]|#1[Ee]293[Bb]|#131[Aa]26|rgba?\(\s*(11|15|17|19|30)\s*,/i.test(style)) {
          el.style.setProperty('background', '#FFFFFF', 'important');
          el.style.setProperty('background-color', '#FFFFFF', 'important');
          el.style.setProperty('border-color', '#E2E8F0', 'important');
        }
        if (/color\s*:\s*(#fff|#ffffff|#f8fafc|#e2e8f0|#ffd700|#f59e0b)/i.test(style)) {
          el.style.setProperty('color', '#0F172A', 'important');
        }
      });
    }

    enforceWhiteReadability();
    // راقب أي HTML جديد يتحط فالصفحة
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes.length) enforceWhiteReadability();
      }
    });
    const acRoot = document.getElementById('antichoc-root');
    if (acRoot) mo.observe(acRoot, { childList: true, subtree: true });

    selectModalPack(2);
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit, true);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      mo.disconnect();
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit, true);
      window.removeEventListener('scroll', onScroll);
      if (offerTimer) clearInterval(offerTimer);
      if (countdownTimer) clearInterval(countdownTimer);
      document.body.style.overflow = '';
    };
  }, []);

  return <AntichocMarkup />;
}
