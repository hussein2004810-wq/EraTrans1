import type { BiText, Question, QType, SubjectId } from "../types";
import { uid } from "./store";

export interface ImportOutcome {
  added: Question[];
  errors: string[];
}

const SUBJ_ALIASES: Record<string, SubjectId> = {
  anatomy: "anatomy", "التشريح": "anatomy", "تشريح": "anatomy",
  physiology: "physiology", "وظائف الأعضاء": "physiology", "وظائف": "physiology", physio: "physiology",
  pharmacology: "pharmacology", "علم الأدوية": "pharmacology", "ادوية": "pharmacology", pharm: "pharmacology",
  biochem: "biochem", biochemistry: "biochem", "الكيمياء الحيوية": "biochem", "كيمياء": "biochem",
  pathology: "pathology", "الأنسجة المرضية": "pathology", "انسجة": "pathology",
  microbiology: "microbiology", "الأحياء الدقيقة": "microbiology", "احياء دقيقة": "microbiology", micro: "microbiology",
};

function parseType(raw: string): QType | null {
  const s = raw.trim().toLowerCase();
  if (["mcq", "اختيار", "اختيار من متعدد", "multiple"].some((k) => s.includes(k))) return "mcq";
  if (["tf", "صح", "خطأ", "true"].some((k) => s.includes(k))) return "tf";
  if (["fill", "أكمل", "فراغ", "complete"].some((k) => s.includes(k))) return "fill";
  if (["case", "حالة", "سريري", "clinical"].some((k) => s.includes(k))) return "case";
  return null;
}

function parseSubject(raw: string): SubjectId | null {
  const s = raw.trim().toLowerCase();
  if (SUBJ_ALIASES[s]) return SUBJ_ALIASES[s];
  for (const [k, v] of Object.entries(SUBJ_ALIASES)) {
    if (s.includes(k.toLowerCase())) return v;
  }
  return null;
}

function parseDiff(raw: string): 1 | 2 | 3 {
  const s = raw.trim().toLowerCase();
  if (s === "1" || s.includes("basic") || s.includes("أساسي")) return 1;
  if (s === "3" || s.includes("adv") || s.includes("متقدم")) return 3;
  return 2;
}

function bi(raw: string): BiText {
  const parts = raw.split("|");
  const ar = (parts[0] ?? "").trim();
  const en = (parts[1] ?? ar).trim();
  return { ar, en };
}

function parseCorrectLetter(raw: string): number | null {
  const s = raw.trim().toUpperCase();
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
  if (map[s] !== undefined) return map[s];
  if (s.includes("TRUE") || s.includes("صحيح") || s === "T") return 0;
  if (s.includes("FALSE") || s.includes("خطأ") || s === "F") return 1;
  return null;
}

function buildQuestion(
  subject: SubjectId,
  type: QType,
  difficulty: 1 | 2 | 3,
  qar: string,
  qen: string,
  opts: { ar: string; en: string }[],
  correct: number,
  answers: string[] | undefined,
  expAr: string,
  expEn: string,
  image?: string
): Question | string {
  if (!qar && !qen) return "نص السؤال فارغ — Question text is empty";
  if (type === "mcq" || type === "case") {
    const valid = opts.filter((o) => o.ar || o.en);
    if (valid.length < 2) return "يحتاج خيارين على الأقل — needs at least 2 options";
    if (correct >= valid.length) return "فهرس الإجابة الصحيحة خارج نطاق الخيارات — correct index out of range";
    return {
      id: uid("q-"), subject, type, difficulty,
      text: { ar: qar, en: qen || qar },
      image: image || undefined,
      options: valid, correct,
      explanation: { ar: expAr, en: expEn || expAr },
    };
  }
  if (type === "fill") {
    if (!answers || answers.length === 0) return "أسئلة الفراغ تحتاج إجابات مقبولة — fill questions need accepted answers";
    return {
      id: uid("q-"), subject, type, difficulty,
      text: { ar: qar, en: qen || qar },
      options: [], correct: 0, answers,
      explanation: { ar: expAr, en: expEn || expAr },
    };
  }
  // tf
  if (correct !== 0 && correct !== 1) return "إجابة صح/خطأ يجب أن تكون TRUE أو FALSE";
  return {
    id: uid("q-"), subject, type, difficulty,
    text: { ar: qar, en: qen || qar },
    options: [], correct,
    explanation: { ar: expAr, en: expEn || expAr },
  };
}

