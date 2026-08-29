import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckIcon, InfoIcon, XIcon } from "./icons";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastCtx {
  push: (text: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastCtx>({ push: () => {} });

export function useToast(): ToastCtx {
  return useContext(Ctx);
}

const KIND_STYLE: Record<ToastKind, string> = {
  success: "border-moss-600/50 bg-moss-100 text-moss-700",
  error: "border-blood-600/50 bg-blood-100 text-blood-700",
  info: "border-pulse-500/50 bg-pulse-100 text-pulse-700",
};

const KIND_ICON: Record<ToastKind, ReactNode> = {
  success: <CheckIcon size={16} />,
  error: <XIcon size={16} />,
  info: <InfoIcon size={16} />,
};

/** مزوّد إشعارات عائمة — يظهر أعلى يمين/يسار الشاشة حسب الاتجاه */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((text: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setItems((prev) => [...prev.slice(-3), { id, kind, text }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed bottom-5 z-[90] flex flex-col gap-2 ltr:right-5 rtl:left-5"
          dir="ltr"
          aria-live="polite"
        >
          {items.map((t) => (
            <div
              key={t.id}
              className={
                "anim-pop pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-bold shadow-lg backdrop-blur " +
                KIND_STYLE[t.kind]
              }
            >
              <span className="shrink-0">{KIND_ICON[t.kind]}</span>
              <span className="leading-snug" dir="auto">{t.text}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </Ctx.Provider>
  );
}
