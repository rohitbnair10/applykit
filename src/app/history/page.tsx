"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HistoryEntry } from "@/lib/types";

interface RunSummary {
  id: string;
  createdAt: string;
  company: string;
  role: string;
  model: "sonnet" | "opus";
  costAED: number;
  costUSD: number;
}

export default function History() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [monthSpend, setMonthSpend] = useState(0);
  const [budget, setBudget] = useState(50);
  const [openId, setOpenId] = useState<string | null>(null);
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => {
        setRuns(d.runs);
        setMonthSpend(d.monthSpendAED);
        setBudget(d.budgetAED);
      })
      .catch(() => setRuns([]));
  }, []);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  async function open(id: string) {
    if (openId === id) {
      setOpenId(null);
      setEntry(null);
      return;
    }
    setOpenId(id);
    setEntry(null);
    const r = await fetch(`/api/history/${id}`);
    if (r.ok) setEntry(await r.json());
  }

  async function download(doc: "cv" | "cover", format: "pdf" | "docx") {
    if (!entry) return;
    const key = `${doc}-${format}`;
    setBusy(key);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc, format, cv: entry.cv, cover: entry.cover }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${doc === "cv" ? "Rohit_Nair_CV" : "Rohit_Nair_Cover_Letter"}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      flash("Downloaded");
    } catch {
      flash("Download failed");
    } finally {
      setBusy(null);
    }
  }

  const pct = budget > 0 ? Math.min(100, (monthSpend / budget) * 100) : 0;

  return (
    <>
      <div className="appbar">
        <span className="brand">ApplyKit · History</span>
        <Link href="/">← Home</Link>
      </div>
      <div className="wrap">
        <div className="card">
          <h2>This month</h2>
          <p className="sub" style={{ marginBottom: 10 }}>
            AED {monthSpend.toFixed(3)} of {budget.toFixed(0)} budget used
          </p>
          <div style={{ height: 10, background: "#e8eef6", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: pct > 80 ? "var(--danger)" : "var(--navy)",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        {runs === null && <p className="muted">Loading…</p>}
        {runs && runs.length === 0 && (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              No applications yet. Tailor one from the home screen and it&apos;ll be saved here,
              re-downloadable so you never re-pay for the same role.
            </p>
          </div>
        )}

        {runs &&
          runs.map((r) => (
            <div className="card" key={r.id}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, cursor: "pointer" }}
                onClick={() => open(r.id)}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "var(--navy)" }}>
                    {r.role || "Untitled role"}{r.company ? ` · ${r.company}` : ""}
                  </div>
                  <div className="muted">
                    {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    {r.model === "opus" ? "Opus" : "Sonnet"}
                    {" · AED "}
                    {r.costAED.toFixed(3)}
                  </div>
                </div>
                <span className="pill">{openId === r.id ? "Hide" : "Open"}</span>
              </div>

              {openId === r.id && (
                <div style={{ marginTop: 12 }}>
                  {!entry && <p className="muted">Loading…</p>}
                  {entry && entry.id === r.id && (
                    <>
                      {entry.recruiterNote?.summary && (
                        <p style={{ fontSize: 14, marginTop: 0 }}>{entry.recruiterNote.summary}</p>
                      )}
                      <div className="muted" style={{ margin: "8px 0 8px" }}>CV</div>
                      <div className="btn-grid">
                        <button className="btn btn-primary" disabled={!!busy} onClick={() => download("cv", "pdf")}>
                          {busy === "cv-pdf" ? "…" : "CV · PDF"}
                        </button>
                        <button className="btn btn-outline" disabled={!!busy} onClick={() => download("cv", "docx")}>
                          {busy === "cv-docx" ? "…" : "CV · Word"}
                        </button>
                      </div>
                      <div className="muted" style={{ margin: "12px 0 8px" }}>Cover letter</div>
                      <div className="btn-grid">
                        <button className="btn btn-primary" disabled={!!busy} onClick={() => download("cover", "pdf")}>
                          {busy === "cover-pdf" ? "…" : "Cover · PDF"}
                        </button>
                        <button className="btn btn-outline" disabled={!!busy} onClick={() => download("cover", "docx")}>
                          {busy === "cover-docx" ? "…" : "Cover · Word"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
