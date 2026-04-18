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
  const btnSkip      = $('#btnSkip');
  const btnAdd       = $('#btnAdd');
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

  function pickFile(file) {
    if (!file.type.startsWith('image/')) { showToast(t('toast.err.type')); return; }
    if (file.size > 15 * 1024 * 1024)   { showToast(t('toast.err.size')); return; }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      dropZone.classList.add('has-preview');
      dropZone.innerHTML = `<img src="${e.target.result}" alt="preview">`;
      uploadBtn.disabled = false;
      uploadBtnTxt.textContent = t('upload.ready');
    };
    reader.readAsDataURL(file);
  }

  async function doUpload() {
    if (!selectedFile) return;
    if (!UploadLimit.canUpload()) { showToast('今日上傳次數已用完 🌙'); return; }

    setUploading(true);

    try {
      if (isConfigured) {
        await cloudinaryUploadWithTag(selectedFile, (pct) => {
          if (progressFill) progressFill.style.width = (pct * 100) + '%';
        });
        if (progressFill) progressFill.style.width = '100%';
        showToast(t('toast.uploaded'));
        UploadLimit.increment();
        await loadImages();
      } else {
        await localUpload(selectedFile);
        showToast(t('toast.local'));
        UploadLimit.increment();
      }

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
    fileInput.value = '';
    // Only re-enable if quota allows
    uploadBtn.disabled = !UploadLimit.canUpload();
    uploadBtnTxt.textContent = UploadLimit.canUpload() ? t('upload.idle') : t('quota.btn.limit');
    dropZone.classList.remove('has-preview');
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
    dropZone.addEventListener('click', () => {
      if (!UploadLimit.canUpload()) { showToast(t('quota.empty')); return; }
      fileInput.click();
    });
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
    const total     = images.length;
    const remaining = images.slice(currentIndex).length;
    if (swipeCount) swipeCount.innerHTML = t('stats', { total, left: remaining });
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

    card.innerHTML = `
      <img src="${img.src}" alt="friend code" draggable="false" loading="lazy">
      <div class="swipe-stamp swipe-stamp--skip">${t('hint.skip')}</div>
      <div class="swipe-stamp swipe-stamp--add">${t('hint.add')}!</div>
      <div class="card-foot">
        <span class="card-time">${timeAgo(img.time)}</span>
        <span class="card-badge">${t('card.badge')}</span>
      </div>
    `;
    return card;
  }

  function onSwiped(dir, img) {
    isSwiping = false;
    if (img?.id) localStorage.setItem('pokeswipe_lastSeen', img.id);
    if (dir === 'right') {
      showToast(t('toast.swipeRight'));
      openLightbox(img.src);
    }
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
    btnSkip?.addEventListener('click', () => triggerSwipe('left'));
    btnAdd?.addEventListener('click',  () => triggerSwipe('right'));
  }
  function triggerSwipe(dir) {
    if (isSwiping || !currentSwiper) return;
    isSwiping = true;
    currentSwiper.triggerSwipe(dir);
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
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') {
        e.preventDefault(); triggerSwipe('left');  flashKbd('left');
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault(); triggerSwipe('right'); flashKbd('right');
      }
    });
  }
  function flashKbd(dir) {
    const el = $(dir === 'left' ? '#kbdLeft' : '#kbdRight');
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
