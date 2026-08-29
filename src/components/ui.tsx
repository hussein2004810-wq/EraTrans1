import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BiText, QType } from "../types";
import { useI18n } from "../i18n";
import { subjectById } from "../data/seed";
import type { SubjectId } from "../types";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "./icons";

export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pine-950/65 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={"card anim-pop relative max-h-[92vh] w-full overflow-y-auto p-6 " + (wide ? "max-w-3xl" : "max-w-md")}
      >
        {children}
      </div>
    </div>
  );
}

export function PrintPortal({ children }: { children: ReactNode }) {
  return createPortal(<div className="print-only-host">{children}</div>, document.body);
}

export interface SearchOpt {
  value: string;
  label: string;
  sub?: string;
}

/** قائمة اختيار قابلة للبحث — للجامعات والأقسام */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
}: {
  options: SearchOpt[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter(
    (o) =>
      q.trim() === "" ||
      o.label.toLowerCase().includes(q.trim().toLowerCase()) ||
      (o.sub ?? "").toLowerCase().includes(q.trim().toLowerCase())
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="input flex w-full items-center justify-between gap-2 text-start disabled:opacity-50"
      >
        <span className={selected ? "truncate" : "truncate text-ink-soft/70"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          size={16}
          className={"shrink-0 text-ink-soft transition-transform duration-200 " + (open ? "rotate-180" : "")}
        />
      </button>

      {open && (
        <div className="anim-pop absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-white shadow-xl shadow-pine-950/15">
          <div className="relative border-b border-line bg-paper/60">
            <SearchIcon size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full border-0 bg-transparent py-2.5 pe-3 ps-9 text-sm outline-none placeholder:text-ink-soft/50"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-center text-xs text-ink-soft">{t("no_options")}</li>
            ) : (
              filtered.map((o) => {
                const on = o.value === value;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                        setQ("");
                      }}
                      className={
                        "flex w-full items-center gap-2 px-3.5 py-2.5 text-start text-sm transition-colors " +
                        (on ? "bg-pulse-100 font-bold text-pulse-700" : "hover:bg-paper")
                      }
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{o.label}</span>
                        {o.sub && <span className="block truncate text-[11px] text-ink-soft">{o.sub}</span>}
                      </span>
                      {on && <CheckIcon size={15} className="shrink-0 text-pulse-600" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SubjectTag({ id, small = false }: { id: SubjectId; small?: boolean }) {
  const s = subjectById(id);
  const { bi } = useI18n();
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full font-semibold " +
        (small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs")
      }
      style={{ backgroundColor: s.color + "1c", color: s.color }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {bi(s.name)}
    </span>
  );
}

export function TypeBadge({ type }: { type: QType }) {
  const { t } = useI18n();
  const map: Record<QType, string> = {
    mcq: t("type_mcq"),
    tf: t("type_tf"),
    fill: t("type_fill"),
    case: t("type_case"),
  };
  return (
    <span className="inline-flex items-center rounded-md bg-pine-900 px-2 py-0.5 text-[11px] font-bold text-pulse-300">
      {map[type]}
    </span>
  );
}

export function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  const { t } = useI18n();
  const labels = [t("level_basic"), t("level_mid"), t("level_adv")];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft" title={labels[level - 1]}>
      <span className="inline-flex gap-[3px]">
        {[1, 2, 3].map((i) => (
          <span key={i} className={"h-1.5 w-1.5 rounded-full " + (i <= level ? "bg-pulse-600" : "bg-line")} />
        ))}
      </span>
      {labels[level - 1]}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-start transition-colors hover:border-pulse-500/50"
      role="switch"
      aria-checked={checked}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-[11px] text-ink-soft">{hint}</span>}
      </span>
      <span
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 " +
          (checked ? "bg-pulse-600" : "bg-paper-deep")
        }
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 " +
            (checked ? "start-[22px]" : "start-0.5")
          }
        />
      </span>
    </button>
  );
}

export function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white/90 px-2.5 py-1.5 text-xs font-bold text-ink transition-all hover:border-pulse-500 hover:text-pulse-700"
      title="العربية / English"
    >
      <span className="font-display">{lang === "ar" ? "EN" : "ع"}</span>
      <GlobeMini />
    </button>
  );
}

function GlobeMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.8 2.5 4 5.6 4 9s-1.2 6.5-4 9c-2.8-2.5-4-5.6-4-9s1.2-6.5 4-9z" />
    </svg>
  );
}

export function KiurWordmark({ dark = false, size = "md" }: { dark?: boolean; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { text: "text-xl", icon: 18 },
    md: { text: "text-2xl", icon: 24 },
    lg: { text: "text-4xl", icon: 36 },
  }[size];
  return (
    <span className={"inline-flex items-center gap-2 font-display font-extrabold tracking-tight " + sizes.text + " " + (dark ? "text-paper" : "text-pine-900")}>
      <svg width={sizes.icon} height={sizes.icon} viewBox="0 0 40 40" aria-hidden>
        <rect width="40" height="40" rx="10" fill={dark ? "#0f2f29" : "#0a211d"} />
        <path
          d="M6 21h7l3-7 6 13 4-8 2.5 2H34"
          fill="none" stroke="#7ed4be" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <span>
        KIUR
        <span className={"ms-1 align-middle text-[0.42em] font-semibold tracking-widest uppercase " + (dark ? "text-pulse-300" : "text-pulse-600")}>
          Med&nbsp;Exams
        </span>
      </span>
    </span>
  );
}

export function formatDate(ts: number, lang: "ar" | "en"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-paper/60 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-pulse-100 text-pulse-700">{icon}</span>
      <p className="text-sm font-medium text-ink-soft">{text}</p>
    </div>
  );
}

export const QTYPE_KEYS: Record<QType, string> = {
  mcq: "type_mcq",
  tf: "type_tf",
  fill: "type_fill",
  case: "type_case",
};

/** كشف العنصر عند دخوله مجال الرؤية — يعيد التشغيل مرة واحدة */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className + " transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] " + (seen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export type { BiText };
