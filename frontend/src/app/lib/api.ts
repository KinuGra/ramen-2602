const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export interface User {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  location: string;
  occupation: string;
  created_at?: string;
}

export interface Session {
  id: string;
  criteria_key: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: "open" | "running" | "ended" | "canceled";
  created_at: string;
  participants?: User[];
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  text: string;
  created_at: string;
}

export interface Queue {
  queue_id: string;
  status: "waiting" | "matched" | "canceled";
  session_id?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function createUser(displayName: string): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify({ display_name: displayName }),
  });
}

export async function getUser(id: string): Promise<User> {
  return request<User>(`/users/${id}`);
}

export async function updateUser(id: string, data: Partial<Omit<User, "id" | "created_at">>): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function enqueue(userId: string, criteriaKey: string, durationMin: number): Promise<Queue> {
  return request<Queue>("/queues", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, criteria_key: criteriaKey, duration_min: durationMin }),
  });
}

export async function getQueueStatus(queueId: string): Promise<Queue & { id: string }> {
  return request(`/queues/${queueId}`);
}

export async function cancelQueue(queueId: string): Promise<void> {
  await request(`/queues/${queueId}`, { method: "DELETE" });
}

export async function getSessions(userId?: string): Promise<Session[]> {
  const query = userId ? `?user_id=${userId}` : "";
  return request<Session[]>(`/sessions${query}`);
}

export async function getSession(id: string): Promise<Session & { participants: User[] }> {
  return request(`/sessions/${id}`);
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  return request<Message[]>(`/sessions/${sessionId}/messages`);
}

export async function sendMessage(sessionId: string, senderId: string, text: string): Promise<Message> {
  return request<Message>(`/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ sender_id: senderId, text }),
  });
}
