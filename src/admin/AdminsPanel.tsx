import { useMemo, useState } from "react";
import type { Account, AdminTitle, PermKey } from "../types";
import { ALL_PERMS, TITLE_DEFAULT_PERMS } from "../types";
import { useI18n } from "../i18n";
import { uid } from "../lib/store";
import { allUniversities, universityDepts, findDeptInUniversity, findUniversity } from "../data/hierarchy";
import { EmptyState, Modal, SearchableSelect, formatDate } from "../components/ui";
import {
  CheckIcon, CrownIcon, GradCapIcon, LayersIcon, PlusIcon, ShieldIcon, StethoIcon, TrashIcon, UsersIcon, XIcon,
} from "../components/icons";

const PERM_LABEL: Record<PermKey, string> = {
  exams: "perm_exams",
  questions: "perm_questions",
  images: "perm_images",
  import: "perm_import",
  students: "perm_students",
  reports: "perm_reports",
  export: "perm_export",
  audit: "perm_audit",
  universities: "perm_universities",
  accountsLog: "perm_accounts_log",
  vignettes: "perm_vignettes",
  shares: "perm_shares",
};

const TITLES: AdminTitle[] = ["head", "coordinator", "doctor", "professor", "platform"];
const TITLE_LABEL: Record<AdminTitle, string> = {
  head: "role_head",
  coordinator: "role_coordinator",
  doctor: "role_doctor",
  professor: "role_professor",
  platform: "role_platform",
};
const TITLE_ICON: Record<AdminTitle, React.ReactNode> = {
  head: <CrownIcon size={14} />,
  coordinator: <ShieldIcon size={14} />,
  doctor: <StethoIcon size={14} />,
  professor: <GradCapIcon size={14} />,
  platform: <LayersIcon size={14} />,
};

interface Props {
  accounts: Account[];
  onSaveAdmin: (acc: Account) => void;
  onDeleteAdmin: (email: string) => void;
  onDemoteAdmin: (email: string) => void;
}

