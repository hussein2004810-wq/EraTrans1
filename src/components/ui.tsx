import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-pine-950/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="card anim-pop relative w-full max-w-md p-6"
      >
        {children}
      </div>
    </div>
  );
}

/** شارة مقرّر ملوّنة بلون المادة */
export function SubjectTag({
  name,
  color,
  small = false,
}: {
  name: string;
  color: string;
  small?: boolean;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full font-semibold " +
        (small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs")
      }
      style={{ backgroundColor: color + "1c", color }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}

/** نقاط مستوى الصعوبة (1–3) */
export function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  const labels = ["أساسي", "متوسط", "متقدم"];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft"
      title={`المستوى: ${labels[level - 1]}`}
    >
      <span className="inline-flex gap-[3px]">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={
              "h-1.5 w-1.5 rounded-full " +
              (i <= level ? "bg-pulse-600" : "bg-line")
            }
          />
        ))}
      </span>
      {labels[level - 1]}
    </span>
  );
}

export const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
