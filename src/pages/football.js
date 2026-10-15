import { esc } from '../lib/dom.js';

const LEAGUE = 'ksa.1';
const STANDINGS_URL = `https://site.api.espn.com/apis/v2/sports/soccer/${LEAGUE}/standings`;
const SCOREBOARD_URL = `https://site.api.espn.com/apis/site/v2/sports/soccer/${LEAGUE}/scoreboard`;
const CACHE_KEY = 'ghadeer.roshn.dashboard.v1';
const DAY = 24 * 60 * 60 * 1000;
const aliases = {
  gamesPlayed: ['gamesPlayed', 'played', 'appearances'], wins: ['wins', 'win'],
  ties: ['ties', 'draws', 'draw'], losses: ['losses', 'loss'],
  pointsFor: ['pointsFor', 'goalsFor', 'goalsScored'], pointsAgainst: ['pointsAgainst', 'goalsAgainst', 'goalsConceded'],
  pointDifferential: ['pointDifferential', 'goalDifference', 'differential'], points: ['points', 'leaguePoints']
};
const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const statValue = (stats, names) => { const s = stats.find(x => names.includes(x.name) || names.includes(x.abbreviation)); return s ? num(s.value ?? s.displayValue) : 0; };
const localDateKey = (d = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const get = k => parts.find(p => p.type === k)?.value || '';
  return get('year') + get('month') + get('day');
};
const dateLabel = value => {
  if (!value) return 'موعد غير محدد';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'موعد غير محدد' : new Intl.DateTimeFormat('ar-SA', { timeZone: 'Asia/Riyadh', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(d);
};
const getJSON = async url => {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('تعذر جلب البيانات الرياضية (' + response.status + ')');
  try { return await response.json(); } catch { throw new Error('رد مزود البيانات ليس بصيغة JSON صالحة.'); }
};
function standingsEntries(data) {
  const out = [];
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    const entries = node.standings?.entries || node.entries || node.standings?.groups?.[0]?.entries;
    if (Array.isArray(entries)) out.push(...entries);
    for (const child of node.children || []) walk(child);
  };
  walk(data);
  const seen = new Set();
  return out.filter(e => { const id = e.team?.id || e.team?.uid || e.team?.displayName; if (!id || seen.has(id)) return false; seen.add(id); return true; }).map(e => {
    const stats = e.stats || []; const pick = key => statValue(stats, aliases[key]);
    return { id: String(e.team?.id || e.team?.uid || ''), name: e.team?.displayName || e.team?.name || e.team?.shortDisplayName || 'فريق',
      short: e.team?.abbreviation || '', logo: e.team?.logos?.[0]?.href || e.team?.logo || '',
      rank: num(e.rank ?? stats.find(s => s.name === 'rank')?.value), played: pick('gamesPlayed'), wins: pick('wins'),
      draws: pick('ties'), losses: pick('losses'), gf: pick('pointsFor'), ga: pick('pointsAgainst'),
      gd: pick('pointDifferential'), points: pick('points') };
  }).sort((a, b) => a.rank - b.rank || b.points - a.points || b.gd - a.gd);
}
function matchesFrom(data) {
  return (data.events || []).map(event => {
    const comp = event.competitions?.[0] || {}; const competitors = comp.competitors || [];
    const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
    const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};
    return { id: event.id, date: event.date, name: event.name || event.shortName || '',
      status: event.status?.type?.shortDetail || event.status?.type?.detail || '', completed: Boolean(event.status?.type?.completed),
      homeId: String(home.team?.id || ''), awayId: String(away.team?.id || ''),
      home: home.team?.displayName || home.team?.name || 'الفريق الأول', away: away.team?.displayName || away.team?.name || 'الفريق الثاني',
      homeLogo: home.team?.logos?.[0]?.href || '', awayLogo: away.team?.logos?.[0]?.href || '',
      homeScore: home.score, awayScore: away.score };
  });
}
let selectedTeamId = '';
let cached = null;
function matchCard(m) {
  const score = m.completed && m.homeScore != null && m.awayScore != null ? `<b class="roshn-score">${esc(String(m.homeScore))} - ${esc(String(m.awayScore))}</b>` : '<span class="roshn-vs">VS</span>';
  return `<article class="roshn-match"><div class="roshn-match-date">${esc(dateLabel(m.date))}<small>${esc(m.status || (m.completed ? 'انتهت' : 'قادمة'))}</small></div>
    <div class="roshn-side">${m.homeLogo ? `<img loading="lazy" src="${esc(m.homeLogo)}" alt="">` : '<span class="roshn-placeholder">⚽</span>'}<span>${esc(m.home)}</span></div>${score}
    <div class="roshn-side">${m.awayLogo ? `<img loading="lazy" src="${esc(m.awayLogo)}" alt="">` : '<span class="roshn-placeholder">⚽</span>'}<span>${esc(m.away)}</span></div></article>`;
}
function renderTable(rows) {
  if (!rows.length) return '<div class="roshn-empty">لم تصل بيانات الترتيب من مزود البيانات.</div>';
  return `<div class="roshn-table-wrap"><table class="roshn-table"><thead><tr><th>#</th><th>الفريق</th><th>لعب</th><th>ف</th><th>ت</th><th>خ</th><th>له</th><th>عليه</th><th>الفرق</th><th>نقاط</th></tr></thead><tbody>${rows.map((t, i) => `<tr class="${t.id === selectedTeamId ? 'selected' : ''}"><td>${t.rank || i + 1}</td><td><button class="roshn-team" type="button" data-team="${esc(t.id)}" title="عرض مباريات ${esc(t.name)}">${t.logo ? `<img loading="lazy" src="${esc(t.logo)}" alt="">` : '<span class="roshn-placeholder">⚽</span>'}<span>${esc(t.name)}</span></button></td><td>${t.played}</td><td>${t.wins}</td><td>${t.draws}</td><td>${t.losses}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.gd > 0 ? '+' : ''}${t.gd}</td><td><b>${t.points}</b></td></tr>`).join('')}</tbody></table></div>`;
}
const loadingView = () => '<div class="card roshn-loading"><span class="roshn-ball">⚽</span><b>جارٍ تحميل ترتيب دوري روشن والمباريات…</b><p class="muted">قد يستغرق جلب البيانات بضع ثوانٍ.</p></div>';

