import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Attempt, ExamDef, Question } from "../types";
import { useI18n } from "../i18n";
import { grade, hashStr, mulberry32, shuffleSeeded, uid } from "../lib/store";
import EcgLine from "../components/EcgLine";
import { EmptyState } from "../components/ui";
import {
  ClipboardIcon, GaugeIcon, InfoIcon, LayersIcon, PlayIcon, TerminalIcon, UsersIcon,
} from "../components/icons";

interface Metrics {
  students: number;
  totalMs: number;
  avgMs: number;
  tps: number;
  storageKB: number;
  writeMs: number;
  failures: number;
  batches: number;
  correctRate: number;
}

interface LogLine {
  msg: string;
  tone: "ok" | "warn";
}

/** محاكاة طالب افتراضي واحد عبر خط المعالجة الحقيقي للمنصة */
function simulateOne(attempts: Attempt[], exam: ExamDef, bank: Question[], idx: number) {
  const email = `stress-${idx}@kiur.test`;
  const seed = hashStr(email) ^ Math.imul(idx + 1, 2654435761);
  const pool = bank.filter(
    (q) =>
      (exam.subjectIds.length === 0 || exam.subjectIds.includes(q.subject)) &&
      exam.questionTypes.includes(q.type)
  );
  const picked = (exam.shuffleQuestions ? shuffleSeeded(pool, seed) : pool).slice(
    0,
    Math.min(exam.count, pool.length)
  );
  if (picked.length === 0) throw new Error("empty pool");

  const items = picked.map((q, qi) => {
    const rnd = mulberry32(seed + qi * 104729);
    const r = rnd();
    let answer: number | string | null;
    if (r < 0.08) {
      answer = null; // طالب ترك السؤال
    } else if (q.type === "fill") {
      answer = r < 0.75 ? q.answers?.[0] ?? "answer" : "wrong-answer";
    } else {
      const len = Math.max(2, q.options.length);
      answer = r < 0.78 ? q.correct : (q.correct + 1 + Math.floor(rnd() * (len - 1))) % len;
    }
    return { q, answer };
  });

  const g = grade(items, exam.negativeMarking, exam.deduction);
  attempts.push({
    id: uid("st-"),
    examId: exam.id,
    examTitle: exam.title,
    studentEmail: email,
    studentName: `طالب افتراضي #${idx + 1}`,
    date: Date.now(),
    total: items.length,
    correct: g.correct,
    wrong: g.wrong,
    skipped: g.skipped,
    rawScore: g.rawScore,
    percent: g.percent,
    passPercent: exam.passPercent,
    passed: g.percent >= exam.passPercent,
    durationSec: 240 + (idx % 300),
    negative: exam.negativeMarking,
    deduction: exam.deduction,
    perSubject: g.perSubject,
    review: [],
    exits: idx % 47 === 7 ? 1 : 0,
  });
}

/**
 * اختبار الضغط — يحاكي N طالبًا متزامنًا (بدفعات) على خط المعالجة الحقيقي:
 * تصفية البنك ← تشويش مُبذّر ← إجابات ← تصحيح ← تسلسل JSON ← قياس كتابة التخزين
 */
