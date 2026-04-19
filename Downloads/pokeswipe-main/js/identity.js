/* ============================================
   PokeSwipe – Anonymous Identity
   ============================================
   自動給每個瀏覽器一個持久匿名 ID（Trainer ID）。
   不需要登入，不收集個人資料。
   格式：pks_<timestamp36><random8>  ≈ 14 chars
   ============================================ */

const Identity = (() => {
  const STORAGE_KEY = 'pokeswipe_uid';

  function generate() {
    const ts  = Date.now().toString(36);           // ~8 chars
    const rnd = Math.random().toString(36).slice(2, 10); // 8 chars
    return 'pks_' + ts + rnd;
  }

  function get() {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 8) {
      id = generate();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  /** 顯示縮短版給 UI 用（後 6 碼，大寫） */
  function short() {
    return get().slice(-6).toUpperCase();
  }

  return { get, short };
})();