/* ───────── Excel ───────── */

function normHead(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseExcelRow(row: Record<string, unknown>, errors: string[], idx: number): Question | null {
  const get = (...names: string[]) => {
    for (const [k, v] of Object.entries(row)) {
      if (names.includes(normHead(k))) return String(v ?? "").trim();
    }
    return "";
  };
  const subject = parseSubject(get("subject", "المقرر"));
  const type = parseType(get("type", "النمط") || "mcq");
  if (!subject) { errors.push(`الصف ${idx}: مقرر غير معروف "${get("subject", "المقرر")}"`); return null; }
  if (!type) { errors.push(`الصف ${idx}: نمط غير معروف "${get("type", "النمط")}"`); return null; }
  const qar = get("question ar", "question(ar)", "سؤال عربي", "question", "السؤال");
  const qen = get("question en", "question(en)", "سؤال إنجليزي");
  const opts = (["a", "b", "c", "d"] as const).map((l) => ({
    ar: get(`${l} ar`, `${l}(ar)`, `option ${l} ar`) || get(l),
    en: get(`${l} en`, `${l}(en)`, `option ${l} en`),
  }));
  const correctRaw = get("correct", "الإجابة", "correct answer");
  const correct = parseCorrectLetter(correctRaw);
  if (correct === null) { errors.push(`الصف ${idx}: قيمة إجابة غير صالحة "${correctRaw}"`); return null; }
  const answersRaw = get("answers", "الإجابات", "accepted answers");
  const answers = answersRaw ? answersRaw.split(/[,،]/).map((s) => s.trim()).filter(Boolean) : undefined;
  const expAr = get("explanation ar", "explanation(ar)", "exp ar", "شرح عربي", "explanation", "الشرح");
  const expEn = get("explanation en", "explanation(en)", "exp en", "شرح إنجليزي");
  const image = get("image", "الصورة") || undefined;
  const built = buildQuestion(
    subject, type, parseDiff(get("difficulty", "الصعوبة") || "2"),
    qar, qen, opts, correct, answers, expAr, expEn, image
  );
  if (typeof built === "string") { errors.push(`الصف ${idx}: ${built}`); return null; }
  return built;
}

async function parseExcel(file: File): Promise<ImportOutcome> {
  const errors: string[] = [];
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return { added: [], errors: ["الملف لا يحتوي أوراق عمل — no sheets found"] };
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    const added: Question[] = [];
    rows.forEach((row, i) => {
      const q = parseExcelRow(row, errors, i + 2);
      if (q) added.push(q);
    });
    return { added, errors };
  } catch {
    return { added: [], errors: ["تعذّر قراءة ملف Excel — failed to parse workbook"] };
  }
}

/* ───────── Word / TXT ───────── */

export function parseWordText(text: string): ImportOutcome {
  const errors: string[] = [];
  const added: Question[] = [];
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  blocks.forEach((block, blkIdx) => {
    const lines = block.split("\n").map((l) => l.trim());
    const val = (prefix: string) => {
      const l = lines.find((x) => x.toUpperCase().startsWith(prefix.toUpperCase()));
      return l ? l.slice(prefix.length).trim() : "";
    };
    const optLines: { ar: string; en: string }[] = [];
    lines.forEach((l) => {
      const m = l.match(/^([A-Da-dأ-ي])\)\s*(.+)$/);
      if (m) {
        const b2 = bi(m[2]);
        optLines.push({ ar: b2.ar, en: b2.en });
      }
    });
    const subject = parseSubject(val("S:"));
    if (!subject) { errors.push(`الكتلة ${blkIdx + 1}: مقرر غير معروف — unknown subject (سطر S:)`); return; }
    const type = parseType(val("T:") || "mcq");
    if (!type) { errors.push(`الكتلة ${blkIdx + 1}: نمط غير معروف — unknown type (سطر T:)`); return; }
    const qar = bi(val("Q:")).ar;
    const qen = bi(val("Q:")).en;
    const correctRaw = val("C:");
    const correct = parseCorrectLetter(correctRaw);
    if (correct === null) { errors.push(`الكتلة ${blkIdx + 1}: إجابة غير صالحة — invalid correct (سطر C:)`); return; }
    const answersRaw = val("F:");
    const answers = answersRaw ? answersRaw.split(/[,،]/).map((s) => s.trim()).filter(Boolean) : undefined;
    const built = buildQuestion(
      subject, type, parseDiff(val("D:") || "2"),
      qar, qen, optLines, correct, answers,
      bi(val("E:")).ar, bi(val("E:")).en,
      val("I:") || undefined
    );
    if (typeof built === "string") { errors.push(`الكتلة ${blkIdx + 1}: ${built}`); return; }
    added.push(built);
  });
  return { added, errors };
}

