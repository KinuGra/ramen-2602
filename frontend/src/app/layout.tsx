import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "./components/BottomNav";

export const metadata: Metadata = {
  title: "Dinner Matching",
  description: "一緒に食事・交流しよう",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-[#F8F3EA]">
          <main className="flex-1 pb-20 overflow-y-auto">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
