/* ============================================
   PokeSwipe – App v5
   新增：上傳限流、刷完後重整體驗、桌面優化
   ============================================ */

(function () {
  'use strict';

  /* ══════ Constants ══════ */
  const UPLOAD_LIMIT     = 5;               // 每台設備每天最多上傳幾張
  const REFRESH_COOLDOWN = 5 * 60;          // 重整冷卻秒數（5 分鐘）
  const DELETED_KEY      = 'pokeswipe_deleted';  // 已刪除圖片 ID（軟刪除）
  const MY_IDS_KEY       = 'pokeswipe_myids';   // 本裝置上傳的圖片 public_id 清單
  const SEEN_KEY         = 'pokeswipe_seen';    // 已看過的圖片 ID

  /* ══════ State ══════ */
  let images        = [];
  let myImages      = [];           // 自己上傳的圖片（管理面板用）
  let knownCodes    = new Set();    // 所有已知好友碼（跨裝置去重）
  let knownHashes   = new Set();    // 所有已知圖片 hash（跨裝置圖片去重，最可靠）
  let seenIds       = new Set();    // 已看過的圖片 ID（標記用，不隱藏）
  let myUploadIds   = new Set();    // 本裝置上傳的圖片 ID（建 badge 用）
  let currentIndex  = 0;
  let currentSwiper = null;
  let isSwiping     = false;
  let isConfigured  = false;
  let lastFetchTime = 0;
  let selectedHash  = null;         // 目前選取圖的 SHA-256 hash（上傳時帶 tag 用）

  /* ══════ DOM ══════ */
  const $ = (s) => document.querySelector(s);

  const cardStack    = $('#cardStack');
  const emptyState   = $('#emptyState');
  const actionRow    = $('#actionRow');
  const copySection  = $('#copySection');
  const btnCopyCode  = $('#btnCopyCode');
  const btnCopyDesk  = $('#btnCopyDesk');
  const copyCodeDisp = $('#copyCodeDisplay');
  const swipeCount   = $('#swipeCount');
  const btnView      = $('#btnView');
  const btnNext      = $('#btnNext');
  const dropZone     = $('#dropZone');
  const fileInput    = $('#fileInput');
  const uploadBtn    = $('#uploadBtn');
  const uploadBtnTxt = $('#uploadBtnText');
  const spinner      = $('#spinner');
  const progressBar  = $('#progressBar');
  const progressFill = $('#progressFill');
  const configNotice = $('#configNotice');
  const swipeBar     = $('#swipeProgressBar');
  const lightbox         = $('#lightbox');
  const lightboxImg      = $('#lightboxImg');
  const lightboxCodeBar  = $('#lightboxCodeBar');
  const lightboxCodeVal  = $('#lightboxCodeVal');
  const btnLightboxCopy  = $('#btnLightboxCopy');
  const btnLightboxRescan= $('#btnLightboxRescan');
  const trainerChip  = $('#trainerChip');
  const uploadQuota  = $('#uploadQuota');

  /* ══════════════════════════════════════════
     Upload Rate Limiter
  ══════════════════════════════════════════ */
  const UploadLimit = {
    KEY: 'pokeswipe_uploads_v2',

    _data() {
      try {
        const raw = localStorage.getItem(this.KEY);
        const d   = raw ? JSON.parse(raw) : {};
        const today = new Date().toDateString();
        if (d.date !== today) return { date: today, count: 0 };
        return d;
      } catch { return { date: new Date().toDateString(), count: 0 }; }
    },

    remaining() { return Math.max(0, UPLOAD_LIMIT - this._data().count); },
    canUpload()  { return this.remaining() > 0; },

    increment() {
      const d = this._data();
      d.count++;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    },

    updateUI() {
      if (!uploadQuota) return;
      const left = this.remaining();
      if (left === 0) {
        uploadQuota.textContent = t('quota.empty');
        uploadQuota.className   = 'upload-quota quota-empty';
        if (uploadBtn) uploadBtn.disabled = true;
        if (uploadBtnTxt) uploadBtnTxt.textContent = t('quota.btn.limit');
      } else {
        uploadQuota.textContent = t('quota.ok', { left, total: UPLOAD_LIMIT });
        uploadQuota.className   = `upload-quota ${left <= 2 ? 'quota-low' : 'quota-ok'}`;
      }
    },
  };

  /* ══════════════════════════════════════════
     OCR Friend-Code Verifier  v3
     驗證策略（全部通過才放行）：
     1. 直向截圖檢查（橫向 = 不是手機截圖）
     2. Tesseract OCR 偵測 XXXX XXXX XXXX 格式好友碼
     3. 本機 localStorage 去重
     4. 跨裝置去重（loadImages 已建的 knownCodes Set，無痕也有效）
  ══════════════════════════════════════════ */
  const OcrVerify = {
    KEY:          'pokeswipe_codes',
    _pendingCode: null,
    _scanning:    false,
    _loadPromise: null,

    /* ── Tesseract 懶加載（防重複 script） ── */
    _load() {
      if (window.Tesseract) return Promise.resolve();
      if (this._loadPromise)  return this._loadPromise;
      this._loadPromise = new Promise((resolve, reject) => {
        const s  = document.createElement('script');
        s.src    = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
        s.onload = () => { this._loadPromise = null; resolve(); };
        s.onerror = () => { this._loadPromise = null; reject(new Error('load')); };
        document.head.appendChild(s);
      });
      return this._loadPromise;
    },

    /* ── 預處理：縮圖 + 裁切好友碼區域 + 灰階 + 對比強化 ── */
    _preprocess(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const isPortrait = img.height > img.width;
            // 直向截圖：裁切 5%–60%，跳過狀態列（上）和 QR Code（下）
            const srcY = isPortrait ? Math.round(img.height * 0.05) : 0;
            const srcH = isPortrait ? Math.round(img.height * 0.55) : img.height;
            const MAX  = 1400;
            const scale = img.width > MAX ? MAX / img.width : 1;
            const c   = document.createElement('canvas');
            c.width   = Math.round(img.width * scale);
            c.height  = Math.round(srcH * scale);
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, c.width, c.height);
            const id = ctx.getImageData(0, 0, c.width, c.height);
            const px = id.data;
            for (let i = 0; i < px.length; i += 4) {
              const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
              const v = Math.min(255, Math.max(0, (g - 128) * 1.8 + 128));
              px[i] = px[i + 1] = px[i + 2] = v;
            }
            ctx.putImageData(id, 0, 0);
            resolve({
              dataUrl:    c.toDataURL('image/jpeg', 0.9),
              isPortrait,
            });
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    },

    _isDuplicate(code12) {
      try { return JSON.parse(localStorage.getItem(this.KEY) || '[]').includes(code12); }
      catch { return false; }
    },

    saveCode() {
      if (!this._pendingCode) return;
      try {
        const list = JSON.parse(localStorage.getItem(this.KEY) || '[]');
        if (!list.includes(this._pendingCode)) {
          list.push(this._pendingCode);
          if (list.length > 200) list.shift();
          localStorage.setItem(this.KEY, JSON.stringify(list));
        }
      } catch {}
      this._pendingCode = null;
    },

    clearPending() { this._pendingCode = null; },

    /* ── 主掃描 ── */
    async scan(file, onProgress) {
      const TIMEOUT = 25_000;

      /* 1. 預處理 */
      const { dataUrl, isPortrait } = await this._preprocess(file);

      /* 2. 橫向截圖直接擋（手機截圖一定直向） */
      if (!isPortrait) return { ok: false, reason: 'wrongFormat' };

      /* 3. 載入 Tesseract（fail-open） */
      try { await this._load(); }
      catch { return { ok: true, skipped: true }; }

      /* 4. OCR：數字 whitelist + sparse PSM，速度最快 */
      let text = '';
      try {
        const worker = await Tesseract.createWorker({
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress)
              onProgress(Math.round(m.progress * 100));
          },
        });
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789 ',
          tessedit_pageseg_mode:   '11',
        });
        const { data } = await Promise.race([
          worker.recognize(dataUrl),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT)),
        ]);
        text = data.text;
        await worker.terminate();
      } catch { return { ok: true, skipped: true }; }

      /* 5. 比對 XXXX XXXX XXXX — 逐行比對，避免跨行誤讀用戶名數字 */
      const code12 = _extractCode(text);
      if (!code12) return { ok: false, reason: 'notFound' };

      /* 6. 本機去重 */
      if (this._isDuplicate(code12)) return { ok: false, reason: 'duplicate' };

      /* 7. 跨裝置去重（由 loadImages 建立的 knownCodes，無痕也有效） */
      if (knownCodes.has(code12)) return { ok: false, reason: 'duplicate' };

      this._pendingCode = code12;
      return { ok: true };
    },
  };

  /* ══════ Init ══════ */
  function init() {
    isConfigured =
      typeof CLOUDINARY_CONFIG !== 'undefined' &&
      CLOUDINARY_CONFIG.CLOUD_NAME !== 'YOUR_CLOUD_NAME' &&
      CLOUDINARY_CONFIG.UPLOAD_PRESET !== 'YOUR_PRESET';

    if (!isConfigured && configNotice) configNotice.classList.add('visible');

    if (trainerChip && typeof Identity !== 'undefined') {
      trainerChip.textContent = '🎮 ' + Identity.short();
      trainerChip.title = 'Trainer ID: ' + Identity.get();
    }

    UploadLimit.updateUI();
    setupTabs();
    setupUpload();
    setupActions();
    setupKeyboard();
    setupLightbox();
    document.addEventListener('langchange', refreshDynamic);
    setupHelp();
    loadImages();
  }

  /* ══════ Language hook ══════ */
  function refreshDynamic() {
    if (uploadBtnTxt) {
      uploadBtnTxt.textContent = UploadLimit.canUpload() ? t('upload.idle') : t('quota.btn.limit');
    }
    updateStats();
    const sub = emptyState?.querySelector('.empty-sub');
    if (sub && images.slice(currentIndex).length === 0) {
      sub.innerHTML = images.length > 0 ? t('empty.done') : t('empty.sub');
    }
    UploadLimit.updateUI();
    updateCopySection();
  }

  /* ══════ Help Sheet ══════ */
  function setupHelp() {
    const btn     = $('#helpBtn');
    const overlay = $('#helpOverlay');
    const sheet   = $('#helpSheet');
    const closeBtn = $('#helpSheetClose');
    if (!btn || !sheet) return;

    function openHelp() {
      renderHelpSections();
      overlay.classList.add('visible');
      sheet.classList.add('visible');
      sheet.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeHelp() {
      overlay.classList.remove('visible');
      sheet.classList.remove('visible');
      sheet.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', openHelp);
    closeBtn?.addEventListener('click', closeHelp);
    overlay.addEventListener('click', closeHelp);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheet.classList.contains('visible')) closeHelp();
    });
    // Re-render text when language changes
    document.addEventListener('langchange', () => {
      if (sheet.classList.contains('visible')) renderHelpSections();
    });
  }

  function renderHelpSections() {
    const container = $('#helpSections');
    if (!container) return;
    const keys = ['s1', 's2', 's3'];
    container.innerHTML = keys.map((k, i) => `
      <div class="help-section">
        <div class="help-section-num">${i + 1}</div>
        <div>
          <div class="help-section-title">${t(`help.${k}.title`)}</div>
          <div class="help-section-body">${t(`help.${k}.body`)}</div>
        </div>
      </div>
    `).join('');

    const title = $('#helpSheetTitle');
    const close = $('#helpSheetClose');
    if (title) title.textContent = t('help.title');
    if (close) close.textContent = t('help.close');
  }

  /* ══════ Tabs ══════ */
  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach((b) => {
          b.classList.toggle('active', b.dataset.tab === tab);
          b.setAttribute('aria-selected', String(b.dataset.tab === tab));
        });
        $('#viewSwipe').classList.toggle('active',  tab === 'swipe');
        $('#viewUpload').classList.toggle('active', tab === 'upload');
        if (tab === 'swipe')  renderCards();
        if (tab === 'upload') { UploadLimit.updateUI(); renderMyUploads(); }
      });
    });
  }

  /* ══════ Upload ══════ */
  let selectedFile = null;

  function setupUpload() {
    dropZone.addEventListener('click', () => {
      if (!UploadLimit.canUpload()) { showToast(t('quota.empty')); return; }
      fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (UploadLimit.canUpload()) dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (!UploadLimit.canUpload()) { showToast(t('quota.empty')); return; }
      if (e.dataTransfer.files[0]) pickFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) pickFile(e.target.files[0]);
    });

    uploadBtn.addEventListener('click', doUpload);
  }

  async function pickFile(file) {
    if (!file.type.startsWith('image/')) { showToast(t('toast.err.type')); return; }
    if (file.size > 15 * 1024 * 1024)   { showToast(t('toast.err.size')); return; }
    if (OcrVerify._scanning) return;   // 防並發

    /* ── Hash 去重（最快，跨裝置 / 無痕都有效，不依賴 OCR） ── */
    const hash = await computeHash(file);
    if (hash && knownHashes.has(hash)) {
      showToast(t('verify.duplicate'));
      return;
    }

    OcrVerify._scanning = true;
    selectedFile = null;
    selectedHash  = hash;
    OcrVerify.clearPending();

    /* 掃描中狀態 */
    uploadBtn.disabled = true;
    uploadBtnTxt.textContent = t('verify.scanning');
    spinner?.classList.add('active');

    /* 讀圖並顯示朦朧預覽（讓使用者知道已選到檔案） */
    const previewUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
    dropZone.classList.add('has-preview');
    dropZone.innerHTML = `<img src="${previewUrl}" alt="preview"
      style="opacity:0.3;filter:blur(3px);transition:opacity .3s,filter .3s;pointer-events:none">`;

    /* 進度回調：更新按鈕文字 + 預覽逐漸對焦 */
    const onProgress = (pct) => {
      uploadBtnTxt.textContent = `${t('verify.scanning')} ${pct}%`;
      const img = dropZone.querySelector('img');
      if (img) {
        img.style.opacity = String(0.3 + pct * 0.005);               // 0.3 → 0.8
        img.style.filter  = `blur(${Math.max(0, 3 - pct * 0.03)}px)`; // 3px → 0px
      }
    };

    const result = await OcrVerify.scan(file, onProgress);
    OcrVerify._scanning = false;
    spinner?.classList.remove('active');

    if (!result.ok) {
      resetUploadUI();
      showToast(t('verify.' + result.reason));
      return;
    }

    /* 驗證通過：預覽完全清晰，啟用上傳 */
    selectedFile = file;
    const img = dropZone.querySelector('img');
    if (img) { img.style.opacity = '1'; img.style.filter = 'none'; }
    uploadBtn.disabled = false;
    uploadBtnTxt.textContent = t('upload.ready');
  }

  async function doUpload() {
    if (!selectedFile) return;
    if (!UploadLimit.canUpload()) { showToast('今日上傳次數已用完 🌙'); return; }

    setUploading(true);

    try {
      if (isConfigured) {
        const uploaded = await cloudinaryUploadWithTag(selectedFile, (pct) => {
          if (progressFill) progressFill.style.width = (pct * 100) + '%';
        }, OcrVerify._pendingCode, selectedHash);
        if (progressFill) progressFill.style.width = '100%';

        if (uploaded?.public_id) {
          saveMyId(uploaded.public_id);
          // 直接從上傳回應建圖片物件，不依賴 CDN 快取（避免看到舊清單）
          const base = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload`;
          const newImg = {
            id:         uploaded.public_id,
            src:        `${base}/w_800,q_auto,f_auto/${uploaded.public_id}`,
            thumb:      `${base}/w_400,q_auto,f_auto/${uploaded.public_id}`,
            time:       uploaded.created_at || new Date().toISOString(),
            friendCode: OcrVerify._pendingCode,
            imageHash:  selectedHash,
          };
          if (!images.some((i) => i.id === newImg.id))   images.unshift(newImg);
          if (!myImages.some((i) => i.id === newImg.id)) myImages.unshift(newImg);
          myUploadIds.add(newImg.id);
          if (newImg.friendCode) knownCodes.add(newImg.friendCode);
          if (newImg.imageHash)  knownHashes.add(newImg.imageHash);
        }

        showToast(t('toast.uploaded'));
        UploadLimit.increment();
        currentIndex = 0;
        localStorage.removeItem('pokeswipe_lastSeen');
      } else {
        await localUpload(selectedFile, OcrVerify._pendingCode);
        showToast(t('toast.local'));
        UploadLimit.increment();
        currentIndex = 0;
        localStorage.removeItem('pokeswipe_lastSeen');
      }

      OcrVerify.saveCode();        // 記錄此好友碼，防止重複上傳
      UploadLimit.updateUI();
      resetUploadUI();
      renderCards();
      renderMyUploads();
      updateStats();
      setTimeout(() => $('[data-tab="swipe"]')?.click(), 700);
    } catch (err) {
      console.error(err);
      showToast('❌ ' + t('toast.err.upload') + ': ' + err.message);
      uploadBtn.disabled = false;
      uploadBtnTxt.textContent = t('upload.retry');
    } finally {
      setUploading(false);
    }
  }

  function setUploading(on) {
    uploadBtn.disabled = on;
    spinner?.classList.toggle('active', on);
    progressBar?.classList.toggle('active', on);
    if (on) uploadBtnTxt.textContent = t('upload.uploading');
    if (!on) setTimeout(() => {
      progressBar?.classList.remove('active');
      if (progressFill) progressFill.style.width = '0';
    }, 600);
  }

  function localUpload(file, friendCode = null) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale  = Math.min(1, 720 / img.width);
          canvas.width  = img.width  * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          images.unshift({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            src: canvas.toDataURL('image/jpeg', 0.7),
            time: new Date().toISOString(),
            uploaderId: typeof Identity !== 'undefined' ? Identity.get() : null,
            friendCode,
          });
          saveLocal();
          let p = 0;
          const iv = setInterval(() => {
            p = Math.min(p + 0.12, 1);
            if (progressFill) progressFill.style.width = (p * 100) + '%';
            if (p >= 1) { clearInterval(iv); resolve(); }
          }, 80);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function resetUploadUI() {
    selectedFile = null;
    selectedHash  = null;
    OcrVerify.clearPending();
    fileInput.value = '';
    uploadBtn.disabled = !UploadLimit.canUpload();
    uploadBtnTxt.textContent = UploadLimit.canUpload() ? t('upload.idle') : t('quota.btn.limit');
    spinner?.classList.remove('active');
    dropZone.classList.remove('has-preview');
    // 注意：只換 innerHTML，dropZone 元素本身不變，
    // setupUpload() 綁定的 click listener 依然有效，不需要重新加。
    dropZone.innerHTML = `
      <div class="drop-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p class="drop-title">${t('upload.dropTitle')}</p>
      <p class="drop-desc">${t('upload.dropDesc')}</p>
    `;
  }

  /* ══════ Load images ══════ */
  async function loadImages() {
    showSkeleton();
    lastFetchTime = Date.now();

    /* 取得全部圖片 */
    let allImages;
    let gotCloudData = false;
    if (isConfigured) {
      const cloud = await cloudinaryFetchImages('pokeswipe');
      if (cloud) {
        allImages = cloud;
        gotCloudData = true;
      } else {
        loadLocal();
        allImages = [...images];
      }
    } else {
      loadLocal();
      allImages = [...images];
    }

    allImages.sort((a, b) => new Date(b.time) - new Date(a.time));

    const deleted  = getDeleted();
    const myIds    = getMyIds();
    myUploadIds   = myIds;   // 同步到模組級 state，供 buildCard 標示「我的」

    /* 建立跨裝置 Set（好友碼 + 圖片 hash，無痕 / 換裝置也能查重） */
    knownCodes.clear();
    knownHashes.clear();
    allImages.forEach((img) => {
      if (img.friendCode) knownCodes.add(img.friendCode);
      if (img.imageHash)  knownHashes.add(img.imageHash);
    });

    /* Cloudinary 刪圖後本機 dedup 快取同步：只保留雲端還存在的碼 */
    if (gotCloudData) {
      try {
        const localCodes = JSON.parse(localStorage.getItem(OcrVerify.KEY) || '[]');
        const synced = localCodes.filter((c) => knownCodes.has(c));
        localStorage.setItem(OcrVerify.KEY, JSON.stringify(synced));
      } catch {}
    };

    /* 自己的上傳（管理面板用，排除已軟刪除）— 用 localStorage myIds 判斷，不靠 context */
    myImages = allImages.filter((img) => myIds.has(img.id) && !deleted.has(img.id));

    /* Swipe pool：排除已軟刪除（含自己上傳，讓上傳者能確認效果） */
    images = allImages.filter((img) => !deleted.has(img.id));

    /* 載入已看過紀錄 */
    seenIds = loadSeenIds();

    /* 恢復上次位置 */
    const lastId = localStorage.getItem('pokeswipe_lastSeen');
    if (lastId) {
      const idx = images.findIndex((img) => img.id === lastId);
      currentIndex = idx > -1 ? idx + 1 : 0;
    } else {
      currentIndex = 0;
    }

    renderCards();
    renderMyUploads();
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem('pokeswipe_v2');
      images = raw ? JSON.parse(raw) : [];
    } catch { images = []; }
  }
  function saveLocal() {
    try { localStorage.setItem('pokeswipe_v2', JSON.stringify(images.slice(0, 50))); }
    catch { /* full */ }
  }

  /* ══════ Render ══════ */
  function showSkeleton() {
    cardStack.querySelectorAll('.card, .card-skeleton').forEach((c) => c.remove());
    const sk = document.createElement('div');
    sk.className = 'card-skeleton';
    cardStack.appendChild(sk);
    if (actionRow)    actionRow.style.display    = 'none';
    if (copySection)  copySection.style.display  = 'none';
    hideRefreshBtn();
  }

  function updateStats() {
    const total = images.length;
    const MAX_DOTS = 12;   // 超過就只靠進度條，不顯示圓點

    /* 圓點指示器 */
    if (swipeCount) {
      if (total > 0 && total <= MAX_DOTS) {
        swipeCount.innerHTML = Array.from({ length: total }, (_, i) => {
          const cls = i === currentIndex             ? 'swipe-dot--current'
                    : seenIds.has(images[i]?.id)     ? 'swipe-dot--seen'
                    :                                   'swipe-dot--unseen';
          return `<span class="swipe-dot ${cls}"></span>`;
        }).join('');
      } else {
        swipeCount.innerHTML = '';   // 大量圖片靠進度條即可
      }
    }

    /* 底部進度條（永遠更新） */
    if (swipeBar) swipeBar.style.width = total > 0
      ? Math.round((currentIndex / total) * 100) + '%' : '0%';
  }

  function renderCards() {
    if (currentSwiper) { currentSwiper.destroy(); currentSwiper = null; }
    cardStack.querySelectorAll('.card, .card-skeleton').forEach((c) => c.remove());

    updateStats();
    hideRefreshBtn();

    const remaining = images.slice(currentIndex);

    if (remaining.length === 0) {
      if (images.length === 0) {
        emptyState.style.display = '';
        if (actionRow)   actionRow.style.display   = 'none';
        if (copySection) copySection.style.display = 'none';
        const sub   = emptyState.querySelector('.empty-sub');
        const title = emptyState.querySelector('.empty-title');
        if (title) title.textContent = t('empty.title');
        if (sub)   sub.innerHTML    = t('empty.sub');
        showRefreshBtn();
        return;
      }
      // 全部看過了 → 循環回頭，卡片還在，只是標記已看
      currentIndex = 0;
      showToast(t('empty.loop'));
      renderCards();
      return;
    }

    emptyState.style.display = 'none';
    if (actionRow) actionRow.style.display = '';
    updateCopySection();

    remaining.slice(0, 3).slice().reverse().forEach((img, revIdx) => {
      const depth = revIdx;
      const card  = buildCard(img, depth);
      cardStack.appendChild(card);
      if (depth === 0) {
        currentSwiper = new SwipeEngine(card, {
          onSwipeLeft:  () => onSwiped('left',  img),
          onSwipeRight: () => onSwiped('right', img),
        });
      }
    });
  }

  function buildCard(img, depth) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.zIndex    = 10 - depth;
    card.style.transform = `scale(${1 - depth * 0.034}) translateY(${depth * -12}px)`;
    card.style.opacity   = depth === 0 ? '1' : String(Math.max(0.4, 0.6 - depth * 0.1));

    if (depth === 0) card.classList.add('is-top');

    const isOwn  = myUploadIds.has(img.id);
    const badgeHtml = isOwn
      ? '<span class="card-mine-badge">📤 我的上傳</span>'
      : seenIds.has(img.id) ? '<span class="card-seen-badge">✓ 已看過</span>' : '';
    card.innerHTML = `
      <img src="${img.src}" alt="friend code" draggable="false" loading="lazy">
      ${depth === 0 ? `<div class="card-tap-hint">👆 ${t('hint.tap')}</div>` : ''}
      <div class="card-foot">
        <span class="card-time">${timeAgo(img.time)}</span>
        ${badgeHtml}
        <span class="card-badge">${t('card.badge')}</span>
      </div>
    `;

    // Tap to open QR — only on the top card
    if (depth === 0) {
      let _downX = 0, _downY = 0;
      card.addEventListener('pointerdown', (e) => { _downX = e.clientX; _downY = e.clientY; }, true);
      card.addEventListener('click', (e) => {
        const dx = Math.abs(e.clientX - _downX);
        const dy = Math.abs(e.clientY - _downY);
        if (dx < 12 && dy < 12) openLightbox(img.src, img);
      });
    }

    return card;
  }

  function onSwiped(dir, img) {
    isSwiping = false;
    if (img?.id) { localStorage.setItem('pokeswipe_lastSeen', img.id); saveSeenId(img.id); }
    [btnCopyCode, btnCopyDesk].forEach((btn) => btn?.classList.remove('copied'));
    currentIndex++;
    setTimeout(renderCards, 60);
  }

  /* ══════ Refresh button (after all cards seen) ══════ */
  function showRefreshBtn() {
    const existing = document.getElementById('refreshArea');
    if (existing) { existing.style.display = ''; return; }

    const area = document.createElement('div');
    area.id = 'refreshArea';
    area.className = 'refresh-area';
    area.innerHTML = `
      <button class="refresh-btn" id="refreshBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        ${t('refresh.btn')}
      </button>
      <p class="refresh-hint" id="refreshHint"></p>
    `;
    // Insert below card stack
    cardStack.insertAdjacentElement('afterend', area);
    updateRefreshBtn();
  }

  function hideRefreshBtn() {
    const el = document.getElementById('refreshArea');
    if (el) el.style.display = 'none';
  }

  function updateRefreshBtn() {
    const btn  = document.getElementById('refreshBtn');
    const hint = document.getElementById('refreshHint');
    if (!btn) return;

    const elapsed  = Math.floor((Date.now() - lastFetchTime) / 1000);
    const cooldown = REFRESH_COOLDOWN - elapsed;

    if (cooldown > 0) {
      btn.disabled = true;
      const mins = Math.floor(cooldown / 60);
      const secs = String(cooldown % 60).padStart(2, '0');
      if (hint) hint.textContent = t('refresh.cooldown', { mins, secs });
      setTimeout(updateRefreshBtn, 1000);
    } else {
      btn.disabled = false;
      if (hint) hint.textContent = t('refresh.ready');
      btn.onclick = () => {
        currentIndex = 0;
        localStorage.removeItem('pokeswipe_lastSeen');
        loadImages();
      };
    }
  }

  /* ══════ Action Buttons ══════ */
  function setupActions() {
    btnView?.addEventListener('click', () => {
      const img = images[currentIndex];
      if (img) openLightbox(img.src, img);
    });
    btnNext?.addEventListener('click', () => triggerNext());
    btnCopyCode?.addEventListener('click', () => copyCurrentCode());
    btnCopyDesk?.addEventListener('click', () => copyCurrentCode());
  }

  /* ══════ Copy Friend Code ══════ */
  function copyCurrentCode() {
    const img = images[currentIndex];
    if (!img) return;

    if (!img.friendCode) {
      openLightbox(img.src, img);
      return;
    }

    const code      = img.friendCode;
    const formatted = `${code.slice(0, 4)} ${code.slice(4, 8)} ${code.slice(8, 12)}`;

    const onSuccess = () => {
      showToast(t('copy.done'));
      [btnCopyCode, btnCopyDesk].forEach((btn) => {
        if (!btn) return;
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 2500);
      });
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(formatted).then(onSuccess).catch(() => {
        _fallbackCopy(formatted);
        onSuccess();
      });
    } else {
      _fallbackCopy(formatted);
      onSuccess();
    }
  }

  function _fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
  }

  /* ══════ Copy Section State ══════ */
  function updateCopySection() {
    if (!copySection) return;
    const img = images[currentIndex];

    copySection.style.display = '';

    const textEl = btnCopyCode?.querySelector('.copy-btn-text');

    if (img?.friendCode) {
      const code      = img.friendCode;
      const formatted = `${code.slice(0, 4)} ${code.slice(4, 8)} ${code.slice(8, 12)}`;
      if (copyCodeDisp) copyCodeDisp.textContent = formatted;
      if (textEl) textEl.textContent = t('copy.btn');
      btnCopyCode?.classList.remove('no-code');
      btnCopyDesk?.classList.remove('no-code');
    } else {
      if (copyCodeDisp) copyCodeDisp.textContent = '';
      if (textEl) textEl.textContent = t('copy.noCode');
      btnCopyCode?.classList.add('no-code');
      btnCopyDesk?.classList.add('no-code');
    }

    [btnCopyCode, btnCopyDesk].forEach((btn) => btn?.classList.remove('copied'));
  }
  function triggerNext() {
    if (isSwiping || !currentSwiper) return;
    isSwiping = true;
    currentSwiper.triggerSwipe('left');
  }

  /* ══════ Keyboard ══════ */
  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!$('#viewSwipe')?.classList.contains('active')) return;
      if (e.target.matches('input, textarea, select')) return;
      if (lightbox && !lightbox.classList.contains('hidden')) {
        if (e.key === 'Escape') closeLightbox();
        return;
      }
      // Arrow keys / A,D → Next card
      if (['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)) {
        e.preventDefault(); triggerNext(); flashKbd('left');
      }
      // C → Copy friend code
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault(); copyCurrentCode(); flashKbd('copy');
      }
      // Space / Enter → View QR code
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const img = images[currentIndex];
        if (img) { openLightbox(img.src, img); flashKbd('right'); }
      }
    });
  }
  function flashKbd(side) {
    const id = side === 'left' ? '#kbdLeft' : side === 'copy' ? '#kbdCopy' : '#kbdRight';
    const el = $(id);
    if (!el) return;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 280);
  }

  /* ══════ Lightbox ══════ */
  function setupLightbox() {
    if (!lightbox) return;
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.closest('#lightboxClose')) closeLightbox();
    });

    // Lightbox copy button
    btnLightboxCopy?.addEventListener('click', () => {
      const code = btnLightboxCopy._code;
      if (!code) return;
      const doOk = () => {
        showToast(t('copy.done'));
        btnLightboxCopy.classList.add('copied');
        setTimeout(() => btnLightboxCopy?.classList.remove('copied'), 2500);
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).then(doOk).catch(() => { _fallbackCopy(code); doOk(); });
      } else { _fallbackCopy(code); doOk(); }
    });

    // Lightbox re-scan button — runs fresh OCR on the actual image
    btnLightboxRescan?.addEventListener('click', async () => {
      const src = lightboxImg?.src;
      if (!src) return;
      if (lightboxCodeVal) lightboxCodeVal.textContent = t('lightbox.scanning');
      if (btnLightboxCopy)  btnLightboxCopy.disabled  = true;
      if (btnLightboxRescan) btnLightboxRescan.disabled = true;

      const code12 = await _rescanImage(src);

      if (btnLightboxRescan) btnLightboxRescan.disabled = false;
      if (lightbox.classList.contains('hidden')) return; // closed while scanning

      if (code12) {
        const fmt = `${code12.slice(0,4)} ${code12.slice(4,8)} ${code12.slice(8,12)}`;
        if (lightboxCodeVal) lightboxCodeVal.textContent = fmt;
        if (btnLightboxCopy) { btnLightboxCopy.disabled = false; btnLightboxCopy._code = fmt; }
      } else {
        if (lightboxCodeVal) lightboxCodeVal.textContent = t('lightbox.nocode');
      }
    });
  }

  function openLightbox(src, img = null) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Populate code bar
    if (lightboxCodeVal) lightboxCodeVal.textContent = '—';
    if (btnLightboxCopy) { btnLightboxCopy.disabled = true; btnLightboxCopy._code = null; btnLightboxCopy.classList.remove('copied'); }

    if (img?.friendCode) {
      const code = img.friendCode;
      const fmt  = `${code.slice(0,4)} ${code.slice(4,8)} ${code.slice(8,12)}`;
      if (lightboxCodeVal) lightboxCodeVal.textContent = fmt;
      if (btnLightboxCopy) { btnLightboxCopy.disabled = false; btnLightboxCopy._code = fmt; }
    }
  }

  /*
   * 從 OCR 文字中萃取 12 碼好友碼。
   * 逐行比對，防止跨行誤讀（例如用戶名末尾數字 + 下一行好友碼開頭形成假碼）。
   * 跳過全零佔位符 "000000000000"。
   */
  function _extractCode(text) {
    const lines = text.split(/\r?\n/);

    // Pass 1：找同一行內 XXXX XXXX XXXX 格式
    for (const line of lines) {
      const m = line.match(/(\d{4})\s+(\d{4})\s+(\d{4})/);
      if (m) {
        const code = m[1] + m[2] + m[3];
        if (code !== '000000000000') return code;
      }
    }

    // Pass 2：找同一行內連續 12 位數字（OCR 間距遺失時的退路）
    for (const line of lines) {
      const digits = line.replace(/\s/g, '');
      const m2 = digits.match(/\d{12}/);
      if (m2 && m2[0] !== '000000000000') return m2[0];
    }

    return null;
  }

  /* 載入 URL 圖片，裁切好友碼區域（5%–60%），灰階強化後回傳 dataURL；CORS 失敗則回傳 null */
  function _preprocessImageUrl(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const isPortrait = img.height > img.width;
        if (!isPortrait) { resolve(null); return; }
        const srcY  = Math.round(img.height * 0.05);
        const srcH  = Math.round(img.height * 0.55);
        const MAX   = 1400;
        const scale = img.width > MAX ? MAX / img.width : 1;
        const c     = document.createElement('canvas');
        c.width     = Math.round(img.width * scale);
        c.height    = Math.round(srcH * scale);
        const ctx   = c.getContext('2d');
        ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, c.width, c.height);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const px = id.data;
        for (let i = 0; i < px.length; i += 4) {
          const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          const v = Math.min(255, Math.max(0, (g - 128) * 1.8 + 128));
          px[i] = px[i + 1] = px[i + 2] = v;
        }
        ctx.putImageData(id, 0, 0);
        resolve(c.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /* Run OCR on an image URL and return the 12-digit code or null */
  async function _rescanImage(src) {
    try {
      await OcrVerify._load();
      const processedUrl = await _preprocessImageUrl(src);
      const worker = await Tesseract.createWorker({ logger: () => {} });
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789 ',
        tessedit_pageseg_mode:   '11',
      });
      const { data } = await Promise.race([
        worker.recognize(processedUrl || src),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 25_000)),
      ]);
      await worker.terminate();

      return _extractCode(data.text);
    } catch {
      return null;
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ══════ Helpers ══════ */
  function timeAgo(iso) {
    if (!iso) return '';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)     return '剛剛';
    if (s < 3600)   return Math.floor(s / 60)    + ' 分鐘前';
    if (s < 86400)  return Math.floor(s / 3600)  + ' 小時前';
    if (s < 604800) return Math.floor(s / 86400) + ' 天前';
    return Math.floor(s / 604800) + ' 週前';
  }

  function showToast(msg) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  /* ══════ 圖片 SHA-256 hash（跨裝置去重，不依賴 OCR） ══════ */
  async function computeHash(file) {
    try {
      const buf     = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hashBuf))
        .slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch { return null; }
  }

  /* ══════ 已看過 ID 清單 ══════ */
  function loadSeenIds() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
    catch { return new Set(); }
  }
  function saveSeenId(id) {
    seenIds.add(id);
    try {
      const arr = [...seenIds];
      if (arr.length > 500) arr.splice(0, arr.length - 500);
      localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
    } catch {}
  }

  /* ══════ 軟刪除輔助 ══════ */
  function getDeleted() {
    try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]')); }
    catch { return new Set(); }
  }
  function markDeleted(id) {
    const s = getDeleted();
    s.add(id);
    try { localStorage.setItem(DELETED_KEY, JSON.stringify([...s])); } catch {}
  }

  /* ══════ 我的上傳 ID 清單（本裝置 localStorage） ══════ */
  function getMyIds() {
    try { return new Set(JSON.parse(localStorage.getItem(MY_IDS_KEY) || '[]')); }
    catch { return new Set(); }
  }
  function saveMyId(publicId) {
    try {
      const list = JSON.parse(localStorage.getItem(MY_IDS_KEY) || '[]');
      if (!list.includes(publicId)) {
        list.push(publicId);
        if (list.length > 100) list.shift();
        localStorage.setItem(MY_IDS_KEY, JSON.stringify(list));
      }
    } catch {}
  }

  /* ══════ 我的上傳管理面板 ══════ */
  function renderMyUploads() {
    const container = document.getElementById('myUploads');
    if (!container) return;

    if (myImages.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <p class="my-uploads-label">${t('myUploads.title')}</p>
      <div class="my-uploads-grid"></div>
    `;
    const grid = container.querySelector('.my-uploads-grid');

    myImages.forEach((img) => {
      const item = document.createElement('div');
      item.className = 'my-upload-item';

      const delSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>`;

      item.innerHTML = `
        <img src="${img.thumb || img.src}" alt="" loading="lazy">
        <button class="my-upload-del" aria-label="${t('delete.btn')}">${delSvg}</button>
      `;

      /* 兩次點擊確認刪除 */
      let armed = false, timer;
      const btn = item.querySelector('.my-upload-del');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!armed) {
          armed = true;
          btn.classList.add('armed');
          btn.textContent = t('delete.confirm');
          timer = setTimeout(() => {
            armed = false;
            btn.classList.remove('armed');
            btn.innerHTML = delSvg;
          }, 2500);
        } else {
          clearTimeout(timer);
          // 直接從所有陣列移除，不做軟刪除
          myImages    = myImages.filter((mi) => mi.id !== img.id);
          images      = images.filter((i)  => i.id  !== img.id);
          myUploadIds.delete(img.id);
          knownCodes.delete(img.friendCode);
          // 清除本機好友碼 dedup，讓刪除後可重新上傳
          if (img.friendCode) {
            try {
              const list = JSON.parse(localStorage.getItem(OcrVerify.KEY) || '[]');
              localStorage.setItem(OcrVerify.KEY,
                JSON.stringify(list.filter((c) => c !== img.friendCode)));
            } catch {}
          }
          // 從 myIds localStorage 移除
          try {
            const myList = JSON.parse(localStorage.getItem(MY_IDS_KEY) || '[]');
            localStorage.setItem(MY_IDS_KEY,
              JSON.stringify(myList.filter((id) => id !== img.id)));
          } catch {}
          item.style.cssText = 'opacity:0;transform:scale(0.8);transition:all .22s';
          setTimeout(() => {
            renderMyUploads();
            renderCards();
            showToast(t('delete.done'));
          }, 240);
        }
      });

      grid.appendChild(item);
    });
  }

  /* ══════ Go ══════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
