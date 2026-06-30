"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExperienceBank, Role, BulletVariant } from "@/lib/types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function BankEditor() {
  const [bank, setBank] = useState<ExperienceBank | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bank")
      .then((r) => r.json())
      .then((d) => setBank(d.bank))
      .catch(() => flash("Could not load bank"));
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function patch(updater: (b: ExperienceBank) => ExperienceBank) {
    setBank((prev) => (prev ? updater(structuredClone(prev)) : prev));
  }

  async function save() {
    if (!bank) return;
    setSaving(true);
    try {
      const res = await fetch("/api/bank", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank }),
      });
      if (!res.ok) throw new Error(await res.text());
      flash("Saved");
    } catch (e) {
      flash("Save failed");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (!bank) {
    return (
      <>
        <div className="appbar">
          <span className="brand">ApplyKit · Bank</span>
          <Link href="/">← Home</Link>
        </div>
        <div className="wrap">
          <p className="muted">Loading…</p>
        </div>
      </>
    );
  }

  const h = bank.header;

  return (
    <>
      <div className="appbar">
        <span className="brand">ApplyKit · Bank</span>
        <Link href="/">← Home</Link>
      </div>
      <div className="wrap">
        {/* HEADER */}
        <div className="card">
          <h2>Header</h2>
          <label>Name</label>
          <input value={h.name} onChange={(e) => patch((b) => ((b.header.name = e.target.value), b))} />
          <div className="row">
            <div>
              <label>Location</label>
              <input value={h.location} onChange={(e) => patch((b) => ((b.header.location = e.target.value), b))} />
            </div>
            <div>
              <label>Visa note</label>
              <input value={h.visaNote ?? ""} onChange={(e) => patch((b) => ((b.header.visaNote = e.target.value), b))} />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Phone</label>
              <input value={h.phone} onChange={(e) => patch((b) => ((b.header.phone = e.target.value), b))} />
            </div>
            <div>
              <label>Email</label>
              <input value={h.email} onChange={(e) => patch((b) => ((b.header.email = e.target.value), b))} />
            </div>
          </div>
          <label>LinkedIn label</label>
          <input value={h.linkedinLabel} onChange={(e) => patch((b) => ((b.header.linkedinLabel = e.target.value), b))} />
          <label>LinkedIn URL</label>
          <input value={h.linkedinUrl} onChange={(e) => patch((b) => ((b.header.linkedinUrl = e.target.value), b))} />
        </div>

        {/* SUMMARY TEMPLATES */}
        <div className="card">
          <h2>Summary templates</h2>
          <p className="sub">First one is used as the default summary in Phase 1.</p>
          {bank.summaryTemplates.map((s, i) => (
            <div className="subcard" key={s.id}>
              <div className="subhead">
                <strong>Template {i + 1}</strong>
                <button
                  className="btn btn-danger"
                  onClick={() => patch((b) => ((b.summaryTemplates.splice(i, 1)), b))}
                >
                  Remove
                </button>
              </div>
              <label>Label</label>
              <input value={s.label} onChange={(e) => patch((b) => ((b.summaryTemplates[i].label = e.target.value), b))} />
              <label>Text</label>
              <textarea value={s.text} onChange={(e) => patch((b) => ((b.summaryTemplates[i].text = e.target.value), b))} />
            </div>
          ))}
          <button
            className="btn btn-ghost btn-block"
            onClick={() => patch((b) => ((b.summaryTemplates.push({ id: uid("sum"), label: "New", text: "" })), b))}
          >
            + Add template
          </button>
        </div>

        {/* ROLES */}
        <div className="card">
          <h2>Roles</h2>
          <p className="sub">Add more bullet variants than fit one page — the engine picks a subset.</p>
          {bank.roles.map((role, ri) => (
            <RoleCard
              key={role.id}
              role={role}
              onChange={(updated) => patch((b) => ((b.roles[ri] = updated), b))}
              onRemove={() => patch((b) => ((b.roles.splice(ri, 1)), b))}
            />
          ))}
          <button
            className="btn btn-ghost btn-block"
            onClick={() =>
              patch((b) => {
                b.roles.push({
                  id: uid("role"),
                  company: "",
                  title: "",
                  location: "",
                  dates: "",
                  bullets: [{ id: uid("b"), text: "" }],
                });
                return b;
              })
            }
          >
            + Add role
          </button>
        </div>

        {/* SKILLS */}
        <div className="card">
          <h2>Skills</h2>
          <p className="sub">Comma-separate items within each group.</p>
          {bank.skills.map((g, gi) => (
            <div className="subcard" key={g.group}>
              <div className="subhead">
                <strong>{g.group}</strong>
              </div>
              <textarea
                value={g.items.join(", ")}
                onChange={(e) =>
                  patch((b) => {
                    b.skills[gi].items = e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean);
                    return b;
                  })
                }
              />
            </div>
          ))}
        </div>

        {/* SIDE PROJECTS */}
        <div className="card">
          <h2>AI side projects</h2>
          {bank.sideProjects.map((p, pi) => (
            <div className="subcard" key={p.id}>
              <div className="subhead">
                <strong>Project {pi + 1}</strong>
                <button className="btn btn-danger" onClick={() => patch((b) => ((b.sideProjects.splice(pi, 1)), b))}>
                  Remove
                </button>
              </div>
              <label>Name</label>
              <input value={p.name} onChange={(e) => patch((b) => ((b.sideProjects[pi].name = e.target.value), b))} />
              <label>Description</label>
              <textarea value={p.description} onChange={(e) => patch((b) => ((b.sideProjects[pi].description = e.target.value), b))} />
            </div>
          ))}
          <button
            className="btn btn-ghost btn-block"
            onClick={() => patch((b) => ((b.sideProjects.push({ id: uid("proj"), name: "", description: "" })), b))}
          >
            + Add project
          </button>
        </div>

        {/* EDUCATION */}
        <div className="card">
          <h2>Education</h2>
          {bank.education.map((ed, ei) => (
            <div className="subcard" key={ei}>
              <div className="subhead">
                <strong>Entry {ei + 1}</strong>
                <button className="btn btn-danger" onClick={() => patch((b) => ((b.education.splice(ei, 1)), b))}>
                  Remove
                </button>
              </div>
              <label>Institution</label>
              <input value={ed.institution} onChange={(e) => patch((b) => ((b.education[ei].institution = e.target.value), b))} />
              <label>Degree</label>
              <input value={ed.degree} onChange={(e) => patch((b) => ((b.education[ei].degree = e.target.value), b))} />
              <label>Detail (minor, CGPA…)</label>
              <input value={ed.detail ?? ""} onChange={(e) => patch((b) => ((b.education[ei].detail = e.target.value), b))} />
              <label>Dates</label>
              <input value={ed.dates} onChange={(e) => patch((b) => ((b.education[ei].dates = e.target.value), b))} />
            </div>
          ))}
          <button
            className="btn btn-ghost btn-block"
            onClick={() => patch((b) => ((b.education.push({ institution: "", degree: "", detail: "", dates: "" })), b))}
          >
            + Add education
          </button>
        </div>

        <div className="sticky-actions">
          <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save bank"}
          </button>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function RoleCard({
  role,
  onChange,
  onRemove,
}: {
  role: Role;
  onChange: (r: Role) => void;
  onRemove: () => void;
}) {
  function set<K extends keyof Role>(key: K, val: Role[K]) {
    onChange({ ...role, [key]: val });
  }
  function setBullet(i: number, b: BulletVariant) {
    const bullets = role.bullets.slice();
    bullets[i] = b;
    onChange({ ...role, bullets });
  }
  function addBullet() {
    onChange({ ...role, bullets: [...role.bullets, { id: uid("b"), text: "" }] });
  }
  function removeBullet(i: number) {
    onChange({ ...role, bullets: role.bullets.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="subcard">
      <div className="subhead">
        <strong>{role.company || "New role"}</strong>
        <button className="btn btn-danger" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="row">
        <div>
          <label>Company</label>
          <input value={role.company} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div>
          <label>Location</label>
          <input value={role.location} onChange={(e) => set("location", e.target.value)} />
        </div>
      </div>
      <label>Title</label>
      <input value={role.title} onChange={(e) => set("title", e.target.value)} />
      <label>Dates</label>
      <input value={role.dates} onChange={(e) => set("dates", e.target.value)} />

      <label>Bullet variants</label>
      {role.bullets.map((b, i) => (
        <div className="bullet-item" key={b.id}>
          <div style={{ flex: 1 }}>
            <textarea
              value={b.text}
              placeholder="Metrics-first bullet…"
              onChange={(e) => setBullet(i, { ...b, text: e.target.value })}
            />
            <input
              style={{ marginTop: 6 }}
              value={(b.tags ?? []).join(", ")}
              placeholder="tags (e.g. growth, ai)"
              onChange={(e) =>
                setBullet(i, {
                  ...b,
                  tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                })
              }
            />
          </div>
          <button className="btn btn-danger" onClick={() => removeBullet(i)}>
            ✕
          </button>
        </div>
      ))}
      <button className="btn btn-ghost btn-block" onClick={addBullet}>
        + Add bullet
      </button>
    </div>
  );
}
