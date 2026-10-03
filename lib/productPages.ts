/**
 * نصوص المنتجات. الأسعار أرقام في المصدر، وتُعرض بالريال السعودي مكتوبة بالعربية.
 */

export type OfferPack = {
  id: number;
  name: string;
  sub: string;
  price: number;
  oldPrice: number;
  popular?: boolean;
  badge?: string;
};

export type ProductPageConfig = {
  id: string;
  brand: string;
  emoji: string;
  type: string;
  badge: string;
  badgeColor: string;
  marquee: string;
  warning: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  images: string[];
  catalogImage: string;
  shortDesc: string;
  offers: OfferPack[];
  trustCards: { icon: string; title: string; text: string }[];
  painTitle: string;
  painText: string;
  painItems: { icon: string; title: string; text: string }[];
  solutionTitle: string;
  solutionText: string;
  solutionImage: string;
  stepsTitle: string;
  steps: string[];
  reviews: { name: string; avatar: string; text: string }[];
  faqs: { q: string; a: string }[];
  guaranteeTitle: string;
  guaranteeText: string;
  ctaLabel: string;
};

const sharedOffers = (a: number, b: number, c: number): OfferPack[] => [
  { id: 1, name: 'طقم قطعتين', sub: 'العرض الأساسي', price: a, oldPrice: a + 120 },
  { id: 2, name: 'عبوة أربع قطع', sub: 'الأكثر طلبًا', price: b, oldPrice: b + 200, popular: true, badge: 'الأكثر طلبًا' },
  { id: 3, name: 'عبوة ست قطع', sub: 'أفضل قيمة', price: c, oldPrice: c + 300, badge: 'توفير كبير' },
];

