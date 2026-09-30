/* Ghadeer runtime hardening — safe public member reads without exposing private member columns. */
(()=>{
  'use strict';
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    try{
      const method=String(init?.method || input?.method || 'GET').toUpperCase();
      const rawUrl=typeof input==='string' ? input : input?.url;
      if(method==='GET' && rawUrl){
        const u=new URL(rawUrl,window.location.href);
        if(/\/rest\/v1\/members$/.test(u.pathname)){
          u.pathname=u.pathname.replace(/\/members$/,'/public_members');
          return nativeFetch(u.toString(),init);
        }
      }
    }catch(_e){
      // Never block the application because the hardening layer itself failed.
    }
    return nativeFetch(input,init);
  };
  // Load the UI layer from the same repository artifact so Vercel and Cloudflare
  // receive the identical interface without duplicating script tags in index.html.
  function loadUiV3(){
    if(document.querySelector('script[data-ghadeer-ui-v3]'))return;
    const s=document.createElement('script');
    s.src='/ghadeer-ui-v3.js?v=20260930.1';
    s.defer=true;
    s.dataset.ghadeerUiV3='1';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadUiV3,{once:true});
  else loadUiV3();
})();
