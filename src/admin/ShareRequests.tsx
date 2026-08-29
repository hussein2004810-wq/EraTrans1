import { useMemo, useState } from "react";
import type { Account, ExamDef, ShareRequest } from "../types";
import { useI18n } from "../i18n";
import { findUniversity } from "../data/hierarchy";
import { EmptyState, formatDate } from "../components/ui";
import { CheckIcon, EyeIcon, InfoIcon, ShareIcon, XIcon } from "../components/icons";

interface Props {
  user: Account;
  shares: ShareRequest[];
  exams: ExamDef[];
  accounts: Account[];
  onDecideShare: (id: string, approve: boolean) => void;
}

const STATUS_META: Record<ShareRequest["status"], { label: string; cls: string }> = {
  pending: { label: "share_status_pending", cls: "bg-amberx-100 text-amberx-600" },
  approved: { label: "share_status_approved", cls: "bg-moss-100 text-moss-700" },
  rejected: { label: "share_status_rejected", cls: "bg-blood-100 text-blood-700" },
};

/**
 * طلبات مشاركة الاختبارات بين الجامعات.
 * المالك يبتّ في كل الطلبات؛ المشرف يبتّ فقط في اختبارات جامعته (حسب نطاقه).
 */
export default function ShareRequests({ user, shares, exams, accounts, onDecideShare }: Props) {
  const { t, bi, lang } = useI18n();
  const [filter, setFilter] = useState<"all" | ShareRequest["status"]>("all");

  const isOwner = user.role === "owner";
  const canDecide = (s: ShareRequest): boolean => {
    if (isOwner) return true;
    const exam = exams.find((e) => e.id === s.examId);
    if (!exam) return false;
    return !user.scopeUniversity || exam.university === user.scopeUniversity;
  };

  const uniName = (email: string): string => {
    const acc = accounts.find((a) => a.email === email);
    const n = findUniversity(acc?.university)?.name;
    return n ? bi(n) : "—";
  };

  const list = useMemo(
    () =>
      shares
        .filter((s) => filter === "all" || s.status === filter)
        .sort((a, b) => b.requestedAt - a.requestedAt),
    [shares, filter]
  );

  const pendingCount = shares.filter((s) => s.status === "pending").length;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
        <ShareIcon size={20} className="text-pulse-600" />
        <h2 className="font-display text-xl font-bold">{t("shares_tab")}</h2>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amberx-100 px-2.5 py-0.5 text-xs font-bold text-amberx-600">
            {pendingCount} {t("share_status_pending")}
          </span>
        )}
        <div className="ms-auto flex gap-1.5">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-full px-3 py-1 text-xs font-bold transition-all " +
                (filter === f ? "bg-pine-900 text-pulse-300 shadow" : "border border-line bg-white text-ink-soft hover:border-pulse-500")
              }
            >
              {f === "all" ? t("all") : t(STATUS_META[f].label)}
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-start gap-2 border-b border-line bg-pulse-100/40 px-5 py-3 text-xs leading-relaxed text-pulse-700">
        <InfoIcon size={15} className="mt-0.5 shrink-0" />
        {t("share_hint")}
      </p>

      {list.length === 0 ? (
        <div className="p-8"><EmptyState icon={<EyeIcon size={22} />} text={t("share_empty")} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper/70 text-xs text-ink-soft">
                <th className="px-5 py-3 text-start font-bold">{t("share_col_exam")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("share_col_from")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("share_col_to")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("time_col")}</th>
                <th className="px-3 py-3 text-start font-bold">{t("share_col_status")}</th>
                <th className="px-5 py-3 text-start font-bold">{t("share_col_decided")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((s) => {
                const exam = exams.find((e) => e.id === s.examId);
                const meta = STATUS_META[s.status];
                const decidable = canDecide(s) && s.status === "pending";
                return (
                  <tr key={s.id} className="transition-colors hover:bg-pulse-100/20">
                    <td className="max-w-52 px-5 py-3">
                      <p className="truncate font-semibold">{exam ? bi(exam.title) : s.examId}</p>
                      <p className="text-[11px] text-ink-soft">{uniName(s.fromEmail)} → {uniName(s.toEmail)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{s.fromName}</p>
                      <p className="text-[11px] text-ink-soft">{uniName(s.fromEmail)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{s.toName}</p>
                      <p className="text-[11px] text-ink-soft">{uniName(s.toEmail)}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-soft">{formatDate(s.requestedAt, lang)}</td>
                    <td className="px-3 py-3">
                      <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + meta.cls}>{t(meta.label)}</span>
                      {s.decidedByName && (
                        <p className="mt-1 text-[10px] text-ink-soft">{t("share_decided_by")}: {s.decidedByName}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {decidable ? (
                        <span className="flex gap-1.5">
                          <button
                            onClick={() => onDecideShare(s.id, true)}
                            className="inline-flex items-center gap-1 rounded-lg bg-moss-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-moss-700"
                          >
                            <CheckIcon size={13} /> {t("share_approve")}
                          </button>
                          <button
                            onClick={() => onDecideShare(s.id, false)}
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
                          >
                            <XIcon size={13} /> {t("share_reject")}
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-ink-soft">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
