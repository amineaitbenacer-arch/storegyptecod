import type { Metadata } from 'next';
import Link from 'next/link';
import { getProductPage } from '../../../lib/productPages';
import { productJsonLd, productMetadata, safeJsonLd } from '../../../lib/product-seo';
import ProductView from './ProductView';
import '../../antichoc-base.css';
import '../../antichoc-white.css';
import '../antichoc/antichoc-page.css';
import './product-view.css';

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductPage(id);
  if (!product) return { title: 'Product not found | Dune Market', robots: { index: false, follow: false } };
  return productMetadata(product, `/product/${id}`);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProductPage(id);

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

  const schema = productJsonLd(product, `/product/${id}`);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <ProductView key={product.id} product={product} />
    </>
  );
}
