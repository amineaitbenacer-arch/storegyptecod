'use client';

import { useEffect } from 'react';
import AntichocMarkup from './AntichocMarkup';
import { formatSar } from '../../lib/money';
import { saveLastOrder, thankYouHref } from '../../lib/last-order';
import { isValidOrderPhone, normalizePhone, submitOrderToApi } from '../../lib/submit-order';
import { flushTrackingQueue, trackingFields, trackStoreEvent } from '../../lib/tracking';

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
      const sheet = document.getElementById('sheetBg');
      sheet?.classList.add('open');
      document.body.style.overflow = 'hidden';
      selectModalPack(currentBundle.id);
    }

    function closeSheet(e?: Event) {
      const t = e?.target as HTMLElement | undefined;
      if (t && t.id !== 'sheetBg' && !t.classList.contains('close-btn') && !t.closest?.('.close-btn')) {
        // allow explicit close calls without event
        if (e && t.id !== 'sheetBg' && !t.classList.contains('close-btn')) return;
      }
      document.getElementById('sheetBg')?.classList.remove('open');
      document.body.style.overflow = '';
      document.getElementById('sheet-offers-drawer')?.classList.remove('open');
      document.getElementById('sheet-offer-trigger')?.classList.remove('active');
    }

    function forceCloseSheet() {
      document.getElementById('sheetBg')?.classList.remove('open');
      document.body.style.overflow = '';
      document.getElementById('sheet-offers-drawer')?.classList.remove('open');
      document.getElementById('sheet-offer-trigger')?.classList.remove('active');
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
        card.classList.toggle('selected', pack === id);
      });

      $$('.price-new-large').forEach((el) => {
        el.innerHTML = formatSar(price);
      });
      $$('.price-old-sub').forEach((el) => {
        el.textContent = formatSar(oldPrice);
      });
      $$('.price-save-mini').forEach((el) => {
        el.textContent = `توفير ${formatSar(saveAmount)}`;
      });
      $$('.price-save-badge').forEach((el) => {
        el.textContent = `وفّرت ${formatSar(saveAmount)} اليوم مع توصيل مجاني`;
      });
      $$('.offer-cta-main').forEach((btn) => {
        btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> اشترِ الآن — ${formatSar(price)}`;
      });

      const setText = (idSel: string, text: string) => {
        const el = document.getElementById(idSel);
        if (el) el.textContent = text;
      };
      setText('sheet-bundle-name', name);
      setText('sheet-bundle-sub', subtext);
      setText('sheet-active-badge', tag);
      setText('sheet-preview-price', formatSar(price));
      setText('sheet-preview-old-price', formatSar(oldPrice));
      setText('sheet-total-price', formatSar(price));

      const stickyNew = $('.buy-bar .bar-new');
      if (stickyNew) stickyNew.innerHTML = formatSar(price);
      const stickyOld = $('.buy-bar .bar-old');
      if (stickyOld) stickyOld.textContent = formatSar(oldPrice);

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
      const form = event.target as HTMLFormElement;
      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
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
      const orderId = `ps-${Date.now().toString(36)}`;
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
        const finalOrder = {
          ...orderData,
          orderId: String(saved.orderId || orderId),
          serverOrderId: saved.orderId,
        };
        trackStoreEvent('purchase', {
          productId,
          value: currentBundle.price,
          contentName: currentBundle.name,
          orderId: finalOrder.orderId,
          numItems: pieces,
        });
        flushTrackingQueue();
        saveLastOrder(finalOrder);
        window.location.href = thankYouHref(String(finalOrder.orderId));
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
        const m = trimmed.match(/selectModalPack\((\d+)\s*(?:,\s*true)?\)/);
        if (m) selectModalPack(Number(m[1]), trimmed.includes('true'));
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
      if (trimmed.includes('close-btn') || el.classList.contains('close-btn')) {
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
      if (trimmed.startsWith('selectPageOffer')) {
        const m = trimmed.match(/selectPageOffer\((\d+)\)/);
        if (m) selectModalPack(Number(m[1]));
        return;
      }
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('.close-btn')) {
        forceCloseSheet();
        return;
      }
      if (target.id === 'sheetBg') {
        forceCloseSheet();
        return;
      }
      const el = target.closest('[data-ac-click]') as HTMLElement | null;
      if (!el) return;
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

    // Nav rotating offers
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

    // Header countdown if present
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

    selectModalPack(1);
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit, true);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
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
