(()=>{
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-gh-target="__developer"]');
    if(b) document.getElementById('developerAccessBtn')?.click();
  });
})();