export default function StressTest({ questions, exams }: { questions: Question[]; exams: ExamDef[] }) {
  const { t, bi } = useI18n();
  const [count, setCount] = useState(500);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; elapsed: number } | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  const exam: ExamDef | null = useMemo(() => {
    const pub = exams.find((e) => e.published);
    if (pub) return pub;
    if (questions.length === 0) return null;
    return {
      id: "stress-synthetic",
      title: { ar: "محاكاة شاملة للبنك", en: "Full-bank simulation" },
      description: { ar: "", en: "" },
      university: "",
      subjectIds: [],
      questionIds: [],
      questionTypes: ["mcq", "tf", "fill", "case"],
      count: 20,
      minutes: 30,
      passPercent: 60,
      negativeMarking: true,
      deduction: 0.25,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowSaveResume: false,
      published: true,
      createdAt: 0,
    };
  }, [exams, questions.length]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const pushLog = useCallback((msg: string, tone: LogLine["tone"] = "ok") => {
    setLogs((prev) => [...prev.slice(-48), { msg, tone }]);
  }, []);

  const run = useCallback(async () => {
    if (running || !exam) return;
    cancelRef.current = false;
    setRunning(true);
    setMetrics(null);
    setLogs([]);
    setPoints([{ x: 0, y: 0 }]);
    setProgress({ done: 0, elapsed: 0 });

    const n = Math.max(10, Math.min(5000, count));
    const BATCH = 25; // دفعة «متزامنة»
    const attempts: Attempt[] = [];
    let failures = 0;
    const t0 = performance.now();
    const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];

    pushLog(`▸ ${t("stress_run")} — ${n} ${t("stress_graded").replace("طالبًا مُصحّحًا", "طالب")} · ${t("stress_batch")} = ${BATCH}`, "warn");

    for (let i = 0; i < n; i += BATCH) {
      if (cancelRef.current) break;
      const take = Math.min(BATCH, n - i);
      for (let j = 0; j < take; j++) {
        try {
          simulateOne(attempts, exam, questions, i + j);
        } catch {
          failures++;
        }
      }
      const el = performance.now() - t0;
      pts.push({ x: el, y: i + take });
      setPoints([...pts]);
      setProgress({ done: i + take, elapsed: el });
      const batchNo = Math.floor(i / BATCH) + 1;
      if (batchNo % 4 === 1 || i + take === n) {
        pushLog(`T+${(el / 1000).toFixed(2)}s · ${t("stress_batch")} ${batchNo} — ${i + take}/${n} ${t("stress_graded")}`);
      }
      await new Promise((r) => setTimeout(r, 0)); // إفساح المجال لواجهة المراقبة
    }

    const totalMs = performance.now() - t0;
    const json = JSON.stringify(attempts);
    const storageKB = Math.round((json.length / 1024) * 10) / 10;
    let writeMs = -1;
    try {
      const w0 = performance.now();
      localStorage.setItem("kiur.stress.bench", json);
      localStorage.removeItem("kiur.stress.bench");
      writeMs = Math.round((performance.now() - w0) * 100) / 100;
    } catch {
      /* التخزين ممتلئ أو محظور */
    }
    const correctSum = attempts.reduce((s, a) => s + a.correct, 0);
    const totalQ = attempts.reduce((s, a) => s + a.total, 0);

    setMetrics({
      students: attempts.length,
      totalMs: Math.round(totalMs * 100) / 100,
      avgMs: Math.round((totalMs / Math.max(1, attempts.length)) * 1000) / 1000,
      tps: Math.round((attempts.length / (totalMs / 1000)) * 10) / 10,
      storageKB,
      writeMs,
      failures,
      batches: Math.ceil(n / BATCH),
      correctRate: totalQ ? Math.round((correctSum / totalQ) * 100) : 0,
    });
    pushLog(`✓ T+${(totalMs / 1000).toFixed(2)}s — ${t("stress_done")}`, "warn");
    setRunning(false);
  }, [running, exam, count, questions, pushLog, t]);

  if (questions.length === 0 || !exam) {
    return (
      <div className="card p-8">
        <EmptyState icon={<GaugeIcon size={24} />} text={t("stress_no_bank")} />
      </div>
    );
  }

  const n = Math.max(10, Math.min(5000, count));
  const done = progress?.done ?? 0;
  const pct = Math.round((done / n) * 100);
  const liveTps = progress && progress.elapsed > 0 ? Math.round((done / (progress.elapsed / 1000)) * 10) / 10 : 0;
  const maxX = Math.max(1, points[points.length - 1]?.x ?? 1);

  const verdict =
    metrics === null
      ? null
      : metrics.avgMs < 2
        ? { key: "stress_verdict_ok", cls: "bg-moss-100 text-moss-700 border border-moss-600/30" }
        : metrics.avgMs < 10
          ? { key: "stress_verdict_mid", cls: "bg-amberx-100 text-amberx-600 border border-amberx-500/40" }
          : { key: "stress_verdict_bad", cls: "bg-blood-100 text-blood-700 border border-blood-600/30" };

  return (
    <div className="space-y-5">
      {/* ───── التحكم ───── */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
          <GaugeIcon size={20} className="text-pulse-600" />
          <h2 className="font-display text-xl font-bold">{t("stress_tab")}</h2>
          <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">
            {t("stress_exam_used")}: {bi(exam.title)}
          </span>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm leading-relaxed text-ink-soft">{t("stress_hint")}</p>
            <p className="mt-2 flex items-start gap-2 rounded-lg bg-amberx-100/60 p-3 text-xs leading-relaxed text-amberx-600">
              <InfoIcon size={14} className="mt-0.5 shrink-0" />
              {t("stress_server_note")}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="lbl">{t("stress_students_label")}</label>
            <div className="flex items-center gap-1.5">
              {[100, 250, 500, 1000].map((p) => (
                <button
                  key={p}
                  onClick={() => setCount(p)}
                  className={
                    "rounded-lg px-3 py-2 font-display text-xs font-bold transition-all duration-200 " +
                    (count === p
                      ? "bg-pine-900 text-pulse-300 shadow-md"
                      : "border border-line bg-white text-ink-soft hover:border-pulse-500")
                  }
                >
                  {p}
                </button>
              ))}
              <input
                type="number"
                min={10}
                max={5000}
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 500)}
                className="input w-24 py-2 text-center font-display font-bold tabular-nums"
              />
            </div>
            <button onClick={run} disabled={running} className="btn-primary btn-pulse-ring px-8 py-3 text-base">
              <PlayIcon size={17} />
              {running ? t("stress_running") : t("stress_run")}
            </button>
          </div>
        </div>
      </div>

      {/* ───── لوحة المراقبة الحية ───── */}
      <div className="monitor-band relative overflow-hidden rounded-xl border border-pine-700 text-paper shadow-xl shadow-pine-950/20">
        <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[auto_1fr]">
          <div className="text-center lg:text-start">
            <p className="text-[10px] font-bold tracking-widest text-pulse-300/70 uppercase">{t("stress_progress")}</p>
            <p className="vital-num mt-1 text-6xl tabular-nums">
              {done}
              <span className="text-2xl text-pulse-300/60"> / {n}</span>
            </p>
            <p className="mt-2 font-display text-sm font-bold text-pulse-300">{pct}٪</p>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-pulse-300/70 uppercase">{t("stress_throughput")}</p>
                <p className="vital-num text-2xl tabular-nums">{liveTps || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-pulse-300/70 uppercase">{t("stress_total_time")}</p>
                <p className="vital-num text-2xl tabular-nums">
                  {progress ? (progress.elapsed / 1000).toFixed(2) : "0.00"}s
                </p>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <span className={"blink-dot h-2 w-2 rounded-full " + (running ? "bg-blood-600" : "bg-pulse-500")} />
                <span className="text-[10px] font-bold tracking-widest text-pulse-300/70 uppercase">
                  {running ? "LIVE · STRESS" : "STANDBY"}
                </span>
              </div>
            </div>

            {/* شريط الامتلاء */}
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-pine-800">
              <div
                className="h-full rounded-full bg-gradient-to-l from-pulse-300 to-pulse-600 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* منحنى الإنجاز */}
            <div className="mt-4">
              <p className="mb-1 text-[10px] font-bold tracking-widest text-pulse-300/60 uppercase">{t("stress_chart")}</p>
              <svg viewBox="0 0 300 64" preserveAspectRatio="none" className="h-16 w-full rounded-lg bg-pine-950/60" style={{ direction: "ltr" }}>
                {[16, 32, 48].map((y) => (
                  <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(126,212,190,0.12)" strokeWidth="1" />
                ))}
                {points.length > 1 && (
                  <polyline
                    points={points
                      .map((p) => `${((p.x / maxX) * 292 + 4).toFixed(1)},${(60 - (p.y / n) * 54).toFixed(1)}`)
                      .join(" ")}
                    fill="none"
                    stroke="#7ed4be"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 6px rgba(126,212,190,0.5))" }}
                  />
                )}
              </svg>
            </div>
          </div>
        </div>
        <EcgLine className="relative z-10 h-14 w-full text-pulse-300/90" speed={running ? 1.4 : 6.5} />
      </div>

      {/* ───── النتائج ───── */}
      {metrics && verdict && (
        <div className="anim-fade-up space-y-4">
          <div className={"anim-pop inline-flex items-center gap-2.5 rounded-xl px-5 py-3 font-display text-base font-bold " + verdict.cls}>
            <GaugeIcon size={20} />
            {t(verdict.key)}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <ResultCell label={t("stress_total_time")} value={`${(metrics.totalMs / 1000).toFixed(2)}s`} />
            <ResultCell label={t("stress_avg")} value={`${metrics.avgMs}ms`} />
            <ResultCell label={t("stress_tps")} value={String(metrics.tps)} />
            <ResultCell label={t("stress_storage")} value={`${metrics.storageKB} KB`} />
            <ResultCell
              label={t("stress_write")}
              value={metrics.writeMs >= 0 ? `${metrics.writeMs}ms` : "—"}
              tone={metrics.writeMs > 250 ? "text-blood-600" : undefined}
            />
            <ResultCell
              label={t("stress_failures")}
              value={String(metrics.failures)}
              tone={metrics.failures > 0 ? "text-blood-600" : "text-moss-600"}
            />
          </div>

          <p className="card px-5 py-3.5 text-sm text-ink-soft">
            <UsersIcon size={15} className="me-1.5 inline text-pulse-600" />
            {metrics.students} {t("stress_graded")} · {t("stress_correct_rate")}:{" "}
            <b className="font-display text-ink">{metrics.correctRate}٪</b> ·{" "}
            <ClipboardIcon size={15} className="me-1.5 inline text-pulse-600" />
            {t("stress_exam_used")}: <b className="text-ink">{bi(exam.title)}</b> ·{" "}
            <LayersIcon size={15} className="me-1.5 inline text-pulse-600" />
            {metrics.batches} × {t("stress_batch")}
          </p>
        </div>
      )}

      {/* ───── سجل التشغيل ───── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-paper/50 px-5 py-3">
          <TerminalIcon size={17} className="text-pulse-600" />
          <h3 className="font-display text-sm font-bold text-ink-soft">{t("stress_log")}</h3>
          <span className="ms-auto font-mono text-[10px] text-ink-soft" dir="ltr">kiur://stress-runner</span>
        </div>
        <div
          ref={logRef}
          dir="ltr"
          className="h-44 overflow-y-auto bg-pine-950 p-4 text-start font-mono text-[11px] leading-relaxed"
        >
          {logs.length === 0 ? (
            <p className="text-pulse-300/40">// awaiting run — press START to simulate {n} concurrent students</p>
          ) : (
            logs.map((l, i) => (
              <p key={i} className={l.tone === "warn" ? "text-amberx-500" : "text-pulse-300/85"}>
                {l.msg}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card p-4 text-center transition-transform duration-200 hover:-translate-y-0.5">
      <p className="font-display text-2xl font-bold tabular-nums leading-none">
        <span className={tone ?? "text-pulse-700"} style={tone ? undefined : { textShadow: "0 0 14px rgba(14,124,102,0.18)" }}>
          {value}
        </span>
      </p>
      <p className="mt-1.5 text-[11px] font-bold text-ink-soft">{label}</p>
    </div>
  );
}
