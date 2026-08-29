import { useMemo, useState } from "react";
import type { Account, Attempt, ExamDef, Question, SavedSession, ShareRequest, SubjectId } from "../types";
import { useI18n } from "../i18n";
import { CLINICAL_TIPS, SUBJECTS, subjectById } from "../data/seed";
import { findCollege, findDept, findUniversity } from "../data/hierarchy";
import EcgLine from "../components/EcgLine";
import { EmptyState, KiurWordmark, LangSwitch, Modal, Reveal, SubjectTag, TypeBadge, formatDate } from "../components/ui";
import { AttemptReviewModal } from "../exam/ExamResults";
import {
  AwardIcon, ChartIcon, CheckIcon, ClipboardIcon, ClockIcon, EyeIcon,
  GradCapIcon, HeartPulseIcon, LayersIcon, LogoutIcon, SaveIcon, SearchIcon, ShareIcon, StethoIcon, TargetIcon, XIcon,
} from "../components/icons";

export function effectiveCount(exam: ExamDef, bank: Question[]): number {
  if (exam.questionIds.length > 0) {
    return exam.questionIds.filter((id) => bank.some((q) => q.id === id)).length;
  }
  const pool = bank.filter(
    (q) =>
      (exam.subjectIds.length === 0 || exam.subjectIds.includes(q.subject)) &&
      exam.questionTypes.includes(q.type)
  );
  return Math.min(exam.count, pool.length);
}

interface Props {
  user: Account;
  exams: ExamDef[];
  questions: Question[];
  attempts: Attempt[];
  sessions: SavedSession[];
  /** اللمحات السريرية التي نشرها المالك للطلبة */
  vignettes: { ar: string; en: string }[];
  shares: ShareRequest[];
  accounts: Account[];
  onStart: (exam: ExamDef) => void;
  onResume: (session: SavedSession) => void;
  onLogout: () => void;
  onRequestShare: (examId: string, from: Account, to: Account) => string | null;
}