export async function render(el) {
  selectedTeamId = ''; let refreshBusy = false;
  el.innerHTML = `<section class="roshn-hero"><div class="roshn-brand"><span class="roshn-ball">⚽</span><div><span class="eyebrow">لوحة الرياضة</span><h2>دوري روشن السعودي</h2><p>الترتيب والنقاط والمباريات القادمة في مكان واحد</p></div></div><button type="button" class="btn secondary" data-roshn-refresh>↻ تحديث البيانات</button></section>
    <div class="roshn-meta"><span data-roshn-status>جارٍ التحقق من آخر تحديث…</span><span>البيانات الرياضية: ESPN</span></div>
    <div class="segmented roshn-tabs"><button type="button" class="active" data-roshn-tab="table">جدول الترتيب</button><button type="button" data-roshn-tab="fixtures">المباريات القادمة</button></div>
    <section data-roshn-table>${loadingView()}</section><section data-roshn-fixtures hidden></section>
    <p class="muted small roshn-note">تُجلب البيانات من مزود رياضي خارجي وقد تتأخر عن التحديث الرسمي. عند تعذر الاتصال، ستظهر آخر نسخة محفوظة مع توضيح وقتها.</p>`;
  const status = el.querySelector('[data-roshn-status]'), tableEl = el.querySelector('[data-roshn-table]'), fixturesEl = el.querySelector('[data-roshn-fixtures]');
  const setTab = tab => { el.querySelectorAll('[data-roshn-tab]').forEach(b => b.classList.toggle('active', b.dataset.roshnTab === tab)); tableEl.hidden = tab !== 'table'; fixturesEl.hidden = tab !== 'fixtures'; };
  el.querySelectorAll('[data-roshn-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.roshnTab)));
  el.querySelector('[data-roshn-refresh]').addEventListener('click', () => load(true));
  el.addEventListener('click', e => { const button = e.target.closest('[data-team]'); if (!button) return; selectedTeamId = button.dataset.team; setTab('fixtures'); draw(); });
  function draw() {
    if (!cached) return;
    tableEl.innerHTML = renderTable(cached.teams);
    const matches = cached.matches.filter(m => !m.completed && (!selectedTeamId || m.homeId === selectedTeamId || m.awayId === selectedTeamId)).sort((a, b) => new Date(a.date) - new Date(b.date));
    const teamName = cached.teams.find(t => t.id === selectedTeamId)?.name;
    fixturesEl.innerHTML = `<div class="roshn-section-head"><div><h3>${teamName ? 'مباريات ' + esc(teamName) : 'المباريات القادمة'}</h3><p class="muted">${selectedTeamId ? 'اختر فريقًا آخر من جدول الترتيب لتغيير القائمة.' : 'المواعيد القادمة حسب البيانات المتاحة.'}</p></div>${selectedTeamId ? '<button type="button" class="btn secondary" data-all-fixtures>كل المباريات</button>' : ''}</div>${matches.length ? `<div class="roshn-fixtures">${matches.slice(0, 60).map(matchCard).join('')}</div>` : '<div class="roshn-empty">لا توجد مباريات قادمة متاحة لهذا الاختيار حاليًا.</div>'}`;
    fixturesEl.querySelector('[data-all-fixtures]')?.addEventListener('click', () => { selectedTeamId = ''; draw(); });
    status.textContent = `آخر تحديث: ${new Intl.DateTimeFormat('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(cached.updatedAt))}${cached.stale ? ' · بيانات محفوظة قد تكون قديمة' : ''}`;
  }
  async function load(force = false) {
    if (refreshBusy) return; refreshBusy = true;
    const btn = el.querySelector('[data-roshn-refresh]'); btn.disabled = true; btn.textContent = 'جارٍ التحديث…';
    if (!cached) tableEl.innerHTML = loadingView();
    try {
      const existing = !force ? JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') : null;
      if (existing?.updatedAt && Date.now() - existing.updatedAt < DAY && existing.teams?.length) {
        cached = existing; draw(); return;
      }
      const now = new Date(), end = new Date(now.getTime() + 90 * DAY);
      const [standings, scoreboard] = await Promise.all([
        getJSON(STANDINGS_URL), getJSON(`${SCOREBOARD_URL}?dates=${localDateKey(now)}-${localDateKey(end)}&limit=200`)
      ]);
      const teams = standingsEntries(standings), matches = matchesFrom(scoreboard);
      if (!teams.length) throw new Error('اتصلنا بمزود البيانات، لكن لم نجد جدول ترتيب صالحًا.');
      cached = { teams, matches, updatedAt: Date.now(), stale: false };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(cached)); } catch {}
      draw();
    } catch (err) {
      let fallback = null; try { fallback = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch {}
      if (fallback?.teams?.length) {
        cached = { ...fallback, stale: true }; draw();
        status.textContent = 'تعذر التحديث؛ نسخة محفوظة من ' + new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fallback.updatedAt));
      } else {
        tableEl.innerHTML = `<div class="card roshn-empty"><h3>تعذر تحميل الترتيب</h3><p>${esc(err.message || 'تحقق من الاتصال ثم أعد المحاولة.')}</p><p class="muted small">قد يكون مزود البيانات غير متاح أو يمنع الاتصال المباشر من المتصفح.</p><button class="btn primary" type="button" data-retry>إعادة المحاولة</button></div>`;
        tableEl.querySelector('[data-retry]')?.addEventListener('click', () => load(true)); status.textContent = 'لم يتم جلب بيانات حديثة.';
      }
    } finally { refreshBusy = false; btn.disabled = false; btn.textContent = '↻ تحديث البيانات'; }
  }
  await load(false);
}
