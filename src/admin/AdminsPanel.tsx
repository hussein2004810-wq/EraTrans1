import { useState } from "react";
import type { Account, PermKey } from "../types";
import { ALL_PERMS } from "../types";
import { useI18n } from "../i18n";
import { uid } from "../lib/store";
import { UNIVERSITIES, findDeptInUniversity, findUniversity, universityDepts } from "../data/hierarchy";
import { EmptyState, Modal, formatDate } from "../components/ui";
import {
  CheckIcon, CrownIcon, GradCapIcon, InfoIcon, PlusIcon, ShieldIcon, TrashIcon, UsersIcon, XIcon,
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
};

interface Props {
  accounts: Account[];
  onSaveAdmin: (acc: Account) => void;
  onDeleteAdmin: (email: string) => void;
  onDemoteAdmin: (email: string) => void;
}

/** إدارة المشرفين — التسلسل الإداري: مالك ← مشرف جامعة ← مشرف قسم (حصرية للمالك) */
export default function AdminsPanel({ accounts, onSaveAdmin, onDeleteAdmin, onDemoteAdmin }: Props) {
  const { t, bi, lang } = useI18n();
  const admins = accounts.filter((a) => a.role === "admin");
  const students = accounts.filter((a) => a.role === "student");
  const owner = accounts.find((a) => a.role === "owner");

  /* ── نموذج الإنشاء ── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState<PermKey[]>(["exams", "questions", "reports"]);
  const [scopeUniversity, setScopeUniversity] = useState("");
  const [scopeDept, setScopeDept] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [promoteId, setPromoteId] = useState("");
  const [toDelete, setToDelete] = useState<Account | null>(null);

  const toggle = (p: PermKey) =>
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const create = () => {
    setErr(null);
    if (!name.trim() || !email.trim() || password.length < 4) return setErr(t("required_fields"));
    if (!scopeUniversity) return setErr(t("required_fields") + " — " + t("university_col"));
    if (accounts.some((a) => a.email === email.trim().toLowerCase())) return setErr(t("email_exists"));
    onSaveAdmin({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "admin",
      perms,
      scopeUniversity,
      scopeDept: scopeDept || undefined,
      createdAt: Date.now(),
    });
    setName(""); setEmail(""); setPassword(""); setScopeDept("");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  const promote = () => {
    const s = students.find((x) => x.email === promoteId);
    if (!s || !scopeUniversity) return;
    onSaveAdmin({ ...s, role: "admin", perms, scopeUniversity, scopeDept: scopeDept || undefined });
    setPromoteId("");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  const toggleAdminPerm = (admin: Account, p: PermKey) => {
    const cur = admin.perms ?? [];
    onSaveAdmin({
      ...admin,
      perms: cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    });
  };

  const setAdminScope = (admin: Account, uni: string, dept: string) =>
    onSaveAdmin({ ...admin, scopeUniversity: uni, scopeDept: dept || undefined });

  /* ── تجميع المشرفين حسب الجامعة (التسلسل الإداري) ── */
  const byUniversity = UNIVERSITIES.map((u) => ({
    uni: u,
    admins: admins.filter((a) => a.scopeUniversity === u.id),
  })).filter((g) => g.admins.length > 0);
  const unscoped = admins.filter((a) => !a.scopeUniversity);

  return (
    <div className="space-y-5">
      {/* ── قمة الهرم: المالك ── */}
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

      <p className="flex items-start gap-2 rounded-xl border border-line bg-card px-4 py-3 text-xs leading-relaxed text-ink-soft">
        <InfoIcon size={15} className="mt-0.5 shrink-0 text-pulse-600" />
        {t("hierarchy_hint")}
      </p>

      {/* ── إنشاء مشرف + النطاق ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <ShieldIcon size={19} className="text-pulse-600" />
          <h2 className="font-display text-xl font-bold">{t("new_admin")}</h2>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <div>
            <label className="lbl">{t("full_name")}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="lbl">{t("email")}</label>
            <input className="input" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin2@kiur.edu" />
          </div>
          <div>
            <label className="lbl">{t("password")}</label>
            <input className="input" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
        </div>

        {/* النطاق الإداري */}
        <div className="mx-5 mb-2 grid gap-3 rounded-xl border border-pulse-600/25 bg-pulse-100/40 p-4 sm:grid-cols-2">
          <div>
            <label className="lbl">
              <GradCapIcon size={13} className="me-1 inline text-pulse-600" />
              {t("university_col")} ★ <span className="text-[10px] text-ink-soft">({t("scope_hint")})</span>
            </label>
            <select
              className="input"
              value={scopeUniversity}
              onChange={(e) => {
                setScopeUniversity(e.target.value);
                setScopeDept("");
              }}
            >
              <option value="">{t("select_hint")}</option>
              {UNIVERSITIES.map((u) => (
                <option key={u.id} value={u.id}>{bi(u.name)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl">{t("dept_label")}</label>
            <select className="input" value={scopeDept} disabled={!scopeUniversity} onChange={(e) => setScopeDept(e.target.value)}>
              <option value="">{t("scope_all_depts")}</option>
              {universityDepts(scopeUniversity).map((c) => (
                <optgroup key={c.collegeId} label={bi(c.collegeName)}>
                  {c.depts.map((d) => (
                    <option key={d.id} value={d.id}>{bi(d.name)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 pb-2 pt-2">
          <p className="lbl mb-2">{t("admins_tab")}</p>
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
                  <option key={s.email} value={s.email}>
                    {s.name} — {bi(findUniversity(s.university)?.name ?? { ar: "", en: "" })}
                  </option>
                ))}
              </select>
              <button onClick={promote} disabled={!promoteId || !scopeUniversity} className="btn-ghost">
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

      {/* ── التسلسل الإداري: مشرفون مجمّعون حسب الجامعة ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <UsersIcon size={19} className="text-pulse-600" />
          <h2 className="font-display text-xl font-bold">{t("hierarchy_label")}</h2>
          <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">{admins.length}</span>
        </div>

        {admins.length === 0 ? (
          <div className="p-6"><EmptyState icon={<ShieldIcon size={22} />} text={t("no_students")} /></div>
        ) : (
          <div className="divide-y divide-line">
            {byUniversity.map(({ uni, admins: list }) => (
              <section key={uni.id}>
                <header className="flex items-center gap-2 bg-paper/70 px-5 py-2.5">
                  <GradCapIcon size={15} className="text-amberx-600" />
                  <h3 className="font-display text-sm font-bold">{bi(uni.name)}</h3>
                  <span className="text-[11px] font-bold text-ink-soft">· {list.length} {t("admin_role")}</span>
                </header>
                <ul className="divide-y divide-dashed divide-line">
                  {list.map((a) => (
                    <AdminRow
                      key={a.email}
                      admin={a}
                      lang={lang}
                      t={t}
                      bi={bi}
                      onTogglePerm={toggleAdminPerm}
                      onScope={setAdminScope}
                      onDemote={onDemoteAdmin}
                      onDelete={setToDelete}
                    />
                  ))}
                </ul>
              </section>
            ))}
            {unscoped.length > 0 && (
              <section>
                <header className="flex items-center gap-2 bg-blood-100/60 px-5 py-2.5">
                  <InfoIcon size={15} className="text-blood-600" />
                  <h3 className="font-display text-sm font-bold text-blood-700">{t("scope_none_warn")}</h3>
                </header>
                <ul className="divide-y divide-dashed divide-line">
                  {unscoped.map((a) => (
                    <AdminRow
                      key={a.email}
                      admin={a}
                      lang={lang}
                      t={t}
                      bi={bi}
                      onTogglePerm={toggleAdminPerm}
                      onScope={setAdminScope}
                      onDemote={onDemoteAdmin}
                      onDelete={setToDelete}
                    />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

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

/* ── صف مشرف: بياناته + نطاقه القابل للتعديل من المالك + صلاحياته ── */
function AdminRow({
  admin,
  lang,
  t,
  bi,
  onTogglePerm,
  onScope,
  onDemote,
  onDelete,
}: {
  admin: Account;
  lang: "ar" | "en";
  t: (k: string) => string;
  bi: (b: { ar: string; en: string } | undefined) => string;
  onTogglePerm: (a: Account, p: PermKey) => void;
  onScope: (a: Account, uni: string, dept: string) => void;
  onDemote: (email: string) => void;
  onDelete: (a: Account) => void;
}) {
  const [open, setOpen] = useState(false);
  const deptInfo = findDeptInUniversity(admin.scopeUniversity, admin.scopeDept);
  return (
    <li className="px-5 py-4 transition-colors hover:bg-pulse-100/25">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-pine-900 font-display text-sm font-bold text-pulse-300">
          {admin.name.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{admin.name}</p>
          <p className="text-xs text-ink-soft">
            <span dir="ltr">{admin.email}</span> · {t("registered_col")} {formatDate(admin.createdAt, lang)}
          </p>
        </div>
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold " +
            (admin.scopeUniversity
              ? "bg-pulse-100 text-pulse-700"
              : "bg-blood-100 text-blood-700")
          }
        >
          <GradCapIcon size={12} />
          {admin.scopeUniversity
            ? bi(findUniversity(admin.scopeUniversity)?.name ?? { ar: admin.scopeUniversity, en: admin.scopeUniversity }) +
              (admin.scopeDept ? " · " + bi(deptInfo?.dept.name ?? { ar: admin.scopeDept, en: admin.scopeDept }) : " · " + t("scope_all_depts"))
            : t("scope_label") + ": —"}
        </span>
        <button
          onClick={() => onDemote(admin.email)}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-amberx-500 hover:text-amberx-600"
        >
          {t("demote")}
        </button>
        <button
          onClick={() => onDelete(admin)}
          className="rounded-lg border border-line bg-white p-2 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
          aria-label={t("delete")}
        >
          <TrashIcon size={14} />
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {ALL_PERMS.map((p) => {
          const on = (admin.perms ?? []).includes(p);
          return (
            <button
              key={p}
              onClick={() => onTogglePerm(admin, p)}
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
        <button
          onClick={() => setOpen(!open)}
          className="rounded-full border border-amberx-500/50 bg-amberx-100 px-2.5 py-1 text-[11px] font-bold text-amberx-600 transition-all duration-200 hover:bg-amberx-500 hover:text-white"
        >
          {t("scope_label")} ⌄
        </button>
      </div>

      {open && (
        <div className="anim-fade-up mt-3 grid gap-3 rounded-xl border border-line bg-paper/60 p-4 sm:grid-cols-2">
          <div>
            <label className="lbl">{t("university_col")}</label>
            <select
              className="input"
              value={admin.scopeUniversity ?? ""}
              onChange={(e) => onScope(admin, e.target.value, "")}
            >
              <option value="">— {t("scope_label")}: —</option>
              {UNIVERSITIES.map((u) => (
                <option key={u.id} value={u.id}>{bi(u.name)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl">{t("dept_label")}</label>
            <select
              className="input"
              value={admin.scopeDept ?? ""}
              disabled={!admin.scopeUniversity}
              onChange={(e) => onScope(admin, admin.scopeUniversity ?? "", e.target.value)}
            >
              <option value="">{t("scope_all_depts")}</option>
              {universityDepts(admin.scopeUniversity ?? "").map((c) => (
                <optgroup key={c.collegeId} label={bi(c.collegeName)}>
                  {c.depts.map((d) => (
                    <option key={d.id} value={d.id}>{bi(d.name)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      )}
    </li>
  );
}
