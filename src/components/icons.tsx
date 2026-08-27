import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function make(paths: ReactNode) {
  return function Icon({ size = 20, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

/** شعار المنصة: قلب يخترقه خط نبض */
export const LogoIcon = make(
  <>
    <path d="M12 21C12 21 3 13.7 3 8.6C3 5.5 5.4 3 8.4 3C10 3 11.4 3.9 12 5C12.6 3.9 14 3 15.6 3C18.6 3 21 5.5 21 8.6C21 13.7 12 21 12 21Z" />
    <path d="M4.5 11.5h3.5l1.5-2.5 2.5 5 1.5-2.5h6" />
  </>
);

export const ClipboardIcon = make(
  <>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="m9 14 2 2 4-4.5" />
  </>
);

export const BookIcon = make(
  <>
    <path d="M12 7v13" />
    <path d="M3 18.5V5a1 1 0 0 1 1-1h4.5a3.5 3.5 0 0 1 3.5 3.5A3.5 3.5 0 0 1 15.5 4H20a1 1 0 0 1 1 1v13.5" />
    <path d="M3 18.5a2.5 2.5 0 0 1 2.5-2.5H12v4.5a3 3 0 0 0-3-2H3ZM21 18.5a2.5 2.5 0 0 0-2.5-2.5H12v4.5a3 3 0 0 1 3-2h6Z" />
  </>
);

export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>
);

export function FlagIcon({ filled = false, size = 20, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 21V4.5" />
      <path d="M5 4.5C9 2.5 12 6.5 19 4.5v9c-7 2-10-2-14 0" />
    </svg>
  );
}

export const CheckIcon = make(<path d="m5 12.5 4.5 4.5L19 7" />);

export const XIcon = make(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </>
);

export const ChevronDownIcon = make(<path d="m6 9.5 6 6 6-6" />);

export const BulbIcon = make(
  <>
    <path d="M12 3a6 6 0 0 1 3.6 10.8c-.7.55-1.1 1.3-1.1 2.2h-5c0-.9-.4-1.65-1.1-2.2A6 6 0 0 1 12 3Z" />
    <path d="M9.5 19.5h5" />
    <path d="M10.5 22h3" />
  </>
);

/** سهم "التالي" في واجهة RTL يشير لليسار */
export const NextIcon = make(
  <>
    <path d="M19 12H5.5" />
    <path d="m11 6-6 6 6 6" />
  </>
);

/** سهم "السابق" في واجهة RTL يشير لليمين */
export const PrevIcon = make(
  <>
    <path d="M5 12h13.5" />
    <path d="m13 6 6 6-6 6" />
  </>
);

export const RefreshIcon = make(
  <>
    <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
    <path d="M21 3v5h-5" />
  </>
);

export const ActivityIcon = make(<path d="M3 12h3.5l2.5-6.5 4 13 2.5-6.5H21" />);

export const StethoIcon = make(
  <>
    <path d="M5.5 3v5a4.5 4.5 0 0 0 9 0V3" />
    <path d="M10 12.5V15a4.5 4.5 0 0 0 4.5 4.5h.3a4.2 4.2 0 0 0 4.2-4.2v-2.8" />
    <circle cx="19" cy="10" r="2.3" />
  </>
);

export const TrashIcon = make(
  <>
    <path d="M4.5 7h15" />
    <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
    <path d="m6.5 7 .9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12" />
    <path d="M10 11v6M14 11v6" />
  </>
);

export const ChartIcon = make(
  <>
    <path d="M3.5 21h17" />
    <path d="M6.5 21v-8" />
    <path d="M11.5 21V5" />
    <path d="M16.5 21v-11" />
  </>
);

export const TrophyIcon = make(
  <>
    <path d="M8 21.5h8" />
    <path d="M12 17.5v4" />
    <path d="M7 3.5h10v6.5a5 5 0 0 1-10 0Z" />
    <path d="M7 5.5H3.5V7A3.5 3.5 0 0 0 7 10.5M17 5.5h3.5V7A3.5 3.5 0 0 1 17 10.5" />
  </>
);

export const InfoIcon = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 7.5v.5" />
  </>
);

export const TimerIcon = make(
  <>
    <path d="M10 2h4" />
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 9.5v4l2.5 2" />
  </>
);

export const LayersIcon = make(
  <>
    <path d="m12 3 9 4.5-9 4.5-9-4.5Z" />
    <path d="m4.5 11.5-1.5.75 9 4.5 9-4.5-1.5-.75" />
    <path d="m4.5 15.5-1.5.75 9 4.5 9-4.5-1.5-.75" />
  </>
);
