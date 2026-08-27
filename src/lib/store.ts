import type { Question } from "../types";

export const KEYS = {
  accounts: "kiur.accounts.v1",
  questions: "kiur.questions.v1",
  exams: "kiur.exams.v1",
  attempts: "kiur.attempts.v1",
  sessions: "kiur.sessions.v1",
  user: "kiur.user.v1",
  lang: "kiur.lang.v1",
} as const;

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* التخزين غير متاح */
  }
}

export function uid(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ───────── التصحيح ───────── */

export function normAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

export function isCorrect(q: Question, answer: number | string | null | undefined): boolean {
  if (answer === null || answer === undefined) return false;
  if (q.type === "fill") {
    if (typeof answer !== "string") return false;
    return (q.answers ?? []).some((a) => normAnswer(a) === normAnswer(answer));
  }
  return typeof answer === "number" && answer === q.correct;
}

export interface GradeStats {
  correct: number;
  wrong: number;
  skipped: number;
  rawScore: number;
  percent: number;
  perSubject: Partial<Record<Question["subject"], { c: number; t: number }>>;
}

export function grade(
  items: { q: Question; answer: number | string | null }[],
  negative: boolean,
  deduction: number
): GradeStats {
  let correct = 0,
    wrong = 0,
    skipped = 0,
    raw = 0;
  const perSubject: GradeStats["perSubject"] = {};
  items.forEach(({ q, answer }) => {
    const st = (perSubject[q.subject] ??= { c: 0, t: 0 });
    st.t += 1;
    if (answer === null || answer === undefined || answer === "") {
      skipped += 1;
    } else if (isCorrect(q, answer)) {
      correct += 1;
      raw += 1;
      st.c += 1;
    } else {
      wrong += 1;
      if (negative) raw -= deduction;
    }
  });
  const total = items.length;
  const percent = total === 0 ? 0 : Math.max(0, Math.round((raw / total) * 100));
  return { correct, wrong, skipped, rawScore: raw, percent, perSubject };
}

export function fmtClock(sec: number): string {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
