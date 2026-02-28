"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useUser } from "../../lib/useUser";

export default function ProfileEdit() {
  const router = useRouter();
  const { user, loading, update } = useUser();
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    location: "",
    occupation: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || "",
        bio: user.bio || "",
        avatar_url: user.avatar_url || "",
        location: user.location || "",
        occupation: user.occupation || "",
      });
    }
  }, [user]);

  if (loading || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(form);
      setSaved(true);
      setTimeout(() => {
        router.back();
      }, 800);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "display_name" as const, label: "名前" },
    { key: "bio" as const, label: "自己紹介" },
    { key: "avatar_url" as const, label: "アバターURL" },
    { key: "location" as const, label: "都市" },
    { key: "occupation" as const, label: "職業" },
  ];

  return (
    <div className="bg-[#F8F3EA] min-h-full pb-32">
      <header className="p-4 pt-12 flex items-center justify-between border-b border-black/5">
        <button onClick={() => router.back()} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-[16px] font-bold">プロフィール</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[16px] font-medium text-[#E63946] px-4 flex items-center gap-1 disabled:opacity-50"
        >
          {saving && <Loader2 className="animate-spin" size={14} />}
          {saved ? "保存済み ✓" : "保存"}
        </button>
      </header>

      <div className="p-6">
        {/* アバタープレビュー */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden shadow-sm flex items-center justify-center">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span className="text-[42px] font-bold text-gray-400">{form.display_name[0] || "?"}</span>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[22px] overflow-hidden shadow-sm"
        >
          {fields.map((field, idx) => (
            <div
              key={field.key}
              className={`p-5 flex flex-col gap-2 ${idx !== fields.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">{field.label}</p>
              <input
                type="text"
                value={form[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={`${field.label}を入力`}
                className="text-[16px] font-medium text-black focus:outline-none bg-transparent w-full"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
