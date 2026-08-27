import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import type { Attempt, ExamResult, Question, ReviewItem, SubjectId } from "../types";
import { useI18n } from "../i18n";
import { SUBJECTS, subjectById } from "../data/seed";
import { fmtClock, isCorrect } from "../lib/store";
import { DifficultyDots, KiurWordmark, Modal, PrintPortal, SubjectTag, TypeBadge, formatDate } from "../components/ui";
import {
  AwardIcon, BulbIcon, CheckIcon, ChevronDownIcon, ClipboardIcon, ClockIcon,
  FlagIcon, PrinterIcon, RefreshIcon, ShareIcon, XIcon,
} from "../components/icons";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/* ═══════════ قائمة المراجعة المشتركة ═══════════ */

export function ReviewList({
  items,
  bank,
}: {
  items: { qid: string; order: number[]; answer: number | string | null; flagged?: boolean }[];
  bank: Question[];
}) {
  const { t, bi } = useI18n();
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const resolved = items.map((r) => ({ r, q: bank.find((q) => q.id === r.qid) ?? null }));
  const status = (r: ReviewItem, q: Question | null): "correct" | "wrong" | "skipped" =>
    r.answer === null || r.answer === "" ? "skipped" : q && isCorrect(q, r.answer) ? "correct" : "wrong";

  const counts = {
    all: resolved.length,
    correct: resolved.filter((x) => x.q && status(x.r, x.q) === "correct").length,
    wrong: resolved.filter((x) => status(x.r, x.q) === "wrong").length,
    skipped: resolved.filter((x) => status(x.r, x.q) === "skipped").length,
  };

  const tabs = [
    { id: "all" as const, label: t("all_q"), n: counts.all, tone: "bg-pine-900 text-pulse-300" },
    { id: "wrong" as const, label: t("wrong_only"), n: counts.wrong, tone: "bg-blood-600 text-white" },
    { id: "correct" as const, label: t("correct_only"), n: counts.correct, tone: "bg-moss-600 text-white" },
    { id: "skipped" as const, label: t("skipped_only"), n: counts.skipped, tone: "bg-ink-soft text-white" },
  ];

  const shown = resolved.map((x, i) => ({ ...x, i })).filter((x) => filter === "all" || status(x.r, x.q) === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => {
              setFilter(tb.id);
              setOpenIdx(null);
            }}
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 " +
              (filter === tb.id ? tb.tone + " shadow-md" : "bg-paper text-ink-soft hover:bg-paper-deep")
            }
          >
            {tb.label} ({tb.n})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line bg-paper/60 p-6 text-center text-sm text-ink-soft">
          {t("no_items_filter")}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map(({ r, q, i }) => {
            const st = status(r, q);
            const open = openIdx === i;
            const stBox =
              st === "correct"
                ? "bg-moss-100 text-moss-700 border border-moss-600/30"
                : st === "wrong"
                  ? "bg-blood-100 text-blood-700 border border-blood-600/30"
                  : "bg-paper-deep text-ink-soft border border-line";
            return (
              <li key={i} className="overflow-hidden rounded-xl border border-line bg-white transition-shadow duration-200 hover:shadow-md">
                <button onClick={() => setOpenIdx(open ? null : i)} className="flex w-full items-center gap-3 p-4 text-start" aria-expanded={open}>
                  <span className={"grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-xs font-bold " + stBox}>
                    {st === "correct" ? <CheckIcon size={16} /> : st === "wrong" ? <XIcon size={16} /> : "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      <span className="font-display text-ink-soft">#{i + 1} · </span>
                      {q ? bi(q.text) : <em className="text-ink-soft">{t("q_removed_note")}</em>}
                    </span>
                    {q && (
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <SubjectTag id={q.subject} small />
                        <TypeBadge type={q.type} />
                        {r.flagged && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amberx-600">
                            <FlagIcon size={11} filled /> {t("flagged_n")}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon size={18} className={"shrink-0 text-ink-soft transition-transform duration-300 " + (open ? "rotate-180" : "")} />
                </button>

                {open && q && (
                  <div className="anim-fade-up border-t border-line bg-paper/50 p-4">
                    {q.image && (
                      <img
                        src={q.image}
                        alt=""
                        className="mb-3 max-h-56 rounded-lg border border-line bg-white object-contain"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                    )}
                    <div className="space-y-2">
                      {q.type === "fill" ? (
                        <div
                          className={
                            "rounded-lg border-2 p-3 text-sm " +
                            (st === "correct" ? "border-moss-600 bg-moss-100" : st === "wrong" ? "border-blood-600 bg-blood-100" : "border-line bg-white")
                          }
                        >
                          <p className="text-xs font-bold text-ink-soft">{t("your_answer")}:</p>
                          <p className="mt-0.5 font-semibold">{r.answer === null || r.answer === "" ? "—" : String(r.answer)}</p>
                          <p className="mt-2 text-xs font-bold text-ink-soft">{t("correct_answer")}:</p>
                          <p className="mt-0.5 font-semibold text-moss-700">{(q.answers ?? []).join(" / ")}</p>
                        </div>
                      ) : q.type === "tf" ? (
                        [t("true_opt"), t("false_opt")].map((label, oi) => {
                          const isC = q.correct === oi;
                          const isU = r.answer === oi;
                          return (
                            <OptionRow key={oi} label={oi === 0 ? "T" : "F"} text={label} isCorrect={isC} isUser={isU} />
                          );
                        })
                      ) : (
                        r.order.map((orig, p) => {
                          const opt = q.options[orig];
                          if (!opt) return null;
                          return (
                            <OptionRow
                              key={p}
                              label={LETTERS[p]}
                              text={bi(opt)}
                              isCorrect={orig === q.correct}
                              isUser={r.answer === orig}
                            />
                          );
                        })
                      )}
                    </div>
                    <div className="mt-3 rounded-lg border border-line bg-white p-3.5">
                      <p className="flex items-center gap-1.5 font-display text-sm font-bold text-pulse-700">
                        <BulbIcon size={15} className="text-amberx-600" />
                        {t("explanation")}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed">{bi(q.explanation)}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OptionRow({ label, text, isCorrect, isUser }: { label: string; text: string; isCorrect: boolean; isUser: boolean }) {
  return (
    <div
      className={
        "flex items-center gap-3 rounded-lg border-2 p-2.5 text-sm " +
        (isCorrect ? "border-moss-600 bg-moss-100" : isUser ? "border-blood-600 bg-blood-100" : "border-transparent bg-white")
      }
    >
      <span
        className={
          "grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-xs font-bold " +
          (isCorrect ? "bg-moss-600 text-white" : isUser ? "bg-blood-600 text-white" : "bg-paper text-ink-soft")
        }
      >
        {label}
      </span>
      <span className="flex-1 font-medium">{text}</span>
      {isCorrect && <CheckIcon size={16} className="text-moss-600" />}
      {isUser && !isCorrect && <XIcon size={16} className="text-blood-600" />}
    </div>
  );
}

/* ═══════════ نافذة مراجعة محاولة سابقة ═══════════ */

export function AttemptReviewModal({
  attempt,
  bank,
  onClose,
}: {
  attempt: Attempt;
  bank: Question[];
  onClose: () => void;
}) {
  const { t, bi } = useI18n();
  return (
    <Modal open onClose={onClose} wide>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold">{bi(attempt.examTitle)}</h3>
          <p className="mt-1 text-xs text-ink-soft">
            {formatDate(attempt.date, "ar")} ·{" "}
            <span className={attempt.passed ? "font-bold text-moss-700" : "font-bold text-blood-700"}>
              {attempt.percent}٪ — {attempt.passed ? t("passed") : t("failed")}
            </span>
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-line p-2 text-ink-soft hover:border-blood-600 hover:text-blood-600" aria-label={t("close")}>
          <XIcon size={16} />
        </button>
      </div>
      <ReviewList items={attempt.review} bank={bank} />
    </Modal>
  );
}

/* ═══════════ شاشة النتيجة ═══════════ */

interface Props {
  result: ExamResult;
  attempt: Attempt;
  bank: Question[];
  studentName: string;
  onRetry: () => void;
  onHome: () => void;
}

export default function ExamResults({ result, attempt, bank, studentName, onRetry, onHome }: Props) {
  const { t, bi, lang } = useI18n();
  const { exam, items } = result;
  const percent = attempt.percent;
  const passed = attempt.passed;

  const perSubject = useMemo(() => {
    const m = new Map<SubjectId, { c: number; tt: number }>();
    items.forEach((it) => {
      const cur = m.get(it.q.subject) ?? { c: 0, tt: 0 };
      cur.tt += 1;
      if (isCorrect(it.q, it.answer)) cur.c += 1;
      m.set(it.q.subject, cur);
    });
    return m;
  }, [items]);

  /* الحلقة المتحركة + الاحتفال */
  const [ringOn, setRingOn] = useState(false);
  useEffect(() => {
    const to = setTimeout(() => setRingOn(true), 150);
    return () => clearTimeout(to);
  }, []);
  useEffect(() => {
    if (passed) {
      const colors = ["#0E7C66", "#7ED4BE", "#E0A23C", "#FFFFFF"];
      confetti({ particleCount: 110, spread: 75, origin: { y: 0.35 }, colors, zIndex: 60 });
      const to = setTimeout(
        () => confetti({ particleCount: 60, spread: 100, origin: { y: 0.3, x: 0.75 }, colors, zIndex: 60 }),
        350
      );
      return () => clearTimeout(to);
    }
  }, [passed]);

  const C = 2 * Math.PI * 62;
  const offset = ringOn ? C * (1 - percent / 100) : C;
  const ringColor = percent >= 85 ? "#1E8A56" : percent >= exam.passPercent ? "#159A7E" : "#C4473E";

  const [certOpen, setCertOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const summaryText = `KIUR — ${bi(exam.title)}\n${studentName}\n${t("score_word")}: ${percent}٪ (${attempt.correct}/${attempt.total})\n${passed ? t("passed_msg") : t("failed_msg")}\n${new Date(attempt.date).toLocaleDateString()}`;

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard غير متاح */
    }
  };

  return (
    <div className="anim-fade-up">
      {/* ───── رأس النتيجة ───── */}
      <header className="monitor-band relative overflow-hidden text-paper">
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-44 w-44">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
              <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(126,212,190,0.15)" strokeWidth="13" />
              <circle
                cx="80" cy="80" r="62" fill="none"
                stroke={ringColor} strokeWidth="13" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 10px ${ringColor}66)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="vital-num text-5xl" style={{ color: ringColor, textShadow: `0 0 20px ${ringColor}55` }}>{percent}٪</p>
              <p className="mt-1 text-[11px] font-semibold tracking-widest text-pulse-300/70 uppercase">{t("score_word")}</p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white " + (passed ? "bg-moss-600" : "bg-blood-600")}>
                {passed ? <CheckIcon size={14} /> : <XIcon size={14} />}
                {passed ? t("passed_msg") : t("failed_msg")} · {t("pass_mark")} {exam.passPercent}٪
              </span>
              {result.autoSubmitted && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amberx-500/40 bg-amberx-500/15 px-3 py-1 text-xs font-bold text-amberx-500">
                  <ClockIcon size={13} /> {t("auto_submitted")}
                </span>
              )}
              {exam.negativeMarking && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pine-700 bg-pine-800/70 px-3 py-1 text-xs font-semibold text-pulse-300">
                  {t("raw_score")}: {attempt.rawScore}/{attempt.total}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{bi(exam.title)}</h1>
            <p className="mt-1 text-sm text-pulse-300/80">{studentName}</p>

            <div className="mt-5 flex flex-wrap gap-2.5 text-sm">
              <DarkChip color="text-moss-600" label={t("correct_n")} value={attempt.correct} />
              <DarkChip color="text-blood-600" label={t("wrong_n")} value={attempt.wrong} />
              <DarkChip color="text-ink-soft" label={t("skipped_n")} value={attempt.skipped} />
              <span className="inline-flex items-center gap-2 rounded-lg border border-pine-700 bg-pine-800/70 px-3.5 py-2">
                <ClockIcon size={16} className="text-pulse-300" />
                <span className="font-bold tabular-nums">{fmtClock(attempt.durationSec)}</span>
                <span className="text-xs text-pulse-300/70">{t("duration")}</span>
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button onClick={onRetry} className="btn-primary">
                <RefreshIcon size={16} /> {t("retry")}
              </button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-pine-700 bg-pine-800/70 px-4 py-2.5 font-display text-sm font-bold text-pulse-300 transition-colors hover:bg-pine-800">
                <PrinterIcon size={16} /> {t("export_pdf")}
              </button>
              {passed && (
                <button onClick={() => setCertOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-amberx-500 px-4 py-2.5 font-display text-sm font-bold text-pine-950 shadow-lg shadow-amberx-500/25 transition-all hover:brightness-110">
                  <AwardIcon size={16} /> {t("certificate")}
                </button>
              )}
              <button onClick={copySummary} className="inline-flex items-center gap-2 rounded-lg border border-pine-700 bg-pine-800/70 px-4 py-2.5 font-display text-sm font-bold text-pulse-300 transition-colors hover:bg-pine-800">
                <ShareIcon size={16} /> {copied ? t("copied") : t("share_summary")}
              </button>
              <button onClick={onHome} className="inline-flex items-center gap-2 rounded-lg border border-pine-700 bg-pine-800/70 px-4 py-2.5 font-display text-sm font-bold text-pulse-300 transition-colors hover:bg-pine-800">
                <ClipboardIcon size={16} /> {t("back_home")}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <section className="card anim-fade-up h-fit p-6" style={{ animationDelay: "0.15s" }}>
          <h2 className="font-display text-xl font-bold">{t("subject_perf")}</h2>
          <div className="mt-5 space-y-4">
            {SUBJECTS.filter((s) => perSubject.has(s.id)).map((s) => {
              const v = perSubject.get(s.id)!;
              const p = Math.round((v.c / v.tt) * 100);
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{bi(s.name)}</span>
                    <span className="font-display font-bold tabular-nums" style={{ color: s.color }}>
                      {p}٪ <span className="text-xs font-semibold text-ink-soft">({v.c}/{v.tt})</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${p}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          {exam.negativeMarking && (
            <p className="mt-5 rounded-lg bg-paper/70 p-3 text-xs leading-relaxed text-ink-soft">
              {t("deduction_note").replace("{v}", String(exam.deduction))}
            </p>
          )}
        </section>

        <section className="card anim-fade-up p-6" style={{ animationDelay: "0.25s" }}>
          <h2 className="mb-4 font-display text-xl font-bold">{t("full_review")}</h2>
          <ReviewList
            items={items.map((it) => ({ qid: it.q.id, order: it.order, answer: it.answer, flagged: it.flagged }))}
            bank={bank}
          />
        </section>
      </main>

      {/* ───── نسخة الطباعة ───── */}
      {certOpen ? (
        <PrintPortal>
          <Certificate attempt={attempt} studentName={studentName} />
        </PrintPortal>
      ) : (
        <PrintPortal>
          <div style={{ fontFamily: "IBM Plex Sans Arabic, sans-serif", color: "#152722", direction: lang === "ar" ? "rtl" : "ltr" }}>
            <div style={{ borderBottom: "3px solid #0E7C66", paddingBottom: 12, marginBottom: 20 }}>
              <h1 style={{ fontFamily: "Changa, sans-serif", margin: 0, fontSize: 28 }}>KIUR — {bi(exam.title)}</h1>
              <p style={{ margin: "6px 0 0", color: "#52665e", fontSize: 13 }}>
                {studentName} · {formatDate(attempt.date, lang)}
              </p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <tbody>
                {[
                  [t("score_word"), `${percent}٪`],
                  [t("passed_msg") + " / " + t("failed_msg"), passed ? t("passed_msg") : t("failed_msg")],
                  [t("correct_n"), String(attempt.correct)],
                  [t("wrong_n"), String(attempt.wrong)],
                  [t("skipped_n"), String(attempt.skipped)],
                  [t("raw_score"), `${attempt.rawScore}/${attempt.total}`],
                  [t("duration"), fmtClock(attempt.durationSec)],
                  [t("pass_mark"), `${exam.passPercent}٪`],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ padding: "6px 10px", border: "1px solid #d8e3dd", background: "#f0f4f1", fontWeight: 700 }}>{k}</td>
                    <td style={{ padding: "6px 10px", border: "1px solid #d8e3dd" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2 style={{ fontFamily: "Changa, sans-serif", fontSize: 18, marginTop: 24 }}>{t("subject_perf")}</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <tbody>
                {SUBJECTS.filter((s) => attempt.perSubject[s.id]).map((s) => {
                  const v = attempt.perSubject[s.id]!;
                  return (
                    <tr key={s.id}>
                      <td style={{ padding: "6px 10px", border: "1px solid #d8e3dd", fontWeight: 700 }}>{bi(s.name)}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #d8e3dd" }}>{v.c}/{v.t} — {Math.round((v.c / v.t) * 100)}٪</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PrintPortal>
      )}

      {/* ───── نافذة الشهادة ───── */}
      {certOpen && (
        <Modal open onClose={() => setCertOpen(false)} wide>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold">
              <AwardIcon size={20} className="text-amberx-600" /> {t("certificate")}
            </h3>
            <button onClick={() => setCertOpen(false)} className="rounded-lg border border-line p-2 text-ink-soft hover:border-blood-600 hover:text-blood-600" aria-label={t("close")}>
              <XIcon size={16} />
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-paper p-2">
            <div className="mx-auto origin-top scale-[0.62] sm:scale-75 md:scale-90" style={{ width: 720 }}>
              <Certificate attempt={attempt} studentName={studentName} />
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button onClick={() => window.print()} className="btn-primary">
              <PrinterIcon size={16} /> {t("print")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DarkChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-pine-700 bg-pine-800/70 px-3.5 py-2">
      <span className={"font-display text-lg font-bold tabular-nums " + color}>{value}</span>
      <span className="text-xs text-pulse-300/70">{label}</span>
    </span>
  );
}

/* ═══════════ الشهادة ═══════════ */

function Certificate({ attempt, studentName }: { attempt: Attempt; studentName: string }) {
  const { t, bi, lang } = useI18n();
  return (
    <div
      style={{
        width: 720,
        minHeight: 500,
        background: "#fbfdfc",
        border: "10px solid #0a211d",
        outline: "2px solid #0E7C66",
        outlineOffset: -18,
        padding: "48px 56px",
        textAlign: "center",
        fontFamily: "IBM Plex Sans Arabic, sans-serif",
        color: "#152722",
        position: "relative",
        direction: lang === "ar" ? "rtl" : "ltr",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <KiurWordmark size="md" />
      </div>
      <p style={{ margin: 0, letterSpacing: 4, fontSize: 12, fontWeight: 700, color: "#0E7C66", textTransform: "uppercase" }}>
        {t("tagline")}
      </p>
      <div style={{ width: 120, height: 2, background: "#E0A23C", margin: "18px auto" }} />
      <h1 style={{ fontFamily: "Changa, sans-serif", fontSize: 40, margin: 0, color: "#0a211d" }}>{t("cert_title")}</h1>
      <p style={{ margin: "14px 0 4px", fontSize: 15, color: "#52665e" }}>{t("cert_body")}</p>
      <p style={{ fontFamily: "Changa, sans-serif", fontSize: 34, fontWeight: 800, margin: "4px 0", color: "#0E7C66" }}>{studentName}</p>
      <p style={{ margin: "10px 0 4px", fontSize: 15, color: "#52665e" }}>
        {t("cert_body2")} <strong style={{ color: "#152722" }}>{bi(attempt.examTitle)}</strong>
      </p>
      <p style={{ margin: "6px 0", fontSize: 15, color: "#52665e" }}>
        {t("cert_score")}{" "}
        <strong style={{ fontFamily: "Changa, sans-serif", fontSize: 26, color: "#C4882A" }}>{attempt.percent}٪</strong>
        <span style={{ fontSize: 12, marginInlineStart: 8 }}>({attempt.correct}/{attempt.total})</span>
      </p>
      <p style={{ fontSize: 13, color: "#52665e" }}>{formatDate(attempt.date, lang)}</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 44 }}>
        <div style={{ textAlign: "center" }}>
          <svg width="110" height="40" viewBox="0 0 110 40">
            <path d="M5 30 C 25 5, 40 35, 55 18 S 90 10, 105 25" fill="none" stroke="#0a211d" strokeWidth="2" />
          </svg>
          <div style={{ borderTop: "1.5px solid #152722", width: 150, paddingTop: 6, fontSize: 12, fontWeight: 700 }}>KIUR</div>
        </div>
        {/* الختم */}
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
          <circle cx="48" cy="48" r="44" fill="none" stroke="#0E7C66" strokeWidth="3" />
          <circle cx="48" cy="48" r="36" fill="none" stroke="#0E7C66" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M22 48h12l5-11 9 22 6-13 4 4h16" fill="none" stroke="#0E7C66" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <text x="48" y="72" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0E7C66" fontFamily="Changa, sans-serif">PASSED</text>
        </svg>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Changa, sans-serif", fontSize: 18, color: "#0a211d" }}>KIUR · {new Date(attempt.date).getFullYear()}</div>
          <div style={{ borderTop: "1.5px solid #152722", width: 150, paddingTop: 6, fontSize: 12, fontWeight: 700, marginInlineStart: "auto" }}>
            {t("platform_name")}
          </div>
        </div>
      </div>
    </div>
  );
}
