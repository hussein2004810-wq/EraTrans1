import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import type { SyncConfig } from "../lib/supabaseClient";
import {
  CheckIcon, DownloadIcon, GlobeIcon, InfoIcon, KeyIcon, RefreshIcon, UploadIcon, XIcon,
} from "../components/icons";

interface Props {
  config: SyncConfig | null;
  onConnect: (cfg: SyncConfig) => Promise<{ ok: boolean; message: string }>;
  onDisconnect: () => void;
  onSyncNow: () => Promise<{ ok: boolean; message: string }>;
  onPushAll: () => Promise<{ ok: boolean; message: string }>;
  onProbeWrite: () => Promise<{ ok: boolean; message: string }>;
}

/** لوحة المزامنة السحابية — يديرها المالك لربط المنصة بين الأجهزة */
export default function SyncPanel({ config, onConnect, onDisconnect, onSyncNow, onPushAll, onProbeWrite }: Props) {
  const { t } = useI18n();
  const [url, setUrl] = useState(config?.url ?? "");
  const [key, setKey] = useState(config?.anonKey ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [probe, setProbe] = useState<{ ok: boolean; text: string } | null>(null);

  const connected = !!config;

  /* فحص صلاحية الكتابة تلقائيًا عند الاتصال — يشخّص مبكرًا سبب فشل الرفع */
  useEffect(() => {
    if (!connected) {
      setProbe(null);
      return;
    }
    let live = true;
    onProbeWrite().then((r) => {
      if (live) setProbe({ ok: r.ok, text: r.message });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const act = async (which: "connect" | "sync" | "push") => {
    setBusy(which);
    setMsg(null);
    try {
      const r =
        which === "connect"
          ? await onConnect({ url: url.trim(), anonKey: key.trim() })
          : which === "sync"
            ? await onSyncNow()
            : await onPushAll();
      /* الرسائل قد تكون مفاتيح ترجمة أو نصًا جاهزًا */
      setMsg({ ok: r.ok, text: t(r.message) !== r.message ? t(r.message) : r.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── الحالة ── */}
      <div className={"card overflow-hidden border-2 " + (connected ? "border-moss-600/40" : "border-line")}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <span
            className={
              "grid h-10 w-10 place-items-center rounded-xl " +
              (connected ? "bg-moss-100 text-moss-700" : "bg-paper-deep text-ink-soft")
            }
          >
            <GlobeIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold">{t("sync_title")}</h2>
            <p className="truncate text-xs text-ink-soft" dir="ltr">
              {connected ? config!.url : t("sync_not_connected")}
            </p>
          </div>
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold " +
              (connected ? "bg-moss-100 text-moss-700" : "bg-blood-100 text-blood-700")
            }
          >
            <span className={"h-2 w-2 rounded-full " + (connected ? "blink-dot bg-moss-600" : "bg-blood-600")} />
            {connected ? t("sync_online") : t("sync_offline")}
          </span>
        </div>

        {/* تشخيص صلاحية الكتابة — يكشف مبكرًا جداول ناقصة أو سياسات RLS مانعة */}
        {connected && probe && (
          <div
            className={
              "anim-fade-up flex items-start gap-2.5 border-b px-5 py-3 text-xs leading-relaxed " +
              (probe.ok
                ? "border-line bg-moss-100/50 text-moss-700"
                : "border-line bg-blood-100/60 text-blood-700")
            }
          >
            {probe.ok ? <CheckIcon size={15} className="mt-0.5 shrink-0" /> : <InfoIcon size={15} className="mt-0.5 shrink-0" />}
            <p className="flex-1">{probe.text}</p>
            <button
              onClick={() => {
                onProbeWrite().then((r) => setProbe({ ok: r.ok, text: r.message }));
              }}
              className="shrink-0 rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-bold text-ink-soft transition-colors hover:border-pulse-500 hover:text-pulse-700"
            >
              {t("sync_probe")}
            </button>
          </div>
        )}

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="lbl">{t("sync_url")}</label>
              <input
                className="input"
                dir="ltr"
                placeholder="https://xxxx.supabase.co"
                value={url}
                disabled={connected}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="lbl">{t("sync_key")}</label>
              <input
                className="input"
                dir="ltr"
                placeholder="eyJhbGciOi..."
                value={key}
                disabled={connected}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>

            {connected ? (
              <button
                onClick={() => {
                  onDisconnect();
                  setUrl("");
                  setKey("");
                  setMsg(null);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-blood-600/40 bg-blood-100 px-4 py-2.5 font-display text-sm font-bold text-blood-700 transition-colors hover:bg-blood-600 hover:text-white"
              >
                <XIcon size={15} /> {t("sync_disconnect")}
              </button>
            ) : (
              <button
                onClick={() => act("connect")}
                disabled={busy === "connect" || !url.trim() || !key.trim()}
                className="btn-primary w-full"
              >
                <GlobeIcon size={16} />
                {busy === "connect" ? t("sync_testing") : t("sync_connect")}
              </button>
            )}
          </div>

          {connected && (
            <div className="space-y-3">
              <button onClick={() => act("sync")} disabled={busy === "sync"} className="btn-ghost w-full">
                <DownloadIcon size={16} className="text-pulse-600" />
                {busy === "sync" ? t("sync_working") : t("sync_pull_now")}
              </button>
              <button onClick={() => act("push")} disabled={busy === "push"} className="btn-ghost w-full">
                <UploadIcon size={16} className="text-amberx-600" />
                {busy === "push" ? t("sync_working") : t("sync_push_all")}
              </button>
              <p className="rounded-lg bg-paper/70 p-3 text-xs leading-relaxed text-ink-soft">{t("sync_push_hint")}</p>
            </div>
          )}
        </div>

        {msg && (
          <div
            className={
              "anim-pop mx-5 mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold " +
              (msg.ok
                ? "border-moss-600/40 bg-moss-100 text-moss-700"
                : "border-blood-600/40 bg-blood-100 text-blood-700")
            }
          >
            {msg.ok ? <CheckIcon size={17} className="mt-0.5 shrink-0" /> : <XIcon size={17} className="mt-0.5 shrink-0" />}
            {msg.text}
          </div>
        )}
      </div>

      {/* ── خطوات الإعداد ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-paper/60 px-5 py-3">
          <KeyIcon size={17} className="text-pulse-600" />
          <h3 className="font-display text-sm font-bold text-ink-soft">{t("sync_steps_title")}</h3>
        </div>
        <ol className="space-y-3 p-5 text-sm leading-relaxed text-ink">
          {[
            t("sync_step1"),
            t("sync_step2"),
            t("sync_step3"),
            t("sync_step4"),
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pine-900 font-display text-xs font-bold text-pulse-300">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div className="flex items-start gap-2.5 border-t border-line bg-amberx-100/50 px-5 py-3 text-xs leading-relaxed text-amberx-600">
          <InfoIcon size={15} className="mt-0.5 shrink-0" />
          <p>{t("sync_security_note")}</p>
        </div>
      </div>
    </div>
  );
}
