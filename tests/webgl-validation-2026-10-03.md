# 水光立面 WebGL 驗證｜2026-10-03

本次補做先前缺少的「實際 WebGL 路徑」測試。這是 Linux Chromium 的瀏覽器驗證，不等同 iPhone Safari、實體 GPU 或真機效能結果。

## 環境

- Chromium 144
- Linux 虛擬顯示環境
- ANGLE 的軟體 WebGL 後端
- 直接載入目前分支的 `assets/brand-motion.js`
- 測試頁只有實際 `canvas` 與播放／暫停按鈕，不以 Canvas2D fallback 冒充 WebGL

## 通過項目

- 成功取得 WebGL context。
- Vertex shader 與 fragment shader 實際編譯、program link 成功，`.art[data-renderer]` 進入 `webgl`。
- 首次播放在約 0.7 秒內持續產生多個實際 draw frame，無 pageerror。
- 點擊「暫停光影」後 frame 計數穩定；再次播放後 frame 繼續增加。
- 瀏覽器提供 `WEBGL_lose_context` 時，主動觸發 context loss，可切換到 `canvas2d-static` 降級，並隱藏無法使用的播放按鈕。
- 在 390×844、`prefers-reduced-motion: reduce` 下，頁面只保留靜止畫面；使用者主動按播放時仍可短暫播放。

實測紀錄：
- 初始 WebGL draw frames：24
- 暫停後兩次讀值：25 → 25
- 再次播放：33
- reduced-motion 靜止讀值：2 → 2
- reduced-motion 手動播放：9
- JavaScript pageerror：0

## 尚未通過

- iPhone Safari／iOS WebKit。
- 實體手機 GPU、耗電與持續 FPS。
- 真實部署頁上 WebGL + PNG Logo + 案例照片的端到端視覺驗收。

所以現在可以把「WebGL shader 是否真的能編譯與運作」從未驗證改為 Linux Chromium 已驗證；iPhone 與實機效能仍保持待驗證。
