import { redirect } from 'next/navigation';

/** القديم القديمة → المنتوج 1 */
export default function AntichocRedirect() {
  redirect('/product/kalb-robot-ai');
}
