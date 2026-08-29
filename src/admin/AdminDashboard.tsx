import { useMemo, useState } from "react";
import type { Account, Attempt, AuditEntry, CustomCollege, CustomDept, CustomUniversity, ExamDef, PermKey, Question, SavedSession, ShareRequest, Vignette, VignetteAuditEntry } from "../types";
import { useI18n } from "../i18n";
import { useToast } from "../components/Toast";
import { SUBJECTS } from "../data/seed";
import { findCollege, findDept, findDeptInUniversity, findUniversity } from "../data/hierarchy";
import EcgLine from "../components/EcgLine";
import { EmptyState, KiurWordmark, LangSwitch, Modal, formatDate } from "../components/ui";
import QuestionBank, { ImportPanel } from "./QuestionBank";
import ExamBuilder from "./ExamBuilder";
import ImageLibrary from "./ImageLibrary";
import ExportCenter from "./ExportCenter";
import AdminsPanel from "./AdminsPanel";
import AuditLog from "./AuditLog";
import StressTest from "./StressTest";
import AccountsLog from "./AccountsLog";
import VignettesPanel from "./VignettesPanel";
import CollegesPanel from "./CollegesPanel";
import ShareRequests from "./ShareRequests";
import SyncPanel from "./SyncPanel";
import type { SyncConfig } from "../lib/supabaseClient";
import {
  AwardIcon, ChartIcon, CheckIcon, ClipboardIcon, CrownIcon, DownloadIcon, EyeIcon, GaugeIcon, GlobeIcon, GradCapIcon, ImageIcon, InfoIcon, KeyIcon, LayersIcon,
  LogoutIcon, PlusIcon, SearchIcon, ShareIcon, ShieldIcon, SheetIcon, StethoIcon, TrashIcon, UploadIcon, UsersIcon, XIcon,
} from "../components/icons";

type Tab =
  | "overview" | "exams" | "questions" | "images" | "import"
  | "students" | "reports" | "export" | "audit" | "admins" | "stress"
  | "colleges" | "accountsLog" | "vignettes" | "shares" | "sync";

interface Props {
  user: Account;
  questions: Question[];
  exams: ExamDef[];
  attempts: Attempt[];
  accounts: Account[];
  audit: AuditEntry[];
  customUniversities: CustomUniversity[];
  onAddUniversity: (u: CustomUniversity) => void;
  onDeleteUniversity: (id: string) => void;
  vignettes: Vignette[];
  vignetteAudit: VignetteAuditEntry[];
  onSaveVignette: (v: Vignette, isNew: boolean) => void;
  onDeleteVignette: (id: string) => void;
  onToggleVignettePublish: (id: string, published: boolean) => void;
  customColleges: CustomCollege[];
  customDepts: CustomDept[];
  onSaveCollege: (c: CustomCollege, isNew: boolean) => void;
  onDeleteCollege: (id: string) => void;
  onSaveDept: (d: CustomDept, isNew: boolean) => void;
  onDeleteDept: (id: string) => void;
  shares: ShareRequest[];
  onDecideShare: (id: string, approve: boolean) => void;
  onSaveExam: (e: ExamDef) => void;
  onDeleteExam: (id: string) => void;
  onSaveQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onImportQuestions: (qs: Question[]) => void;
  onDeleteStudent: (email: string) => void;
  onSaveAdmin: (acc: Account) => void;
  onDeleteAdmin: (email: string) => void;
  onDemoteAdmin: (email: string) => void;
  syncConfig: SyncConfig | null;
  onConnect: (cfg: SyncConfig) => Promise<{ ok: boolean; message: string }>;
  onDisconnect: () => void;
  onSyncNow: () => Promise<{ ok: boolean; message: string }>;
  onPushAll: (
    onProgress?: (done: number, total: number, name: string, ok: boolean) => void
  ) => Promise<{ ok: boolean; message: string }>;
  onProbeWrite: () => Promise<{ ok: boolean; message: string }>;
  onLogout: () => void;
}

