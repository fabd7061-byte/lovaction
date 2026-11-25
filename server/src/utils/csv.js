function cell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function reportToCsv(report) {
  const lines = [];
  lines.push(cell("LOVACTION MINISTRIES"));
  lines.push(cell(report.title));
  lines.push(cell(`Period: ${report.periodLabel}`));
  lines.push(cell(`Generated: ${new Date(report.generatedAt).toLocaleString("en-GB")}`));
  lines.push("");

  for (const section of report.sections) {
    lines.push(cell(section.title.toUpperCase()));
    if (section.type === "stats") {
      lines.push([cell("Metric"), cell("Value")].join(","));
      section.stats.forEach((s) => {
        lines.push([cell(s.label), cell(s.value)].join(","));
      });
    } else {
      lines.push(section.columns.map(cell).join(","));
      section.rows.forEach((row) => {
        lines.push(row.map(cell).join(","));
      });
    }
    lines.push("");
  }

  lines.push(cell("Love in Action, Hope for All."));
  return `\ufeff${lines.join("\r\n")}`;
}
