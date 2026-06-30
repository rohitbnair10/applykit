"use client";

import { useState } from "react";
import Link from "next/link";
import type { TailorResult } from "@/lib/types";

const MONTHLY_BUDGET_AED = 50;

export default function Tailor() {
  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [useOpus, setUseOpus] = useState(false);

  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }

  async function fetchUrl() {
    if (!url.trim()) return;
    setFetching(true);
    setFetchMsg(null);
    try {
      const res = await fetch("/api/jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok) {
        setJd(data.text);
        if (data.title && !company) {
          // best-effort: titles are often "Role - Company | Site"
          setRole((r) => r || data.title.split(/[-|–]/)[0].trim());
        }
        setFetchMsg("Fetched — review the text below, then tailor.");
      } else {
        setFetchMsg(data.reason || "Couldn't fetch. Paste the description below.");
      }
    } catch {
      setFetchMsg("Couldn't reach that URL. Paste the description below.");
    } finally {
      setFetching(false);
    }
  }

  async function tailor() {
    setError(null);
    setResult(null);
    setTailoring(true);
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, company, role, useOpus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tailoring failed.");
      setResult(data as TailorResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTailoring(false);
    }
  }

  async function download(doc: "cv" | "cover", format: "pdf" | "docx") {
    if (!result) return;
    const key = `${doc}-${format}`;
    setBusy(key);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc, format, cv: result.cv, cover: result.cover }),
      });
      if (!res.ok) throw new Error(await res.text());
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

  const canTailor = jd.trim().length >= 80 && !tailoring;

  return (
    <>
      <div className="appbar">
        <span className="brand">ApplyKit · Tailor</span>
        <Link href="/">← Home</Link>
      </div>
      <div className="wrap">
        {/* JD INTAKE */}
        <div className="card">
          <h2>1 · Job description</h2>
          <p className="sub">Paste the JD (primary), or try a link. LinkedIn links usually need a sign-in, so paste is the reliable path.</p>

          <label>Job link (optional)</label>
          <div className="row" style={{ alignItems: "flex-end" }}>
            <div style={{ flex: "2 1 200px" }}>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://company.com/careers/role"
                inputMode="url"
              />
            </div>
            <button
              className="btn btn-ghost"
              style={{ flex: "1 1 90px" }}
              onClick={fetchUrl}
              disabled={fetching || !url.trim()}
            >
              {fetching ? "Fetching…" : "Fetch"}
            </button>
          </div>
          {fetchMsg && <p className="muted" style={{ marginTop: 8 }}>{fetchMsg}</p>}

          <label>Job description text</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description here…"
            style={{ minHeight: 160 }}
          />
          <p className="muted">{jd.trim().length} characters{jd.trim().length > 0 && jd.trim().length < 80 ? " — add more for a good tailor" : ""}</p>
        </div>

        {/* CONTEXT + OPTIONS */}
        <div className="card">
          <h2>2 · Context & model</h2>
          <div className="row">
            <div>
              <label>Company (optional)</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme" />
            </div>
            <div>
              <label>Role title (optional)</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior PM, Growth" />
            </div>
          </div>

          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 10 }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Opus pass</div>
              <div className="muted">
                {useOpus ? "Opus 4.8 — sharper, costs more" : "Sonnet 4.6 — default, cheaper"}
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={useOpus} onChange={(e) => setUseOpus(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
            onClick={tailor}
            disabled={!canTailor}
          >
            {tailoring ? "Tailoring…" : useOpus ? "Tailor (Opus)" : "Tailor (Sonnet)"}
          </button>
          {error && <p style={{ color: "var(--danger)", marginTop: 10, fontSize: 14 }}>{error}</p>}
        </div>

        {/* RESULT */}
        {result && (
          <>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <h2 style={{ margin: 0 }}>3 · Tailored</h2>
                <span className="pill">
                  {result.model === "opus" ? "Opus 4.8" : "Sonnet 4.6"} · ~AED {result.costAED.toFixed(3)} (${result.costUSD.toFixed(3)})
                </span>
              </div>
              <p className="muted" style={{ marginTop: 6 }}>
                {result.usage.inputTokens.toLocaleString()} in / {result.usage.outputTokens.toLocaleString()} out tokens · {((result.costAED / MONTHLY_BUDGET_AED) * 100).toFixed(2)}% of this month&apos;s AED {MONTHLY_BUDGET_AED} budget
              </p>
            </div>

            {/* Recruiter note */}
            <div className="card">
              <h2>Recruiter&apos;s-eye note</h2>
              <p style={{ marginTop: 0 }}>{result.recruiterNote.summary}</p>
              <NoteList title="Gaps" items={result.recruiterNote.gaps} />
              <NoteList title="Framing mismatches" items={result.recruiterNote.framingMismatches} />
              <NoteList title="Seniority flags" items={result.recruiterNote.seniorityFlags} />
            </div>

            {/* Preview */}
            <div className="card">
              <h2>Preview</h2>
              <div className="muted" style={{ marginBottom: 6 }}>Summary</div>
              <p style={{ marginTop: 0 }}>{result.cv.summary}</p>
              {result.cv.roles.map((r, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: "var(--navy-soft)" }}>{r.title} — {r.company}</div>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                    {r.bullets.map((b, j) => (
                      <li key={j} style={{ fontSize: 14, marginBottom: 3 }}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="hr" />
              <div className="muted" style={{ marginBottom: 6 }}>Cover letter</div>
              {result.cover.paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: 14, marginTop: i === 0 ? 0 : 8 }}>{p}</p>
              ))}
            </div>

            {/* Downloads */}
            <div className="card">
              <h2>Download</h2>
              <div className="muted" style={{ marginBottom: 10 }}>CV</div>
              <div className="btn-grid">
                <button className="btn btn-primary" disabled={!!busy} onClick={() => download("cv", "pdf")}>
                  {busy === "cv-pdf" ? "Rendering…" : "CV · PDF"}
                </button>
                <button className="btn btn-outline" disabled={!!busy} onClick={() => download("cv", "docx")}>
                  {busy === "cv-docx" ? "Building…" : "CV · Word"}
                </button>
              </div>
              <div className="muted" style={{ margin: "14px 0 10px" }}>Cover letter</div>
              <div className="btn-grid">
                <button className="btn btn-primary" disabled={!!busy} onClick={() => download("cover", "pdf")}>
                  {busy === "cover-pdf" ? "Rendering…" : "Cover · PDF"}
                </button>
                <button className="btn btn-outline" disabled={!!busy} onClick={() => download("cover", "docx")}>
                  {busy === "cover-docx" ? "Building…" : "Cover · Word"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function NoteList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div className="muted" style={{ fontWeight: 600 }}>{title}</div>
      <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: 14, marginBottom: 3 }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
