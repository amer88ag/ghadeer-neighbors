/* Ghadeer runtime hardening — safe public member reads + canonical UI assets. */
(()=>{'use strict';
const nativeFetch=window.fetch.bind(window);window.fetch=async function(input,init){try{const method=String(init?.method||input?.method||'GET').toUpperCase();const rawUrl=typeof input==='string'?input:input?.url;if(method==='GET'&&rawUrl){const u=new URL(rawUrl,window.location.href);if(/\/rest\/v1\/members$/.test(u.pathname)){u.pathname=u.pathname.replace(/\/members$/,'/public_members');return nativeFetch(u.toString(),init)}}}catch(_){}return nativeFetch(input,init)};
function load(src,attr){
  const canonical=src.split('?')[0];
  if(document.querySelector(`script[${attr}]`)||[...document.scripts].some(s=>s.src.split('?')[0]===new URL(canonical,location.href).href))return;
  const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(attr,'1');document.head.appendChild(s)
}
function assets(){
  load('/ghadeer-ui-v5.js?v=20260930.3','data-ghadeer-ui-v5');
  load('/ghadeer-quran-v5.js?v=20260930.3','data-ghadeer-quran-v5');
  load('/ghadeer-football-v1.js?v=20260930.3','data-ghadeer-football-v1');
  load('/ghadeer-football-bridge.js?v=20260930.3','data-ghadeer-football-bridge');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',assets,{once:true});else assets();
})();
