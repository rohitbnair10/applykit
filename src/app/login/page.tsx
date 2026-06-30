"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Login failed.");
      }
      router.replace(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 64 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>ApplyKit</h2>
        <p className="sub">Enter the password to continue.</p>
        <form onSubmit={submit}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
          />
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy || !password}>
            {busy ? "Checking…" : "Enter"}
          </button>
          {error && <p style={{ color: "var(--danger)", marginTop: 10, fontSize: 14 }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ paddingTop: 64 }} />}>
      <LoginForm />
    </Suspense>
  );
}
