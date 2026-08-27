export type Lang = "ar" | "en";

/** نص ثنائي اللغة */
export interface BiText {
  ar: string;
  en: string;
}

export type SubjectId =
  | "anatomy"
  | "physiology"
  | "pharmacology"
  | "biochem"
  | "pathology"
  | "microbiology";

export interface Subject {
  id: SubjectId;
  name: BiText;
  color: string;
}

/** نمط السؤال: اختيار من متعدد | صح/خطأ | أكمل الفراغ | حالة سريرية */
export type QType = "mcq" | "tf" | "fill" | "case";

export interface Question {
  id: string;
  subject: SubjectId;
  type: QType;
  difficulty: 1 | 2 | 3;
  text: BiText;
  /** مسار صورة (للحالات السريرية) */
  image?: string;
  /** خيارات mcq/case فقط (4 خيارات أصلية) */
  options: BiText[];
  /** فهرس الخيار الصحيح الأصلي (في tf: 0 = صحيح، 1 = خطأ) */
  correct: number;
  /** إجابات مقبولة لأسئلة أكمل الفراغ */
  answers?: string[];
  explanation: BiText;
}

export interface ExamDef {
  id: string;
  title: BiText;
  description: BiText;
  /** مقررات الاختبار — فارغة = كل المقررات */
  subjectIds: SubjectId[];
  /** اختيار يدوي لأسئلة محددة (إذا امتلأت تتجاهل العدد والتصفية) */
  questionIds: string[];
  /** أنماط الأسئلة المسموحة عند الاختيار الآلي */
  questionTypes: QType[];
  /** عدد الأسئلة عند الاختيار الآلي */
  count: number;
  /** مدة الاختبار بالدقائق — 0 = بلا وقت */
  minutes: number;
  /** نسبة النجاح يحددها المشرف */
  passPercent: number;
  /** خصم درجات للإجابة الخاطئة */
  negativeMarking: boolean;
  /** مقدار الخصم لكل إجابة خاطئة (جزء من درجة السؤال، مثال 0.25) */
  deduction: number;
  /** ترتيب عشوائي للأسئلة مع كل محاولة */
  shuffleQuestions: boolean;
  /** ترتيب عشوائي لاختيارات كل سؤال مع كل إعادة محاولة */
  shuffleOptions: boolean;
  /** السماح بحفظ التقدم والإكمال لاحقًا */
  allowSaveResume: boolean;
  published: boolean;
  createdAt: number;
}

export interface Account {
  name: string;
  email: string;
  password: string;
  role: "student" | "admin";
  college?: string;
  year?: string;
  createdAt: number;
}

/** جلسة اختبار محفوظة (استكمال لاحقًا) */
export interface SavedSession {
  id: string;
  examId: string;
  studentEmail: string;
  questionIds: string[];
  optionOrders: number[][];
  answers: (number | string | null)[];
  flags: boolean[];
  currentIndex: number;
  remainingSec: number | null;
  startedAt: number;
  savedAt: number;
}

export interface ReviewItem {
  qid: string;
  order: number[];
  answer: number | string | null;
}

export interface Attempt {
  id: string;
  examId: string;
  examTitle: BiText;
  studentEmail: string;
  studentName: string;
  date: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  rawScore: number;
  percent: number;
  passPercent: number;
  passed: boolean;
  durationSec: number;
  negative: boolean;
  deduction: number;
  perSubject: Partial<Record<SubjectId, { c: number; t: number }>>;
  review: ReviewItem[];
  autoSubmitted?: boolean;
}

/** نتيجة مباشرة بعد التسليم (للمراجعة الكاملة) */
export interface ExamResult {
  exam: ExamDef;
  items: {
    q: Question;
    order: number[];
    answer: number | string | null;
    flagged: boolean;
  }[];
  durationSec: number;
  autoSubmitted?: boolean;
}
