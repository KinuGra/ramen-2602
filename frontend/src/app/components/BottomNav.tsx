"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Calendar, MessageCircle, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Search, label: "ホーム" },
  { href: "/events", icon: Calendar, label: "イベント" },
  { href: "/chats", icon: MessageCircle, label: "チャット" },
  { href: "/profile", icon: User, label: "マイページ" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? "text-[#E63946]" : "text-gray-400"
            }`}
          >
            <Icon size={24} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
