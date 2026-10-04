/**
 * نصوص المنتجات. الأسعار أرقام في المصدر، وتُعرض بالريال السعودي مكتوبة بالعربية.
 */

export type OfferPack = {
  id: number;
  name: string;
  sub: string;
  price: number;
  oldPrice: number;
  /** عدد القطع في الطلب. إن غاب، يُستخدم رقم العرض. */
  pieces?: number;
  popular?: boolean;
  badge?: string;
};

export type StoryBlock = {
  image: string;
  badge?: string;
  title: string;
  text: string;
  points?: string[];
};

/** نمط التحويل: إطارات تسويق ثم صورة 1:1 ثم جسر تسويقي */
export type StoryBeat = {
  frames: { icon?: string; title: string; text: string }[];
  image: string;
  imageBadge?: string;
  imageTitle?: string;
  imageText?: string;
  /** بلوك تسويق كامل بين الصور — يطيل الصفحة ويزيد القيمة */
  bridge?: {
    badge?: string;
    title: string;
    text: string;
    bullets?: string[];
  };
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
  /** شريط مميزات سريع تحت الهيرو */
  featureStrip?: { icon: string; title: string; text: string }[];
  painTitle: string;
  painText: string;
  painItems: { icon: string; title: string; text: string }[];
  solutionTitle: string;
  solutionText: string;
  solutionImage: string;
  stepsTitle: string;
  steps: string[];
  /** 5 صور تسويقية بعد العروض حتى أسفل الصفحة */
  storyBlocks?: StoryBlock[];
  /** كل عنصر = إطاران + صورة 1:1 (يطيل الصفحة ويرفع الثقة) */
  storyBeats?: StoryBeat[];
  reviews: { name: string; avatar: string; text: string }[];
  faqs: { q: string; a: string }[];
  guaranteeTitle: string;
  guaranteeText: string;
  guaranteePoints?: string[];
  ctaLabel: string;
  /** صورة ترويجية بين اختيار الباقة وزر الطلب */
  offersPromoImage?: string;
  /** يظهر في شبكة المتجر (الافتراضي: نعم) */
  listed?: boolean;
};

