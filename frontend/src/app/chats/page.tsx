"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { getSessions, getMessages, Session, Message } from "../lib/api";
import { getUserId } from "../lib/useUser";
import { ImageWithFallback } from "../components/ImageWithFallback";

interface ChatPreview {
  session: Session;
  lastMessage: Message | null;
}

export default function ChatList() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }

    getSessions(userId)
      .then(async sessions => {
        const previews = await Promise.all(
          sessions.map(async session => {
            try {
              const msgs = await getMessages(session.id);
              return { session, lastMessage: msgs.length > 0 ? msgs[msgs.length - 1] : null };
            } catch {
              return { session, lastMessage: null };
            }
          })
        );
        setChats(previews);
      })
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#E63946]" size={32} />
      </div>
    );
  }

  const EVENT_EMOJIS: Record<string, string> = {
    mokumoku: "💻", typescript: "⌨️", design: "🎨", dinner: "🍜", english: "🗣️",
  };

  return (
    <div className="p-6 bg-[#F8F3EA] min-h-full">
      <header className="mt-12 mb-8">
        <h1 className="text-[24px] font-bold text-black">チャット</h1>
      </header>

      <div className="space-y-3">
        {chats.length > 0 ? (
          chats.map(({ session, lastMessage }, idx) => (
            <Link key={session.id} href={`/chats/${session.id}`}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-[22px] p-4 flex gap-4 items-center shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-[#FFE8E0] flex items-center justify-center shrink-0 text-xl">
                  {EVENT_EMOJIS[session.criteria_key] ?? "🍽️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[16px] font-bold truncate">{session.title}</h3>
                    {lastMessage && (
                      <span className="text-[12px] text-gray-400 shrink-0 ml-2">
                        {new Date(lastMessage.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-gray-500 truncate">
                    {lastMessage ? lastMessage.text : "メッセージはまだありません"}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-[20px] font-bold mb-2">まだメッセージはありません</p>
            <p className="text-[14px] text-gray-500">マッチングするとチャットができます！</p>
            <Link href="/" className="mt-4 text-[#E63946] font-medium text-[14px]">
              イベントを探す →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
