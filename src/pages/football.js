import { esc } from '../lib/dom.js';

/*
 * لوحة الدوريات (روشن والدوريات الأوروبية): الترتيب والنقاط، مباريات الجولات القادمة، وصفحة لكل فريق
 * (ترتيبه ونقاطه وإحصاءاته ونتائجه ومبارياته القادمة). المصدر: واجهة ESPN العامة.
 */
const API = 'https://site.api.espn.com/apis';
// الدوريات المتاحة: رمز ESPN، الاسم، الشعار.
export const LEAGUES = [
  ['ksa.1', 'دوري روشن السعودي', '🇸🇦'], ['uefa.champions', 'دوري أبطال أوروبا', '🏆'], ['uefa.europa', 'الدوري الأوروبي', '🇪🇺'],
  ['eng.1', 'الدوري الإنجليزي', '🏴'], ['esp.1', 'الدوري الإسباني', '🇪🇸'], ['ita.1', 'الدوري الإيطالي', '🇮🇹'],
  ['ger.1', 'الدوري الألماني', '🇩🇪'], ['fra.1', 'الدوري الفرنسي', '🇫🇷']
];
// الموسم الحالي (يبدأ في يوليو): 2026 = موسم 2026-27.
const SEASON = (() => { const d = new Date(); return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; })();
let LEAGUE = 'ksa.1';
const STANDINGS_URLS = () => [`${API}/v2/sports/soccer/${LEAGUE}/standings?season=${SEASON}`, `${API}/v2/sports/soccer/${LEAGUE}/standings`];
const SCOREBOARD = () => `${API}/site/v2/sports/soccer/${LEAGUE}/scoreboard`;
const TEAM_SCHEDULE = id => `${API}/site/v2/sports/soccer/${LEAGUE}/teams/${encodeURIComponent(id)}/schedule`;
const CACHE_KEY = () => 'ghadeer.football.v3.' + LEAGUE;
const LEAGUE_KEY = 'ghadeer.football.league';
const HOUR = 60 * 60 * 1000;

// أسماء الأندية بالعربية (المزود يرسلها بالإنجليزية).
const AR_BY_ID = {
  21833: 'أبها', 8346: 'الأهلي', 131746: 'الدرعية', 8363: 'الاتفاق', 21446: 'الفيصلي', 13033: 'الفتح', 21827: 'الفيحاء',
  21964: 'الحزم', 929: 'الهلال', 2276: 'الاتحاد', 21829: 'الخليج', 22028: 'الخلود', 817: 'النصر', 22022: 'القادسية',
  21965: 'الرياض', 793: 'الشباب', 18459: 'التعاون', 130899: 'نيوم'
};
const AR_BY_NAME = {
  'abha': 'أبها', 'al ahli': 'الأهلي', 'al diriyah': 'الدرعية', 'al ettifaq': 'الاتفاق', 'al faisaly': 'الفيصلي', 'al fateh': 'الفتح',
  'al fayha': 'الفيحاء', 'al hazem': 'الحزم', 'al hilal': 'الهلال', 'al ittihad': 'الاتحاد', 'al khaleej': 'الخليج', 'al kholood': 'الخلود',
  'al nassr': 'النصر', 'al qadsiah': 'القادسية', 'al riyadh': 'الرياض', 'al shabab': 'الشباب', 'al taawoun': 'التعاون', 'neom sc': 'نيوم',
  'neom': 'نيوم', 'al wehda': 'الوحدة', 'al raed': 'الرائد', 'al orobah': 'العروبة', 'al okhdood': 'الأخدود', 'al taee': 'الطائي',
  'damac': 'ضمك', 'al adalah': 'العدالة', 'al najma': 'النجمة'
};
const teamName = t => AR_BY_ID[t?.id] || AR_BY_NAME[String(t?.displayName || t?.name || '').toLowerCase()] || t?.displayName || t?.name || 'فريق';
const logoOf = t => t?.logos?.[0]?.href || t?.logo || '';