export const PRODUCT_PAGES: ProductPageConfig[] = [
  {
    id: 'kalb-robot-ai',
    brand: 'Machine AI Dog',
    emoji: '🤖',
    type: 'ألعاب ذكية',
    badge: 'هدية STEM رقم 1',
    badgeColor: '#0284C7',
    listed: true,
    marquee: 'الدفع عند الاستلام بعد المعاينة | تجهيز سريع لجميع مدن المملكة',
    warning: 'الهدية اللي ما تترميش بعد أسبوع — رفيق ذكي يرقص ويعمل كونغ فو ويبرمج مع طفلك.',
    heroTitle: 'كلب روبوت بالذكاء الاصطناعي — يرقص ويمارس الكونغ فو',
    heroSubtitle: 'حيوان أليف ذكي بتحكم صوتي وتطبيق وريموت — أكثر من 25 حركة تفاعلية.',
    heroBadge: 'ترند 2026',
    images: [
      '/images/robotdog-hero.jpg',
      '/images/robotdog-kids.jpg',
      '/images/robotdog-dance.jpg',
      '/images/robotdog-speak.jpg',
      '/images/robotdog-chip.jpg',
    ],
    catalogImage: '/images/robotdog-hero.jpg',
    shortDesc: 'كلب روبوت ذكي: رقص، كونغ فو، أوامر صوتية، تطبيق وريموت',
    offers: [
      { id: 1, name: 'قطعة واحدة', sub: 'كلب روبوت + ريموت + شاحن USB', price: 199, oldPrice: 399, pieces: 1 },
      { id: 2, name: 'قطعتان', sub: 'لعب مشترك للأخوة أو هدية مزدوجة', price: 329, oldPrice: 798, pieces: 2, popular: true, badge: 'الأكثر طلبًا' },
      { id: 3, name: 'ثلاث قطع', sub: 'أفضل قيمة — وفر أكثر من 700 ريال', price: 449, oldPrice: 1197, pieces: 3, badge: 'توفير ضخم' },
    ],
    trustCards: [
      { icon: '💳', title: 'الدفع عند الاستلام', text: 'ما تدفع إلا بعد ما تشوف المنتج' },
      { icon: '🤝', title: 'المعاينة قبل الدفع', text: 'افتح العلبة وتأكد ثم ادفع للمندوب' },
      { icon: '🛡️', title: 'ضمان ذهبي 100%', text: 'سياسة استرجاع واضحة تحميك' },
      { icon: '📦', title: 'تجهيز 24–48 ساعة', text: 'طلبك يتجهز بسرعة بعد التأكيد' },
    ],
    featureStrip: [
      { icon: '📱', title: 'تطبيق + ريموت', text: 'تحكم بثلاث طرق: صوت، تطبيق، جهاز تحكم' },
      { icon: '🥋', title: '+25 حركة', text: 'رقص، كونغ فو، مصافحة، وقوف على اليدين' },
      { icon: '📡', title: 'مدى 25 متر', text: 'حرية لعب في الصالة والحديقة' },
      { icon: '🧠', title: 'برمجة STEM', text: 'طفلك يبرمج تسلسلات حركات بنفسه' },
    ],
    painTitle: 'تعبت من ألعاب تموت بعد يومين؟',
    painText:
      'الطفل يفتح العلبة، يلعب ساعة، وبعدها اللعبة في الدرج. الشاشات تزيد والتركيز ينقص. هذا الروبوت مختلف: كل يوم حركة جديدة، وكل أسبوع تحدّي برمجة.',
    painItems: [
      { icon: '😴', title: 'اللعب التقليدي يمل بسرعة', text: 'بدون تفاعل ذكي، الطفل يفقد الحماس خلال أيام ويرجع للجوال.' },
      { icon: '📱', title: 'الشاشات تسرق وقت العائلة', text: 'بدل ساعة إضافية على الجوال: لعب حقيقي على الأرض مع رفيق يتحرك ويتكلم.' },
      { icon: '🎁', title: 'هدايا رخيصة تفضح نفسها', text: 'في العيد والمناسبات، تبي هدية تبان غالية وتخلّي الطفل يحكي عنها لأيام.' },
      { icon: '🧪', title: 'تبي فائدة مو بس ترفيه', text: 'البرمجة والترتيب المنطقي يبنون تركيز — بهدية يطلبها هو بنفسه.' },
    ],
    solutionTitle: 'الحل: رفيق تقني يرقص ويتفاعل ويتعلم مع طفلك',
    solutionText:
      'كلب روبوت بشريحة ذكية، عيون LED زرقاء، ومفاصل قوية. تحكم صوتي، تطبيق، وريموت — مثالي من عمر 6 سنوات فما فوق، وللعائلة كلها.',
    solutionImage: '/images/robotdog-solution.jpg',
    stepsTitle: 'يشتغل في 3 دقائق — بدون تركيب معقد',
    steps: [
      'اشحن البطارية عبر USB (مثل شاحن الجوال)',
      'شغّل الريموت أو التطبيق واختر الحركة',
      'قل الأمر أو اضغط: رقص، كونغ فو، مصافحة… وابتدِ المرح',
    ],
    storyBeats: [
      {
        frames: [
          { icon: '✨', title: 'شكل فاخر من أول نظرة', text: 'جسم أبيض مطفي، مفاصل سوداء، وعينان زرقاوان — مظهر CGI يخلّي الهدية تبان غالية قدام الضيوف من أول ثانية.' },
          { icon: '📏', title: 'حجم مناسب للبيت', text: 'طول تقريباً 16 سم وارتفاع 31 سم: كبير بما يكفي يبهر، وسهل التخزين بعد اللعب بدون فوضى.' },
          { icon: '📦', title: 'علبة كاملة جاهزة', text: 'روبوت + ريموت + شاحن USB. تفتح وتلعب — ما تحتاج تشتري إكسسوارات زيادة عشان تبدأ.' },
          { icon: '👀', title: 'اللي في الصورة = اللي يوصلك', text: 'نفس التصميم، نفس العيون الزرقاء، نفس الإحساس الفاخر. ما في مفاجأة سيئة بعد الاستلام.' },
        ],
        image: '/images/robotdog-wasef-1-kit.jpg',
        imageBadge: 'MACHINE',
        imageTitle: 'الروبوت + الريموت + التطبيق في صورة واحدة',
        imageText: 'هذا اللي يستلمه طفلك: تحكم كامل من أول يوم بدون تعقيد ولا تركيب.',
        bridge: {
          badge: 'لماذا يختلف؟',
          title: 'مو لعبة تمشي وتموت… رفيق يومي يبني عادة لعب ذكية',
          text: 'أغلب الألعاب تنمل خلال أيام لأن التفاعل ضعيف. هنا كل جلسة تقدر تغيّر الحركة، الترتيب، والوضع — فالاهتمام يطول والهدية تثبت.',
          bullets: [
            'ثلاث طرق تحكم: صوت، تطبيق، ريموت',
            'أكثر من 25 حركة تفاعلية جاهزة',
            'برمجة تسلسلات تناسب عمر 6+',
            'هدية تبان فخمة في التصوير والمناسبات',
          ],
        },
      },
    ],
    reviews: [
      { name: 'أم لين — الرياض', avatar: '👩‍👧', text: 'طلبت قطعة لين (8 سنوات). فتحت العلبة قدام المندوب والكلب رقص من أول تجربة. الحين كل مساء تقول «الكونغ فو». أفضل من أي لعبة بلاستيك هالسنة.' },
      { name: 'فهد العتيبي — جدة', avatar: '👨‍👦', text: 'الريموت سهل وابني ما يحتاج جوال. بعدين فتحنا التطبيق ورتّبنا حركات. حسّيت إني اشتريت درس روبوتات مو لعبة. وصلنا ثاني يوم.' },
      { name: 'نورة الشمري — الدمام', avatar: '👩‍👧‍👦', text: 'خذيت عرض القطعتين للأخوين. وفّرت وصار عندهم لعب مشترك بدل النزاع. المعاينة قبل الدفع راحت قلبي جدًا.' },
      { name: 'عبدالله الحربي — مكة المكرمة', avatar: '👨‍💼', text: 'الصور فخمة والواقع مطابق. العيون الزرقاء والرقص خلّوا الضيوف يصورون. لو عندك عزيمة خذ الثلاث قطع.' },
      { name: 'سارة القحطاني — الخبر', avatar: '👩‍🏫', text: 'كمعلمة أحب الجانب التعليمي. البنت صارت ترتب: اجلس ثم در ثم مصافحة. تركيز بدون ما أزعق على الشاشات.' },
      { name: 'خالد الغامدي — أبها', avatar: '🧔', text: 'كنت متردد، بس عرض القطعتين وفّر لي. البطارية تكفي جلسة طويلة والمدى ممتاز في الصالة. 10/10.' },
      { name: 'ريم الدوسري — الطائف', avatar: '👩‍👦', text: 'ابني 7 سنوات تعلّم الريموت خلال دقايق. أهم شي إن اللعبة ما انملت بعد أسبوع — كل يوم وضع جديد.' },
      { name: 'ماجد الشهري — المدينة المنورة', avatar: '👨‍👧', text: 'اشتريته هدية نجاح. البنت فرحت أكثر من الجوال. التطبيق واضح والحركات كثيرة. أنصح فيه للأهل.' },
      { name: 'هند العتيبي — بريدة', avatar: '👩‍👧', text: 'كنت أخاف يكون صوته مزعج، بس معتدل. الرقص والموسيقى خلو البيت فيه جو حلو بعد العشاء.' },
      { name: 'يوسف المالكي — الخبر', avatar: '👨‍🔧', text: 'من ناحية بناء، المفاصل متينة والشكل مرتب. مو لعبة رخيصة تتفك. يستاهل السعر خصوصًا مع عرض القطعتين.' },
      { name: 'أمل الحارثي — جيزان', avatar: '👩‍👦‍👦', text: 'ثلاث أطفال في البيت، أخذت ثلاث قطع. كل واحد عنده كلبه وما عاد فيه مشاكل مشاركة. القرار الصح.' },
      { name: 'سلطان الزهراني — تبوك', avatar: '🧔', text: 'التجربة من الطلب للتأكيد كانت سلسة. فتحت المنتج وتأكدت ثم دفعت. هذي الطريقة تعطيك ثقة.' },
      { name: 'لمى العساف — الأحساء', avatar: '👩‍🏫', text: 'استخدمناه كنشاط منزلي: الطفل يكتب تسلسل الحركات على ورقة وينفّذها. ممتاز للتركيز.' },
      { name: 'تركي القحطاني — نجران', avatar: '👨‍👦', text: 'المدى يغطي الصالة كاملة. ابني يحرّكه من غرفته تقريبًا. الرقص يطلع حلو في التصوير.' },
      { name: 'جواهر الشمري — حائل', avatar: '👩‍👧', text: 'بعد أسبوعين لسه تطلبه كل يوم. نادر أشوف لعبة تثبت كذا. شكرًا على الضمان والمعاينة.' },
    ],
    faqs: [
      { q: 'من أي عمر يناسب؟', a: 'مناسب عادة من 6 سنوات فما فوق. الريموت يسهّل على الأصغر، والتطبيق والبرمجة يناسبون من 8 إلى 12 وأكثر مع إشراف بسيط.' },
      { q: 'هل لازم التطبيق يشتغل؟', a: 'لا. الريموت يشغّل الحركة والحيل الأساسية بدون جوال. التطبيق يضيف الصوت والبرمجة والمزيد من الأوضاع.' },
      { q: 'وش فيه داخل العلبة؟', a: 'كلب الروبوت، جهاز تحكم، كابل شحن USB، ودليل استخدام مبسّط.' },
      { q: 'كم مدة الشحن واللعب؟', a: 'الشحن تقريباً ساعة ونص عبر USB، وجلسة لعب طويلة حسب كثافة الحركات — مثالي لأمسيات البيت.' },
      { q: 'هل أدفع الآن؟', a: 'لا. الدفع عند الاستلام فقط بعد ما تشوف المنتج وتتأكد منه أمام المندوب.' },
      { q: 'كيف أعرف تكلفة الشحن؟', a: 'تظهر لك بوضوح داخل صفحة إتمام الطلب قبل ما تأكّد — بدون مفاجآت.' },
      { q: 'وش الضمان الذهبي؟', a: 'معاينة قبل الدفع، واسترجاع خلال 3 أيام واستبدال خلال 7 أيام حسب سياسة المتجر المبينة أسفل الصفحة.' },
    ],
    guaranteeTitle: 'أنت لا تخاطر بأي شيء على الإطلاق! 🤝',
    guaranteeText:
      'نحن نثق في جودة الروبوت. لما يوصل المندوب: افتح العلبة، شغّل الكلب، وجرّب الرقص أو الكونغ فو قدامه قبل ما تدفع أي ريال. إذا ما عجبك الشكل أو الجودة، ارفض الاستلام مجانًا. وبعد الاستلام: استرجاع خلال 3 أيام واستبدال خلال 7 أيام — نرد خلال 48 ساعة على واتساب.',
    guaranteePoints: [
      'معاينة وفحص قبل الدفع عند باب المنزل',
      'استرجاع خلال 3 أيام من الاستلام',
      'استبدال خلال 7 أيام من الاستلام',
      'رد خدمة العملاء خلال 48 ساعة عبر واتساب',
      'المنتج لازم يكون بحالته الأصلية مع الملحقات والتغليف',
      'في حال منتج خاطئ: المتجر يتكفّل بإعادة الشحن حسب السياسة',
    ],
    ctaLabel: 'اطلب الآن',
    offersPromoImage: '/images/robotdog-offers-promo.jpg',
  },
  {
    id: 'produit-1',
    brand: 'AntiChoc Protect',
    emoji: '⚡',
    type: 'أمان منزلي',
    badge: 'الأكثر مبيعاً',
    badgeColor: '#D97706',
    listed: false,
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
      { icon: '🚚', title: 'توصيل 20 ريال', text: 'إلى جميع المدن حتى باب المنزل' },
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
      { q: 'كم تكلفة التوصيل؟', a: 'التوصيل بـ 20 ريال إلى جميع المدن.' },
    ],
    guaranteeTitle: 'لا تدفع شيئًا حتى ترى السلعة',
    guaranteeText: 'افحص المنتج وتأكد منه، ثم ادفع.',
    ctaLabel: 'اشترِ الآن',
  },
];

export function getProductPage(id: string) {
  if (id === 'antichoc') return PRODUCT_PAGES.find((p) => p.id === 'produit-1');
  return PRODUCT_PAGES.find((p) => p.id === id);
}

export const PRODUCTS = PRODUCT_PAGES.filter((p) => p.listed === true).map((p) => ({
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
  href: p.id === 'produit-1' ? '/product/antichoc' : `/product/${p.id}`,
  featured: true,
}));

export const FILTERS = [{ id: 'all', label: 'الكل' }];

export function getProduct(id: string) {
  if (id === 'antichoc') return PRODUCTS.find((p) => p.id === 'produit-1');
  return PRODUCTS.find((p) => p.id === id);
}
