import type { Attempt } from "../types";
import { fmtClock } from "./store";

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function headerRow(): string[] {
  return [
    "الطالب / Student",
    "البريد / Email",
    "الاختبار / Exam",
    "التاريخ / Date",
    "صحيحة",
    "خاطئة",
    "بلا إجابة",
    "الدرجة الخام",
    "النسبة ٪",
    "نسبة النجاح ٪",
    "النتيجة / Result",
    "الزمن",
    "مغادرات النافذة",
  ];
}

function toRow(a: Attempt): (string | number)[] {
  return [
    a.studentName,
    a.studentEmail,
    `${a.examTitle.ar} — ${a.examTitle.en}`,
    fmtDate(a.date),
    a.correct,
    a.wrong,
    a.skipped,
    a.rawScore,
    a.percent,
    a.passPercent,
    a.passed ? "ناجح PASS" : "راسب FAIL",
    fmtClock(a.durationSec),
    a.exits ?? 0,
  ];
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** تصدير درجات الطلاب بصيغة Excel (.xlsx) */
export async function exportAttemptsExcel(attempts: Attempt[]): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headerRow(), ...attempts.map(toRow)]);
  ws["!cols"] = [
    { wch: 22 }, { wch: 26 }, { wch: 42 }, { wch: 18 }, { wch: 8 },
    { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 9 }, { wch: 12 },
    { wch: 12 }, { wch: 9 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KIUR Grades");
  XLSX.writeFile(wb, `kiur-grades-${stamp()}.xlsx`);
}

/** تصدير درجات الطلاب بصيغة Word (.doc) */
export function exportAttemptsWord(attempts: Attempt[], scopeTitle: string): void {
  const th = (s: string) => `<th style="background:#0f2f29;color:#7ed4be;padding:6px 10px;font-size:12px">${s}</th>`;
  const rows = attempts
    .map((a) => {
      const td = (v: string | number, bold = false) =>
        `<td style="padding:6px 10px;border:1px solid #bbb;font-size:12px;${bold ? "font-weight:bold" : ""}">${v}</td>`;
      return (
        "<tr>" +
        td(a.studentName, true) +
        td(a.studentEmail) +
        td(`${a.examTitle.ar} — ${a.examTitle.en}`) +
        td(fmtDate(a.date)) +
        td(a.correct) +
        td(a.wrong) +
        td(a.skipped) +
        td(a.rawScore) +
        td(`${a.percent}%`) +
        td(`${a.passPercent}%`) +
        td(a.passed ? "ناجح PASS" : "راسب FAIL", true) +
        td(fmtClock(a.durationSec)) +
        td(a.exits ?? 0) +
        "</tr>"
      );
    })
    .join("");

  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>KIUR — ${scopeTitle}</title></head>
<body style="font-family:Arial,'Segoe UI',sans-serif">
<h1 style="color:#0f2f29">KIUR — سجل درجات الطلاب</h1>
<p style="color:#555;font-size:13px">النطاق: <b>${scopeTitle}</b> · عدد السجلات: <b>${attempts.length}</b> · تاريخ التصدير: ${fmtDate(Date.now())}</p>
<table dir="rtl" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
<thead><tr>${headerRow().map(th).join("")}</tr></thead>
<tbody>${rows}</tbody>
</table>
<p style="margin-top:18px;color:#888;font-size:11px">أُنشئ بواسطة منصة KIUR لاختبارات المجموعة الطبية</p>
</body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kiur-grades-${stamp()}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
