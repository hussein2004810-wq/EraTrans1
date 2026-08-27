import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import type { ExamResult, SubjectId } from "../types";
import { SUBJECTS, subjectById } from "../data/questions";
import { fmtTime, LETTERS, SubjectTag } from "./ui";
import {
  BulbIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  ClockIcon,
  FlagIcon,
  RefreshIcon,
  TimerIcon,
  XIcon,
} from "./icons";

interface ResultsProps {
  result: ExamResult;
  onRetry: () => void;
  onHome: () => void;
}

type Filter = "all" | "wrong" | "correct" | "skipped";

export default function Results({ result, onRetry, onHome }: ResultsProps) {
  const { questions, answers, flags, config, durationSec } = result;
  const total = questions.length;

  const { correct, wrong, skipped, flagged, percent } = useMemo(() => {
    let c = 0, w = 0, s = 0;
    answers.forEach((a, i) => {
      if (a === null) s++;
      else if (a === questions[i].correct) c++;
      else w++;
    });
    return {
      correct: c,
      wrong: w,
      skipped: s,
      flagged: flags.filter(Boolean).length,
      percent: Math.round((c / total) * 100),
    };
  }, [answers, flags, questions, total]);

  const passed = percent >= 60;

  const perSubject = useMemo(() => {
    const m = new Map<SubjectId, { c: number; t: number }>();
    questions.forEach((q, i) => {
      const id = q.base.subject;
      const cur = m.get(id) ?? { c: 0, t: 0 };
      cur.t++;
      if (answers[i] === q.correct) cur.c++;
      m.set(id, cur);
    });
    return m;
  }, [questions, answers]);

  /* حلقة النتيجة المتحركة + الاحتفال */
  const [ringOn, setRingOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRingOn(true), 150);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (percent >= 60) {
      const colors = ["#0E7C66", "#7ED4BE", "#E0A23C", "#FFFFFF"];
      confetti({ particleCount: 110, spread: 75, origin: { y: 0.35 }, colors, zIndex: 60 });
      const t = setTimeout(
        () => confetti({ particleCount: 60, spread: 100, origin: { y: 0.3, x: 0.7 }, colors, zIndex: 60 }),
        350
      );
      return () => clearTimeout(t);
    }
  }, [percent]);

  const C = 2 * Math.PI * 62;
  const offset = ringOn ? C * (1 - percent / 100) : C;
  const ringColor = percent >= 85 ? "#1E8A56" : percent >= 60 ? "#159A7E" : "#C4473E";

  const verdict =
    percent >= 90
      ? { title: "نبضٌ استثنائي!", msg: "أداء يفوق التوقعات — أنت جاهز لقاعة الامتحان." }
      : percent >= 75
        ? { title: "ممتاز جدًا", msg: "إتقان واضح، راجع الأخطاء القليلة لتثبيت القمة." }
        : percent >= 60
          ? { title: "اجتزت الاختبار", msg: "نتيجة مطمئنة — استمر بالمراجعات المركزة على نقاط الضعف." }
          : { title: "تحتاج مراجعة", msg: "لا تقلق؛ أعد جلسة مذاكرة على المقررات الضعيفة ثم حاول مجددًا." };

  /* المراجعة */
  const [filter, setFilter] = useState<Filter>("all");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const status = (i: number): "correct" | "wrong" | "skipped" =>
    answers[i] === null ? "skipped" : answers[i] === questions[i].correct ? "correct" : "wrong";

  const items = questions
    .map((_, i) => i)
    .filter((i) => (filter === "all" ? true : status(i) === filter));

  const tabs: { id: Filter; label: string; n: number; tone: string }[] = [
    { id: "all", label: "الكل", n: total, tone: "bg-pine-900 text-pulse-300" },
    { id: "wrong", label: "الخاطئة", n: wrong, tone: "bg-blood-600 text-white" },
    { id: "correct", label: "الصحيحة", n: correct, tone: "bg-moss-600 text-white" },
    { id: "skipped", label: "بلا إجابة", n: skipped, tone: "bg-ink-soft text-white" },
  ];

  return (
    <div className="anim-fade-up">
      {/* ───────── رأس النتيجة ───────── */}
      <header className="monitor-band relative overflow-hidden text-paper">
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr]">
          {/* حلقة الدرجة */}
          <div className="relative mx-auto h-44 w-44">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
              <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(126,212,190,0.15)" strokeWidth="13" />
              <circle
                cx="80" cy="80" r="62" fill="none"
                stroke={ringColor}
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                style={{
                  transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)",
                  filter: `drop-shadow(0 0 10px ${ringColor}66)`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="vital-num text-5xl" style={{ color: ringColor, textShadow: `0 0 20px ${ringColor}55` }}>
                {percent}٪
              </p>
              <p className="mt-1 text-[11px] font-semibold tracking-widest text-pulse-300/70 uppercase">
                Score
              </p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold " +
                  (passed ? "bg-moss-600 text-white" : "bg-blood-600 text-white")
                }
              >
                {passed ? <CheckIcon size={14} /> : <XIcon size={14} />}
                {passed ? "اجتزت الاختبار" : "لم تجتز هذه المرة"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pine-700 bg-pine-800/70 px-3 py-1 text-xs font-semibold text-pulse-300">
                {config.mode === "exam" ? <ClipboardIcon size={13} /> : <TimerIcon size={13} />}
                {config.mode === "exam" ? "وضع الاختبار" : "وضع المذاكرة"}
              </span>
              {result.autoSubmitted && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amberx-500/40 bg-amberx-500/15 px-3 py-1 text-xs font-bold text-amberx-500">
                  <ClockIcon size={13} />
                  انتهى الوقت — سُلّم تلقائيًا
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{verdict.title}</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-pulse-300/85 sm:text-base">
              {verdict.msg}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5 text-sm">
              <StatChip color="text-moss-600" label="صحيحة" value={correct} />
              <StatChip color="text-blood-600" label="خاطئة" value={wrong} />
              <StatChip color="text-ink-soft" label="بلا إجابة" value={skipped} />
              <StatChip color="text-amberx-600" label="مُميّزة" value={flagged} />
              <span className="inline-flex items-center gap-2 rounded-lg border border-pine-700 bg-pine-800/70 px-3.5 py-2">
                <ClockIcon size={16} className="text-pulse-300" />
                <span className="font-bold tabular-nums">{fmtTime(durationSec)}</span>
                <span className="text-xs text-pulse-300/70">زمن الجلسة</span>
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-2 sm:px-6">
          <div className="flex gap-2.5">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-pulse-600 px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg shadow-pulse-600/25 transition-all duration-200 hover:bg-pulse-500"
            >
              <RefreshIcon size={16} />
              إعادة بنفس الإعدادات
            </button>
            <button
              onClick={onHome}
              className="inline-flex items-center gap-2 rounded-lg border border-pine-700 bg-pine-800/70 px-5 py-2.5 font-display text-sm font-bold text-pulse-300 transition-all duration-200 hover:bg-pine-800 hover:text-pulse-100"
            >
              اختبار جديد
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        {/* ───────── تفصيل المقررات ───────── */}
        <section className="card anim-fade-up h-fit p-6" style={{ animationDelay: "0.15s" }}>
          <h2 className="font-display text-xl font-bold">أداء كل مقرر</h2>
          <div className="mt-5 space-y-4">
            {SUBJECTS.filter((s) => perSubject.has(s.id)).map((s) => {
              const v = perSubject.get(s.id)!;
              const p = Math.round((v.c / v.t) * 100);
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{s.name}</span>
                    <span className="font-display font-bold tabular-nums" style={{ color: s.color }}>
                      {p}٪ <span className="text-xs font-semibold text-ink-soft">({v.c}/{v.t})</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${p}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 rounded-lg bg-paper/70 p-3 text-xs leading-relaxed text-ink-soft">
            ركّز مذاكرة الجلسة القادمة على المقرر الأقل نسبة — التكرار المتباعد على نقاط الضعف أسرع طريق لرفع المعدل.
          </p>
        </section>

        {/* ───────── مراجعة الأسئلة ───────── */}
        <section className="card anim-fade-up p-6" style={{ animationDelay: "0.25s" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">مراجعة السؤال بسؤال</h2>
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setFilter(t.id);
                    setOpenIdx(null);
                  }}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 " +
                    (filter === t.id ? t.tone + " shadow-md" : "bg-paper text-ink-soft hover:bg-paper-deep")
                  }
                >
                  {t.label} ({t.n})
                </button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-line bg-paper/60 p-6 text-center text-sm text-ink-soft">
              لا أسئلة في هذا التصنيف — علامة جيدة!
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {items.map((i) => {
                const q = questions[i];
                const st = status(i);
                const open = openIdx === i;
                const sub = subjectById(q.base.subject);
                const stStyle =
                  st === "correct"
                    ? { ring: "bg-moss-100 text-moss-700 border border-moss-600/30", icon: <CheckIcon size={16} /> }
                    : st === "wrong"
                      ? { ring: "bg-blood-100 text-blood-700 border border-blood-600/30", icon: <XIcon size={16} /> }
                      : { ring: "bg-paper-deep text-ink-soft border border-line", icon: <span className="font-display text-xs font-bold">—</span> };
                return (
                  <li key={i} className="overflow-hidden rounded-xl border border-line bg-white transition-shadow duration-200 hover:shadow-md">
                    <button
                      onClick={() => setOpenIdx(open ? null : i)}
                      className="flex w-full items-center gap-3 p-4 text-start"
                      aria-expanded={open}
                    >
                      <span className={"grid h-9 w-9 shrink-0 place-items-center rounded-full " + stStyle.ring}>
                        {stStyle.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          <span className="font-display text-ink-soft">س{i + 1} · </span>
                          {q.base.text}
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <SubjectTag name={sub.name} color={sub.color} small />
                          {flags[i] && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amberx-600">
                              <FlagIcon size={11} filled /> مُميّز
                            </span>
                          )}
                        </span>
                      </span>
                      <ChevronDownIcon
                        size={18}
                        className={"shrink-0 text-ink-soft transition-transform duration-300 " + (open ? "rotate-180" : "")}
                      />
                    </button>

                    {open && (
                      <div className="anim-fade-up border-t border-line bg-paper/50 p-4">
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => {
                            const isCorrect = oi === q.correct;
                            const isUser = answers[i] === oi;
                            return (
                              <div
                                key={oi}
                                className={
                                  "flex items-center gap-3 rounded-lg border-2 p-2.5 text-sm " +
                                  (isCorrect
                                    ? "border-moss-600 bg-moss-100"
                                    : isUser
                                      ? "border-blood-600 bg-blood-100"
                                      : "border-transparent bg-white")
                                }
                              >
                                <span
                                  className={
                                    "grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-xs font-bold " +
                                    (isCorrect
                                      ? "bg-moss-600 text-white"
                                      : isUser
                                        ? "bg-blood-600 text-white"
                                        : "bg-paper text-ink-soft")
                                  }
                                >
                                  {LETTERS[oi]}
                                </span>
                                <span className="flex-1 font-medium">{opt}</span>
                                {isCorrect && <CheckIcon size={16} className="text-moss-600" />}
                                {isUser && !isCorrect && <XIcon size={16} className="text-blood-600" />}
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-3 text-xs font-semibold text-ink-soft">
                          {answers[i] === null
                            ? "لم تُجب على هذا السؤال."
                            : answers[i] === q.correct
                              ? `إجابتك: ${LETTERS[answers[i]!]} — صحيحة`
                              : `إجابتك: ${LETTERS[answers[i]!]} — غير صحيحة`}
                        </p>
                        <div className="mt-2 rounded-lg border border-line bg-white p-3.5">
                          <p className="flex items-center gap-1.5 font-display text-sm font-bold text-pulse-700">
                            <BulbIcon size={15} className="text-amberx-600" />
                            الشرح
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-ink">{q.base.explanation}</p>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-pine-700 bg-pine-800/70 px-3.5 py-2">
      <span className={"font-display text-lg font-bold tabular-nums " + color}>{value}</span>
      <span className="text-xs text-pulse-300/70">{label}</span>
    </span>
  );
}