export default function StudentDashboard({ user, exams, questions, attempts, sessions, vignettes, shares, accounts, onStart, onResume, onLogout, onRequestShare }: Props) {
  const { t, bi, lang } = useI18n();
  const [reviewAttempt, setReviewAttempt] = useState<Attempt | null>(null);
  /* اللمحات المنشورة من المالك، مع الرجوع للبذور إن لم تُنشر أي لمحة */
  const tips = vignettes.length > 0 ? vignettes : CLINICAL_TIPS;
  const [tipIdx] = useState(() => Math.floor(Math.random() * Math.max(1, tips.length)));
  /* بحث الطالب عن الاختبارات والمقررات */
  const [q, setQ] = useState("");
  const [fSub, setFSub] = useState<"all" | SubjectId>("all");
  /* مشاركة الاختبارات */
  const [shareExam, setShareExam] = useState<ExamDef | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareErr, setShareErr] = useState<string | null>(null);
  const [shareOk, setShareOk] = useState(false);

  const submitShare = () => {
    if (!shareExam) return;
    setShareErr(null);
    const email = shareEmail.trim().toLowerCase();
    if (!email) return setShareErr(t("share_err_email"));
    const to = accounts.find((a) => a.role === "student" && a.email.toLowerCase() === email);
    if (!to) return setShareErr(t("share_err_notfound"));
    if (to.email === user.email) return setShareErr(t("share_err_self"));
    if (to.university === user.university) return setShareErr(t("share_err_same"));
    const pending = shares.some(
      (s) => s.examId === shareExam.id && s.toEmail === to.email && s.status === "pending"
    );
    if (pending) return setShareErr(t("share_err_dup"));
    const err = onRequestShare(shareExam.id, user, to);
    if (err) return setShareErr(t(err));
    setShareOk(true);
  };

  /* الاختبارات المُشاركة إلى هذا الطالب والمقبولة من المشرف */
  const sharedToMe = useMemo(
    () => new Set(
      shares
        .filter((s) => s.toEmail === user.email && s.status === "approved")
        .map((s) => s.examId)
    ),
    [shares, user.email]
  );
  const myShareReqs = useMemo(
    () => shares.filter((s) => s.fromEmail === user.email).sort((a, b) => b.requestedAt - a.requestedAt),
    [shares, user.email]
  );

  const mine = useMemo(
    () => attempts.filter((a) => a.studentEmail === user.email).sort((a, b) => b.date - a.date),
    [attempts, user.email]
  );

  const stats = useMemo(() => {
    if (mine.length === 0) return { n: 0, avg: 0, best: 0, passRate: 0 };
    const avg = Math.round(mine.reduce((s, a) => s + a.percent, 0) / mine.length);
    const best = Math.max(...mine.map((a) => a.percent));
    const passRate = Math.round((mine.filter((a) => a.passed).length / mine.length) * 100);
    return { n: mine.length, avg, best, passRate };
  }, [mine]);

  const resumable = sessions.find(
    (s) => s.studentEmail === user.email && exams.find((e) => e.id === s.examId)?.allowSaveResume
  );
  const resumeExam = resumable ? exams.find((e) => e.id === resumable.examId) : undefined;

  /* الطالب يرى: اختبارات جامعته + المشتركة + ما شُورك معه وقُبل من المشرف */
  const published = exams.filter(
    (e) =>
      e.published &&
      (e.university === "" || e.university === user.university || sharedToMe.has(e.id))
  );
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? (lang === "ar" ? "صباح الخير" : "Good morning") : hour < 18 ? (lang === "ar" ? "مساء النور" : "Good afternoon") : (lang === "ar" ? "مساء الخير" : "Good evening");

  return (
    <div>
      {/* ───── الرأس ───── */}
      <header className="monitor-band text-paper">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <KiurWordmark dark size="md" />
            <span className="rounded-full border border-pine-700 bg-pine-800/70 px-2.5 py-0.5 text-[11px] font-bold text-pulse-300">
              {t("student_dashboard")}
            </span>
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

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-sm text-pulse-300/80">
                {greeting}،
              </p>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{user.name}</h1>
              <p className="mt-1 text-xs leading-relaxed text-pulse-300/70">
                {[
                  findUniversity(user.university)?.name,
                  findCollege(user.college)?.name,
                  findDept(user.college, user.department)?.name,
                ]
                  .filter(Boolean)
                  .map((n) => bi(n!))
                  .join(" · ")}
                {user.year && <> · {t("level_word")} {user.year}</>}
              </p>

              <div className="mt-5 grid max-w-md grid-cols-4 gap-2.5">
                <VitalCell label={t("attempts_n")} value={stats.n} />
                <VitalCell label={t("avg_score")} value={`${stats.avg}٪`} />
                <VitalCell label={t("best_score")} value={`${stats.best}٪`} />
                <VitalCell label={t("pass_rate")} value={`${stats.passRate}٪`} />
              </div>
            </div>

            <div className="relative flex items-end overflow-hidden rounded-xl border border-pine-700 bg-pine-800/40">
              <div className="absolute inset-x-0 top-3 flex items-center gap-2 px-4">
                <span className="blink-dot h-2 w-2 rounded-full bg-pulse-500" />
                <span className="text-[10px] font-bold tracking-widest text-pulse-300/70 uppercase">{t("monitor_live")}</span>
                <span className="ms-auto font-display text-lg font-bold text-pulse-300 tabular-nums">{stats.avg || 72}<span className="text-[10px]"> BPM</span></span>
              </div>
              <EcgLine className="h-24 w-full text-pulse-300" speed={5.2} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
        {/* ───── استكمال ───── */}
        {resumable && resumeExam && (
          <section className="anim-fade-up rounded-xl border-2 border-amberx-500/60 bg-amberx-100 p-5 shadow-lg shadow-amberx-500/10">
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-amberx-500 text-white shadow-md">
                <SaveIcon size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold text-ink">{t("resume_banner")}</h2>
                <p className="text-sm text-ink-soft">
                  {bi(resumeExam.title)} — {t("resume_desc")}
                </p>
              </div>
              <button onClick={() => onResume(resumable)} className="btn-primary">
                {t("resume_exam")}
                <GradCapIcon size={16} />
              </button>
            </div>
          </section>
        )}

        {/* ───── الاختبارات المتاحة ───── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <ClipboardIcon size={20} className="text-pulse-600" />
            <h2 className="font-display text-2xl font-bold">{t("my_exams")}</h2>
            <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">{published.length}</span>
          </div>

          {published.length === 0 ? (
            <EmptyState icon={<ClipboardIcon size={22} />} text={t("no_published")} />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-56 flex-1">
                  <SearchIcon size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                  <input
                    className="input ps-9"
                    placeholder={t("search_exams")}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFSub("all")}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 " +
                      (fSub === "all" ? "bg-pine-900 text-pulse-300 shadow-md" : "bg-white text-ink-soft border border-line hover:border-pulse-500")
                    }
                  >
                    {t("all")}
                  </button>
                  {SUBJECTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFSub(fSub === s.id ? "all" : s.id)}
                      className={
                        "rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 " +
                        (fSub === s.id ? "text-white shadow-md" : "bg-white text-ink-soft border border-line hover:border-pulse-500")
                      }
                      style={fSub === s.id ? { backgroundColor: s.color } : undefined}
                    >
                      {bi(s.name)}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const text = q.trim().toLowerCase();
                const visible = published.filter((exam) => {
                  const matchSub =
                    fSub === "all" || exam.subjectIds.includes(fSub) || exam.subjectIds.length === 0;
                  const matchQ =
                    !text ||
                    bi(exam.title).toLowerCase().includes(text) ||
                    bi(exam.description).toLowerCase().includes(text) ||
                    exam.subjectIds.some((s) => {
                      const sub = subjectById(s);
                      return (
                        !!sub &&
                        (sub.name.ar.includes(q.trim()) || sub.name.en.toLowerCase().includes(text))
                      );
                    });
                  return matchSub && matchQ;
                });
                if (visible.length === 0)
                  return <EmptyState icon={<SearchIcon size={22} />} text={t("no_match")} />;
                return (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((exam, i) => {
                const n = effectiveCount(exam, questions);
                const disabled = n === 0;
                return (
                  <Reveal key={exam.id} delay={(i % 3) * 80} className="h-full">
                  <article
                    className="card group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${SUBJECTS[i % SUBJECTS.length].color}, #0E7C66)` }} />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap gap-1.5">
                        {exam.university && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amberx-100 px-2.5 py-1 text-xs font-bold text-amberx-600">
                            <GradCapIcon size={12} />
                            {bi(findUniversity(exam.university)?.name ?? { ar: exam.university, en: exam.university })}
                          </span>
                        )}
                        {sharedToMe.has(exam.id) && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-100 px-2.5 py-1 text-xs font-bold text-moss-700">
                            <ShareIcon size={12} /> {t("share_shared_to_you")}
                          </span>
                        )}
                        {exam.subjectIds.length === 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-900 px-2.5 py-1 text-xs font-semibold text-pulse-300">
                            <LayersIcon size={12} /> {t("all_subjects")}
                          </span>
                        ) : (
                          exam.subjectIds.map((s) => <SubjectTag key={s} id={s} small />)
                        )}
                      </div>
                      <h3 className="mt-3 font-display text-xl font-bold leading-snug">{bi(exam.title)}</h3>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{bi(exam.description)}</p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <MetaCell icon={<TargetIcon size={13} />} text={`${n} ${t("q_count")}`} />
                        <MetaCell icon={<ClockIcon size={13} />} text={exam.minutes > 0 ? `${exam.minutes} ${t("minutes_short")}` : t("no_time_limit")} />
                        <MetaCell icon={<CheckIcon size={13} />} text={`${t("pass_mark")} ${exam.passPercent}٪`} />
                        <MetaCell
                          icon={exam.negativeMarking ? <XIcon size={13} /> : <SaveIcon size={13} />}
                          text={exam.negativeMarking ? `${t("negative_badge")} −${exam.deduction}` : t("save_resume_on")}
                          tone={exam.negativeMarking ? "text-blood-700" : undefined}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {exam.questionTypes.map((qt) => <TypeBadge key={qt} type={qt} />)}
                        {exam.allowSaveResume && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amberx-100 px-2 py-0.5 text-[11px] font-bold text-amberx-600">
                            <SaveIcon size={11} /> {t("save_exit")}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => {
                            /* محاولة قفل النافذة بملء الشاشة قبل بدء الاختبار */
                            try {
                              document.documentElement.requestFullscreen?.().catch(() => {});
                            } catch {
                              /* غير مدعوم */
                            }
                            onStart(exam);
                          }}
                          disabled={disabled}
                          className="btn-primary flex-1"
                        >
                          <GradCapIcon size={17} />
                          {t("start_exam")}
                        </button>
                        {exam.university && (
                          <button
                            onClick={() => {
                              setShareExam(exam);
                              setShareEmail("");
                              setShareErr(null);
                              setShareOk(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-line bg-white px-3 text-sm font-bold text-ink-soft transition-all hover:border-pulse-500 hover:text-pulse-700"
                            title={t("share_student_title")}
                          >
                            <ShareIcon size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                  </Reveal>
                );
              })}
            </div>
                );
              })()}
            </>
          )}
        </section>

        {/* ───── طلبات مشاركاتي ───── */}
        {myShareReqs.length > 0 && (
          <section className="card anim-fade-up mt-6 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <ShareIcon size={19} className="text-pulse-600" />
              <h2 className="font-display text-xl font-bold">{t("share_my")}</h2>
            </div>
            <ul className="divide-y divide-line">
              {myShareReqs.map((s) => {
                const ex = exams.find((e) => e.id === s.examId);
                const meta =
                  s.status === "pending"
                    ? { label: t("share_status_pending"), cls: "bg-amberx-100 text-amberx-600" }
                    : s.status === "approved"
                      ? { label: t("share_status_approved"), cls: "bg-moss-100 text-moss-700" }
                      : { label: t("share_status_rejected"), cls: "bg-blood-100 text-blood-700" };
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-2 px-5 py-3 transition-colors hover:bg-pulse-100/20">
                    <span className="font-semibold">{ex ? bi(ex.title) : s.examId}</span>
                    <span className="text-xs text-ink-soft">→ {s.toName}</span>
                    <span className="ms-auto flex items-center gap-2">
                      <span className="text-[11px] text-ink-soft">{formatDate(s.requestedAt, lang)}</span>
                      <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + meta.cls}>{meta.label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ───── لمحة سريرية + السجل ───── */}
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Reveal className="h-fit">
            <aside className="h-fit rounded-xl border border-pine-700 bg-pine-900 p-5 text-paper transition-shadow duration-300 hover:shadow-lg hover:shadow-pine-950/30">
              <p className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-pulse-300/70 uppercase">
                <StethoIcon size={15} className="text-amberx-500" /> {t("clinical_tips")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-pulse-100">
                {lang === "ar" ? tips[tipIdx % tips.length].ar : tips[tipIdx % tips.length].en}
              </p>
              <EcgLine className="mt-4 h-10 w-full text-pulse-300/80" speed={7} />
            </aside>
          </Reveal>

          <Reveal delay={80}>
          <section className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <ChartIcon size={19} className="text-pulse-600" />
              <h2 className="font-display text-xl font-bold">{t("my_history")}</h2>
            </div>
            {mine.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<HeartPulseIcon size={22} />} text={t("no_attempts_yet")} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-paper/70 text-start text-xs text-ink-soft">
                      <th className="px-5 py-3 text-start font-bold">{t("exam_col")}</th>
                      <th className="px-3 py-3 text-start font-bold">{t("date_col")}</th>
                      <th className="px-3 py-3 text-start font-bold">{t("score_col")}</th>
                      <th className="px-3 py-3 text-start font-bold">{t("result_col")}</th>
                      <th className="px-5 py-3 text-start font-bold">{t("actions_col")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mine.map((a) => (
                      <tr key={a.id} className="border-t border-line transition-colors hover:bg-pulse-100/30">
                        <td className="px-5 py-3 font-semibold">{bi(a.examTitle)}</td>
                        <td className="px-3 py-3 text-xs text-ink-soft">{formatDate(a.date, lang)}</td>
                        <td className="px-3 py-3">
                          <span className="font-display text-base font-bold tabular-nums" style={{ color: a.passed ? "#1E8A56" : "#C4473E" }}>
                            {a.percent}٪
                          </span>
                          {a.negative && <span className="ms-1 text-[10px] text-ink-soft">({a.rawScore}/{a.total})</span>}
                        </td>
                        <td className="px-3 py-3">
                          <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold " + (a.passed ? "bg-moss-100 text-moss-700" : "bg-blood-100 text-blood-700")}>
                            {a.passed ? <CheckIcon size={11} /> : <XIcon size={11} />}
                            {a.passed ? t("passed") : t("failed")}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => setReviewAttempt(a)} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:border-pulse-500 hover:text-pulse-700">
                            <EyeIcon size={13} /> {t("review")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          </Reveal>
        </div>
      </main>

      <footer className="border-t border-line bg-paper/60 py-5 text-center text-xs text-ink-soft">
        KIUR © {new Date().getFullYear()} — {t("tagline")}
      </footer>

      {reviewAttempt && <AttemptReviewModal attempt={reviewAttempt} bank={questions} onClose={() => setReviewAttempt(null)} />}

      {/* ───── نافذة مشاركة الاختبار ───── */}
      <Modal open={!!shareExam} onClose={() => setShareExam(null)}>
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl font-bold">{t("share_student_title")}</h3>
          <button onClick={() => setShareExam(null)} className="rounded-lg p-1 text-ink-soft transition-colors hover:text-blood-600">
            <XIcon size={18} />
          </button>
        </div>
        {shareExam && (
          <p className="mt-1 text-sm font-semibold text-pulse-700">{bi(shareExam.title)}</p>
        )}

        {shareOk ? (
          <div className="anim-pop mt-4 rounded-xl border border-moss-600/40 bg-moss-100 p-4 text-center">
            <CheckIcon size={26} className="mx-auto text-moss-700" />
            <p className="mt-2 text-sm font-bold text-moss-700">{t("share_sent")}</p>
            <button onClick={() => setShareExam(null)} className="btn-primary mt-4 w-full">
              {t("close")}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <label className="lbl">{t("share_student_email")}</label>
              <input
                className="input"
                dir="ltr"
                type="email"
                placeholder="student@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitShare()}
              />
            </div>
            {shareErr && (
              <p className="anim-shake mt-2 rounded-lg bg-blood-100 px-3 py-2 text-xs font-bold text-blood-700">{shareErr}</p>
            )}
            <p className="mt-3 rounded-lg bg-paper/70 p-3 text-xs leading-relaxed text-ink-soft">{t("share_student_note")}</p>
            <button onClick={submitShare} className="btn-primary mt-4 w-full">
              <ShareIcon size={16} />
              {t("share_student_send")}
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}

function VitalCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-pine-700 bg-pine-800/60 px-2 py-3 text-center">
      <p className="vital-num text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-pulse-300/70">{label}</p>
    </div>
  );
}

function MetaCell({ icon, text, tone }: { icon: React.ReactNode; text: string; tone?: string }) {
  return (
    <span className={"flex items-center gap-1.5 rounded-lg bg-paper px-2.5 py-2 font-semibold text-ink-soft " + (tone ?? "")}>
      <span className="text-pulse-600">{icon}</span>
      {text}
    </span>
  );
}
