import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "水子地藏 · Mizuko Jizō",
  description: "一个以点击与拖动展开的章节式互动叙事。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
