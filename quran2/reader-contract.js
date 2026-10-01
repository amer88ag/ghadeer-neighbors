/* Quran V2 content-provider contract. A verified provider must supply Uthmani text/page data. */
(function () {
  const provider = {
    id: null,
    edition: null,
    verified: false,
    getPage: async function () { throw new Error('Quran content provider is not configured'); },
    getSurah: async function () { throw new Error('Quran content provider is not configured'); },
    getAyah: async function () { throw new Error('Quran content provider is not configured'); }
  };
  window.GhadeerQuran2ContentProvider = provider;
})();
