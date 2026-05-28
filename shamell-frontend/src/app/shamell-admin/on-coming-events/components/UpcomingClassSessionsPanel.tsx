"use client";

import { useCallback, useEffect, useState } from "react";
import { getEventsBearerToken } from "@/app/shamell-admin/events/lib/eventsAuth";
import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

type SessionRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  price: number;
  isActive: boolean;
};

type Props = { eventId: string };

export function UpcomingClassSessionsPanel({ eventId }: Props) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [price, setPrice] = useState("");

  const load = useCallback(async () => {
    const token = getEventsBearerToken();
    if (!token) return;
    setLoading(true);
    try {
      const base = getAdminApiBaseUrl();
      const res = await fetch(`${base}/api/v1/upcoming-events/admin/events/${eventId}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data: unknown = await res.json().catch(() => []);
      if (!res.ok) throw new Error(nestApiErrorMessage(data, "Could not load sessions."));
      setSessions(Array.isArray(data) ? (data as SessionRow[]) : []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addSession = async () => {
    const token = getEventsBearerToken();
    if (!token || !startsAt || !endsAt || !price) return;
    const base = getAdminApiBaseUrl();
    const res = await fetch(`${base}/api/v1/upcoming-events/admin/events/${eventId}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        capacity: Number(capacity),
        price: Number(price),
      }),
    });
    if (res.ok) {
      setStartsAt("");
      setEndsAt("");
      setPrice("");
      await load();
    }
  };

  const removeSession = async (sessionId: string) => {
    const token = getEventsBearerToken();
    if (!token) return;
    const base = getAdminApiBaseUrl();
    await fetch(
      `${base}/api/v1/upcoming-events/admin/events/${eventId}/sessions/${sessionId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
    await load();
  };

  return (
    <div className="mt-6 rounded-xl border border-gold/25 p-4">
      <h3 className="font-brand text-xs tracking-[0.16em] text-gold">CLASS SESSIONS</h3>
      {loading ? <p className="mt-2 text-sm text-foreground/60">Loading…</p> : null}
      <ul className="mt-3 space-y-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-gold/15 px-3 py-2 text-sm"
          >
            <span>
              {new Date(s.startsAt).toLocaleString()} · cap {s.capacity} · ${Number(s.price).toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => void removeSession(s.id)}
              className="text-xs text-red-400 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="rounded-lg border border-gold/30 bg-black/30 px-2 py-2 text-sm"
        />
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="rounded-lg border border-gold/30 bg-black/30 px-2 py-2 text-sm"
        />
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Capacity"
          className="rounded-lg border border-gold/30 bg-black/30 px-2 py-2 text-sm"
        />
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price USD"
          className="rounded-lg border border-gold/30 bg-black/30 px-2 py-2 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={() => void addSession()}
        className="mt-3 rounded-lg border border-gold/35 px-4 py-2 font-brand text-xs tracking-[0.12em] text-gold uppercase"
      >
        Add session
      </button>
    </div>
  );
}