/* ───────── المدخل الرئيسي ───────── */

export async function parseQuestionsFile(file: File): Promise<ImportOutcome> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) return parseExcel(file);
  if (name.endsWith(".docx")) {
    try {
      const { default: mammoth } = await import("mammoth");
      const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return parseWordText(value);
    } catch {
      return { added: [], errors: ["تعذّر قراءة ملف Word — failed to parse docx"] };
    }
  }
  if (name.endsWith(".txt") || name.endsWith(".md")) return parseWordText(await file.text());
  return { added: [], errors: ["unsupported_file"] };
}

/* ───────── قوالب التنزيل ───────── */

export async function downloadExcelTemplate() {
  const XLSX = await import("xlsx");
  const headers = [
    "Subject", "Type", "Difficulty", "Question AR", "Question EN",
    "A AR", "A EN", "B AR", "B EN", "C AR", "C EN", "D AR", "D EN",
    "Correct", "Answers", "Explanation AR", "Explanation EN", "Image",
  ];
  const sample = [
    "anatomy", "mcq", "2",
    "ما العصب الذي يغذي العضلة الدالية؟", "Which nerve supplies the deltoid muscle?",
    "العصب الكعبري", "Radial nerve",
    "العصب الإبطي", "Axillary nerve",
    "العصب العضدي الجلدي", "Musculocutaneous nerve",
    "العصب الزندي", "Ulnar nerve",
    "B", "",
    "العصب الإبطي (C5-C6) يلتف حول عنق العضد ويغذي الدالية.", "The axillary nerve (C5-C6) wraps the surgical neck and supplies the deltoid.",
    "",
  ];
  const fillSample = [
    "physiology", "fill", "1",
    "الهرمون الذي يرفع سكر الدم هو ____.", "The hormone that raises blood glucose is ____.",
    "", "", "", "", "", "", "", "",
    "", "جلوكاجون, glucagon",
    "الجلوكاجون يحفز تحلل الجلايكوجين في الكبد.", "Glucagon stimulates hepatic glycogenolysis.",
    "",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample, fillSample]);
  ws["!cols"] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, "kiur-questions-template.xlsx");
}

export function downloadWordTemplate() {
  const sample = `Q: ما التشخيص الأرجح لتسارع قلبي بموجات P قبل كل QRS؟ | Most likely diagnosis for a fast rhythm with a P before every QRS?
T: mcq
S: physiology
D: 2
A) تسارع جيبي | Sinus tachycardia
B) رجفان أذيني | Atrial fibrillation
C) تسارع بطيني | Ventricular tachycardia
D) رفرفة أذينية | Atrial flutter
C: A
E: موجة P طبيعية قبل كل مركب مع معدل فوق 100. | Normal P before each complex with rate above 100.

Q: فيتامين C يقي من داء الأسقربوط. | Vitamin C prevents scurvy.
T: tf
S: biochem
C: TRUE
E: نقص فيتامين C يعطل هدرجة الكولاجين. | Vitamin C deficiency impairs collagen hydroxylation.

Q: الإنزيم المحدد لسرعة تحلل الجلوكوز هو ____.
T: fill
S: biochem
F: PFK-1, فوسفوفروكتوكينيز
E: نقطة التحكم الرئيسية في المسار. | The key control point of the pathway.`;
  const blob = new Blob(["\ufeff" + sample], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kiur-word-template.txt";
  a.click();
  URL.revokeObjectURL(url);
}
