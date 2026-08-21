/** Hose endpoint / balloon connection point in viewBox units. */
const NOZZLE_X = 20;
const NOZZLE_Y = 20;
const BALLOON_MOUNT_HEIGHT = 160;
const BALLOON_MOUNT_WIDTH = 90;
/** Extra FO height so the neck can render into the nozzle zone without clipping. */
const CONNECT_PAD = 14;

const PumpVisual = ({ fill = 0, children }) => {
  const nozzleY = NOZZLE_Y - fill * 2;

  return (
    <div className="pump-visual">
      <svg
        className="pump-visual__svg"
        viewBox="0 0 140 170"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
      >
        <defs>
          <linearGradient id="pump-cylinder" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="45%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="pump-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
          <linearGradient id="pump-handle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        <path
          className="pump-visual__hose"
          d={`M 88 132 C 78 128, 62 118, 52 98 C 42 78, 34 58, 28 38 C 24 28, 22 22, ${NOZZLE_X} ${nozzleY}`}
          fill="none"
          stroke="#4b5563"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        <ellipse cx="98" cy="158" rx="28" ry="7" fill="url(#pump-metal)" />
        <ellipse cx="98" cy="156" rx="24" ry="5" fill="#d1d5db" opacity="0.5" />

        <rect x="82" y="72" width="32" height="84" rx="4" fill="url(#pump-cylinder)" />
        <rect x="84" y="74" width="6" height="80" rx="2" fill="rgba(255,255,255,0.12)" />

        <rect x="80" y="68" width="36" height="8" rx="3" fill="url(#pump-metal)" />
        <rect x="80" y="152" width="36" height="8" rx="3" fill="url(#pump-metal)" />

        <rect x="95" y="28" width="6" height="44" rx="2" fill="url(#pump-metal)" />
        <rect x="78" y="20" width="40" height="8" rx="4" fill="url(#pump-handle)" />
        <rect x="78" y="22" width="40" height="3" rx="1" fill="rgba(255,255,255,0.25)" />

        <circle cx="88" cy="132" r="4" fill="url(#pump-metal)" />

        <foreignObject
          x={NOZZLE_X - BALLOON_MOUNT_WIDTH / 2}
          y={nozzleY - BALLOON_MOUNT_HEIGHT}
          width={BALLOON_MOUNT_WIDTH}
          height={BALLOON_MOUNT_HEIGHT + CONNECT_PAD}
          overflow="visible"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="pump-visual__balloon-mount"
          >
            {children}
          </div>
        </foreignObject>

        <g
          className="pump-visual__nozzle-svg"
          transform={`translate(${NOZZLE_X}, ${nozzleY})`}
        >
          <ellipse cx="0" cy="0" rx="4" ry="3.5" fill="#be185d" />
          <rect
            x="-5"
            y="0"
            width="10"
            height="5"
            rx="1.5"
            fill="url(#pump-metal)"
          />
        </g>
      </svg>
    </div>
  );
};

export default PumpVisual;
