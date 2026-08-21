const CrashRocket = () => (
  <svg
    viewBox="0 0 64 64"
    className="h-14 w-14 drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]"
    aria-hidden
  >
    <g className="crash-flame origin-left">
      <ellipse cx="10" cy="32" rx="11" ry="7" fill="#fb923c" opacity="0.95" />
      <ellipse cx="6" cy="32" rx="7" ry="4.2" fill="#fde047" />
      <ellipse cx="3" cy="32" rx="3.5" ry="2.2" fill="#fff7ed" />
    </g>
    <path
      d="M22 20 L46 32 L22 44 Z"
      fill="#64748b"
    />
    <path d="M22 22 L44 32 L22 31 Z" fill="#94a3b8" />
    <rect x="18" y="24" width="16" height="16" rx="3" fill="#e2e8f0" />
    <rect x="18" y="24" width="16" height="7" rx="3" fill="#f8fafc" />
    <circle cx="26" cy="32" r="4.2" fill="#38bdf8" />
    <circle cx="25" cy="31" r="1.6" fill="#e0f2fe" />
    <path d="M20 24 L12 16 L22 26 Z" fill="#ef4444" />
    <path d="M20 40 L12 48 L22 38 Z" fill="#ef4444" />
    <path d="M20 24 L16 20 L22 26 Z" fill="#fca5a5" />
    <ellipse cx="46" cy="32" rx="7" ry="6" fill="#f87171" />
    <ellipse cx="48" cy="30.5" rx="3" ry="2.4" fill="#fecaca" />
  </svg>
);

const CrashBlast = () => (
  <svg
    viewBox="0 0 72 72"
    className="crash-blast h-16 w-16"
    aria-hidden
  >
    <circle cx="36" cy="36" r="16" fill="#fb923c" opacity="0.35" />
    <circle cx="36" cy="36" r="10" fill="#f97316" />
    <circle cx="36" cy="36" r="6" fill="#fde047" />
    <circle cx="34" cy="33" r="2.4" fill="#fff7ed" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <polygon
        key={deg}
        points="36,8 40,28 32,28"
        fill="#f97316"
        transform={`rotate(${deg} 36 36)`}
      />
    ))}
  </svg>
);

export const CrashMarker = ({ crashed, visible, x, y, angle }) => {
  if (!visible || x == null || y == null) return null;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-[3]"
      style={{
        transform: crashed
          ? `translate(${x}px, ${y}px) translate(-50%, -50%)`
          : `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}deg)`,
      }}
    >
      {crashed ? <CrashBlast /> : <CrashRocket />}
    </div>
  );
};

export default CrashMarker;
