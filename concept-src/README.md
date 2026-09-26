# 東方繩洗｜官網概念原型（A 立面索引／B 現場紀錄／C 垂降）

這個資料夾是三個概念原型的原始碼。輸出是純靜態 HTML，放在 repository 根目錄的
`/claude-a-preview/`、`/claude-b-preview/`、`/claude-c-preview/`，Vercel 直接以靜態檔案提供，
不需要在 Vercel 上建置。本資料夾已列入 `.vercelignore`，不會被部署。

正式站（`main`）的檔案、`robots.txt`、`sitemap.xml`、圖片與 SEO 修正都沒有被修改。
預覽路徑在 `vercel.json` 加上 `X-Robots-Tag: noindex, nofollow`，不會被搜尋引擎收錄。

## 建置

```bash
pip install pillow fonttools brotli        # 一次即可
python3 concept-src/build.py               # 建置本分支上所有概念
python3 concept-src/build.py b             # 只建置 B
python3 concept-src/check.py               # 靜態檢查：連結、圖片、H1、meta、JSON-LD、alt、重複 id
```

- 第一次建置會下載 Noto Sans TC／Noto Serif TC（OFL）到 `~/.cache/oriental-clean-fonts`
  （或 `$OC_FONT_DIR`），依標題實際用到的字做子集化。無法下載時自動改用 Google Fonts。
- 照片由 `/images/` 的正式照片產生 240–1600px 的 WebP，放在各概念的 `media/`。

## 資料夾

```
concept-src/
  content/                 共用內容（三版相同）
    company.json           公司資料：取自 main 分支，聯絡資料不得自行修改
    knowledge.json         工法、接近方式、材質、現場問題
    services.json          6 項服務
    cases.json             8 個案例（沒有資料的欄位一律「待補資料」）
    insights/*.md          工程筆記（front matter + Markdown）
  lib/                     產生器：路由、SEO head、JSON-LD、圖片、字型子集
  shared/core.{css,js}     共用元件：Before/After、詢價訊息、篩選、圖片失敗提示、效能分級
  concepts/{a,b,c}/        各概念的版型（render.py）、樣式與互動
  docs/                    研究、交付說明、SEO 架構、上線網址對照
```

## 新增一篇工程筆記（SEO Content Intelligence Engine 的輸出格式）

在 `content/insights/` 新增 `<slug>.md`：

```markdown
---
title: 問題式標題（與搜尋問題一致）
description: 120–150 字的摘要
category: 防水與滲水
tags: 關鍵字一, 關鍵字二
published: 2026-10-01
updated: 2026-10-01
status: draft              # draft → review → published
reviewer: 審閱人姓名與職稱
answer: 2–3 句的直接回答（給 Google 摘要與 AI 搜尋引用）
services: waterproof       # 對應 services.json 的 slug
cases: metrowalk-sealant   # 對應 cases.json 的 slug，沒有就留空
related: leak-water-path   # 其他筆記的 slug
---

## 問題現象
## 常見原因
## 現場如何判斷
## 可用工法
## 各工法限制
## 不建議的處理方式
## 成本影響因素
## 真實案例
## 常見錯誤
```

建置時會檢查所有 slug 參照；只有 `status: published` 的文章會進入上線用 `sitemap.xml` 與 `llms.txt`。
