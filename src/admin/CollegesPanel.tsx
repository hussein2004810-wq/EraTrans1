import { useMemo, useState } from "react";
import type { CustomCollege, CustomDept, CustomUniversity } from "../types";
import { useI18n } from "../i18n";
import { uid } from "../lib/store";
import { allColleges, allUniversities, findCollege } from "../data/hierarchy";
import { EmptyState, Modal } from "../components/ui";
import {
  CheckIcon, EditIcon, GradCapIcon, LayersIcon, PlusIcon, TrashIcon, UsersIcon, XIcon,
} from "../components/icons";

interface Props {
  customUniversities: CustomUniversity[];
  customColleges: CustomCollege[];
  customDepts: CustomDept[];
  onAddUniversity: (u: CustomUniversity) => void;
  onDeleteUniversity: (id: string) => void;
  onSaveCollege: (c: CustomCollege, isNew: boolean) => void;
  onDeleteCollege: (id: string) => void;
  onSaveDept: (d: CustomDept, isNew: boolean) => void;
  onDeleteDept: (id: string) => void;
}

type DraftCollege = { id: string; nameAr: string; nameEn: string; maxYears: number; isNew: boolean };
type DraftDept = { id: string; collegeId: string; nameAr: string; nameEn: string; isNew: boolean };

