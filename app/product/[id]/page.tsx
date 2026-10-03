'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProductPage } from '../../../lib/productPages';
import ProductView from './ProductView';
import '../../antichoc-base.css';
import '../../antichoc-white.css';
import '../antichoc/antichoc-page.css';
import './product-view.css';

export default function ProductPage() {
  const params = useParams();
  const id = String(params.id || '');
  const product = useMemo(() => getProductPage(id), [id]);

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', direction: 'rtl', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: 12 }}>المنتج غير موجود</h1>
          <Link href="/" style={{ color: '#B45309', fontWeight: 900 }}>
            ← الرجوع للمتجر
          </Link>
        </div>
      </div>
    );
  }

  return <ProductView key={product.id} product={product} />;
}
