export interface ExportFile {
  blob: Blob;
  url: string;
  filename: string;
  sizeKB: number;
}

const stamp = () => new Date().toISOString().slice(0, 10);

function wrap(blob: Blob, filename: string): ExportFile {
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename,
    sizeKB: Math.max(0.1, Math.round((blob.size / 1024) * 10) / 10),
  };
}

/** تجهيز ملف Excel (.xlsx) — يُنزَّل عبر رابط صريح في الواجهة */
export async function buildExcelFile(
  headers: string[],
  rows: (string | number)[][],
  baseName = "kiur-export"
): Promise<ExportFile> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h, i) => {
    const widest = Math.max(h.length * 2, ...rows.map((r) => String(r[i] ?? "").length));
    return { wch: Math.min(44, Math.max(10, widest + 2)) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KIUR");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return wrap(blob, `${baseName}-${stamp()}.xlsx`);
}

/** تجهيز ملف Word (.doc) بجدول RTL منسّق */
export function buildWordFile(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  baseName = "kiur-export"
): ExportFile {
  const esc = (v: string | number) =>
    String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const th = (s: string) =>
    `<th style="background:#0f2f29;color:#7ed4be;padding:7px 10px;font-size:12px;border:1px solid #0f2f29;text-align:right">${esc(s)}</th>`;
  const body = rows
    .map(
      (r, ri) =>
        `<tr style="background:${ri % 2 ? "#f2f6f4" : "#ffffff"}">` +
        r.map((v, ci) =>
          ci === 0
            ? `<td style="padding:6px 10px;border:1px solid #cdd8d2;font-size:12px;font-weight:bold">${esc(v)}</td>`
            : `<td style="padding:6px 10px;border:1px solid #cdd8d2;font-size:12px">${esc(v)}</td>`
        ).join("") +
        "</tr>"
    )
    .join("");

  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>KIUR — ${esc(title)}</title></head>
<body style="font-family:Arial,'Segoe UI',Tahoma,sans-serif">
<h1 style="color:#0f2f29;margin-bottom:4px">KIUR — ${esc(title)}</h1>
<p style="color:#52665e;font-size:13px">${esc(subtitle)}</p>
<table dir="rtl" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:12px">
<thead><tr>${headers.map(th).join("")}</tr></thead>
<tbody>${body}</tbody>
</table>
<p style="margin-top:20px;color:#8aa097;font-size:11px">أُنشئ بواسطة منصة KIUR لاختبارات المجموعة الطبية · ${esc(new Date().toLocaleString("ar-EG"))}</p>
</body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  return wrap(blob, `${baseName}-${stamp()}.doc`);
}
