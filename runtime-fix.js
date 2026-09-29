(()=>{
  'use strict';
  function safe(fn){try{return fn()}catch(e){console.error('[ghadeer runtime]',e);return null}}
  function bind(){
    safe(()=>{
      const p=window.loadPrayerByMemberLocation;
      ['homePrayerBtn','prayerRefreshBtn'].forEach(id=>{
        const b=document.getElementById(id);
        if(b&&typeof p==='function'&&!b.dataset.runtimeBound){
          b.dataset.runtimeBound='1';
          b.addEventListener('click',p);
        }
      });
      const w=document.getElementById('homeWeatherBtn');
      if(w&&!w.dataset.runtimeBound){
        w.dataset.runtimeBound='1';
        w.addEventListener('click',()=>{
          const box=document.getElementById('ghWeatherBox');
          if(box&&typeof box.onclick==='function')box.onclick();
        });
      }
      document.querySelectorAll('[data-page]').forEach(b=>{
        if(!b.dataset.runtimeBound){
          b.dataset.runtimeBound='1';
          b.addEventListener('click',()=>{const page=b.dataset.page;if(typeof window.openPage==='function')window.openPage(page);});
        }
      });
      document.querySelectorAll('[data-action]').forEach(b=>{
        if(!b.dataset.runtimeBound){
          b.dataset.runtimeBound='1';
          b.addEventListener('click',()=>{const fn=b.dataset.action;if(typeof window[fn]==='function')window[fn]();});
        }
      });
    });
  }
  function fixMembersLoader(){
    safe(()=>{
      if(typeof window.loadMembers!=='function' || typeof window.table!=='function') return false;
      if(window.__ghadeerSafeMembersLoader) return true;
      const safeLoadMembers=async function(){
        if(!window.db){
          if(typeof window.toast==='function')window.toast('تعذر تشغيل قاعدة البيانات. أعد تحميل الصفحة.',false);
          return;
        }
        const q=window.db.from('members').select('id,name,active,created_at,last_seen_at').order('id');
        const {data,error}=await q;
        if(error){
          if(typeof window.toast==='function')window.toast('تعذر تحميل الجيران: '+error.message,false);
          return;
        }
        window.state.members=data||[];
        if(typeof window.fillMemberSelects==='function')window.fillMemberSelects();
        if(typeof window.renderMembers==='function')window.renderMembers();
      };
      window.loadMembers=safeLoadMembers;
      window.__ghadeerSafeMembersLoader=true;
      return safeLoadMembers();
    });
    return true;
  }
  function observe(){
    bind();
    fixMembersLoader();
    setTimeout(fixMembersLoader,0);
    setTimeout(fixMembersLoader,100);
    setTimeout(fixMembersLoader,500);
    const root=document.getElementById('app')||document.body;
    new MutationObserver(()=>{bind();fixMembersLoader()}).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();