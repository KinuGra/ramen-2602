"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "./lib/useUser";
import { getSessions, enqueue, getQueueStatus, cancelQueue, Session } from "./lib/api";
import { ImageWithFallback } from "./components/ImageWithFallback";

const EVENT_TYPES = [
  { key: "mokumoku", title: "もくもく会", emoji: "💻", duration: 60, color: "bg-[#FFE8E0]", desc: "各自作業・進捗共有" },
  { key: "typescript", title: "TypeScript 勉強会", emoji: "⌨️", duration: 90, color: "bg-[#E6E0FF]", desc: "型パズル・ライブラリ紹介" },
  { key: "design", title: "デザイン読書会", emoji: "🎨", duration: 60, color: "bg-[#E0FFE6]", desc: "デザイン本の感想共有" },
  { key: "dinner", title: "ディナー会", emoji: "🍜", duration: 120, color: "bg-[#FFE8D0]", desc: "一緒に食事しながら交流" },
  { key: "english", title: "英会話", emoji: "🗣️", duration: 60, color: "bg-[#D0EEFF]", desc: "英語でフリートーク" },
];

interface WaitingQueue {
  queueId: string;
  criteriaKey: string;
  title: string;
  emoji: string;
}

export default function Home() {
  const { user, loading, signup } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [waitingQueue, setWaitingQueue] = useState<WaitingQueue | null>(null);
  const [matchingKey, setMatchingKey] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // ユーザーのセッション一覧を取得
  const loadSessions = useCallback(async (userId: string) => {
    try {
      const data = await getSessions(userId);
      setSessions(data);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      setShowOnboarding(true);
    }
    if (user) {
      loadSessions(user.id);
      // localStorage から waiting queue を復元
      const stored = localStorage.getItem("waiting_queue");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as WaitingQueue;
          setWaitingQueue(parsed);
        } catch {
          localStorage.removeItem("waiting_queue");
        }
      }
    }
  }, [user, loading, loadSessions]);

  // waiting queue のポーリング
  useEffect(() => {
    if (!waitingQueue) return;
    const timer = setInterval(async () => {
      try {
        const status = await getQueueStatus(waitingQueue.queueId);
        if (status.status === "matched" && status.session_id) {
          localStorage.removeItem("waiting_queue");
          setWaitingQueue(null);
          setSessions(prev => {
            // セッション一覧を再取得するトリガーとして使う
            if (user) loadSessions(user.id);
            return prev;
          });
        }
      } catch {
        // キャンセル済みなど
        localStorage.removeItem("waiting_queue");
        setWaitingQueue(null);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [waitingQueue, user, loadSessions]);

  const handleSignup = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await signup(name.trim());
      setShowOnboarding(false);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (eventType: typeof EVENT_TYPES[0]) => {
    if (!user) { setShowOnboarding(true); return; }
    if (waitingQueue) return;
    setMatchingKey(eventType.key);
    try {
      const result = await enqueue(user.id, eventType.key, eventType.duration);
      if (result.status === "matched" && result.session_id) {
        await loadSessions(user.id);
      } else {
        const q: WaitingQueue = { queueId: result.queue_id, criteriaKey: eventType.key, title: eventType.title, emoji: eventType.emoji };
        setWaitingQueue(q);
        localStorage.setItem("waiting_queue", JSON.stringify(q));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatchingKey(null);
    }
  };

  const handleCancelQueue = async () => {
    if (!waitingQueue) return;
    try {
      await cancelQueue(waitingQueue.queueId);
    } catch {
      // already canceled is fine
    }
    localStorage.removeItem("waiting_queue");
    setWaitingQueue(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#E63946]" size={32} />
      </div>
    );
  }

  return (
    <>
      {/* オンボーディングモーダル */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[24px] p-8 w-full max-w-sm shadow-xl"
            >
              <h2 className="text-[24px] font-bold mb-2">ようこそ！</h2>
              <p className="text-gray-500 mb-6 text-[14px]">表示名を入力してはじめましょう</p>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSignup()}
                placeholder="田中 太郎"
                className="w-full border border-gray-200 rounded-[14px] px-4 py-3 text-[16px] focus:outline-none focus:border-[#E63946] mb-4"
                autoFocus
              />
              <button
                onClick={handleSignup}
                disabled={!name.trim() || creating}
                className="w-full bg-[#E63946] text-white h-12 rounded-[14px] font-bold text-[16px] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="animate-spin" size={18} />}
                はじめる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 bg-[#F8F3EA] min-h-full">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mt-12 mb-8">
          <div>
            <p className="text-[15px] text-gray-600">やぁ、{user?.display_name ?? "ゲスト"}さん</p>
            <h1 className="text-[36px] font-bold text-black leading-tight">オンラインで<br />集まる</h1>
          </div>
          <Link href="/profile">
            <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <ImageWithFallback src={user.avatar_url} alt="Profile" className="rounded-full w-10 h-10 object-cover" />
              ) : (
                <span className="text-[18px] font-bold text-gray-400">
                  {user?.display_name?.[0] ?? "?"}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* マッチング待機中バナー */}
        <AnimatePresence>
          {waitingQueue && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#E63946] rounded-[22px] p-4 mb-6 flex items-center justify-between text-white"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{waitingQueue.emoji}</span>
                <div>
                  <p className="font-bold text-[14px]">{waitingQueue.title}</p>
                  <p className="text-[12px] opacity-80 flex items-center gap-1">
                    <Loader2 className="animate-spin" size={12} />
                    マッチング中...
                  </p>
                </div>
              </div>
              <button onClick={handleCancelQueue} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 参加予定のイベント */}
        <section className="mb-8">
          <h2 className="text-[24px] font-bold mb-4">参加予定のイベント</h2>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 3).map(session => (
                <Link key={session.id} href={`/events/${session.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-[22px] p-5 shadow-sm"
                  >
                    <div className="flex gap-4 items-center mb-3">
                      <div className="w-12 h-12 bg-[#FFE8E0] rounded-[17px] flex items-center justify-center">
                        <span className="text-2xl">
                          {EVENT_TYPES.find(e => e.key === session.criteria_key)?.emoji ?? "🍽️"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold">{session.title}</h3>
                        <p className="text-[14px] text-gray-500">
                          {new Date(session.start_at).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                      <p className="text-[14px] text-gray-500">
                        {new Date(session.start_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜
                        {new Date(session.end_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <ChevronRight className="text-black opacity-30" size={18} />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/50 rounded-[22px] p-8 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-500">予定されているイベントはありません</p>
            </div>
          )}
        </section>

        {/* 次のイベントを予約 */}
        <section>
          <h2 className="text-[24px] font-bold mb-4">次のイベントを予約</h2>
          <div className="grid gap-4">
            {EVENT_TYPES.map(event => (
              <motion.button
                key={event.key}
                onClick={() => handleJoin(event)}
                disabled={!!waitingQueue || matchingKey === event.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#EEE8DD] rounded-[22px] p-5 flex justify-between items-center text-left w-full disabled:opacity-60"
              >
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 ${event.color} rounded-[17px] flex items-center justify-center`}>
                    {matchingKey === event.key ? (
                      <Loader2 className="animate-spin text-gray-600" size={24} />
                    ) : (
                      <span className="text-2xl">{event.emoji}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold">{event.title}</h3>
                    <p className="text-[13px] text-gray-500">{event.desc} · {event.duration}分</p>
                  </div>
                </div>
                <ChevronRight className="text-black opacity-30" size={18} />
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
