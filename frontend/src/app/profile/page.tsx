"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Shield, Globe, Bell, HelpCircle, LogOut } from "lucide-react";
import { useUser } from "../lib/useUser";
import { ImageWithFallback } from "../components/ImageWithFallback";

export default function Profile() {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const sections = [
    {
      title: "アカウント",
      items: [
        { icon: Shield, label: "ログインとセキュリティ", path: "/profile/edit" },
        { icon: Globe, label: "都市", value: user.location || "未設定", path: "/profile/edit" },
        { icon: Globe, label: "職業", value: user.occupation || "未設定", path: "/profile/edit" },
        { icon: Bell, label: "通知設定", path: "/profile/edit" },
      ],
    },
    {
      title: "サポート",
      items: [
        { icon: HelpCircle, label: "ヘルプセンター", path: "/profile/edit" },
      ],
    },
  ];

  return (
    <div className="p-6 bg-[#F8F3EA] min-h-full pb-32">
      <header className="mt-12 mb-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4 shadow-sm flex items-center justify-center">
          {user.avatar_url ? (
            <ImageWithFallback src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[36px] font-bold text-gray-400">{user.display_name[0]}</span>
          )}
        </div>
        <h1 className="text-[20px] font-bold">{user.display_name}</h1>
        {user.bio && <p className="text-[14px] text-gray-500 mt-1 text-center px-8">{user.bio}</p>}
        <Link href="/profile/edit" className="mt-2 text-[14px] text-black flex items-center gap-1 hover:opacity-70 transition-opacity">
          プロフィールを編集
          <ChevronRight size={14} />
        </Link>
      </header>

      <div className="space-y-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <h2 className="text-[12px] font-bold text-gray-400 mb-2 px-4 uppercase tracking-wider">{section.title}</h2>
            <div className="bg-white rounded-[22px] overflow-hidden shadow-sm">
              {section.items.map((item, iIdx) => (
                <Link
                  key={iIdx}
                  href={item.path}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    iIdx !== section.items.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <item.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-medium text-black">{item.label}</p>
                    {"value" in item && item.value && (
                      <p className="text-[14px] text-gray-400">{item.value}</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={logout}
          className="w-full bg-white rounded-[22px] p-4 flex items-center gap-4 text-[#E63946] font-bold shadow-sm hover:bg-red-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <LogOut size={18} />
          </div>
          <span>ログアウト</span>
        </button>
      </div>
    </div>
  );
}
