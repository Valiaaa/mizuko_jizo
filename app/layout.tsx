import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const socialImage = host ? `${protocol}://${host}/og.png` : undefined;

  return {
    title: "水子地藏｜房间",
    description: "一间逐渐被记忆与物件覆盖的房间。",
    openGraph: {
      title: "水子地藏",
      description: "一间逐渐被记忆与物件覆盖的房间。",
      type: "website",
      images: socialImage ? [{ url: socialImage, width: 1732, height: 908 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: "水子地藏",
      description: "一间逐渐被记忆与物件覆盖的房间。",
      images: socialImage ? [socialImage] : [],
    },
  };
}

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
