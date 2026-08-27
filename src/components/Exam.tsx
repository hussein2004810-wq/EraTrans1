import { useEffect, useMemo, useRef, useState } from "react";
import type { ExamConfig, ExamResult, RuntimeQuestion } from "../types";
import { subjectById } from "../data/questions";
import EcgLine from "./EcgLine";
import { DifficultyDots, LETTERS, Modal, SubjectTag, fmtTime } from "./ui";
import {
  BookIcon,
  BulbIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  FlagIcon,
  LogoIcon,
  NextIcon,
  PrevIcon,
  XIcon,
} from "./icons";

interface ExamProps {
  config: ExamConfig;
  questions: RuntimeQuestion[];
  onFinish: (r: ExamResult) => void;
  onExit: () => void;
}

export default function Exam({ config, questions, onFinish, onExit }: ExamProps) {
  const total = questions.length;
  const isExam = config.mode === "exam";
  const allocated = total * config.secondsPerQuestion;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [flags, setFlags] = useState<boolean[]>(() => Array(total).fill(false));
  const [remaining, setRemaining] = useState(allocated);
  const [elapsed, setElapsed] = useState(0);
  const [confirm, setConfirm] = useState<null | "exit" | "submit">(null);
  const finishedRef = useRef(false);

  const q = questions[idx];
  const subject = subjectById(q.base.subject);
  const chosen = answers[idx];
  const answeredCount = answers.filter((a) => a !== null).length;
  const flagCount = flags.filter(Boolean).length;

  const finish = (auto = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish({
      config,
      questions,
      answers,
      flags,
      durationSec: isExam ? allocated - Math.max(0, remaining) : elapsed,
      autoSubmitted: auto,
    });
  };

  /* المؤقت */
  useEffect(() => {
    const t = setInterval(
      () => (isExam ? setRemaining((r) => r - 1) : setElapsed((e) => e + 1)),
      1000
    );
    return () => clearInterval(t);
  }, [isExam]);

  useEffect(() => {
    if (isExam && remaining <= 0) finish(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const select = (i: number) => {
    if (!isExam && chosen !== null) return;
    setAnswers((cur) => {
      const c = [...cur];
      c[idx] = i;
      return c;
    });
  };

  const toggleFlag = () =>
    setFlags((cur) => {
      const c = [...cur];
      c[idx] = !c[idx];
      return c;
    });

  const goNext = () => {
    if (idx < total - 1) setIdx(idx + 1);
    else if (isExam) setConfirm("submit");
    else finish();
  };
  const goPrev = () => idx > 0 && setIdx(idx - 1);

  /* اختصارات لوحة المفاتيح */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (confirm) return;
      if (e.key >= "1" && e.key <= "4") select(Number(e.key) - 1);
      else if (e.key === "ArrowLeft") goNext();
      else if (e.key === "ArrowRight") goPrev();
      else if (e.key.toLowerCase() === "f") toggleFlag();
      else if (e.key === "Enter") goNext();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const studyCorrect = !isExam && chosen !== null && chosen === q.correct;
  const studyWrong = !isExam && chosen !== null && chosen !== q.correct;

  const timerTone =
    !isExam
      ? "border-pine-700 bg-pine-800/70 text-pulse-300"
      : remaining <= 60
        ? "animate-pulse border-blood-600/50 bg-blood-600/20 text-red-300"
        : remaining <= 180
          ? "border-amberx-500/50 bg-amberx-500/15 text-amberx-500"
          : "border-pine-700 bg-pine-800/70 text-pulse-300";

  const progressPct = ((idx + 1) / total) * 100;

  return (
    <div className="min-h-screen">
      {/* ───────── الشريط العلوي ───────── */}
      <header className="monitor-band sticky top-0 z-40 border-b border-pine-700 text-paper shadow-lg shadow-pine-950/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-pulse-300">
              <LogoIcon size={26} />
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-pine-700 bg-pine-800/70 px-2.5 py-1 text-xs font-semibold text-pulse-300 sm:inline-flex">
              {isExam ? <ClipboardIcon size={14} /> : <BookIcon size={14} />}
              {isExam ? "وضع الاختبار" : "وضع المذاكرة"}
            </span>
            <span className="font-display text-sm font-semibold text-paper/80">
              السؤال {idx + 1} / {total}
            </span>
          </div>

          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-pine-800">
              <div
                className="h-full rounded-full bg-pulse-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%`, boxShadow: "0 0 10px rgba(21,154,126,.8)" }}
              />
            </div>
          </div>

          <div className="ms-auto flex items-center gap-2">
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-display text-base font-bold tabular-nums sm:text-lg " +
                timerTone
              }
              title={isExam ? "الوقت المتبقي" : "زمن الجلسة"}
            >
              <ClockIcon size={17} />
              {fmtTime(isExam ? remaining : elapsed)}
            </span>
            <button
              onClick={() => setConfirm("exit")}
              className="grid h-9 w-9 place-items-center rounded-lg border border-pine-700 bg-pine-800/70 text-paper/70 transition-colors hover:border-blood-600 hover:bg-blood-600/20 hover:text-red-300"
              title="إنهاء الجلسة والخروج"
            >
              <XIcon size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_290px]">
        {/* ───────── بطاقة السؤال ───────── */}
        <section>
          <div key={idx} className="card anim-q-in p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <SubjectTag name={subject.name} color={subject.color} />
              <DifficultyDots level={q.base.difficulty} />
              {flags[idx] && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amberx-100 px-2.5 py-1 text-[11px] font-bold text-amberx-600">
                  <FlagIcon size={12} filled /> مميزة للمراجعة
                </span>
              )}
              <button
                onClick={toggleFlag}
                className={
                  "ms-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-200 " +
                  (flags[idx]
                    ? "border-amberx-500 bg-amberx-100 text-amberx-600 shadow-sm"
                    : "border-line bg-white text-ink-soft hover:border-amberx-500 hover:text-amberx-600")
                }
              >
                <FlagIcon size={14} filled={flags[idx]} />
                {flags[idx] ? "إزالة العلامة" : "تمييز للمراجعة"}
              </button>
            </div>

            <h2 className="mt-5 font-display text-xl font-bold leading-relaxed sm:text-2xl">
              {q.base.text}
            </h2>

            {/* الخيارات */}
            <div className="mt-6 space-y-3">
              {q.options.map((opt, i) => {
                const isChosen = chosen === i;
                const isCorrect = i === q.correct;
                let cls = "border-line bg-white hover:border-pulse-500 hover:bg-pulse-100/40 hover:-translate-y-0.5 hover:shadow-md";
                let circle = "border-line bg-paper text-ink-soft";
                if (isExam) {
                  if (isChosen) {
                    cls = "border-pulse-600 bg-pulse-100 shadow-md shadow-pulse-600/10";
                    circle = "border-pulse-600 bg-pulse-600 text-white";
                  }
                } else if (chosen !== null) {
                  if (isCorrect) {
                    cls = "border-moss-600 bg-moss-100";
                    circle = "border-moss-600 bg-moss-600 text-white";
                  } else if (isChosen) {
                    cls = "anim-shake border-blood-600 bg-blood-100";
                    circle = "border-blood-600 bg-blood-600 text-white";
                  } else {
                    cls = "border-line bg-white opacity-50";
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => select(i)}
                    disabled={!isExam && chosen !== null}
                    className={
                      "group flex w-full items-center gap-3.5 rounded-xl border-2 p-3.5 text-start transition-all duration-200 disabled:cursor-default " +
                      cls
                    }
                  >
                    <span
                      className={
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-display text-base font-bold transition-colors duration-200 " +
                        circle
                      }
                    >
                      {LETTERS[i]}
                    </span>
                    <span className="flex-1 text-[15px] font-medium leading-relaxed">{opt}</span>
                    {!isExam && chosen !== null && isCorrect && (
                      <span className="text-moss-600">
                        <CheckIcon size={22} />
                      </span>
                    )}
                    {!isExam && chosen !== null && isChosen && !isCorrect && (
                      <span className="text-blood-600">
                        <XIcon size={22} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* التغذية الراجعة في وضع المذاكرة */}
            {studyCorrect && (
              <div className="anim-pop mt-5 flex items-center gap-2.5 rounded-xl border border-moss-600/30 bg-moss-100 p-4 text-moss-700">
                <CheckIcon size={22} />
                <p className="font-display text-base font-bold">إجابة صحيحة — استمر بهذا النبض!</p>
              </div>
            )}
            {studyWrong && (
              <div className="anim-pop mt-5 flex items-center gap-2.5 rounded-xl border border-blood-600/30 bg-blood-100 p-4 text-blood-700">
                <XIcon size={22} />
                <p className="font-display text-base font-bold">
                  الإجابة الصحيحة: <span className="underline decoration-2 underline-offset-4">{LETTERS[q.correct]} — {q.options[q.correct]}</span>
                </p>
              </div>
            )}
            {!isExam && chosen !== null && (
              <div className="anim-fade-up mt-4 rounded-xl border border-line bg-paper/70 p-4">
                <p className="flex items-center gap-2 font-display text-sm font-bold text-pulse-700">
                  <BulbIcon size={17} className="text-amberx-600" />
                  لماذا؟
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink">{q.base.explanation}</p>
              </div>
            )}
            {isExam && (
              <p className="mt-4 text-xs text-ink-soft">
                يمكنك تعديل إجابتك أو العودة لهذا السؤال من الخريطة في أي وقت قبل التسليم.
              </p>
            )}

            {/* التنقل */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
              <button
                onClick={goPrev}
                disabled={idx === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:border-pulse-500 hover:text-pulse-700 disabled:pointer-events-none disabled:opacity-40"
              >
                <PrevIcon size={17} />
                السابق
              </button>
              <span className="hidden font-display text-sm text-ink-soft sm:block">
                {isExam ? "اختصارات:" : "اختصارات:"}{" "}
                <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 text-[11px]">1-4</kbd> اختيار ·{" "}
                <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 text-[11px]">Enter</kbd> التالي ·{" "}
                <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 text-[11px]">F</kbd> تمييز
              </span>
              {idx === total - 1 ? (
                <button
                  onClick={() => (isExam ? setConfirm("submit") : finish())}
                  className="inline-flex items-center gap-2 rounded-lg bg-pulse-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-pulse-600/25 transition-all duration-200 hover:bg-pulse-700"
                >
                  {isExam ? "إنهاء الاختبار" : "إنهاء الجلسة"}
                  <CheckIcon size={17} />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-lg bg-pulse-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-pulse-600/25 transition-all duration-200 hover:bg-pulse-700"
                >
                  التالي
                  <NextIcon size={17} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ───────── العمود الجانبي ───────── */}
        <aside className="space-y-4">
          {isExam ? (
            <div className="card anim-fade-up p-5" style={{ animationDelay: "0.1s" }}>
              <h3 className="font-display text-lg font-bold">خريطة الأسئلة</h3>
              <div className="mt-4 grid grid-cols-6 gap-1.5">
                {questions.map((_, i) => {
                  const states: string[] = [];
                  if (i === idx) states.push("ring-2 ring-pulse-600 ring-offset-2");
                  if (answers[i] !== null) states.push("bg-pulse-600 border-pulse-600 text-white");
                  else states.push("bg-white border-line text-ink-soft hover:border-pulse-500");
                  if (flags[i] && answers[i] === null)
                    states.push("border-amberx-500 text-amberx-600 bg-amberx-100");
                  return (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={
                        "relative aspect-square rounded-md border font-display text-sm font-bold tabular-nums transition-all duration-150 " +
                        states.join(" ")
                      }
                    >
                      {i + 1}
                      {flags[i] && (
                        <span className="absolute -top-1 -left-1 text-amberx-500">
                          <FlagIcon size={10} filled />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-semibold text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-pulse-600" /> مُجاب
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm border border-line bg-white" /> فارغ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm border border-amberx-500 bg-amberx-100" /> مُميّز
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm ring-2 ring-pulse-600 ring-offset-1" /> الحالي
                </span>
              </div>
              <div className="mt-4 rounded-lg bg-paper/70 p-3 text-xs font-semibold text-ink-soft">
                أجبت على <span className="font-display text-sm text-pulse-700">{answeredCount}</span> من {total}
                {flagCount > 0 && (
                  <> · ميّزت <span className="font-display text-sm text-amberx-600">{flagCount}</span></>
                )}
              </div>
              <button
                onClick={() => setConfirm("submit")}
                className="mt-4 w-full rounded-xl bg-pine-900 px-4 py-3 font-display text-base font-bold text-pulse-300 transition-all duration-200 hover:bg-pine-800"
              >
                تسليم الأوراق
              </button>
            </div>
          ) : (
            <div className="card anim-fade-up p-5" style={{ animationDelay: "0.1s" }}>
              <h3 className="font-display text-lg font-bold">نبض الجلسة</h3>
              <EcgLine className="mt-2 h-12 w-full text-pulse-500" speed={4} />
              <SessionStats questions={questions} answers={answers} />
              <p className="mt-4 rounded-lg bg-paper/70 p-3 text-xs leading-relaxed text-ink-soft">
                اقرأ الشرح حتى مع الإجابة الصحيحة — التعليل هو ما يثبت المعلومة في الامتحان السريري.
              </p>
            </div>
          )}

          <SubjectTag name={subject.nameEn} color={subject.color} />
        </aside>
      </main>

      {/* ───────── نوافذ التأكيد ───────── */}
      <Modal open={confirm === "submit"} onClose={() => setConfirm(null)}>
        <h3 className="font-display text-lg font-bold">تسليم الأوراق؟</h3>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-moss-100 p-3">
            <p className="font-display text-2xl font-bold text-moss-700 tabular-nums">{answeredCount}</p>
            <p className="text-[11px] font-semibold text-moss-700">مُجاب</p>
          </div>
          <div className="rounded-lg bg-paper p-3">
            <p className="font-display text-2xl font-bold text-ink-soft tabular-nums">{total - answeredCount}</p>
            <p className="text-[11px] font-semibold text-ink-soft">بلا إجابة</p>
          </div>
          <div className="rounded-lg bg-amberx-100 p-3">
            <p className="font-display text-2xl font-bold text-amberx-600 tabular-nums">{flagCount}</p>
            <p className="text-[11px] font-semibold text-amberx-600">مُميّز</p>
          </div>
        </div>
        {total - answeredCount > 0 && (
          <p className="mt-3 rounded-lg border border-amberx-500/30 bg-amberx-100/60 p-3 text-xs font-semibold text-amberx-600">
            تنبيه: ستُحتسب الأسئلة الفارغة خطأ. هل تريد العودة ومراجعتها؟
          </p>
        )}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={() => setConfirm(null)}
            className="flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-bold transition-colors hover:bg-paper"
          >
            متابعة الاختبار
          </button>
          <button
            onClick={() => finish()}
            className={
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-colors " +
              (total - answeredCount > 0
                ? "bg-blood-600 hover:bg-blood-700"
                : "bg-pulse-600 hover:bg-pulse-700")
            }
          >
            تسليم الآن
          </button>
        </div>
      </Modal>

      <Modal open={confirm === "exit"} onClose={() => setConfirm(null)}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blood-100 text-blood-600">
            <XIcon size={20} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">الخروج من الجلسة؟</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              سيتم إلغاء هذه المحاولة ولن تُحفظ أي نتيجة. يمكنك المتابعة من حيث توقفت إن بقيت.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={() => setConfirm(null)}
            className="flex-1 rounded-lg bg-pulse-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pulse-700"
          >
            متابعة الجلسة
          </button>
          <button
            onClick={onExit}
            className="flex-1 rounded-lg border border-blood-600/40 bg-blood-100 px-4 py-2.5 text-sm font-bold text-blood-700 transition-colors hover:bg-blood-600 hover:text-white"
          >
            نعم، الخروج
          </button>
        </div>
      </Modal>
    </div>
  );
}

function SessionStats({
  questions,
  answers,
}: {
  questions: RuntimeQuestion[];
  answers: (number | null)[];
}) {
  const stats = useMemo(() => {
    let c = 0;
    let w = 0;
    answers.forEach((a, i) => {
      if (a === null) return;
      if (a === questions[i].correct) c++;
      else w++;
    });
    return { c, w, left: answers.filter((a) => a === null).length };
  }, [answers, questions]);

  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg bg-moss-100 p-2.5">
        <p className="font-display text-xl font-bold text-moss-700 tabular-nums">{stats.c}</p>
        <p className="text-[10px] font-semibold text-moss-700">صحيحة</p>
      </div>
      <div className="rounded-lg bg-blood-100 p-2.5">
        <p className="font-display text-xl font-bold text-blood-700 tabular-nums">{stats.w}</p>
        <p className="text-[10px] font-semibold text-blood-700">خاطئة</p>
      </div>
      <div className="rounded-lg bg-paper p-2.5">
        <p className="font-display text-xl font-bold text-ink-soft tabular-nums">{stats.left}</p>
        <p className="text-[10px] font-semibold text-ink-soft">متبقٍ</p>
      </div>
    </div>
  );
}
