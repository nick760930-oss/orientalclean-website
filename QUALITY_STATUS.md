# 官網持續修改狀態｜水光立面

2026-10-02。使用者最新要求「再改」，先讀REDESIGN_BRIEF.md與PROJECT_GOAL.md。上輪狀態保存docs/archive/QUALITY_STATUS_FABRIC.md。分支v8-self-optimized；同一入口/brand-preview.html。

## 本輪來源與改動

起始HEAD：19dfc1ef6fbacd9d24ebbb9615a5b82450d2989b。舊版未刪，正式main、/v8-preview.html與Claude其他版本未修改。

已測程式blob SHA：
- brand-preview.html：9477c5632ee9b5ee0806a41f725a0040f69c81ba
- assets/brand-redesign.css：3eb5efc46feda41a71165bc4566b42ff4e5fb7d6
- assets/brand-redesign.js：9569320aa4dfc35d37a3bb7e55ee609ffe5f7480
- assets/brand-motion.js：3771b6276cc6e831fd6841f0384c9864b5504321

主視覺從編織物件改成青藍水光面，重新排首頁与所有内容面板；明體中文标题、無首屏照片、可直接進入案例／服務／工程筆記／聯絡。正式案例與文章未重寫，保留實際href。

修正nested dialog回到上一層的焦點位置、閱讀內容的標籤／屬性與圖片來源清理、503錯誤重試。修正初稿主視覺起始位置造成可見硬接縫：改為全區光影底圖與漸層融合。著色器平方使用乘法，避免GLSL對負底數pow的未定義結果。

## 實際測試與限制

Node syntax check兩個JS通過。Linux Chromium144＋Python Playwright，page.set_content載入本輪HTML/CSS/JS，未導航至網路頁面。未修改瀏覽器管理政策或網路限制。

6種尺寸均通過：320×740、390×844、430×932、768×1024、1440×960、844×390。
- 無水平頁面溢出，主標幾何範圍不越界，底部導覽高度≥44px。
- 首屏未設定案例圖片src，進入案例後才設定3張src。
- 服務details展開、Tab循環、Esc與上層焦點恢復。
- 工程筆記→閱讀器→返回原連結；測試文章為本地fixture，不是網路文章實測。
- 案例橫向按鈕、選單→聯絡→上一層history、電話href。
- 閱讀器503 fixture顯示回復入口、重試成功、移除script／事件／javascript URL。
- reduced-motion CSS不播放進場、無JS時直接文章入口可見。
- 無pageerror；Canvas2D靜態降級在靜止時不持續重畫。

本環境WebGL context不可用。本輪實際截圖與瀏覽器測試跑Canvas2D靜態降級，不能冒充WebGL動態／GPU效能已通過。主視覺公式與GLSL靜態檢查不是GPU編譯實測。

已檢視1440/390/320寬首屏截圖並修正接縫。視覺測試的Logo是使用者提供JPEG製作的本地裁切fixture，不是部署PNG完整驗收；案例照片沒有在本地成功從外網載入。未宣稱真實素材皆通過。

測試摘要：tests/light-wall-results.json。當前可執行測試腳本於本輪工作容器，後續應重建或補存同等規格測試，不以舊布面測試冒充本輪。

## 待部署驗證

提交後需核對Vercel的本輪commit、branch、Preview/READY、首頁與CSS/JS實際回應。分享token不存repo；部署成功不能視為得獎水準。

## 未通過／待驗證

- 支援WebGL的真實瀏覽器：著色器編譯、動態畫面、暫停、context loss、GPU效能。
- iPhone Safari真機、精確Logo原色／裁切、真實照片載入和所有內容路由。
- 200%字體縮放、讀屏、低效能與電量、LCP/INP/CLS實際數據。
- 文章工程審閱、SEO引擎／GSC／GA4整合與真正Claude／Codex交叉審查。
- Awwwards／Webby／FWA完成度仍是目標，沒有達標／獲獎宣告。

## 下一步