/** إدارة المشرفين والأدوار الأكاديمية ونطاقاتهم — حصرية لمالك المنصة */
export default function AdminsPanel({ accounts, onSaveAdmin, onDeleteAdmin, onDemoteAdmin }: Props) {
  const { t, bi, lang } = useI18n();
  const admins = accounts.filter((a) => a.role === "admin");
  const students = accounts.filter((a) => a.role === "student");
  const owner = accounts.find((a) => a.role === "owner");

  /* ── نموذج الإنشاء ── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState<AdminTitle>("doctor");
  const [perms, setPerms] = useState<PermKey[]>([...TITLE_DEFAULT_PERMS.doctor]);
  const [uni, setUni] = useState("");
  const [dept, setDept] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [promoteId, setPromoteId] = useState("");
  const [toDelete, setToDelete] = useState<Account | null>(null);

  const unis = useMemo(
    () =>
      allUniversities().map((u) => ({
        value: u.id,
        label: bi(u.name),
        sub: u.id,
      })),
    [bi]
  );

  const deptOptions = useMemo(
    () =>
      uni
        ? universityDepts(uni).flatMap((c) =>
            c.depts.map((d) => ({ value: d.id, label: bi(d.name), sub: bi(c.collegeName) }))
          )
        : [],
    [uni, bi]
  );

  const pickTitle = (tt: AdminTitle) => {
    setTitle(tt);
    setPerms([...TITLE_DEFAULT_PERMS[tt]]);
  };

  const toggle = (p: PermKey) =>
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const create = () => {
    setErr(null);
    if (!name.trim() || !email.trim() || password.length < 4) return setErr(t("required_fields"));
    if (accounts.some((a) => a.email === email.trim().toLowerCase())) return setErr(t("email_exists"));
    if (!uni) return setErr(t("uni_scope_req"));
    onSaveAdmin({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "admin",
      adminTitle: title,
      perms,
      scopeUniversity: uni,
      scopeDept: dept || undefined,
      createdAt: Date.now(),
    });
    setName(""); setEmail(""); setPassword(""); setDept("");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  const promote = () => {
    const s = students.find((x) => x.email === promoteId);
    if (!s) return;
    onSaveAdmin({
      ...s,
      role: "admin",
      adminTitle: title,
      perms,
      scopeUniversity: s.university ?? uni,
      scopeDept: s.department ?? (dept || undefined),
    });
    setPromoteId("");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  const toggleAdminPerm = (admin: Account, p: PermKey) => {
    const cur = admin.perms ?? [];
    onSaveAdmin({ ...admin, perms: cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p] });
  };

  const setScope = (admin: Account, patch: Partial<Account>) => onSaveAdmin({ ...admin, ...patch });

  /* تجميع المشرفين حسب الجامعة */
  const grouped = useMemo(() => {
    const m = new Map<string, Account[]>();
    admins.forEach((a) => {
      const k = a.scopeUniversity ?? "";
      m.set(k, [...(m.get(k) ?? []), a]);
    });
    return [...m.entries()];
  }, [admins]);

  return (
    <div className="space-y-5">
      {/* ── المالك ── */}
      {owner && (
        <div className="flex items-center gap-3 rounded-xl border border-amberx-500/50 bg-amberx-100/70 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-amberx-500 text-white shadow-md">
            <CrownIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold">{owner.name}</p>
            <p className="text-xs text-ink-soft" dir="ltr">{owner.email}</p>
          </div>
          <span className="rounded-full bg-amberx-500 px-3 py-1 text-xs font-bold text-white">{t("owner_role")}</span>
        </div>
      )}

      {/* ── إنشاء حساب أكاديمي ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <GradCapIcon size={19} className="text-pulse-600" />
          <h2 className="font-display text-xl font-bold">{t("academic_roles")}</h2>
        </div>
        <p className="border-b border-line bg-paper/50 px-5 py-2.5 text-xs text-ink-soft">{t("academic_hint")}</p>

        {/* اختيار الدور */}
        <div className="px-5 pt-4">
          <p className="lbl mb-2">{t("select_role")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TITLES.map((tt) => {
              const on = title === tt;
              return (
                <button
                  key={tt}
                  onClick={() => pickTitle(tt)}
                  className={
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 " +
                    (on
                      ? "border-pulse-600 bg-pulse-100 text-pulse-700 shadow-md"
                      : "border-line bg-white text-ink-soft hover:border-pulse-500/60")
                  }
                >
                  <span className={on ? "text-pulse-700" : "text-ink-soft"}>{TITLE_ICON[tt]}</span>
                  <span className="text-xs font-bold">{t(TITLE_LABEL[tt])}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <div>
            <label className="lbl">{t("full_name")}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="lbl">{t("email")}</label>
            <input className="input" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@kiur.edu" />
          </div>
          <div>
            <label className="lbl">{t("password")}</label>
            <input className="input" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <div>
            <label className="lbl">{t("uni_scope_req")} ★</label>
            <SearchableSelect
              options={unis}
              value={uni}
              onChange={(v) => { setUni(v); setDept(""); }}
              placeholder={t("select_hint")}
              searchPlaceholder={t("search_uni")}
            />
          </div>
          <div>
            <label className="lbl">{t("dept_scope_opt")}</label>
            <SearchableSelect
              options={deptOptions}
              value={dept}
              onChange={setDept}
              placeholder={t("select_hint")}
              searchPlaceholder={t("search_dept")}
              disabled={!uni}
            />
          </div>
        </div>

        <div className="px-5 pb-2">
          <p className="lbl mb-1">{t("admins_tab")}</p>
          <p className="mb-2 text-[11px] text-ink-soft">{t("role_perms_note")}</p>
          <div className="flex flex-wrap gap-2">
            {ALL_PERMS.map((p) => {
              const on = perms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all duration-200 " +
                    (on
                      ? "border-pulse-600 bg-pulse-100 text-pulse-700"
                      : "border-line bg-white text-ink-soft hover:border-pulse-500/60")
                  }
                >
                  {on ? <CheckIcon size={12} /> : <XIcon size={12} className="opacity-40" />}
                  {t(PERM_LABEL[p])}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <button onClick={create} className="btn-primary">
            <PlusIcon size={15} /> {t("new_admin")}
          </button>
          {students.length > 0 && (
            <span className="flex items-center gap-2">
              <select className="input w-auto" value={promoteId} onChange={(e) => setPromoteId(e.target.value)}>
                <option value="">{t("promote_student")}…</option>
                {students.map((s) => (
                  <option key={s.email} value={s.email}>{s.name}</option>
                ))}
              </select>
              <button onClick={promote} disabled={!promoteId} className="btn-ghost">
                <CrownIcon size={15} /> {t("admin_role")}
              </button>
            </span>
          )}
          {err && <span className="anim-pop text-xs font-bold text-blood-600">{err}</span>}
          {done && (
            <span className="anim-pop inline-flex items-center gap-1 text-xs font-bold text-moss-600">
              <CheckIcon size={13} /> {t("admin_created")}
            </span>
          )}
        </div>
      </div>

      {/* ── قائمة المشرفين (مجمعة حسب الجامعة) ── */}
      {admins.length === 0 ? (
        <div className="card p-6"><EmptyState icon={<ShieldIcon size={22} />} text={t("no_students")} /></div>
      ) : (
        grouped.map(([uniId, list]) => (
          <div key={uniId || "none"} className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line bg-paper/50 px-5 py-3">
              <GradCapIcon size={16} className="text-pulse-600" />
              <h3 className="font-display text-sm font-bold">
                {uniId ? bi(findUniversity(uniId)?.name ?? { ar: uniId, en: uniId }) : t("scope_none_warn")}
              </h3>
              <span className="ms-auto rounded-full bg-pulse-100 px-2 py-0.5 text-[11px] font-bold text-pulse-700">{list.length}</span>
            </div>
            <ul className="divide-y divide-line">
              {list.map((a) => (
                <li key={a.email} className="px-5 py-4 transition-colors hover:bg-pulse-100/25">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-pine-900 font-display text-sm font-bold text-pulse-300">
                      {a.name.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {a.name}
                        {a.adminTitle && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pine-900 px-2 py-0.5 text-[10px] font-bold text-pulse-300">
                            {TITLE_ICON[a.adminTitle]} {t(TITLE_LABEL[a.adminTitle])}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-soft">
                        <span dir="ltr">{a.email}</span> · {t("registered_col")} {formatDate(a.createdAt, lang)}
                      </p>
                    </div>
                    <button
                      onClick={() => onDemoteAdmin(a.email)}
                      className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-amberx-500 hover:text-amberx-600"
                    >
                      {t("demote")}
                    </button>
                    <button
                      onClick={() => setToDelete(a)}
                      className="rounded-lg border border-line bg-white p-2 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
                      aria-label={t("delete")}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>

                  {/* نطاق الرؤية — يحرره المالك */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="lbl">{t("uni_scope_req")}</label>
                      <SearchableSelect
                        options={unis}
                        value={a.scopeUniversity ?? ""}
                        onChange={(v) => setScope(a, { scopeUniversity: v, scopeDept: undefined })}
                        placeholder={t("select_hint")}
                        searchPlaceholder={t("search_uni")}
                      />
                    </div>
                    <div>
                      <label className="lbl">{t("dept_scope_opt")}</label>
                      <SearchableSelect
                        options={a.scopeUniversity ? universityDepts(a.scopeUniversity).flatMap((c) => c.depts.map((d) => ({ value: d.id, label: bi(d.name), sub: bi(c.collegeName) }))) : []}
                        value={a.scopeDept ?? ""}
                        onChange={(v) => setScope(a, { scopeDept: v || undefined })}
                        placeholder={t("scope_all_depts")}
                        searchPlaceholder={t("search_dept")}
                        disabled={!a.scopeUniversity}
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {ALL_PERMS.map((p) => {
                      const on = (a.perms ?? []).includes(p);
                      return (
                        <button
                          key={p}
                          onClick={() => toggleAdminPerm(a, p)}
                          className={
                            "rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all duration-200 " +
                            (on
                              ? "border-pulse-600/50 bg-pulse-100 text-pulse-700"
                              : "border-line bg-white text-ink-soft/70 hover:border-pulse-500/50")
                          }
                          title={t(PERM_LABEL[p])}
                        >
                          {on && <CheckIcon size={10} className="me-1 inline" />}
                          {t(PERM_LABEL[p])}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3 className="font-display text-xl font-bold">{t("confirm_delete_q")}</h3>
        <p className="mt-2 text-sm text-ink-soft">{toDelete?.name} — <span dir="ltr">{toDelete?.email}</span></p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setToDelete(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button
            onClick={() => {
              if (toDelete) onDeleteAdmin(toDelete.email);
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
