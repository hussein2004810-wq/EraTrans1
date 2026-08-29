import { useMemo, useState } from "react";
import type { Account, Attempt, ExamDef } from "../types";
import { useI18n } from "../i18n";
import { fmtClock } from "../lib/store";
import { findCollege, findDeptInUniversity, findUniversity } from "../data/hierarchy";
import { buildExcelFile, buildWordFile, downloadFile, type ExportFile } from "../lib/exporter";
import { EmptyState, Modal, formatDate } from "../components/ui";
import { CheckIcon, DownloadIcon, FileIcon, InfoIcon, SheetIcon } from "../components/icons";

interface Props {
  exams: ExamDef[];
  attempts: Attempt[];
  accounts: Account[];
}

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * مركز تصدير الدرجات — صفوف مفلترة حسب نطاق المشرف (فلترة تتم في اللوحة الأم)،
 * مع أعمدة الجامعة/الكلية/القسم/المرحلة، وتنزيل صريح يعمل في كل البيئات.
 */
export default function ExportCenter({ exams, attempts, accounts }: Props) {
  const { t, bi, lang } = useI18n();
  const [examId, setExamId] = useState<string>("all");
  const [format, setFormat] = useState<"xlsx" | "doc">("xlsx");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<ExportFile | null>(null);

  const accMap = useMemo(() => new Map(accounts.map((a) => [a.email, a])), [accounts]);

  const rows = useMemo(
    () =>
      attempts
        .filter((a) => examId === "all" || a.examId === examId)
        .sort((a, b) => b.date - a.date),
    [attempts, examId]
  );

  const scopeTitle =
    examId === "all" ? t("exp_all_exams") : bi(exams.find((e) => e.id === examId)?.title ?? { ar: "", en: "" });

  const headers = useMemo(
    () => [
      "الطالب / Student",
      "البريد / Email",
      "الجامعة / University",
      "الكلية / College",
      "القسم / Department",
      "المرحلة / Level",
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
      "مغادرات",
    ],
    []
  );

  const buildRows = (): (string | number)[][] =>
    rows.map((a) => {
      const acc = accMap.get(a.studentEmail);
      const uni = findUniversity(acc?.university)?.name;
      const col = findCollege(acc?.college)?.name;
      const dept = findDeptInUniversity(acc?.university, acc?.department)?.dept.name;
      return [
        a.studentName,
        a.studentEmail,
        uni ? `${uni.ar} / ${uni.en}` : "—",
        col ? `${col.ar} / ${col.en}` : "—",
        dept ? `${dept.ar} / ${dept.en}` : "—",
        acc?.year ?? "—",
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
    });

  const doExport = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    if (file) URL.revokeObjectURL(file.url);
    setFile(null);
    try {
      const data = buildRows();
      const f =
        format === "xlsx"
          ? await buildExcelFile(headers, data, "kiur-grades")
          : buildWordFile(
              t("exp_title"),
              `${t("exp_choose_exam")}: ${scopeTitle} · ${t("exp_rows")}: ${rows.length}`,
              headers,
              data,
              "kiur-grades"
            );
      setFile(f);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
          <DownloadIcon size={20} className="text-pulse-600" />
          <h2 className="font-display text-xl font-bold">{t("exp_title")}</h2>
          <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">
            {rows.length} {t("exp_rows")}
          </span>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div>
              <label className="lbl">{t("exp_choose_exam")}</label>
              <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
                <option value="all">{t("exp_all_exams")}</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {bi(ex.title)}
                    {ex.university
                      ? ` — ${bi(findUniversity(ex.university)?.name ?? { ar: "", en: "" })}`
                      : ` — ${t("shared_all_unis")}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl">{t("exp_format")}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat("xlsx")}
                  className={
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-all " +
                    (format === "xlsx"
                      ? "border-moss-600 bg-moss-100 text-moss-700"
                      : "border-line bg-white text-ink-soft hover:border-moss-600/50")
                  }
                >
                  <SheetIcon size={16} /> Excel (.xlsx)
                </button>
                <button
                  onClick={() => setFormat("doc")}
                  className={
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-all " +
                    (format === "doc"
                      ? "border-moss-600 bg-moss-100 text-moss-700"
                      : "border-line bg-white text-ink-soft hover:border-moss-600/50")
                  }
                >
                  <FileIcon size={16} /> Word (.doc)
                </button>
              </div>
            </div>
            <p className="flex items-start gap-2 rounded-lg bg-paper/70 p-3 text-[11px] leading-relaxed text-ink-soft">
              <InfoIcon size={14} className="mt-0.5 shrink-0 text-pulse-600" />
              {t("exp_scope_note")}
            </p>
          </div>

          <div className="flex flex-col items-stretch justify-end">
            <button onClick={doExport} disabled={busy || rows.length === 0} className="btn-primary h-full px-8 py-3 text-base">
              <DownloadIcon size={17} />
              {busy ? t("loading") : format === "xlsx" ? t("exp_do_excel") : t("exp_do_word")}
            </button>
          </div>
        </div>
      </div>

      {/* معاينة */}
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-paper/50 px-5 py-3">
          <h3 className="font-display text-sm font-bold text-ink-soft">
            {t("exp_preview")} — {scopeTitle}
          </h3>
        </div>
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<DownloadIcon size={22} />} text={t("exp_no_rows")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-xs text-ink-soft">
                  <th className="px-4 py-2.5 text-start font-bold">{t("full_name")}</th>
                  <th className="px-3 py-2.5 text-start font-bold">{t("university_col")}</th>
                  <th className="px-3 py-2.5 text-start font-bold">{t("department_col")}</th>
                  <th className="px-3 py-2.5 text-start font-bold">{t("exams_tab")}</th>
                  <th className="px-3 py-2.5 text-start font-bold">{t("date")}</th>
                  <th className="px-3 py-2.5 text-start font-bold">٪</th>
                  <th className="px-4 py-2.5 text-start font-bold">{t("result")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, 8).map((a) => {
                  const acc = accMap.get(a.studentEmail);
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-pulse-100/30">
                      <td className="px-4 py-2.5">
                        <p className="font-semibold">{a.studentName}</p>
                        <p className="text-[11px] text-ink-soft" dir="ltr">{a.studentEmail}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {bi(findUniversity(acc?.university)?.name ?? { ar: "—", en: "—" })}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {bi(findDeptInUniversity(acc?.university, acc?.department)?.dept.name ?? { ar: "—", en: "—" })}
                      </td>
                      <td className="px-3 py-2.5 text-xs">{bi(a.examTitle)}</td>
                      <td className="px-3 py-2.5 text-xs text-ink-soft">{formatDate(a.date, lang)}</td>
                      <td className="px-3 py-2.5 font-display font-bold tabular-nums">{a.percent}٪</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[11px] font-bold " +
                            (a.passed ? "bg-moss-100 text-moss-700" : "bg-blood-100 text-blood-700")
                          }
                        >
                          {a.passed ? t("passed") : t("failed")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 8 && (
              <p className="border-t border-line bg-paper/40 px-5 py-2 text-center text-[11px] text-ink-soft">
                + {rows.length - 8} {t("exp_rows")}…
              </p>
            )}
          </div>
        )}
      </div>

      {/* نافذة التنزيل */}
      <Modal open={!!file} onClose={() => setFile(null)}>
        {file && (
          <div className="text-center">
            <span className="anim-pop mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-moss-100 text-moss-600">
              <CheckIcon size={30} />
            </span>
            <h3 className="mt-3 font-display text-xl font-bold">{t("exp_ready")}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              <b className="text-ink" dir="ltr">{file.filename}</b> · {file.sizeKB} KB · {rows.length} {t("exp_rows")}
            </p>
            <p className="mt-1 text-xs text-ink-soft/80">{t("exp_click_hint")}</p>
            <button
              onClick={() => downloadFile(file)}
              className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 py-3 text-base"
            >
              <DownloadIcon size={18} /> {t("exp_download_now")}
            </button>
            <a
              href={file.dataUri}
              download={file.filename}
              rel="noreferrer"
              className="btn-ghost mt-2 inline-flex w-full items-center justify-center gap-2 no-underline"
            >
              <FileIcon size={15} /> {t("exp_open_tab")}
            </a>
            <button onClick={() => setFile(null)} className="btn-ghost mt-2 w-full">
              {t("close")}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
