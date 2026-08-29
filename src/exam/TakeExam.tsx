import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExamDef, ExamResult, Question, SavedSession } from "../types";
import { useI18n } from "../i18n";
import { fmtClock, KEYS, save } from "../lib/store";
import { DifficultyDots, Modal, SubjectTag, TypeBadge } from "../components/ui";
import {
  ClockIcon, EyeIcon, FlagIcon, SaveIcon, ShieldIcon, TimerIcon, XIcon,
  ArrowRightIcon, ArrowLeftIcon, CheckIcon,
} from "../components/icons";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface Props {
  exam: ExamDef;
  session: SavedSession;
  bank: Question[];
  onFinish: (r: ExamResult) => void;
  onExit: (saved: boolean) => void;
}

export default function TakeExam({ exam, session, bank, onFinish, onExit }: Props) {
  const { t, bi, dir } = useI18n();
  const [answers, setAnswers] = useState<(number | string | null)[]>(session.answers);
  const [flags, setFlags] = useState<boolean[]>(session.flags);
  const [idx, setIdx] = useState(session.currentIndex);
  const [remaining, setRemaining] = useState<number | null>(session.remainingSec);
  const [confirm, setConfirm] = useState<null | "submit" | "exit">(null);
  const [mapOpen, setMapOpen] = useState(false);
  /* ── طبقة الأمان ── */
  const exitsRef = useRef(0);
  const [exits, setExits] = useState(0);
  const [exitWarn, setExitWarn] = useState(false);
  const [fs, setFs] = useState(false);
  const submitted = useRef(false);
  const startRef = useRef(session.startedAt);

  const qs = useMemo(
    () => session.questionIds.map((id) => bank.find((q) => q.id === id)).filter((q): q is Question => !!q),
    [session.questionIds, bank]
  );
  const total = qs.length;
  const q = qs[Math.min(idx, total - 1)];
  const order = session.optionOrders[Math.min(idx, total - 1)] ?? [];
  const timed = exam.minutes > 0;

  const answered = answers.filter((a) => a !== null && a !== "").length;
  const flagged = flags.filter(Boolean).length;

  /* حفظ تلقائي للتقدم */
  const persist = useCallback(
    (a: (number | string | null)[], f: boolean[], i: number, r: number | null) => {
      const s: SavedSession = {
        ...session,
        answers: a,
        flags: f,
        currentIndex: i,
        remainingSec: r,
        savedAt: Date.now(),
      };
      save(KEYS.sessions, replaceSession(s));
    },
    [session]
  );

  function replaceSession(s: SavedSession): SavedSession[] {
    const all = loadAllSessions();
    const key = (x: SavedSession) => x.examId + "::" + x.studentEmail;
    return [...all.filter((x) => key(x) !== key(s)), s];
  }

  useEffect(() => {
    persist(answers, flags, idx, remaining);
  }, [answers, flags, idx, remaining, persist]);

  /* المؤقت */
  useEffect(() => {
    if (!timed || remaining === null) return;
    const iv = setInterval(() => {
      setRemaining((r) => {
        if (r === null) return r;
        if (r <= 1) {
          clearInterval(iv);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timed, remaining === null]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── الأمان: منع النسخ والقوائم + رصد مغادرة النافذة + ملء الشاشة ── */
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const onKeySec = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "p", "s", "u"].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === "F12") e.preventDefault();
    };
    const onVis = () => {
      if (document.hidden && !submitted.current) {
        exitsRef.current += 1;
        setExits(exitsRef.current);
        setExitWarn(true);
      }
    };
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    window.addEventListener("keydown", onKeySec);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    setFs(!!document.fullscreenElement);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", onKeySec);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  const enterFs = () => {
    try {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch {
      /* غير مدعوم */
    }
  };

  const doSubmit = useCallback(
    (auto: boolean) => {
      if (submitted.current) return;
      submitted.current = true;
      // إزالة الجلسة المحفوظة بعد التسليم
      const all = loadAllSessions();
      save(
        KEYS.sessions,
        all.filter((s) => !(s.examId === exam.id && s.studentEmail === session.studentEmail))
      );
      onFinish({
        exam,
        items: qs.map((qq, i) => ({
          q: qq,
          order: session.optionOrders[i] ?? [],
          answer: answers[i] ?? null,
          flagged: flags[i] ?? false,
        })),
        durationSec: Math.round((Date.now() - startRef.current) / 1000),
        autoSubmitted: auto,
        exits: exitsRef.current,
      });
    },
    [answers, flags, exam, qs, session, onFinish]
  );

  /* التسليم التلقائي عند انتهاء الوقت */
  useEffect(() => {
    if (timed && remaining === 0) doSubmit(true);
  }, [remaining, timed, doSubmit]);

  const setAnswer = (a: number | string | null) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = a;
      return next;
    });
  };

  const goNext = useCallback(() => {
    setIdx((i) => Math.min(i + 1, total - 1));
  }, [total]);

  /* اختصارات لوحة المفاتيح */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.key === "f" || e.key === "F") {
        setFlags((prev) => {
          const n = [...prev];
          n[idx] = !n[idx];
          return n;
        });
      } else if (/^[1-4]$/.test(e.key)) {
        const p = Number(e.key) - 1;
        if ((q.type === "mcq" || q.type === "case") && p < order.length) {
          const orig = order[p];
          setAnswers((prev) => {
            const n = [...prev];
            n[idx] = n[idx] === orig ? null : orig;
            return n;
          });
        } else if (q.type === "tf" && p < 2) {
          setAnswers((prev) => {
            const n = [...prev];
            n[idx] = n[idx] === p ? null : p;
            return n;
          });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, q, order, goNext]);

  const timeWarn = timed && remaining !== null && remaining <= exam.minutes * 60 * 0.2;
  const timeCrit = timed && remaining !== null && remaining <= exam.minutes * 60 * 0.1;
  const isLast = idx === total - 1;
  const Fwd = dir === "rtl" ? ArrowLeftIcon : ArrowRightIcon;
  const Back = dir === "rtl" ? ArrowRightIcon : ArrowLeftIcon;

  const statusOf = (i: number) => {
    if (i === idx) return "current";
    if (flags[i]) return "flagged";
    if (answers[i] !== null && answers[i] !== "") return "answered";
    return "blank";
  };

  return (
    <div className="min-h-screen select-none">
      {/* تحذير رصد مغادرة النافذة */}
      <Modal open={exitWarn} onClose={() => setExitWarn(false)}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blood-100 text-blood-600">
            <EyeIcon size={20} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">{t("sec_exit_warn_t")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {t("sec_exit_warn_a")} <b className="text-blood-600">{exits}</b> {t("sec_exit_warn_b")}
            </p>
          </div>
        </div>
        <button onClick={() => setExitWarn(false)} className="btn-primary mt-5 w-full">
          {t("close")}
        </button>
      </Modal>

      {/* ───── الرأس ───── */}
      <header className="monitor-band sticky top-0 z-40 border-b border-pine-700 text-paper shadow-xl shadow-pine-950/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold leading-tight sm:text-xl">{bi(exam.title)}</p>
            <p className="text-[11px] text-pulse-300/70">
              {t("answered")} {answered}/{total}
              {flagged > 0 && (
                <span className="ms-3 inline-flex items-center gap-1 text-amberx-500">
                  <FlagIcon size={11} filled /> {flagged}
                </span>
              )}
              {exam.negativeMarking && (
                <span className="ms-3 text-blood-600" style={{ color: "#e88a82" }}>
                  −{exam.deduction} {t("wrong_n").toLowerCase()}
                </span>
              )}
            </p>
          </div>

          {timed && remaining !== null ? (
            <div
              className={
                "flex items-center gap-2 rounded-xl border px-4 py-2 " +
                (timeCrit
                  ? "border-blood-600 bg-blood-600/20 text-red-300"
                  : timeWarn
                    ? "border-amberx-500/60 bg-amberx-500/10 text-amberx-500"
                    : "border-pine-700 bg-pine-800/70 text-pulse-300")
              }
            >
              <TimerIcon size={18} className={timeCrit ? "blink-dot" : ""} />
              <span className="font-display text-xl font-bold tabular-nums">{fmtClock(remaining)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-pine-700 bg-pine-800/70 px-4 py-2 text-pulse-300">
              <ClockIcon size={18} />
              <span className="font-display text-xl font-bold tabular-nums">{t("no_time_limit")}</span>
            </div>
          )}

          {exits > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-xl border border-blood-600/60 bg-blood-600/15 px-3 py-2 text-xs font-bold text-red-300"
              title={t("sec_exits")}
            >
              <EyeIcon size={14} /> {exits} {t("sec_exits")}
            </span>
          )}
          {!fs && (
            <button
              onClick={enterFs}
              title={t("sec_fs_hint")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-pine-700 bg-pine-800/70 px-3 py-2 text-xs font-bold text-pulse-300 transition-colors hover:border-pulse-500 hover:text-pulse-100"
            >
              <ShieldIcon size={14} /> {t("sec_fs")}
            </button>
          )}

          <button
            onClick={() => setConfirm("exit")}
            className="rounded-lg border border-pine-700 bg-pine-800/70 p-2.5 text-pulse-300 transition-colors hover:border-blood-600 hover:text-red-300"
            title={t("exit_exam")}
            aria-label={t("exit_exam")}
          >
            <XIcon size={18} />
          </button>
        </div>
        {/* شريط التقدم */}
        <div className="h-1 w-full bg-pine-800">
          <div
            className="h-full bg-pulse-500 transition-all duration-500"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_290px]">
        {/* ───── بطاقة السؤال ───── */}
        <main>
          <article key={idx} className="card anim-q-in overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/60 px-5 py-3">
              <span className="font-display text-sm font-bold text-ink-soft">
                {t("question")} {idx + 1} {t("of")} {total}
              </span>
              <span className="ms-auto flex items-center gap-2">
                <TypeBadge type={q.type} />
                <SubjectTag id={q.subject} small />
                <DifficultyDots level={q.difficulty} />
              </span>
            </div>

            <div className="p-5 sm:p-7">
              {q.image && (
                <figure className="mb-5 overflow-hidden rounded-xl border border-line bg-white">
                  <img
                    src={q.image}
                    alt={bi(q.text)}
                    className="mx-auto max-h-80 w-auto object-contain"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                </figure>
              )}

              <h2 className="text-lg font-semibold leading-relaxed sm:text-xl">{bi(q.text)}</h2>

              {/* ── الخيارات حسب النمط ── */}
              {q.type === "fill" ? (
                <div className="mt-5">
                  <label className="lbl">{t("your_answer")}</label>
                  <input
                    className="input py-3 text-base"
                    value={typeof answers[idx] === "string" ? (answers[idx] as string) : ""}
                    onChange={(e) => setAnswer(e.target.value === "" ? null : e.target.value)}
                    placeholder={t("type_answer")}
                  />
                </div>
              ) : (
                <div className="mt-5 grid gap-2.5">
                  {(q.type === "tf"
                    ? [
                        { ar: t("true_opt"), en: t("true_opt") },
                        { ar: t("false_opt"), en: t("false_opt") },
                      ]
                    : order.map((k) => q.options[k])
                  ).map((opt, p) => {
                    const orig = q.type === "tf" ? p : order[p];
                    const chosen = answers[idx] === orig;
                    return (
                      <button
                        key={p}
                        onClick={() => setAnswer(chosen ? null : orig)}
                        className={
                          "group flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-start transition-all duration-200 " +
                          (chosen
                            ? "border-pulse-600 bg-pulse-100 shadow-md shadow-pulse-600/10"
                            : "border-line bg-white hover:border-pulse-500/60 hover:bg-pulse-100/40 hover:shadow-sm")
                        }
                      >
                        <span
                          className={
                            "grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-bold transition-colors " +
                            (chosen ? "bg-pulse-600 text-white" : "bg-paper text-ink-soft group-hover:bg-pulse-100")
                          }
                        >
                          {chosen ? <CheckIcon size={16} /> : LETTERS[p]}
                        </span>
                        <span className="flex-1 text-[15px] font-medium leading-relaxed">{bi(opt)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="mt-6 hidden text-center text-[11px] text-ink-soft md:block">{t("keyboard_hint")}</p>
            </div>
          </article>

          {/* ── أزرار التنقل ── */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="btn-ghost disabled:opacity-40">
              <Back size={16} />
              {t("prev")}
            </button>
            <button
              onClick={() => {
                setFlags((prev) => {
                  const n = [...prev];
                  n[idx] = !n[idx];
                  return n;
                });
              }}
              className={
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 font-display text-sm font-bold transition-all duration-200 " +
                (flags[idx]
                  ? "border-amberx-500 bg-amberx-100 text-amberx-600"
                  : "border-line bg-white text-ink-soft hover:border-amberx-500 hover:text-amberx-600")
              }
            >
              <FlagIcon size={15} filled={flags[idx]} />
              {t("flag_q")}
            </button>
            <span className="ms-auto flex gap-3">
              {isLast ? (
                <button onClick={() => setConfirm("submit")} className="btn-primary">
                  <CheckIcon size={16} />
                  {t("submit_exam")}
                </button>
              ) : (
                <button onClick={goNext} className="btn-primary">
                  {t("next")}
                  <Fwd size={16} />
                </button>
              )}
            </span>
          </div>
          {exam.allowSaveResume && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
              <SaveIcon size={13} className="text-pulse-600" />
              {t("session_saved")}
            </p>
          )}
        </main>

        {/* ───── خريطة الأسئلة ───── */}
        <aside>
          <div className="card sticky top-28 p-4">
            <button className="flex w-full items-center justify-between lg:pointer-events-none" onClick={() => setMapOpen((v) => !v)}>
              <h3 className="font-display text-base font-bold">{t("q_map")}</h3>
              <span className="text-xs font-bold text-pulse-700 lg:hidden">{mapOpen ? "−" : "+"}</span>
            </button>
            <div className={"mt-3 grid grid-cols-8 gap-1.5 lg:grid-cols-6 " + (mapOpen ? "" : "hidden lg:grid")}>
              {qs.map((_, i) => {
                const s = statusOf(i);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setIdx(i);
                      setMapOpen(false);
                    }}
                    className={
                      "relative grid h-9 place-items-center rounded-lg border font-display text-xs font-bold transition-all duration-150 " +
                      (s === "current"
                        ? "border-pine-900 bg-pine-900 text-pulse-300 shadow-md scale-105"
                        : s === "answered"
                          ? "border-moss-600/50 bg-moss-100 text-moss-700 hover:scale-105"
                          : s === "flagged"
                            ? "border-amberx-500/60 bg-amberx-100 text-amberx-600 hover:scale-105"
                            : "border-line bg-white text-ink-soft hover:border-pulse-500 hover:scale-105")
                    }
                    aria-label={`${t("question")} ${i + 1}`}
                  >
                    {i + 1}
                    {flags[i] && <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-amberx-500" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 text-[11px] text-ink-soft">
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-moss-600/50 bg-moss-100" /> {t("answered")}</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-amberx-500/60 bg-amberx-100" /> {t("flagged_n")}</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-line bg-white" /> {t("skipped_n")}</p>
            </div>
            <button onClick={() => setConfirm("submit")} className="btn-primary mt-4 w-full">
              <CheckIcon size={16} />
              {t("submit_exam")}
            </button>
          </div>
        </aside>
      </div>

      {/* ───── نوافذ التأكيد ───── */}
      <Modal open={confirm === "submit"} onClose={() => setConfirm(null)}>
        <h3 className="font-display text-xl font-bold">{t("confirm_submit")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {t("confirm_submit_body").replace("{a}", String(answered)).replace("{t}", String(total))}
        </p>
        {exam.negativeMarking && (
          <p className="mt-2 rounded-lg bg-blood-100 px-3 py-2 text-xs font-semibold text-blood-700">
            {t("deduction_note").replace("{v}", String(exam.deduction))}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button onClick={() => setConfirm(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button onClick={() => doSubmit(false)} className="btn-primary flex-1">
            <CheckIcon size={16} /> {t("submit_exam")}
          </button>
        </div>
      </Modal>

      <Modal open={confirm === "exit"} onClose={() => setConfirm(null)}>
        <h3 className="font-display text-xl font-bold">{t("confirm_exit")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {exam.allowSaveResume ? t("confirm_exit_save") : t("confirm_exit_body")}
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setConfirm(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button
            onClick={() => {
              persist(answers, flags, idx, remaining);
              onExit(exam.allowSaveResume);
            }}
            className="btn-primary flex-1"
          >
            {exam.allowSaveResume ? <SaveIcon size={16} /> : <XIcon size={16} />}
            {exam.allowSaveResume ? t("save_exit") : t("exit_exam")}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function loadAllSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(KEYS.sessions);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedSession[]) : [];
  } catch {
    return [];
  }
}
