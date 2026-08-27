import { useMemo, useState } from "react";
import type { Account, Vignette, VignetteAuditEntry } from "../types";
import { useI18n } from "../i18n";
import { uid } from "../lib/store";
import EcgLine from "../components/EcgLine";
import { EmptyState, Modal, formatDate } from "../components/ui";
import {
  CheckIcon, CrownIcon, EditIcon, EyeIcon, PlusIcon, StethoIcon, TrashIcon, XIcon,
} from "../components/icons";

const VA_LABEL: Record<VignetteAuditEntry["action"], string> = {
  create: "va_create",
  update: "va_update",
  delete: "va_delete",
  publish: "va_publish",
  unpublish: "va_unpublish",
};
const VA_TONE: Record<VignetteAuditEntry["action"], string> = {
  create: "bg-moss-100 text-moss-700",
  update: "bg-amberx-100 text-amberx-600",
  delete: "bg-blood-100 text-blood-700",
  publish: "bg-pulse-100 text-pulse-700",
  unpublish: "bg-paper-deep text-ink-soft",
};

interface Props {
  user: Account;
  vignettes: Vignette[];
  vignetteAudit: VignetteAuditEntry[];
  onSaveVignette: (v: Vignette, isNew: boolean) => void;
  onDeleteVignette: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
}

/**
 * قسم اللمحات السريرية — يراه المالك ومن يمنحه صلاحية vignettes.
 * التحرير متاح للممنوحين، أما النشر للطلبة فقرار المالك وحده.
 * يحوي سجل تعديل مستقلًا خاصًا به، منفصلًا عن سجل التدقيق العام.
 */