const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const STAT = {
  played: ['gamesPlayed', 'GP'], wins: ['wins', 'W'], draws: ['ties', 'draws', 'D'], losses: ['losses', 'L'],
  gf: ['pointsFor', 'goalsFor', 'F'], ga: ['pointsAgainst', 'goalsAgainst', 'A'], gd: ['pointDifferential', 'goalDifference', 'GD'], points: ['points', 'P'], rank: ['rank', 'R']
};
const statValue = (stats, names) => { const s = stats.find(x => names.includes(x.name) || names.includes(x.abbreviation)); return s ? num(s.value ?? s.displayValue) : 0; };
const ymd = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).replace(/-/g, '');
const dateLabel = v => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 'موعد غير محدد' : new Intl.DateTimeFormat('ar-SA', { timeZone: 'Asia/Riyadh', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(d);
};

async function getJSON(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!r.ok) throw new Error('تعذر جلب البيانات الرياضية (' + r.status + ')');
  return r.json();
}
async function firstAvailable(urls) {
  let err;
  for (const u of urls) { try { return await getJSON(u); } catch (e) { err = e; } }
  throw err;
}

function standingsFrom(data) {
  const out = [];
  const walk = n => {
    if (!n || typeof n !== 'object') return;
    const entries = n.standings?.entries || n.entries;
    if (Array.isArray(entries)) out.push(...entries);
    (n.children || []).forEach(walk);
  };
  walk(data);
  const seen = new Set();
  return out.filter(e => e.team && !seen.has(e.team.id) && seen.add(e.team.id)).map((e, i) => {
    const st = e.stats || [], g = k => statValue(st, STAT[k]);
    return { id: String(e.team.id), name: teamName(e.team), logo: logoOf(e.team), rank: g('rank') || i + 1, played: g('played'), wins: g('wins'),
      draws: g('draws'), losses: g('losses'), gf: g('gf'), ga: g('ga'), gd: g('gd'), points: g('points'), note: e.note?.description || '' };
  }).sort((a, b) => a.rank - b.rank || b.points - a.points || b.gd - a.gd);
}

function matchesFrom(data) {
  return (data?.events || []).map(ev => {
    const comp = ev.competitions?.[0] || {}, cs = comp.competitors || [];
    const home = cs.find(c => c.homeAway === 'home') || cs[0] || {}, away = cs.find(c => c.homeAway === 'away') || cs[1] || {};
    const st = comp.status?.type || ev.status?.type || {};
    const score = c => c.score?.displayValue ?? c.score?.value ?? c.score;
    return { id: ev.id, date: ev.date, completed: !!st.completed, state: st.state || '', status: st.shortDetail || st.detail || '',
      homeId: String(home.team?.id || ''), awayId: String(away.team?.id || ''), home: teamName(home.team), away: teamName(away.team),
      homeLogo: logoOf(home.team), awayLogo: logoOf(away.team), homeScore: score(home), awayScore: score(away), venue: comp.venue?.fullName || '' };
  });
}

