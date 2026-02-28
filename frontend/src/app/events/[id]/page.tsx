"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Lock, Loader2, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { getSession, Session, User } from "../../lib/api";
import { ImageWithFallback } from "../../components/ImageWithFallback";

const EVENT_TYPES: Record<string, { emoji: string }> = {
  mokumoku:   { emoji: "💻" },
  typescript: { emoji: "⌨️" },
  design:     { emoji: "🎨" },
  dinner:     { emoji: "🍜" },
  english:    { emoji: "🗣️" },
};

const SECTIONS = [
  { title: "交流方法", desc: "あなたにぴったりの交流方法をお知らせします。", unlock: "2日でアンロック", color: "bg-[#F3E6DB]" },
  { title: "グループ", desc: "イベントにあなたのグループについて情報を共有します。", unlock: "2日でアンロック", color: "bg-[#F3E3D8]" },
  { title: "テーマ", desc: "本日はこのテーマの勉強をします。", unlock: "3日でアンロック", color: "bg-[#EEE1CE]" },
  { title: "フィードバック", desc: "イベントについての感想を共有し、お互いにマッチし、次の体験を向上させましょう。", unlock: "3日でアンロック", color: "bg-[#F2E2D8]" },
];

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<(Session & { participants: User[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession(id)
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#E63946]" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">イベントが見つかりません</p>
        <button onClick={() => router.back()} className="text-[#E63946] font-medium">戻る</button>
      </div>
    );
  }

  const type = EVENT_TYPES[session.criteria_key] ?? { emoji: "🍽️" };
  const startDate = new Date(session.start_at);
  const endDate = new Date(session.end_at);
  const now = new Date();
  const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-[#EBDAD3] min-h-full pb-32">
      <header className="p-6 pt-12 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
      </header>

      <main className="p-4 flex flex-col gap-4">
        {/* カウントダウン */}
        <div className="bg-white h-11 rounded-full flex items-center justify-center">
          <p className="text-[16px] font-medium text-black">
            {daysUntil > 0 ? `開催まで${daysUntil}日` : daysUntil === 0 ? "本日開催！" : "開催済み"}
          </p>
        </div>

        {/* イベントカード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] p-6 shadow-sm"
        >
          <div className="flex gap-4 items-center mb-6">
            <div className="w-12 h-12 bg-[#FFE8E0] rounded-[20px] flex items-center justify-center shrink-0">
              <span className="text-2xl">{type.emoji}</span>
            </div>
            <div>
              <h2 className="text-[28px] font-bold leading-tight">{session.title}</h2>
              <p className="text-[16px] text-gray-400">オンライン</p>
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <p className="text-[16px] font-medium">
              {startDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </p>
            <p className="text-[16px] text-gray-400">
              {startDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              〜{endDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* 参加者 */}
          {session.participants.length > 0 && (
            <div className="mb-6">
              <p className="text-[12px] font-bold text-gray-400 mb-3 uppercase tracking-wider">参加者</p>
              <div className="flex gap-3">
                {session.participants.map(p => (
                  <div key={p.id} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {p.avatar_url ? (
                        <ImageWithFallback src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[18px] font-bold text-gray-400">{p.display_name[0]}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-600">{p.display_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/chats/${session.id}`)}
              className="flex-1 bg-[#E63946] text-white h-10 rounded-full text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-[#c62030] transition-colors"
            >
              <MessageCircle size={16} />
              チャット
            </button>
            <button className="flex-1 bg-gray-100 h-10 rounded-full text-[14px] font-medium hover:bg-gray-200 transition-colors">
              +1を連れてくる
            </button>
          </div>
        </motion.div>

        {/* ロックされたセクション */}
        {SECTIONS.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx }}
            className={`${section.color} rounded-[20px] p-6 relative shadow-sm`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[22px] font-bold">{section.title}</h3>
              <div className="flex items-center gap-1 text-[14px] font-medium bg-white/30 px-3 py-1 rounded-full">
                <Lock size={12} className="opacity-50" />
                <span>{section.unlock}</span>
              </div>
            </div>
            <p className="text-[14px] text-black/80 leading-relaxed pr-8">{section.desc}</p>
          </motion.div>
        ))}
      </main>
    </div>
  );
}
