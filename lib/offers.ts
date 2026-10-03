export type Offer = {
  id: number;
  name: string;
  pieces: number;
  price: number;
  oldPrice: number;
  desc: string;
  popular: boolean;
};

export const OFFERS: Offer[] = [
  {
    id: 1,
    name: 'طقم قطعتين (سخان واحد)',
    pieces: 2,
    price: 179,
    oldPrice: 399,
    desc: 'حماية حمّام واحد — عازل للماء البارد والساخن',
    popular: false,
  },
  {
    id: 2,
    name: 'عبوة أربع قطع (حمّامان)',
    pieces: 4,
    price: 249,
    oldPrice: 599,
    desc: 'حمّامان أو منزلان — الأكثر طلبًا',
    popular: true,
  },
  {
    id: 3,
    name: 'عبوة ست قطع (ثلاثة حمّامات)',
    pieces: 6,
    price: 299,
    oldPrice: 899,
    desc: 'حماية كاملة للأسرة',
    popular: false,
  },
];

export const PRODUCT = {
  brand: 'AntiChoc Protect',
  title: 'عازل تسرّب الكهرباء الأصلي للسخان المائي',
  subtitle: 'احمِ عائلتك وأطفالك من خطر الصعق الكهربائي',
  heroBadge: 'وصل حديثاً',
};
