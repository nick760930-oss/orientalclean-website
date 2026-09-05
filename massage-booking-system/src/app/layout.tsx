import type { Metadata } from "next";
import "./globals.css";

const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "按摩店";

export const metadata: Metadata = {
  title: `線上預約 | ${shopName}`,
  description: `${shopName} 線上預約系統 — 選擇服務項目、按摩師與時段，立即完成預約。`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
