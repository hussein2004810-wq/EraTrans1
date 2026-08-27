import { useMemo, useState } from "react";
import type { CustomUniversity } from "../types";
import { useI18n } from "../i18n";
import { uid } from "../lib/store";
import { COLLEGES, allUniversities } from "../data/hierarchy";
import { formatDate } from "../components/ui";
import { CheckIcon, GradCapIcon, InfoIcon, PlusIcon, TrashIcon, XIcon } from "../components/icons";

interface Props {
  customUniversities: CustomUniversity[];
  onAdd: (u: CustomUniversity) => void;
  onDelete: (id: string) => void;
}

/** إدارة الجامعات — يضيف المالك (أو من مُنح صلاحية الجامعات) جامعات جديدة يدويًا */
export default function UniversitiesPanel({ customUniversities, onAdd, onDelete }: Props) {
  const { t, bi, lang } = useI18n();
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [colleges, setColleges] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [toDelete, setToDelete] = useState<CustomUniversity | null>(null);

  const all = useMemo(() => allUniversities(), [customUniversities.length]);
  const customIds = useMemo(() => new Set(customUniversities.map((c) => c.id)), [customUniversities]);

  const toggleCollege = (id: string) =>
    setColleges((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const add = () => {
    setErr(null);
    if (!nameAr.trim() || !nameEn.trim() || colleges.length === 0) return setErr(t("uni_required"));
    const exists = all.some(
      (u) =>
        u.name.ar === nameAr.trim() ||
        u.name.en.toLowerCase() === nameEn.trim().toLowerCase()
    );
    if (exists) return setErr(t("uni_exists"));
    onAdd({
      id: uid("uni-"),
      name: { ar: nameAr.trim(), en: nameEn.trim() },
      collegeIds: colleges,
      custom: true,
      createdAt: Date.now(),
    });
    setNameAr(""); setNameEn(""); setColleges([]);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* ── إضافة جامعة ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <GradCapIcon size={19} className="text-pulse-600" />
          <h2 className="font-display text-xl font-bold">{t("add_university")}</h2>
        </div>
        <p className="border-b border-line bg-paper/50 px-5 py-2.5 text-xs text-ink-soft">{t("universities_hint")}</p>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <label className="lbl">{t("uni_name_ar")} ★</label>
            <input className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="جامعة ..." />
          </div>
          <div>
            <label className="lbl">{t("uni_name_en")} ★</label>
            <input className="input" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="University of ..." />
          </div>
        </div>

        <div className="px-5 pb-2">
          <p className="lbl mb-2">{t("uni_colleges")} ★</p>
          <div className="flex flex-wrap gap-2">
            {COLLEGES.map((c) => {
              const on = colleges.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCollege(c.id)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all duration-200 " +
                    (on
                      ? "border-pulse-600 bg-pulse-100 text-pulse-700"
                      : "border-line bg-white text-ink-soft hover:border-pulse-500/60")
                  }
                >
                  {on ? <CheckIcon size={12} /> : <XIcon size={12} className="opacity-40" />}
                  {bi(c.name)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <button onClick={add} className="btn-primary">
            <PlusIcon size={15} /> {t("add_university")}
          </button>
          {err && <span className="anim-pop text-xs font-bold text-blood-600">{err}</span>}
          {done && (
            <span className="anim-pop inline-flex items-center gap-1 text-xs font-bold text-moss-600">
              <CheckIcon size={13} /> {t("uni_created")}
            </span>
          )}
        </div>
      </div>

      {/* ── قائمة الجامعات ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <GradCapIcon size={19} className="text-pulse-600" />
          <h2 className="font-display text-xl font-bold">{t("universities_tab")}</h2>
          <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">
            {all.length} {t("n_unis")}
          </span>
        </div>
        <ul className="divide-y divide-line">
          {all.map((u) => {
            const isCustom = customIds.has(u.id);
            const custom = customUniversities.find((c) => c.id === u.id);
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-pulse-100/25">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-pine-900 text-pulse-300">
                  <GradCapIcon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {bi(u.name)}
                    {isCustom && (
                      <span className="rounded-full bg-amberx-100 px-2 py-0.5 text-[10px] font-bold text-amberx-600">
                        {t("custom_badge")}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {u.collegeIds.length} {t("uni_colleges")}
                    {custom && ` · ${formatDate(custom.createdAt, lang)}`}
                  </p>
                </div>
                {isCustom && (
                  <button
                    onClick={() => setToDelete(custom!)}
                    className="rounded-lg border border-line bg-white p-2 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
                    aria-label={t("delete")}
                  >
                    <TrashIcon size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-paper/60 px-4 py-3 text-xs leading-relaxed text-ink-soft">
        <InfoIcon size={15} className="mt-0.5 shrink-0 text-pulse-600" />
        <p>{t("universities_hint")}</p>
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine-950/65 backdrop-blur-[2px]" onClick={() => setToDelete(null)} aria-hidden />
          <div className="card anim-pop relative w-full max-w-md p-6">
            <h3 className="font-display text-xl font-bold">{t("confirm_delete_q")}</h3>
            <p className="mt-2 text-sm text-ink-soft">{bi(toDelete.name)}</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setToDelete(null)} className="btn-ghost flex-1">{t("cancel")}</button>
              <button
                onClick={() => {
                  onDelete(toDelete.id);
                  setToDelete(null);
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blood-600 px-4 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-blood-700"
              >
                <TrashIcon size={15} /> {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