/** لوحة المالك لتحرير الجامعات والكليات والأقسام — تظهر في التسلسل فورًا */
export default function CollegesPanel(props: Props) {
  const { t, bi } = useI18n();
  const [uniOpen, setUniOpen] = useState(false);
  const [uniName, setUniName] = useState({ ar: "", en: "" });
  const [uniColleges, setUniColleges] = useState<string[]>(["medicine"]);

  const [colDraft, setColDraft] = useState<DraftCollege | null>(null);
  const [deptDraft, setDeptDraft] = useState<DraftDept | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "uni" | "college" | "dept"; id: string; label: string } | null>(null);

  const colleges = useMemo(() => allColleges(), []);
  const universities = useMemo(() => allUniversities(), []);

  const toggleUniCollege = (id: string) =>
    setUniColleges((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const saveUniversity = () => {
    if (!uniName.ar.trim() || !uniName.en.trim() || uniColleges.length === 0) return;
    props.onAddUniversity({
      id: uid("uni-"),
      name: { ar: uniName.ar.trim(), en: uniName.en.trim() },
      collegeIds: uniColleges,
      custom: true,
      createdAt: Date.now(),
    });
    setUniOpen(false);
    setUniName({ ar: "", en: "" });
    setUniColleges(["medicine"]);
  };

  const saveCollege = () => {
    if (!colDraft || !colDraft.nameAr.trim() || !colDraft.nameEn.trim()) return;
    props.onSaveCollege(
      {
        id: colDraft.id,
        name: { ar: colDraft.nameAr.trim(), en: colDraft.nameEn.trim() },
        maxYears: colDraft.maxYears,
        custom: true,
        createdAt: Date.now(),
      },
      colDraft.isNew
    );
    setColDraft(null);
  };

  const saveDept = () => {
    if (!deptDraft || !deptDraft.collegeId || !deptDraft.nameAr.trim() || !deptDraft.nameEn.trim()) return;
    props.onSaveDept(
      {
        id: deptDraft.id,
        collegeId: deptDraft.collegeId,
        name: { ar: deptDraft.nameAr.trim(), en: deptDraft.nameEn.trim() },
        custom: true,
        createdAt: Date.now(),
      },
      deptDraft.isNew
    );
    setDeptDraft(null);
  };

  const doDelete = () => {
    if (!confirm) return;
    if (confirm.kind === "uni") props.onDeleteUniversity(confirm.id);
    else if (confirm.kind === "college") props.onDeleteCollege(confirm.id);
    else props.onDeleteDept(confirm.id);
    setConfirm(null);
  };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <GradCapIcon size={20} className="text-pulse-600" />
          <h2 className="font-display text-xl font-bold">{t("colleges_tab")}</h2>
          <button
            onClick={() => setUniOpen(true)}
            className="btn-primary ms-auto inline-flex items-center gap-1.5"
          >
            <PlusIcon size={15} /> {t("add_university")}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">{t("colleges_hint")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setColDraft({ id: uid("col-"), nameAr: "", nameEn: "", maxYears: 4, isNew: true })}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-pulse-500/50 px-3.5 py-2 text-sm font-bold text-pulse-700 transition-colors hover:bg-pulse-100/50"
          >
            <PlusIcon size={14} /> {t("add_college")}
          </button>
          <button
            onClick={() => setDeptDraft({ id: uid("dep-"), collegeId: colleges[0]?.id ?? "", nameAr: "", nameEn: "", isNew: true })}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-amberx-500/50 px-3.5 py-2 text-sm font-bold text-amberx-600 transition-colors hover:bg-amberx-100/50"
          >
            <PlusIcon size={14} /> {t("add_dept")}
          </button>
        </div>
      </div>

      {/* الجامعات */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-paper/50 px-5 py-3">
          <GradCapIcon size={17} className="text-pulse-600" />
          <h3 className="font-display text-sm font-bold text-ink-soft">{t("university_col")} ({universities.length})</h3>
        </div>
        <ul className="divide-y divide-line">
          {universities.map((u) => {
            const isCustom = props.customUniversities.some((c) => c.id === u.id);
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-2 px-5 py-3 transition-colors hover:bg-pulse-100/20">
                <span className="font-semibold">{bi(u.name)}</span>
                {isCustom && (
                  <span className="rounded-full bg-amberx-100 px-2 py-0.5 text-[10px] font-bold text-amberx-600">{t("custom_badge")}</span>
                )}
                <span className="text-xs text-ink-soft">{u.collegeIds.length} {t("colleges_in_uni")}</span>
                {isCustom && (
                  <button
                    onClick={() => setConfirm({ kind: "uni", id: u.id, label: bi(u.name) })}
                    className="ms-auto rounded-lg border border-line p-1.5 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
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

      {/* الكليات */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-paper/50 px-5 py-3">
          <LayersIcon size={17} className="text-pulse-600" />
          <h3 className="font-display text-sm font-bold text-ink-soft">{t("college")} ({colleges.length})</h3>
        </div>
        {colleges.length === 0 ? (
          <div className="p-6"><EmptyState icon={<LayersIcon size={20} />} text={t("no_options")} /></div>
        ) : (
          <ul className="divide-y divide-line">
            {colleges.map((c) => {
              const isCustom = props.customColleges.some((x) => x.id === c.id);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-2 px-5 py-3 transition-colors hover:bg-pulse-100/20">
                  <span className="font-semibold">{bi(c.name)}</span>
                  {isCustom && (
                    <span className="rounded-full bg-amberx-100 px-2 py-0.5 text-[10px] font-bold text-amberx-600">{t("custom_college")}</span>
                  )}
                  <span className="text-xs text-ink-soft">{c.maxYears} {t("college_years")} · {c.depts.length} {t("depts_in_college")}</span>
                  {isCustom && (
                    <span className="ms-auto flex gap-1.5">
                      <button
                        onClick={() =>
                          setColDraft({ id: c.id, nameAr: c.name.ar, nameEn: c.name.en, maxYears: c.maxYears, isNew: false })
                        }
                        className="rounded-lg border border-line p-1.5 text-ink-soft transition-colors hover:border-pulse-500 hover:text-pulse-700"
                        aria-label={t("edit_college")}
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        onClick={() => setConfirm({ kind: "college", id: c.id, label: bi(c.name) })}
                        className="rounded-lg border border-line p-1.5 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
                        aria-label={t("delete")}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* الأقسام المخصصة */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-paper/50 px-5 py-3">
          <UsersIcon size={17} className="text-pulse-600" />
          <h3 className="font-display text-sm font-bold text-ink-soft">{t("custom_dept")} ({props.customDepts.length})</h3>
        </div>
        {props.customDepts.length === 0 ? (
          <div className="p-6"><EmptyState icon={<UsersIcon size={20} />} text={t("no_options")} /></div>
        ) : (
          <ul className="divide-y divide-line">
            {props.customDepts.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 px-5 py-3 transition-colors hover:bg-pulse-100/20">
                <span className="font-semibold">{bi(d.name)}</span>
                <span className="text-xs text-ink-soft">← {bi(findCollege(d.collegeId)?.name ?? { ar: "", en: "" })}</span>
                <span className="ms-auto flex gap-1.5">
                  <button
                    onClick={() =>
                      setDeptDraft({ id: d.id, collegeId: d.collegeId, nameAr: d.name.ar, nameEn: d.name.en, isNew: false })
                    }
                    className="rounded-lg border border-line p-1.5 text-ink-soft transition-colors hover:border-pulse-500 hover:text-pulse-700"
                    aria-label={t("edit_dept")}
                  >
                    <EditIcon size={14} />
                  </button>
                  <button
                    onClick={() => setConfirm({ kind: "dept", id: d.id, label: bi(d.name) })}
                    className="rounded-lg border border-line p-1.5 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
                    aria-label={t("delete")}
                  >
                    <TrashIcon size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* نافذة إضافة جامعة */}
      <Modal open={uniOpen} onClose={() => setUniOpen(false)}>
        <h3 className="font-display text-xl font-bold">{t("add_university")}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="lbl">{t("uni_name_ar")}</label>
            <input className="input" value={uniName.ar} onChange={(e) => setUniName({ ...uniName, ar: e.target.value })} />
          </div>
          <div>
            <label className="lbl">{t("uni_name_en")}</label>
            <input className="input" dir="ltr" value={uniName.en} onChange={(e) => setUniName({ ...uniName, en: e.target.value })} />
          </div>
          <div>
            <label className="lbl">{t("uni_colleges")}</label>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-line p-2.5">
              {colleges.map((c) => {
                const on = uniColleges.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleUniCollege(c.id)}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-bold transition-all " +
                      (on ? "bg-pulse-600 text-white shadow" : "border border-line bg-white text-ink-soft hover:border-pulse-500")
                    }
                  >
                    {on && <CheckIcon size={11} className="me-1 inline" />}{bi(c.name)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setUniOpen(false)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button onClick={saveUniversity} className="btn-primary flex-1"><CheckIcon size={15} /> {t("save")}</button>
        </div>
      </Modal>

      {/* نافذة كلية */}
      <Modal open={!!colDraft} onClose={() => setColDraft(null)}>
        <h3 className="font-display text-xl font-bold">{colDraft?.isNew ? t("add_college") : t("edit_college")}</h3>
        {colDraft && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="lbl">{t("college_name_ar")}</label>
              <input className="input" value={colDraft.nameAr} onChange={(e) => setColDraft({ ...colDraft, nameAr: e.target.value })} />
            </div>
            <div>
              <label className="lbl">{t("college_name_en")}</label>
              <input className="input" dir="ltr" value={colDraft.nameEn} onChange={(e) => setColDraft({ ...colDraft, nameEn: e.target.value })} />
            </div>
            <div>
              <label className="lbl">{t("college_years")}</label>
              <select
                className="input"
                value={colDraft.maxYears}
                onChange={(e) => setColDraft({ ...colDraft, maxYears: Number(e.target.value) })}
              >
                {[3, 4, 5, 6].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <button onClick={() => setColDraft(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button onClick={saveCollege} className="btn-primary flex-1"><CheckIcon size={15} /> {t("save")}</button>
        </div>
      </Modal>

      {/* نافذة قسم */}
      <Modal open={!!deptDraft} onClose={() => setDeptDraft(null)}>
        <h3 className="font-display text-xl font-bold">{deptDraft?.isNew ? t("add_dept") : t("edit_dept")}</h3>
        {deptDraft && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="lbl">{t("dept_belongs")}</label>
              <select className="input" value={deptDraft.collegeId} onChange={(e) => setDeptDraft({ ...deptDraft, collegeId: e.target.value })}>
                {colleges.map((c) => <option key={c.id} value={c.id}>{bi(c.name)}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">{t("dept_name_ar")}</label>
              <input className="input" value={deptDraft.nameAr} onChange={(e) => setDeptDraft({ ...deptDraft, nameAr: e.target.value })} />
            </div>
            <div>
              <label className="lbl">{t("dept_name_en")}</label>
              <input className="input" dir="ltr" value={deptDraft.nameEn} onChange={(e) => setDeptDraft({ ...deptDraft, nameEn: e.target.value })} />
            </div>
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <button onClick={() => setDeptDraft(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button onClick={saveDept} className="btn-primary flex-1"><CheckIcon size={15} /> {t("save")}</button>
        </div>
      </Modal>

      {/* تأكيد الحذف */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)}>
        <h3 className="font-display text-xl font-bold">{t("confirm_delete_q")}</h3>
        <p className="mt-2 text-sm text-ink-soft">{confirm?.label}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setConfirm(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button onClick={doDelete} className="flex-1 rounded-lg bg-blood-600 px-4 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-blood-700">
            <TrashIcon size={15} className="me-1.5 inline" />{t("delete")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
