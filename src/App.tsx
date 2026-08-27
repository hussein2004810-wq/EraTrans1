import { useEffect, useState } from "react";
import type { Attempt, ExamConfig, ExamResult, RuntimeQuestion } from "./types";
import { QUESTIONS } from "./data/questions";
import Home from "./components/Home";
import Exam from "./components/Exam";
import Results from "./components/Results";

const STORAGE_KEY = "nabd.attempts.v1";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Attempt[]) : [];
  } catch {
    return [];
  }
}

type Screen = "home" | "exam" | "results";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [runtime, setRuntime] = useState<RuntimeQuestion[] | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>(loadAttempts);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const persist = (list: Attempt[]) => {
    setAttempts(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* التخزين غير متاح — نتابع دون حفظ */
    }
  };

  const start = (cfg: ExamConfig) => {
    const pool =
      cfg.subjectIds.length === 0
        ? [...QUESTIONS]
        : QUESTIONS.filter((q) => cfg.subjectIds.includes(q.subject));
    const picked = shuffle(pool).slice(0, Math.min(cfg.count, pool.length));
    const rt: RuntimeQuestion[] = picked.map((q) => {
      const order = shuffle([0, 1, 2, 3]);
      return {
        base: q,
        options: order.map((i) => q.options[i]),
        correct: order.indexOf(q.correct),
      };
    });
    setConfig(cfg);
    setRuntime(rt);
    setScreen("exam");
  };

  const finish = (r: ExamResult) => {
    const total = r.questions.length;
    const correct = r.answers.filter((a, i) => a === r.questions[i].correct).length;
    const perSubject: Attempt["perSubject"] = {};
    r.questions.forEach((q, i) => {
      const s = q.base.subject;
      const cur = perSubject[s] ?? { c: 0, t: 0 };
      cur.t += 1;
      if (r.answers[i] === q.correct) cur.c += 1;
      perSubject[s] = cur;
    });
    const attempt: Attempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: Date.now(),
      mode: r.config.mode,
      subjectIds: r.config.subjectIds,
      total,
      correct,
      percent: total === 0 ? 0 : Math.round((correct / total) * 100),
      durationSec: r.durationSec,
      perSubject,
    };
    persist([attempt, ...attempts]);
    setLastResult(r);
    setScreen("results");
  };

  if (screen === "exam" && config && runtime) {
    return (
      <Exam
        config={config}
        questions={runtime}
        onFinish={finish}
        onExit={() => setScreen("home")}
      />
    );
  }

  if (screen === "results" && lastResult) {
    return (
      <Results
        result={lastResult}
        onRetry={() => start(lastResult.config)}
        onHome={() => setScreen("home")}
      />
    );
  }

  return (
    <Home
      attempts={attempts}
      onStart={start}
      onClear={() => persist([])}
    />
  );
}
