import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base(p: P) {
  const { size = 20, ...rest } = p;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const PulseIcon = (p: P) => (
  <svg {...base(p)}><path d="M2 12h4l2.5-6.5L13 18l2.5-6H22" /></svg>
);
export const ClipboardIcon = (p: P) => (
  <svg {...base(p)}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 2.5h6v3H9z" /><path d="M9 11h6M9 15h4" /></svg>
);
export const TimerIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="13.5" r="7.5" /><path d="M12 10v4l2.5 2.5M9 2.5h6M12 2.5V6" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
);
export const FlagIcon = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <svg {...base(rest)} fill={filled ? "currentColor" : "none"}>
      <path d="M5 21V4c3-2 6 2 9 0v9c-3 2-6-2-9 0" />
    </svg>
  );
};
export const CheckIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2.6}><path d="M4.5 12.5l5 5L19.5 6.5" /></svg>
);
export const XIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2.6}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ArrowRightIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 12h16M14 6l6 6-6 6" /></svg>
);
export const ArrowLeftIcon = (p: P) => (
  <svg {...base(p)}><path d="M20 12H4M10 6l-6 6 6 6" /></svg>
);
export const BulbIcon = (p: P) => (
  <svg {...base(p)}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 1 4 10.5c-.8.7-1 1.5-1 2.5h-6c0-1-.2-1.8-1-2.5A6 6 0 0 1 12 3z" /></svg>
);
export const TargetIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>
);
export const ChartIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-5M12 16V8M16 16v-3M20 16V6" /></svg>
);
export const RefreshIcon = (p: P) => (
  <svg {...base(p)}><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3v4h-4" /></svg>
);
export const ChevronDownIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
);
export const AwardIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 21l5-3 5 3-1.5-7" /></svg>
);
export const GradCapIcon = (p: P) => (
  <svg {...base(p)}><path d="M2 9l10-5 10 5-10 5L2 9z" /><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" /><path d="M22 9v5" /></svg>
);
export const UserIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 20.5c1.2-3.5 4.2-5.5 8-5.5s6.8 2 8 5.5" /></svg>
);
export const UsersIcon = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3 3.5-5 6.5-5s5.5 2 6.5 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16.5 15.5c2.3.3 4 1.8 4.8 4.2" /></svg>
);
export const LogoutIcon = (p: P) => (
  <svg {...base(p)}><path d="M15 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" /><path d="M17 8l4 4-4 4M9 12h12" /></svg>
);
export const UploadIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 15V4M7 9l5-5 5 5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
);
export const DownloadIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>
);
export const EditIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M14.5 7.5l3 3" /></svg>
);
export const TrashIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6.5 7l1 13h9l1-13" /><path d="M10 11v5M14 11v5" /></svg>
);
export const EyeIcon = (p: P) => (
  <svg {...base(p)}><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.8" /></svg>
);
export const PrinterIcon = (p: P) => (
  <svg {...base(p)}><path d="M7 8V3h10v5" /><rect x="4" y="8" width="16" height="8" rx="2" /><path d="M7 13h10v8H7z" /></svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 2.5l7.5 3v6c0 4.5-3 8.5-7.5 10-4.5-1.5-7.5-5.5-7.5-10v-6l7.5-3z" /><path d="M9 12l2 2 4-4.5" /></svg>
);
export const GlobeIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 2.5 4 5.6 4 9s-1.2 6.5-4 9c-2.8-2.5-4-5.6-4-9s1.2-6.5 4-9z" /></svg>
);
export const SaveIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 3h11l3 3v15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M8 3v5h7V3" /><path d="M8 21v-7h8v7" /></svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.5-4.5" /></svg>
);
export const ImageIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M3 17l5-4 4 3 4-4 5 5" /></svg>
);
export const FileIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 2.5h8L20 8.5v13H6a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2z" /><path d="M14 2.5v6h6" /><path d="M9 13h7M9 17h5" /></svg>
);
export const SheetIcon = (p: P) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M3.5 9.5h17M9.5 9.5V20.5M15.5 9.5V20.5" /></svg>
);
export const KeyIcon = (p: P) => (
  <svg {...base(p)}><circle cx="8" cy="15" r="4.5" /><path d="M11.5 11.5L20 3M16 7l2.5 2.5M13 10l2 2" /></svg>
);
export const StethoIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 3v5a5 5 0 0 0 10 0V3" /><path d="M10 13v3a5 5 0 0 0 10 0v-1" /><circle cx="20" cy="12" r="2" /></svg>
);
export const LayersIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 2.5L22 8l-10 5.5L2 8l10-5.5z" /><path d="M2 12.5l10 5.5 10-5.5" /><path d="M2 17l10 5.5L22 17" /></svg>
);
export const InfoIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>
);
export const ShareIcon = (p: P) => (
  <svg {...base(p)}><circle cx="6" cy="12" r="2.5" /><circle cx="17.5" cy="5.5" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /><path d="M8.2 10.8l7-4M8.2 13.2l7 4" /></svg>
);
export const GaugeIcon = (p: P) => (
  <svg {...base(p)}><path d="M4.5 19a9 9 0 1 1 15 0" /><path d="M12 13.5l3.8-3.8" /><circle cx="12" cy="13.5" r="1.5" /></svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M7.5 4.5v15l12-7.5-12-7.5z" /></svg>
);
export const TerminalIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M7 9l3 3-3 3M12.5 15.5H17" /></svg>
);
export const CrownIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 17l1.5-9L9 12l3-7 3 7 4.5-4L21 17H3z" /><path d="M3 20.5h18" /></svg>
);
export const HeartPulseIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 20.5S3 14.5 3 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9 2.8c0 5.7-9 11.7-9 11.7z" /><path d="M5.5 12h3l1.5-2.5 2 4 1.5-2.5h4" /></svg>
);
