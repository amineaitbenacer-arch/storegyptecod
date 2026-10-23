import ProductShell from './ProductShell';
import type { Metadata } from 'next';
import { getProductPage } from '../../../lib/productPages';
import { productJsonLd, productMetadata, safeJsonLd } from '../../../lib/product-seo';
import '../../antichoc-base.css';
import '../../antichoc-white.css';
import './antichoc-page.css';

/** صفحة AntiChoc الأصلية كاملة */
export function generateMetadata(): Metadata {
  const product = getProductPage('antichoc');
  return product ? productMetadata(product, '/product/antichoc') : { title: 'Dune Market' };
}

export default function AntichocPage() {
  const product = getProductPage('antichoc');
  if (!product) return <ProductShell />;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd(product, '/product/antichoc')) }}
      />
      <ProductShell />
    </>
  );
}