/** مباريات الجولات القادمة: أيام المباريات خلال الأسبوعين القادمين من تقويم الدوري. */
async function upcomingLeague() {
  const board = await getJSON(SCOREBOARD());
  const now = Date.now(), until = now + 15 * 24 * HOUR;
  const days = [...new Set((board.leagues?.[0]?.calendar || []).map(d => new Date(typeof d === 'string' ? d : d.startDate || d.value))
    .filter(d => d.getTime() >= now - 24 * HOUR && d.getTime() <= until).map(ymd))].slice(0, 8);
  const lists = await Promise.all(days.map(d => getJSON(`${SCOREBOARD()}?dates=${d}`).then(matchesFrom).catch(() => [])));
  const all = [...matchesFrom(board), ...lists.flat()];
  const seen = new Set();
  return all.filter(m => !seen.has(m.id) && seen.add(m.id) && !m.completed).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function matchCard(m, focusId = '') {
  const done = m.completed && m.homeScore != null && m.awayScore != null;
  let tag = '';
  if (done && focusId) {
    const mine = m.homeId === focusId ? +m.homeScore : +m.awayScore, other = m.homeId === focusId ? +m.awayScore : +m.homeScore;
    tag = mine > other ? '<span class="roshn-res win">فوز</span>' : mine < other ? '<span class="roshn-res loss">خسارة</span>' : '<span class="roshn-res draw">تعادل</span>';
  }
  const side = (logo, name, id) => `<div class="roshn-side${id === focusId ? ' me' : ''}">${logo ? `<img loading="lazy" src="${esc(logo)}" alt="">` : '<span class="roshn-placeholder">⚽</span>'}<span>${esc(name)}</span></div>`;
  return `<article class="roshn-match"><div class="roshn-match-date">${esc(dateLabel(m.date))}<small>${done ? 'انتهت' : m.state === 'in' ? '🔴 جارية الآن' : 'قادمة'}${m.venue ? ' · ' + esc(m.venue) : ''}</small>${tag}</div>
    ${side(m.homeLogo, m.home, m.homeId)}${done || m.state === 'in' ? `<b class="roshn-score">${esc(String(m.homeScore ?? 0))} - ${esc(String(m.awayScore ?? 0))}</b>` : '<span class="roshn-vs">VS</span>'}${side(m.awayLogo, m.away, m.awayId)}</article>`;
}

function renderTable(rows) {
  if (!rows.length) return '<div class="roshn-empty">لم تصل بيانات الترتيب من مزود البيانات.</div>';
  return `<p class="muted small">اضغط على أي فريق لعرض ترتيبه ونقاطه ونتائجه ومبارياته القادمة.</p>
    <div class="roshn-table-wrap"><table class="roshn-table"><thead><tr><th>#</th><th>الفريق</th><th>لعب</th><th>ف</th><th>ت</th><th>خ</th><th>له</th><th>عليه</th><th>±</th><th>نقاط</th></tr></thead>
    <tbody>${rows.map(t => `<tr><td>${t.rank}</td><td><button class="roshn-team" type="button" data-team="${esc(t.id)}">${t.logo ? `<img loading="lazy" src="${esc(t.logo)}" alt="">` : ''}<span>${esc(t.name)}</span></button></td>
      <td>${t.played}</td><td>${t.wins}</td><td>${t.draws}</td><td>${t.losses}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.gd > 0 ? '+' : ''}${t.gd}</td><td><b>${t.points}</b></td></tr>`).join('')}</tbody></table></div>`;
}

const leagueName = () => (LEAGUES.find(l => l[0] === LEAGUE) || LEAGUES[0])[1];
const loadingView = () => `<div class="card roshn-loading"><span class="roshn-ball">⚽</span><b>جارٍ تحميل ${leagueName()}…</b></div>`;
const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY()) || 'null'); } catch { return null; } };
const writeCache = v => { try { localStorage.setItem(CACHE_KEY(), JSON.stringify(v)); } catch { /* اختياري */ } };

