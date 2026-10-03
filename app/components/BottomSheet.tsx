'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OFFERS } from '../../lib/offers';
import { CITIES } from '../../lib/cities';
import { formatSar } from '../../lib/money';
import { isValidOrderPhone, normalizePhone, submitOrderToApi } from '../../lib/submit-order';
import { flushTrackingQueue, trackingFields, trackStoreEvent } from '../../lib/tracking';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialOfferId?: number;
}

export default function BottomSheet({ isOpen, onClose, initialOfferId = 2 }: BottomSheetProps) {
  const [selectedOffer, setSelectedOffer] = useState(
    () => OFFERS.find((o) => o.id === initialOfferId) || OFFERS[1]
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const next = OFFERS.find((o) => o.id === initialOfferId) || OFFERS[1];
      setSelectedOffer(next);
      trackStoreEvent('addtocart');
    }
  }, [isOpen, initialOfferId]);

  const handlePhoneChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) setPhone(cleaned);
    setPhoneError(cleaned.length > 0 && cleaned.length < 10 ? '⚠️ تأكد من رقم الهاتف (10 أرقام)' : '');
  }, []);

  const handleSubmit = async () => {
    const clean = normalizePhone(phone);
    if (!name.trim() || !city || !address.trim() || !isValidOrderPhone(clean)) {
      if (!isValidOrderPhone(clean)) setPhoneError('⚠️ تأكد من رقم الهاتف (10 أرقام)');
      return;
    }

    setIsSubmitting(true);
    const productId =
      typeof window !== 'undefined'
        ? window.location.pathname.match(/^\/product\/([^/?#]+)/)?.[1] || 'produit-1'
        : 'produit-1';
    const orderId = `bs-${Date.now().toString(36)}`;
    trackStoreEvent('checkout', {
      productId,
      value: selectedOffer.price,
      contentName: selectedOffer.name,
    });

    const orderData = {
      orderId,
      name: name.trim(),
      phone: clean,
      city,
      address: address.trim(),
      offer: selectedOffer.name,
      offerName: selectedOffer.name,
      pieces: selectedOffer.pieces,
      price: selectedOffer.price,
      packId: selectedOffer.id,
      timestamp: new Date().toISOString(),
      ...trackingFields(),
      productId,
    };

    try {
      await submitOrderToApi(orderData);
      trackStoreEvent('purchase', {
        productId,
        value: selectedOffer.price,
        contentName: selectedOffer.name,
        orderId,
        numItems: selectedOffer.pieces || 1,
      });
      flushTrackingQueue();
      localStorage.setItem('lastOrder', JSON.stringify(orderData));
      localStorage.setItem('ac_last_order', JSON.stringify(orderData));
      window.location.href = '/thankyou';
    } catch {
      setPhoneError('⚠️ ما تسجّلش الطلب — عاود المحاولة');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 51,
              background: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 48, height: 5, borderRadius: 3, background: '#E2E8F0' }} />
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: '#F1F5F9',
                cursor: 'pointer',
                fontSize: 18,
                color: '#64748B',
              }}
            >
              ✕
            </button>

            <div style={{ padding: '16px 20px 32px' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, textAlign: 'center', color: '#0F172A' }}>
                🛒 كمّل طلبك بسرعة
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {OFFERS.map((offer) => (
                  <div
                    key={offer.id}
                    className={`option-card ${selectedOffer.id === offer.id ? 'selected' : ''} ${offer.popular ? 'popular' : ''}`}
                    onClick={() => setSelectedOffer(offer)}
                    role="button"
                    tabIndex={0}
                  >
                    {offer.popular && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -10,
                          right: 16,
                          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                          color: '#fff',
                          padding: '4px 14px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ⭐ الأكثر طلباً
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: `3px solid ${selectedOffer.id === offer.id ? '#F59E0B' : '#CBD5E1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {selectedOffer.id === offer.id && (
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{offer.name}</div>
                          <div style={{ fontSize: 13, color: '#64748B' }}>{offer.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 20, color: offer.popular ? '#D97706' : '#059669' }}>
                        {formatSar(offer.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="form-input" type="text" placeholder="الاسم الكامل *" value={name} onChange={(e) => setName(e.target.value)} />
                <div>
                  <input
                    className={`form-input ${phoneError ? 'error' : ''}`}
                    type="tel"
                    inputMode="numeric"
                    placeholder="رقم الجوال (05XXXXXXXX) *"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                  {phoneError && (
                    <p style={{ color: '#EF4444', fontSize: 13, marginTop: 6, fontWeight: 600 }}>{phoneError}</p>
                  )}
                </div>
                <select className="form-input" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">اختر المدينة *</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  className="form-input"
                  type="text"
                  placeholder="العنوان الكامل *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div
                style={{
                  textAlign: 'center',
                  margin: '20px 0',
                  padding: 16,
                  background: '#F0FDF4',
                  borderRadius: 16,
                  border: '2px dashed #10B981',
                }}
              >
                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 4 }}>المجموع عند الاستلام:</p>
                <p style={{ fontSize: 32, fontWeight: 900, color: '#059669' }}>
                  {formatSar(selectedOffer.price)}
                </p>
                <p style={{ fontSize: 13, color: '#10B981', marginTop: 4 }}>🚚 التوصيل مجاني</p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="pulse-cta"
                style={{
                  width: '100%',
                  padding: 18,
                  background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  fontSize: 20,
                  fontWeight: 800,
                  fontFamily: 'inherit',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  minHeight: 60,
                }}
              >
                {isSubmitting ? '⏳ جاري إرسال الطلب...' : '✅ أكّد الطلب الآن'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 16, fontSize: 12, color: '#64748B' }}>
                <span>🔒 معلوماتك محمية</span>
                <span>🚚 توصيل مجاني</span>
                <span>💳 الدفع عند الاستلام</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
