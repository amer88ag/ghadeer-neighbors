/* Ghadeer click compatibility v1.1 — compatibility API only; no global click interception. */
(()=>{'use strict';
const map={realEstate:'realEstate',messages:'messages',announcements:'messages',jobs:'jobs',neighborhoodEvents:'neighborhoodEvents',news:'news',neighborCheck:'neighborCheck',lost:'lost',coffee:'coffee',outings:'outings',members:'members',manager:'manager',developer:'developer',settings:'settings',aboutProject:'aboutProject'};
function go(key){
 if(key==='home')return window.GhadeerUIv5?.home?.();
 if(key==='services'||key==='services:help'||key==='services:market')return window.GhadeerUIv5?.services?.();
 if(key==='football'||['spl','uel','world','king','super','ghadeer'].includes(key))return window.GhadeerFootballV1?.render?.(key==='football'?'spl':key);
 if(key==='wardi'||['read','recite','tajweed','tafsir','adhkar','hifz','marks','download'].includes(key))return window.GhadeerUIv5?.wardi?.();
 if(key==='more')return window.GhadeerUIv5?.more?.()||window.openPage?.('more');
 if(key==='logout')return window.logout?.()||window.signOut?.();
 if(map[key])return window.openPage?.(map[key]);
 return window.openPage?.(key);
}
/* Deliberately no document-level click listener: ghadeer-ui-v5 owns data-gh5 events. */
window.GhadeerClickFix={go};
})();
