# SEO／AEO／AI Search 架構

三版共用同一套內容模型與 SEO 層，差別只在版型。

## 網址結構（上線後）

| 路徑 | 內容 | 結構化資料 |
|---|---|---|
| `/` | 首頁 | WebSite、Organization、HomeAndConstructionBusiness |
| `/services/` | 服務索引 | ItemList、BreadcrumbList |
| `/services/wall-cleaning` 等 6 頁 | 服務 | Service、BreadcrumbList |
| `/projects/` | 案例索引 | ItemList、BreadcrumbList |
| `/projects/[case-slug]` 8 頁 | 案例 | CreativeWork（含 contentLocation、temporalCoverage、image）、BreadcrumbList |
| `/insights/` | 工程筆記索引 | ItemList、BreadcrumbList |
| `/insights/[article-slug]` 10 頁 | 工程筆記 | Article（datePublished、dateModified、creativeWorkStatus、about → Service）、BreadcrumbList |
| `/about`、`/contact` | 公司、聯絡 | HomeAndConstructionBusiness、BreadcrumbList |

預覽時所有路徑前面加上 `/claude-a-preview` 等前綴；`canonical` 已經指向上線後的正式網址。

## 每一頁都有

- 語意 HTML：`header`、`nav`、`main`、`article`、`section`、`figure`／`figcaption`、`dl`
- 唯一的 `h1`，`h2`／`h3` 依段落層級
- `title`、`meta description`（160 字內）、`canonical`、Open Graph、Twitter Card
- Organization（沿用正式站的 `@id` 與 `logo-brand-color.png`，不破壞既有修正）
- 麵包屑（HTML 與 BreadcrumbList）
- 圖片 `alt`、`figcaption`、寬高（避免 CLS）、延遲載入、WebP 多尺寸
- favicon 沿用正式站 `/images/logo-cyan-bg.png`

## AI 搜尋

- 每篇工程筆記開頭有「快速回答」：2–3 句直接回答問題，方便被摘要與引用。
- 文章結構固定：問題現象、常見原因、現場如何判斷、可用工法、各工法限制、不建議的處理方式、
  成本影響因素、真實案例、常見錯誤；再接相關服務、相關案例、更新日期與工程審閱。
- 主要內容全部在 HTML，不放在 Canvas 或 JavaScript 產生的畫面裡。
- `llms.txt`：服務、案例與已發布文章的摘要清單。
- `robots.txt` 提案：Googlebot、OAI-SearchBot、ChatGPT-User 允許；是否允許 GPTBot、Google-Extended
  這類模型訓練爬蟲，待公司決定。

## 內容流程

```
搜尋需求 → 關鍵字與問題整理 → 競爭者內容缺口 → 東方繩洗真實工程經驗
→ 文章草稿（content/insights/*.md，status: draft）
→ 人工工程審閱（status: review，填 reviewer）
→ SEO／AEO 檢查（check.py：H1、meta、JSON-LD、內部連結）
→ 發布（status: published，進入 sitemap 與 llms.txt）
→ 內部連結（services / cases / related 由 front matter 自動產生）
→ Google 收錄 → Search Console／GA4 追蹤 → 更新舊文章（改 updated 日期）
```

GA4 事件已預留：`window.dataLayer` 會收到 `oc_cta_survey`、`oc_inquiry_line`、`oc_inquiry_mail`、
`oc_call`、`oc_filter`、`oc_before_after`、`oc_loupe_open`、`oc_descent_scene`、`oc_film_wipe`、
`oc_facade_zone` 等事件；上線時接上 GA4／GTM 即可。

## 上線時的網址遷移

正式站目前有 `/portfolio`、`/cases/*`、`/journal/*`、`/services/wall-inspection`、`/services/high-altitude`。
改用新結構時需要 301 轉址，對照表見 `redirects.launch.json`（可直接併入 `vercel.json` 的 `redirects`）。
`/testimonials` 是否保留待公司決定。
