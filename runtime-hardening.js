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
})();
