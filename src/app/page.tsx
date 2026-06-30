"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DocKind = "cv" | "cover";
type Fmt = "pdf" | "docx";

export default function Home() {
  const [storage, setStorage] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bank")
      .then((r) => r.json())
      .then((d) => setStorage(d.storage))
      .catch(() => {});
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function download(doc: DocKind, format: Fmt) {
    const key = `${doc}-${format}`;
    setBusy(key);
    try {
      const res = await fetch(`/api/generate?doc=${doc}&format=${format}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = doc === "cv" ? "Rohit_Nair_CV" : "Rohit_Nair_Cover_Letter";
      a.download = `${base}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash("Downloaded");
    } catch (e) {
      flash("Failed — check logs");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  const DownloadGroup = ({ doc, title }: { doc: DocKind; title: string }) => (
    <div className="card">
      <h2>{title}</h2>
      <p className="sub">One page, navy / metrics-first format.</p>
      <div className="btn-grid">
        <button
          className="btn btn-primary"
          disabled={!!busy}
          onClick={() => download(doc, "pdf")}
        >
          {busy === `${doc}-pdf` ? "Rendering…" : "Download PDF"}
        </button>
        <button
          className="btn btn-outline"
          disabled={!!busy}
          onClick={() => download(doc, "docx")}
        >
          {busy === `${doc}-docx` ? "Building…" : "Download Word"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="appbar">
        <span className="brand">ApplyKit</span>
        <Link href="/bank">Edit bank →</Link>
      </div>
      <div className="wrap">
        <div className="card">
          <h2>Tailor to a job</h2>
          <p className="sub" style={{ marginBottom: 12 }}>
            Paste a job description and get a one-page CV + cover letter tailored to
            it, in your format, with a recruiter&apos;s-eye note.
          </p>
          <Link href="/tailor" className="btn btn-primary btn-block">
            Start a tailored application →
          </Link>
        </div>

        <div className="card">
          <h2>Format preview (no AI)</h2>
          <p className="sub" style={{ marginBottom: 8 }}>
            Generate straight from your experience bank to check the one-page
            format.
          </p>
          {storage && (
            <span className="pill">
              storage: {storage === "supabase" ? "Supabase" : "local file (dev)"}
            </span>
          )}
        </div>

        <DownloadGroup doc="cv" title="CV (from bank)" />
        <DownloadGroup doc="cover" title="Cover letter (sample)" />
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
