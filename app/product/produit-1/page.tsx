import { redirect } from 'next/navigation';

/** الرابط القديم → اسم المنتج */
export default function Produit1Redirect() {
  redirect('/product/kalb-robot-ai');
}
