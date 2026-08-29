import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Account } from "../types";
import { useI18n } from "../i18n";
import { allUniversities, collegesOf, findCollege, yearOptions } from "../data/hierarchy";
import { isCloudAuth } from "../lib/authProvider";
import EcgLine from "./EcgLine";
import { KiurWordmark, LangSwitch, SearchableSelect } from "./ui";
import { ClipboardIcon, EyeIcon, GradCapIcon, KeyIcon, ShieldIcon, StethoIcon, UserIcon, XIcon } from "./icons";

interface AuthProps {
  accounts: Account[];
  stats: { questions: number; exams: number; students: number };
  onLogin: (email: string, password: string) => string | null | Promise<string | null>;
  onRegister: (acc: Account) => string | null | Promise<string | null>;
}

export default function Auth({ accounts, stats, onLogin, onRegister }: AuthProps) {
  const { t, bi } = useI18n();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  /* التسلسل الأكاديمي: جامعة ← كلية ← قسم ← مرحلة */
  const [university, setUniversity] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("1");
  const uniColleges = collegesOf(university);
  const curCollege = findCollege(college);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const [tipIdx, setTipIdx] = useState(0);
  const tips = [t("auth_pitch1"), t("auth_pitch2"), t("auth_pitch3")];
  useEffect(() => {
    const iv = setInterval(() => setTipIdx((i) => (i + 1) % tips.length), 3500);
    return () => clearInterval(iv);
  }, [tips.length]);

  const fail = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const cloud = isCloudAuth();

  /* ── حماية من التخمين: قفل مؤقت بعد 5 محاولات فاشلة (يصمد عبر إعادة التحميل) ── */
  const FAILS_KEY = "kiur.login.fails";
  const MAX_FAILS = 5;
  const LOCK_MS = 60_000;
  const [fails, setFails] = useState<{ count: number; lockUntil: number }>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAILS_KEY) ?? "") as { count: number; lockUntil: number };
    } catch {
      return { count: 0, lockUntil: 0 };
    }
  });
  const [lockLeft, setLockLeft] = useState(0);
  useEffect(() => {
    const left = Math.max(0, Math.ceil((fails.lockUntil - Date.now()) / 1000));
    setLockLeft(left);
    if (left <= 0) return;
    const iv = setInterval(() => {
      const l = Math.max(0, Math.ceil((fails.lockUntil - Date.now()) / 1000));
      setLockLeft(l);
      if (l <= 0) {
        clearInterval(iv);
        setFails((f) => ({ ...f, lockUntil: 0, count: 0 }));
      }
    }, 500);
    return () => clearInterval(iv);
  }, [fails.lockUntil]);

  const saveFails = (v: { count: number; lockUntil: number }) => {
    setFails(v);
    try {
      localStorage.setItem(FAILS_KEY, JSON.stringify(v));
    } catch {
      /* التخزين غير متاح */
    }
  };

  /* ── قوة كلمة المرور: طول + تنوع ── */
  const pwScore = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Zأ-ي]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9\u0600-\u06FF]/.test(password)) s++;
    return Math.min(4, s);
  }, [password]);
  const pwMeta = [
    { label: t("pw_weak"), cls: "bg-blood-600" },
    { label: t("pw_weak"), cls: "bg-blood-600" },
    { label: t("pw_fair"), cls: "bg-amberx-500" },
    { label: t("pw_good"), cls: "bg-pulse-500" },
    { label: t("pw_strong"), cls: "bg-moss-600" },
  ][pwScore];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const mail = email.trim().toLowerCase();
    if (mode === "register" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      fail(t("invalid_email"));
      return;
    }

    /* قفل التخمين — يُطبَّق قبل أي محاولة */
    if (fails.lockUntil > Date.now()) {
      fail(`${t("login_locked")} ${lockLeft} ${t("seconds_word")}`);
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        const err = await onLogin(mail, password);
        if (err) {
          const next = fails.count + 1;
          if (next >= MAX_FAILS) {
            saveFails({ count: 0, lockUntil: Date.now() + LOCK_MS });
            fail(`${t("login_locked")} 60 ${t("seconds_word")}`);
          } else {
            saveFails({ count: next, lockUntil: 0 });
            fail(t(err) + (next >= 3 ? ` — ${t("attempts_left")} ${MAX_FAILS - next}` : ""));
          }
        } else {
          saveFails({ count: 0, lockUntil: 0 });
        }
      } else {
        if (!name.trim() || !mail || password.length < 4 || !university || !college) {
          fail(t("required_fields"));
          return;
        }
        /* في الوضع السحابي تشترط كلمة مرور قوية (8+ أحرف وتنوع) */
        if (cloud && (password.length < 8 || pwScore < 2)) {
          fail(t("weak_password"));
          return;
        }
        const err = await onRegister({
          name: name.trim(),
          email: mail,
          password,
          role: "student",
          university,
          college,
          department: department || undefined,
          year,
          createdAt: Date.now(),
        });
        if (err) fail(t(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* ───── جهة الشاشة الحيوية ───── */}
      <aside className="monitor-band relative hidden flex-col justify-between overflow-hidden text-paper lg:flex">
        <div className="relative z-10 p-10">
          <KiurWordmark dark size="lg" />
          <p className="mt-3 max-w-md text-lg leading-relaxed text-pulse-300/90">{t("tagline")}</p>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            <div className="anim-fade-up" style={{ animationDelay: "0.15s" }}>
              <Vital label={t("questions_n")} value={stats.questions} />
            </div>
            <div className="anim-fade-up" style={{ animationDelay: "0.25s" }}>
              <Vital label={t("exams_n")} value={stats.exams} />
            </div>
            <div className="anim-fade-up" style={{ animationDelay: "0.35s" }}>
              <Vital label={t("students_n")} value={stats.students} />
            </div>
          </div>

          <div className="mt-10 max-w-md rounded-xl border border-pine-700 bg-pine-800/60 p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-pulse-300/70 uppercase">
              <span className="blink-dot h-2 w-2 rounded-full bg-pulse-500" />
              {t("monitor_live")}
            </div>
            <p key={tipIdx} className="anim-fade-up mt-2 min-h-10 text-sm leading-relaxed text-pulse-100">
              <StethoIcon size={16} className="me-1.5 inline text-amberx-500" />
              {tips[tipIdx]}
            </p>
          </div>
        </div>

        <div className="relative z-10">
          {/* تخطيط القلب يتسارع أثناء معالجة الدخول — نبض المنصة يستجيب */}
          <EcgLine className="h-24 w-full text-pulse-300" speed={busy ? 1.4 : 5} />
          <div className="monitor-band border-t border-pine-700/60 px-10 py-4 text-xs text-pulse-300/60">
            KIUR © {new Date().getFullYear()} — {t("tagline")}
          </div>
        </div>
      </aside>

      {/* ───── جهة النموذج ───── */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className={"w-full max-w-md " + (shaking ? "anim-shake" : "anim-fade-up")}>
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <KiurWordmark size="md" />
            <LangSwitch />
          </div>
          <div className="mb-6 hidden justify-end lg:flex">
            <LangSwitch />
          </div>

          <div className="card p-7 sm:p-8">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="blink-dot h-2 w-2 rounded-full bg-pulse-500" />
              <span className="text-[11px] font-bold tracking-widest text-pulse-600 uppercase">{t("monitor_live")}</span>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={
                    "rounded-lg py-2.5 font-display text-sm font-bold transition-all duration-200 " +
                    (mode === m ? "bg-pine-900 text-pulse-300 shadow-md" : "text-ink-soft hover:text-ink")
                  }
                >
                  {m === "login" ? t("login") : t("register")}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="lbl">{t("full_name")}</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                    <input className="input ps-9" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
              )}

              <div>
                <label className="lbl">{t("email")}</label>
                <div className="relative">
                  <KeyIcon size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                  <input
                    className="input ps-9"
                    dir="ltr"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@kiur.edu"
                  />
                </div>
              </div>

              <div>
                <label className="lbl">{t("password")}</label>
                <div className="relative">
                  <ShieldIcon size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                  <input
                    className="input pe-10 ps-9"
                    dir="ltr"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-soft/70 transition-colors hover:text-pulse-700"
                    title={showPw ? t("hide_pw") : t("show_pw")}
                    aria-label={showPw ? t("hide_pw") : t("show_pw")}
                  >
                    {showPw ? <XIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>

                {/* مقياس قوة كلمة المرور عند التسجيل */}
                {mode === "register" && password.length > 0 && (
                  <div className="anim-fade-up mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={
                            "h-1.5 flex-1 rounded-full transition-colors duration-300 " +
                            (i < pwScore ? pwMeta.cls : "bg-line")
                          }
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-ink-soft">
                      {t("pw_strength")}: <span className="text-ink">{pwMeta.label}</span>
                    </p>
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div className="anim-fade-up grid grid-cols-2 gap-3">
                  <div>
                    <label className="lbl">{t("university_col")} ★</label>
                    <SearchableSelect
                      options={allUniversities().map((u) => ({ value: u.id, label: bi(u.name), sub: u.id }))}
                      value={university}
                      onChange={(v) => {
                        setUniversity(v);
                        setCollege("");
                        setDepartment("");
                        setYear("1");
                      }}
                      placeholder={t("select_hint")}
                      searchPlaceholder={t("search_uni")}
                    />
                  </div>
                  <div>
                    <label className="lbl">{t("college")} ★</label>
                    <select
                      className="input"
                      value={college}
                      disabled={!university}
                      onChange={(e) => {
                        setCollege(e.target.value);
                        setDepartment("");
                        setYear("1");
                      }}
                    >
                      <option value="">{t("select_hint")}</option>
                      {uniColleges.map((c) => (
                        <option key={c.id} value={c.id}>{bi(c.name)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="lbl">{t("department_col")}</label>
                    <SearchableSelect
                      options={(curCollege?.depts ?? []).map((d) => ({ value: d.id, label: bi(d.name) }))}
                      value={department}
                      onChange={setDepartment}
                      placeholder={t("general_dept")}
                      searchPlaceholder={t("search_dept")}
                      disabled={!college}
                    />
                  </div>
                  <div>
                    <label className="lbl">{t("level_col")} ★</label>
                    <select className="input" value={year} disabled={!college} onChange={(e) => setYear(e.target.value)}>
                      {yearOptions(college).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <p className="anim-pop rounded-lg border border-blood-600/30 bg-blood-100 px-3 py-2 text-sm font-semibold text-blood-700">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base disabled:opacity-60">
                <GradCapIcon size={18} />
                {busy ? t("working") : mode === "login" ? t("signin") : t("create_account")}
              </button>

              {cloud && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-moss-700">
                  <ShieldIcon size={13} />
                  {t("auth_cloud_on")}
                </p>
              )}
            </form>

            <p className="mt-5 text-center text-xs text-ink-soft">
              {mode === "login" ? t("no_account_q") : t("have_account_q")}{" "}
              <button
                className="font-bold text-pulse-700 underline-offset-2 hover:underline"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? t("register") : t("login")}
              </button>
            </p>
          </div>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-ink-soft lg:hidden">
            <ClipboardIcon size={13} className="text-pulse-600" />
            {t("tagline")} — KIUR
          </p>
        </div>
      </main>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-pine-700 bg-pine-800/60 p-3 text-center">
      <p className="vital-num text-3xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold tracking-widest text-pulse-300/70 uppercase">{label}</p>
    </div>
  );
}
