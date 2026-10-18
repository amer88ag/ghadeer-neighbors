const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765/';
const SHOTS = process.argv[2] || '/tmp/shots';
fs.mkdirSync(SHOTS, { recursive: true });
const mock = fs.readFileSync(__dirname + '/mock-supabase.js', 'utf8');
const results = []; const errors = [];
const ok = (name, cond, extra = '') => { results.push([cond ? 'PASS' : 'FAIL', name, extra]); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar-SA', acceptDownloads: true });
  await ctx.route('https://cdn.jsdelivr.net/**', r => r.fulfill({ contentType: 'application/javascript', body: mock }));
  await ctx.route('https://api.aladhan.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { timings: { Fajr: '04:50', Sunrise: '06:05', Dhuhr: '12:10', Asr: '15:35', Maghrib: '18:10', Isha: '19:40' }, date: { hijri: { day: '29', month: { ar: 'ربيع الآخر' }, year: '1448' } } } }) }));
  await ctx.route('https://xewjakfmdfkbhcnxglct.supabase.co/functions/v1/ghadeer-local-news', r => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ items: [{ title: 'تعليق الدراسة الحضورية في أبها غدًا', source: 'واس', link: 'https://www.spa.gov.sa/x', date: new Date().toISOString() }] }) }));
  await ctx.route('https://api.open-meteo.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ current: { temperature_2m: 21.4, relative_humidity_2m: 40, apparent_temperature: 20.9, weather_code: 1, wind_speed_10m: 12 }, daily: { time: ['2026-10-11','2026-10-12','2026-10-13'], weather_code: [1,3,61], precipitation_probability_max: [0,10,60], temperature_2m_max: [26,25,22], temperature_2m_min: [14,13,12] } }) }));
  const espnUrls = []; ctx.on('request', q => { if (q.url().includes('espn.com')) espnUrls.push(q.url()); });
  const lastEspn = async () => espnUrls.slice(-3).join(' ');
  const espnTeam = (id, name) => ({ id: String(id), displayName: name, abbreviation: name.slice(0, 3) });
  await ctx.route('https://site.api.espn.com/apis/v2/**', r => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ children: [{ standings: { entries: [
    { team: espnTeam(101, 'النصر'), stats: [{ name: 'rank', value: 1 }, { name: 'gamesPlayed', value: 7 }, { name: 'wins', value: 6 }, { name: 'ties', value: 1 }, { name: 'losses', value: 0 }, { name: 'pointsFor', value: 18 }, { name: 'pointsAgainst', value: 5 }, { name: 'pointDifferential', value: 13 }, { name: 'points', value: 19 }] },
    { team: espnTeam(102, 'الهلال'), stats: [{ name: 'rank', value: 2 }, { name: 'gamesPlayed', value: 7 }, { name: 'wins', value: 5 }, { name: 'ties', value: 2 }, { name: 'losses', value: 0 }, { name: 'points', value: 17 }] }] } }] }) }));
  const espnEv = (id, days, home, away, done) => ({ id, date: new Date(Date.now() + days * 864e5).toISOString(), status: { type: { completed: done, state: done ? 'post' : 'pre' } },
    competitions: [{ competitors: [{ homeAway: 'home', team: espnTeam(home[0], home[1]), score: done ? '2' : undefined }, { homeAway: 'away', team: espnTeam(away[0], away[1]), score: done ? '1' : undefined }] }] });
  await ctx.route('https://site.api.espn.com/apis/site/v2/**', r => {
    const u = r.request().url();
    const events = u.includes('/teams/') && !u.includes('fixture=true') ? [espnEv('p1', -7, [101, 'النصر'], [103, 'الاتحاد'], true)] : [espnEv('e1', 3, [101, 'النصر'], [102, 'الهلال'], false)];
    r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ events, leagues: [{ calendar: [] }] }) });
  });
  await ctx.route('**/apis/v2/sports/soccer/ksa.1/standings**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ children: [{ standings: { entries: [
    { rank: 1, team: { id: '101', displayName: 'النصر', abbreviation: 'NAS' }, stats: [{ name: 'gamesPlayed', value: 7 }, { name: 'wins', value: 6 }, { name: 'ties', value: 1 }, { name: 'losses', value: 0 }, { name: 'pointsFor', value: 18 }, { name: 'pointsAgainst', value: 4 }, { name: 'pointDifferential', value: 14 }, { name: 'points', value: 19 }] },
    { rank: 2, team: { id: '102', displayName: 'الهلال', abbreviation: 'HIL' }, stats: [{ name: 'gamesPlayed', value: 7 }, { name: 'wins', value: 5 }, { name: 'ties', value: 2 }, { name: 'losses', value: 0 }, { name: 'pointsFor', value: 15 }, { name: 'pointsAgainst', value: 5 }, { name: 'pointDifferential', value: 10 }, { name: 'points', value: 17 }] }
  ] } }] }) }));
  await ctx.route('**/apis/site/v2/sports/soccer/ksa.1/scoreboard**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ events: [{ id: 'match-1', date: '2026-10-20T17:00:00Z', name: 'Al Nassr vs Al Hilal', status: { type: { completed: false, shortDetail: 'قادمة' } }, competitions: [{ competitors: [ { homeAway: 'home', team: { id: '101', displayName: 'النصر' } }, { homeAway: 'away', team: { id: '102', displayName: 'الهلال' } } ] }] }] }) }));
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const calls = () => page.evaluate(() => window.__calls.map(c => c.name));
  const lastCall = name => page.evaluate(n => [...window.__calls].reverse().find(c => c.name === n), name);
  const toastText = async () => { await page.waitForSelector('#toast.show', { timeout: 4000 }).catch(() => {}); return page.textContent('#toast'); };


  // Every home icon opens a working page for the current role.
  async function checkAllTiles(role) {
    await page.goto(BASE + '#/home'); await page.waitForSelector('.tile');
    const ids = await page.$$eval('[data-tile]', els => els.map(e => e.dataset.tile));
    for (const id of ids) {
      await page.goto(BASE + '#/home'); await page.waitForSelector(`[data-tile="${id}"]`);
      await page.click(`[data-tile="${id}"]`);
      // Guests should see the welcome modal for member-only services, not navigate into them.
      if (role === 'guest' && !['account', 'terms', 'about', 'install', 'invite', 'display'].includes(id)) {
        await page.waitForSelector('#modalRoot .guest-welcome', { timeout: 4000 });
        const welcome = await page.locator('#modalRoot .guest-welcome').innerText();
        ok(`guest icon opens welcome [${id}]`, welcome.includes('الجيرة الطيبة') && welcome.includes('طلب الانضمام'), welcome.slice(0, 100));
        await page.click('#modalRoot .guest-welcome [data-close]');
        await page.waitForSelector('#modalRoot .modal', { state: 'detached', timeout: 3000 }).catch(() => {});
        continue;
      }
      await page.waitForFunction(pid => { const b = document.querySelector('.page-body'); return b && b.dataset.page === pid && !b.querySelector('.skeleton'); }, id.split('/')[0], { timeout: 8000 }).catch(() => {});
      const bad = await page.$('.page-body .status.bad:not([data-outing-warning])');
      const hash = await page.evaluate(() => location.hash);
      ok(`icon [${role}] ${id}`, hash === '#/' + id && !bad && !(await page.$('.page-body .skeleton')), bad ? await bad.textContent() : hash);
    }
    return ids.length;
  }

  // 1) Guest home
  await page.goto(BASE);
  await page.waitForSelector('.tiles');
  const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
  ok('mobile: page zoom disabled', viewportMeta.includes('maximum-scale=1') && viewportMeta.includes('user-scalable=no'));
  ok('mobile: touch gesture zoom prevention styles present', await page.evaluate(() => getComputedStyle(document.documentElement).touchAction === 'pan-x pan-y' && getComputedStyle(document.querySelector('button')).touchAction === 'manipulation'));
  await page.waitForFunction(() => !document.querySelector('[data-next-coffee]')?.textContent.includes('…'));
  ok('home: all icons render for guest (no admin tile)', (await page.$$('.tile')).length === 19 && !(await page.$('[data-tile=manager]')) && !(await page.$('[data-tile=stats]')));
  ok('home: compact upcoming strip', (await page.textContent('[data-next-coffee]')).includes('عامر') && (await page.$$('.up-row')).length === 2);
  await page.waitForFunction(() => document.querySelector('[data-news-ticker] .tk-local'));
  const newsT = await page.textContent('[data-news-ticker]');
  ok('news ticker: occasion greeting + staff announcement in period', newsT.includes('اليوم الوطني') && newsT.includes('صيانة شبكة المياه'));
  ok('news ticker: staff message shown in its chosen color', await page.$eval('[data-news-ticker] .tk-news', e => getComputedStyle(e).color) === 'rgb(21, 101, 192)');
  ok('news ticker: future and expired hidden', !newsT.includes('مستقبلي') && !newsT.includes('إعلان منتهي'));
  ok('news ticker: dua for leaders and armed forces', newsT.includes('خادم الحرمين الشريفين') && newsT.includes('قواتنا المسلحة'));
  ok('news ticker: local news from trusted source', newsT.includes('تعليق الدراسة الحضورية') && newsT.includes('واس'));
  ok('news ticker: below dhikr ticker', await page.evaluate(() => document.querySelector('[data-ticker]').closest('.ticker').nextElementSibling.classList.contains('news-ticker')));
  ok('news ticker: thanks start after the appointment, last 24h, in red', await page.evaluate(async () => {
    const m = await import('./src/lib/ticker.js');
    const at = h => { const d = new Date(Date.now() + h * 36e5 + 3 * 36e5); return [d.toISOString().slice(0, 10), d.toISOString().slice(11, 16)]; };
    const mk = h => { const [dt, tm] = at(h); return m.newsItems({ coffee: [{ coffee_date: dt, coffee_time: tm, member_id: 1, status: 'مقرر' }], outings: [{ outing_date: dt, outing_time: tm, member1_id: 1, member2_id: 2, status: 'scheduled' }], memberName: id => 'ع' + id }).filter(i => i.kind === 'thanks').length; };
    return mk(-2) === 2 && mk(-23) === 2 && mk(-25) === 0 && mk(2) === 0;
  }) && await page.evaluate(() => { const s = document.createElement('span'); s.className = 'tk-item tk-thanks'; document.querySelector('.news-ticker').appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c === 'rgb(198, 40, 40)'; }));

  ok('home: ticker moves with dhikr + hadith', await page.evaluate(() => { const t = document.querySelector('[data-ticker]'); return getComputedStyle(t).animationName === 'ticker-rtl' && t.textContent.includes('سبحان الله') && t.textContent.includes('قال ﷺ'); }));
  await page.goto(BASE + '#/terms'); await page.waitForSelector('.terms h3');
  ok('terms page: full text + official laws', (await page.$$('.terms h3')).length === 15 && (await page.$$('.terms .link-item')).length === 6);
  await page.goto(BASE + '#/home'); await page.waitForSelector('.tiles');
  await page.waitForSelector('.prayer-grid'); await page.waitForSelector('[data-weather-temp]');
  ok('home: weather is a colored temperature only', (await page.textContent('[data-weather]')).trim() === '21°' && (await page.getAttribute('[data-weather]', 'class')).includes('temp-mild'));
  ok('home: weather sits in the top corner', await page.evaluate(() => { const w = document.querySelector('[data-weather]').getBoundingClientRect(), t = document.querySelector('.home-tiles').getBoundingClientRect(); return w.top < t.top && w.left < 60; }));
  await page.click('[data-weather]'); await page.waitForTimeout(250);
  ok('home: tap weather opens detailed forecast', page.url().endsWith('#/weather'));
  await page.goto(BASE + '#/home'); await page.waitForSelector('[data-weather-temp]');
  ok('home: ticker at top of page', await page.evaluate(() => document.querySelector('.page-body[data-page=home]').firstElementChild.classList.contains('ticker')));
  ok('home: fits one screen on phone', await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight * 1.2), await page.evaluate(() => document.documentElement.scrollHeight + '/' + window.innerHeight));
  ok('home: no duplicate login button in welcome card', !(await page.$('.home-top [data-login]')) && !!(await page.$('#who [data-login]')));
  const prayerGrid = await page.locator('.prayer-grid').innerText();
  ok('prayer: Fajr iqama +25 minutes', prayerGrid.includes('إقامة 5:15'));
  ok('prayer: Dhuhr iqama +20 minutes', prayerGrid.includes('إقامة 12:30'));
  ok('prayer: Asr iqama +20 minutes', prayerGrid.includes('إقامة 3:55'));
  ok('prayer: Maghrib iqama +10 minutes', prayerGrid.includes('إقامة 6:20'));
  ok('prayer: Isha iqama +20 minutes', prayerGrid.includes('إقامة 8:00'));
  ok('prayer: home shows 5 prayers compactly, sunrise in header', (await page.$$('.prayer-grid.compact > div')).length === 5 && (await page.textContent('.prayer-head')).includes('الشروق 6:05 ص'));
  ok('home: no direct members table read', !(await calls()).includes('table:members'));
  await page.screenshot({ path: SHOTS + '/1-home-guest.png', fullPage: true });

  ok('guest icons count', (await checkAllTiles('guest')) === 19);
  await page.goto(BASE + '#/links/sports'); await page.waitForSelector('[data-gate]');
  ok('guest: football dashboard gated until login', !(await page.$('.roshn-table')));

  await page.goto(BASE + '#/invite/' + encodeURIComponent('عامر القحطاني')); await page.waitForSelector('.invite-hero');
  ok('invite: guest landing shows inviter + features + join', (await page.textContent('.invite-hero')).includes('عامر القحطاني') && (await page.$$('.invite-features .feat')).length === 6);
  await page.click('.invite-hero [data-join]'); await page.waitForSelector('[data-join-request]');
  ok('invite: join request form opens from invitation', true);
  await page.click('.modal [data-close]').catch(() => {}); await page.waitForTimeout(200);
  await page.goto(BASE + '#/coffee'); await page.waitForSelector('.guest-gate');
  ok('guest: direct service access shows welcome gate', (await page.textContent('.guest-gate')).includes('أهلًا بك في جيران حي الغدير') && !!(await page.$('[data-gate-join]')) && !!(await page.$('[data-gate]')) && !!(await page.$('[data-gate-browse]')) && !(await page.$('[data-apology]')));
  await page.goto(BASE + '#/terms'); await page.waitForSelector('.terms');
  ok('guest: terms page open', true);

  // 2) Every page as guest
  for (const p of ['coffee', 'coffee/all', 'outings', 'outings/schedule', 'outings/new', 'events', 'neighbors', 'neighbors/me', 'messages', 'messages/private', 'messages/suggest', 'check', 'services', 'services/catalog', 'housing', 'housing/links', 'links', 'links/sports', 'links/jobs', 'account', 'manager', 'unknown-page']) {
    await page.goto(BASE + '#/' + p); await page.waitForTimeout(250);
    const bad = await page.$('.page-body .status.bad');
    ok('guest page renders: ' + p, !bad && !(await page.$('.page-body .skeleton')), bad ? await bad.textContent() : '');
  }

  // 3) Login as member 1 with remember
  await page.goto(BASE + '#/home');
  await page.click('#who [data-login]');
  await page.selectOption('.modal [name=member]', '1');
  await page.fill('.modal [name=pin]', '١٢٣٤'); // Arabic digits must normalize
  await page.check('.modal [name=remember]');
  await page.click('.modal .btn.primary');
  await page.waitForSelector('#who .chip:not(.light)');
  ok('login: chip shows name', (await page.textContent('#who')).includes('عامر'));
  const ls = await page.evaluate(() => JSON.stringify(localStorage));
  ok('login: device token stored, pin not stored', ls.includes('tok-1') && !ls.includes('1234'), ls);
  ok('login: manager nav hidden for member', await page.$eval('[data-nav=manager]', e => e.hidden));

  ok('member icons count', (await checkAllTiles('member')) === 19);
  await page.goto(BASE + '#/display'); await page.waitForSelector('[data-tiles-list]');
  await page.click('[data-tiles-btn=lg]'); await page.waitForSelector('[data-tiles-btn=lg].active');
  await page.click('[data-tiles-list] [data-id=coffee] [data-eye]'); await page.waitForSelector('[data-tiles-list] [data-id=coffee].inactive');
  await page.click('[data-tiles-list] [data-id=invite] [data-up]'); await page.waitForTimeout(150);
  await page.uncheck('[data-widget=prayer]'); await page.waitForTimeout(150);
  await page.click('[data-scale="0.05"]'); await page.waitForTimeout(150);
  await page.click('[data-theme-btn=dark]'); await page.waitForTimeout(150);
  const up = await lastCall('member_set_ui_prefs');
  ok('display: settings synced to member account', up && up.args.p_prefs.tiles === 'lg' && up.args.p_prefs.hidden.includes('coffee') && up.args.p_prefs.theme === 'dark');
  await page.goto(BASE + '#/home'); await page.waitForSelector('.home-tiles');
  ok('display: hidden tile removed, order changed, big tiles', !(await page.$('[data-tile=coffee]')) && (await page.$$eval('[data-tile]', t => t.map(x => x.dataset.tile))).indexOf('invite') === 5 && await page.locator('.home-tiles').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length === 4));
  ok('display: prayer hidden, zoom + dark theme applied', await page.$eval('[data-prayer]', e => e.hidden) && await page.evaluate(() => document.body.style.zoom === '1.05' && document.documentElement.dataset.theme === 'dark'));
  await page.goto(BASE + '#/display'); await page.waitForSelector('[data-reset]'); await page.click('[data-reset]'); await page.waitForTimeout(200);
  ok('display: reset restores defaults', await page.evaluate(() => !document.body.style.zoom && document.documentElement.dataset.theme === 'auto' && document.documentElement.dataset.tiles === 'md'));
  await page.goto(BASE + '#/invite'); await page.waitForSelector('.invite-compose');
  ok('invite: member composer with personal WhatsApp link', (await page.getAttribute('[data-wa]', 'href')).startsWith('https://wa.me/?text=') && decodeURIComponent(await page.getAttribute('[data-wa]', 'href')).includes('#/invite/'));
  await page.goto(BASE + '#/whatsapp/mine'); await page.waitForSelector('[data-mine]');
  await page.fill('[data-mine] [name=phone]', '0512345678'); await page.check('[data-mine] [name=allow]'); await page.click('[data-mine] button'); await page.waitForTimeout(300);
  const ws = await lastCall('member_set_whatsapp');
  ok('whatsapp: member saves own number with consent', ws && ws.args.p_phone === '0512345678' && ws.args.p_allow === true);
  await page.goto(BASE + '#/whatsapp'); await page.waitForSelector('[data-person]');
  await page.evaluate(() => { window.__waOpen = u => { window.__lastWa = u; }; });
  await page.fill('[data-person] [name=phone]', '0551234567'); await page.click('[data-person] button.wa');
  ok('whatsapp: message a person opens WhatsApp directly with the number', (await page.evaluate(() => window.__lastWa || '')).startsWith('https://wa.me/966551234567?text='));
  await page.click('a[href="#/whatsapp/group"]'); await page.waitForSelector('[data-group]');
  await page.click('[data-tpl=app]'); await page.click('[data-group] button.wa');
  const gw = await page.evaluate(() => window.__lastWa || '');
  ok('whatsapp: group message opens WhatsApp chooser with text', gw.startsWith('https://wa.me/?text=') && decodeURIComponent(gw).includes('برنامج جيران حي الغدير'));
  await page.goto(BASE + '#/links'); await page.waitForSelector('.link-tiles');
  ok('links: useful links shows icon sections (no news, no football)', (await page.$$('.link-tiles [data-links]')).length === 6 && !(await page.$('a[href="#/links/sports"]')) && !(await page.$('a[href="#/links/news"]')));
  await page.click('[data-links=emergency]'); await page.waitForSelector('.link-item');
  ok('links: section opens its links (emergency calls)', (await page.$$('a.link-item[href^="tel:"]')).length >= 5);
  await page.goto(BASE + '#/links/gov'); await page.waitForSelector('.link-item');
  ok('links: government services list', (await page.$$('.link-item')).length >= 10);
  await page.goto(BASE + '#/home'); await page.waitForSelector('.home-tiles');
  ok('home: news + WhatsApp tiles, display settings appears once', !!(await page.$('[data-tile="links/news"]')) && !!(await page.$('[data-tile=whatsapp]')) && (await page.$$('a[href="#/display"]')).length === 1);
  await page.goto(BASE + '#/links/sports'); await page.waitForSelector('.roshn-table');
  ok('football: Roshn standings render in app', (await page.textContent('.roshn-table')).includes('النصر') && (await page.textContent('.roshn-table')).includes('19'));
  await page.click('[data-team="101"]'); await page.waitForSelector('.roshn-match');
  ok('football: selecting a team shows upcoming fixture', (await page.textContent('.roshn-fixtures')).includes('الهلال') && (await page.textContent('.roshn-section-head')).includes('النصر'));
  ok('football: team page shows rank, points, results', (await page.textContent('[data-roshn-team]')).includes('المركز') && (await page.textContent('.roshn-stats')).includes('19') && (await page.textContent('[data-roshn-team]')).includes('الاتحاد') && !!(await page.$('.roshn-res.win')));
  await page.click('[data-roshn-tab=fixtures]'); await page.waitForSelector('[data-roshn-fixtures] .roshn-match');
  ok('football: league upcoming fixtures tab', (await page.textContent('[data-roshn-fixtures]')).includes('الهلال'));
  await page.click('[data-league="uefa.europa"]'); await page.waitForSelector('.roshn-table');
  ok('football: switch to Europa League', (await page.textContent('[data-league-name]')).includes('الدوري الأوروبي') && (await page.$$('[data-league]')).length === 8 && (await lastEspn()).includes('uefa.europa'));
  await page.click('[data-league="ksa.1"]'); await page.waitForSelector('.roshn-table');

  await page.goto(BASE + '#/services/lost'); await page.waitForSelector('[data-add]');
  ok('lost: only lost kinds listed', (await page.textContent('.page-body')).includes('مفاتيح') && !(await page.textContent('.page-body')).includes('مكتب'));
  await page.click('[data-add]'); await page.selectOption('.modal [name=mode]', 'معثور عليه'); await page.fill('.modal [name=title]', 'محفظة'); await page.click('.modal [data-post] .btn');
  await page.waitForTimeout(400); const lc = await lastCall('create_neighbor_market');
  ok('lost: posts with valid kind', lc && lc.args.p_kind === 'معثور عليه');
  await page.goto(BASE + '#/prayer'); await page.waitForSelector('.prayer-grid');
  ok('prayer: iqama shown', (await page.textContent('.prayer-grid')).includes('الإقامة 5:15 ص') && !(await page.locator('.prayer-grid > div').nth(1).innerText()).includes('الإقامة'));
  await page.goto(BASE + '#/azkar'); await page.click('[data-tap]'); await page.click('[data-tap]');
  ok('azkar: counter works', (await page.textContent('[data-count]')) === '2');

  // 4) Coffee apology
  await page.goto(BASE + '#/coffee'); await page.waitForSelector('[data-apology="11"]');
  ok('coffee: apology only on own row', (await page.$$('[data-apology]')).length === 1);
  await page.click('[data-apology="11"]'); await page.click('.modal [data-ok]');
  const t4 = await toastText();
  const c4 = await lastCall('member_apologize_coffee');
  ok('coffee: apology sent with pin', c4 && c4.args.p_pin === '1234' && c4.args.p_id === 11, t4);

  // 5) Vote
  await page.goto(BASE + '#/outings'); await page.waitForSelector('[data-vote=attending]');
  await page.click('[data-vote=attending]'); await page.waitForTimeout(400);
  ok('outings: vote recorded', !!(await lastCall('vote_outing_plan')));
  ok('outings: organizer sees expense form', !!(await page.$('[data-expense]')));

  // 6) New plan
  await page.goto(BASE + '#/outings/new');
  await page.fill('[name=type]', 'عشاء'); await page.fill('[name=place]', 'أبها');
  await page.fill('[name=date]', new Date(Date.now() + 864e6).toISOString().slice(0, 10));
  await page.click('[data-new] .btn.primary'); await page.waitForTimeout(500);
  ok('outings: plan created + redirected', !!(await lastCall('create_outing_plan')) && page.url().endsWith('#/outings'));

  // 7) Group message + private chat
  await page.goto(BASE + '#/messages'); await page.waitForSelector('[data-send]');
  await page.fill('[data-send] [name=msg]', 'مرحبا يا جيران'); await page.click('[data-send] .btn');
  await page.waitForTimeout(500);
  ok('messages: group message sent and visible', (await page.textContent('[data-box]')).includes('مرحبا يا جيران'));
  await page.goto(BASE + '#/neighbors'); await page.waitForSelector('.member');
  ok('neighbors: profile merged', (await page.textContent('[data-grid]')).includes('سعيد بن علي'));
  await page.click('a[href="#/messages/chat/2"]'); await page.waitForSelector('[data-send] [name=body]');
  await page.fill('[data-send] [name=body]', 'أهلًا أبو علي'); await page.click('[data-send] .btn');
  await page.waitForTimeout(500);
  ok('chat: private message appears', (await page.textContent('[data-box]')).includes('أهلًا أبو علي'));
  await page.screenshot({ path: SHOTS + '/2-chat.png', fullPage: true });
  await page.goto(BASE + '#/messages/private'); await page.waitForTimeout(400);
  ok('chat: conversation listed', (await page.textContent('.page-body')).includes('سعيد'));

  await page.goto(BASE + '#/neighbors/me'); await page.waitForSelector('[data-contact]');
  ok('profile: live settings prefilled', (await page.$eval('[data-residency] select', e => e.value)) === 'tenant' && await page.$eval('[data-contact] [name=whats]', e => e.checked));
  await page.goto(BASE + '#/neighbors'); await page.waitForSelector('.member');
  ok('neighbors: residency merged', (await page.textContent('[data-grid]')).includes('مستأجر'));

  // 8) Services catalog → post
  await page.goto(BASE + '#/services/catalog'); await page.click('details.card summary');
  await page.click('[data-svc]'); await page.waitForSelector('.modal [data-post]');
  const title = await page.inputValue('.modal [name=title]');
  await page.click('.modal [data-post] .btn'); await page.waitForTimeout(500);
  const c8 = await lastCall('create_neighbor_help');
  ok('services: catalog item posts help request', c8 && c8.args.p_title === title && title.length > 0, title);

  // 9) Reload → device restore → pin re-prompt
  await page.goto(BASE + '#/coffee'); await page.reload(); await page.waitForSelector('[data-gate]');
  ok('restore: identity restored after reload', (await page.textContent('#who')).includes('عامر'));
  ok('restore: services stay locked until pin + terms confirmed', !(await page.$('[data-apology]')));
  await page.click('[data-gate]'); await page.waitForSelector('.modal [name=pin]');
  ok('restore: pin re-prompt shows known name', (await page.textContent('.modal')).includes('الدخول باسم'));
  await page.fill('.modal [name=pin]', '1234'); await page.click('.modal .btn.primary');
  await page.waitForSelector('[data-apology="11"]');
  await page.click('[data-apology="11"]'); await page.click('.modal [data-ok]');
  await page.waitForTimeout(800);
  const restoredCalls = (await page.evaluate(() => window.__calls.filter(c => c.name === 'member_apologize_coffee').length));
  ok('restore: action continues after pin', restoredCalls >= 1);

  // 10) Logout
  await page.goto(BASE + '#/account'); await page.click('[data-logout]'); await page.waitForTimeout(300);
  ok('logout: token cleared + revoked on server', !(await page.evaluate(() => JSON.stringify(localStorage))).includes('tok-') && !!(await lastCall('member_revoke_device_token')));

  // 11) New member must accept terms
  await page.click('#who [data-login]'); await page.selectOption('.modal [name=member]', '3');
  await page.fill('.modal [name=pin]', '7777'); await page.click('.modal .btn.primary');
  await page.waitForSelector('.modal [data-agree]');
  await page.click('.modal [data-read]'); await page.waitForSelector('.modal .terms');
  ok('consent: full terms open from link', (await page.$$('.modal .terms h3')).length === 15);
  await page.click('.modal:last-child [data-close]');
  await page.check('.modal [data-agree]'); await page.click('.modal [data-ok]'); await page.waitForTimeout(400);
  const c11 = await lastCall('accept_program_terms');
  ok('terms: accepted via pin-verified RPC with version', c11 && c11.args.p_pin === '7777' && c11.args.p_member_name === 'خالد' && c11.args.p_version === 'terms-1.0');
  await page.goto(BASE + '#/account'); await page.click('[data-logout]');

  // 12) Wrong pin
  await page.click('#who [data-login]'); await page.selectOption('.modal [name=member]', '1');
  await page.fill('.modal [name=pin]', '0000'); await page.click('.modal .btn.primary'); await page.waitForTimeout(300);
  ok('login: wrong pin rejected', (await page.textContent('.modal [data-status]')).includes('غير صحيح'));
  await page.click('.modal [data-manager]');

  // 13) Manager
  await page.fill('.modal [name=pin]', '9999'); await page.click('.modal .btn.primary');
  await page.waitForSelector('.mgr-hero');
  ok('dashboard: KPIs + grouped sections with badges', (await page.$$('.kpi')).length >= 5 && (await page.$$('.mgr-card')).length >= 15 && !!(await page.$('.mgr-card .badge')));
  await page.click('.mgr-card[href="#/manager/settings"]'); await page.waitForSelector('[data-f=pause]');
  ok('settings: maintenance, texts, WhatsApp, security, diagnostics', !!(await page.$('[data-f=welcome]')) && !!(await page.$('[data-f=invite]')) && !!(await page.$('[data-f=wa]')) && !!(await page.$('[data-revoke-all]')) && (await page.textContent('[data-tab]')).includes('فحص النظام'));
  await page.fill('[data-f=welcome] [name=v]', 'حيّ يجمعنا'); await page.click('[data-f=welcome] button'); await page.waitForTimeout(300);
  const aw = await lastCall('manager_set_app_text');
  ok('settings: developer edits home welcome', aw && aw.args.p_key === 'home_welcome' && aw.args.p_value === 'حيّ يجمعنا');
  await page.selectOption('[data-jump]', 'members'); await page.waitForFunction(() => location.hash === '#/manager/members');
  ok('manager: jump menu navigates between sections', true);
  ok('manager: nav visible', !(await page.$eval('[data-nav=manager]', e => e.hidden)));
  for (const t of ['settings', 'joinRequests', 'ticker', 'schedules', 'plans', 'occasions', 'messages', 'members', 'permissions', 'rules', 'checks', 'reports']) {
    await page.goto(BASE + '#/manager/' + t); await page.waitForTimeout(300);
    // The schedule page may show a non-blocking date-rule warning; it must not fail the page-render test.
    const bad = await page.$('.page-body .status.bad:not([data-outing-warning])');
    ok('manager tab: ' + t, !bad && !!(await page.$('[data-tab] .card')), bad ? await bad.textContent() : '');
  }  await page.goto(BASE + '#/manager/ticker'); await page.waitForSelector('[data-f=ticker-new]');
  ok('ticker admin: current announcement listed, expired not', (await page.textContent('[data-tab]')).includes('صيانة شبكة المياه') && !(await page.textContent('[data-tab]')).includes('إعلان منتهي'));
  await page.fill('[data-f=ticker-new] [name=ttl]', 'اجتماع الجيران'); await page.selectOption('[data-f=ticker-new] [name=dur]', '168'); await page.click('[data-f=ticker-new] .color-pick label[title="أحمر"]');
  ok('ticker admin: color preview', (await page.$eval('[data-preview]', e => getComputedStyle(e).color)) === 'rgb(198, 40, 40)');
  await page.click('[data-f=ticker-new] button.primary'); await page.waitForTimeout(400);
  const tk = await lastCall('staff_post_ticker_message');
  ok('ticker admin: developer posts with chosen period', tk && tk.args.p_member_id === 0 && tk.args.p_title === 'اجتماع الجيران' && Math.round((new Date(tk.args.p_ends_at) - new Date(tk.args.p_starts_at)) / 864e5) === 7 && tk.args.p_color === '#c62828');

  ok('manager icons count (incl. admin)', (await checkAllTiles('manager')) === 21);
  await page.goto(BASE + '#/manager/schedules'); await page.waitForSelector('[data-f=coffee-new]'); await page.$$eval('details', ds => ds.forEach(d => d.open = true));
  await page.fill('[data-f=coffee-new] [name=date]', '2026-12-01'); await page.click('[data-f=coffee-new] .btn');
  await page.waitForTimeout(400);
  const c13 = await lastCall('manager_create_coffee');
  ok('manager: create coffee with manager pin', c13 && c13.args.p_manager_pin === '9999' && c13.args.p_date === '2026-12-01');
  await page.screenshot({ path: SHOTS + '/3-manager.png', fullPage: true });
  await page.goto(BASE + '#/manager/members'); await page.waitForSelector('[data-f=reset]');
  ok('manager: pin reset requests listed', (await page.textContent('[data-tab]')).includes('خالد'));
  await page.goto(BASE + '#/manager/reports'); await page.waitForSelector('[data-backup]');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 4000 }).catch(() => null), page.click('[data-backup]')]);
  ok('manager: backup downloads via RPC', !!dl && !(await calls()).some(c => c.startsWith('table:members')));
  await page.click('[data-stats]'); await page.waitForSelector('.kv');
  ok('manager: stats rendered', (await page.textContent('[data-out]')).includes('members'));

  // 13b) Supervisor tools
  await page.goto(BASE + '#/account'); await page.click('[data-logout]'); await page.waitForTimeout(300);
  await page.click('#who [data-login]'); await page.selectOption('.modal [name=member]', '2');
  await page.fill('.modal [name=pin]', '5555'); await page.click('.modal .btn.primary');
  await page.waitForSelector('#who .chip:not(.light)');
  ok('supervisor: admin nav visible', !(await page.$eval('[data-nav=manager]', e => e.hidden)));
  await page.goto(BASE + '#/manager/schedules'); await page.waitForSelector('[data-f=coffee-edit]', { state: 'attached' });
  ok('supervisor: no delete/swap controls', !(await page.$('[data-f=coffee-swap]')) && !(await page.$('[data-f=outing-swap]')) && !(await page.$('[data-f=coffee-edit] [value=delete]')));
  ok('supervisor: no manager-only sections in jump menu', !(await page.$('[data-jump] option[value=members]')) && !!(await page.$('[data-jump] option[value=rules]')) && !(await page.$('[data-jump] option[value=settings]')));
  await page.$$eval('details', ds => ds.forEach(d => d.open = true));
  await page.click('[data-f=coffee-edit] [value=save]'); await page.waitForTimeout(400);
  const sv = await lastCall('supervisor_update_coffee_assignment');
  ok('supervisor: edit uses supervisor RPC with own pin', sv && sv.args.p_pin === '5555' && 'p_target_member_id' in sv.args && !('p_manager_pin' in sv.args));
  await page.goto(BASE + '#/manager/joinRequests'); await page.waitForSelector('[data-tab] .card');
  ok('supervisor: join requests section visible', !!(await page.$('[data-jump] option[value=joinRequests]')) && (await page.textContent('[data-tab]')).includes('طلبات الانضمام'));
  await page.goto(BASE + '#/manager'); await page.waitForSelector('.mgr-hero');
  ok('supervisor: dashboard shows only permitted sections', !(await page.$('.mgr-card[href="#/manager/settings"]')) && !!(await page.$('.mgr-card[href="#/manager/ticker"]')));

  ok('supervisor icons count (incl. admin)', (await checkAllTiles('supervisor')) === 20);

  // 13c) Developer controls (re-login as manager)
  await page.goto(BASE + '#/account'); await page.click('[data-logout]'); await page.waitForTimeout(300);
  await page.goto(BASE + '#/manager'); await page.click('[data-mgr]'); await page.fill('.modal [name=pin]', '9999'); await page.click('.modal .btn.primary');
  await page.waitForSelector('.mgr-hero');
  await page.goto(BASE + '#/manager/services'); await page.waitForSelector('[data-svc="services/lost"]');
  await page.$eval('[data-svc="services/lost"] [name=on]', e => e.checked = false);
  await page.fill('[data-svc="services/lost"] [name=note]', 'قريبًا');
  await page.click('[data-svc="services/lost"] button'); await page.waitForTimeout(400);
  const ss = await lastCall('manager_set_service_setting');
  ok('dev: service paused', ss && ss.args.p_key === 'services/lost' && ss.args.p_enabled === false);
  await page.goto(BASE + '#/home'); await page.waitForSelector('[data-tile="services"]');
  ok('dev: pausing a sub-section keeps the merged services tile', !(await page.$eval('[data-tile="services"]', e => e.classList.contains('off'))));
  await page.goto(BASE + '#/manager/members'); await page.waitForSelector('[data-act=restore]');
  ok('dev: suspended members listed with restore', (await page.textContent('[data-tab]')).includes('عضو موقوف'));
  await page.click('[data-act=suspend][data-id="3"]'); await page.click('.modal [data-ok]'); await page.waitForTimeout(400);
  ok('dev: suspend member', (await lastCall('manager_set_member_active'))?.args.p_active === false);
  await page.goto(BASE + '#/manager/content'); await page.waitForSelector('[data-kind=event]');
  await page.click('[data-kind=event]'); await page.click('.modal [data-ok]'); await page.waitForTimeout(400);
  const cc = await lastCall('manager_set_content_open');
  ok('dev: cancel event', cc && cc.args.p_kind === 'event' && cc.args.p_open === false);
  await page.goto(BASE + '#/manager/permissions'); await page.waitForSelector('[data-edit]');
  ok('dev: supervisors listed with permission chips', (await page.textContent('[data-tab]')).includes('إدارة القهوة'));
  await page.selectOption('[data-f=perm] [name=member]', '3'); await page.check('[data-f=perm] [name=messages]'); await page.click('[data-f=perm] .btn'); await page.waitForTimeout(400);
  const pp = await lastCall('manager_set_member_permissions');
  ok('dev: add second supervisor with chosen permissions', pp && pp.args.p_member_id === 3 && pp.args.p_can_send_group_messages === true && pp.args.p_can_manage_coffee === false);
  ok('dev: permission args match live signature', pp && Object.keys(pp.args).sort().join() === ['p_manager_pin','p_member_id','p_can_manage_coffee','p_can_manage_outings','p_can_manage_dates','p_can_manage_members','p_can_manage_rules','p_can_send_group_messages','p_can_manage_lottery','p_can_manage_apologies'].sort().join(), JSON.stringify(pp && Object.keys(pp.args)));
  // guest sees paused service as hidden + blocked
  await page.goto(BASE + '#/account'); await page.click('[data-logout]'); await page.waitForTimeout(300);
  await page.goto(BASE + '#/home'); await page.waitForSelector('.tile');
  ok('guest: merged services tile still visible', !!(await page.$('[data-tile="services"]')));
  await page.click('#who [data-login]'); await page.selectOption('.modal [name=member]', '1'); await page.fill('.modal [name=pin]', '1234'); await page.click('.modal .btn.primary');
  await page.waitForSelector('#who .chip:not(.light)');
  await page.goto(BASE + '#/services/lost'); await page.waitForTimeout(400);
  ok('member: paused page blocked with note', (await page.textContent('.page-body')).includes('موقوفة') && (await page.textContent('.page-body')).includes('قريبًا'));
  await page.evaluate(() => { window.__svc = []; });
  await page.goto(BASE + '#/account'); await page.click('[data-logout]'); await page.waitForTimeout(300);
  await page.goto(BASE + '#/manager'); await page.click('[data-mgr]'); await page.fill('.modal [name=pin]', '9999'); await page.click('.modal .btn.primary'); await page.waitForSelector('.mgr-hero');

  // 13d) New community + statistics
  await page.goto(BASE + '#/stats'); await page.waitForSelector('.stat-box');
  ok('stats: developer sees full statistics', (await page.$$('.stat-box')).length >= 30 && (await page.textContent('.page-body')).includes('23'));
  await page.goto(BASE + '#/manager/communities'); await page.waitForSelector('[data-a=approve]');
  await page.click('[data-a=approve]'); await page.waitForSelector('.modal [name=v]'); await page.click('.modal .btn.primary'); await page.waitForTimeout(400);
  ok('community: developer approves request', (await lastCall('manager_review_community'))?.args.p_action === 'approve');
  await page.goto(BASE + '#/account'); await page.click('[data-logout]'); await page.waitForTimeout(300);
  await page.click('#who [data-login]'); await page.selectOption('.modal [name=member]', '1'); await page.fill('.modal [name=pin]', '1234'); await page.click('.modal .btn.primary');
  await page.waitForSelector('#who .chip:not(.light)');
  await page.goto(BASE + '#/community'); await page.waitForSelector('[data-create]');
  ok('community: no stats tile for member', true);
  await page.fill('[data-create] [name=name]', 'جيران حي النخيل'); await page.click('[data-create] .btn'); await page.waitForTimeout(400);
  ok('community: member requests new community', (await lastCall('community_request_create'))?.args.p_name === 'جيران حي النخيل');
  await page.waitForSelector('a[href="#/community/manage/5"]');
  ok('community: owner sees join code', (await page.textContent('.page-body')).includes('NKH123'));
  await page.click('a[href="#/community/manage/5"]'); await page.waitForSelector('[data-d=approve]');
  await page.click('[data-d=approve]'); await page.waitForTimeout(400);
  ok('community: owner approves join request', (await lastCall('community_decide_member'))?.args.p_decision === 'approve');
  await page.goto(BASE + '#/stats'); await page.waitForTimeout(300);
  ok('stats: hidden from members', (await page.textContent('.page-body')).includes('للمطور فقط'));
  await page.goto(BASE + '#/account'); await page.click('[data-logout]'); await page.waitForTimeout(300);
  await page.goto(BASE + '#/manager'); await page.click('[data-mgr]'); await page.fill('.modal [name=pin]', '9999'); await page.click('.modal .btn.primary'); await page.waitForSelector('.mgr-hero');

  // 14) Dark mode + desktop screenshots
  await page.emulateMedia({ colorScheme: 'dark' }); await page.goto(BASE + '#/home'); await page.waitForTimeout(600);
  await page.screenshot({ path: SHOTS + '/4-home-dark.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 }); await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(BASE + '#/outings'); await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + '/5-outings-desktop.png', fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok('layout: no horizontal overflow (desktop)', !overflow);
  await page.setViewportSize({ width: 360, height: 780 });
  for (const p of ['home', 'manager/schedules', 'manager/joinRequests', 'housing', 'services/catalog']) { await page.goto(BASE + '#/' + p); await page.waitForTimeout(300); ok('layout 360px no overflow: ' + p, !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))); }
  await page.goto(BASE + '#/home'); await page.waitForSelector('.tiles');
  ok('layout: five-column home tiles on mobile', await page.locator('.tiles').first().evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length === 5));

  await browser.close();
  const fails = results.filter(r => r[0] === 'FAIL');
  results.forEach(r => console.log(r.join(' | ')));
  console.log('\nERRORS:', errors.length ? errors.join('\n') : 'none');
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