export const PRODUCT_PAGES: ProductPageConfig[] = [
  {
    id: 'produit-1',
    brand: 'AntiChoc Protect',
    emoji: '⚡',
    type: 'أمان منزلي',
    badge: 'الأكثر مبيعاً',
    badgeColor: '#D97706',
    marquee: 'توصيل آمن إلى جميع مدن المملكة | الدفع عند الاستلام',
    warning: 'الكهرباء في أثناء الاستحمام لا تمنح فرصة ثانية. احمِ أطفالك وعائلتك اليوم.',
    heroTitle: 'عازل السخان المائي الأصلي المزدوج من AntiChoc',
    heroSubtitle: 'الأمان ليس رفاهية، وحماية عائلتك هي الأهم.',
    heroBadge: 'وصل حديثاً',
    images: [
      '/images/hero_father_daughter.jpg',
      '/images/hero_anti_choc_product_1789640183592.png',
      '/images/product_pair.png',
      '/images/product_installed.png',
    ],
    catalogImage: '/images/hero_anti_choc_product_1789640183592.png',
    shortDesc: 'عازل تسرب الكهرباء الأصلي للسخان المائي',
    offers: [
      { id: 1, name: 'طقم قطعتين (سخان واحد)', sub: 'عازل مزدوج للماء البارد والساخن', price: 179, oldPrice: 399 },
      { id: 2, name: 'عبوة أربع قطع (حمّامان)', sub: 'حماية كاملة', price: 249, oldPrice: 599, popular: true, badge: 'الأكثر طلبًا' },
      { id: 3, name: 'عبوة ست قطع (ثلاثة حمّامات)', sub: 'حماية قصوى للمنزل كله', price: 299, oldPrice: 899, badge: 'عرض قوي' },
    ],
    trustCards: [
      { icon: '🚚', title: 'توصيل مجاني', text: 'إلى جميع المدن حتى باب المنزل' },
      { icon: '🤝', title: 'المعاينة قبل الدفع', text: 'افحص السلعة ثم ادفع' },
    ],
    painTitle: 'هل تعيش هذا القلق في كل مرة يستحم فيها أطفالك؟',
    painText: 'مع الوقت، تتآكل مقاومة السخان وقد يحوّل الماء إلى خطر كهربائي متسرب!',
    painItems: [
      { icon: '⚡', title: 'وخزة كهربائية عند لمس الصنبور', text: 'إنذار لوجود تسرّب كهربائي مباشر.' },
      { icon: '👶', title: 'الأطفال هم الأكثر حساسية', text: 'الحماية الحقيقية تبدأ بعازل أصلي.' },
      { icon: '🔌', title: 'لا حاجة لفصل القابس قبل كل استحمام', text: 'استحمام آمن دون قطع الكهرباء.' },
    ],
    solutionTitle: 'الحل: AntiChoc Protect الأصلي',
    solutionText: 'جهاز صغير يُركب على توصيلة السخان ويعزل التسرب.',
    solutionImage: '/images/hero_anti_choc_product_1789640183592.png',
    stepsTitle: 'التركيب سهل في ثلاث خطوات',
    steps: ['افصل الماء والكهرباء', 'ركّب العازل على التوصيلة', 'أعد الماء وجرّب بأمان'],
    reviews: [
      { name: 'سعيد — الرياض', avatar: '👨‍👧', text: 'ركّبت العازل واطمأن قلبي تمامًا.' },
      { name: 'نادية — جدة', avatar: '👩‍👦', text: 'التوصيل سريع والمنتج أصلي.' },
      { name: 'يوسف — الدمام', avatar: '👨‍🔧', text: 'أصبح الحمّام آمنًا تمامًا.' },
    ],
    faqs: [
      { q: 'هل أستطيع تركيبه بنفسي؟', a: 'نعم، التركيب سهل ويرافقه شرح مبسّط.' },
      { q: 'متى يصلني الطلب؟', a: 'غالبًا خلال أربع وعشرين إلى ثمانٍ وأربعين ساعة بعد التأكيد.' },
      { q: 'هل أدفع الآن؟', a: 'لا. الدفع عند الاستلام فقط.' },
      { q: 'هل التوصيل مجاني؟', a: 'نعم، التوصيل مجاني إلى جميع المدن.' },
    ],
    guaranteeTitle: 'لا تدفع شيئًا حتى ترى السلعة',
    guaranteeText: 'افحص المنتج وتأكد منه، ثم ادفع.',
    ctaLabel: 'اشترِ الآن',
  },
  {
    id: 'produit-2',
    brand: 'المنتج الثاني',
    emoji: '✨',
    type: 'منتج 2',
    badge: 'جديد',
    badgeColor: '#0E7C7B',
    marquee: 'توصيل لجميع المدن | الدفع عند الاستلام',
    warning: 'استبدل هذه الجملة بحسب منتجك.',
    heroTitle: 'اسم المنتج الثاني هنا',
    heroSubtitle: 'جملة قصيرة تشجّع العميل على الطلب.',
    heroBadge: 'جديد',
    images: ['/images/new_box.jpg', '/images/product_main.png', '/images/materials.png', '/images/easy_installation.jpg'],
    catalogImage: '/images/new_box.jpg',
    shortDesc: 'وصف قصير — استبدل هذا السطر',
    offers: sharedOffers(149, 229, 279),
    trustCards: [
      { icon: '🚚', title: 'توصيل مجاني', text: 'حتى باب المنزل' },
      { icon: '💳', title: 'الدفع عند الاستلام', text: 'دون مخاطرة' },
    ],
    painTitle: 'عنوان المشكلة',
    painText: 'اشرح المشكلة في جملتين.',
    painItems: [
      { icon: '1', title: 'نقطة الألم الأولى', text: 'استبدل النص.' },
      { icon: '2', title: 'نقطة الألم الثانية', text: 'استبدل النص.' },
      { icon: '3', title: 'نقطة الألم الثالثة', text: 'استبدل النص.' },
    ],
    solutionTitle: 'حلّنا',
    solutionText: 'اشرح كيف يحل المنتج المشكلة.',
    solutionImage: '/images/product_main.png',
    stepsTitle: 'كيف يُستخدم؟',
    steps: ['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة'],
    reviews: [
      { name: 'عميل — الرياض', avatar: '👤', text: 'استبدل هذا الرأي.' },
      { name: 'عميلة — جدة', avatar: '👤', text: 'استبدل هذا الرأي.' },
      { name: 'عميل — الدمام', avatar: '👤', text: 'استبدل هذا الرأي.' },
    ],
    faqs: [
      { q: 'سؤال 1؟', a: 'جواب 1.' },
      { q: 'سؤال 2؟', a: 'جواب 2.' },
      { q: 'كيف أدفع؟', a: 'الدفع عند الاستلام فقط.' },
      { q: 'هل التوصيل مجاني؟', a: 'نعم، إلى جميع المدن.' },
    ],
    guaranteeTitle: 'ضمان الرضا 100%',
    guaranteeText: 'افحص السلعة قبل الدفع.',
    ctaLabel: 'اطلب الآن',
  },
  {
    id: 'produit-3',
    brand: 'المنتج الثالث',
    emoji: '🛡️',
    type: 'منتج 3',
    badge: 'عرض',
    badgeColor: '#7C3AED',
    marquee: 'توصيل لجميع المدن | الدفع عند الاستلام',
    warning: 'استبدل هذه الجملة بحسب منتجك.',
    heroTitle: 'اسم المنتج الثالث هنا',
    heroSubtitle: 'جملة قصيرة تشجّع العميل على الطلب.',
    heroBadge: 'عرض خاص',
    images: ['/images/product_pair.png', '/images/offer_bundle_pack_1789640245480.png', '/images/guarantee.jpg', '/images/tech_specs.jpg'],
    catalogImage: '/images/product_pair.png',
    shortDesc: 'وصف قصير — استبدل هذا السطر',
    offers: sharedOffers(159, 239, 289),
    trustCards: [
      { icon: '🚚', title: 'توصيل مجاني', text: 'حتى باب المنزل' },
      { icon: '💳', title: 'الدفع عند الاستلام', text: 'دون مخاطرة' },
    ],
    painTitle: 'عنوان المشكلة',
    painText: 'اشرح المشكلة في جملتين.',
    painItems: [
      { icon: '1', title: 'نقطة الألم الأولى', text: 'استبدل النص.' },
      { icon: '2', title: 'نقطة الألم الثانية', text: 'استبدل النص.' },
      { icon: '3', title: 'نقطة الألم الثالثة', text: 'استبدل النص.' },
    ],
    solutionTitle: 'حلّنا',
    solutionText: 'اشرح كيف يحل المنتج المشكلة.',
    solutionImage: '/images/product_pair.png',
    stepsTitle: 'كيف يُستخدم؟',
    steps: ['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة'],
    reviews: [
      { name: 'عميل — مكة المكرمة', avatar: '👤', text: 'استبدل هذا الرأي.' },
      { name: 'عميلة — المدينة المنورة', avatar: '👤', text: 'استبدل هذا الرأي.' },
      { name: 'عميل — أبها', avatar: '👤', text: 'استبدل هذا الرأي.' },
    ],
    faqs: [
      { q: 'سؤال 1؟', a: 'جواب 1.' },
      { q: 'سؤال 2؟', a: 'جواب 2.' },
      { q: 'كيف أدفع؟', a: 'الدفع عند الاستلام فقط.' },
      { q: 'هل التوصيل مجاني؟', a: 'نعم، إلى جميع المدن.' },
    ],
    guaranteeTitle: 'ضمان الرضا 100%',
    guaranteeText: 'افحص السلعة قبل الدفع.',
    ctaLabel: 'اطلب الآن',
  },
  {
    id: 'produit-4',
    brand: 'المنتج الرابع',
    emoji: '🔥',
    type: 'منتج 4',
    badge: 'ترند',
    badgeColor: '#C9632A',
    marquee: 'توصيل لجميع المدن | الدفع عند الاستلام',
    warning: 'استبدل هذه الجملة بحسب منتجك.',
    heroTitle: 'اسم المنتج الرابع هنا',
    heroSubtitle: 'جملة قصيرة تشجّع العميل على الطلب.',
    heroBadge: 'ترند',
    images: ['/images/emotional_family_trust.jpg', '/images/before_after_split.jpg', '/images/easy_installation.jpg', '/images/materials.png'],
    catalogImage: '/images/emotional_family_trust.jpg',
    shortDesc: 'وصف قصير — استبدل هذا السطر',
    offers: sharedOffers(169, 249, 299),
    trustCards: [
      { icon: '🚚', title: 'توصيل مجاني', text: 'حتى باب المنزل' },
      { icon: '💳', title: 'الدفع عند الاستلام', text: 'دون مخاطرة' },
    ],
    painTitle: 'عنوان المشكلة',
    painText: 'اشرح المشكلة في جملتين.',
    painItems: [
      { icon: '1', title: 'نقطة الألم الأولى', text: 'استبدل النص.' },
      { icon: '2', title: 'نقطة الألم الثانية', text: 'استبدل النص.' },
      { icon: '3', title: 'نقطة الألم الثالثة', text: 'استبدل النص.' },
    ],
    solutionTitle: 'حلّنا',
    solutionText: 'اشرح كيف يحل المنتج المشكلة.',
    solutionImage: '/images/emotional_family_trust.jpg',
    stepsTitle: 'كيف يُستخدم؟',
    steps: ['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة'],
    reviews: [
      { name: 'عميل — تبوك', avatar: '👤', text: 'استبدل هذا الرأي.' },
      { name: 'عميلة — جازان', avatar: '👤', text: 'استبدل هذا الرأي.' },
      { name: 'عميل — حائل', avatar: '👤', text: 'استبدل هذا الرأي.' },
    ],
    faqs: [
      { q: 'سؤال 1؟', a: 'جواب 1.' },
      { q: 'سؤال 2؟', a: 'جواب 2.' },
      { q: 'كيف أدفع؟', a: 'الدفع عند الاستلام فقط.' },
      { q: 'هل التوصيل مجاني؟', a: 'نعم، إلى جميع المدن.' },
    ],
    guaranteeTitle: 'ضمان الرضا 100%',
    guaranteeText: 'افحص السلعة قبل الدفع.',
    ctaLabel: 'اطلب الآن',
  },
];

export function getProductPage(id: string) {
  return PRODUCT_PAGES.find((p) => p.id === id);
}

export const PRODUCTS = PRODUCT_PAGES.map((p) => ({
  id: p.id,
  name: p.heroTitle,
  type: p.type,
  emoji: p.emoji,
  price: p.offers.find((o) => o.popular)?.price ?? p.offers[0].price,
  oldPrice: p.offers.find((o) => o.popular)?.oldPrice ?? p.offers[0].oldPrice,
  image: p.catalogImage,
  badge: p.badge,
  badgeColor: p.badgeColor,
  shortDesc: p.shortDesc,
  category: ['all'],
  tags: [p.brand, p.type],
  href: `/product/${p.id}`,
  featured: true,
}));

export const FILTERS = [{ id: 'all', label: 'الكل' }];

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}
