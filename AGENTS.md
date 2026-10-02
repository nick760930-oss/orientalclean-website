# 官網 Agent 接續工作規則

僅適用本官網專案。開始工作先讀 PROJECT_GOAL.md 與 QUALITY_STATUS.md，再讀最新 HEAD、相鄰檔案與測試；不得只依聊天摘要猜狀態。

當前工作分支 v8-self-optimized，驗收入口 /v8-preview.html。不改 main、不發布 Production、不破壞 Claude 三版或其他既有分支。付費、權限、DNS、LINE 和私人資料不在此次授權範圍。

以 Awwwards／Webby／FWA 參賽完成度為目標，但不要自行宣稱得獎水準已達成。實作後必須實測、找缺點、修正再測。沒有測試證據就寫未測試；沒有呼叫 Claude／Codex 就寫待交叉審查。

先修功能與可信度阻塞，再精修視覺；保留無照片開場、Logo青藍＋白、非模板互動、工程口吻，以及案例與長文真實HTML。不要用只有標題的工程筆記、空連結、假日期或假Before/After冒充完成。

每輪更新 QUALITY_STATUS.md：起始commit、修改項、實際測试环境与结果、已知缺口、下一步。预览必须核对部署commit和HTTP內容。任何檔案SHA／分支HEAD衝突都先讀取合併，不force push。

其他分支上的 Claude／Codex 應先讀本分支 PROJECT_GOAL.md 的最新版本；本文件不代表對方已收到任務或已執行。共用目標的更動須保留使用者原則，不為方便而降低標準。
