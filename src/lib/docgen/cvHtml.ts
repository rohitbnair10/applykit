import type { CVDocument } from "../types";
import { htmlShell, esc } from "./styles";

function contactLine(cv: CVDocument): string {
  const h = cv.header;
  const loc = h.visaNote ? `${esc(h.location)} (${esc(h.visaNote)})` : esc(h.location);
  return [
    loc,
    esc(h.phone),
    `<a href="mailto:${esc(h.email)}">${esc(h.email)}</a>`,
    `<a href="${esc(h.linkedinUrl)}">${esc(h.linkedinLabel)}</a>`,
  ].join(" &nbsp;•&nbsp; ");
}

export function cvHtml(cv: CVDocument): string {
  const header = `
    <div class="name">${esc(cv.header.name)}</div>
    <div class="contact">${contactLine(cv)}</div>`;

  const summary = cv.summary
    ? `<div class="section">
         <h2>Summary</h2>
         <div class="summary">${esc(cv.summary)}</div>
       </div>`
    : "";

  const roles = `
    <div class="section">
      <h2>Experience</h2>
      ${cv.roles
        .map(
          (r) => `
        <div class="role">
          <div class="role-head">
            <span class="role-title">${esc(r.title)} — ${esc(r.company)}</span>
            <span class="role-dates">${esc(r.dates)}</span>
          </div>
          <div class="role-sub">${esc(r.location)}</div>
          <ul class="bullets">
            ${r.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}
          </ul>
        </div>`
        )
        .join("")}
    </div>`;

  const skills = cv.skills.length
    ? `<div class="section">
         <h2>Skills</h2>
         ${cv.skills
           .map(
             (s) =>
               `<div class="skill-row"><span class="skill-label">${esc(
                 s.group
               )}:</span> ${esc(s.items.join(", "))}</div>`
           )
           .join("")}
       </div>`
    : "";

  const projects = cv.sideProjects.length
    ? `<div class="section">
         <h2>AI Side Projects</h2>
         ${cv.sideProjects
           .map(
             (p) =>
               `<div class="inline-row"><span class="inline-strong">${esc(
                 p.name
               )}</span> — ${esc(p.description)}</div>`
           )
           .join("")}
       </div>`
    : "";

  const education = cv.education.length
    ? `<div class="section">
         <h2>Education</h2>
         ${cv.education
           .map(
             (e) => `
           <div class="inline-row">
             <div class="edu-head">
               <span class="inline-strong">${esc(e.institution)}</span>
               <span class="edu-dates">${esc(e.dates)}</span>
             </div>
             <div>${esc(e.degree)}${e.detail ? ` | ${esc(e.detail)}` : ""}</div>
           </div>`
           )
           .join("")}
       </div>`
    : "";

  return htmlShell(header + summary + roles + skills + projects + education);
}
