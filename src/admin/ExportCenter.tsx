import { useMemo, useState } from "react";
import type { Attempt, ExamDef } from "../types";
import { useI18n } from "../i18n";
import { fmtClock } from "../lib/store";
import { exportAttemptsExcel, exportAttemptsWord } from "../lib/exporter";
import { EmptyState, formatDate } from "../components/ui";
import { CheckIcon, DownloadIcon, FileIcon, SheetIcon } from "../components/icons";

interface Props {
  exams: ExamDef[];
  attempts: Attempt[];
}

/** مركز تصدير الدرجات: اختيار اختبار أو الكل، بصيغة Excel أو Word */
export default function ExportCenter({ exams, attempts }: Props) {
  const { t, bi, lang } = useI18n();
  const [examId, setExamId] = useState<string>("all");
  const [format, setFormat] = useState<"xlsx" | "doc">("xlsx");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const rows = useMemo(
    () =>
      attempts
        .filter((a) => examId === "all" || a.examId === examId)
        .sort((a, b) => b.date - a.date),
    [attempts, examId]
  );

  const scopeTitle =
    examId === "all" ? t("exp_all_exams") : bi(exams.find((e) => e.id === examId)?.title ?? { ar: "", en: "" });

  const doExport = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    setDone(false);
    try {
      if (format === "xlsx") await exportAttemptsExcel(rows);
      else exportAttemptsWord(rows, scopeTitle);
      setDone(true);
      setTimeout(() => setDone(false), 3500);
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
          </div>

          <div className="flex flex-col items-stretch justify-end gap-2">
            <button onClick={doExport} disabled={busy || rows.length === 0} className="btn-primary h-full px-8 py-3 text-base">
              <DownloadIcon size={17} />
              {busy ? t("loading") : format === "xlsx" ? t("exp_do_excel") : t("exp_do_word")}
            </button>
            {done && (
              <p className="anim-pop inline-flex items-center justify-center gap-1.5 rounded-lg bg-moss-100 px-3 py-1.5 text-xs font-bold text-moss-700">
                <CheckIcon size={13} /> {t("exp_done")}
              </p>
            )}
          </div>
        </div>
      </div>

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
                  <th className="px-4 py-2.5 text-start font-bold">{t("email")}</th>
                  <th className="px-4 py-2.5 text-start font-bold">{t("exams_tab")}</th>
                  <th className="px-4 py-2.5 text-start font-bold">{t("date")}</th>
                  <th className="px-4 py-2.5 text-start font-bold">٪</th>
                  <th className="px-4 py-2.5 text-start font-bold">{t("result")}</th>
                  <th className="px-4 py-2.5 text-start font-bold">{t("sec_exits")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, 8).map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-pulse-100/30">
                    <td className="px-4 py-2.5 font-semibold">{a.studentName}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft" dir="ltr">{a.studentEmail}</td>
                    <td className="px-4 py-2.5 text-xs">{bi(a.examTitle)}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft">{formatDate(a.date, lang)}</td>
                    <td className="px-4 py-2.5 font-display font-bold tabular-nums">{a.percent}٪</td>
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
                    <td className="px-4 py-2.5 text-xs tabular-nums">{a.exits ?? 0}</td>
                  </tr>
                ))}
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
    </div>
  );
}
