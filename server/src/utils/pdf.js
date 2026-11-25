import PDFDocument from "pdfkit";

const INK = "#15151C";
const MUTED = "#6B6B76";
const GOLD = "#C9972F";
const GOLD_LIGHT = "#F3E3BC";
const RED = "#C23434";
const CREAM = "#FBF7EF";
const LINE = "#E8E1D4";

function drawHeart(doc, x, y, scale = 1) {
  doc.save();
  doc
    .moveTo(x, y + 4 * scale)
    .bezierCurveTo(x, y - 2 * scale, x - 6 * scale, y - 4 * scale, x - 7 * scale, y + 1 * scale)
    .bezierCurveTo(x - 7 * scale, y + 6 * scale, x, y + 10 * scale, x, y + 12 * scale)
    .bezierCurveTo(x, y + 10 * scale, x + 7 * scale, y + 6 * scale, x + 7 * scale, y + 1 * scale)
    .bezierCurveTo(x + 6 * scale, y - 4 * scale, x, y - 2 * scale, x, y + 4 * scale)
    .fill(RED);
  doc.restore();
}

function drawHeader(doc, report) {
  const { width, margins } = doc.page;
  doc.rect(0, 0, width, 6).fill(GOLD);
  doc.circle(margins.left + 18, 56, 20).lineWidth(1.6).stroke(GOLD);
  drawHeart(doc, margins.left + 18, 52, 0.75);

  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(17)
    .text("LOVACTION", margins.left + 46, 40, { characterSpacing: 1.5 });
  doc
    .fillColor(GOLD)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("M I N I S T R I E S", margins.left + 47, 63, { characterSpacing: 1 });
  doc
    .fillColor(MUTED)
    .font("Helvetica-Oblique")
    .fontSize(7.5)
    .text("Love in Action, Hope for All.", margins.left + 47, 75);

  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text(`Generated: ${new Date(report.generatedAt).toLocaleString("en-GB")}`, margins.left, 44, {
      width: width - margins.left - margins.right,
      align: "right",
    })
    .text(`By: ${report.generatedBy}`, margins.left, 58, {
      width: width - margins.left - margins.right,
      align: "right",
    });

  doc
    .moveTo(margins.left, 95)
    .lineTo(width - margins.right, 95)
    .lineWidth(0.7)
    .stroke(LINE);

  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(19)
    .text(report.title, margins.left, 115);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(9)
    .text(`Reporting period: ${report.periodLabel}`, margins.left, 140);
  doc.y = 158;
}

function drawMiniHeader(doc, report) {
  const { width, margins } = doc.page;
  doc.rect(0, 0, width, 4).fill(GOLD);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text(`LOVACTION MINISTRIES  •  ${report.title}`, margins.left, 22, {
      width: width - margins.left - margins.right,
      align: "left",
    })
    .text(report.periodLabel, margins.left, 22, {
      width: width - margins.left - margins.right,
      align: "right",
    });
  doc
    .moveTo(margins.left, 36)
    .lineTo(width - margins.right, 36)
    .lineWidth(0.5)
    .stroke(LINE);
  doc.y = 50;
}

function ensureSpace(doc, report, needed) {
  if (doc.y + needed > doc.page.height - 48) {
    doc.addPage();
    drawMiniHeader(doc, report);
  }
}

function sectionTitle(doc, report, title) {
  ensureSpace(doc, report, 40);
  doc.rect(doc.page.margins.left, doc.y + 2, 3.5, 11).fill(RED);
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(String(title).toUpperCase(), doc.page.margins.left + 10, doc.y, {
      characterSpacing: 0.8,
    });
  doc.moveDown(0.55);
}

function drawStats(doc, report, entries) {
  const left = doc.page.margins.left;
  const available = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columns = entries.length <= 2 ? 2 : 3;
  const gap = 9;
  const boxWidth = (available - gap * (columns - 1)) / columns;
  const boxHeight = 42;
  const rows = Math.ceil(entries.length / columns);
  ensureSpace(doc, report, rows * (boxHeight + gap) + 6);
  const startY = doc.y;

  entries.forEach((entry, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = left + col * (boxWidth + gap);
    const y = startY + row * (boxHeight + gap);
    doc.roundedRect(x, y, boxWidth, boxHeight, 5).fill(CREAM);
    doc.roundedRect(x, y, 2.5, boxHeight, 1.2).fill(GOLD_LIGHT);
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(7.3)
      .text(String(entry.label).toUpperCase(), x + 9, y + 8, {
        width: boxWidth - 16,
        characterSpacing: 0.4,
      });
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(String(entry.value), x + 9, y + 20, { width: boxWidth - 16 });
  });

  doc.y = startY + rows * (boxHeight + gap) + 8;
}

