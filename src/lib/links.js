/* روابط خارجية مفيدة (مراجع فقط — لا تُحمّل داخل البرنامج). */
import { esc } from './dom.js';

export const NEWS = {
 "🇸🇦 السعودية": [
  [
   "https://www.spa.gov.sa/",
   "🟢 واس"
  ],
  [
   "https://sabq.org/",
   "📰 سبق"
  ],
  [
   "https://ajel.sa/",
   "⚡ عاجل"
  ],
  [
   "https://www.akhbaar24.com/",
   "🗞️ أخبار 24"
  ],
  [
   "https://www.alriyadh.com/",
   "📰 الرياض"
  ],
  [
   "https://www.okaz.com.sa/",
   "📰 عكاظ"
  ],
  [
   "https://www.alwatan.com.sa/",
   "📰 الوطن"
  ],
  [
   "https://www.alyaum.com/",
   "📰 اليوم"
  ],
  [
   "https://www.al-madina.com/",
   "📰 المدينة"
  ],
  [
   "https://www.al-jazirah.com/",
   "📰 الجزيرة"
  ],
  [
   "https://makkahnewspaper.com/",
   "🕋 مكة"
  ],
  [
   "https://albiladdaily.com/",
   "📰 البلاد"
  ],
  [
   "https://www.alarabiya.net/",
   "📺 العربية"
  ],
  [
   "https://www.arabnews.com/",
   "🌐 Arab News"
  ],
  [
   "https://www.saudigazette.com.sa/",
   "🌐 Saudi Gazette"
  ]
 ],
 "🌍 العربية": [
  [
   "https://www.aljazeera.net/",
   "📺 الجزيرة"
  ],
  [
   "https://www.alarabiya.net/",
   "📺 العربية"
  ],
  [
   "https://www.asharq.com/",
   "📺 الشرق"
  ],
  [
   "https://www.skynewsarabia.com/",
   "📺 سكاي نيوز عربية"
  ],
  [
   "https://www.bbc.com/arabic",
   "🌐 BBC عربي"
  ],
  [
   "https://arabic.cnn.com/",
   "🌐 CNN عربية"
  ],
  [
   "https://www.france24.com/ar/",
   "🌐 فرانس 24"
  ],
  [
   "https://www.dw.com/ar/",
   "🌐 DW عربي"
  ],
  [
   "https://www.alaraby.co.uk/",
   "📰 العربي الجديد"
  ],
  [
   "https://www.independentarabia.com/",
   "📰 إندبندنت عربية"
  ],
  [
   "https://www.ahram.org.eg/",
   "📰 الأهرام"
  ],
  [
   "https://www.almasryalyoum.com/",
   "📰 المصري اليوم"
  ],
  [
   "https://www.youm7.com/",
   "📰 اليوم السابع"
  ],
  [
   "https://www.alquds.co.uk/",
   "📰 القدس العربي"
  ]
 ],
 "🌐 العالم": [
  [
   "https://www.reuters.com/world/",
   "🌐 Reuters"
  ],
  [
   "https://apnews.com/",
   "🌐 AP"
  ],
  [
   "https://www.bbc.com/news",
   "🌐 BBC News"
  ],
  [
   "https://www.cnn.com/",
   "🌐 CNN"
  ],
  [
   "https://www.theguardian.com/international",
   "🌐 The Guardian"
  ],
  [
   "https://www.nytimes.com/",
   "🌐 The New York Times"
  ],
  [
   "https://www.washingtonpost.com/",
   "🌐 The Washington Post"
  ],
  [
   "https://www.aljazeera.com/",
   "🌐 Al Jazeera English"
  ],
  [
   "https://www.france24.com/en/",
   "🌐 France 24"
  ],
  [
   "https://www.dw.com/en/",
   "🌐 DW"
  ]
 ],
 "🏛️ وكالات الأنباء": [
  [
   "https://www.reuters.com/",
   "📡 Reuters"
  ],
  [
   "https://apnews.com/",
   "📡 AP"
  ],
  [
   "https://www.afp.com/",
   "📡 AFP"
  ],
  [
   "https://www.aa.com.tr/ar",
   "📡 الأناضول"
  ]
 ],
 "💼 الاقتصاد والأعمال": [
  [
   "https://www.aleqt.com/",
   "💰 الاقتصادية"
  ],
  [
   "https://www.argaam.com/",
   "📊 أرقام"
  ],
  [
   "https://www.mubasher.info/",
   "📈 مباشر"
  ],
  [
   "https://www.zawya.com/",
   "💼 زاوية"
  ],
  [
   "https://www.bloomberg.com/",
   "🌐 Bloomberg"
  ],
  [
   "https://www.ft.com/",
   "🌐 Financial Times"
  ]
 ]
};

