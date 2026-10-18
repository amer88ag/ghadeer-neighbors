// أخبار محلية لشريط أخبار الحي: عناوين حديثة من مصادر سعودية موثوقة عن أبها وعسير والتعليم
// (الإجازات وتعليق الدراسة وغيرها). المصدر: بحث أخبار Google (RSS) مع تصفية بأسماء المصادر الموثوقة.
const QUERIES = [
  'تعليق الدراسة عسير',
  'تعليق الدراسة أبها',
  'إجازة الطلاب وزارة التعليم السعودية',
  'تعليق الدراسة الحضورية مدرستي',
  'منطقة عسير',
  'تعليم عسير',
  'أمانة منطقة عسير',
  'إمارة منطقة عسير',
  'أبها',
];
// مصادر سعودية موثوقة فقط (مطابقة تامة لاسم المصدر).
const TRUSTED = new Set([
  'وكالة الأنباء السعودية', 'واس', 'SPA', 'Saudi Press Agency', 'عكاظ', 'صحيفة عكاظ', 'جريدة الرياض', 'صحيفة الرياض',
  'جريدة الوطن السعودية', 'الوطن السعودية', 'صحيفة الوطن', 'جريدة المدينة', 'صحيفة المدينة', 'صحيفة اليوم', 'جريدة اليوم',
  'صحيفة سبق الإلكترونية', 'صحيفة سبق', 'سبق', 'الاقتصادية', 'صحيفة الاقتصادية', 'العربية', 'العربية.نت', 'الشرق الأوسط',
  'صحيفة عاجل', 'عاجل', 'صحيفة المواطن', 'المواطن', 'أخبار 24', 'قناة الإخبارية', 'الإخبارية', 'شبكة تواصل الإخبارية',
  'صحيفة تواصل', 'صحيفة مكة', 'مكة', 'صحيفة الوئام', 'الوئام', 'Arab News', 'Saudi Gazette'
].map(x => x.toLowerCase()));
const isTrusted = (src: string) => TRUSTED.has(src.trim().toLowerCase());
const MAX_AGE_DAYS = 3;
let cache: { at: number; body: string } | null = null;

const decode = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const tag = (xml: string, t: string) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? decode(m[1]) : ''; };

async function search(q: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:3d')}&hl=ar&gl=SA&ceid=SA:ar`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 GhadeerNeighbors/1.0' } });
  if (!r.ok) return [];
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const it = m[1];
    const source = tag(it, 'source');
    let title = tag(it, 'title');
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    return { title, source, link: tag(it, 'link'), date: new Date(tag(it, 'pubDate')).toISOString(), topic: q };
  });
}

async function build() {
  const lists = await Promise.all(QUERIES.map(q => search(q).catch(() => [])));
  const since = Date.now() - MAX_AGE_DAYS * 864e5;
  const seen = new Set<string>();
  const items = lists.flat()
    .filter(i => i.title && i.link && isTrusted(i.source) && new Date(i.date).getTime() >= since)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .filter(i => { const k = i.title.replace(/\s+/g, ' ').slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; })
    // أخبار التعليم والدراسة أولًا لأهميتها للأسر.
    .sort((a, b) => Number(/دراس|طلاب|التعليم|إجاز/.test(b.title)) - Number(/دراس|طلاب|التعليم|إجاز/.test(a.title)))
    .slice(0, 12);
  return JSON.stringify({ updated_at: new Date().toISOString(), items });
}

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (!cache || Date.now() - cache.at > 30 * 60 * 1000) cache = { at: Date.now(), body: await build() };
    return new Response(cache.body, { headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=900' } });
  } catch (e) {
    return new Response(JSON.stringify({ items: [], error: String(e) }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