export async function render(el) {
  try { const saved = localStorage.getItem(LEAGUE_KEY); if (LEAGUES.some(l => l[0] === saved)) LEAGUE = saved; } catch { /* اختياري */ }
  el.innerHTML = `<section class="roshn-hero"><div class="roshn-brand"><span class="roshn-ball">⚽</span><div><span class="eyebrow">لوحة الرياضة</span><h2 data-league-name>${esc(leagueName())}</h2><p>الترتيب والنقاط ومباريات كل فريق</p></div></div>
      <button class="btn roshn-refresh" type="button" data-roshn-refresh>↻ تحديث البيانات</button></section>
    <nav class="league-picker" aria-label="اختر الدوري">${LEAGUES.map(([c, n, i]) => `<button type="button" class="chip${c === LEAGUE ? ' active' : ''}" data-league="${c}">${i} ${esc(n)}</button>`).join('')}</nav>
    <div class="roshn-meta"><span data-roshn-status>…</span><span>المصدر: ESPN</span></div>
    <div class="segmented roshn-tabs"><button type="button" class="active" data-roshn-tab="table">جدول الترتيب</button><button type="button" data-roshn-tab="fixtures">المباريات القادمة</button><button type="button" data-roshn-tab="team" hidden>الفريق</button></div>
    <section data-roshn-table>${loadingView()}</section><section data-roshn-fixtures hidden></section><section class="roshn-fixtures" data-roshn-team hidden></section>`;
  const $ = s => el.querySelector(s);
  const status = $('[data-roshn-status]'), tableEl = $('[data-roshn-table]'), fixturesEl = $('[data-roshn-fixtures]'), teamEl = $('[data-roshn-team]');
  let data = null, fixturesLoaded = false;
  const teamCache = new Map();

  const setTab = tab => {
    el.querySelectorAll('[data-roshn-tab]').forEach(b => b.classList.toggle('active', b.dataset.roshnTab === tab));
    tableEl.hidden = tab !== 'table'; fixturesEl.hidden = tab !== 'fixtures'; teamEl.hidden = tab !== 'team';
    if (tab === 'fixtures' && !fixturesLoaded) loadFixtures();
  };
  el.querySelectorAll('[data-roshn-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.roshnTab)));
  $('[data-roshn-refresh]').addEventListener('click', () => { fixturesLoaded = false; teamCache.clear(); load(true); });
  el.addEventListener('click', e => { const b = e.target.closest('[data-team]'); if (b) showTeam(b.dataset.team); });
  el.querySelectorAll('[data-league]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.league === LEAGUE) return;
    LEAGUE = b.dataset.league;
    try { localStorage.setItem(LEAGUE_KEY, LEAGUE); } catch { /* اختياري */ }
    el.querySelectorAll('[data-league]').forEach(x => x.classList.toggle('active', x === b));
    $('[data-league-name]').textContent = leagueName();
    data = null; fixturesLoaded = false; teamCache.clear();
    const tb = $('[data-roshn-tab="team"]'); tb.hidden = true; teamEl.innerHTML = ''; fixturesEl.innerHTML = '';
    setTab('table'); load(false);
  }));

  async function load(force) {
    const btn = $('[data-roshn-refresh]'); btn.disabled = true;
    const cached = readCache();
    if (!force && cached?.teams?.length && cached.league === LEAGUE && Date.now() - cached.at < 3 * HOUR) { data = cached; draw(); btn.disabled = false; return; }
    tableEl.innerHTML = loadingView();
    try {
      const lg = LEAGUE;
      const teams = standingsFrom(await firstAvailable(STANDINGS_URLS()));
      if (lg !== LEAGUE) return;
      if (!teams.length) throw new Error('لم نجد جدول ترتيب صالحًا لدى مزود البيانات.');
      data = { teams, at: Date.now(), league: LEAGUE }; writeCache(data); draw();
      if (!fixturesEl.hidden) loadFixtures();
    } catch (err) {
      if (cached?.teams?.length && cached.league === LEAGUE) { data = cached; draw(); status.textContent = 'تعذر التحديث؛ تُعرض آخر نسخة محفوظة.'; }
      else {
        tableEl.innerHTML = `<div class="card roshn-empty"><h3>تعذر تحميل الترتيب</h3><p>${esc(err.message || 'تحقق من الاتصال.')}</p><button class="btn primary" type="button" data-retry>إعادة المحاولة</button></div>`;
        tableEl.querySelector('[data-retry]').onclick = () => load(true);
        status.textContent = 'لم يتم جلب بيانات حديثة.';
      }
    } finally { btn.disabled = false; }
  }

  function draw() {
    tableEl.innerHTML = renderTable(data.teams);
    status.textContent = 'آخر تحديث: ' + new Intl.DateTimeFormat('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.at));
  }

  async function loadFixtures() {
    fixturesLoaded = true;
    fixturesEl.innerHTML = loadingView();
    try {
      const lg = LEAGUE;
      const list = await upcomingLeague();
      if (lg !== LEAGUE) return;
      fixturesEl.innerHTML = `<div class="roshn-section-head"><h3>مباريات الجولات القادمة</h3></div>${list.length ? `<div class="roshn-list">${list.map(m => matchCard(m)).join('')}</div>` : '<div class="roshn-empty">لا توجد مباريات معلنة خلال الأسبوعين القادمين.</div>'}`;
    } catch (err) {
      fixturesLoaded = false;
      fixturesEl.innerHTML = `<div class="roshn-empty">تعذر جلب المباريات القادمة. ${esc(err.message || '')}</div>`;
    }
  }

  async function showTeam(id) {
    const t = data?.teams.find(x => x.id === id);
    const tabBtn = $('[data-roshn-tab="team"]'); tabBtn.hidden = false; tabBtn.textContent = t ? t.name : 'الفريق';
    setTab('team');
    teamEl.innerHTML = loadingView();
    try {
      const lg = LEAGUE;
      if (!teamCache.has(id)) {
        const [past, next] = await Promise.all([getJSON(TEAM_SCHEDULE(id)).catch(() => null), getJSON(TEAM_SCHEDULE(id) + '?fixture=true').catch(() => null)]);
        teamCache.set(id, { past, next });
      }
      if (lg !== LEAGUE) return;
      const { past, next } = teamCache.get(id);
      const results = matchesFrom(past).filter(m => m.completed).sort((a, b) => new Date(b.date) - new Date(a.date));
      const upcoming = matchesFrom(next).filter(m => !m.completed && new Date(m.date).getTime() > Date.now() - 3 * HOUR).sort((a, b) => new Date(a.date) - new Date(b.date));
      const info = past?.team || next?.team || {};
      const name = t?.name || teamName(info), logo = t?.logo || logoOf(info);
      const form = results.slice(0, 5).map(m => { const mine = m.homeId === id ? +m.homeScore : +m.awayScore, other = m.homeId === id ? +m.awayScore : +m.homeScore; return mine > other ? '<i class="win">ف</i>' : mine < other ? '<i class="loss">خ</i>' : '<i class="draw">ت</i>'; }).join('');
      teamEl.innerHTML = `<div class="roshn-section-head roshn-team-head">${logo ? `<img src="${esc(logo)}" alt="">` : '<span class="roshn-ball">⚽</span>'}<div><h3>${esc(name)}</h3>
          <p class="muted">${t ? `المركز <b>${t.rank}</b> من ${data.teams.length}` : ''}${info.recordSummary ? ' · السجل ' + esc(info.recordSummary) : ''}</p></div></div>
        ${t ? `<div class="roshn-stats">
          <div><b>${t.points}</b><small>نقطة</small></div><div><b>${t.played}</b><small>لعب</small></div><div><b>${t.wins}</b><small>فوز</small></div>
          <div><b>${t.draws}</b><small>تعادل</small></div><div><b>${t.losses}</b><small>خسارة</small></div><div><b>${t.gf}:${t.ga}</b><small>الأهداف</small></div>
          <div><b>${t.gd > 0 ? '+' : ''}${t.gd}</b><small>الفارق</small></div><div><b>${t.played ? Math.round(t.points / t.played * 10) / 10 : 0}</b><small>نقطة/مباراة</small></div></div>` : ''}
        ${form ? `<p class="roshn-form">آخر النتائج: ${form}</p>` : ''}
        <h4>📅 المباريات القادمة</h4>${upcoming.length ? `<div class="roshn-list">${upcoming.map(m => matchCard(m, id)).join('')}</div>` : '<div class="roshn-empty">لا توجد مباريات قادمة معلنة.</div>'}
        <h4>🏁 النتائج السابقة</h4>${results.length ? `<div class="roshn-list">${results.map(m => matchCard(m, id)).join('')}</div>` : '<div class="roshn-empty">لا توجد نتائج هذا الموسم بعد.</div>'}
        <button class="btn secondary block" type="button" data-back-table>↩ العودة لجدول الترتيب</button>`;
      teamEl.querySelector('[data-back-table]').onclick = () => setTab('table');
    } catch (err) {
      teamEl.innerHTML = `<div class="roshn-empty">تعذر جلب بيانات الفريق. ${esc(err.message || '')}</div>`;
    }
  }

  await load(false);
}
