import type { CoverLetter } from "../types";
import { htmlShell, esc } from "./styles";

function contactLine(cl: CoverLetter): string {
  const h = cl.header;
  return [
    esc(h.location),
    esc(h.phone),
    `<a href="mailto:${esc(h.email)}">${esc(h.email)}</a>`,
    `<a href="${esc(h.linkedinUrl)}">${esc(h.linkedinLabel)}</a>`,
  ].join(" &nbsp;•&nbsp; ");
}

export function coverHtml(cl: CoverLetter): string {
  const header = `
    <div class="name">${esc(cl.header.name)}</div>
    <div class="cl-meta">${contactLine(cl)}</div>`;

  const date = `<div class="cl-date">${esc(cl.date)}</div>`;

  const recipientBits: string[] = [];
  if (cl.recipient) recipientBits.push(esc(cl.recipient));
  if (cl.companyName) recipientBits.push(esc(cl.companyName));
  if (cl.roleTitle) recipientBits.push(`Re: ${esc(cl.roleTitle)}`);
  const recipient = recipientBits.length
    ? `<div class="cl-recipient">${recipientBits.join("<br/>")}</div>`
    : "";

  const greeting = `<div class="cl-greeting">${esc(cl.greeting)}</div>`;

  const body = `<div class="cl-body">${cl.paragraphs
    .map((p) => `<p>${esc(p)}</p>`)
    .join("")}</div>`;

  const signoff = `
    <div class="cl-signoff">${esc(cl.signoff)}</div>
    <div class="cl-signname">${esc(cl.signatureName)}</div>`;

  return htmlShell(header + date + recipient + greeting + body + signoff);
}