function drawTable(doc, report, section) {
  const left = doc.page.margins.left;
  const available = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const weights = section.weights || section.columns.map(() => 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const widths = weights.map((w) => (w / totalWeight) * available);
  const fontSize = section.columns.length > 6 ? 6.6 : 7.6;
  const rowHeight = section.columns.length > 6 ? 20 : 22;

  ensureSpace(doc, report, 46);
  const headerY = doc.y;

  doc.rect(left, headerY, available, 22).fill(INK);
  let x = left;
  section.columns.forEach((col, i) => {
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(6.8)
      .text(String(col).toUpperCase(), x + 5, headerY + 7.5, {
        width: widths[i] - 9,
        height: 10,
        ellipsis: true,
      });
    x += widths[i];
  });
  doc.y = headerY + 22;

  if (!section.rows.length) {
    doc.rect(left, doc.y, available, 24).fill(CREAM);
    doc
      .fillColor(MUTED)
      .font("Helvetica-Oblique")
      .fontSize(8)
      .text("No records for this period.", left + 8, doc.y + 8);
    doc.y += 34;
    return;
  }

  section.rows.forEach((row, rowIndex) => {
    ensureSpace(doc, report, rowHeight);
    if (doc.y === 50) {
      // A new page was added just before this row; redraw the table header.
      const y = doc.y;
      doc.rect(left, y, available, 22).fill(INK);
      let hx = left;
      section.columns.forEach((col, i) => {
        doc
          .fillColor("#FFFFFF")
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .text(String(col).toUpperCase(), hx + 5, y + 7.5, {
            width: widths[i] - 9,
            height: 10,
            ellipsis: true,
          });
        hx += widths[i];
      });
      doc.y = y + 22;
    }

    const y = doc.y;
    if (rowIndex % 2 === 0) doc.rect(left, y, available, rowHeight).fill(CREAM);
    let cx = left;
    row.forEach((value, i) => {
      const isFirst = i === 0;
      doc
        .fillColor(isFirst ? INK : "#44444E")
        .font(isFirst ? "Helvetica-Bold" : "Helvetica")
        .fontSize(fontSize)
        .text(value === null || value === undefined ? "—" : String(value), cx + 5, y + 6.5, {
          width: widths[i] - 9,
          height: rowHeight - 8,
          ellipsis: true,
          lineBreak: false,
        });
      cx += widths[i];
    });
    doc
      .moveTo(left, y + rowHeight)
      .lineTo(left + available, y + rowHeight)
      .lineWidth(0.3)
      .stroke(LINE);
    doc.y = y + rowHeight;
  });

  doc.y += 12;
}

function drawFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const bottom = doc.page.height - 34;
    doc
      .moveTo(doc.page.margins.left, bottom - 10)
      .lineTo(doc.page.width - doc.page.margins.right, bottom - 10)
      .lineWidth(0.4)
      .stroke(LINE);
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(7)
      .text("Lovaction Ministries  •  Love in Action, Hope for All.", doc.page.margins.left, bottom, {
        width: (doc.page.width - doc.page.margins.left - doc.page.margins.right) * 0.7,
        lineBreak: false,
      })
      .text(`Page ${i + 1} of ${range.count}`, doc.page.width - 140, bottom, {
        width: 100,
        align: "right",
        lineBreak: false,
      });
  }
}

export function streamReportPdf(report, res) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 48, left: 40, right: 40 },
    bufferPages: true,
    info: {
      Title: `${report.title} — Lovaction Ministries`,
      Author: "Lovaction Ministries",
      Subject: report.periodLabel,
    },
  });

  doc.pipe(res);
  drawHeader(doc, report);

  report.sections.forEach((section) => {
    sectionTitle(doc, report, section.title);
    if (section.type === "stats") {
      drawStats(doc, report, section.stats);
    } else {
      drawTable(doc, report, section);
    }
  });

  ensureSpace(doc, report, 50);
  doc
    .fillColor(GOLD)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Love in Action, Hope for All.", doc.page.margins.left, doc.y + 10, {
      width: doc.page.width - 80,
      align: "center",
    });
  drawFooters(doc);
  doc.end();
}

export { drawHeart };
