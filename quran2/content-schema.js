/* Quran V2 content schema. Provider data must pass structural validation before display. */
(function () {
  function validateSurah(surah) {
    return !!surah && Number.isInteger(surah.number) && surah.number >= 1 && surah.number <= 114 &&
      typeof surah.name === 'string' && Array.isArray(surah.ayahs);
  }
  function validateCollection(collection) {
    if (!Array.isArray(collection) || collection.length !== 114) return false;
    return collection.every(validateSurah) && collection.every((s, i) => s.number === i + 1);
  }
  window.GhadeerQuran2ContentSchema = Object.freeze({ validateSurah, validateCollection });
})();
