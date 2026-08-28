import { useMemo, useState } from "react";
import type { Account } from "../types";
import { useI18n } from "../i18n";
import { findCollege, findDeptInUniversity, findUniversity } from "../data/hierarchy";
import { formatDate } from "../components/ui";
import { CrownIcon, EyeIcon, GradCapIcon, KeyIcon, SearchIcon, ShieldIcon, StethoIcon, UserIcon, XIcon } from "../components/icons";

const ROLE_META: Record<Account["role"], { icon: React.ReactNode; label: string; cls: string }> = {
  owner: { icon: <CrownIcon size={12} />, label: "owner_role", cls: "bg-amberx-100 text-amberx-600" },
  admin: { icon: <ShieldIcon size={12} />, label: "admin_role", cls: "bg-pulse-100 text-pulse-700" },
  student: { icon: <GradCapIcon size={12} />, label: "student_account", cls: "bg-paper-deep text-ink-soft" },
};

const TITLE_LABEL: Record<string, string> = {
  head: "role_head",
  coordinator: "role_coordinator",
  doctor: "role_doctor",
  professor: "role_professor",
  platform: "role_platform",
};

/** سجل الحسابات وبيانات الدخول — يراه المالك ومن مُنح صلاحية accountsLog */
export default function AccountsLog({ accounts }: { accounts: Account[] }) {
  const { t, bi, lang } = useI18n();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | Account["role"]>("all");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    const text = q.trim().toLowerCase();
    return accounts
      .filter((a) => role === "all" || a.role === role)
      .filter(
        (a) =>
          !text ||
          a.name.toLowerCase().includes(text) ||
          a.email.toLowerCase().includes(text) ||
          bi(findUniversity(a.university ?? a.scopeUniversity)?.name ?? { ar: "", en: "" }).toLowerCase().includes(text)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [accounts, q, role, bi]);

  const toggleReveal = (email: string) =>
    setRevealed((prev) => {
      const n = new Set(prev);
      if (n.has(email)) n.delete(email);
      else n.add(email);
      return n;
    });

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
        <KeyIcon size={20} className="text-amberx-600" />
        <h2 className="font-display text-xl font-bold">{t("accounts_log_tab")}</h2>
        <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">
          {list.length} {t("account_count")}
        </span>
        <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-amberx-100 px-3 py-1 text-[11px] font-bold text-amberx-600">
          <CrownIcon size={12} /> {t("owner_role")}
        </span>
      </div>

      <p className="border-b border-line bg-amberx-100/50 px-5 py-3 text-xs leading-relaxed text-amberx-600">
        {t("accounts_log_hint")} <b>{t("accounts_log_note")}</b>
      </p>

      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/40 px-5 py-3">
        <div className="relative min-w-52 flex-1">
          <SearchIcon size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input className="input ps-9" placeholder={t("search_any")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
          <option value="all">{t("all")}</option>
          <option value="owner">{t("owner_role")}</option>
          <option value="admin">{t("admin_role")}</option>
          <option value="student">{t("student_account")}</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-paper/70 text-xs text-ink-soft">
              <th className="px-5 py-3 text-start font-bold">{t("full_name")}</th>
              <th className="px-3 py-3 text-start font-bold">{t("email")}</th>
              <th className="px-3 py-3 text-start font-bold">{t("col_password")}</th>
              <th className="px-3 py-3 text-start font-bold">{t("role")}</th>
              <th className="px-3 py-3 text-start font-bold">{t("university_col")}</th>
              <th className="px-3 py-3 text-start font-bold">{t("department_col")}</th>
              <th className="px-5 py-3 text-start font-bold">{t("registered_col")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((a) => {
              const meta = ROLE_META[a.role];
              const isRevealed = revealed.has(a.email);
              const uniName = findUniversity(a.university ?? a.scopeUniversity)?.name;
              const deptName = findDeptInUniversity(a.university ?? a.scopeUniversity, a.department ?? a.scopeDept)?.dept.name;
              return (
                <tr key={a.email} className="transition-colors hover:bg-pulse-100/25">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-pine-900 text-[11px] font-bold text-pulse-300">
                        {a.name.slice(0, 2)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate">{a.name}</span>
                        {a.adminTitle && (
                          <span className="block text-[10px] font-bold text-pulse-700">{t(TITLE_LABEL[a.adminTitle])}</span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs" dir="ltr">{a.email}</td>
                  <td className="px-3 py-3">
                    {a.password ? (
                      <span className="inline-flex items-center gap-1.5">
                        <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs" dir="ltr">
                          {isRevealed ? a.password : "••••••"}
                        </code>
                        <button
                          onClick={() => toggleReveal(a.email)}
                          className="rounded p-1 text-ink-soft transition-colors hover:text-pulse-700"
                          title={t("show_hide")}
                          aria-label={t("show_hide")}
                        >
                          {isRevealed ? <XIcon size={13} /> : <EyeIcon size={13} />}
                        </button>
                      </span>
                    ) : (
                      <span
                        className="inline-flex max-w-52 items-center gap-1.5 text-[11px] font-semibold text-moss-700"
                        title={t("pw_cloud_note")}
                      >
                        <ShieldIcon size={13} className="shrink-0" />
                        {t("pw_cloud_note")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold " + meta.cls}>
                      {meta.icon} {t(meta.label)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs">{uniName ? bi(uniName) : "—"}</td>
                  <td className="px-3 py-3 text-xs">{deptName ? bi(deptName) : a.role === "student" ? t("general_dept") : t("scope_all_depts")}</td>
                  <td className="px-5 py-3 text-xs text-ink-soft">{formatDate(a.createdAt, lang)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
