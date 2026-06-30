// Shared design tokens + page CSS for the HTML→PDF path.
//
// The format: deep-navy headers, metrics-first bullets, ATS-friendly
// single-column structure. Sizes are driven off a `--fit` custom property so
// the auto-fit routine (see pdf.ts) can scale the whole sheet to fill exactly
// one page without overflowing.

export const NAVY = "#0f2747"; // deep navy
export const NAVY_SOFT = "#1d3a5f";
export const RULE = "#c9d4e3";
export const TEXT = "#1a1a1a";
export const MUTED = "#444";

// A4 in CSS px at 96dpi.
export const PAGE_W = 794;
export const PAGE_H = 1123;
// Printable margins (px). Tuned tight-ish; auto-fit handles the rest.
export const MARGIN_X = 52;
export const MARGIN_Y = 46;

export function baseCss(): string {
  return `
  :root { --fit: 1; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: "Calibri", "Carlito", "Helvetica Neue", Arial, sans-serif;
    color: ${TEXT};
    background: #fff;
  }
  #sheet {
    width: ${PAGE_W}px;
    min-height: ${PAGE_H}px;
    padding: ${MARGIN_Y}px ${MARGIN_X}px;
    background: #fff;
  }
  .content { font-size: calc(10.3pt * var(--fit)); line-height: calc(1.32 * var(--fit)); }

  /* Header */
  .name {
    color: ${NAVY};
    font-size: calc(22pt * var(--fit));
    font-weight: 700;
    letter-spacing: 0.4px;
    line-height: 1.05;
  }
  .contact {
    margin-top: calc(3px * var(--fit));
    font-size: calc(9.4pt * var(--fit));
    color: ${MUTED};
  }
  .contact a { color: ${MUTED}; text-decoration: none; }

  /* Section heading */
  .section { margin-top: calc(11px * var(--fit)); }
  .section h2 {
    color: ${NAVY};
    font-size: calc(11pt * var(--fit));
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    padding-bottom: calc(2px * var(--fit));
    border-bottom: 1.5px solid ${NAVY};
    margin-bottom: calc(5px * var(--fit));
  }

  .summary { color: ${TEXT}; }

  /* Roles */
  .role { margin-bottom: calc(7px * var(--fit)); }
  .role:last-child { margin-bottom: 0; }
  .role-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .role-title { font-weight: 700; color: ${NAVY_SOFT}; font-size: calc(10.6pt * var(--fit)); }
  .role-dates { color: ${MUTED}; font-size: calc(9.2pt * var(--fit)); white-space: nowrap; }
  .role-sub { color: ${MUTED}; font-size: calc(9.4pt * var(--fit)); margin-bottom: calc(2px * var(--fit)); }
  ul.bullets { list-style: none; }
  ul.bullets li {
    position: relative;
    padding-left: calc(12px * var(--fit));
    margin-bottom: calc(2.5px * var(--fit));
  }
  ul.bullets li::before {
    content: "";
    position: absolute;
    left: 0;
    top: calc(0.52em);
    width: calc(4px * var(--fit));
    height: calc(4px * var(--fit));
    background: ${NAVY};
    border-radius: 50%;
  }

  /* Skills */
  .skill-row { margin-bottom: calc(2.5px * var(--fit)); }
  .skill-label { font-weight: 700; color: ${NAVY_SOFT}; }

  /* Projects / education inline rows */
  .inline-row { margin-bottom: calc(2.5px * var(--fit)); }
  .inline-strong { font-weight: 700; color: ${NAVY_SOFT}; }
  .edu-head { display: flex; justify-content: space-between; gap: 10px; }
  .edu-dates { color: ${MUTED}; font-size: calc(9.2pt * var(--fit)); white-space: nowrap; }

  /* Cover letter specifics */
  .cl-meta { color: ${MUTED}; font-size: calc(9.8pt * var(--fit)); margin-top: calc(2px * var(--fit)); }
  .cl-date { margin-top: calc(16px * var(--fit)); }
  .cl-recipient { margin-top: calc(10px * var(--fit)); color: ${TEXT}; }
  .cl-greeting { margin-top: calc(12px * var(--fit)); }
  .cl-body p { margin-top: calc(9px * var(--fit)); text-align: justify; }
  .cl-signoff { margin-top: calc(14px * var(--fit)); }
  .cl-signname { font-weight: 700; color: ${NAVY_SOFT}; margin-top: calc(2px * var(--fit)); }
  `;
}

export function htmlShell(bodyInner: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${baseCss()}</style>
</head>
<body>
<div id="sheet"><div class="content">${bodyInner}</div></div>
</body>
</html>`;
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