先以使用者手機驗收水光立面、細明體與畫面比例；確認GPU效果及Logo。持續保留自然中文、內容真實URL、完整閱讀與Preview noindex。不得退回布面／滑桿，不改正式站。新的藝術指導或後續使用者回饋優先，不要自動宣稱方向已獲認可。


## 2026-10-03 補充驗證與修正

本輪沒有改藝術方向；針對上一輪明列的「WebGL真實編譯」與「極端縮放重排」補證據與修正。

### WebGL 實際瀏覽器路徑

使用 Linux Chromium 144、虛擬顯示環境及 ANGLE 軟體 WebGL 後端，直接載入目前分支的 `assets/brand-motion.js`，不是 Canvas2D fallback。

通過：
- WebGL context 取得成功。
- Vertex／fragment shader 實際 compile 與 program link 成功，renderer 為 `webgl`。
- 初始動畫持續 draw，無 pageerror。
- 暫停後 frame 計數穩定，再次播放後繼續增加。
- 可觸發 `WEBGL_lose_context` 時，context loss 後正確切到 `canvas2d-static`，播放按鈕隱藏。
- 390×844 且 `prefers-reduced-motion: reduce` 時保持靜止；使用者主動按播放才短暫更新。

實測數值與限制記錄於 `tests/webgl-validation-2026-10-03.md`。這可以把「Shader 是否真的能在瀏覽器 WebGL 路徑運作」改為 Chromium 已驗證；仍不能等同 iPhone Safari、實體手機 GPU、耗電或真機 FPS。

### 極端縮放／窄視窗重排

針對正常手機版以下的窄 CSS viewport 新增 reflow：
- Header 可換行。
- 300px 以下品牌中文字改回上下排列，避免四字橫排被截。
- 300px 以下底部三個導覽改單欄。
- 電話與聯絡操作可換行，不靠 `overflow-x:hidden` 掩蓋內容。

本地以 390、320、300、240、195 CSS px 檢查，皆無水平頁面溢出；這是 Chromium reflow 測試，不宣稱已等同 iOS 的「文字大小」設定或 VoiceOver。

### 最新部署核對

- 最新 Preview commit：`f3055ecdced276adb5007d2620afed417f1531dd`
- Vercel deployment：`dpl_AL7aaKSQAoJoTpWxykVbXaxSL4nB`
- 狀態 READY、非 Production、branch 為 `v8-self-optimized`
- `/brand-preview.html`、`/assets/brand-redesign.css`、`/assets/brand-motion.js`、`/journal/facade-cleaning-quote`、`/cases/morten41` 均由 Vercel connector 讀取成功；Preview 回應維持 noindex。
- 最新 CSS 已確認含 300px 以下 reflow 規則。

### 仍待驗證

- iPhone Safari 真機與 iOS WebKit。
- 正式 PNG Logo 的真機縮放與青藍色視覺核對。
- 真實照片在手機端的裁切、載入與 reader 同源 fetch 完整流程。
- VoiceOver／Safari 200% 動態字體、實體手機電量與 CWV。
- SEO 引擎、GSC／GA4 與 Claude／Codex 實際接通。


## 2026-10-03 live asset and safe-area follow-up

- Removed visible prototype language from the current homepage presentation: the decorative vertical English label is hidden and the footer now presents the actual service line instead of an internal design-preview label.
- Confirmed the lossless header logo source `images/logo-light-white-bg.png` is an 8-bit RGBA PNG with IHDR 1250×833 (blob `06db6f4685b2173613e6e0044f34ba8879e291b4`). This confirms source dimensions/format only; it is not a formal brand-colour specification.
- On the current Preview, the homepage, CSS/JS, a full journal article, a full case page, the PNG logo, and the three homepage case images all returned HTTP 200 with their expected content types. The Preview remains noindex.
- Added safe-area padding to full-screen dialogs as well as the homepage so panel content is less likely to collide with iPhone notches/home indicators. This is source-level hardening; physical iPhone Safari remains unverified.
- Same-origin reader cleaning/error recovery has Chromium fixture coverage, while the target article/case sources are now verified live. A real Safari/browser session executing the complete same-origin fetch path is still an open gate and must not be claimed as complete.
