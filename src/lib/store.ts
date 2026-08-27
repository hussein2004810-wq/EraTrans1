import type { Question } from "../types";

/* v2: إعادة تهيئة البيانات ليتفعّل حساب المالك الجديد */
export const KEYS = {
  accounts: "kiur.accounts.v2",
  questions: "kiur.questions.v2",
  exams: "kiur.exams.v2",
  attempts: "kiur.attempts.v2",
  sessions: "kiur.sessions.v2",
  images: "kiur.images.v2",
  audit: "kiur.audit.v2",
  universities: "kiur.universities.v2",
  vignettes: "kiur.vignettes.v2",
  vignetteAudit: "kiur.vignetteAudit.v2",
  user: "kiur.user.v2",
  lang: "kiur.lang.v2",
} as const;

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
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

/* ───────── تشويش مُبذّر: ترتيب مختلف لكل طالب وكل محاولة ───────── */

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const rnd = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ───────── ضغط الصور المرفوعة ───────── */

export function fileToDataUrl(file: File, maxWidth = 1100, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unavailable"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
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
