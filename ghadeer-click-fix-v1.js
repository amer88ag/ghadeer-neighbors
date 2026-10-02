/* Ghadeer click fix v1 — final delegated router, loaded after all legacy UI layers. */
(()=>{'use strict';
const map={realEstate:'realEstate',messages:'messages',announcements:'messages',jobs:'jobs',neighborhoodEvents:'neighborhoodEvents',news:'news',neighborCheck:'neighborCheck',lost:'lost',coffee:'coffee',outings:'outings',members:'members',manager:'manager',developer:'developer',settings:'settings',aboutProject:'aboutProject'};
function go(key){
 if(key==='home') return window.GhadeerUIv5?.home?.();
 if(key==='services'||key==='services:help'||key==='services:market') return window.GhadeerUIv5?.services?.();
 if(key==='football'||['spl','uel','world','king','super','ghadeer'].includes(key)) return window.GhadeerFootballV1?.render?.(key==='football'?'spl':key);
 if(key==='wardi'||['read','recite','tajweed','tafsir','adhkar','hifz','marks','download'].includes(key)) { window.GhadeerUIv5?.wardi?.(); setTimeout(()=>{const ids={tajweed:'ghq5Taj',tafsir:'ghq5Taf',adhkar:'ghq5Dh',hifz:'ghq5Hifz',marks:'ghq5Marks',download:'ghq5Download'};const b=document.getElementById(ids[key]);if(b)b.click()},250); return; }
 if(key==='more') return window.openPage?.('more')||window.GhadeerUIv5?.install?.();
 if(key==='logout') return window.logout?.()||window.signOut?.();
 if(map[key]) return window.openPage?.(map[key]);
 return window.openPage?.(key);
}
function bind(){document.addEventListener('click',e=>{const b=e.target.closest?.('[data-gh5]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();go(b.dataset.gh5)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();window.GhadeerClickFix={go};
})();
