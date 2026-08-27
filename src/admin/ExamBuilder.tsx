import { useMemo, useState } from "react";
import type { Attempt, ExamDef, Question, QType, SubjectId } from "../types";
import { useI18n } from "../i18n";
import { SUBJECTS } from "../data/seed";
import { uid } from "../lib/store";
import { effectiveCount } from "../student/StudentDashboard";
import { EmptyState, Modal, SubjectTag, Toggle, TypeBadge, formatDate } from "../components/ui";
import {
  CheckIcon, ClipboardIcon, ClockIcon, EditIcon, EyeIcon, LayersIcon,
  PlusIcon, RefreshIcon, SaveIcon, SearchIcon, TargetIcon, TrashIcon, XIcon,
} from "../components/icons";

const ALL_TYPES: QType[] = ["mcq", "tf", "fill", "case"];

interface Props {
  exams: ExamDef[];
  questions: Question[];
  attempts: Attempt[];
  onSave: (e: ExamDef) => void;
  onDelete: (id: string) => void;
}

export default function ExamBuilder({ exams, questions, attempts, onSave, onDelete }: Props) {
  const { t, bi, lang } = useI18n();
  const [draft, setDraft] = useState<ExamDef | null>(null);
  const [toDelete, setToDelete] = useState<ExamDef | null>(null);

  const blank = (): ExamDef => ({
    id: uid("ex-"),
    title: { ar: "", en: "" },
    description: { ar: "", en: "" },
    subjectIds: [],
    questionIds: [],
    questionTypes: ["mcq", "tf", "fill", "case"],
    count: 10,
    minutes: 15,
    passPercent: 60,
    negativeMarking: false,
    deduction: 0.25,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowSaveResume: true,
    published: true,
    createdAt: Date.now(),
  });

  return (
    <div>
      {draft ? (
        <ExamForm
          initial={draft}
          questions={questions}
          onCancel={() => setDraft(null)}
          onSave={(e) => {
            onSave(e);
            setDraft(null);
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <ClipboardIcon size={20} className="text-pulse-600" />
            <h2 className="font-display text-2xl font-bold">{t("exams_tab")}</h2>
            <button onClick={() => setDraft(blank())} className="btn-primary ms-auto">
              <PlusIcon size={16} /> {t("new_exam")}
            </button>
          </div>

          {exams.length === 0 ? (
            <EmptyState icon={<ClipboardIcon size={22} />} text={t("no_published")} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {exams.map((exam) => {
                const takers = attempts.filter((a) => a.examId === exam.id).length;
                const n = effectiveCount(exam, questions);
                return (
                  <article key={exam.id} className="card flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-bold leading-snug">{bi(exam.title)}</h3>
                      <button
                        onClick={() => onSave({ ...exam, published: !exam.published })}
                        className={
                          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors " +
                          (exam.published ? "bg-moss-100 text-moss-700 hover:bg-moss-600 hover:text-white" : "bg-paper-deep text-ink-soft hover:bg-moss-100 hover:text-moss-700")
                        }
                      >
                        {exam.published ? t("publish") : "—"}
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{bi(exam.description)}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {exam.subjectIds.length === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pine-900 px-2 py-0.5 text-[11px] font-semibold text-pulse-300">
                          <LayersIcon size={11} /> {t("all_subjects")}
                        </span>
                      ) : (
                        exam.subjectIds.map((s) => <SubjectTag key={s} id={s} small />)
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ink-soft sm:grid-cols-3">
                      <span className="flex items-center gap-1.5"><TargetIcon size={13} className="text-pulse-600" /> {n} {t("q_count")}</span>
                      <span className="flex items-center gap-1.5"><ClockIcon size={13} className="text-pulse-600" /> {exam.minutes > 0 ? `${exam.minutes} ${t("minutes_short")}` : t("no_time_limit")}</span>
                      <span className="flex items-center gap-1.5"><CheckIcon size={13} className="text-pulse-600" /> {t("pass_mark")} {exam.passPercent}٪</span>
                      <span className="flex items-center gap-1.5"><EyeIcon size={13} className="text-pulse-600" /> {t("takers")}: {takers}</span>
                      {exam.negativeMarking && <span className="font-bold text-blood-700">−{exam.deduction} {t("wrong_only")}</span>}
                      {exam.shuffleQuestions && <span className="flex items-center gap-1.5"><RefreshIcon size={13} className="text-amberx-600" /> {t("shuffle_q").split(" ").slice(0, 2).join(" ")}</span>}
                      {exam.shuffleOptions && <span className="flex items-center gap-1.5"><RefreshIcon size={13} className="text-amberx-600" /> {t("shuffle_o").split(" ").slice(0, 2).join(" ")}</span>}
                      {exam.allowSaveResume && <span className="flex items-center gap-1.5"><SaveIcon size={13} className="text-amberx-600" /> {t("save_exit")}</span>}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
                      {exam.questionTypes.map((qt) => <TypeBadge key={qt} type={qt} />)}
                    </div>

                    <div className="mt-auto flex gap-2 pt-4">
                      <button onClick={() => setDraft({ ...exam, title: { ...exam.title }, description: { ...exam.description }, subjectIds: [...exam.subjectIds], questionIds: [...exam.questionIds], questionTypes: [...exam.questionTypes] })} className="btn-ghost flex-1">
                        <EditIcon size={15} /> {t("edit")}
                      </button>
                      <button
                        onClick={() => onSave({ ...exam, id: uid("ex-"), title: { ar: exam.title.ar + " (2)", en: exam.title.en + " (2)" }, createdAt: Date.now() })}
                        className="btn-ghost"
                        title={t("duplicate")}
                      >
                        <PlusIcon size={15} />
                      </button>
                      <button onClick={() => setToDelete(exam)} className="rounded-lg border border-line bg-white p-2.5 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600" aria-label={t("delete")}>
                        <TrashIcon size={15} />
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] text-ink-soft/70">{formatDate(exam.createdAt, lang)}</p>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3 className="font-display text-xl font-bold">{t("confirm_delete_exam")}</h3>
        <p className="mt-2 text-sm text-ink-soft">{toDelete && bi(toDelete.title)}</p>
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

/* ═══════════ نموذج الاختبار ═══════════ */

function ExamForm({
  initial,
  questions,
  onSave,
  onCancel,
}: {
  initial: ExamDef;
  questions: Question[];
  onSave: (e: ExamDef) => void;
  onCancel: () => void;
}) {
  const { t, bi } = useI18n();
  const [d, setD] = useState<ExamDef>(initial);
  const [pickMode, setPickMode] = useState<"auto" | "manual">(initial.questionIds.length > 0 ? "manual" : "auto");
  const [qSearch, setQSearch] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof ExamDef>(k: K, v: ExamDef[K]) => setD((p) => ({ ...p, [k]: v }));

  const pool = useMemo(
    () =>
      questions.filter(
        (q) =>
          (d.subjectIds.length === 0 || d.subjectIds.includes(q.subject)) &&
          (pickMode === "manual" || d.questionTypes.includes(q.type)) &&
          (qSearch === "" ||
            q.text.ar.includes(qSearch) ||
            q.text.en.toLowerCase().includes(qSearch.toLowerCase()))
      ),
    [questions, d.subjectIds, d.questionTypes, pickMode, qSearch]
  );

  const valid =
    (d.title.ar.trim() !== "" || d.title.en.trim() !== "") &&
    (pickMode === "manual" ? d.questionIds.length > 0 : d.count > 0) &&
    d.passPercent >= 1 &&
    d.passPercent <= 100;

  const toggleSubject = (s: SubjectId) =>
    set("subjectIds", d.subjectIds.includes(s) ? d.subjectIds.filter((x) => x !== s) : [...d.subjectIds, s]);

  const toggleType = (qt: QType) =>
    set("questionTypes", d.questionTypes.includes(qt) ? d.questionTypes.filter((x) => x !== qt) : [...d.questionTypes, qt]);

  const toggleQ = (id: string) =>
    set("questionIds", d.questionIds.includes(id) ? d.questionIds.filter((x) => x !== id) : [...d.questionIds, id]);

  return (
    <div className="card anim-fade-up p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t("edit_exam")}</h2>
        <button onClick={onCancel} className="rounded-lg border border-line p-2 text-ink-soft hover:border-blood-600 hover:text-blood-600" aria-label={t("cancel")}>
          <XIcon size={16} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="lbl">{t("exam_title_ar")}</label>
          <input className="input" value={d.title.ar} onChange={(e) => set("title", { ...d.title, ar: e.target.value })} />
        </div>
        <div>
          <label className="lbl">{t("exam_title_en")}</label>
          <input className="input" dir="ltr" value={d.title.en} onChange={(e) => set("title", { ...d.title, en: e.target.value })} />
        </div>
        <div>
          <label className="lbl">{t("desc_ar")}</label>
          <textarea className="input min-h-20" value={d.description.ar} onChange={(e) => set("description", { ...d.description, ar: e.target.value })} />
        </div>
        <div>
          <label className="lbl">{t("desc_en")}</label>
          <textarea className="input min-h-20" dir="ltr" value={d.description.en} onChange={(e) => set("description", { ...d.description, en: e.target.value })} />
        </div>
      </div>

      {/* المقررات */}
      <div className="mt-5">
        <p className="lbl">{t("subjects_scope")}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => set("subjectIds", [])}
            className={"rounded-full px-3 py-1.5 text-xs font-bold transition-colors " + (d.subjectIds.length === 0 ? "bg-pine-900 text-pulse-300" : "bg-paper text-ink-soft hover:bg-paper-deep")}
          >
            {t("all_subjects")}
          </button>
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSubject(s.id)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
              style={
                d.subjectIds.includes(s.id)
                  ? { backgroundColor: s.color, color: "#fff" }
                  : { backgroundColor: s.color + "14", color: s.color }
              }
            >
              {bi(s.name)}
            </button>
          ))}
        </div>
      </div>

      {/* اختيار الأسئلة */}
      <div className="mt-5 rounded-xl border border-line bg-paper/50 p-4">
        <p className="lbl">{t("pick_mode")}</p>
        <div className="grid gap-1 rounded-xl bg-white p-1 sm:grid-cols-2">
          {(["auto", "manual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPickMode(m)}
              className={"rounded-lg py-2 text-sm font-bold transition-all " + (pickMode === m ? "bg-pine-900 text-pulse-300 shadow" : "text-ink-soft hover:text-ink")}
            >
              {t(m === "auto" ? "auto_pick" : "manual_pick")}
            </button>
          ))}
        </div>

        {pickMode === "auto" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="lbl">{t("n_questions")} — {t("pool_available")}: {pool.length}</label>
              <input
                className="input"
                type="number"
                min={1}
                max={Math.max(1, pool.length)}
                value={d.count}
                onChange={(e) => set("count", Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div>
              <p className="lbl">{t("types_filter")}</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map((qt) => (
                  <button
                    key={qt}
                    onClick={() => toggleType(qt)}
                    className={
                      "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all " +
                      (d.questionTypes.includes(qt) ? "border-pulse-600 bg-pulse-100 text-pulse-700" : "border-line bg-white text-ink-soft")
                    }
                  >
                    {t({ mcq: "type_mcq", tf: "type_tf", fill: "type_fill", case: "type_case" }[qt])}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="relative">
              <SearchIcon size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
              <input className="input ps-9" placeholder={t("search")} value={qSearch} onChange={(e) => setQSearch(e.target.value)} />
            </div>
            <p className="mt-2 text-xs font-bold text-pulse-700">
              {t("selected_n")}: {d.questionIds.length}
            </p>
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-line bg-white p-2">
              {pool.map((q) => {
                const on = d.questionIds.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleQ(q.id)}
                    className={
                      "flex w-full items-center gap-2.5 rounded-lg border p-2 text-start text-xs transition-all " +
                      (on ? "border-pulse-600 bg-pulse-100" : "border-transparent hover:bg-paper")
                    }
                  >
                    <span className={"grid h-5 w-5 shrink-0 place-items-center rounded border " + (on ? "border-pulse-600 bg-pulse-600 text-white" : "border-line bg-white")}>
                      {on && <CheckIcon size={11} />}
                    </span>
                    <SubjectTag id={q.subject} small />
                    <span className="min-w-0 flex-1 truncate font-medium">{bi(q.text)}</span>
                  </button>
                );
              })}
              {pool.length === 0 && <p className="p-3 text-center text-xs text-ink-soft">{t("no_items_filter")}</p>}
            </div>
          </div>
        )}
      </div>

      {/* الإعدادات */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="lbl">{t("time_minutes")}</label>
          <input className="input" type="number" min={0} value={d.minutes} onChange={(e) => set("minutes", Math.max(0, Number(e.target.value) || 0))} />
        </div>
        <div>
          <label className="lbl">{t("pass_percent")}</label>
          <input className="input" type="number" min={1} max={100} value={d.passPercent} onChange={(e) => set("passPercent", Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
        </div>
        <div>
          <label className="lbl">{t("deduction_val")}</label>
          <input className="input" type="number" min={0} max={1} step={0.05} disabled={!d.negativeMarking} value={d.deduction} onChange={(e) => set("deduction", Math.min(1, Math.max(0, Number(e.target.value) || 0)))} />
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <Toggle checked={d.negativeMarking} onChange={(v) => set("negativeMarking", v)} label={t("neg_marking")} />
        <Toggle checked={d.shuffleQuestions} onChange={(v) => set("shuffleQuestions", v)} label={t("shuffle_q")} />
        <Toggle checked={d.shuffleOptions} onChange={(v) => set("shuffleOptions", v)} label={t("shuffle_o")} />
        <Toggle checked={d.allowSaveResume} onChange={(v) => set("allowSaveResume", v)} label={t("allow_resume")} />
        <Toggle checked={d.published} onChange={(v) => set("published", v)} label={t("publish")} />
      </div>

      {err && <p className="anim-pop mt-4 rounded-lg bg-blood-100 px-3 py-2 text-sm font-bold text-blood-700">{err}</p>}

      <div className="mt-6 flex gap-3">
        <button onClick={onCancel} className="btn-ghost flex-1">{t("cancel")}</button>
        <button
          onClick={() => {
            if (!valid) {
              setErr(t("required_fields"));
              return;
            }
            onSave({ ...d, questionIds: pickMode === "manual" ? d.questionIds : [], count: pickMode === "auto" ? d.count : d.questionIds.length });
          }}
          className="btn-primary flex-1"
        >
          <SaveIcon size={16} /> {t("save")}
        </button>
      </div>
    </div>
  );
}
