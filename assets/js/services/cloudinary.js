/* ============================================
   PokeSwipe – Cloudinary Integration v2
   ============================================
   設定方式：
   1. 到 https://cloudinary.com 免費註冊
   2. Dashboard → 複製 Cloud Name
   3. Settings → Upload → Add upload preset
      - Signing Mode: Unsigned   ← 必須是這個！
      - Folder: pokeswipe
      - 儲存
   4. Settings → Security → 勾選「Allow list of resources by tag」
   5. 把下方兩個值換成你自己的
   ============================================ */

const CLOUDINARY_CONFIG = {
  CLOUD_NAME:    'dpxp3abrf',       // ← 你的 cloud name
  UPLOAD_PRESET: 'unsigned_ios',    // ← 必須是 Unsigned 模式的 preset
  FOLDER:        'pokeswipe',
  // ⚠️ 安全警告：API_KEY / API_SECRET 絕對不能放在前端 JS！
  // 任何訪客都能在開發者工具看到原始碼。如果要支援真刪除，
  // 必須改用伺服器端（Netlify Function / Cloudflare Worker）代為呼叫，
  // 並在伺服器端環境變數設定。詳見 README。
};

/* ─────────────────────────────────────────
   上傳圖片（附帶 tag + 使用者匿名 ID）
   ───────────────────────────────────────── */
function cloudinaryUploadWithTag(file, onProgress, friendCode = null, imageHash = null) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append('file',           file);
    formData.append('upload_preset',  CLOUDINARY_CONFIG.UPLOAD_PRESET);
    formData.append('folder',         CLOUDINARY_CONFIG.FOLDER);
    // public_id = fc_XXXXXXXXXXXX → 好友碼當檔名，Cloudinary 天然去重 + 從 public_id 解碼
    if (friendCode) formData.append('public_id', `fc_${friendCode}`);

    // tags: pokeswipe（必要）+ hash_XXXXXXXXXXXXXXXX（圖片 hash，OCR 失敗也能去重）
    const tags = ['pokeswipe'];
    if (imageHash) tags.push(`hash_${imageHash}`);
    formData.append('tags', tags.join(','));

    // context: 只存 uploader_id（給日後 Admin API 查用，tag list 不需要）
    if (typeof Identity !== 'undefined') {
      formData.append('context', `uploader_id=${Identity.get()}`);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let msg = `上傳失敗 (HTTP ${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body.error?.message) msg = body.error.message;
        } catch (_) { /* ignore */ }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('網路錯誤，請確認網路連線')));
    xhr.addEventListener('abort', () => reject(new Error('上傳已取消')));

    xhr.send(formData);
  });
}

/* ─────────────────────────────────────────
   取得所有以 tag "pokeswipe" 標記的圖片
   需要在 Cloudinary Security 設定開啟：
   "Allow list of resources by tag"
   ───────────────────────────────────────── */
async function cloudinaryFetchImages(tag = 'pokeswipe') {
  const url = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/list/${tag}.json`;

  try {
    const res = await fetch(url);

    // 401 / 403 → "Allow list of resources by tag" 沒有開啟
    if (res.status === 401 || res.status === 403) {
      _notifyFetchError('list_disabled');
      return null;
    }

    // 404 → tag 不存在（還沒有圖片上傳並帶這個 tag）
    if (res.status === 404) {
      return [];
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // 成功 → 清掉任何舊的錯誤提示
    _clearFetchError();

    const base = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload`;

    return (data.resources || []).map((img) => {
      // tag list API 會回傳 tags 陣列，但不回傳 context
      // 好友碼從 tag code_XXXXXXXXXXXX 解出；uploader 從 localStorage 判斷（app.js 處理）
      const tags    = img.tags || [];
      const hashTag = tags.find((t) => t.startsWith('hash_'));
      const imageHash = hashTag ? hashTag.slice(5) : null;

      // 好友碼從 public_id 解出（fc_XXXXXXXXXXXX），
      // 舊圖沒有此格式則 fallback 到 code_ tag（向下相容）
      const fcFromId  = img.public_id.match(/fc_(\d{12})(?:$|[^0-9])/);
      const codeTag   = !fcFromId && tags.find((t) => t.startsWith('code_'));
      const friendCode = fcFromId ? fcFromId[1] : (codeTag ? codeTag.slice(5) : null);

      return {
        id:         img.public_id,
        src:        `${base}/w_800,q_auto,f_auto/${img.public_id}`,
        thumb:      `${base}/w_400,q_auto,f_auto/${img.public_id}`,
        time:       img.created_at,
        friendCode,   // 用於建 knownCodes（跨裝置去重）
        imageHash,    // 用於建 knownHashes（圖片內容去重，無痕也有效）
      };
    });

  } catch (err) {
    console.warn('[Cloudinary] fetch error:', err.message);
    _notifyFetchError('network');
    return null;
  }
}

/* 在頁面上顯示 Cloudinary 設定問題的提示 */
function _notifyFetchError(type) {
  const existing = document.getElementById('cloudinaryError');
  if (existing) return; // 只顯示一次

  const banner = document.createElement('div');
  banner.id = 'cloudinaryError';
  banner.style.cssText = `
    position:fixed; top:0; left:0; right:0; z-index:9999;
    background:#b82a0a; color:#fff; font-size:13px; font-weight:700;
    padding:10px 16px; text-align:center; line-height:1.5;
  `;

  if (type === 'list_disabled') {
    banner.innerHTML = `
      ⚠️ Cloudinary 圖片列表 API 未開啟，跨裝置同步無法運作。
      請到 <strong>Cloudinary → Settings → Security</strong>
      勾選 <strong>"Allow list of resources by tag"</strong>
      <button onclick="this.parentElement.remove()" style="
        margin-left:12px; background:rgba(255,255,255,0.2);
        border:none; color:#fff; border-radius:6px;
        padding:3px 10px; cursor:pointer; font-weight:700;
      ">✕</button>
    `;
  } else {
    banner.innerHTML = `
      ⚠️ 無法連接 Cloudinary，目前顯示本機快取。請確認網路連線。
      <button onclick="this.parentElement.remove()" style="
        margin-left:12px; background:rgba(255,255,255,0.2);
        border:none; color:#fff; border-radius:6px;
        padding:3px 10px; cursor:pointer; font-weight:700;
      ">✕</button>
    `;
  }

  document.body.prepend(banner);
}

function _clearFetchError() {
  document.getElementById('cloudinaryError')?.remove();
}

/* ─────────────────────────────────────────
   真實刪除 Cloudinary 圖片（需要伺服器端代理）
   - 目前未啟用：永遠回傳 false → 前端走「軟刪除」（本機隱藏）
   - 若要啟用，請新增 Netlify Function /api/cloudinary-delete，
     在伺服器端用環境變數 CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
     呼叫 Cloudinary Admin API，回傳結果給前端。
   ───────────────────────────────────────── */
async function cloudinaryDeleteImage(_publicId) {
  // 安全：絕對不在前端使用 API_SECRET
  return false;
}


