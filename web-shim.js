/* =============================================================================
 * web-shim.js  —  Electron биш үед (жишээ нь Vercel дээр browser-т) ажиллах
 *   localStorage ашиглан window.pixelAPI-г үүсгэнэ.
 *   Preload аль хэдийн window.pixelAPI тавьсан бол ЭНЭ ЮУ Ч ХИЙХГҮЙ.
 * ============================================================================= */

(function () {
  if (window.pixelAPI) return; // Electron дотор preload-оор аль хэдийн бэлэн

  const KEY = 'pixelie-state';

  window.pixelAPI = {
    isElectron: false,
    load: async () => {
      try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    save: async (state) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        return true;
      } catch (e) {
        return false;
      }
    },
    getPos: async () => [0, 0],
    setPos: () => {},
    hide: () => {},  // web дээр нуух/гарах байхгүй
    quit: () => {},
  };
})();
