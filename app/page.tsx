import StoreHome from './store/StoreHome';
import { PRODUCTS } from '../lib/products';

export default function Home() {
  return <StoreHome products={PRODUCTS} />;
}
