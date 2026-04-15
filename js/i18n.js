/* ============================================
   PokeSwipe – i18n  (國際化 / Internationalization)
   支援語言：zh-TW / en / ja / es / pt
   ============================================ */

const I18n = (() => {
  const STORAGE_KEY = 'pokeswipe_lang';

  /* ──────────────────────────────────────────
     翻譯字典
  ────────────────────────────────────────── */
  const dict = {

    /* ════════ 繁體中文 ════════ */
    'zh-TW': {
      subtitle:           '滑一滑，交個寶可夢朋友',
      'tab.swipe':        '滑動加友',
      'tab.upload':       '上傳截圖',
      // stats 用 {total} {left} 作為佔位符，innerHTML 使用
      'stats':            '<strong>{total}</strong> 張・剩 <strong>{left}</strong> 張',
      'hint.skip':        '跳過',
      'hint.add':         '加友',
      'empty.title':      'EMPTY',
      'empty.sub':        '還沒有截圖<br>去「上傳截圖」分享你的好友碼吧！',
      'empty.done':       '你已看完所有好友碼！🎉<br>稍後再來看看新的',
      'kbd.skip':         '跳過',
      'kbd.add':          '加友',
      'upload.tip':       '截圖你的 Pokémon GO 好友頁面，讓其他玩家能看到你的好友碼。不需要註冊！',
      'upload.dropTitle': '點擊或拖曳上傳',
      'upload.dropDesc':  'Pokémon GO 好友碼截圖<br>支援 JPG / PNG / HEIC・最大 15MB',
      'upload.idle':      '選擇截圖後上傳',
      'upload.uploading': '上傳中…',
      'upload.ready':     '上傳截圖 🚀',
      'upload.retry':     '重試上傳',
      'card.badge':       'PokéGO',
      'lightbox.caption': '<strong>記下好友碼後</strong>，打開 Pokémon GO → 好友 → 新增好友 🎮',
      'lightbox.close':   '關閉',
      'toast.swipeRight': '已記下！✅ 打開遊戲加好友吧',
      'toast.uploaded':   '上傳成功！好友碼已分享給所有人 ✨',
      'toast.local':      '已儲存（本機模式）— 設定 Cloudinary 後可跨裝置分享',
      'toast.err.type':   '請選擇圖片檔案！',
      'toast.err.size':   '檔案太大，請小於 15MB',
      'toast.err.upload': '上傳失敗',
      'config.notice':    '⚙️ 請打開 <code>js/cloudinary.js</code> 填入 <strong>CLOUD_NAME</strong> 和 <strong>UPLOAD_PRESET</strong>，才能讓所有人共用同一張圖庫。目前為本機模式（僅你的瀏覽器可見）。',
      'aria.skip':        '跳過（← 鍵）',
      'aria.add':         '加好友（→ 鍵）',
      'ad.label':         '廣告',
      'ad.sponsor':       '贊助',
      'time.justNow':     '剛剛',
      'time.min':         '{n} 分鐘前',
      'time.hr':          '{n} 小時前',
      'time.day':         '{n} 天前',
      'time.week':        '{n} 週前',
    },

    /* ════════ English ════════ */
    'en': {
      subtitle:           'Swipe to find Pokémon GO friends',
      'tab.swipe':        'Swipe Friends',
      'tab.upload':       'Upload',
      'stats':            '<strong>{total}</strong> cards・<strong>{left}</strong> left',
      'hint.skip':        'Skip',
      'hint.add':         'Add',
      'empty.title':      'EMPTY',
      'empty.sub':        'No screenshots yet<br>Upload your friend code to get started!',
      'empty.done':       "You've seen them all! 🎉<br>Check back later for new ones",
      'kbd.skip':         'Skip',
      'kbd.add':          'Add',
      'upload.tip':       'Screenshot your Pokémon GO friend page so other players can find your code. No sign-up needed!',
      'upload.dropTitle': 'Click or drag to upload',
      'upload.dropDesc':  'Pokémon GO friend code screenshot<br>JPG / PNG / HEIC・Max 15MB',
      'upload.idle':      'Select a screenshot to upload',
      'upload.uploading': 'Uploading…',
      'upload.ready':     'Upload Screenshot 🚀',
      'upload.retry':     'Retry Upload',
      'card.badge':       'PokéGO',
      'lightbox.caption': '<strong>Note the friend code</strong>, then open Pokémon GO → Friends → Add Friend 🎮',
      'lightbox.close':   'Close',
      'toast.swipeRight': 'Noted! ✅ Open the game to add them',
      'toast.uploaded':   'Uploaded! Your friend code is now visible to everyone ✨',
      'toast.local':      'Saved (local mode) — Set up Cloudinary to share with everyone',
      'toast.err.type':   'Please select an image file!',
      'toast.err.size':   'File too large, max 15MB',
      'toast.err.upload': 'Upload failed',
      'config.notice':    '⚙️ Open <code>js/cloudinary.js</code> and fill in <strong>CLOUD_NAME</strong> and <strong>UPLOAD_PRESET</strong> to share images with everyone. Currently in local mode (your browser only).',
      'aria.skip':        'Skip (← key)',
      'aria.add':         'Add friend (→ key)',
      'ad.label':         'Ad',
      'ad.sponsor':       'Sponsored',
      'time.justNow':     'just now',
      'time.min':         '{n} min ago',
      'time.hr':          '{n} hr ago',
      'time.day':         '{n} d ago',
      'time.week':        '{n} w ago',
    },

    /* ════════ 日本語 ════════ */
    'ja': {
      subtitle:           'スワイプしてポケモンGOの友達を増やそう',
      'tab.swipe':        'スワイプ',
      'tab.upload':       'スクショ投稿',
      'stats':            '全<strong>{total}</strong>枚・残り<strong>{left}</strong>枚',
      'hint.skip':        'スキップ',
      'hint.add':         '追加',
      'empty.title':      'EMPTY',
      'empty.sub':        'まだ投稿がありません<br>フレンドコードのスクショを投稿しよう！',
      'empty.done':       '全部見たよ！🎉<br>あとで新しい投稿をチェックしてね',
      'kbd.skip':         'スキップ',
      'kbd.add':          '追加',
      'upload.tip':       'ポケモンGOのフレンド画面をスクリーンショットして投稿しよう。登録不要！',
      'upload.dropTitle': 'クリックまたはドラッグして投稿',
      'upload.dropDesc':  'ポケモンGO フレンドコードのスクショ<br>JPG / PNG / HEIC・最大 15MB',
      'upload.idle':      'スクショを選んで投稿',
      'upload.uploading': '投稿中…',
      'upload.ready':     '投稿する 🚀',
      'upload.retry':     '再投稿',
      'card.badge':       'PokéGO',
      'lightbox.caption': '<strong>フレンドコードをメモして</strong>、ポケモンGO → フレンド → フレンドを追加 🎮',
      'lightbox.close':   '閉じる',
      'toast.swipeRight': 'メモしました！✅ ゲームを開いてフレンド申請しよう',
      'toast.uploaded':   '投稿完了！フレンドコードが公開されました ✨',
      'toast.local':      '保存しました（ローカルモード）',
      'toast.err.type':   '画像ファイルを選択してください！',
      'toast.err.size':   'ファイルが大きすぎます（最大 15MB）',
      'toast.err.upload': '投稿に失敗しました',
      'config.notice':    '⚙️ <code>js/cloudinary.js</code> を開いて <strong>CLOUD_NAME</strong> と <strong>UPLOAD_PRESET</strong> を設定してください。現在はローカルモードです（このブラウザのみ）。',
      'aria.skip':        'スキップ（← キー）',
      'aria.add':         'フレンド追加（→ キー）',
      'ad.label':         '広告',
      'ad.sponsor':       'スポンサー',
      'time.justNow':     'たった今',
      'time.min':         '{n} 分前',
      'time.hr':          '{n} 時間前',
      'time.day':         '{n} 日前',
      'time.week':        '{n} 週前',
    },

    /* ════════ Español ════════ */
    'es': {
      subtitle:           'Desliza para encontrar amigos en Pokémon GO',
      'tab.swipe':        'Deslizar',
      'tab.upload':       'Subir captura',
      'stats':            '<strong>{total}</strong> cartas・quedan <strong>{left}</strong>',
      'hint.skip':        'Saltar',
      'hint.add':         'Agregar',
      'empty.title':      'VACÍO',
      'empty.sub':        'No hay capturas aún<br>¡Sube tu código de amigo para empezar!',
      'empty.done':       '¡Ya los viste todos! 🎉<br>Vuelve más tarde para ver nuevos',
      'kbd.skip':         'Saltar',
      'kbd.add':          'Agregar',
      'upload.tip':       'Toma una captura de tu pantalla de amigos en Pokémon GO para que otros jugadores puedan encontrarte. ¡Sin registro!',
      'upload.dropTitle': 'Haz clic o arrastra para subir',
      'upload.dropDesc':  'Captura del código de amigo de Pokémon GO<br>JPG / PNG / HEIC・Máx 15MB',
      'upload.idle':      'Selecciona una captura para subir',
      'upload.uploading': 'Subiendo…',
      'upload.ready':     'Subir captura 🚀',
      'upload.retry':     'Reintentar',
      'card.badge':       'PokéGO',
      'lightbox.caption': '<strong>Anota el código de amigo</strong> y abre Pokémon GO → Amigos → Agregar amigo 🎮',
      'lightbox.close':   'Cerrar',
      'toast.swipeRight': '¡Anotado! ✅ Abre el juego para agregar al amigo',
      'toast.uploaded':   '¡Subido! Tu código de amigo ya es visible ✨',
      'toast.local':      'Guardado (modo local)',
      'toast.err.type':   '¡Por favor selecciona una imagen!',
      'toast.err.size':   'Archivo demasiado grande, máx 15MB',
      'toast.err.upload': 'Error al subir',
      'config.notice':    '⚙️ Abre <code>js/cloudinary.js</code> y completa <strong>CLOUD_NAME</strong> y <strong>UPLOAD_PRESET</strong> para compartir con todos. Modo local activo (solo este navegador).',
      'aria.skip':        'Saltar (tecla ←)',
      'aria.add':         'Agregar amigo (tecla →)',
      'ad.label':         'Anuncio',
      'ad.sponsor':       'Patrocinado',
      'time.justNow':     'ahora',
      'time.min':         'hace {n} min',
      'time.hr':          'hace {n} h',
      'time.day':         'hace {n} d',
      'time.week':        'hace {n} sem',
    },

    /* ════════ Português ════════ */
    'pt': {
      subtitle:           'Deslize para encontrar amigos no Pokémon GO',
      'tab.swipe':        'Deslizar',
      'tab.upload':       'Enviar print',
      'stats':            '<strong>{total}</strong> cartas・restam <strong>{left}</strong>',
      'hint.skip':        'Pular',
      'hint.add':         'Adicionar',
      'empty.title':      'VAZIO',
      'empty.sub':        'Nenhuma captura ainda<br>Envie seu código de amigo para começar!',
      'empty.done':       'Você viu todos! 🎉<br>Volte mais tarde para ver novos',
      'kbd.skip':         'Pular',
      'kbd.add':          'Adicionar',
      'upload.tip':       'Tire um print da sua tela de amigos no Pokémon GO para que outros jogadores possam te encontrar. Sem cadastro!',
      'upload.dropTitle': 'Clique ou arraste para enviar',
      'upload.dropDesc':  'Print do código de amigo do Pokémon GO<br>JPG / PNG / HEIC・Máx 15MB',
      'upload.idle':      'Selecione um print para enviar',
      'upload.uploading': 'Enviando…',
      'upload.ready':     'Enviar print 🚀',
      'upload.retry':     'Tentar novamente',
      'card.badge':       'PokéGO',
      'lightbox.caption': '<strong>Anote o código de amigo</strong> e abra o Pokémon GO → Amigos → Adicionar amigo 🎮',
      'lightbox.close':   'Fechar',
      'toast.swipeRight': 'Anotado! ✅ Abra o jogo para adicionar o amigo',
      'toast.uploaded':   'Enviado! Seu código de amigo está visível para todos ✨',
      'toast.local':      'Salvo (modo local)',
      'toast.err.type':   'Por favor selecione uma imagem!',
      'toast.err.size':   'Arquivo muito grande, máx 15MB',
      'toast.err.upload': 'Falha no envio',
      'config.notice':    '⚙️ Abra <code>js/cloudinary.js</code> e preencha <strong>CLOUD_NAME</strong> e <strong>UPLOAD_PRESET</strong> para compartilhar com todos. Modo local ativo (apenas este navegador).',
      'aria.skip':        'Pular (tecla ←)',
      'aria.add':         'Adicionar amigo (tecla →)',
      'ad.label':         'Anúncio',
      'ad.sponsor':       'Patrocinado',
      'time.justNow':     'agora',
      'time.min':         'há {n} min',
      'time.hr':          'há {n} h',
      'time.day':         'há {n} d',
      'time.week':        'há {n} sem',
    },
  };

  const SUPPORTED = ['zh-TW', 'en', 'ja', 'es', 'pt'];
  let currentLang = 'zh-TW';

  /* ──────────────────────────────────────────
     Translation function
  ────────────────────────────────────────── */
  function t(key, vars) {
    const strings = dict[currentLang] || dict['zh-TW'];
    let str = strings[key] ?? dict['zh-TW'][key] ?? key;
    if (vars) {
      str = str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
    }
    return str;
  }

  /* ──────────────────────────────────────────
     Detect best language from browser / storage
  ────────────────────────────────────────── */
  function detect() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;

    const nav = (navigator.language || navigator.userLanguage || 'zh-TW').toLowerCase();
    if (nav.startsWith('zh')) return 'zh-TW';
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('pt')) return 'pt';
    if (nav.startsWith('en')) return 'en';
    return 'zh-TW';
  }

  /* ──────────────────────────────────────────
     Apply language to DOM
  ────────────────────────────────────────── */
  function apply(lang) {
    if (!SUPPORTED.includes(lang)) lang = 'zh-TW';
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    // HTML lang attribute
    document.documentElement.lang = lang;

    // data-i18n → textContent
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });

    // data-i18n-html → innerHTML
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.dataset.i18nHtml;
      el.innerHTML = t(key);
    });

    // data-i18n-aria → aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.dataset.i18nAria;
      el.setAttribute('aria-label', t(key));
    });

    // data-i18n-placeholder → placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      el.setAttribute('placeholder', t(key));
    });

    // Highlight active lang button
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Notify app.js to refresh dynamic strings
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  /* ──────────────────────────────────────────
     Wire up switcher buttons (called after DOM ready)
  ────────────────────────────────────────── */
  function initSwitcher() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => apply(btn.dataset.lang));
    });
  }

  /* ──────────────────────────────────────────
     Bootstrap
  ────────────────────────────────────────── */
  function init() {
    initSwitcher();
    apply(detect());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { t, apply, current: () => currentLang, supported: SUPPORTED };
})();

/* 全域快捷方式 */
function t(key, vars) { return I18n.t(key, vars); }
