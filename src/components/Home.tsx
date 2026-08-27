import { useEffect, useMemo, useState } from "react";
import type { Attempt, ExamConfig, ExamMode, SubjectId } from "../types";
import { CLINICAL_TIPS, QUESTIONS, SUBJECTS } from "../data/questions";
import EcgLine from "./EcgLine";
import { Modal } from "./ui";
import {
  BookIcon,
  BulbIcon,
  ChartIcon,
  ClipboardIcon,
  LayersIcon,
  LogoIcon,
  RefreshIcon,
  StethoIcon,
  TimerIcon,
  TrashIcon,
  TrophyIcon,
} from "./icons";

interface HomeProps {
  attempts: Attempt[];
  onStart: (cfg: ExamConfig) => void;
  onClear: () => void;
}

const COUNT_OPTIONS = [10, 15, 20, 30];
const SPQ_OPTIONS = [30, 45, 60, 90];

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Home({ attempts, onStart, onClear }: HomeProps) {
  const [selected, setSelected] = useState<SubjectId[]>([]);
  const [mode, setMode] = useState<ExamMode>("exam");
  const [count, setCount] = useState(15);
  const [spq, setSpq] = useState(45);
  const [tipIdx, setTipIdx] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const now = useNow();

  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % CLINICAL_TIPS.length), 6500);
    return () => clearInterval(t);
  }, []);

  const poolSize = useMemo(
    () =>
      selected.length === 0
        ? QUESTIONS.length
        : QUESTIONS.filter((q) => selected.includes(q.subject)).length,
    [selected]
  );
  const effectiveCount = Math.min(count, poolSize);
  const totalMinutes = Math.max(1, Math.round((effectiveCount * spq) / 60));

  const stats = useMemo(() => {
    if (attempts.length === 0) return null;
    const avg = Math.round(attempts.reduce((s, a) => s + a.percent, 0) / attempts.length);
    const best = Math.max(...attempts.map((a) => a.percent));
    const perSubject = new Map<SubjectId, { c: number; t: number }>();
    attempts.forEach((a) =>
      Object.entries(a.perSubject).forEach(([id, v]) => {
        if (!v) return;
        const cur = perSubject.get(id as SubjectId) ?? { c: 0, t: 0 };
        perSubject.set(id as SubjectId, { c: cur.c + v.c, t: cur.t + v.t });
      })
    );
    return { avg, best, perSubject };
  }, [attempts]);

  const toggleSubject = (id: SubjectId) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
    );

  const start = () =>
    onStart({ mode, subjectIds: selected, count: effectiveCount, secondsPerQuestion: spq });

  const clock = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="anim-fade-up">
      {/* ───────── شريط المراقبة الحيوية ───────── */}
      <header className="monitor-band relative overflow-hidden text-paper">
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* الهوية */}
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-pulse-600/25 text-pulse-300 ring-1 ring-pulse-500/40">
                  <LogoIcon size={28} />
                </span>
                <div>
                  <h1 className="font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl">
                    نَبْض
                  </h1>
                  <p className="mt-1 text-sm text-pulse-300/80">
                    منصة اختبارات المجموعة الطبية · MCQ
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                {["تشريح", "فسيولوجيا", "أدوية", "كيمياء حيوية", "باثولوجيا", "أحياء دقيقة"].map(
                  (s) => (
                    <span
                      key={s}
                      className="rounded-full border border-pulse-500/25 bg-pine-800/60 px-2.5 py-1 font-medium text-pulse-300/90"
                    >
                      {s}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* القراءات الحيوية */}
            <div className="flex items-stretch gap-3 sm:gap-5">
              <div className="rounded-lg border border-pine-700 bg-pine-900/70 px-4 py-3 text-center">
                <p className="text-[10px] font-medium tracking-widest text-ink-soft uppercase">
                  Attempts
                </p>
                <p className="vital-num mt-1 text-3xl sm:text-4xl">{attempts.length}</p>
                <p className="mt-1 text-[11px] text-pulse-300/70">محاولة مكتملة</p>
              </div>
              <div className="rounded-lg border border-pine-700 bg-pine-900/70 px-4 py-3 text-center">
                <p className="text-[10px] font-medium tracking-widest text-ink-soft uppercase">
                  Accuracy
                </p>
                <p className="vital-num mt-1 text-3xl sm:text-4xl">
                  {stats ? stats.avg : "—"}
                  {stats && <span className="text-xl">٪</span>}
                </p>
                <p className="mt-1 text-[11px] text-pulse-300/70">متوسط الدقة</p>
              </div>
              <div className="rounded-lg border border-pine-700 bg-pine-900/70 px-4 py-3 text-center">
                <p className="text-[10px] font-medium tracking-widest text-ink-soft uppercase">
                  Best
                </p>
                <p className="vital-num mt-1 flex items-center justify-center gap-1.5 text-3xl sm:text-4xl">
                  <TrophyIcon size={20} className="text-amberx-500" />
                  {stats ? stats.best : "—"}
                  {stats && <span className="text-xl">٪</span>}
                </p>
                <p className="mt-1 text-[11px] text-pulse-300/70">أفضل نتيجة</p>
              </div>
            </div>
          </div>

          {/* الحالة والساعة */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-pulse-300/80">
            <span className="inline-flex items-center gap-1.5">
              <span className="blink-dot inline-block h-2 w-2 rounded-full bg-pulse-500 shadow-[0_0_8px_rgba(21,154,126,0.9)]" />
              المنصة جاهزة للاختبار
            </span>
            <span className="tabular-nums tracking-wider">{clock}</span>
            <span className="inline-flex items-center gap-1.5">
              <LayersIcon size={14} />
              {QUESTIONS.length} سؤالًا في البنك
            </span>
          </div>
        </div>
        <EcgLine
          className="absolute inset-x-0 bottom-0 h-16 w-full text-pulse-300"
          speed={7}
        />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* لمحة سريرية */}
        <div
          className="card flex items-center gap-3 border-amberx-500/30 bg-amberx-100/60 p-3.5"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amberx-500/20 text-amberx-600">
            <BulbIcon size={19} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-amberx-600">لمحة سريرية</p>
            <p key={tipIdx} className="anim-fade-up text-sm leading-relaxed text-ink">
              {CLINICAL_TIPS[tipIdx]}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* ───────── لوحة تجهيز الاختبار ───────── */}
          <section className="card anim-fade-up p-6 lg:col-span-3" style={{ animationDelay: "0.18s" }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">جهّز اختبارك</h2>
              <span className="rounded-full bg-pulse-100 px-3 py-1 text-xs font-semibold text-pulse-700">
                {effectiveCount} سؤال · {mode === "exam" ? `${totalMinutes} دقيقة` : "بلا حدود"}
              </span>
            </div>

            {/* المقررات */}
            <div className="mt-6">
              <h3 className="font-display text-sm font-semibold text-ink-soft">
                أولًا — المقررات المشمولة
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelected([])}
                  className={
                    "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 " +
                    (selected.length === 0
                      ? "border-pulse-600 bg-pulse-600 text-white shadow-md shadow-pulse-600/25"
                      : "border-line bg-white text-ink-soft hover:border-pulse-500 hover:text-ink")
                  }
                >
                  كل المقررات ({QUESTIONS.length})
                </button>
                {SUBJECTS.map((s) => {
                  const on = selected.includes(s.id);
                  const n = QUESTIONS.filter((q) => q.subject === s.id).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={
                        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 " +
                        (on
                          ? "border-transparent text-white shadow-md"
                          : "border-line bg-white text-ink-soft hover:-translate-y-0.5 hover:border-pulse-500 hover:text-ink")
                      }
                      style={on ? { backgroundColor: s.color } : undefined}
                    >
                      {s.name} ({n})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* النمط */}
            <div className="mt-6">
              <h3 className="font-display text-sm font-semibold text-ink-soft">ثانيًا — نمط الجلسة</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setMode("exam")}
                  aria-pressed={mode === "exam"}
                  className={
                    "rounded-xl border-2 p-4 text-start transition-all duration-200 " +
                    (mode === "exam"
                      ? "border-pulse-600 bg-pulse-100/70 shadow-md shadow-pulse-600/10"
                      : "border-line bg-white hover:border-pulse-300 hover:shadow-sm")
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <span className={"grid h-10 w-10 place-items-center rounded-lg " + (mode === "exam" ? "bg-pulse-600 text-white" : "bg-paper text-ink-soft")}>
                      <ClipboardIcon size={21} />
                    </span>
                    <span>
                      <span className="block font-display text-base font-bold">وضع الاختبار</span>
                      <span className="block text-[11px] text-ink-soft">محاكاة قاعة الامتحان</span>
                    </span>
                  </span>
                  <ul className="mt-3 space-y-1 text-xs text-ink-soft">
                    <li>· مؤقت تنازلي يُسلّم تلقائيًا عند انتهائه</li>
                    <li>· تنقّل حر وخريطة أسئلة وعلامات مراجعة</li>
                    <li>· النتيجة والتحليل في نهاية الجلسة</li>
                  </ul>
                </button>
                <button
                  onClick={() => setMode("study")}
                  aria-pressed={mode === "study"}
                  className={
                    "rounded-xl border-2 p-4 text-start transition-all duration-200 " +
                    (mode === "study"
                      ? "border-pulse-600 bg-pulse-100/70 shadow-md shadow-pulse-600/10"
                      : "border-line bg-white hover:border-pulse-300 hover:shadow-sm")
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <span className={"grid h-10 w-10 place-items-center rounded-lg " + (mode === "study" ? "bg-pulse-600 text-white" : "bg-paper text-ink-soft")}>
                      <BookIcon size={21} />
                    </span>
                    <span>
                      <span className="block font-display text-base font-bold">وضع المذاكرة</span>
                      <span className="block text-[11px] text-ink-soft">تعلّم بلا ضغط</span>
                    </span>
                  </span>
                  <ul className="mt-3 space-y-1 text-xs text-ink-soft">
                    <li>· تصحيح فوري مع كل إجابة</li>
                    <li>· شرح علمي مختصر لكل سؤال</li>
                    <li>· وقت مفتوح — التركيز أولًا</li>
                  </ul>
                </button>
              </div>
            </div>

            {/* العدد والزمن */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink-soft">ثالثًا — عدد الأسئلة</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {COUNT_OPTIONS.map((c) => {
                    const capped = Math.min(c, poolSize);
                    return (
                      <button
                        key={c}
                        onClick={() => setCount(c)}
                        className={
                          "min-w-14 rounded-lg border px-4 py-2 font-display text-lg font-bold tabular-nums transition-all duration-200 " +
                          (count === c
                            ? "border-pulse-600 bg-pulse-600 text-white shadow-md shadow-pulse-600/25"
                            : "border-line bg-white text-ink hover:border-pulse-500")
                        }
                        title={`سيُختار ${capped} سؤالًا`}
                      >
                        {capped}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-ink-soft">
                  {mode === "exam" ? "رابعًا — الزمن لكل سؤال" : "رابعًا — الزمن"}
                </h3>
                {mode === "exam" ? (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SPQ_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpq(s)}
                          className={
                            "rounded-lg border px-3.5 py-2 text-sm font-bold tabular-nums transition-all duration-200 " +
                            (spq === s
                              ? "border-pulse-600 bg-pulse-600 text-white shadow-md shadow-pulse-600/25"
                              : "border-line bg-white text-ink hover:border-pulse-500")
                          }
                        >
                          {s} ث
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-soft">
                      <TimerIcon size={14} className="text-pulse-600" />
                      الإجمالي: {totalMinutes} دقيقة ({effectiveCount * spq} ثانية)
                    </p>
                  </>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed border-line bg-paper/60 p-3 text-xs leading-relaxed text-ink-soft">
                    في وضع المذاكرة لا يوجد مؤقت — يُحسب زمن الجلسة تلقائيًا في التقرير.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={start}
              className="btn-pulse-ring mt-7 flex w-full items-center justify-center gap-2.5 rounded-xl bg-pulse-600 px-6 py-4 font-display text-xl font-bold text-white shadow-lg shadow-pulse-600/30 transition-all duration-200 hover:bg-pulse-700 hover:shadow-xl hover:shadow-pulse-600/30 active:scale-[0.99]"
            >
              {mode === "exam" ? <ClipboardIcon size={22} /> : <BookIcon size={22} />}
              {mode === "exam" ? "ابدأ الاختبار الآن" : "ابدأ جلسة المذاكرة"}
            </button>
          </section>

          {/* ───────── مؤشرات الأداء ───────── */}
          <section className="flex flex-col gap-6 lg:col-span-2">
            <div className="card anim-fade-up p-6" style={{ animationDelay: "0.26s" }}>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                  <ChartIcon size={20} className="text-pulse-600" />
                  مؤشراتك الأكاديمية
                </h2>
                {attempts.length > 0 && (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-blood-100 hover:text-blood-600"
                  >
                    <TrashIcon size={14} />
                    مسح السجل
                  </button>
                )}
              </div>

              {!stats ? (
                <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-line bg-paper/60 px-6 py-10 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-pulse-100 text-pulse-600">
                    <StethoIcon size={28} />
                  </span>
                  <p className="mt-4 font-display text-lg font-bold">لا محاولات بعد</p>
                  <p className="mt-1 max-w-55 text-sm leading-relaxed text-ink-soft">
                    أول اختبار ترسمه هنا سيحوّل هذه المساحة إلى خطك البياني: دقة، تقدم، ونقاط ضعف.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-5">
                    <div className="flex items-end justify-between">
                      <p className="text-sm font-semibold text-ink-soft">الدقة الإجمالية</p>
                      <p className="font-display text-3xl font-bold text-pulse-700 tabular-nums">
                        {stats.avg}٪
                      </p>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper-deep">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-pulse-500 to-pulse-700 transition-all duration-1000 ease-out"
                        style={{ width: `${stats.avg}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <p className="font-display text-sm font-semibold text-ink-soft">إتقان المقررات</p>
                    {SUBJECTS.filter((s) => stats.perSubject.has(s.id)).map((s) => {
                      const v = stats.perSubject.get(s.id)!;
                      const p = Math.round((v.c / v.t) * 100);
                      return (
                        <div key={s.id}>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{s.name}</span>
                            <span className="tabular-nums text-ink-soft">
                              {v.c}/{v.t} · {p}٪
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${p}%`, backgroundColor: s.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* سجل المحاولات */}
            <div className="card anim-fade-up flex-1 p-6" style={{ animationDelay: "0.34s" }}>
              <h2 className="font-display text-xl font-bold">آخر المحاولات</h2>
              {attempts.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">
                  ستظهر هنا نتائجك مع التاريخ والوقت بعد أول جلسة.
                </p>
              ) : (
                <ul className="mt-4 space-y-2.5">
                  {attempts.slice(0, 5).map((a) => {
                    const names =
                      a.subjectIds.length === 0
                        ? "كل المقررات"
                        : a.subjectIds
                            .slice(0, 2)
                            .map((id) => SUBJECTS.find((s) => s.id === id)?.name ?? id)
                            .join("، ") + (a.subjectIds.length > 2 ? ` +${a.subjectIds.length - 2}` : "");
                    const pill =
                      a.percent >= 85
                        ? "bg-moss-100 text-moss-700"
                        : a.percent >= 60
                          ? "bg-pulse-100 text-pulse-700"
                          : "bg-blood-100 text-blood-700";
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <span
                          className={
                            "grid h-9 w-9 shrink-0 place-items-center rounded-lg " +
                            (a.mode === "exam" ? "bg-pulse-100 text-pulse-700" : "bg-amberx-100 text-amberx-600")
                          }
                          title={a.mode === "exam" ? "وضع الاختبار" : "وضع المذاكرة"}
                        >
                          {a.mode === "exam" ? <ClipboardIcon size={18} /> : <BookIcon size={18} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{names}</p>
                          <p className="text-[11px] text-ink-soft">
                            {a.total} سؤال ·{" "}
                            {new Date(a.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}{" "}
                            {new Date(a.date).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={"rounded-full px-2.5 py-1 font-display text-sm font-bold tabular-nums " + pill}>
                          {a.percent}٪
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-2 border-t border-line pt-6 pb-4 text-center text-xs text-ink-soft">
          <p className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-pulse-700">
            <RefreshIcon size={14} />
            نَبْض — صُنعت لطلاب المجموعة الطبية
          </p>
          <p>الأسئلة والشروح لأغراض المراجعة التعليمية ولا تغني عن المراجع الأكاديمية المعتمدة.</p>
        </footer>
      </main>

      {/* تأكيد مسح السجل */}
      <Modal open={confirmClear} onClose={() => setConfirmClear(false)}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blood-100 text-blood-600">
            <TrashIcon size={20} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">مسح سجل المحاولات؟</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              سيُحذف {attempts.length} محاولة وكل الإحصاءات المرتبطة بها نهائيًا من هذا الجهاز.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={() => setConfirmClear(false)}
            className="flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-bold transition-colors hover:bg-paper"
          >
            تراجع
          </button>
          <button
            onClick={() => {
              onClear();
              setConfirmClear(false);
            }}
            className="flex-1 rounded-lg bg-blood-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blood-700"
          >
            نعم، امسح السجل
          </button>
        </div>
      </Modal>
    </div>
  );
}
