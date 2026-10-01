/* Quran V2 reader view contract. Rendering is intentionally provider-driven. */
(function () {
  function render(container, page) {
    if (!container) return;
    container.replaceChildren();
    const status = document.createElement('div');
    status.className = 'quran2-reader__page';
    status.setAttribute('role', 'document');
    status.textContent = page && page.text ? page.text : 'لا تتوفر صفحة المصحف حاليًا.';
    container.appendChild(status);
  }
  window.GhadeerQuran2ReaderView = Object.freeze({ render });
})();
