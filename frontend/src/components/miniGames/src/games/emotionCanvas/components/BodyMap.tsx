import { motion } from 'framer-motion';
import { BODY_ZONES } from '../emotionCanvasData';

// Proportional click zones mapped to the body-map.png illustration.
// All values are percentages of the image container (0-100).
// Positions assume a standard front-facing human silhouette:
//   head at top-center, torso in middle, arms/hands at sides.
const ZONE_AREAS: Record<string, {
  type: 'ellipse';
  cx: number; cy: number; rx: number; ry: number;
}> = {
  head:      { type: 'ellipse', cx: 50, cy: 13, rx: 14, ry: 11 },
  chest:     { type: 'ellipse', cx: 50, cy: 34, rx: 18, ry: 10 },
  stomach:   { type: 'ellipse', cx: 50, cy: 52, rx: 16, ry: 8  },
  hands:     { type: 'ellipse', cx: 50, cy: 47, rx: 42, ry: 6  }, // wide band covering both hands
  wholebody: { type: 'ellipse', cx: 50, cy: 52, rx: 42, ry: 48 },
};

const ZONE_COLORS: Record<string, string> = {
  head:      '#CE93D8',
  chest:     '#F48FB1',
  stomach:   '#FFCC80',
  hands:     '#80DEEA',
  wholebody: '#A5D6A7',
};

interface Props {
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export default function BodyMap({ selected, onToggle }: Props) {
  return (
    <div className="flex flex-col items-center gap-5 w-full py-4">
      <div className="flex gap-6 items-start justify-center flex-wrap">

        {/* Body illustration with interactive SVG zones overlaid */}
        <div className="relative flex-shrink-0" style={{ width: 180, aspectRatio: '9/14' }}>
          {/* SD-generated body map illustration */}
          <img
            src="/games/emotion-canvas/body-map.png"
            alt="Body diagram — tap a zone to show where you feel it"
            className="w-full h-full object-cover rounded-2xl"
            style={{ display: 'block' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />

          {/* Fallback silhouette shown when image hasn't loaded yet */}
          <svg
            viewBox="0 0 200 310"
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
            aria-hidden
          >
            <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2">
              <ellipse cx="100" cy="40" rx="30" ry="33" />
              <rect x="72" y="71" width="56" height="100" rx="18" />
              <rect x="28" y="76" width="22" height="72" rx="11" transform="rotate(-4 39 112)" />
              <rect x="150" y="76" width="22" height="72" rx="11" transform="rotate(4 161 112)" />
              <rect x="78" y="168" width="22" height="100" rx="11" transform="rotate(2 89 218)" />
              <rect x="100" y="168" width="22" height="100" rx="11" transform="rotate(-2 111 218)" />
            </g>
          </svg>

          {/* Interactive SVG overlay — percentage-based zones */}
          <svg
            viewBox="0 0 100 156"
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'all' }}
            role="img"
            aria-label="Body zone selector"
          >
            {BODY_ZONES.map((zone) => {
              const area  = ZONE_AREAS[zone.id];
              const sel   = selected.has(zone.id);
              const color = ZONE_COLORS[zone.id];
              if (!area) return null;

              return (
                <motion.g
                  key={zone.id}
                  onClick={() => onToggle(zone.id)}
                  style={{ cursor: 'pointer' }}
                  aria-label={zone.label}
                  role="button"
                  aria-pressed={sel}
                >
                  <motion.ellipse
                    cx={area.cx} cy={area.cy} rx={area.rx} ry={area.ry}
                    fill={sel ? color : 'transparent'}
                    stroke={color}
                    strokeWidth={sel ? 2 : 1.2}
                    opacity={sel ? 0.7 : 0.35}
                    animate={{ scale: sel ? 1.05 : 1 }}
                    transition={{ type: 'spring', stiffness: 280 }}
                  />
                  {/* Pulse ring on tap */}
                  {sel && (
                    <motion.ellipse
                      cx={area.cx} cy={area.cy} rx={area.rx} ry={area.ry}
                      fill="none" stroke={color} strokeWidth="1.5"
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 1.45, opacity: 0 }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Zone label buttons */}
        <div className="flex flex-col gap-2" style={{ paddingTop: 8, minWidth: 180 }}>
          {BODY_ZONES.map((zone) => {
            const sel   = selected.has(zone.id);
            const color = ZONE_COLORS[zone.id];
            return (
              <motion.button
                key={zone.id}
                onClick={() => onToggle(zone.id)}
                className="flex items-start gap-3 rounded-2xl px-4 py-3 text-left border"
                style={{
                  background: sel ? `${color}22` : 'rgba(255,255,255,0.04)',
                  borderColor: sel ? color : 'rgba(255,255,255,0.1)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                aria-pressed={sel}
              >
                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ background: sel ? color : 'rgba(255,255,255,0.25)' }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: sel ? '#fff' : 'rgba(255,255,255,0.75)' }}>
                    {zone.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {zone.example}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
