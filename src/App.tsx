import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Account, Attempt, AuditEntry, CustomUniversity, ExamDef, ExamResult, Lang, Question, SavedSession,
} from "./types";
import {
  ACCOUNTS_SEED, ADMIN_SEED, ATTEMPTS_SEED, EXAMS_SEED, QUESTIONS_SEED,
} from "./data/seed";
import { grade, hashStr, KEYS, load, save, shuffleSeeded, uid } from "./lib/store";
import { registerCustomUniversities } from "./data/hierarchy";
import { I18nProvider } from "./i18n";
import Auth from "./components/Auth";
import StudentDashboard from "./student/StudentDashboard";
import AdminDashboard from "./admin/AdminDashboard";
import TakeExam from "./exam/TakeExam";
import ExamResults from "./exam/ExamResults";

type Screen = "auth" | "home" | "exam" | "results";

function initOnce<T>(key: string, seed: T): T {
  const existing = load<T | null>(key, null);
  if (existing) return existing;
  save(key, seed);
  return seed;
}

export default function App() {
  /* ── اللغة ── */
  const [lang, setLangState] = useState<Lang>(() => load<Lang>(KEYS.lang, "ar"));
  const setLang = (l: Lang) => {
    setLangState(l);
    save(KEYS.lang, l);
  };
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  /* ── البيانات ── */
  const [questions, setQuestions] = useState<Question[]>(() => initOnce(KEYS.questions, QUESTIONS_SEED));
  const [exams, setExams] = useState<ExamDef[]>(() => initOnce(KEYS.exams, EXAMS_SEED));
  const [accounts, setAccounts] = useState<Account[]>(() => initOnce(KEYS.accounts, ACCOUNTS_SEED));
  const [attempts, setAttempts] = useState<Attempt[]>(() => initOnce(KEYS.attempts, ATTEMPTS_SEED));
  const [sessions, setSessions] = useState<SavedSession[]>(() => load(KEYS.sessions, [] as SavedSession[]));
  const [audit, setAudit] = useState<AuditEntry[]>(() => load(KEYS.audit, [] as AuditEntry[]));
  const [customUnis, setCustomUnis] = useState<CustomUniversity[]>(() => load(KEYS.universities, [] as CustomUniversity[]));

  /* تسجيل الجامعات المخصصة في نظام التسلسل لتظهر فورًا في كل القوائم */
  useEffect(() => {
    registerCustomUniversities(customUnis);
    save(KEYS.universities, customUnis);
  }, [customUnis]);
  const [user, setUser] = useState<Account | null>(() => {
    const email = load<string | null>(KEYS.user, null);
    if (!email) return null;
    return load<Account[]>(KEYS.accounts, []).find((a) => a.email === email) ?? null;
  });

  useEffect(() => { save(KEYS.questions, questions); }, [questions]);
  useEffect(() => { save(KEYS.exams, exams); }, [exams]);
  useEffect(() => { save(KEYS.accounts, accounts); }, [accounts]);
  useEffect(() => { save(KEYS.attempts, attempts); }, [attempts]);
  useEffect(() => { save(KEYS.sessions, sessions); }, [sessions]);
  useEffect(() => { save(KEYS.audit, audit); }, [audit]);

  /* ── سجل التدقيق: من أضاف وعدّل وحذف ── */
  const logAudit = useCallback(
    (action: AuditEntry["action"], target: AuditEntry["target"], title: string, details?: string) => {
      if (!user) return;
      setAudit((prev) =>
        [
          {
            id: uid("au-"),
            date: Date.now(),
            actorEmail: user.email,
            actorName: user.name,
            actorRole: user.role,
            action,
            target,
            title,
            details,
          },
          ...prev,
        ].slice(0, 400)
      );
    },
    [user]
  );

  /* ── الشاشات ── */
  const [screen, setScreen] = useState<Screen>(user ? "home" : "auth");
  const [active, setActive] = useState<{ exam: ExamDef; session: SavedSession } | null>(null);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [lastAttempt, setLastAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  /* ── المصادقة ── */
  const login = (email: string, password: string): string | null => {
    const acc = accounts.find((a) => a.email === email);
    if (!acc || acc.password !== password) return "wrong_creds";
    setUser(acc);
    save(KEYS.user, acc.email);
    setScreen("home");
    return null;
  };

  const register = (acc: Account): string | null => {
    if (accounts.some((a) => a.email === acc.email)) return "email_exists";
    if (acc.email === ADMIN_SEED.email) return "email_exists";
    setAccounts((prev) => [...prev, acc]);
    setUser(acc);
    save(KEYS.user, acc.email);
    setScreen("home");
    return null;
  };

  const logout = () => {
    setUser(null);
    save(KEYS.user, null);
    setScreen("auth");
    setActive(null);
  };

  /* ── بدء الاختبار ── */
  const buildSession = useCallback(
    (exam: ExamDef, email: string): SavedSession | null => {
      let pool: Question[];
      if (exam.questionIds.length > 0) {
        pool = exam.questionIds
          .map((id) => questions.find((q) => q.id === id))
          .filter((q): q is Question => !!q);
      } else {
        pool = questions.filter(
          (q) =>
            (exam.subjectIds.length === 0 || exam.subjectIds.includes(q.subject)) &&
            exam.questionTypes.includes(q.type)
        );
      }
      /* تشويش مُبذّر ببصمة الطالب + اللحظة: ترتيب فريد لكل طالب ولكل محاولة
         حتى لو دخل طالبان الاختبار في الثانية نفسها */
      const seed = hashStr(email) ^ (Date.now() & 0xffffff);
      const picked = (exam.shuffleQuestions ? shuffleSeeded(pool, seed) : pool).slice(
        0,
        exam.questionIds.length > 0 ? pool.length : Math.min(exam.count, pool.length)
      );
      if (picked.length === 0) return null;
      return {
        id: uid("s-"),
        examId: exam.id,
        studentEmail: email,
        questionIds: picked.map((q) => q.id),
        optionOrders: picked.map((q, qi) => {
          const base = q.options.map((_, i) => i);
          return (q.type === "mcq" || q.type === "case") && exam.shuffleOptions
            ? shuffleSeeded(base, seed + qi * 7919)
            : base;
        }),
        answers: picked.map(() => null),
        flags: picked.map(() => false),
        currentIndex: 0,
        remainingSec: exam.minutes > 0 ? exam.minutes * 60 : null,
        startedAt: Date.now(),
        savedAt: Date.now(),
      };
    },
    [questions]
  );

  const startExam = (exam: ExamDef) => {
    if (!user) return;
    const session = buildSession(exam, user.email);
    if (!session) return;
    setSessions((prev) => [...prev.filter((s) => !(s.examId === exam.id && s.studentEmail === user.email)), session]);
    setActive({ exam, session });
    setScreen("exam");
  };

  const resumeSession = (session: SavedSession) => {
    const exam = exams.find((e) => e.id === session.examId);
    if (!exam) return;
    const alive = session.questionIds.some((id) => questions.some((q) => q.id === id));
    if (!alive) {
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      return;
    }
    setActive({ exam, session });
    setScreen("exam");
  };

  /* ── التسليم ── */
  const finishExam = (result: ExamResult) => {
    if (!user) return;
    const items = result.items.map((it) => ({ q: it.q, answer: it.answer }));
    const g = grade(items, result.exam.negativeMarking, result.exam.deduction);
    const attempt: Attempt = {
      id: uid("at-"),
      examId: result.exam.id,
      examTitle: result.exam.title,
      studentEmail: user.email,
      studentName: user.name,
      date: Date.now(),
      total: items.length,
      correct: g.correct,
      wrong: g.wrong,
      skipped: g.skipped,
      rawScore: g.rawScore,
      percent: g.percent,
      passPercent: result.exam.passPercent,
      passed: g.percent >= result.exam.passPercent,
      durationSec: result.durationSec,
      negative: result.exam.negativeMarking,
      deduction: result.exam.deduction,
      perSubject: g.perSubject,
        review: result.items.map((it) => ({ qid: it.q.id, order: it.order, answer: it.answer })),
        autoSubmitted: result.autoSubmitted,
        exits: result.exits,
      };    setAttempts((prev) => [attempt, ...prev]);
    setSessions((prev) => prev.filter((s) => !(s.examId === result.exam.id && s.studentEmail === user.email)));
    setLastResult(result);
    setLastAttempt(attempt);
    setActive(null);
    setScreen("results");
  };

  /* ── إدارة ── */
  const saveExam = (e: ExamDef) => {
    const isNew = !exams.some((x) => x.id === e.id);
    setExams((prev) => (prev.some((x) => x.id === e.id) ? prev.map((x) => (x.id === e.id ? e : x)) : [e, ...prev]));
    logAudit(isNew ? "create" : "update", "exam", e.title.ar || e.title.en,
      `${e.count} ${e.questionIds.length ? "(manual)" : ""} · pass ${e.passPercent}٪`);
  };
  const deleteExam = (id: string) => {
    const gone = exams.find((e) => e.id === id);
    setExams((prev) => prev.filter((e) => e.id !== id));
    setSessions((prev) => prev.filter((s) => s.examId !== id));
    if (gone) logAudit("delete", "exam", gone.title.ar || gone.title.en);
  };
  const saveQuestion = (q: Question) => {
    const isNew = !questions.some((x) => x.id === q.id);
    setQuestions((prev) => (prev.some((x) => x.id === q.id) ? prev.map((x) => (x.id === q.id ? q : x)) : [q, ...prev]));
    logAudit(isNew ? "create" : "update", "question", q.text.ar || q.text.en, q.type);
  };
  const deleteQuestion = (id: string) => {
    const gone = questions.find((x) => x.id === id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (gone) logAudit("delete", "question", gone.text.ar || gone.text.en);
  };
  const importQuestions = (qs: Question[]) => {
    setQuestions((prev) => [...qs, ...prev]);
    logAudit("import", "question", `${qs.length} × MCQ`, qs[0]?.text.ar ?? "");
  };
  const deleteStudent = (email: string) => {
    const gone = accounts.find((a) => a.email === email);
    setAccounts((prev) => prev.filter((a) => a.email !== email));
    setAttempts((prev) => prev.filter((a) => a.studentEmail !== email));
    setSessions((prev) => prev.filter((s) => s.studentEmail !== email));
    if (gone) logAudit("delete", "student", gone.name, email);
  };

  /* ── إدارة المشرفين (المالك فقط) ── */
  const saveAdmin = (acc: Account) => {
    const isNew = !accounts.some((a) => a.email === acc.email);
    setAccounts((prev) =>
      prev.some((a) => a.email === acc.email)
        ? prev.map((a) => (a.email === acc.email ? acc : a))
        : [...prev, acc]
    );
    logAudit(isNew ? "create" : "grant", "admin", acc.name, (acc.perms ?? []).join(", ") || "—");
  };
  const deleteAdmin = (email: string) => {
    const gone = accounts.find((a) => a.email === email);
    setAccounts((prev) => prev.filter((a) => a.email !== email));
    if (gone) logAudit("delete", "admin", gone.name, email);
  };
  const demoteAdmin = (email: string) => {
    const gone = accounts.find((a) => a.email === email);
    setAccounts((prev) =>
      prev.map((a) => (a.email === email ? { ...a, role: "student" as const, perms: undefined } : a))
    );
    if (gone) logAudit("update", "admin", gone.name, "demote → student");
  };

  /* ── الجامعات المخصصة ── */
  const addUniversity = (u: CustomUniversity) => {
    setCustomUnis((prev) => [...prev, u]);
    logAudit("create", "admin", u.name.ar, `university · ${u.collegeIds.length} colleges`);
  };
  const deleteUniversity = (id: string) => {
    const gone = customUnis.find((u) => u.id === id);
    setCustomUnis((prev) => prev.filter((u) => u.id !== id));
    if (gone) logAudit("delete", "admin", gone.name.ar, "university");
  };

  const authStats = useMemo(
    () => ({
      questions: questions.length,
      exams: exams.filter((e) => e.published).length,
      students: accounts.filter((a) => a.role === "student").length,
    }),
    [questions, exams, accounts]
  );

  /* ── العرض ── */
  let view: React.ReactNode;

  if (!user || screen === "auth") {
    view = <Auth accounts={accounts} stats={authStats} onLogin={login} onRegister={register} />;
  } else if (screen === "exam" && active) {
    view = (
      <TakeExam
        exam={active.exam}
        session={active.session}
        bank={questions}
        onFinish={finishExam}
        onExit={(savedIt) => {
          setActive(null);
          setScreen("home");
          if (!savedIt) {
            setSessions((prev) =>
              prev.filter((s) => !(s.examId === active.exam.id && s.studentEmail === user.email))
            );
          }
        }}
      />
    );
  } else if (screen === "results" && lastResult && lastAttempt) {
    view = (
      <ExamResults
        result={lastResult}
        attempt={lastAttempt}
        bank={questions}
        studentName={user.name}
        onRetry={() => {
          const exam = exams.find((e) => e.id === lastResult.exam.id);
          if (exam) startExam(exam);
        }}
        onHome={() => setScreen("home")}
      />
    );
  } else if (user.role === "admin" || user.role === "owner") {
    view = (
      <AdminDashboard
        user={user}
        questions={questions}
        exams={exams}
        attempts={attempts}
        accounts={accounts}
        audit={audit}
        customUniversities={customUnis}
        onAddUniversity={addUniversity}
        onDeleteUniversity={deleteUniversity}
        onSaveExam={saveExam}
        onDeleteExam={deleteExam}
        onSaveQuestion={saveQuestion}
        onDeleteQuestion={deleteQuestion}
        onImportQuestions={importQuestions}
        onDeleteStudent={deleteStudent}
        onSaveAdmin={saveAdmin}
        onDeleteAdmin={deleteAdmin}
        onDemoteAdmin={demoteAdmin}
        onLogout={logout}
      />
    );
  } else {
    view = (
      <StudentDashboard
        user={user}
        exams={exams}
        questions={questions}
        attempts={attempts}
        sessions={sessions}
        onStart={startExam}
        onResume={resumeSession}
        onLogout={logout}
      />
    );
  }

  return <I18nProvider lang={lang} setLang={setLang}>{view}</I18nProvider>;
}
