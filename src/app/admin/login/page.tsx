'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import FlameIcon from "@/components/public/FlameIcon";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid credentials.");
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <FlameIcon className="w-10 h-14 mx-auto mb-4" />
          <h1 className="font-brand text-gold text-2xl tracking-[0.2em]">SHAMELL</h1>
          <p className="text-foreground/40 text-xs font-body tracking-wide mt-1">Admin Access</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-brand text-[10px] tracking-widest text-foreground/50 block mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card border border-gold/20 px-4 py-3 text-sm font-body text-foreground focus:outline-none focus:border-gold/50 transition-colors"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="font-brand text-[10px] tracking-widest text-foreground/50 block mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-gold/20 px-4 py-3 text-sm font-body text-foreground focus:outline-none focus:border-gold/50 transition-colors"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-destructive text-xs font-body text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-outline-gold font-brand text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "ENTERING..." : "ENTER"}
          </button>
        </form>
      </div>
    </div>
  );
}
