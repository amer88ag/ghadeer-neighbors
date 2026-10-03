/* Ghadeer final UI integrity pass. Visual cleanup only; canonical router owns clicks. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const QURAN='\u0642\u0631\u0622\u0646';
function injectStyle(){if($('ghFinalUiStyle'))return;const s=document.createElement('style');s.id='ghFinalUiStyle';s.textContent='.gh-prayer-compact{padding:10px;margin-bottom:10px}.gh-prayer-main-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;margin-top:5px!important}.gh-prayer-main-grid>div{padding:5px 3px;background:#f4faf6;border:1px solid #dcebe1;border-radius:9px;text-align:center;font-size:11px;line-height:1.35}.gh-prayer-main-grid b{font-size:15px}';document.head.appendChild(s)}
function removeDuplicateDhikr(){document.querySelectorAll('#dhikrTicker,.dhikr-ticker').forEach(el=>el.remove());$('dhikrTickerStyles')?.remove()}
function compactPrayer(){const extra=$('ghPrayerExtra');if(extra)extra.remove();const cards=[...document.querySelectorAll('.card')].filter(card=>{const title=card.querySelector('h3');return title&&String(title.textContent||'').includes('\u0645\u0648\u0627\u0642\u064a\u062a \u0627\u0644\u0635\u0644\u0627\u0629')});if(cards.length>1)cards.slice(1).forEach(card=>card.remove());const card=$('prayerTimesToday')?.closest('.card');if(!card)return;card.classList.add('gh-prayer-compact');$('prayerTimesToday')?.classList.add('gh-prayer-main-grid')}
function normalizeLabels(){document.querySelectorAll('.lh5-label,.gh-launch-item strong').forEach(el=>{if(el.textContent.trim()==='\u0648\u0631\u062f\u064a')el.textContent=QURAN});document.querySelectorAll('[data-service="wardi"]').forEach(el=>{el.setAttribute('aria-label',QURAN);const icon=el.querySelector('.lh5-icon');if(icon)icon.textContent='\uD83D\uDCD6'});document.querySelectorAll('.gh-launch-item[data-id="quran"] .gh-launch-icon').forEach(el=>el.textContent='\uD83D\uDCD6')}
function recoverBlankHome(){const app=$('app');if(!app)return;const pages=[...app.querySelectorAll('.page')];if(pages.length&&pages.every(p=>!p.classList.contains('active'))){const home=$('home');if(home){pages.forEach(p=>p.classList.remove('active'));home.classList.add('active')}}}
function run(){injectStyle();removeDuplicateDhikr();compactPrayer();normalizeLabels();recoverBlankHome()}
function boot(){run();[250,1000,2500,5000,8000].forEach(ms=>setTimeout(run,ms));const root=document.getElementById('app')||document.body;new MutationObserver(()=>run()).observe(root,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
