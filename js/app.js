/* ============================================
   PokeSwipe – App v4  (i18n + UX upgrades)
   ============================================ */

(function () {
  'use strict';

  /* ══════ State ══════ */
  let images           = [];
  let currentIndex     = 0;
  let currentSwiper    = null;
  let isSwiping        = false;
  let isConfigured     = false;
  let _lastFocusedEl   = null;

  /* ══════ DOM refs ══════ */
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

  /* ══════ Init ══════ */
  function init() {
    isConfigured =
      typeof CLOUDINARY_CONFIG !== 'undefined' &&
      CLOUDINARY_CONFIG.CLOUD_NAME !== 'YOUR_CLOUD_NAME' &&
      CLOUDINARY_CONFIG.UPLOAD_PRESET !== 'YOUR_PRESET';

    if (!isConfigured && configNotice) configNotice.classList.add('visible');

    // 顯示匿名 Trainer ID
    if (trainerChip && typeof Identity !== 'undefined') {
      trainerChip.textContent = '🎮 ' + Identity.short();
      trainerChip.title = 'Trainer ID: ' + Identity.get();
    }

    setupTabs();
    setupUpload();
    setupActions();
    setupKeyboard();
    setupLightbox();

    // 語言切換時刷新動態文字
    document.addEventListener('langchange', refreshDynamic);

    loadImages();
  }

  /* ══════ Language change hook ══════ */
  function refreshDynamic() {
    // 刷新上傳按鈕文字（如果還在 idle 狀態）
    if (uploadBtn && uploadBtn.disabled && uploadBtnTxt) {
      uploadBtnTxt.textContent = t('upload.idle');
    }
    // 重新渲染卡片（更新 stamp 文字、時間、badge 等動態字串）
    renderCards();
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
      });
    });
  }

  /* ══════ Upload ══════ */
  let selectedFile = null;

  function setupUpload() {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
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
    setUploading(true);

    try {
      if (isConfigured) {
        await cloudinaryUploadWithTag(selectedFile, (pct) => {
          if (progressFill) progressFill.style.width = (pct * 100) + '%';
        });
        if (progressFill) progressFill.style.width = '100%';
        showToast(t('toast.uploaded'));
        await loadImages();
      } else {
        await localUpload(selectedFile);
        showToast(t('toast.local'));
      }

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

          images.unshift({
            id:         Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            src:        dataUrl,
            time:       new Date().toISOString(),
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
    uploadBtn.disabled = true;
    uploadBtnTxt.textContent = t('upload.idle');
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
    // 注意：click 監聽器已在 setupUpload() 綁定在 dropZone 本身，
    // innerHTML 替換不影響父元素的監聽器，不需要重複加。
  }

  /* ══════ Load images ══════ */
  async function loadImages() {
    showSkeleton();

    if (isConfigured) {
      const cloud = await cloudinaryFetchImages('pokeswipe');
      if (cloud) images = cloud;
      else loadLocal();
    } else {
      loadLocal();
    }

    // 過濾掉自己上傳的
    const myId = typeof Identity !== 'undefined' ? Identity.get() : null;
    if (myId) images = images.filter((img) => img.uploaderId !== myId);

    // 最新優先
    images.sort((a, b) => new Date(b.time) - new Date(a.time));

    // 斷點續看
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

    const remaining = images.slice(currentIndex);

    if (remaining.length === 0) {
      emptyState.style.display = '';
      if (actionRow) actionRow.style.display = 'none';
      const sub = emptyState.querySelector('.empty-sub');
      if (sub) sub.innerHTML = images.length > 0 ? t('empty.done') : t('empty.sub');
      const title = emptyState.querySelector('.empty-title');
      if (title) title.textContent = t('empty.title');
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

    // src 透過 property 設定，避免 innerHTML 注入風險
    // 頂層卡片（depth 0）用 eager 讓瀏覽器立即載入
    card.innerHTML = `
      <img alt="friend code" draggable="false" loading="${depth === 0 ? 'eager' : 'lazy'}">
      <div class="swipe-stamp swipe-stamp--skip">${t('hint.skip')}</div>
      <div class="swipe-stamp swipe-stamp--add">${t('hint.add')}!</div>
      <div class="card-foot">
        <span class="card-time">${timeAgo(img.time)}</span>
        <span class="card-badge">${t('card.badge')}</span>
      </div>
    `;
    card.querySelector('img').src = img.src;
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
      if (e.target === lightbox || e.target.id === 'lightboxClose' ||
          e.target.closest('#lightboxClose')) closeLightbox();
    });

    // Focus trap：Tab / Shift+Tab 只在 lightbox 內循環
    lightbox.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = [...lightbox.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )].filter((el) => !el.disabled);
      if (focusable.length === 0) { e.preventDefault(); return; }
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    _lastFocusedEl = document.activeElement;
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // 焦點移到關閉按鈕，讓鍵盤使用者可以立即操作
    const closeBtn = lightbox.querySelector('#lightboxClose');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
    // 還原焦點到觸發 lightbox 的元素
    if (_lastFocusedEl) { _lastFocusedEl.focus(); _lastFocusedEl = null; }
  }

  /* ══════ Helpers ══════ */
  function timeAgo(iso) {
    if (!iso) return '';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)     return t('time.justNow');
    if (s < 3600)   return t('time.min',  { n: Math.floor(s / 60) });
    if (s < 86400)  return t('time.hr',   { n: Math.floor(s / 3600) });
    if (s < 604800) return t('time.day',  { n: Math.floor(s / 86400) });
    return t('time.week', { n: Math.floor(s / 604800) });
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
