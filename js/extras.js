/* ============================================================
   PokeSwipe — extras.js
   Cookie banner · Global error handler · Offline detection
   Version: v6
   ============================================================ */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // 1) COOKIE CONSENT BANNER
  //    儲存於 localStorage，鍵名：pokeswipe_cookie_ack
  // ─────────────────────────────────────────────────────────
  function initCookieBanner() {
    var banner = document.getElementById('cookieBanner');
    var acceptBtn = document.getElementById('cookieAccept');
    if (!banner || !acceptBtn) return;

    var KEY = 'pokeswipe_cookie_ack';
    var acked = false;
    try { acked = localStorage.getItem(KEY) === '1'; } catch (e) { /* private mode */ }

    if (!acked) {
      // 延遲 600ms 出現，避免影響 LCP
      setTimeout(function () { banner.hidden = false; }, 600);
    }

    acceptBtn.addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      banner.style.transition = 'opacity .3s, transform .3s';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(20px)';
      setTimeout(function () { banner.hidden = true; }, 320);
    });
  }

  // ─────────────────────────────────────────────────────────
  // 2) NETWORK / OFFLINE TOAST
  //    在頂端浮現「離線 / 已連線」提示
  // ─────────────────────────────────────────────────────────
  var netToast = null;
  var netHideTimer = null;

  function ensureNetToast() {
    if (netToast) return netToast;
    netToast = document.createElement('div');
    netToast.className = 'network-toast';
    netToast.setAttribute('role', 'status');
    netToast.setAttribute('aria-live', 'polite');
    document.body.appendChild(netToast);
    return netToast;
  }

  function showNetToast(message, isOnline) {
    var t = ensureNetToast();
    t.textContent = message;
    t.classList.toggle('online', !!isOnline);
    requestAnimationFrame(function () { t.classList.add('show'); });
    if (netHideTimer) clearTimeout(netHideTimer);
    netHideTimer = setTimeout(function () {
      t.classList.remove('show');
    }, isOnline ? 2200 : 4000);
  }

  function initNetworkDetection() {
    // 初始檢查
    if (navigator.onLine === false) {
      // 等 DOM 完全 ready 才顯示
      setTimeout(function () { showNetToast('⚠️ 目前離線 — 部分功能無法使用', false); }, 800);
    }
    window.addEventListener('offline', function () {
      showNetToast('⚠️ 已離線 — 上傳與滑動會暫停', false);
    });
    window.addEventListener('online', function () {
      showNetToast('✅ 已重新連線', true);
    });
  }

  // ─────────────────────────────────────────────────────────
  // 3) GLOBAL ERROR HANDLERS
  //    捕捉未處理的 JS error 與 Promise rejection
  //    僅在 console 印出 + 用 toast 提醒，不影響使用者操作
  // ─────────────────────────────────────────────────────────
  function showSilentToast(msg) {
    // 嘗試使用既有的 toast 系統
    var t = document.getElementById('toast');
    if (t) {
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function () { t.classList.remove('show'); }, 3500);
    } else {
      // fallback：用 network-toast
      showNetToast(msg, false);
    }
  }

  function initErrorHandlers() {
    // 過濾掉常見的「無害」錯誤訊息
    var IGNORED = [
      'ResizeObserver loop',
      'Script error',
      'Non-Error promise rejection captured',
      'Load failed' // Safari fetch abort
    ];
    function isIgnored(msg) {
      if (!msg) return true;
      msg = String(msg);
      for (var i = 0; i < IGNORED.length; i++) {
        if (msg.indexOf(IGNORED[i]) !== -1) return true;
      }
      return false;
    }

    var errorCount = 0;
    var ERROR_RATE_LIMIT = 3; // 同一 session 最多顯示 3 次

    window.addEventListener('error', function (event) {
      var msg = (event.error && event.error.message) || event.message || '';
      if (isIgnored(msg)) return;

      // 只在 console 完整記錄，UI 顯示精簡訊息
      try { console.error('[PokeSwipe] runtime error:', msg, event); } catch (e) {}

      errorCount++;
      if (errorCount <= ERROR_RATE_LIMIT) {
        showSilentToast('⚠️ 發生小錯誤，操作可能受影響');
      }
    });

    window.addEventListener('unhandledrejection', function (event) {
      var reason = event.reason;
      var msg = (reason && (reason.message || reason)) || '';
      if (isIgnored(msg)) return;

      try { console.error('[PokeSwipe] unhandled promise rejection:', reason); } catch (e) {}

      errorCount++;
      if (errorCount <= ERROR_RATE_LIMIT) {
        showSilentToast('⚠️ 發生小錯誤，操作可能受影響');
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4) PAGE VISIBILITY — 偵測離開分頁時間，回來提示重整
  //    （>30 分鐘離開，圖庫可能過期）
  // ─────────────────────────────────────────────────────────
  function initVisibilityCheck() {
    var leaveAt = 0;
    var STALE_MS = 30 * 60 * 1000; // 30 分鐘

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        leaveAt = Date.now();
      } else if (leaveAt && (Date.now() - leaveAt > STALE_MS)) {
        leaveAt = 0;
        // 提示但不強制
        if (window.console && console.info) {
          console.info('[PokeSwipe] page returned after >30 min, content may be stale');
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // 5) EXTERNAL LINK HARDENING
  //    確保所有 target="_blank" 連結都有 noopener
  //    (防止 reverse-tabnabbing 攻擊)
  // ─────────────────────────────────────────────────────────
  function hardenExternalLinks() {
    var links = document.querySelectorAll('a[target="_blank"]');
    for (var i = 0; i < links.length; i++) {
      var rel = links[i].getAttribute('rel') || '';
      if (rel.indexOf('noopener') === -1) {
        rel = (rel + ' noopener').trim();
      }
      if (rel.indexOf('noreferrer') === -1) {
        rel = (rel + ' noreferrer').trim();
      }
      links[i].setAttribute('rel', rel);
    }
  }

  // ─────────────────────────────────────────────────────────
  // BOOTSTRAP
  // ─────────────────────────────────────────────────────────
  function boot() {
    try { initCookieBanner(); } catch (e) { console.error(e); }
    try { initNetworkDetection(); } catch (e) { console.error(e); }
    try { initErrorHandlers(); } catch (e) { console.error(e); }
    try { initVisibilityCheck(); } catch (e) { console.error(e); }
    try { hardenExternalLinks(); } catch (e) { console.error(e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
