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
  /** صورة السؤال (حالات سريرية) — رابط أو Data URL من مكتبة الصور */
  image?: string;
  /** خيارات mcq/case فقط */
  options: BiText[];
  /** فهرس الخيار الصحيح الأصلي (في tf: 0 = صحيح، 1 = خطأ) */
  correct: number;
  /** إجابات مقبولة لأسئلة أكمل الفراغ */
  answers?: string[];
  explanation: BiText;
}

/** صورة مرفوعة من المشرف في مكتبة الصور */
export interface ImageAsset {
  id: string;
  title: string;
  dataUrl: string;
  createdAt: number;
}

/** لمحة سريرية — ينشرها المالك لتظهر في واجهة الطلبة */
export interface Vignette {
  id: string;
  text: BiText;
  /** يحددها المالك فقط: هل تظهر للطلبة أم لا */
  published: boolean;
  authorEmail: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
}

/** قيد في سجل تعديل اللمحات السريرية — سجل مستقل عن سجل التدقيق العام */
export interface VignetteAuditEntry {
  id: string;
  date: number;
  actorEmail: string;
  actorName: string;
  action: "create" | "update" | "delete" | "publish" | "unpublish";
  title: string;
}

export interface ExamDef {
  id: string;
  title: BiText;
  description: BiText;
  /** نطاق الجامعة — فارغ = مشترك لكل الجامعات */
  university: string;
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
  /** مقدار الخصم لكل إجابة خاطئة (جزء من درجة السؤال) */
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

export type Role = "student" | "admin" | "owner";

/** اللقب الأكاديمي للمشرف داخل قسمه */
export type AdminTitle = "head" | "coordinator" | "doctor" | "professor" | "platform";

/** صلاحيات إشرافية قابلة للتمنح من مالك المنصة */
export type PermKey =
  | "exams"
  | "questions"
  | "images"
  | "import"
  | "students"
  | "reports"
  | "export"
  | "audit"
  | "universities"
  | "accountsLog"
  | "vignettes"
  | "shares";

export const ALL_PERMS: PermKey[] = [
  "exams", "questions", "images", "import", "students", "reports", "export", "audit",
  "universities", "accountsLog", "vignettes", "shares",
];

/** صلاحيات افتراضية لكل لقب أكاديمي (يعدّلها المالك) */
export const TITLE_DEFAULT_PERMS: Record<AdminTitle, PermKey[]> = {
  head: ["exams", "questions", "images", "import", "students", "reports", "export", "audit", "shares"],
  coordinator: ["exams", "questions", "students", "reports", "export", "shares"],
  doctor: ["questions", "students", "reports"],
  professor: ["questions", "exams", "reports"],
  platform: ["exams", "questions", "images", "import", "students", "reports", "export", "audit", "universities", "shares"],
};

/** جامعة يضيفها المالك يدويًا */
export interface CustomUniversity {
  id: string;
  name: BiText;
  collegeIds: string[];
  custom: true;
  createdAt: number;
}

/** كلية مخصصة يضيفها المالك */
export interface CustomCollege {
  id: string;
  name: BiText;
  maxYears: number;
  custom: true;
  createdAt: number;
}

/** قسم مخصص يضيفه المالك داخل أي كلية */
export interface CustomDept {
  id: string;
  collegeId: string;
  name: BiText;
  custom: true;
  createdAt: number;
}

/** طلب مشاركة اختبار بين جامعتين — يتطلب موافقة مشرف جامعة الاختبار */
export interface ShareRequest {
  id: string;
  examId: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  decidedByEmail?: string;
  decidedByName?: string;
  decidedAt?: number;
}

export interface Account {
  name: string;
  email: string;
  password: string;
  role: Role;
  university?: string;
  college?: string;
  department?: string;
  year?: string;
  /** صلاحيات المشرف (المالك يملك كل شيء ضمناً) */
  perms?: PermKey[];
  createdAt: number;
  /** نطاق رؤية المشرف — يحدده المالك فقط: جامعة محددة، وفارغ = بلا نطاق */
  scopeUniversity?: string;
  /** قسم محدد داخل الجامعة — فارغ = كل أقسام الجامعة */
  scopeDept?: string;
  /** اللقب الأكاديمي للمشرف (رئيس قسم، مقرر، دكتور، أستاذ) */
  adminTitle?: AdminTitle;
}

/** قيد في سجل التدقيق — يراه مالك المنصة (ومن مُنح صلاحية audit) */
export interface AuditEntry {
  id: string;
  date: number;
  actorEmail: string;
  actorName: string;
  actorRole: Role;
  action: "create" | "update" | "delete" | "import" | "grant";
  target: "exam" | "question" | "admin" | "student" | "share" | "university";
  title: string;
  details?: string;
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
  /** عدد مرات مغادرة نافذة الاختبار (رصد الأمان) */
  exits?: number;
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
  exits?: number;
}
