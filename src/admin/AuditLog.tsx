import { useMemo, useState } from "react";
import type { AuditEntry } from "../types";
import { useI18n } from "../i18n";
import { EmptyState, formatDate } from "../components/ui";
import { CrownIcon, EyeIcon, SearchIcon } from "../components/icons";

const ACTION_TONE: Record<AuditEntry["action"], string> = {
  create: "bg-moss-100 text-moss-700",
  update: "bg-amberx-100 text-amberx-600",
  delete: "bg-blood-100 text-blood-700",
  import: "bg-pulse-100 text-pulse-700",
  grant: "bg-pine-900 text-pulse-300",
};

const ACTION_LABEL: Record<AuditEntry["action"], string> = {
  create: "act_create",
  update: "act_update",
  delete: "act_delete",
  import: "act_import",
  grant: "act_grant",
};

const TARGET_LABEL: Record<AuditEntry["target"], string> = {
  exam: "tgt_exam",
  question: "tgt_question",
  admin: "tgt_admin",
  student: "tgt_student",
};

/** سجل التدقيق — يراه المالك ومن مُنح صلاحية audit */
export default function AuditLog({ entries }: { entries: AuditEntry[] }) {
  const { t, lang } = useI18n();
  const [action, setAction] = useState<"all" | AuditEntry["action"]>("all");
  const [target, setTarget] = useState<"all" | AuditEntry["target"]>("all");
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      entries.filter(
        (e) =>
          (action === "all" || e.action === action) &&
          (target === "all" || e.target === target) &&
          (q.trim() === "" ||
            e.actorName.includes(q.trim()) ||
            e.title.includes(q.trim()) ||
            e.actorEmail.toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [entries, action, target, q]
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
        <EyeIcon size={20} className="text-amberx-600" />
        <h2 className="font-display text-xl font-bold">{t("audit_tab")}</h2>
        <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">{list.length}</span>
        <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-amberx-100 px-3 py-1 text-[11px] font-bold text-amberx-600">
          <CrownIcon size={12} /> {t("owner_role")}
        </span>
      </div>

      <p className="border-b border-line bg-paper/60 px-5 py-3 text-xs leading-relaxed text-ink-soft">
        {t("audit_hint")}
      </p>

      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/40 px-5 py-3">
        <div className="relative min-w-52 flex-1">
          <SearchIcon size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input className="input ps-9" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={action} onChange={(e) => setAction(e.target.value as typeof action)}>
          <option value="all">{t("action_col")}: {t("all")}</option>
          {(Object.keys(ACTION_LABEL) as AuditEntry["action"][]).map((a) => (
            <option key={a} value={a}>{t(ACTION_LABEL[a])}</option>
          ))}
        </select>
        <select className="input w-auto" value={target} onChange={(e) => setTarget(e.target.value as typeof target)}>
          <option value="all">{t("target_col")}: {t("all")}</option>
          {(Object.keys(TARGET_LABEL) as AuditEntry["target"][]).map((x) => (
            <option key={x} value={x}>{t(TARGET_LABEL[x])}</option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="p-8"><EmptyState icon={<EyeIcon size={22} />} text={t("audit_empty")} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper/70 text-xs text-ink-soft">
                <th className="px-5 py-3 text-start font-bold">{t("time_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("actor_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("action_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("target_col")}</th>
                <th className="px-5 py-3 text-start font-bold">{t("details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, 60).map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-pulse-100/25">
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs text-ink-soft">{formatDate(e.date, lang)}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold">{e.actorName}</p>
                    <p className="text-[11px] text-ink-soft">
                      {e.actorRole === "owner" ? t("owner_role") : e.actorRole === "admin" ? t("admin_role") : t("student_account")}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + ACTION_TONE[e.action]}>
                      {t(ACTION_LABEL[e.action])}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-bold text-ink-soft">{t(TARGET_LABEL[e.target])}</span>
                    <p className="mt-0.5 max-w-52 truncate text-xs font-semibold">{e.title}</p>
                  </td>
                  <td className="max-w-64 truncate px-5 py-2.5 text-xs text-ink-soft">{e.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