export default function VignettesPanel({
  user,
  vignettes,
  vignetteAudit,
  onSaveVignette,
  onDeleteVignette,
  onTogglePublish,
}: Props) {
  const { t, bi, lang } = useI18n();
  const isOwner = user.role === "owner";

  const [editing, setEditing] = useState<Vignette | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toDelete, setToDelete] = useState<Vignette | null>(null);
  const [saved, setSaved] = useState(false);

  const publishedCount = useMemo(() => vignettes.filter((v) => v.published).length, [vignettes]);

  const startNew = () => {
    setIsNew(true);
    setEditing({
      id: uid("vig-"),
      text: { ar: "", en: "" },
      published: false,
      authorEmail: user.email,
      authorName: user.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const startEdit = (v: Vignette) => {
    setIsNew(false);
    setEditing({ ...v, text: { ...v.text } });
  };

  const saveEditing = () => {
    if (!editing) return;
    if (editing.text.ar.trim() === "" && editing.text.en.trim() === "") return;
    onSaveVignette({ ...editing, updatedAt: Date.now() }, isNew);
    setEditing(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* ───── الترويسة ───── */}
      <div className="monitor-band relative overflow-hidden rounded-xl border border-pine-700 text-paper shadow-lg shadow-pine-950/20">
        <div className="relative z-10 flex flex-wrap items-center gap-3 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-pulse-600/20 text-pulse-300">
            <StethoIcon size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold">{t("vignettes_tab")}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-pulse-300/75">
              {t("vignettes_hint")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-pulse-500/40 bg-pulse-500/10 px-3 py-1 text-xs font-bold text-pulse-300">
              {publishedCount} {t("vignette_published_count")}
            </span>
            <button onClick={startNew} className="btn-primary">
              <PlusIcon size={15} /> {t("vignette_new")}
            </button>
          </div>
        </div>
        <EcgLine className="relative z-10 h-12 w-full text-pulse-300/70" speed={7} />
      </div>

      {saved && (
        <p className="anim-pop inline-flex items-center gap-1.5 rounded-lg bg-moss-100 px-3.5 py-2 text-sm font-bold text-moss-700">
          <CheckIcon size={15} /> {t("vignette_saved")}
        </p>
      )}

      {/* ───── قائمة اللمحات ───── */}
      {vignettes.length === 0 ? (
        <div className="card p-8">
          <EmptyState icon={<StethoIcon size={24} />} text={t("vignette_empty")} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {vignettes.map((v) => (
            <article
              key={v.id}
              className={
                "card anim-fade-up relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg " +
                (v.published ? "border-pulse-500/50" : "")
              }
            >
              <div
                className={
                  "absolute inset-y-0 start-0 w-1.5 " +
                  (v.published ? "bg-pulse-500" : "bg-line")
                }
              />
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-relaxed text-ink">
                  {lang === "ar" ? v.text.ar || v.text.en : v.text.en || v.text.ar}
                </p>
                <span
                  className={
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold " +
                    (v.published ? "bg-pulse-100 text-pulse-700" : "bg-paper-deep text-ink-soft")
                  }
                >
                  {v.published ? <EyeIcon size={12} /> : <XIcon size={12} />}
                  {v.published ? t("vignette_published") : t("vignette_hidden")}
                </span>
              </div>

              <p className="mt-3 text-[11px] text-ink-soft">
                {t("vignette_author")}: <b className="text-ink-soft">{v.authorName}</b> · {formatDate(v.updatedAt, lang)}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isOwner ? (
                  <button
                    onClick={() => onTogglePublish(v.id, !v.published)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 " +
                      (v.published
                        ? "border border-line bg-white text-ink-soft hover:border-amberx-500 hover:text-amberx-600"
                        : "bg-pulse-600 text-white shadow-sm hover:bg-pulse-500")
                    }
                  >
                    {v.published ? <XIcon size={13} /> : <CheckIcon size={13} />}
                    {v.published ? t("vignette_unpublish") : t("vignette_publish")}
                  </button>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amberx-500/40 bg-amberx-100/50 px-3 py-2 text-[11px] font-bold text-amberx-600"
                    title={t("vignette_owner_only_publish")}
                  >
                    <CrownIcon size={13} /> {t("vignette_owner_only_publish")}
                  </span>
                )}
                <button onClick={() => startEdit(v)} className="btn-ghost">
                  <EditIcon size={14} /> {t("edit")}
                </button>
                <button
                  onClick={() => setToDelete(v)}
                  className="rounded-lg border border-line bg-white p-2 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
                  aria-label={t("delete")}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ───── سجل تعديل اللمحات (مستقل) ───── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <EditIcon size={18} className="text-amberx-600" />
          <h3 className="font-display text-lg font-bold">{t("vignette_log")}</h3>
        </div>
        <p className="border-b border-line bg-amberx-100/40 px-5 py-2.5 text-xs leading-relaxed text-amberx-600">
          {t("vignette_log_hint")}
        </p>
        {vignetteAudit.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-ink-soft">{t("audit_empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper/70 text-xs text-ink-soft">
                  <th className="px-5 py-2.5 text-start font-bold">{t("time_col")}</th>
                  <th className="px-3 py-2.5 text-start font-bold">{t("actor_col")}</th>
                  <th className="px-3 py-2.5 text-start font-bold">{t("action_col")}</th>
                  <th className="px-5 py-2.5 text-start font-bold">{t("target_col")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {vignetteAudit.slice(0, 40).map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-pulse-100/25">
                    <td className="whitespace-nowrap px-5 py-2.5 text-xs text-ink-soft">{formatDate(e.date, lang)}</td>
                    <td className="px-3 py-2.5 font-semibold">{e.actorName}</td>
                    <td className="px-3 py-2.5">
                      <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + VA_TONE[e.action]}>
                        {t(VA_LABEL[e.action])}
                      </span>
                    </td>
                    <td className="max-w-72 truncate px-5 py-2.5 text-xs text-ink-soft">{e.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───── محرر اللمحة ───── */}
      <Modal open={!!editing} onClose={() => setEditing(null)} wide>
        {editing && (
          <div>
            <h3 className="font-display text-xl font-bold">
              {isNew ? t("vignette_new") : t("edit")}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="lbl">{t("vignette_text_ar")}</label>
                <textarea
                  className="input min-h-24"
                  value={editing.text.ar}
                  onChange={(e) => setEditing({ ...editing, text: { ...editing.text, ar: e.target.value } })}
                />
              </div>
              <div>
                <label className="lbl">{t("vignette_text_en")}</label>
                <textarea
                  className="input min-h-24"
                  dir="ltr"
                  value={editing.text.en}
                  onChange={(e) => setEditing({ ...editing, text: { ...editing.text, en: e.target.value } })}
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-ghost flex-1">
                {t("cancel")}
              </button>
              <button
                onClick={saveEditing}
                disabled={editing.text.ar.trim() === "" && editing.text.en.trim() === ""}
                className="btn-primary flex-1"
              >
                <CheckIcon size={15} /> {t("save")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ───── تأكيد الحذف ───── */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3 className="font-display text-xl font-bold">{t("vignette_confirm_delete")}</h3>
        {toDelete && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {lang === "ar" ? toDelete.text.ar || toDelete.text.en : toDelete.text.en || toDelete.text.ar}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button onClick={() => setToDelete(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button
            onClick={() => {
              if (toDelete) onDeleteVignette(toDelete.id);
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
