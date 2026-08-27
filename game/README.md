# Mini RPG — 可下載安裝的多人連線原型

一個最小可玩的多人 RPG 原型：2D 俯視地圖、多名玩家即時同屏移動、文字聊天、簡單怪物與戰鬥系統。
伺服器用 Node.js + Socket.io，桌面用戶端用 Electron 打包成可下載安裝的程式。

這是**原型**，不是完整遊戲：沒有帳號系統、沒有存檔、沒有裝備/升級系統，重開伺服器所有進度會重置。

## 目錄結構

```
game/
├── server/     # 權威伺服器（Node.js + Socket.io + Express）
├── client/     # 遊戲前端（純 HTML5 Canvas + JS，無需打包工具）
└── electron/   # 把 client/ 包成可下載安裝的桌面程式
```

## 快速開始（本機測試，2 分鐘）

1. 啟動伺服器：

   ```bash
   cd game/server
   npm install
   npm start
   ```

   會看到 `Mini RPG server listening on port 3000`。

2. 用瀏覽器打開 `http://localhost:3000`，輸入伺服器位址（本機測試填 `http://localhost:3000`）和角色名稱，
   按「進入遊戲」。開兩個瀏覽器分頁模擬兩名玩家，就能看到彼此即時移動。

3. 操作方式：
   - `WASD` 或方向鍵：移動
   - 滑鼠點擊附近的紅色怪物：攻擊
   - 下方聊天欄可打字聊天

## 要讓朋友連線一起玩

伺服器需要跑在一台大家都連得到的機器上（雲端主機、家用主機開通連接埠轉發，或用
ngrok / Cloudflare Tunnel 之類的工具對外暴露 `PORT`，預設 `3000`）。
朋友只要在登入畫面填入你伺服器的公開網址（例如 `http://your-server:3000`）即可加入，
不需要每個人都跑一份伺服器。

## 打包成「可下載安裝」的桌面客戶端

```bash
cd game/electron
npm install
npm run dist
```

`electron-builder` 會依照目前系統產生對應安裝檔（Windows 是 `.exe` 安裝程式、macOS 是 `.dmg`、
Linux 是 `.AppImage`），輸出在 `game/electron/dist/`。玩家安裝後開啟程式，
一樣先輸入伺服器位址與角色名稱即可連線遊玩 —— 桌面版本身不含遊戲邏輯，純粹是內嵌瀏覽器
指向 `client/`，實際遊戲狀態仍由你架設的伺服器管理。

> 注意：跨平台打包（例如在 Linux 上產生 Windows 安裝檔）需要額外工具鏈，建議直接在目標作業系統上執行 `npm run dist`。

## 之後可以擴充的方向

- 帳號系統 + 資料庫存檔（等級、裝備、背包）
- 多張地圖 / 傳送點
- 更完整的戰鬥（技能、冷卻、遠程攻擊）
- 反作弊：目前移動/攻擊皆由伺服器驗證合法性，但仍偏簡化，正式營運需要更嚴謹的防外掛機制
