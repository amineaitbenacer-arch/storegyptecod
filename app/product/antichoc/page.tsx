import { redirect } from 'next/navigation';

/** الصفحة القديمة → AntiChoc */
export default function AntichocRedirect() {
  redirect('/product/produit-1');
}
