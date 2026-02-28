"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { getSessions, Session } from "../lib/api";
import { getUserId } from "../lib/useUser";

const EVENT_TYPES: Record<string, { emoji: string; color: string }> = {
  mokumoku:   { emoji: "💻", color: "bg-[#FFE8E0]" },
  typescript: { emoji: "⌨️", color: "bg-[#E6E0FF]" },
  design:     { emoji: "🎨", color: "bg-[#E0FFE6]" },
  dinner:     { emoji: "🍜", color: "bg-[#FFE8D0]" },
  english:    { emoji: "🗣️", color: "bg-[#D0EEFF]" },
};

export default function Events() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    getSessions(userId)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#E63946]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8F3EA] min-h-full">
      <header className="mt-12 mb-8">
        <p className="text-[12px] font-medium text-black mb-1">イベント</p>
        <h1 className="text-[24px] font-bold text-black">参加予定のイベント</h1>
      </header>

      <div className="space-y-4">
        {sessions.map((session, idx) => {
          const type = EVENT_TYPES[session.criteria_key] ?? { emoji: "🍽️", color: "bg-[#FFE8E0]" };
          return (
            <Link key={session.id} href={`/events/${session.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-[22px] p-5 shadow-sm"
              >
                <div className="flex gap-4 items-center mb-4">
                  <div className={`w-12 h-12 ${type.color} rounded-[17px] flex items-center justify-center`}>
                    <span className="text-2xl">{type.emoji}</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold">{session.title}</h3>
                    <p className="text-[16px] text-black opacity-80">
                      {new Date(session.start_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <p className="text-[14px] text-gray-500">
                      {new Date(session.start_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      〜{new Date(session.end_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[14px] text-gray-500">オンライン</p>
                  </div>
                  <ChevronRight className="text-black opacity-30" size={18} />
                </div>
              </motion.div>
            </Link>
          );
        })}

        {sessions.length === 0 && (
          <div className="bg-white/50 rounded-[22px] p-12 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">参加予定のイベントはありません</p>
            <Link href="/" className="text-[#E63946] font-medium text-[14px]">
              イベントを探す →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
