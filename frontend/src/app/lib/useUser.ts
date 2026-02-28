"use client";

import { useState, useEffect, useCallback } from "react";
import { User, createUser, getUser, updateUser } from "./api";

const USER_ID_KEY = "dinner_matching_user_id";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      setLoading(false);
      return;
    }
    getUser(userId)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(USER_ID_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = useCallback(async (displayName: string): Promise<User> => {
    const newUser = await createUser(displayName);
    localStorage.setItem(USER_ID_KEY, newUser.id);
    setUser(newUser);
    return newUser;
  }, []);

  const update = useCallback(async (data: Partial<Omit<User, "id" | "created_at">>) => {
    if (!user) return;
    const updated = await updateUser(user.id, data);
    setUser(updated);
    return updated;
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    setUser(null);
  }, []);

  return { user, loading, signup, update, logout };
}

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}
