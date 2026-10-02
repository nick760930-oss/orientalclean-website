# 官網重新設計狀態

更新：2026-10-02。先讀 REDESIGN_BRIEF.md、PROJECT_GOAL.md、AGENTS.md。舊狀態完整保存於 docs/archive/QUALITY_STATUS_V8_2.md。

## 最新工作

使用者要求「重新設計」，本輪新增 /brand-preview.html，主視覺、資訊架構與互動重新製作，不沿用V8左右分欄滑桿。仍在v8-self-optimized；保留/v8-preview.html、全部舊資產、main及Claude其他分支。起始HEAD c6485ac6ada862667e174a9225e46e1c9ac45236。

## 程式交付

- brand-preview.html：4b0a28e66f55702023936ac6b49ce19b3b937386
- assets/brand-redesign.css：feada2b4ae5ec87c35d0595e922dd18f4021ca62
- assets/brand-redesign.js：4124bb8f8708ddbfc72611c675eb2130bb06da78
- assets/brand-motion.js：eacd070566c58c57e209558ba4d073a98da45191
以上是本輪已測檔案的Git blob SHA，不是部署ID。

首頁為白色與青藍編織材質、公司名稱及三個直接入口。沒有工程照片、滑桿、進度／假影格數。使用Canvas2D顯示程序投影曲面，非影片、非WebGL或物理模擬。

服务、案例、筆記、聯絡與選單使用原生dialog。案例按需載圖、左右切換；文章與案例可從真實URL讀入閱讀器，不是只有標題。保持href與無JS直接閱讀路徑。正式內容不被重寫，不新增工程事實。

## 自查中實際修正

- 初稿曲面呈網格／三角面：改成連續縱向光照材質，而不是增加更多特效。
- Canvas初始尺寸為零造成漸層非有限值：先檢查尺寸再繪圖。
- 手機材質壓到大標：將主體移至標題下方並重新安排比例。
- 折疊服務的不可見連結進入Tab順序：焦點循環排除未展開details內容。
- 巢狀面板返回主頁後焦點位置不明：保留主頁觸發元素並恢復焦點。
- 本地測試history與baseURI不同源：改以目前location的無hash網址更新history，不更動使用者目的地。
- 停止無限動畫；加入有限播放、背景／面板暂停、reduced-motion静止。

## 本輪已完成測試

Linux Chromium＋Python Playwright，page.set_content載入實際HTML/CSS/JS。環境管理限制禁止正常導航，本輪未修改或繞過限制。

320×740、390×844、430×932、768×1024、1440×900、844×390 六種尺寸均通過：Canvas渲染無pageerror、無水平頁面溢出、主要入口44px高度、服務展開／焦點循環、Esc及主頁焦點、三篇真實href、閱讀器fixture成功、案例延遲載圖、橫向按鈕、選單→聯絡→返回的history。

另外以最終motion檔重測：reduced-motion下Canvas不持續更新；手動播放結束後影格計數停止。沒有拿此計數當對外電影影格。

測試使用既有JPEG提取的本地Logo示意與案例圖fixture；閱讀器使用既有文章節錄fixture，不冒充真實網路載入。手機／桌機截圖實際檢視並修正，但不是iPhone Safari或正式原圖驗收。測試摘要保存 tests/brand-redesign-results.json。

原始JPEG已經由GitHub讀取並檢查blob SHA 5283d6a539bcdc9952c6fd6dc39f55722bb327be。它是有損圖，不宣稱像素取樣等於完整品牌色規範；部署Header仍使用既有lossless PNG資產與原有裁切比例。

## 部署狀態

此提交時尚待Vercel自動部署。接續步驟應核對本提交的commit、branch、Preview/READY，再實際讀取 /brand-preview.html 與CSS/JS、內容URL。驗證結果另存Issue #1或下次狀態，不可把這一行當已通過。分享token不得保存至公開repo。

## 未完成的品質關卡

- 真實PNG Logo的顏色、縮小辨識度與完整裁切，以及真實案例照片的端到端瀏覽器驗收。
- iPhone Safari真機、WebKit、讀屏、200%文字縮放、低效能與電量影響。
- 實際HTTP讀取與全部資產、閱讀器同源fetch、404重試的線上測試。
- CWV實際使用者資料、LCP／INP／CLS與完整效能評估，沒有測量不能填分數。
- 工程文章審閱、SEO引擎／GSC／GA4接通與實際Claude／Codex交叉審查。
- Awwwards／Webby／FWA水準仍是目標，不表示已達標或已得獎。

## 下一輪

以新品牌設計為主，不回退V8滑桿示範。先完成真實素材與手機完整體驗、內容連續閱讀和載入失敗，再依使用者視覺驗收精修。舊V8回歸測試只適用舊/v8-preview.html，不可拿來驗證新首頁。需要用新測試與實際截圖說明差異。
