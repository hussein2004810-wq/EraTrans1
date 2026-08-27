export type SubjectId =
  | "anatomy"
  | "physiology"
  | "pharmacology"
  | "biochem"
  | "pathology"
  | "microbiology";

export interface Subject {
  id: SubjectId;
  name: string;
  nameEn: string;
  color: string;
}

export interface Question {
  id: string;
  subject: SubjectId;
  difficulty: 1 | 2 | 3;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

/** سؤال بعد خلط خياراته — يستخدم أثناء الاختبار وفي المراجعة */
export interface RuntimeQuestion {
  base: Question;
  options: string[];
  correct: number;
}

export type ExamMode = "exam" | "study";

export interface ExamConfig {
  mode: ExamMode;
  subjectIds: SubjectId[]; // فارغة = كل المقررات
  count: number;
  secondsPerQuestion: number;
}

export interface ExamResult {
  config: ExamConfig;
  questions: RuntimeQuestion[];
  answers: (number | null)[];
  flags: boolean[];
  durationSec: number;
  autoSubmitted?: boolean;
}

export interface Attempt {
  id: string;
  date: number;
  mode: ExamMode;
  subjectIds: SubjectId[];
  total: number;
  correct: number;
  percent: number;
  durationSec: number;
  perSubject: Partial<Record<SubjectId, { c: number; t: number }>>;
}
