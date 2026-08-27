import { useMemo, type CSSProperties } from "react";

interface EcgLineProps {
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  /** مدة دورة المسح الضوئي بالثواني */
  speed?: number;
  showBase?: boolean;
}

/** نبضة QRS واحدة مرسومة يدويًا على خط الأساس y=48 */
function beat(x: number): string {
  return [
    `M ${x} 48 L ${x + 22} 48`,
    `C ${x + 26} 48 ${x + 27} 41 ${x + 31} 41`,
    `C ${x + 35} 41 ${x + 36} 48 ${x + 40} 48`,
    `L ${x + 42} 48 L ${x + 44} 55 L ${x + 47} 10 L ${x + 50} 62 L ${x + 53} 48`,
    `L ${x + 62} 48`,
    `C ${x + 66} 48 ${x + 67} 40 ${x + 71} 40`,
    `C ${x + 75} 40 ${x + 76} 48 ${x + 80} 48`,
    `L ${x + 100} 48`,
  ].join(" ");
}

export default function EcgLine({
  className = "",
  stroke = "currentColor",
  strokeWidth = 2,
  speed = 6,
  showBase = true,
}: EcgLineProps) {
  const d = useMemo(() => {
    let path = "";
    for (let i = 0; i < 6; i++) path += beat(i * 100) + " ";
    return path.trim();
  }, []);

  return (
    <svg
      viewBox="0 0 600 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {showBase && (
        <path
          d={d}
          stroke={stroke}
          strokeOpacity={0.2}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      <path
        d={d}
        pathLength={1000}
        className="ecg-trace"
        style={{ "--ecg-speed": `${speed}s` } as CSSProperties}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
