import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
} from "docx";
import type { CVDocument, CoverLetter } from "../types";

// ---------------------------------------------------------------------------
// .docx generation, kept visually matched to the HTML/PDF format:
// deep-navy headers, metrics-first bullets, single-column ATS structure.
//
// Word can't auto-scale font to fit a page the way our Chromium pass does, so
// here we lean on tight, tuned spacing + the engine's one-page content
// selection. Sizes are in half-points (docx convention); 20 = 10pt.
// ---------------------------------------------------------------------------

const NAVY = "0F2747";
const NAVY_SOFT = "1D3A5F";
const MUTED = "444444";
const TEXT = "1A1A1A";
const FONT = "Calibri";

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    border: {
      bottom: { color: NAVY, space: 1, style: BorderStyle.SINGLE, size: 10 },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        color: NAVY,
        font: FONT,
        size: 21,
        characterSpacing: 6,
      }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 30, line: 264 },
    children: [new TextRun({ text, font: FONT, size: 20, color: TEXT })],
  });
}

function contactRuns(parts: string[]): TextRun[] {
  const runs: TextRun[] = [];
  parts.forEach((p, i) => {
    if (i > 0) runs.push(new TextRun({ text: "  •  ", font: FONT, size: 18, color: MUTED }));
    runs.push(new TextRun({ text: p, font: FONT, size: 18, color: MUTED }));
  });
  return runs;
}

const PAGE_MARGINS = {
  top: convertInchesToTwip(0.5),
  bottom: convertInchesToTwip(0.5),
  left: convertInchesToTwip(0.55),
  right: convertInchesToTwip(0.55),
};

export async function buildCvDocx(cv: CVDocument): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({ text: cv.header.name, bold: true, color: NAVY, font: FONT, size: 44 }),
      ],
    })
  );
  const loc = cv.header.visaNote
    ? `${cv.header.location} (${cv.header.visaNote})`
    : cv.header.location;
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: contactRuns([loc, cv.header.phone, cv.header.email, cv.header.linkedinLabel]),
    })
  );

  // Summary
  if (cv.summary) {
    children.push(sectionHeading("Summary"));
    children.push(
      new Paragraph({
        spacing: { after: 40, line: 264 },
        children: [new TextRun({ text: cv.summary, font: FONT, size: 20, color: TEXT })],
      })
    );
  }

  // Experience
  children.push(sectionHeading("Experience"));
  cv.roles.forEach((r) => {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 0 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: `${r.title} — ${r.company}`, bold: true, color: NAVY_SOFT, font: FONT, size: 21 }),
          new TextRun({ text: `\t${r.dates}`, color: MUTED, font: FONT, size: 18 }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: r.location, italics: true, color: MUTED, font: FONT, size: 18 })],
      })
    );
    r.bullets.forEach((b) => children.push(bullet(b)));
  });

  // Skills
  if (cv.skills.length) {
    children.push(sectionHeading("Skills"));
    cv.skills.forEach((s) => {
      children.push(
        new Paragraph({
          spacing: { after: 24, line: 252 },
          children: [
            new TextRun({ text: `${s.group}: `, bold: true, color: NAVY_SOFT, font: FONT, size: 20 }),
            new TextRun({ text: s.items.join(", "), font: FONT, size: 20, color: TEXT }),
          ],
        })
      );
    });
  }

  // Side projects
  if (cv.sideProjects.length) {
    children.push(sectionHeading("AI Side Projects"));
    cv.sideProjects.forEach((p) => {
      children.push(
        new Paragraph({
          spacing: { after: 24, line: 252 },
          children: [
            new TextRun({ text: `${p.name} `, bold: true, color: NAVY_SOFT, font: FONT, size: 20 }),
            new TextRun({ text: `— ${p.description}`, font: FONT, size: 20, color: TEXT }),
          ],
        })
      );
    });
  }

  // Education
  if (cv.education.length) {
    children.push(sectionHeading("Education"));
    cv.education.forEach((e) => {
      children.push(
        new Paragraph({
          spacing: { before: 30, after: 0 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: e.institution, bold: true, color: NAVY_SOFT, font: FONT, size: 20 }),
            new TextRun({ text: `\t${e.dates}`, color: MUTED, font: FONT, size: 18 }),
          ],
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: e.detail ? `${e.degree} | ${e.detail}` : e.degree,
              font: FONT,
              size: 20,
              color: TEXT,
            }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: PAGE_MARGINS } }, children }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function buildCoverDocx(cl: CoverLetter): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      spacing: { after: 20 },
      children: [new TextRun({ text: cl.header.name, bold: true, color: NAVY, font: FONT, size: 40 })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: contactRuns([cl.header.location, cl.header.phone, cl.header.email, cl.header.linkedinLabel]),
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: cl.date, font: FONT, size: 20, color: TEXT })],
    })
  );

  const recipientBits: string[] = [];
  if (cl.recipient) recipientBits.push(cl.recipient);
  if (cl.companyName) recipientBits.push(cl.companyName);
  if (cl.roleTitle) recipientBits.push(`Re: ${cl.roleTitle}`);
  if (recipientBits.length) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: recipientBits.flatMap((b, i) => [
          ...(i > 0 ? [new TextRun({ text: "", break: 1 })] : []),
          new TextRun({ text: b, font: FONT, size: 20, color: TEXT }),
        ]),
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: cl.greeting, font: FONT, size: 20, color: TEXT })],
    })
  );

  cl.paragraphs.forEach((p) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120, line: 276 },
        children: [new TextRun({ text: p, font: FONT, size: 20, color: TEXT })],
      })
    );
  });

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 0 },
      children: [new TextRun({ text: cl.signoff, font: FONT, size: 20, color: TEXT })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text: cl.signatureName, bold: true, color: NAVY_SOFT, font: FONT, size: 20 })],
    })
  );

  const doc = new Document({
    sections: [{ properties: { page: { margin: PAGE_MARGINS } }, children }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
