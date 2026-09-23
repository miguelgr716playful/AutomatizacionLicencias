/**
 * One-off: docs/AMBIENTE-PROD.md → docs/AMBIENTE-PROD.docx
 */
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
} = require("docx");

const mdPath = path.join(__dirname, "..", "docs", "AMBIENTE-PROD.md");
const outPath = path.join(__dirname, "..", "docs", "AMBIENTE-PROD.docx");
const md = fs.readFileSync(mdPath, "utf8");

const border = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "CCCCCC",
};
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, opts = {}) {
  const { bold = false, header = false, width = 2340 } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: header
      ? { type: ShadingType.CLEAR, fill: "0F766E" }
      : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || "",
            bold: bold || header,
            color: header ? "FFFFFF" : "1F2937",
            size: 18,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

function parseTable(lines) {
  const rows = lines
    .filter((l) => l.trim().startsWith("|"))
    .map((l) =>
      l
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    )
    .filter((cols) => !cols.every((c) => /^[-:\s]+$/.test(c)));

  if (rows.length === 0) return null;

  const colCount = Math.max(...rows.map((r) => r.length));
  const width = Math.floor(9000 / colCount);

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: rows.map((cols, i) => {
      const padded = [...cols];
      while (padded.length < colCount) padded.push("");
      return new TableRow({
        children: padded.map((c) =>
          cell(c.replace(/\*\*/g, ""), {
            header: i === 0,
            bold: i === 0,
            width,
          })
        ),
      });
    }),
  });
}

function inlineRuns(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(new TextRun({ text: text.slice(last, m.index), size: 22, font: "Calibri" }));
    }
    if (m[1]) {
      parts.push(
        new TextRun({ text: m[1], bold: true, size: 22, font: "Calibri" })
      );
    } else if (m[2]) {
      parts.push(
        new TextRun({
          text: m[2],
          font: "Consolas",
          size: 18,
          color: "0F766E",
        })
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push(new TextRun({ text: text.slice(last), size: 22, font: "Calibri" }));
  }
  if (parts.length === 0) {
    parts.push(new TextRun({ text: text || "", size: 22, font: "Calibri" }));
  }
  return parts;
}

const children = [];
const lines = md.replace(/\r\n/g, "\n").split("\n");
let i = 0;
let inCode = false;
let codeBuf = [];
let tableBuf = [];

function flushTable() {
  if (tableBuf.length === 0) return;
  const t = parseTable(tableBuf);
  if (t) {
    children.push(t);
    children.push(new Paragraph({ text: "" }));
  }
  tableBuf = [];
}

while (i < lines.length) {
  const line = lines[i];

  if (line.trim().startsWith("```")) {
    flushTable();
    if (!inCode) {
      inCode = true;
      codeBuf = [];
    } else {
      inCode = false;
      children.push(
        new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: "F3F4F6" },
          children: [
            new TextRun({
              text: codeBuf.join("\n"),
              font: "Consolas",
              size: 16,
              color: "111827",
            }),
          ],
        })
      );
      children.push(new Paragraph({ text: "" }));
      codeBuf = [];
    }
    i++;
    continue;
  }

  if (inCode) {
    codeBuf.push(line);
    i++;
    continue;
  }

  if (line.trim().startsWith("|")) {
    tableBuf.push(line);
    i++;
    continue;
  } else {
    flushTable();
  }

  if (line.startsWith("# ")) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: line.slice(2).trim(),
            bold: true,
            size: 36,
            color: "0F766E",
            font: "Calibri",
          }),
        ],
      })
    );
  } else if (line.startsWith("## ")) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 120 },
        children: [
          new TextRun({
            text: line.slice(3).trim(),
            bold: true,
            size: 28,
            color: "115E59",
            font: "Calibri",
          }),
        ],
      })
    );
  } else if (line.startsWith("### ")) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: line.slice(4).trim(),
            bold: true,
            size: 24,
            color: "134E4A",
            font: "Calibri",
          }),
        ],
      })
    );
  } else if (/^---+$/.test(line.trim())) {
    children.push(new Paragraph({ text: "" }));
  } else if (line.trim().startsWith("> ")) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        indent: { left: 360 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 24, color: "0F766E" },
        },
        children: inlineRuns(line.replace(/^>\s?/, "").replace(/^>\s?/, "")),
      })
    );
  } else if (/^[-*]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim())) {
    const text = line.trim().replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        indent: { left: 360 },
        children: [
          new TextRun({ text: "• ", size: 22, font: "Calibri" }),
          ...inlineRuns(text.replace(/^\[[ xX]\]\s*/, "")),
        ],
      })
    );
  } else if (line.trim() === "") {
    // skip excess blanks
  } else {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: inlineRuns(line.trim()),
      })
    );
  }
  i++;
}
flushTable();

const doc = new Document({
  creator: "Aprov Licencias",
  title: "Ambiente productivo — Aprov Licencias",
  description: "Infraestructura Azure PROD",
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 720,
            bottom: 720,
            left: 720,
            right: 720,
          },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: "Universidad Tecmilenio · Aprov Licencias",
              italics: true,
              size: 18,
              color: "6B7280",
              font: "Calibri",
            }),
          ],
        }),
        ...children,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log("OK:", outPath);
});
