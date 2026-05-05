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
      'empty.loop':       '已看完全部，重頭開始 ♻️',
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
      'lightbox.caption': '打開 Pokémon GO → 好友 → 新增好友，貼上好友碼',
      'lightbox.close':   '關閉',
      'lightbox.copy':    '複製好友碼',
      'lightbox.rescan':  '重新掃描',
      'lightbox.scanning':'掃描中…',
      'lightbox.nocode':  '無法辨識',
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
      'verify.noQrCode':     '找不到 QR Code，請上傳顯示 QR Code 的訓練家代碼頁面截圖 📸',
      'verify.scanError':    '圖片辨識失敗，請確認是 Pokémon GO 截圖後再試 📸',
      'myUploads.title':     '我的上傳',
      'delete.btn':          '刪除',
      'delete.confirm':      '確認?',
      'delete.done':         '已隱藏 ✓',
      'help.title':          '怎麼使用 PokeSwipe？',
      'help.close':          '知道了',
      'copy.btn':            '一鍵複製好友碼',
      'copy.done':           '已複製！切換到遊戲貼上 ✓',
      'copy.noCode':         '點擊查看好友碼',
      'kbd.copy':            '複製',
      'help.s1.title':       '滑動加友',
      'help.s1.body':        '瀏覽其他玩家分享的好友碼截圖，看到喜歡的就加吧！<br><strong>📱 手機：</strong>點「一鍵複製」按鈕，複製好友碼後切換到 Pokémon GO → 好友 → 新增好友貼上。<br><strong>💻 電腦：</strong>按 ← → 鍵換卡片，按 Space 放大查看 QR Code，按 C 複製好友碼。',
      'help.s2.title':       '上傳截圖',
      'help.s2.body':        '打開 Pokémon GO，點頭像進入訓練家名片頁面（有 QR Code 的頁面），直向截圖後回來上傳，就能讓其他玩家看到你的好友碼。',
      'help.s3.title':       '完全免費，不需要帳號',
      'help.s3.body':        '只使用匿名裝置 ID，不收集任何個人資料。每天最多上傳 5 張。',
      'menu.help':           '使用說明',
      'menu.features':       '功能介紹',
      'menu.about':          '關於 PokeSwipe',
      'menu.terms':          '使用條款',
      'menu.privacy':        '隱私政策',
      'menu.contact':        '聯絡我們',
      'feat.hero':           '免費・匿名・即時同步的 Pokémon GO 好友碼交換平台',
      'feat.features.label': '三大核心特色',
      'feat.card1.title':    '完全匿名，不需註冊',
      'feat.card1.desc':     '不需要 Google、Email——任何個資都不收集。你只會被分配一個隨機的 Trainer ID，存在瀏覽器本地，不會傳到任何伺服器。',
      'feat.card2.title':    '跨裝置即時同步',
      'feat.card2.desc':     '透過 Cloudinary 雲端儲存，你上傳的截圖會立即出現在所有人的卡片堆裡，不論手機、平板或電腦。',
      'feat.card3.title':    '智慧好友碼辨識',
      'feat.card3.desc':     '內建 OCR + QR Code 雙重驗證，自動從截圖中讀出 12 位好友碼，並自動去重、防止上傳非遊戲截圖。',
      'feat.steps.label':    '使用步驟',
      'feat.step1.title':    '截圖訓練家代碼頁面',
      'feat.step1.desc':     '打開 Pokémon GO → 點頭像 → 顯示 QR Code 的頁面，直向截圖。',
      'feat.step2.title':    '切換到「上傳截圖」分頁',
      'feat.step2.desc':     '選檔案或拖曳上傳，系統會自動驗證並去重。',
      'feat.step3.title':    '回到「滑動加友」分頁',
      'feat.step3.desc':     '左右滑動瀏覽其他玩家的好友碼，看到喜歡的就複製、貼到遊戲裡加好友。',
      'feat.faq.label':      '常見問題',
      'feat.faq1.q':         '需要付費嗎？',
      'feat.faq1.a':         '完全免費。本站不收費、不販售商品、不要求註冊或贊助。',
      'feat.faq2.q':         '我的好友碼會被儲存在哪？',
      'feat.faq2.a':         '截圖存在 Cloudinary（受信任的圖片 CDN），公開可見。除此之外不收集任何資料，詳見 <a href="privacy.html">隱私政策</a>。',
      'feat.faq3.q':         '支援哪些裝置？',
      'feat.faq3.a':         '所有現代瀏覽器：iPhone Safari、Android Chrome、Mac/Windows 桌面都能用。建議 iOS 14+ / Android 10+ 以獲得最佳體驗。',
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
      'empty.loop':       "You've seen all — starting over ♻️",
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
      'lightbox.caption': 'Open Pokémon GO → Friends → Add Friend and paste the code',
      'lightbox.close':   'Close',
      'lightbox.copy':    'Copy Code',
      'lightbox.rescan':  'Re-scan',
      'lightbox.scanning':'Scanning…',
      'lightbox.nocode':  'Not found',
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
      'verify.noQrCode':     'No QR code found. Please upload the Trainer Code screen showing the QR code 📸',
      'verify.scanError':    'Scan failed. Please make sure it is a Pokémon GO screenshot and try again 📸',
      'myUploads.title':     'My Uploads',
      'delete.btn':          'Delete',
      'delete.confirm':      'Confirm?',
      'delete.done':         'Hidden ✓',
      'help.title':          'How to use PokeSwipe?',
      'help.close':          'Got it',
      'copy.btn':            'Copy Friend Code',
      'copy.done':           'Copied! Paste it in Pokémon GO ✓',
      'copy.noCode':         'Tap to view code',
      'kbd.copy':            'Copy',
      'help.s1.title':       'Swipe Friends',
      'help.s1.body':        'Browse friend code screenshots shared by other players.<br><strong>📱 Mobile:</strong> Tap "Copy Friend Code" to copy, then switch to Pokémon GO → Friends → Add Friend and paste.<br><strong>💻 Desktop:</strong> Use ← → keys to navigate, Space to zoom in, C to copy the code.',
      'help.s2.title':       'Upload a Screenshot',
      'help.s2.body':        'Open Pokémon GO and go to your Trainer Card (the screen showing your QR Code). Take a portrait screenshot and upload it here so other players can find you.',
      'help.s3.title':       'Free — No Account Required',
      'help.s3.body':        'Only an anonymous device ID is used — no personal data collected. Maximum 5 uploads per day.',
      'menu.help':           'How to Use',
      'menu.features':       'How It Works',
      'menu.about':          'About PokeSwipe',
      'menu.terms':          'Terms of Use',
      'menu.privacy':        'Privacy Policy',
      'menu.contact':        'Contact',
      'feat.hero':           'Free, anonymous, real-time Pokémon GO friend code exchange',
      'feat.features.label': 'Three Core Features',
      'feat.card1.title':    'Fully Anonymous, No Sign-up',
      'feat.card1.desc':     'No Google or email needed — no personal data collected. You get a random Trainer ID stored locally in your browser, never sent to any server.',
      'feat.card2.title':    'Real-time Cross-device Sync',
      'feat.card2.desc':     'Via Cloudinary cloud storage, your uploaded screenshot appears instantly in everyone\'s card stack on any device.',
      'feat.card3.title':    'Smart Friend Code Detection',
      'feat.card3.desc':     'Built-in OCR + QR Code dual detection automatically reads the 12-digit friend code from your screenshot, with deduplication.',
      'feat.steps.label':    'How to Use',
      'feat.step1.title':    'Screenshot Your Trainer Card',
      'feat.step1.desc':     'Open Pokémon GO → tap your avatar → go to the QR Code page, take a portrait screenshot.',
      'feat.step2.title':    'Switch to the "Upload" Tab',
      'feat.step2.desc':     'Select or drag-drop your file — it\'s automatically verified and deduplicated.',
      'feat.step3.title':    'Go Back to the "Swipe" Tab',
      'feat.step3.desc':     'Swipe through other players\' friend codes, copy any you like, and paste into Pokémon GO to add friends.',
      'feat.faq.label':      'FAQ',
      'feat.faq1.q':         'Is it free?',
      'feat.faq1.a':         'Completely free. No fees, no products sold, no registration or donations required.',
      'feat.faq2.q':         'Where is my friend code stored?',
      'feat.faq2.a':         'Screenshots are stored in Cloudinary (a trusted image CDN), publicly visible. No other data is collected. See our <a href="privacy.html">Privacy Policy</a>.',
      'feat.faq3.q':         'Which devices are supported?',
      'feat.faq3.a':         'All modern browsers: iPhone Safari, Android Chrome, Mac/Windows desktop. Recommended iOS 14+ / Android 10+ for the best experience.',
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
      'empty.loop':       '全部見終えた — 最初からリピート ♻️',
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
      'lightbox.caption': 'ポケモンGO → フレンド → フレンドを追加 でコードを貼り付けよう',
      'lightbox.close':   '閉じる',
      'lightbox.copy':    'コードをコピー',
      'lightbox.rescan':  '再スキャン',
      'lightbox.scanning':'スキャン中…',
      'lightbox.nocode':  '認識不可',
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
      'verify.noQrCode':     'QRコードが見つかりません。QRコードが表示されているトレーナーコード画面のスクショを投稿してください 📸',
      'verify.scanError':    '画像の解析に失敗しました。ポケモンGOのスクショか確認してからもう一度お試しください 📸',
      'myUploads.title':     '自分の投稿',
      'delete.btn':          '削除',
      'delete.confirm':      '確認?',
      'delete.done':         '非表示にしました ✓',
      'help.title':          'PokeSwipeの使い方',
      'help.close':          'わかった',
      'copy.btn':            'コードをコピー',
      'copy.done':           'コピー済み！ゲームに貼り付けてね ✓',
      'copy.noCode':         'タップして確認',
      'kbd.copy':            'コピー',
      'help.s1.title':       'スワイプしてフレンド追加',
      'help.s1.body':        '他のプレイヤーが共有したフレンドコードを見てみよう。<br><strong>📱 スマホ：</strong>「コードをコピー」ボタンをタップしてコードをコピーし、ポケモンGO → フレンド → フレンドを追加に貼り付けよう。<br><strong>💻 PC：</strong>← → キーでカードを切り替え、Space で拡大、C でコピー。',
      'help.s2.title':       'スクショを投稿する',
      'help.s2.body':        'ポケモンGOを開き、アイコンからトレーナーカード画面（QRコードが表示される画面）へ進んで縦向きでスクリーンショット。ここに戻って投稿すると他のプレイヤーに公開されます。',
      'help.s3.title':       '無料・登録不要',
      'help.s3.body':        '匿名のデバイスIDのみ使用。個人情報は収集しません。1日最大5枚まで投稿できます。',
      'menu.help':           '使い方',
      'menu.features':       '機能紹介',
      'menu.about':          'PokeSwipeについて',
      'menu.terms':          '利用規約',
      'menu.privacy':        'プライバシーポリシー',
      'menu.contact':        'お問い合わせ',
      'feat.hero':           '無料・匿名・リアルタイム同期のポケモンGOフレンドコード交換プラットフォーム',
      'feat.features.label': '3つの主な特徴',
      'feat.card1.title':    '完全匿名・登録不要',
      'feat.card1.desc':     'Google・メール不要——個人情報は一切収集しません。ランダムなTrainer IDがブラウザのみに保存され、サーバーには送信されません。',
      'feat.card2.title':    'クロスデバイス即時同期',
      'feat.card2.desc':     'Cloudinaryのクラウドストレージで、アップロードした画像が全員のカードスタックに即時表示されます。',
      'feat.card3.title':    'スマートコード認識',
      'feat.card3.desc':     'OCR + QRコードの二重認識で、スクリーンショットから12桁のフレンドコードを自動読み取り、重複も防ぎます。',
      'feat.steps.label':    '使い方',
      'feat.step1.title':    'トレーナーカードをスクリーンショット',
      'feat.step1.desc':     'ポケモンGOを開いて → アイコンをタップ → QRコードのページへ、縦向きでスクショ。',
      'feat.step2.title':    '「投稿」タブに切り替える',
      'feat.step2.desc':     'ファイルを選択またはドラッグ＆ドロップ。自動で検証・重複チェックが行われます。',
      'feat.step3.title':    '「スワイプ」タブに戻る',
      'feat.step3.desc':     '他のプレイヤーのフレンドコードをスワイプして、気に入ったものをコピーしてゲームに貼り付けましょう。',
      'feat.faq.label':      'よくある質問',
      'feat.faq1.q':         '無料ですか？',
      'feat.faq1.a':         '完全無料です。料金・商品販売・登録・寄付は一切不要です。',
      'feat.faq2.q':         'フレンドコードはどこに保存されますか？',
      'feat.faq2.a':         'スクリーンショットはCloudinary（信頼できるCDN）に保存され、公開されます。それ以外のデータは収集しません。詳しくは<a href="privacy.html">プライバシーポリシー</a>をご覧ください。',
      'feat.faq3.q':         '対応デバイスは？',
      'feat.faq3.a':         'すべてのモダンブラウザ対応：iPhone Safari、Android Chrome、Mac/Windowsデスクトップ。iOS 14+ / Android 10+推奨。',
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
      'empty.loop':       'Ya los viste todos — empezando de nuevo ♻️',
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
      'lightbox.caption': 'Abre Pokémon GO → Amigos → Agregar amigo y pega el código',
      'lightbox.close':   'Cerrar',
      'lightbox.copy':    'Copiar Código',
      'lightbox.rescan':  'Re-escanear',
      'lightbox.scanning':'Escaneando…',
      'lightbox.nocode':  'No encontrado',
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
      'verify.noQrCode':     'No se encontró código QR. Sube la pantalla de código de entrenador que muestra el QR 📸',
      'verify.scanError':    'Error al escanear. Asegúrate de que sea una captura de Pokémon GO e intenta de nuevo 📸',
      'myUploads.title':     'Mis capturas',
      'delete.btn':          'Eliminar',
      'delete.confirm':      '¿Confirmar?',
      'delete.done':         'Ocultado ✓',
      'help.title':          '¿Cómo usar PokeSwipe?',
      'help.close':          'Entendido',
      'copy.btn':            'Copiar Código',
      'copy.done':           '¡Copiado! Pégalo en Pokémon GO ✓',
      'copy.noCode':         'Toca para ver',
      'kbd.copy':            'Copiar',
      'help.s1.title':       'Deslizar y agregar amigos',
      'help.s1.body':        'Explora capturas de códigos de amigo compartidas por otros jugadores.<br><strong>📱 Móvil:</strong> Toca "Copiar Código" para copiar, luego abre Pokémon GO → Amigos → Agregar amigo y pega.<br><strong>💻 PC:</strong> Usa ← → para navegar, Space para ampliar, C para copiar el código.',
      'help.s2.title':       'Subir captura',
      'help.s2.body':        'Abre Pokémon GO y ve a tu Tarjeta de Entrenador (la pantalla con tu código QR). Toma una captura vertical y súbela aquí para que otros jugadores puedan encontrarte.',
      'help.s3.title':       'Gratis y sin registro',
      'help.s3.body':        'Solo usa un ID de dispositivo anónimo, sin datos personales. Máximo 5 subidas por día.',
      'menu.help':           'Cómo usar',
      'menu.features':       'Cómo Funciona',
      'menu.about':          'Sobre PokeSwipe',
      'menu.terms':          'Términos de uso',
      'menu.privacy':        'Política de privacidad',
      'menu.contact':        'Contacto',
      'feat.hero':           'Intercambio de códigos de amigo de Pokémon GO: gratis, anónimo y en tiempo real',
      'feat.features.label': 'Tres características principales',
      'feat.card1.title':    'Totalmente anónimo, sin registro',
      'feat.card1.desc':     'Sin Google ni email — no se recopilan datos personales. Se te asigna un Trainer ID aleatorio guardado solo en tu navegador.',
      'feat.card2.title':    'Sincronización en tiempo real',
      'feat.card2.desc':     'Con almacenamiento Cloudinary, tu captura aparece instantáneamente en la pila de todos, en cualquier dispositivo.',
      'feat.card3.title':    'Detección inteligente de códigos',
      'feat.card3.desc':     'OCR + QR Code de verificación doble lee automáticamente el código de 12 dígitos de tu captura, con deduplicación.',
      'feat.steps.label':    'Cómo usar',
      'feat.step1.title':    'Captura tu Tarjeta de Entrenador',
      'feat.step1.desc':     'Abre Pokémon GO → toca tu avatar → ve a la página de código QR, toma una captura vertical.',
      'feat.step2.title':    'Cambia a la pestaña "Subir"',
      'feat.step2.desc':     'Selecciona o arrastra tu archivo — se verifica y deduplica automáticamente.',
      'feat.step3.title':    'Vuelve a la pestaña "Deslizar"',
      'feat.step3.desc':     'Desliza los códigos de otros jugadores, copia los que te gusten y pégalos en Pokémon GO.',
      'feat.faq.label':      'Preguntas frecuentes',
      'feat.faq1.q':         '¿Es gratuito?',
      'feat.faq1.a':         'Completamente gratis. Sin tarifas, sin productos, sin registro ni donaciones.',
      'feat.faq2.q':         '¿Dónde se guarda mi código de amigo?',
      'feat.faq2.a':         'Las capturas se guardan en Cloudinary (CDN confiable), visibles públicamente. No se recopilan otros datos. Ver <a href="privacy.html">Política de privacidad</a>.',
      'feat.faq3.q':         '¿Qué dispositivos son compatibles?',
      'feat.faq3.a':         'Todos los navegadores modernos: Safari (iPhone), Chrome (Android), escritorio Mac/Windows. Se recomienda iOS 14+ / Android 10+.',
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
      'empty.loop':       'Você viu todos — recomeçando ♻️',
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
      'lightbox.caption': 'Abra Pokémon GO → Amigos → Adicionar amigo e cole o código',
      'lightbox.close':   'Fechar',
      'lightbox.copy':    'Copiar Código',
      'lightbox.rescan':  'Redigitalizar',
      'lightbox.scanning':'Digitalizando…',
      'lightbox.nocode':  'Não encontrado',
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
      'verify.noQrCode':     'QR code não encontrado. Envie o print da tela de código de treinador com o QR code visível 📸',
      'verify.scanError':    'Falha ao analisar. Verifique se é um print do Pokémon GO e tente novamente 📸',
      'myUploads.title':     'Meus envios',
      'delete.btn':          'Excluir',
      'delete.confirm':      'Confirmar?',
      'delete.done':         'Ocultado ✓',
      'help.title':          'Como usar o PokeSwipe?',
      'help.close':          'Entendi',
      'copy.btn':            'Copiar Código',
      'copy.done':           'Copiado! Cole no Pokémon GO ✓',
      'copy.noCode':         'Toque para ver',
      'kbd.copy':            'Copiar',
      'help.s1.title':       'Deslizar e adicionar amigos',
      'help.s1.body':        'Explore prints de códigos de amigo compartilhados por outros jogadores.<br><strong>📱 Celular:</strong> Toque em "Copiar Código" para copiar, depois abra Pokémon GO → Amigos → Adicionar amigo e cole.<br><strong>💻 PC:</strong> Use ← → para navegar, Space para ampliar, C para copiar o código.',
      'help.s2.title':       'Enviar print',
      'help.s2.body':        'Abra o Pokémon GO e acesse seu Cartão de Treinador (a tela com seu QR Code). Tire um print na vertical e envie aqui para que outros jogadores possam te encontrar.',
      'help.s3.title':       'Grátis e sem cadastro',
      'help.s3.body':        'Usa apenas um ID de dispositivo anônimo, sem dados pessoais. Máximo 5 envios por dia.',
      'menu.help':           'Como usar',
      'menu.features':       'Como Funciona',
      'menu.about':          'Sobre o PokeSwipe',
      'menu.terms':          'Termos de uso',
      'menu.privacy':        'Política de privacidade',
      'menu.contact':        'Contato',
      'feat.hero':           'Troca de códigos de amigo do Pokémon GO: grátis, anônimo e em tempo real',
      'feat.features.label': 'Três características principais',
      'feat.card1.title':    'Completamente anônimo, sem cadastro',
      'feat.card1.desc':     'Sem Google ou e-mail — nenhum dado pessoal coletado. Você recebe um Trainer ID aleatório salvo apenas no seu navegador.',
      'feat.card2.title':    'Sincronização em tempo real',
      'feat.card2.desc':     'Com armazenamento Cloudinary, seu print aparece instantaneamente na pilha de todos, em qualquer dispositivo.',
      'feat.card3.title':    'Detecção inteligente de código',
      'feat.card3.desc':     'OCR + QR Code de verificação dupla lê automaticamente o código de 12 dígitos do seu print, com deduplicação.',
      'feat.steps.label':    'Como usar',
      'feat.step1.title':    'Tire um print do seu Cartão de Treinador',
      'feat.step1.desc':     'Abra Pokémon GO → toque no avatar → vá para a página do QR Code, tire um print na vertical.',
      'feat.step2.title':    'Mude para a aba "Enviar"',
      'feat.step2.desc':     'Selecione ou arraste seu arquivo — é verificado e deduplicado automaticamente.',
      'feat.step3.title':    'Volte para a aba "Deslizar"',
      'feat.step3.desc':     'Deslize os códigos de outros jogadores, copie os que gostar e cole no Pokémon GO.',
      'feat.faq.label':      'Perguntas frequentes',
      'feat.faq1.q':         'É gratuito?',
      'feat.faq1.a':         'Completamente grátis. Sem taxas, sem produtos, sem cadastro ou doações.',
      'feat.faq2.q':         'Onde meu código de amigo fica armazenado?',
      'feat.faq2.a':         'Os prints ficam no Cloudinary (CDN confiável), visíveis publicamente. Nenhum outro dado é coletado. Veja nossa <a href="privacy.html">Política de Privacidade</a>.',
      'feat.faq3.q':         'Quais dispositivos são suportados?',
      'feat.faq3.a':         'Todos os navegadores modernos: Safari (iPhone), Chrome (Android), desktop Mac/Windows. Recomendado iOS 14+ / Android 10+.',
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
