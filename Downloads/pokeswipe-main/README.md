# PokeSwipe - Pokémon GO 好友碼交換平台

左右滑動加好友，上傳截圖分享好友碼。不需註冊、不需後端。

## 架構

```
pokeswipe/
├── index.html          # 主頁面
├── css/
│   └── style.css       # 樣式
├── js/
│   ├── cloudinary.js   # Cloudinary 上傳 & 讀取
│   ├── swipe.js        # 滑動邏輯
│   └── app.js          # 主程式
└── README.md
```

## 設定 Cloudinary

1. 到 [cloudinary.com](https://cloudinary.com) 註冊免費帳號
2. 進入 Settings → Upload → 新增一個 **Upload Preset**
   - 設為 **Unsigned**
   - Folder 填 `pokeswipe`
3. 打開 `js/cloudinary.js`，填入你的：
   - `CLOUD_NAME`（在 Dashboard 首頁）
   - `UPLOAD_PRESET`（剛剛建立的）

## 部署

純靜態檔案，任何方式都能部署：

- **Netlify**: 拖整個資料夾進 Netlify Drop
- **Vercel**: `npx vercel`
- **GitHub Pages**: 推上 repo 開啟 Pages
- **Cloudflare Pages**: 連結 GitHub repo

## 廣告

廣告位已預留，替換 `index.html` 中的 `<!-- AD SLOT -->` 區塊即可。
支援 Google AdSense 或任何廣告聯播網。
