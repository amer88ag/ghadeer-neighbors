(()=>{
  // Public browsing must not query the protected members table directly.
  // Use the existing SECURITY DEFINER RPC which returns only id/name/active.
  try{
    loadMembers = async function loadMembersPublicSafe(){
      if(!db){toast('تعذر تشغيل قاعدة البيانات. أعد تحميل الصفحة.',false);return;}
      const {data,error}=await db.from('public_members').select('id,name,active').order('id');
      if(error){toast('تعذر تحميل الجيران: '+error.message,false);return;}
      state.members=Array.isArray(data)?data:[];
      fillMemberSelects();
      renderMembers();
    };
  }catch(e){console.error('members public bridge failed',e);}

  // There is already one permanent reminder board on the home page.
  // Remove the legacy duplicate ticker whenever it is injected.
  function removeDuplicateDhikr(){document.getElementById('dhikrTicker')?.remove();}
  removeDuplicateDhikr();
  const dhikrObserver=new MutationObserver(removeDuplicateDhikr);
  dhikrObserver.observe(document.documentElement,{childList:true,subtree:true});
})();