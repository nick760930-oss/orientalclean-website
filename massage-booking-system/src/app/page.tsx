import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "按摩店";
  const shopPhone = process.env.NEXT_PUBLIC_SHOP_PHONE;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-brand-800">{shopName}</h1>
        <p className="mt-2 text-brand-600">線上預約，選擇喜歡的服務、按摩師與時段</p>
        {shopPhone && <p className="mt-1 text-sm text-brand-500">電話預約：{shopPhone}</p>}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex flex-col justify-between rounded-2xl border border-brand-200 bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-semibold text-brand-800">{s.name}</h2>
              <p className="mt-1 text-sm text-brand-600">
                {s.durationMin} 分鐘 · NT$ {s.priceTwd}
              </p>
              {s.description && <p className="mt-2 text-sm text-brand-500">{s.description}</p>}
              {s.depositTwd > 0 && (
                <p className="mt-1 text-xs text-brand-400">需付訂金 NT$ {s.depositTwd}</p>
              )}
            </div>
            <Link
              href={`/booking?serviceId=${s.id}`}
              className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-brand-700"
            >
              立即預約
            </Link>
          </div>
        ))}
        {services.length === 0 && (
          <p className="col-span-full text-center text-brand-500">
            目前尚無可預約的服務項目，請聯絡店家。
          </p>
        )}
      </div>

      <footer className="mt-10 text-center">
        <Link href="/admin" className="text-xs text-brand-300 hover:text-brand-500">
          商家後台
        </Link>
      </footer>
    </main>
  );
}
