import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduLink AI",
  description: "AI 기반 교육 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
