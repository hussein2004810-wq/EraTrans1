import { useEffect, useMemo, useRef, useState } from "react";
import type { Question, QType, SubjectId } from "../types";
import { useI18n } from "../i18n";
import { SUBJECTS, subjectById } from "../data/seed";
import { fileToDataUrl, uid } from "../lib/store";
import ImagePicker from "./ImagePicker";
import {
  downloadExcelTemplate,
  downloadWordTemplate,
  parseQuestionsFile,
  type ImportOutcome,
} from "../lib/importer";
import { DifficultyDots, EmptyState, Modal, SubjectTag, TypeBadge } from "../components/ui";
import {
  CheckIcon, DownloadIcon, EditIcon, FileIcon, ImageIcon, InfoIcon, LayersIcon,
  PlusIcon, SaveIcon, SearchIcon, SheetIcon, TrashIcon, UploadIcon, XIcon,
} from "../components/icons";

const TYPE_LABELS: Record<QType, string> = { mcq: "type_mcq", tf: "type_tf", fill: "type_fill", case: "type_case" };

/* ═══════════ بنك الأسئلة ═══════════ */

export default function QuestionBank({
  questions,
  onSave,
  onDelete,
  presetImage,
  onPresetConsumed,
}: {
  questions: Question[];
  onSave: (q: Question) => void;
  onDelete: (id: string) => void;
  presetImage?: string | null;
  onPresetConsumed?: () => void;
}) {
  const { t, bi } = useI18n();
  const [fSubject, setFSubject] = useState<"all" | SubjectId>("all");
  const [fType, setFType] = useState<"all" | QType>("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Question | null>(null);
  const [toDelete, setToDelete] = useState<Question | null>(null);

  const list = useMemo(
    () =>
      questions.filter(
        (q) =>
          (fSubject === "all" || q.subject === fSubject) &&
          (fType === "all" || q.type === fType) &&
          (search === "" ||
            q.text.ar.includes(search) ||
            q.text.en.toLowerCase().includes(search.toLowerCase()))
      ),
    [questions, fSubject, fType, search]
  );

  const blank = (): Question => ({
    id: uid("q-"),
    subject: "anatomy",
    type: "mcq",
    difficulty: 2,
    text: { ar: "", en: "" },
    options: [
      { ar: "", en: "" }, { ar: "", en: "" }, { ar: "", en: "" }, { ar: "", en: "" },
    ],
    correct: 0,
    answers: [],
    explanation: { ar: "", en: "" },
  });

  /* فتح المحرر تلقائيًا عند الوصول من مكتبة الصور بسؤال جديد على صورة */
  useEffect(() => {
    if (presetImage) {
      const b = blank();
      b.type = "case";
      b.image = presetImage;
      setDraft(b);
      onPresetConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetImage]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
        <LayersIcon size={20} className="text-pulse-600" />
        <h2 className="font-display text-xl font-bold">{t("question_bank")}</h2>
        <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">{questions.length}</span>
        <button onClick={() => setDraft(blank())} className="btn-primary ms-auto">
          <PlusIcon size={15} /> {t("add_question")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/50 px-5 py-3">
        <div className="relative min-w-52 flex-1">
          <SearchIcon size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input className="input ps-9" placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={fSubject} onChange={(e) => setFSubject(e.target.value as "all" | SubjectId)}>
          <option value="all">{t("filter_subject")}: {t("all")}</option>
          {SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>{bi(s.name)}</option>
          ))}
        </select>
        <select className="input w-auto" value={fType} onChange={(e) => setFType(e.target.value as "all" | QType)}>
          <option value="all">{t("filter_type")}: {t("all")}</option>
          {(Object.keys(TYPE_LABELS) as QType[]).map((qt) => (
            <option key={qt} value={qt}>{t(TYPE_LABELS[qt])}</option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="p-6"><EmptyState icon={<LayersIcon size={22} />} text={t("no_items_filter")} /></div>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((q) => (
            <li key={q.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-pulse-100/30">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{bi(q.text)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <SubjectTag id={q.subject} small />
                  <TypeBadge type={q.type} />
                  <DifficultyDots level={q.difficulty} />
                  {q.image && <span className="text-[10px] font-bold text-amberx-600">IMG</span>}
                </div>
              </div>
              <button onClick={() => setDraft({ ...q, text: { ...q.text }, options: q.options.map((o) => ({ ...o })), answers: q.answers ? [...q.answers] : [], explanation: { ...q.explanation } })} className="rounded-lg border border-line bg-white p-2 text-ink-soft transition-colors hover:border-pulse-500 hover:text-pulse-700" aria-label={t("edit")}>
                <EditIcon size={14} />
              </button>
              <button onClick={() => setToDelete(q)} className="rounded-lg border border-line bg-white p-2 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600" aria-label={t("delete")}>
                <TrashIcon size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft && <QuestionEditor initial={draft} onSave={(q) => { onSave(q); setDraft(null); }} onClose={() => setDraft(null)} />}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3 className="font-display text-xl font-bold">{t("confirm_delete_q")}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{toDelete && bi(toDelete.text)}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setToDelete(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button
            onClick={() => {
              if (toDelete) onDelete(toDelete.id);
              setToDelete(null);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blood-600 px-4 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-blood-700"
          >
            <TrashIcon size={15} /> {t("delete")}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════ محرر السؤال ═══════════ */

function QuestionEditor({
  initial,
  onSave,
  onClose,
}: {
  initial: Question;
  onSave: (q: Question) => void;
  onClose: () => void;
}) {
  const { t, bi } = useI18n();
  const [q, setQ] = useState<Question>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const upRef = useRef<HTMLInputElement>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const url = await fileToDataUrl(f, 900);
      setQ((p) => ({ ...p, image: url }));
    } catch {
      setErr(t("img_quota"));
    }
  };

  const setOpt = (i: number, lang: "ar" | "en", v: string) =>
    setQ((p) => {
      const options = p.options.map((o) => ({ ...o }));
      while (options.length <= i) options.push({ ar: "", en: "" });
      options[i][lang] = v;
      return { ...p, options };
    });

  const save = () => {
    if (!q.text.ar.trim() && !q.text.en.trim()) return setErr(t("required_fields"));
    if (q.type === "mcq" || q.type === "case") {
      const filled = q.options.filter((o) => o.ar.trim() || o.en.trim());
      if (filled.length < 2) return setErr(t("required_fields"));
      if (q.correct >= filled.length) return setErr(t("correct_choice"));
    }
    if (q.type === "fill" && (!q.answers || q.answers.length === 0)) return setErr(t("required_fields"));
    onSave({
      ...q,
      options: q.type === "mcq" || q.type === "case" ? q.options.filter((o) => o.ar.trim() || o.en.trim()) : [],
      correct: q.type === "fill" ? 0 : q.correct,
      answers: q.type === "fill" ? q.answers : undefined,
      image: q.image?.trim() ? q.image.trim() : undefined,
    });
  };

  return (
    <Modal open onClose={onClose} wide>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">{t("edit_question")}</h3>
        <button onClick={onClose} className="rounded-lg border border-line p-2 text-ink-soft hover:border-blood-600 hover:text-blood-600" aria-label={t("close")}>
          <XIcon size={16} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="lbl">{t("subject_col")}</label>
          <select className="input" value={q.subject} onChange={(e) => setQ({ ...q, subject: e.target.value as SubjectId })}>
            {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{bi(s.name)}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl">{t("type_col")}</label>
          <select
            className="input"
            value={q.type}
            onChange={(e) => setQ({ ...q, type: e.target.value as QType, correct: e.target.value === "tf" ? Math.min(q.correct, 1) : q.correct })}
          >
            {(Object.keys(TYPE_LABELS) as QType[]).map((qt) => <option key={qt} value={qt}>{t(TYPE_LABELS[qt])}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl">{t("difficulty")}</label>
          <select className="input" value={q.difficulty} onChange={(e) => setQ({ ...q, difficulty: Number(e.target.value) as 1 | 2 | 3 })}>
            <option value={1}>{t("level_basic")}</option>
            <option value={2}>{t("level_mid")}</option>
            <option value={3}>{t("level_adv")}</option>
          </select>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="lbl">{t("q_text_ar")}</label>
          <textarea className="input min-h-20" value={q.text.ar} onChange={(e) => setQ({ ...q, text: { ...q.text, ar: e.target.value } })} />
        </div>
        <div>
          <label className="lbl">{t("q_text_en")}</label>
          <textarea className="input min-h-20" dir="ltr" value={q.text.en} onChange={(e) => setQ({ ...q, text: { ...q.text, en: e.target.value } })} />
        </div>
      </div>

      {(q.type === "mcq" || q.type === "case") && (
        <div className="mt-3">
          <p className="lbl">{t("correct_choice")}: </p>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <div key={i} className={"rounded-lg border-2 p-2.5 transition-colors " + (q.correct === i ? "border-moss-600 bg-moss-100/60" : "border-line")}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQ({ ...q, correct: i })}
                    className={"grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors " + (q.correct === i ? "border-moss-600 bg-moss-600 text-white" : "border-line bg-white")}
                    aria-label={t("correct_answer")}
                  >
                    {q.correct === i && <CheckIcon size={12} />}
                  </button>
                  <span className="font-display text-xs font-bold text-ink-soft">{String.fromCharCode(65 + i)}</span>
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input className="input py-1.5" placeholder={t("opt") + " (عربي)"} value={opt.ar} onChange={(e) => setOpt(i, "ar", e.target.value)} />
                    <input className="input py-1.5" dir="ltr" placeholder="Option (EN)" value={opt.en} onChange={(e) => setOpt(i, "en", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-line bg-paper/50 p-3.5">
            <label className="lbl">{t("image_path")} {q.type === "case" && "★"}</label>
            {q.image ? (
              <div className="mt-1 flex items-start gap-3">
                <img
                  src={q.image}
                  alt=""
                  className="h-28 rounded-lg border border-line bg-pine-950 object-contain"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <button
                  onClick={() => setQ({ ...q, image: undefined })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-bold text-blood-600 transition-colors hover:border-blood-600"
                >
                  <TrashIcon size={12} /> {t("img_remove")}
                </button>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                <button onClick={() => upRef.current?.click()} className="btn-ghost text-xs">
                  <UploadIcon size={13} /> {t("img_upload_new")}
                </button>
                <button onClick={() => setPickOpen(true)} className="btn-ghost text-xs">
                  <ImageIcon size={13} /> {t("img_from_library")}
                </button>
              </div>
            )}
            <input ref={upRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <input
              className="input mt-2"
              dir="ltr"
              value={q.image && !q.image.startsWith("data:") ? q.image : ""}
              onChange={(e) => setQ({ ...q, image: e.target.value || undefined })}
              placeholder="https://..."
            />
            {pickOpen && (
              <ImagePicker
                onPick={(url) => {
                  setQ({ ...q, image: url });
                  setPickOpen(false);
                }}
                onClose={() => setPickOpen(false)}
              />
            )}
          </div>
        </div>
      )}

      {q.type === "tf" && (
        <div className="mt-3">
          <p className="lbl">{t("correct_answer")}</p>
          <div className="flex gap-2">
            {[t("true_opt"), t("false_opt")].map((label, i) => (
              <button
                key={i}
                onClick={() => setQ({ ...q, correct: i })}
                className={
                  "flex-1 rounded-lg border-2 py-2.5 font-display text-sm font-bold transition-all " +
                  (q.correct === i ? "border-moss-600 bg-moss-100 text-moss-700" : "border-line bg-white text-ink-soft hover:border-moss-600/50")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {q.type === "fill" && (
        <div className="mt-3">
          <label className="lbl">{t("fill_answers")}</label>
          <input
            className="input"
            value={(q.answers ?? []).join(", ")}
            onChange={(e) => setQ({ ...q, answers: e.target.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean) })}
            placeholder="125, مئة وخمسة وعشرون, 125 ml/min"
          />
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="lbl">{t("exp_ar")}</label>
          <textarea className="input min-h-16" value={q.explanation.ar} onChange={(e) => setQ({ ...q, explanation: { ...q.explanation, ar: e.target.value } })} />
        </div>
        <div>
          <label className="lbl">{t("exp_en")}</label>
          <textarea className="input min-h-16" dir="ltr" value={q.explanation.en} onChange={(e) => setQ({ ...q, explanation: { ...q.explanation, en: e.target.value } })} />
        </div>
      </div>

      {err && <p className="anim-pop mt-3 rounded-lg bg-blood-100 px-3 py-2 text-sm font-bold text-blood-700">{err}</p>}

      <div className="mt-5 flex gap-3">
        <button onClick={onClose} className="btn-ghost flex-1">{t("cancel")}</button>
        <button onClick={save} className="btn-primary flex-1">
          <SaveIcon size={16} /> {t("save")}
        </button>
      </div>
    </Modal>
  );
}

/* ═══════════ لوحة الاستيراد ═══════════ */

export function ImportPanel({
  questions,
  onImport,
}: {
  questions: Question[];
  onImport: (qs: Question[]) => void;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setOutcome(null);
    try {
      const res = await parseQuestionsFile(file);
      setOutcome(res);
      if (res.added.length > 0) onImport(res.added);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-3 p-5">
        <UploadIcon size={20} className="text-pulse-600" />
        <h2 className="font-display text-xl font-bold">{t("import_tab")}</h2>
        <span className="ms-auto flex gap-2">
          <button onClick={downloadExcelTemplate} className="btn-ghost">
            <SheetIcon size={15} className="text-moss-600" /> {t("import_template_x")}
          </button>
          <button onClick={downloadWordTemplate} className="btn-ghost">
            <FileIcon size={15} className="text-blood-600" /> {t("import_template_w")}
          </button>
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        onClick={() => fileRef.current?.click()}
        className={
          "card flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-12 text-center transition-all duration-200 " +
          (dragOver ? "border-pulse-500 bg-pulse-100/60 scale-[1.01]" : "border-line hover:border-pulse-500/60 hover:bg-pulse-100/30")
        }
      >
        <span className={"grid h-16 w-16 place-items-center rounded-2xl transition-colors " + (busy ? "bg-amberx-100 text-amberx-600" : "bg-pulse-100 text-pulse-700")}>
          <UploadIcon size={30} className={busy ? "blink-dot" : ""} />
        </span>
        <p className="font-display text-lg font-bold">{busy ? t("importing") : t("import_title")}</p>
        <p className="text-sm text-ink-soft" dir="auto">xlsx · xls · csv · docx · txt</p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {outcome && (
        <div className="anim-fade-up grid gap-4 md:grid-cols-2">
          <div className="card border-moss-600/40 p-5">
            <p className="flex items-center gap-2 font-display text-lg font-bold text-moss-700">
              <CheckIcon size={18} /> {t("import_done").replace("{n}", String(outcome.added.length))}
            </p>
            <p className="mt-1 text-xs text-ink-soft">{t("question_bank")}: {questions.length}</p>
          </div>
          {outcome.errors.length > 0 && (
            <div className="card border-blood-600/40 p-5">
              <p className="flex items-center gap-2 font-display text-base font-bold text-blood-700">
                <XIcon size={16} /> {t("import_errors")} ({outcome.errors.length})
              </p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-ink-soft">
                {outcome.errors.map((e, i) => (
                  <li key={i} className="rounded bg-paper px-2 py-1">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <details className="card group p-5">
        <summary className="flex cursor-pointer items-center gap-2 font-display text-base font-bold">
          <InfoIcon size={17} className="text-pulse-600" />
          {t("format_guide")}
          <DownloadIcon size={14} className="ms-auto text-ink-soft transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-moss-700">
              <SheetIcon size={15} /> Excel — {t("import_template_x")}
            </p>
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-paper">
                    <th className="px-2 py-1.5 text-start font-bold">Subject</th>
                    <th className="px-2 py-1.5 text-start font-bold">Type</th>
                    <th className="px-2 py-1.5 text-start font-bold">Question AR</th>
                    <th className="px-2 py-1.5 text-start font-bold">Question EN</th>
                    <th className="px-2 py-1.5 text-start font-bold">A AR…D EN</th>
                    <th className="px-2 py-1.5 text-start font-bold">Correct</th>
                    <th className="px-2 py-1.5 text-start font-bold">Answers</th>
                    <th className="px-2 py-1.5 text-start font-bold">Explanation AR/EN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1.5">anatomy</td>
                    <td className="px-2 py-1.5">mcq / tf / fill / case</td>
                    <td className="px-2 py-1.5">نص السؤال</td>
                    <td className="px-2 py-1.5">Question text</td>
                    <td className="px-2 py-1.5">8 {t("opt")}</td>
                    <td className="px-2 py-1.5">A–D / TRUE</td>
                    <td className="px-2 py-1.5">fill {t("correct_answer")}</td>
                    <td className="px-2 py-1.5">{t("explanation")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
              {t("subject_col")}: anatomy, physiology, pharmacology, biochem, pathology, microbiology
            </p>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-blood-700">
              <FileIcon size={15} /> Word/TXT
            </p>
            <pre className="overflow-x-auto rounded-lg bg-pine-900 p-3 text-[11px] leading-relaxed text-pulse-300" dir="ltr">
{`Q: نص السؤال | Question text
T: mcq
S: anatomy
D: 2
A) خيار أ | Option A
B) خيار ب | Option B
C) خيار ج | Option C
D) خيار د | Option D
C: B
E: الشرح | Explanation
I: image-url (optional)
F: ans1, ans2   ← fill only`}
            </pre>
            <p className="mt-2 text-[11px] text-ink-soft">{subjectById("anatomy").name.ar}: T=mcq|tf|fill|case · C=TRUE/FALSE tf</p>
          </div>
        </div>
      </details>
    </div>
  );
}
