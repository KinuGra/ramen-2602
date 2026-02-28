"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { getSession, getMessages, sendMessage, Message, Session, User } from "../../lib/api";
import { getUserId } from "../../lib/useUser";
import { ImageWithFallback } from "../../components/ImageWithFallback";

export default function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<(Session & { participants: User[] }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userId = getUserId();

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await getMessages(id);
      setMessages(msgs);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    Promise.all([
      getSession(id).then(setSession).catch(() => {}),
      loadMessages(),
    ]).finally(() => setLoading(false));
  }, [id, loadMessages]);

  // ポーリングで新メッセージを取得
  useEffect(() => {
    const timer = setInterval(loadMessages, 5000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  // 新メッセージが来たら最下部にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !userId || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(id, userId, input.trim());
      setMessages(prev => [...prev, msg]);
      setInput("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#E63946]" size={32} />
      </div>
    );
  }

  // 相手のユーザー情報
  const otherParticipants = session?.participants.filter(p => p.id !== userId) ?? [];
  const chatTitle = session?.title ?? "チャット";

  return (
    <div className="flex flex-col bg-[#D6E1EB]" style={{ height: "calc(100vh - 80px)" }}>
      {/* ヘッダー */}
      <header className="bg-[#D7E3F2] p-4 pt-12 flex items-center gap-4 border-b border-black/5 shrink-0">
        <button onClick={() => router.back()} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          {otherParticipants.length > 0 && (
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {otherParticipants[0].avatar_url ? (
                <ImageWithFallback src={otherParticipants[0].avatar_url} alt={otherParticipants[0].display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                  {otherParticipants[0].display_name[0]}
                </div>
              )}
            </div>
          )}
          <div>
            <h2 className="text-[16px] font-bold">{chatTitle}</h2>
            {otherParticipants.length > 0 && (
              <p className="text-[12px] text-gray-500">{otherParticipants.map(p => p.display_name).join(", ")}</p>
            )}
          </div>
        </div>
      </header>

      {/* メッセージ一覧 */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 text-[14px]">メッセージを送ってみましょう！</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === userId;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx < 10 ? idx * 0.03 : 0 }}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              {!isMe && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-[10px] font-bold text-gray-500">
                    {msg.sender_avatar ? (
                      <ImageWithFallback src={msg.sender_avatar} alt={msg.sender_name} className="w-full h-full object-cover" />
                    ) : msg.sender_name[0]}
                  </div>
                  <span className="text-[12px] text-gray-500">{msg.sender_name}</span>
                </div>
              )}
              <div className={`max-w-[80%] p-3 rounded-[18px] text-[14px] ${
                isMe
                  ? "bg-black text-white rounded-tr-none"
                  : "bg-white text-black rounded-tl-none"
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      {/* 入力エリア */}
      <footer className="p-4 bg-[#D6E1EB] shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="メッセージを入力"
            className="w-full bg-white h-12 rounded-[20px] pl-5 pr-12 text-[14px] focus:outline-none shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="absolute right-1.5 top-1.5 w-9 h-9 bg-black rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-opacity"
          >
            {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={18} />}
          </button>
        </div>
      </footer>
    </div>
  );
}
