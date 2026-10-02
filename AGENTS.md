# 官網 Agent 接續工作規則

先讀 REDESIGN_BRIEF.md（使用者最新「重新設計」要求）、PROJECT_GOAL.md 與 QUALITY_STATUS.md，再讀最新HEAD、相鄰檔案與測試，不可依舊對話猜版本。

工作分支 v8-self-optimized，新的主要驗收入口 /brand-preview.html；舊 /v8-preview.html 與 v8-quality 資產保留比較，不能當新版，也不要自動改回滑桿展示型。此最新入口取代PROJECT_GOAL.md和CLAUDE.md中過時的V8入口說明，其他安全與品質條件仍適用。

不改 main、Production、DNS、LINE、權限，不破壞Claude三版或既有分支。不自行花錢或安裝到使用者本機，不公開私人資料或驗證token。遇到HEAD／SHA衝突先閱讀再整合，不force push。

品質以Awwwards／Webby／FWA參賽完成度為目標，不能自稱已達評審標準。必須實作、檢查、修正、重測並記錄證據；沒有真機就寫未測真機，沒有呼叫Claude／Codex就寫待交叉審查。

保留Logo青藍＋白、首頁零工程照片、少而重要的中文、單一精緻材質動態、直接可用的案例／服務／筆記／聯絡。禁止假日期、空連結、假BeforeAfter、假影格數、無意義幾何與不停播放的裝飾。

每輪更新QUALITY_STATUS.md：變更的原始碼commit／blob、實際測試環境與結果、已知缺口、下一步。線上交付先核對Vercel commit/branch/READY與頁面內容，再取得有效分享網址。這份交接檔不代表外部Agent已自動收到或執行。