export default function AdminDashboard(props: Props) {
  const { user, questions, exams, attempts, accounts, audit, onLogout } = props;
  const { t, bi, lang } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [presetImage, setPresetImage] = useState<string | null>(null);

  /* إشعارات فورية عند كل حفظ/حذف — تغذية راجعة ملموسة لكل عملية */
  const onSaveExamT = (e: ExamDef) => {
    props.onSaveExam(e);
    toast.push(t("toast_saved"), "success");
  };
  const onDeleteExamT = (id: string) => {
    props.onDeleteExam(id);
    toast.push(t("toast_deleted"), "info");
  };
  const onSaveQuestionT = (q: Question) => {
    props.onSaveQuestion(q);
    toast.push(t("toast_saved"), "success");
  };
  const onDeleteQuestionT = (id: string) => {
    props.onDeleteQuestion(id);
    toast.push(t("toast_deleted"), "info");
  };
  const onImportT = (qs: Question[]) => {
    props.onImportQuestions(qs);
    toast.push(t("toast_imported"), "success");
  };
  const onDeleteStudentT = (email: string) => {
    props.onDeleteStudent(email);
    toast.push(t("toast_deleted"), "info");
  };

  const isOwner = user.role === "owner";
  const has = (p: PermKey) => isOwner || (user.perms ?? []).includes(p);

  const students = accounts.filter((a) => a.role === "student");

  /* ── النطاق الإداري: المالك يرى كل شيء، المشرف يرى جامعته/قسمه فقط ── */
  const scopeUni = isOwner ? "" : user.scopeUniversity ?? "";
  const scopeDept = isOwner ? "" : user.scopeDept ?? "";
  const scopedStudents = students.filter(
    (s) => isOwner || (!!scopeUni && s.university === scopeUni && (!scopeDept || s.department === scopeDept))
  );
  const scopedEmails = useMemo(() => new Set(scopedStudents.map((s) => s.email)), [scopedStudents]);
  const scopedAttempts = attempts.filter((a) => isOwner || scopedEmails.has(a.studentEmail));
  const scopedExams = isOwner ? exams : exams.filter((e) => e.university === scopeUni);
  const noScope = !isOwner && !scopeUni;

  const allTabs: { id: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "overview", label: t("overview"), icon: <ChartIcon size={16} />, show: true },
    { id: "exams", label: t("exams_tab"), icon: <ClipboardIcon size={16} />, show: has("exams") },
    { id: "questions", label: t("question_bank"), icon: <LayersIcon size={16} />, show: has("questions") },
    { id: "images", label: t("images_tab"), icon: <ImageIcon size={16} />, show: has("images") },
    { id: "import", label: t("import_tab"), icon: <UploadIcon size={16} />, show: has("import") },
    { id: "students", label: t("students_tab"), icon: <UsersIcon size={16} />, show: has("students") },
    { id: "reports", label: t("reports_tab"), icon: <AwardIcon size={16} />, show: has("reports") },
    { id: "export", label: t("export_tab"), icon: <DownloadIcon size={16} />, show: has("export") },
    { id: "audit", label: t("audit_tab"), icon: <EyeIcon size={16} />, show: has("audit") },
    { id: "vignettes", label: t("vignettes_tab"), icon: <StethoIcon size={16} />, show: has("vignettes") },
    { id: "colleges", label: t("colleges_tab"), icon: <GradCapIcon size={16} />, show: has("universities") },
    { id: "shares", label: t("shares_tab"), icon: <ShareIcon size={16} />, show: has("shares") || isOwner },
    { id: "accountsLog", label: t("accounts_log_tab"), icon: <KeyIcon size={16} />, show: has("accountsLog") },
    { id: "sync", label: t("sync_tab"), icon: <GlobeIcon size={16} />, show: isOwner },
    { id: "stress", label: t("stress_tab"), icon: <GaugeIcon size={16} />, show: isOwner },
    { id: "admins", label: t("admins_tab"), icon: <CrownIcon size={16} />, show: isOwner },
  ];
  const tabs = allTabs.filter((x) => x.show);
  /* إن فُقدت صلاحية التبويب الحالي ارجع للنظرة العامة */
  const activeTab: Tab = tabs.some((x) => x.id === tab) ? tab : "overview";

  return (
    <div className="min-h-screen">
      <header className="monitor-band sticky top-0 z-40 border-b border-pine-700 text-paper shadow-lg shadow-pine-950/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <KiurWordmark dark size="sm" />
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold " +
              (isOwner
                ? "border-amberx-500/50 bg-amberx-500/15 text-amberx-500"
                : "border-pulse-500/40 bg-pulse-500/10 text-pulse-300")
            }
          >
            {isOwner ? <CrownIcon size={12} /> : <ShieldIcon size={12} />}
            {isOwner ? t("owner_role") : t("admin_role")}
          </span>
          {!isOwner && (
            <span
              className={
                "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold md:inline-flex " +
                (scopeUni
                  ? "border-pulse-500/40 bg-pulse-500/10 text-pulse-300"
                  : "border-blood-600/50 bg-blood-600/15 text-red-300")
              }
              title={t("scope_you")}
            >
              <GradCapIcon size={12} />
              {scopeUni
                ? `${bi(findUniversity(scopeUni)?.name ?? { ar: scopeUni, en: scopeUni })}${
                    scopeDept
                      ? " · " +
                        bi(
                          findDeptInUniversity(scopeUni, scopeDept)?.dept.name ?? {
                            ar: scopeDept,
                            en: scopeDept,
                          }
                        )
                      : " · " + t("scope_all_depts")
                  }`
                : t("scope_none_warn")}
            </span>
          )}
          <span className="hidden text-xs text-pulse-300/70 sm:inline">{user.name}</span>
          <span className="ms-auto flex items-center gap-2">
            <LangSwitch />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-pine-700 bg-pine-800/70 px-3 py-1.5 text-xs font-bold text-pulse-300 transition-colors hover:border-blood-600 hover:text-red-300"
            >
              <LogoutIcon size={14} /> {t("logout")}
            </button>
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit lg:sticky lg:top-20">
          <div className="card flex gap-1 overflow-x-auto p-1.5 lg:flex-col">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-bold transition-all duration-200 " +
                  (tab === tb.id
                    ? "bg-pine-900 text-pulse-300 shadow-md"
                    : "text-ink-soft hover:bg-paper hover:text-ink")
                }
              >
                {tb.icon}
                {tb.label}
              </button>
            ))}
          </div>
          <div className="card mt-3 hidden overflow-hidden lg:block">
            <EcgLine className="h-12 w-full text-pulse-600/70" speed={7} />
          </div>
        </nav>

        <div className="min-w-0">
          {noScope && (
            <div className="anim-pop mb-4 flex items-start gap-2.5 rounded-xl border border-blood-600/40 bg-blood-100 px-4 py-3 text-sm font-semibold text-blood-700">
              <InfoIcon size={17} className="mt-0.5 shrink-0" />
              {t("scope_none_warn")}
            </div>
          )}
          {activeTab === "overview" && <Overview students={scopedStudents} questions={questions} exams={scopedExams} attempts={scopedAttempts} />}
          {activeTab === "exams" && (
            <ExamBuilder
              exams={scopedExams}
              questions={questions}
              attempts={scopedAttempts}
              onSave={onSaveExamT}
              onDelete={onDeleteExamT}
              lockedUniversity={isOwner ? null : scopeUni}
            />
          )}
          {activeTab === "questions" && (
            <QuestionBank
              questions={questions}
              onSave={onSaveQuestionT}
              onDelete={onDeleteQuestionT}
              presetImage={presetImage}
              onPresetConsumed={() => setPresetImage(null)}
            />
          )}
          {activeTab === "images" && (
            <ImageLibrary
              onUseInQuestion={(url) => {
                setPresetImage(url);
                setTab("questions");
              }}
            />
          )}
          {activeTab === "import" && <ImportPanel questions={questions} onImport={onImportT} />}
          {activeTab === "students" && (
            <StudentsRegistry students={scopedStudents} attempts={scopedAttempts} onDelete={onDeleteStudentT} />
          )}
          {activeTab === "reports" && <Reports exams={scopedExams} attempts={scopedAttempts} />}
          {activeTab === "export" && <ExportCenter exams={scopedExams} attempts={scopedAttempts} accounts={accounts} />}
          {activeTab === "audit" && <AuditLog entries={audit} />}
          {activeTab === "vignettes" && (
            <VignettesPanel
              user={user}
              vignettes={props.vignettes}
              vignetteAudit={props.vignetteAudit}
              onSaveVignette={props.onSaveVignette}
              onDeleteVignette={props.onDeleteVignette}
              onTogglePublish={props.onToggleVignettePublish}
            />
          )}
          {activeTab === "colleges" && (
            <CollegesPanel
              customUniversities={props.customUniversities}
              customColleges={props.customColleges}
              customDepts={props.customDepts}
              onAddUniversity={props.onAddUniversity}
              onDeleteUniversity={props.onDeleteUniversity}
              onSaveCollege={props.onSaveCollege}
              onDeleteCollege={props.onDeleteCollege}
              onSaveDept={props.onSaveDept}
              onDeleteDept={props.onDeleteDept}
            />
          )}
          {activeTab === "shares" && (
            <ShareRequests
              user={user}
              shares={props.shares}
              exams={exams}
              accounts={accounts}
              onDecideShare={(id, approve) => {
                props.onDecideShare(id, approve);
                toast.push(approve ? t("toast_approved") : t("toast_rejected"), approve ? "success" : "info");
              }}
            />
          )}
          {activeTab === "accountsLog" && <AccountsLog accounts={accounts} />}
          {activeTab === "sync" && isOwner && (
            <SyncPanel
              config={props.syncConfig}
              onConnect={props.onConnect}
              onDisconnect={props.onDisconnect}
              onSyncNow={props.onSyncNow}
              onPushAll={props.onPushAll}
              onProbeWrite={props.onProbeWrite}
            />
          )}
          {activeTab === "stress" && isOwner && <StressTest questions={questions} exams={exams} />}
          {activeTab === "admins" && isOwner && (
            <AdminsPanel
              accounts={accounts}
              onSaveAdmin={props.onSaveAdmin}
              onDeleteAdmin={props.onDeleteAdmin}
              onDemoteAdmin={props.onDemoteAdmin}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ نظرة عامة ═══════════ */

function Overview({
  students,
  questions,
  exams,
  attempts,
}: {
  students: Account[];
  questions: Question[];
  exams: ExamDef[];
  attempts: Attempt[];
}) {
  const { t, bi, lang } = useI18n();

  const mastery = useMemo(() => {
    return SUBJECTS.map((s) => {
      let c = 0, tt = 0;
      attempts.forEach((a) => {
        const v = a.perSubject[s.id];
        if (v) {
          c += v.c;
          tt += v.t;
        }
      });
      return { s, p: tt === 0 ? 0 : Math.round((c / tt) * 100), n: tt };
    });
  }, [attempts]);

  const recent = [...attempts].sort((a, b) => b.date - a.date).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={<UsersIcon size={20} />} label={t("students_n")} value={students.length} tone="#0E7C66" />
        <StatTile icon={<LayersIcon size={20} />} label={t("question_bank")} value={questions.length} tone="#C4882A" />
        <StatTile
          icon={<ClipboardIcon size={20} />}
          label={t("exams_n")}
          value={`${exams.filter((e) => e.published).length}/${exams.length}`}
          tone="#1E8A56"
          sub={t("publish")}
        />
        <StatTile icon={<SheetIcon size={20} />} label={t("attempts_n")} value={attempts.length} tone="#7C5CBF" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="card p-6">
          <h2 className="font-display text-xl font-bold">{t("mastery_by_subject")}</h2>
          <div className="mt-5 space-y-4">
            {mastery.map(({ s, p, n }) => (
              <div key={s.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{bi(s.name)}</span>
                  <span className="font-display text-sm font-bold tabular-nums" style={{ color: s.color }}>
                    {n === 0 ? "—" : `${p}٪`}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-paper-deep">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-6 py-4 font-display text-xl font-bold">{t("recent_attempts")}</h2>
          {recent.length === 0 ? (
            <div className="p-6"><EmptyState icon={<SheetIcon size={22} />} text={t("no_attempts_exam")} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-paper/70 text-xs text-ink-soft">
                    <th className="px-6 py-3 text-start font-bold">{t("name_col")}</th>
                    <th className="px-3 py-3 text-start font-bold">{t("exam_col")}</th>
                    <th className="px-3 py-3 text-start font-bold">{t("score_col")}</th>
                    <th className="px-3 py-3 text-start font-bold">{t("result_col")}</th>
                    <th className="px-6 py-3 text-start font-bold">{t("date_col")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a) => (
                    <tr key={a.id} className="border-t border-line transition-colors hover:bg-pulse-100/30">
                      <td className="px-6 py-3 font-semibold">{a.studentName}</td>
                      <td className="px-3 py-3 text-xs text-ink-soft">{bi(a.examTitle)}</td>
                      <td className="px-3 py-3 font-display font-bold tabular-nums" style={{ color: a.passed ? "#1E8A56" : "#C4473E" }}>
                        {a.percent}٪
                      </td>
                      <td className="px-3 py-3">
                        <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold " + (a.passed ? "bg-moss-100 text-moss-700" : "bg-blood-100 text-blood-700")}>
                          {a.passed ? <CheckIcon size={10} /> : <XIcon size={10} />}
                          {a.passed ? t("passed") : t("failed")}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-ink-soft">{formatDate(a.date, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, tone, sub }: { icon: React.ReactNode; label: string; value: number | string; tone: string; sub?: string }) {
  return (
    <div className="card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <span className="absolute -end-3 -top-3 grid h-16 w-16 place-items-center rounded-full opacity-10 transition-transform duration-300 group-hover:scale-125" style={{ backgroundColor: tone, color: tone }}>
        {icon}
      </span>
      <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ backgroundColor: tone + "1a", color: tone }}>
        {icon}
      </span>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-bold text-ink-soft">{label}</p>
      {sub && <p className="text-[10px] text-ink-soft/70">{sub}</p>}
    </div>
  );
}

/* ═══════════ سجل الطلاب ═══════════ */

function StudentsRegistry({
  students,
  attempts,
  onDelete,
}: {
  students: Account[];
  attempts: Attempt[];
  onDelete: (email: string) => void;
}) {
  const { t, bi, lang } = useI18n();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Account | null>(null);
  const [q, setQ] = useState("");

  const visible = students.filter((s) => {
    const text = q.trim().toLowerCase();
    if (!text) return true;
    const hay = [
      s.name,
      s.email,
      bi(findUniversity(s.university)?.name ?? { ar: "", en: "" }),
      bi(findCollege(s.college)?.name ?? { ar: "", en: "" }),
      bi(findDept(s.college, s.department)?.name ?? { ar: "", en: "" }),
      s.year ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(text);
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-6 py-4">
        <UsersIcon size={20} className="text-pulse-600" />
        <h2 className="font-display text-xl font-bold">{t("students_tab")}</h2>
        <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">{students.length}</span>
        <span className="ms-auto flex items-center gap-1.5 text-[11px] font-bold text-amberx-600">
          <ShieldIcon size={13} /> {t("admin_portal")}
        </span>
      </div>

      <div className="flex items-start gap-2.5 border-b border-line bg-amberx-100/60 px-6 py-3 text-xs leading-relaxed text-amberx-600">
        <InfoIcon size={15} className="mt-0.5 shrink-0" />
        <p>{t("local_data_note")}</p>
      </div>

      <div className="border-b border-line bg-paper/40 px-6 py-3">
        <div className="relative max-w-md">
          <SearchIcon size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input className="input ps-9" placeholder={t("search_students")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="p-6"><EmptyState icon={<UsersIcon size={22} />} text={t("no_students")} /></div>
      ) : visible.length === 0 ? (
        <div className="p-6"><EmptyState icon={<SearchIcon size={22} />} text={t("no_match")} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper/70 text-xs text-ink-soft">
                <th className="px-6 py-3 text-start font-bold">{t("name_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("email_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("university_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("college_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("department_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("level_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("attempts_n")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("avg_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("registered_col")}</th>
                <th className="px-6 py-3 text-start font-bold">{t("actions_col")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const atts = attempts.filter((a) => a.studentEmail === s.email).sort((a, b) => b.date - a.date);
                const avg = atts.length ? Math.round(atts.reduce((x, a) => x + a.percent, 0) / atts.length) : 0;
                const open = expanded === s.email;
                return (
                  <FragmentRow key={s.email}>
                    <tr className={"border-t border-line transition-colors " + (open ? "bg-pulse-100/40" : "hover:bg-pulse-100/30")}>
                      <td className="px-6 py-3 font-semibold">{s.name}</td>
                      <td className="px-3 py-3 text-xs" dir="ltr">{s.email}</td>
                      <td className="px-3 py-3 text-xs">{bi(findUniversity(s.university)?.name ?? { ar: "—", en: "—" })}</td>
                      <td className="px-3 py-3 text-xs">{bi(findCollege(s.college)?.name ?? { ar: "—", en: "—" })}</td>
                      <td className="px-3 py-3 text-xs">{bi(findDept(s.college, s.department)?.name ?? { ar: "—", en: "—" })}</td>
                      <td className="px-3 py-3 text-xs">{s.year ?? "—"}</td>
                      <td className="px-3 py-3 font-bold tabular-nums">{atts.length}</td>
                      <td className="px-3 py-3">
                        {atts.length ? (
                          <span className="font-display font-bold tabular-nums" style={{ color: avg >= 60 ? "#1E8A56" : "#C4473E" }}>{avg}٪</span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-ink-soft">{formatDate(s.createdAt, lang)}</td>
                      <td className="px-6 py-3">
                        <span className="flex gap-1.5">
                          <button
                            onClick={() => setExpanded(open ? null : s.email)}
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-bold transition-colors hover:border-pulse-500 hover:text-pulse-700"
                          >
                            <EyeIcon size={12} /> {t("view_report")}
                          </button>
                          <button
                            onClick={() => setToDelete(s)}
                            className="rounded-lg border border-line bg-white p-1.5 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
                            aria-label={t("delete")}
                          >
                            <TrashIcon size={13} />
                          </button>
                        </span>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-t border-dashed border-line bg-paper/60">
                        <td colSpan={10} className="px-6 py-4">
                          {atts.length === 0 ? (
                            <p className="text-xs text-ink-soft">{t("no_attempts_yet")}</p>
                          ) : (
                            <div className="space-y-1.5">
                              {atts.map((a) => (
                                <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-2 text-xs shadow-sm">
                                  <span className="font-bold">{bi(a.examTitle)}</span>
                                  <span className="text-ink-soft">{formatDate(a.date, lang)}</span>
                                  <span className="ms-auto font-display text-sm font-bold tabular-nums" style={{ color: a.passed ? "#1E8A56" : "#C4473E" }}>{a.percent}٪</span>
                                  <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (a.passed ? "bg-moss-100 text-moss-700" : "bg-blood-100 text-blood-700")}>
                                    {a.passed ? t("passed") : t("failed")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3 className="font-display text-xl font-bold">{t("confirm_delete_student")}</h3>
        <p className="mt-2 text-sm text-ink-soft">{toDelete?.name} — {toDelete?.email}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setToDelete(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button
            onClick={() => {
              if (toDelete) onDelete(toDelete.email);
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

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/* ═══════════ التقارير ═══════════ */

function Reports({ exams, attempts }: { exams: ExamDef[]; attempts: Attempt[] }) {
  const { t, bi, lang } = useI18n();
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const exam = exams.find((e) => e.id === examId);
  const list = attempts.filter((a) => a.examId === examId).sort((a, b) => b.percent - a.percent);

  const stats = useMemo(() => {
    if (list.length === 0) return { avg: 0, pass: 0, top: null as Attempt | null };
    const avg = Math.round(list.reduce((s, a) => s + a.percent, 0) / list.length);
    const pass = Math.round((list.filter((a) => a.passed).length / list.length) * 100);
    return { avg, pass, top: list[0] };
  }, [list]);

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-3 p-5">
        <AwardIcon size={20} className="text-pulse-600" />
        <h2 className="font-display text-xl font-bold">{t("reports_tab")}</h2>
        <select className="input ms-auto max-w-xs" value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="" disabled>{t("choose_exam")}</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{bi(e.title)}</option>
          ))}
        </select>
      </div>

      {!exam ? (
        <EmptyState icon={<AwardIcon size={22} />} text={t("choose_exam")} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <ReportCell label={t("takers")} value={String(list.length)} />
            <ReportCell label={t("avg_percent")} value={`${stats.avg}٪`} tone={stats.avg >= exam.passPercent ? "#1E8A56" : "#C4473E"} />
            <ReportCell label={t("pass_rate")} value={`${stats.pass}٪`} />
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h3 className="font-display text-lg font-bold">{bi(exam.title)}</h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                {t("pass_mark")} {exam.passPercent}٪
                {exam.negativeMarking && ` · ${t("negative_badge")} −${exam.deduction}`}
                {stats.top && ` · ${t("top_scorer")}: ${stats.top.studentName} (${stats.top.percent}٪)`}
              </p>
            </div>
            {list.length === 0 ? (
              <div className="p-6"><EmptyState icon={<SheetIcon size={22} />} text={t("no_attempts_exam")} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-paper/70 text-xs text-ink-soft">
                      <th className="px-6 py-3 text-start font-bold">#</th>
                      <th className="px-3 py-3 text-start font-bold">{t("name_col")}</th>
                      <th className="px-3 py-3 text-start font-bold">{t("score_col")}</th>
                      <th className="px-3 py-3 text-start font-bold">{t("raw_score")}</th>
                      <th className="px-3 py-3 text-start font-bold">{t("result_col")}</th>
                      <th className="px-6 py-3 text-start font-bold">{t("date_col")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((a, i) => (
                      <tr key={a.id} className="border-t border-line transition-colors hover:bg-pulse-100/30">
                        <td className="px-6 py-3 font-display font-bold text-ink-soft">{i + 1}</td>
                        <td className="px-3 py-3 font-semibold">{a.studentName}</td>
                        <td className="px-3 py-3 font-display text-base font-bold tabular-nums" style={{ color: a.passed ? "#1E8A56" : "#C4473E" }}>{a.percent}٪</td>
                        <td className="px-3 py-3 text-xs tabular-nums text-ink-soft">{a.rawScore}/{a.total}</td>
                        <td className="px-3 py-3">
                          <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold " + (a.passed ? "bg-moss-100 text-moss-700" : "bg-blood-100 text-blood-700")}>
                            {a.passed ? <CheckIcon size={10} /> : <XIcon size={10} />}
                            {a.passed ? t("passed") : t("failed")}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-ink-soft">{formatDate(a.date, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReportCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="font-display text-3xl font-bold tabular-nums" style={{ color: tone ?? "#152722" }}>{value}</p>
      <p className="mt-1 text-xs font-bold text-ink-soft">{label}</p>
    </div>
  );
}