export const SPORTS = [["https://www.spl.com.sa/ar", "🇸🇦 دوري روشن السعودي"], ["https://www.saff.com.sa/", "🇸🇦 الاتحاد السعودي — كأس الملك والسوبر"], ["https://www.the-afc.com/", "🌏 الاتحاد الآسيوي"], ["https://www.uefa.com/uefaeuropaleague/", "🏆 الدوري الأوروبي"], ["https://www.uefa.com/", "🌐 UEFA — البطولات الأوروبية"], ["https://www.fifa.com/", "🌍 FIFA"], ["https://www.gulfcup.com/", "🌙 كأس الخليج"]];

export const JOBS = [
 {
  "n": "جدارات — المنصة الوطنية الموحدة للتوظيف",
  "t": "حكومي + خاص",
  "u": "https://jadarat.sa/",
  "d": "المنصة الوطنية الموحدة للتوظيف؛ تعرض فرص القطاعين العام والخاص."
 },
 {
  "n": "وزارة الموارد البشرية والتنمية الاجتماعية",
  "t": "حكومي",
  "u": "https://www.hrsd.gov.sa/ministry/about-ministry/jobs",
  "d": "صفحة التوظيف الرسمية للوزارة."
 },
 {
  "n": "وزارة الصحة",
  "t": "حكومي",
  "u": "https://www.moh.gov.sa/ministry/about/pages/work-for-us.aspx",
  "d": "بوابة التوظيف الرسمية وبيانات فرص الوزارة."
 },
 {
  "n": "وزارة العدل",
  "t": "حكومي",
  "u": "https://www.moj.gov.sa/ar/Ministry/recruitment/Pages/default.aspx",
  "d": "التوظيف الرسمي بوزارة العدل."
 },
 {
  "n": "وزارة التعليم",
  "t": "حكومي",
  "u": "https://www.moe.gov.sa/ar/aboutus/nationaltransformation/pages/employmentstrategy.aspx",
  "d": "قنوات التوظيف الرسمية للوزارة."
 },
 {
  "n": "هيئة الاتصالات والفضاء والتقنية",
  "t": "حكومي",
  "u": "https://www.cst.gov.sa/about/career",
  "d": "الفرص الوظيفية وبرامج الخريجين."
 },
 {
  "n": "LinkedIn Jobs",
  "t": "خاص",
  "u": "https://www.linkedin.com/jobs/",
  "d": "وظائف الشركات وحسابات أصحاب العمل."
 },
 {
  "n": "Bayt",
  "t": "خاص",
  "u": "https://www.bayt.com/ar/saudi-arabia/jobs/",
  "d": "منصة وظائف للقطاع الخاص."
 }
];

