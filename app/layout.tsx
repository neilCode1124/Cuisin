import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cuisin · 中国菜的法式中文名",
  description:
    "上传中国菜照片，AI 识别菜品，并返回一个带有法式餐厅气质的中文名字。",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f1ecdf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
