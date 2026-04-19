/* ============================================
   PokeSwipe – App v5
   新增：上傳限流、刷完後重整體驗、桌面優化
   ============================================ */

(function () {
  'use strict';

  /* ══════ Constants ══════ */
  const UPLOAD_LIMIT    = 5;          // 每台設備每天最多上傳幾張
  const REFRESH_COOLDOWN = 5 * 60;   // 重整冷卻秒數（5 分鐘）

  /* ══════ State ══════ */
  let images        = [];
  let currentIndex  = 0;
  let currentSwiper = null;
  let isSwiping     = false;
  let isConfigured  = false;
  let lastFetchTime = 0;

  /* ══════ DOM ══════ */
  const $ = (s) => document.querySelector(s);

  const cardStack    = $('#cardStack');
  const emptyState   = $('#emptyState');
  const actionRow    = $('#actionRow');
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
  const lightbox     = $('#lightbox');
  const lightboxImg  = $('#lightboxImg');
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
     OCR Friend-Code Verifier  v2
     優化：
     · 灰階 + 對比強化預處理 → 準確率↑
     · Tesseract 數字 whitelist + sparse PSM → 速度 2-3x↑
     · 進度回調 → UI 即時反饋
     · 25s 超時保護 (fail-open)
     · 防並發（同時選兩張圖）
     · 跨裝置去重（Cloudinary tag 查詢）
  ══════════════════════════════════════════ */
  const OcrVerify = {
    KEY:          'pokeswipe_codes',  // localStorage → 已上傳的 12 位碼陣列
    _pendingCode: null,               // 暫存碼，上傳成功後才寫 localStorage
    _scanning:    false,              // 防並發旗標
    _loadPromise: null,               // 防重複注入 script

    /* ── 懶加載 Tesseract.js（防重複注入）── */
    _load() {
      if (window.Tesseract) return Promise.resolve();
      if (this._loadPromise)  return this._loadPromise;
      this._loadPromise = new Promise((resolve, reject) => {
        const s  = document.createElement('script');
        s.src    = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
        s.onload = () => { this._loadPromise = null; resolve(); };
        s.onerror = () => { this._loadPromise = null; reject(new Error('load failed')); };
        document.head.appendChild(s);
      });
      return this._loadPromise;
    },

    /* ── 圖片預處理：縮圖 + 灰階 + 對比強化 ── */
    _preprocess(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const MAX = 1400;
            const scale = img.width > MAX ? MAX / img.width : 1;
            const c   = document.createElement('canvas');
            c.width   = Math.round(img.width  * scale);
            c.height  = Math.round(img.height * scale);
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, c.width, c.height);
            // 灰階 + 對比強化（factor 1.8）→ 數字更清晰
            const id = ctx.getImageData(0, 0, c.width, c.height);
            const px = id.data;
            for (let i = 0; i < px.length; i += 4) {
              const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
              const b = Math.min(255, Math.max(0, (g - 128) * 1.8 + 128));
              px[i] = px[i + 1] = px[i + 2] = b;
            }
            ctx.putImageData(id, 0, 0);
            resolve(c.toDataURL('image/jpeg', 0.9));
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    },

    /* ── 本機去重 ── */
    _isDuplicate(code12) {
      try {
        return JSON.parse(localStorage.getItem(this.KEY) || '[]').includes(code12);
      } catch { return false; }
    },

    /* ── 上傳成功後呼叫，永久記錄此碼 ── */
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

    /* ── 主掃描函式 ──
       onProgress(0-100)  : 辨識進度回調
       checkCloud(code12) : 跨裝置去重（Cloudinary），選填
    ── */
    async scan(file, onProgress, checkCloud) {
      const TIMEOUT = 25_000;

      /* 1. 預處理 */
      const dataUrl = await this._preprocess(file);

      /* 2. 載入 Tesseract（fail-open） */
      try { await this._load(); }
      catch { return { ok: true, skipped: true }; }

      /* 3. OCR（數字 whitelist + sparse PSM → 速度快、準確高） */
      let text = '';
      try {
        const worker = await Tesseract.createWorker({
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              onProgress(Math.round(m.progress * 100));
            }
          },
        });
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789 ',
          tessedit_pageseg_mode:   '11',   // sparse text
        });

        const recog   = worker.recognize(dataUrl);
        const timeout = new Promise((_, rej) =>
          setTimeout(() => rej(new Error('timeout')), TIMEOUT));

        const { data } = await Promise.race([recog, timeout]);
        text = data.text;
        await worker.terminate();
      } catch {
        return { ok: true, skipped: true };   // 超時或異常：fail-open
      }

      /* 4. 比對好友碼格式：XXXX XXXX XXXX */
      let code12 = null;
      const m = text.match(/(\d{4})\s+(\d{4})\s+(\d{4})/);
      if (m) {
        code12 = m[1] + m[2] + m[3];
      } else {
        // OCR 可能把空白吃掉 → 找連續 12 位
        const merged = text.replace(/\s/g, '');
        const m2 = merged.match(/\d{12}/);
        if (m2) code12 = m2[0];
      }

      if (!code12) return { ok: false, reason: 'notFound' };

      /* 5. 本機去重 */
      if (this._isDuplicate(code12)) return { ok: false, reason: 'duplicate' };

      /* 6. 跨裝置去重（Cloudinary tag 查詢，選填） */
      if (checkCloud) {
        try {
          const existsRemote = await checkCloud(code12);
          if (existsRemote) return { ok: false, reason: 'duplicate' };
        } catch { /* 網路失敗：略過此步，不阻擋上傳 */ }
      }

      this._pendingCode = code12;
      return { ok: true };
    },

    /* 取得要附在 Cloudinary upload 的 tag */
    codeTag() {
      return this._pendingCode ? `code_${this._pendingCode}` : null;
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
        if (tab === 'swipe') renderCards();
        if (tab === 'upload') UploadLimit.updateUI();
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

    OcrVerify._scanning = true;
    selectedFile = null;
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

    /* 跨裝置去重（只在 Cloudinary 已設定時啟用） */
    const cloudCheck = isConfigured
      ? (code12) => cloudinaryCheckCodeTag(code12)
      : null;

    const result = await OcrVerify.scan(file, onProgress, cloudCheck);
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
        const extraTags = OcrVerify.codeTag() ? [OcrVerify.codeTag()] : [];
        await cloudinaryUploadWithTag(selectedFile, (pct) => {
          if (progressFill) progressFill.style.width = (pct * 100) + '%';
        }, extraTags);
        if (progressFill) progressFill.style.width = '100%';
        showToast(t('toast.uploaded'));
        UploadLimit.increment();
        await loadImages();
      } else {
        await localUpload(selectedFile);
        showToast(t('toast.local'));
        UploadLimit.increment();
      }

      OcrVerify.saveCode();        // 記錄此好友碼，防止重複上傳
      UploadLimit.updateUI();
      resetUploadUI();
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

  function localUpload(file) {
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

    if (isConfigured) {
      const cloud = await cloudinaryFetchImages('pokeswipe');
      if (cloud) images = cloud;
      else loadLocal();
    } else {
      loadLocal();
    }

    const myId = typeof Identity !== 'undefined' ? Identity.get() : null;
    if (myId) images = images.filter((img) => img.uploaderId !== myId);

    images.sort((a, b) => new Date(b.time) - new Date(a.time));

    const lastId = localStorage.getItem('pokeswipe_lastSeen');
    if (lastId) {
      const idx = images.findIndex((img) => img.id === lastId);
      currentIndex = idx > -1 ? idx + 1 : 0;
    } else {
      currentIndex = 0;
    }

    renderCards();
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
    if (actionRow) actionRow.style.display = 'none';
    hideRefreshBtn();
  }

  function updateStats() {
    const total = images.length;
    const MAX_DOTS = 12;   // 超過就只靠進度條，不顯示圓點

    /* 圓點指示器 */
    if (swipeCount) {
      if (total > 0 && total <= MAX_DOTS) {
        swipeCount.innerHTML = Array.from({ length: total }, (_, i) => {
          const cls = i < currentIndex  ? 'swipe-dot--seen'
                    : i === currentIndex ? 'swipe-dot--current'
                    :                      'swipe-dot--unseen';
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
      emptyState.style.display = '';
      if (actionRow) actionRow.style.display = 'none';
      const sub   = emptyState.querySelector('.empty-sub');
      const title = emptyState.querySelector('.empty-title');
      if (title) title.textContent = t('empty.title');
      if (sub)   sub.innerHTML    = images.length > 0 ? t('empty.done') : t('empty.sub');
      showRefreshBtn();
      return;
    }

    emptyState.style.display = 'none';
    if (actionRow) actionRow.style.display = '';

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

    card.innerHTML = `
      <img src="${img.src}" alt="friend code" draggable="false" loading="lazy">
      ${depth === 0 ? `<div class="card-tap-hint">👆 ${t('hint.tap')}</div>` : ''}
      <div class="card-foot">
        <span class="card-time">${timeAgo(img.time)}</span>
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
        if (dx < 12 && dy < 12) openLightbox(img.src);
      });
    }

    return card;
  }

  function onSwiped(dir, img) {
    isSwiping = false;
    if (img?.id) localStorage.setItem('pokeswipe_lastSeen', img.id);
    // Both directions just advance — user taps card to view QR
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
    // View QR: open lightbox for current top card
    btnView?.addEventListener('click', () => {
      const img = images[currentIndex];
      if (img) openLightbox(img.src);
    });
    // Next: advance to the next card
    btnNext?.addEventListener('click', () => triggerNext());
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
      // Arrow keys / A,D / Space → Next card
      if (['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)) {
        e.preventDefault(); triggerNext(); flashKbd('left');
      }
      // Space / Enter → View QR code
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const img = images[currentIndex];
        if (img) { openLightbox(img.src); flashKbd('right'); }
      }
    });
  }
  function flashKbd(side) {
    const el = $(side === 'left' ? '#kbdLeft' : '#kbdRight');
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
  }
  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
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

  /* ══════ Go ══════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