export const REAL_ESTATE = [
 {
  "n": "الهيئة العامة للعقار",
  "t": "رسمي",
  "u": "https://rega.gov.sa/",
  "d": "التحقق من الوسطاء والإعلانات والخدمات والمؤشرات العقارية."
 },
 {
  "n": "إيجار",
  "t": "رسمي",
  "u": "https://rega.gov.sa/rega-services/platforms/ejar/",
  "d": "تنظيم الإيجار وتوثيق العقود وحفظ حقوق الأطراف."
 },
 {
  "n": "سكني",
  "t": "رسمي",
  "u": "https://sakani.sa/",
  "d": "حلول وخدمات سكنية وعقارية."
 },
 {
  "n": "عقار",
  "t": "مرخّص",
  "u": "https://sa.aqar.fm/",
  "d": "بحث عن البيع والإيجار؛ تحقّق من ترخيص الإعلان والوسيط قبل التعامل."
 },
 {
  "n": "بيوت السعودية",
  "t": "مرخّص",
  "u": "https://www.bayut.sa/",
  "d": "عروض بيع وإيجار عقارية."
 },
 {
  "n": "Property Finder السعودية",
  "t": "مرخّص",
  "u": "https://www.propertyfinder.sa/",
  "d": "عروض عقارية للبيع والإيجار."
 },
 {
  "n": "شبكة عقار",
  "t": "مرخّص",
  "u": "https://aqar.net.sa/",
  "d": "منصة عقارية مرخّصة وفق دليل الهيئة."
 },
 {
  "n": "سندك",
  "t": "مرخّص",
  "u": "https://sanadak.sa/",
  "d": "منصة عقارية مدرجة ضمن منصات الوساطة المرخّصة."
 },
 {
  "n": "سهيل",
  "t": "مرخّص",
  "u": "https://www.suhail.ai/",
  "d": "منصة عقارية مدرجة ضمن منصات الوساطة المرخّصة."
 },
 {
  "n": "صكوك العقارية",
  "t": "مرخّص",
  "u": "https://sokok.sa/",
  "d": "منصة عقارية مدرجة ضمن منصات الوساطة المرخّصة."
 },
 {
  "n": "طوبة",
  "t": "مرخّص",
  "u": "https://tuba.com.sa/",
  "d": "منصة عقارية مدرجة ضمن منصات الوساطة المرخّصة."
 }
];

/** قائمة روابط: تقبل [url, label] أو {n,t,u,d}. */
export function linkList(items) {
  return `<div class="links">${items.map(x => Array.isArray(x)
    ? `<a class="link-item" href="${esc(x[0])}" target="_blank" rel="noopener noreferrer"><b>${esc(x[1])}</b><span>↗</span></a>`
    : `<a class="link-item" href="${esc(x.u)}" target="_blank" rel="noopener noreferrer"><div><b>${esc(x.n)}</b> <span class="pill">${esc(x.t)}</span><small>${esc(x.d)}</small></div><span>↗</span></a>`).join('')}</div>`;
}

export const GOV = [
  ['https://www.absher.sa/', '🪪 أبشر — خدمات الأفراد'],
  ['https://www.iam.gov.sa/', '🔐 النفاذ الوطني الموحد'],
  ['https://balady.gov.sa/', '🏙️ بلدي — الخدمات البلدية'],
  ['https://najiz.sa/', '⚖️ ناجز — الخدمات العدلية'],
  ['https://www.moi.gov.sa/', '🏛️ وزارة الداخلية — الخدمات الإلكترونية'],
  ['https://www.moh.gov.sa/', '🏥 وزارة الصحة'],
  ['https://noor.moe.gov.sa/', '📘 نظام نور'],
  ['https://www.se.com.sa/', '⚡ الشركة السعودية للكهرباء'],
  ['https://www.nwc.com.sa/', '💧 شركة المياه الوطنية'],
  ['https://ncm.gov.sa/', '🌦️ المركز الوطني للأرصاد'],
  ['https://ehsan.sa/', '🤲 منصة إحسان للعمل الخيري']
];
export const MOSQUES = [
  ['https://www.google.com/maps/search/مساجد+قريبة+من+المحالة+أبها', '🕌 المساجد القريبة من المحالة (خرائط Google)'],
  ['https://www.google.com/maps/search/جامع+المحالة+أبها', '🕌 الجوامع في المحالة (خرائط Google)']
];
export const EMERGENCY = [
  ['tel:911', '🚨 الطوارئ الموحد — 911'], ['tel:999', '👮 الشرطة — 999'], ['tel:998', '🚒 الدفاع المدني — 998'],
  ['tel:997', '🚑 الهلال الأحمر (الإسعاف) — 997'], ['tel:993', '🚓 المرور — 993'], ['tel:937', '🏥 مركز اتصال وزارة الصحة — 937']
];
