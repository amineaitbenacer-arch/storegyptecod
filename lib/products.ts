/** إعادة تصدير — المصدر الحقيقي: lib/productPages.ts */
export {
  PRODUCTS,
  FILTERS,
  getProduct,
  getProductPage,
  PRODUCT_PAGES,
  type ProductPageConfig,
} from './productPages';

export type StoreProduct = {
  id: string;
  name: string;
  type: string;
  emoji: string;
  price: number;
  oldPrice: number;
  image: string;
  badge: string;
  badgeColor: string;
  shortDesc: string;
  category: string[];
  tags: string[];
  href: string;
  featured?: boolean;
};
