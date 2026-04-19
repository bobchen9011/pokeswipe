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
      'hint.tap':         '點擊查看',
      'hint.next':        '滑動下一個',
      'hint.skip':        '跳過',
      'hint.add':         '加友',
      'empty.title':      'EMPTY',
      'empty.sub':        '還沒有截圖<br>去「上傳截圖」分享你的好友碼吧！',
      'empty.done':       '你已看完所有好友碼！🎉<br>稍後再來看看新的',
      'kbd.next':         '下一個',
      'kbd.view':         '查看 QR',
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
      'aria.view':        '查看好友碼 QR',
      'aria.next':        '下一個',
      'aria.skip':        '跳過（← 鍵）',
      'aria.add':         '加好友（→ 鍵）',
      'ad.label':         '廣告',
      'ad.sponsor':       '贊助',
      'quota.ok':         '今日剩餘上傳次數：{left} / {total}',
      'quota.empty':      '今日上傳次數已用完，明天再來 🌙',
      'quota.btn.limit':  '今日已達上限',
      'refresh.btn':      '重新整理看新截圖',
      'refresh.cooldown': '{mins}:{secs} 後可重新整理',
      'refresh.ready':    '看看有沒有新的好友碼 👀',
      'verify.scanning':     '辨識截圖中，請稍候…',
      'verify.notFound':     '找不到好友碼，請上傳 Pokémon GO 訓練家代碼頁面截圖 📸',
      'verify.duplicate':    '此好友碼已上傳過，謝謝分享 ♻️',
      'verify.wrongFormat':  '請上傳直向的 Pokémon GO 截圖 📱',
      'myUploads.title':     '我的上傳',
      'delete.btn':          '刪除',
      'delete.confirm':      '確認?',
      'delete.done':         '已隱藏 ✓',
      'help.title':          '怎麼使用 PokeSwipe？',
      'help.close':          '知道了',
      'help.s1.title':       '滑動加友',
      'help.s1.body':        '瀏覽其他玩家分享的好友碼截圖。點擊圖片放大查看好友碼，點「下一個」跳到下一張。<br>記下好友碼後，打開 Pokémon GO → 好友 → 新增好友。',
      'help.s2.title':       '上傳截圖',
      'help.s2.body':        '打開 Pokémon GO，點頭像進入訓練家名片頁面（有 QR Code 的頁面），直向截圖後回來上傳，就能讓其他玩家看到你的好友碼。',
      'help.s3.title':       '完全免費，不需要帳號',
      'help.s3.body':        '只使用匿名裝置 ID，不收集任何個人資料。每天最多上傳 5 張。',
    },

    /* ════════ English ════════ */
    'en': {
      subtitle:           'Swipe to find Pokémon GO friends',
      'tab.swipe':        'Swipe Friends',
      'tab.upload':       'Upload',
      'stats':            '<strong>{total}</strong> cards・<strong>{left}</strong> left',
      'hint.tap':         'Tap to view',
      'hint.next':        'Swipe for next',
      'hint.skip':        'Skip',
      'hint.add':         'Add',
      'empty.title':      'EMPTY',
      'empty.sub':        'No screenshots yet<br>Upload your friend code to get started!',
      'empty.done':       "You've seen them all! 🎉<br>Check back later for new ones",
      'kbd.next':         'Next',
      'kbd.view':         'View QR',
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
      'aria.view':        'View friend code QR',
      'aria.next':        'Next',
      'aria.skip':        'Skip (← key)',
      'aria.add':         'Add friend (→ key)',
      'ad.label':         'Ad',
      'ad.sponsor':       'Sponsored',
      'quota.ok':         'Uploads left today: {left} / {total}',
      'quota.empty':      'Daily upload limit reached. Come back tomorrow 🌙',
      'quota.btn.limit':  'Daily limit reached',
      'refresh.btn':      'Refresh for new screenshots',
      'refresh.cooldown': 'Refresh available in {mins}:{secs}',
      'refresh.ready':    'Check for new friend codes 👀',
      'verify.scanning':     'Scanning image, please wait…',
      'verify.notFound':     'No friend code found. Upload your Pokémon GO Trainer Code screen 📸',
      'verify.duplicate':    'This friend code is already uploaded. Thanks! ♻️',
      'verify.wrongFormat':  'Please upload a portrait Pokémon GO screenshot 📱',
      'myUploads.title':     'My Uploads',
      'delete.btn':          'Delete',
      'delete.confirm':      'Confirm?',
      'delete.done':         'Hidden ✓',
      'help.title':          'How to use PokeSwipe?',
      'help.close':          'Got it',
      'help.s1.title':       'Swipe Friends',
      'help.s1.body':        'Browse friend code screenshots shared by other players. Tap a card to zoom in and read the code, tap Next to move on.<br>Then open Pokémon GO → Friends → Add Friend.',
      'help.s2.title':       'Upload a Screenshot',
      'help.s2.body':        'Open Pokémon GO and go to your Trainer Card (the screen showing your QR Code). Take a portrait screenshot and upload it here so other players can find you.',
      'help.s3.title':       'Free — No Account Required',
      'help.s3.body':        'Only an anonymous device ID is used — no personal data collected. Maximum 5 uploads per day.',
    },

    /* ════════ 日本語 ════════ */
    'ja': {
      subtitle:           'スワイプしてポケモンGOの友達を増やそう',
      'tab.swipe':        'スワイプ',
      'tab.upload':       'スクショ投稿',
      'stats':            '全<strong>{total}</strong>枚・残り<strong>{left}</strong>枚',
      'hint.tap':         'タップして確認',
      'hint.next':        'スワイプして次へ',
      'hint.skip':        'スキップ',
      'hint.add':         '追加',
      'empty.title':      'EMPTY',
      'empty.sub':        'まだ投稿がありません<br>フレンドコードのスクショを投稿しよう！',
      'empty.done':       '全部見たよ！🎉<br>あとで新しい投稿をチェックしてね',
      'kbd.next':         '次へ',
      'kbd.view':         'QR確認',
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
      'aria.view':        'フレンドコードQRを確認',
      'aria.next':        '次へ',
      'aria.skip':        'スキップ（← キー）',
      'aria.add':         'フレンド追加（→ キー）',
      'ad.label':         '広告',
      'ad.sponsor':       'スポンサー',
      'quota.ok':         '今日の残り投稿回数：{left} / {total}',
      'quota.empty':      '本日の投稿上限に達しました。明日またどうぞ 🌙',
      'quota.btn.limit':  '本日の上限に達しました',
      'refresh.btn':      '新しいスクショを確認する',
      'refresh.cooldown': '{mins}:{secs} 後に更新可能',
      'refresh.ready':    '新しいフレンドコードを見る 👀',
      'verify.scanning':     '画像を解析中、少々お待ちください…',
      'verify.notFound':     'フレンドコードが見つかりません。トレーナーコード画面のスクショを投稿してください 📸',
      'verify.duplicate':    'このフレンドコードはすでに投稿済みです ♻️',
      'verify.wrongFormat':  '縦向きのポケモンGOスクショを投稿してください 📱',
      'myUploads.title':     '自分の投稿',
      'delete.btn':          '削除',
      'delete.confirm':      '確認?',
      'delete.done':         '非表示にしました ✓',
      'help.title':          'PokeSwipeの使い方',
      'help.close':          'わかった',
      'help.s1.title':       'スワイプしてフレンド追加',
      'help.s1.body':        '他のプレイヤーが共有したフレンドコードを見てみよう。カードをタップするとコードを拡大確認でき、「次へ」で次のカードへ進めます。<br>コードをメモして、ポケモンGO → フレンド → フレンドを追加。',
      'help.s2.title':       'スクショを投稿する',
      'help.s2.body':        'ポケモンGOを開き、アイコンからトレーナーカード画面（QRコードが表示される画面）へ進んで縦向きでスクリーンショット。ここに戻って投稿すると他のプレイヤーに公開されます。',
      'help.s3.title':       '無料・登録不要',
      'help.s3.body':        '匿名のデバイスIDのみ使用。個人情報は収集しません。1日最大5枚まで投稿できます。',
    },

    /* ════════ Español ════════ */
    'es': {
      subtitle:           'Desliza para encontrar amigos en Pokémon GO',
      'tab.swipe':        'Deslizar',
      'tab.upload':       'Subir captura',
      'stats':            '<strong>{total}</strong> cartas・quedan <strong>{left}</strong>',
      'hint.tap':         'Toca para ver',
      'hint.next':        'Desliza al siguiente',
      'hint.skip':        'Saltar',
      'hint.add':         'Agregar',
      'empty.title':      'VACÍO',
      'empty.sub':        'No hay capturas aún<br>¡Sube tu código de amigo para empezar!',
      'empty.done':       '¡Ya los viste todos! 🎉<br>Vuelve más tarde para ver nuevos',
      'kbd.next':         'Siguiente',
      'kbd.view':         'Ver QR',
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
      'aria.view':        'Ver código QR de amigo',
      'aria.next':        'Siguiente',
      'aria.skip':        'Saltar (tecla ←)',
      'aria.add':         'Agregar amigo (tecla →)',
      'ad.label':         'Anuncio',
      'ad.sponsor':       'Patrocinado',
      'quota.ok':         'Subidas restantes hoy: {left} / {total}',
      'quota.empty':      'Límite diario alcanzado. Vuelve mañana 🌙',
      'quota.btn.limit':  'Límite diario alcanzado',
      'refresh.btn':      'Actualizar para ver nuevas capturas',
      'refresh.cooldown': 'Disponible en {mins}:{secs}',
      'refresh.ready':    'Ver nuevos códigos de amigo 👀',
      'verify.scanning':     'Escaneando imagen, por favor espera…',
      'verify.notFound':     'No se encontró código. Sube la pantalla de código de entrenador de Pokémon GO 📸',
      'verify.duplicate':    'Este código de amigo ya fue subido. ¡Gracias! ♻️',
      'verify.wrongFormat':  'Por favor sube una captura vertical de Pokémon GO 📱',
      'myUploads.title':     'Mis capturas',
      'delete.btn':          'Eliminar',
      'delete.confirm':      '¿Confirmar?',
      'delete.done':         'Ocultado ✓',
      'help.title':          '¿Cómo usar PokeSwipe?',
      'help.close':          'Entendido',
      'help.s1.title':       'Deslizar y agregar amigos',
      'help.s1.body':        'Explora capturas de códigos de amigo compartidas por otros jugadores. Toca una tarjeta para ampliarla y leer el código, toca Siguiente para pasar a la próxima.<br>Anota el código y agrégalo en Pokémon GO → Amigos → Agregar amigo.',
      'help.s2.title':       'Subir captura',
      'help.s2.body':        'Abre Pokémon GO y ve a tu Tarjeta de Entrenador (la pantalla con tu código QR). Toma una captura vertical y súbela aquí para que otros jugadores puedan encontrarte.',
      'help.s3.title':       'Gratis y sin registro',
      'help.s3.body':        'Solo usa un ID de dispositivo anónimo, sin datos personales. Máximo 5 subidas por día.',
    },

    /* ════════ Português ════════ */
    'pt': {
      subtitle:           'Deslize para encontrar amigos no Pokémon GO',
      'tab.swipe':        'Deslizar',
      'tab.upload':       'Enviar print',
      'stats':            '<strong>{total}</strong> cartas・restam <strong>{left}</strong>',
      'hint.tap':         'Toque para ver',
      'hint.next':        'Deslize para o próximo',
      'hint.skip':        'Pular',
      'hint.add':         'Adicionar',
      'empty.title':      'VAZIO',
      'empty.sub':        'Nenhuma captura ainda<br>Envie seu código de amigo para começar!',
      'empty.done':       'Você viu todos! 🎉<br>Volte mais tarde para ver novos',
      'kbd.next':         'Próximo',
      'kbd.view':         'Ver QR',
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
      'aria.view':        'Ver QR code de amigo',
      'aria.next':        'Próximo',
      'aria.skip':        'Pular (tecla ←)',
      'aria.add':         'Adicionar amigo (tecla →)',
      'ad.label':         'Anúncio',
      'ad.sponsor':       'Patrocinado',
      'quota.ok':         'Envios restantes hoje: {left} / {total}',
      'quota.empty':      'Limite diário atingido. Volte amanhã 🌙',
      'quota.btn.limit':  'Limite diário atingido',
      'refresh.btn':      'Atualizar para ver novos prints',
      'refresh.cooldown': 'Disponível em {mins}:{secs}',
      'refresh.ready':    'Ver novos códigos de amigo 👀',
      'verify.scanning':     'Analisando imagem, aguarde…',
      'verify.notFound':     'Código não encontrado. Envie um print da tela de código de treinador do Pokémon GO 📸',
      'verify.duplicate':    'Este código de amigo já foi enviado. Obrigado! ♻️',
      'verify.wrongFormat':  'Por favor envie um print vertical do Pokémon GO 📱',
      'myUploads.title':     'Meus envios',
      'delete.btn':          'Excluir',
      'delete.confirm':      'Confirmar?',
      'delete.done':         'Ocultado ✓',
      'help.title':          'Como usar o PokeSwipe?',
      'help.close':          'Entendi',
      'help.s1.title':       'Deslizar e adicionar amigos',
      'help.s1.body':        'Explore prints de códigos de amigo compartilhados por outros jogadores. Toque em um card para ampliar e ler o código, toque em Próximo para avançar.<br>Anote o código e adicione no Pokémon GO → Amigos → Adicionar amigo.',
      'help.s2.title':       'Enviar print',
      'help.s2.body':        'Abra o Pokémon GO e acesse seu Cartão de Treinador (a tela com seu QR Code). Tire um print na vertical e envie aqui para que outros jogadores possam te encontrar.',
      'help.s3.title':       'Grátis e sem cadastro',
      'help.s3.body':        'Usa apenas um ID de dispositivo anônimo, sem dados pessoais. Máximo 5 envios por dia.',
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
