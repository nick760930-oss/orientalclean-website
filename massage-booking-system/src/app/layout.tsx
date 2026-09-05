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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;600;700;900&family=Noto+Sans+TC:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
