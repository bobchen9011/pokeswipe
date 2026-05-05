# PokeSwipe — Pokémon GO 好友碼交換平台

> 免費、匿名、不需註冊。上傳訓練家代碼截圖、左右滑動瀏覽、一鍵複製加好友。

🌐 **線上版**：https://pokefriendswipe.netlify.app/

## 特色

- ✅ **完全免費** — 沒有付費功能、沒有訂閱
- 🔒 **完全匿名** — 不收 Email、不要密碼、不存 IP，只有隨機 Trainer ID 存在 localStorage
- 🌍 **5 種語言** — 繁中、English、日本語、Español、Português
- 🤖 **智慧辨識** — Tesseract.js OCR + jsQR QR Code 雙重驗證
- 🚀 **純靜態網站** — Vanilla JS，無框架、無建置步驟、秒上線
- 🛡️ **完整安全標頭** — CSP、HSTS、X-Frame-Options、Permissions-Policy

## 檔案結構

```
pokeswipe/
├── index.html              # 主頁
├── about.html              # 關於頁
├── faq.html                # 常見問題（內含 JSON-LD FAQPage schema）
├── contact.html            # 聯絡頁
├── terms.html              # 使用條款
├── privacy.html            # 隱私政策
├── 404.html                # 自訂 404
├── css/
│   └── style.css           # 全部樣式（含內容頁、頁尾、Cookie banner）
├── js/
│   ├── identity.js         # 匿名 Trainer ID 產生
│   ├── i18n.js             # 多語系字串
│   ├── cloudinary.js       # Cloudinary 上傳與讀取（前端不含 API_SECRET）
│   ├── swipe.js            # 左右滑動互動
│   ├── app.js              # 主程式
│   └── extras.js           # Cookie consent / 全域錯誤 / 離線偵測
├── favicon.svg             # 寶貝球 SVG favicon
├── og-image.svg            # 社群預覽圖（1200×630）
├── site.webmanifest        # PWA manifest
├── robots.txt              # 搜尋引擎指引
├── sitemap.xml             # 6 頁完整 sitemap
└── netlify.toml            # 安全標頭、快取、redirect
```

## 設定 Cloudinary

1. 到 [cloudinary.com](https://cloudinary.com) 註冊免費帳號
2. 進入 **Settings → Upload** → 新增一個 **Upload Preset**
   - Signing Mode: **Unsigned** ← 必須！
   - Folder: `pokeswipe`
3. 進入 **Settings → Security** → 勾選 **"Allow list of resources by tag"**（讓前端能讀取圖片列表）
4. 打開 `js/cloudinary.js`，填入你的：
   - `CLOUD_NAME`
   - `UPLOAD_PRESET`

⚠️ **千萬不要把 API_SECRET 放在前端 JS！** 任何訪客都能在 DevTools 看到原始碼。
若需支援後端刪除，請新增 Netlify Function 在伺服器端使用環境變數呼叫 Cloudinary Admin API。

## 部署

純靜態檔案，無建置步驟：

- **Netlify**（推薦，已有 `netlify.toml`）：
  - 連結 GitHub repo → Auto deploy
  - 或拖整個資料夾進 [Netlify Drop](https://app.netlify.com/drop)
- **Vercel**：`npx vercel`
- **GitHub Pages**：推上 repo → Settings → Pages → Source: main / root
- **Cloudflare Pages**：連結 GitHub repo（記得手動加上同樣的 security headers）

## 廣告

目前沒有任何廣告。若日後啟用 Google AdSense：

1. 取得 AdSense 核准（需要原創內容、隱私政策、聯絡方式 — 本站皆已具備）
2. 在 `index.html` `<head>` 加入 AdSense script
3. 在 `netlify.toml` 的 CSP `script-src` 已預留 `googlesyndication.com`，可立即運作

## 授權

MIT License。本站與 Niantic, Inc.、The Pokémon Company、任天堂無任何關聯。
Pokémon、Pokémon GO 為其註冊商標。
