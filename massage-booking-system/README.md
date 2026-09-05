# 按摩店線上預約系統

給按摩店使用的線上預約系統。顧客可以線上選擇服務項目、按摩師（或包廂）與時段送出預約；店家有後台可以管理服務項目、按摩師排班，並確認/取消預約。

## 功能

- **線上選時段預約**：顧客依服務項目挑選日期與時段，系統會即時計算哪些時段還有空。
- **多位按摩師 / 包廂排班**：每位按摩師（或每間包廂，當成一種可預約資源）有自己的每週營業時間、可執行的服務項目，以及請假/ 排除時段；顧客也可以選「不指定，都可以」，系統會自動配對有空的人。
- **線上付款或訂金**：可設定每個服務項目要收的訂金（或全額），透過 Stripe Checkout 線上收款；沒設定金流之前，系統會自動退回「到店付款」，不會擋住預約流程。
- **商家後台管理**：登入後可以看今日預約、管理所有預約狀態（確認 / 完成 / 未到店 / 取消）、新增或編輯服務項目、管理按摩師與每週班表。
- 送出預約時會在資料庫交易中重新檢查時段是否還空著，避免兩個顧客搶到同一個時段。

## 技術棧

Next.js 14（App Router）+ TypeScript + Tailwind CSS + Prisma（預設 SQLite，方便本機開發，正式站可換 Postgres）+ NextAuth（帳號密碼登入後台）+ Stripe（選用的線上付款）。

## 本機開發

```bash
npm install
cp .env.example .env        # 依需求修改內容
npm run db:push             # 依 schema 建立資料庫
npm run db:seed             # 灌入範例服務、按摩師與後台帳號
npm run dev
```

打開 http://localhost:3000 是顧客預約頁，http://localhost:3000/admin 是商家後台。

預設的後台帳號密碼（seed 產生，**上線前務必更改**）：

- Email: `admin@example.com`
- 密碼: `admin1234`

要自訂 seed 帳密，設定環境變數 `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` 後再跑 `npm run db:seed`。

## 環境變數（`.env`）

| 變數 | 說明 |
| --- | --- |
| `DATABASE_URL` | 資料庫連線字串。本機預設 `file:./dev.db`（SQLite）。 |
| `NEXTAUTH_SECRET` | 後台登入用的加密密鑰，用 `openssl rand -base64 32` 產生。 |
| `NEXTAUTH_URL` | 網站網址（本機為 `http://localhost:3000`，正式站改成實際網域）。 |
| `NEXT_PUBLIC_SHOP_NAME` / `NEXT_PUBLIC_SHOP_PHONE` | 顯示在預約頁的店名與電話。 |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 選填。三個都設定才會開啟線上付款；留空則只提供「到店付款」。 |

## 關於線上付款

系統內建 Stripe Checkout 作為線上付款範例（新台幣在 Stripe 是「整數計價」幣別，金額不用換算成分）：

1. 到 [Stripe Dashboard](https://dashboard.stripe.com) 註冊帳號、開啟 Taiwan 商家資格，取得 Secret key / Publishable key。
2. 在 Stripe Dashboard 設定 Webhook，指向 `https://你的網域/api/webhooks/stripe`，訂閱 `checkout.session.completed` 事件，取得 Webhook signing secret。
3. 把三組金鑰填進 `.env`，重新部署即可。

如果店家慣用綠界 ECPay、藍新 NewebPay、TapPay 等台灣本地金流，可以把 `src/lib/stripe.ts` 換成對應的 SDK／API 呼叫，`src/app/api/bookings/route.ts` 呼叫 `createCheckoutSession` 的地方跟 `src/app/api/webhooks/stripe/route.ts` 是唯二需要改的地方。

## 部署

建議部署到 Vercel：

1. 把 `prisma/schema.prisma` 的 `datasource` 換成 Postgres（例如 Vercel Postgres / Supabase / Neon），`DATABASE_URL` 改成該服務給的連線字串（SQLite 檔案不適合正式站的多執行個體環境）。
2. 在 Vercel 專案設定裡加上所有環境變數，並設定 `TZ=Asia/Taipei`（系統用伺服器本地時間計算營業時段，需要與店家所在時區一致）。
3. 部署後執行一次 `npx prisma db push` 及 `npm run db:seed`（或自行建立第一個後台帳號）建立資料表。

## 之後搬到獨立的 GitHub repo

目前這個系統先放在既有網站 repo 的 `massage-booking-system/` 資料夾下（因為建立新 repo 需要的 GitHub 權限當下無法取得）。之後要搬到獨立 repo 時，可以用 `git subtree split` 保留這個資料夾完整的 commit 歷史、不含其他網站內容：

```bash
# 1. 在 orientalclean-website repo 根目錄執行，把這個資料夾的歷史切成一個分支
git subtree split -P massage-booking-system -b massage-booking-standalone

# 2. 到 GitHub 建立新的空 repo（例如 massage-booking-system），取得它的 git URL

# 3. 把切出來的分支推到新 repo 的 main
git push <新 repo 的 git URL> massage-booking-standalone:main
```

完成後刪掉本機的 `massage-booking-standalone` 分支即可（`git branch -D massage-booking-standalone`），新 repo 就會是這個系統獨立、乾淨的歷史。

## 未來可加功能（先不做，記錄需求）

- **簡訊通知**（尚未實作，需要 Twilio 或其他簡訊服務帳號）：
  1. 顧客預約成功時，自動收到確認簡訊
  2. 有新預約時，店長手機收到通知簡訊
  3. 預約前一天自動提醒顧客（需要額外排程機制掃描隔天的預約並發送）

## 專案結構

```
massage-booking-system/
├── prisma/
│   ├── schema.prisma       # Service / Therapist / WeeklyAvailability / TimeOff / Booking / AdminUser
│   └── seed.ts             # 範例資料 + 後台帳號
├── src/
│   ├── app/
│   │   ├── page.tsx                    # 顧客首頁（服務項目列表）
│   │   ├── booking/                    # 預約流程（選服務 → 選按摩師 → 選時段 → 填資料）
│   │   ├── admin/                      # 商家後台（登入 / 儀表板 / 預約管理 / 服務 / 按摩師）
│   │   └── api/                        # availability, bookings, services, therapists, auth, stripe webhook
│   ├── components/
│   ├── lib/                            # prisma client、可預約時段計算、預約寫入邏輯、auth、stripe
│   └── types/
```
