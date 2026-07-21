import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SceneOverrides } from './SceneCanvas';
import type { InteractionType } from '../systems/emotionAdapter';
import type { SoundId } from '../emotionCanvasData';
import { SOUNDS, VISUAL_ELEMENTS } from '../emotionCanvasData';

interface Props {
  overrides: SceneOverrides;
  onChange: (patch: Partial<SceneOverrides>) => void;
  activeSound: SoundId | null;
  onSound: (id: SoundId | null) => void;
  onInteraction: (type: InteractionType) => void;
  onBreathing: () => void;
}

type Tab = 'color' | 'sound' | 'visual' | 'movement' | 'breathing';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'color',     icon: '🎨', label: 'Color' },
  { id: 'sound',     icon: '🎵', label: 'Sound' },
  { id: 'visual',    icon: '✦',  label: 'Visual' },
  { id: 'movement',  icon: '💨', label: 'Motion' },
  { id: 'breathing', icon: '🫁', label: 'Breathe' },
];

const WARM_COLORS = ['#FF6B6B','#FF8C42','#FFD166','#FFF3B0','#FFDDC1'];
const COOL_COLORS = ['#06D6A0','#118AB2','#073B4C','#8ECAE6','#A8DADC'];

function Slider({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <span>{label}</span><span>{Math.round(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#9B6FD8' }}
      />
    </div>
  );
}

export default function ToolPanel({ overrides, onChange, activeSound, onSound, onInteraction, onBreathing }: Props) {
  const [tab, setTab] = useState<Tab>('color');

  const toggleElement = (id: string) => {
    const next = new Set(overrides.elements);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange({ elements: next });
    onInteraction(`visual-${id.replace('extra-', '')}` as InteractionType);
  };

  return (
    <div
      className="relative z-20 w-full flex-shrink-0"
      style={{
        background: 'rgba(3,5,16,0.82)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === 'breathing') { onBreathing(); onInteraction('breathing'); }
            }}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-all"
            style={{
              color: tab === t.id ? '#9B6FD8' : 'rgba(255,255,255,0.45)',
              borderBottom: tab === t.id ? '2px solid #9B6FD8' : '2px solid transparent',
            }}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="px-4 py-4" style={{ minHeight: 120 }}>
        <AnimatePresence mode="wait">
          {tab === 'color' && (
            <motion.div key="color" className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Warm tones</p>
                <div className="flex gap-2 flex-wrap">
                  {WARM_COLORS.map((c) => (
                    <button
                      key={c}
                      className="w-9 h-9 rounded-full border-2 transition-all hover:scale-110"
                      style={{ background: c, borderColor: 'rgba(255,255,255,0.2)' }}
                      onClick={() => {
                        onChange({ hueShift: overrides.hueShift + 15 });
                        onInteraction('color-warm');
                      }}
                      aria-label={`Add ${c} warm tone`}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Cool tones</p>
                <div className="flex gap-2 flex-wrap">
                  {COOL_COLORS.map((c) => (
                    <button
                      key={c}
                      className="w-9 h-9 rounded-full border-2 transition-all hover:scale-110"
                      style={{ background: c, borderColor: 'rgba(255,255,255,0.2)' }}
                      onClick={() => {
                        onChange({ hueShift: overrides.hueShift - 15 });
                        onInteraction('color-cool');
                      }}
                      aria-label={`Add ${c} cool tone`}
                    />
                  ))}
                </div>
              </div>
              <Slider label="Brightness" value={overrides.brightness} min={50} max={180}
                onChange={(v) => {
                  onChange({ brightness: v });
                  onInteraction(v > overrides.brightness ? 'brightness-up' : 'brightness-down');
                }} />
              <Slider label="Saturation" value={overrides.saturation} min={20} max={200}
                onChange={(v) => {
                  onChange({ saturation: v });
                  onInteraction(v > overrides.saturation ? 'saturation-up' : 'saturation-down');
                }} />
            </motion.div>
          )}

          {tab === 'sound' && (
            <motion.div key="sound" className="grid grid-cols-2 gap-2"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {SOUNDS.map((s) => {
                const active = activeSound === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSound(active ? null : s.id);
                      onInteraction(active ? 'sound-off' : `sound-${s.id}` as InteractionType);
                    }}
                    className="py-3 px-4 rounded-xl text-sm font-medium transition-all border"
                    style={{
                      background: active ? 'rgba(155,111,216,0.3)' : 'rgba(255,255,255,0.04)',
                      borderColor: active ? '#9B6FD8' : 'rgba(255,255,255,0.1)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </motion.div>
          )}

          {tab === 'visual' && (
            <motion.div key="visual" className="grid grid-cols-3 gap-2"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {VISUAL_ELEMENTS.map((el) => {
                const active = overrides.elements.has(el.id);
                return (
                  <button
                    key={el.id}
                    onClick={() => toggleElement(el.id)}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all border"
                    style={{
                      background: active ? 'rgba(155,111,216,0.3)' : 'rgba(255,255,255,0.04)',
                      borderColor: active ? '#9B6FD8' : 'rgba(255,255,255,0.1)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <span className="text-xl">{el.icon}</span>
                    {el.label}
                  </button>
                );
              })}
            </motion.div>
          )}

          {tab === 'movement' && (
            <motion.div key="movement" className="flex flex-col gap-5"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Slider label="Speed" value={overrides.particleSpeedMult} min={0.2} max={3.0} step={0.1}
                onChange={(v) => {
                  onChange({ particleSpeedMult: v });
                  onInteraction(v < overrides.particleSpeedMult ? 'speed-slower' : 'speed-faster');
                }} />
              <Slider label="Wind" value={overrides.windX} min={-1.5} max={1.5} step={0.1}
                onChange={(v) => {
                  onChange({ windX: v });
                  onInteraction(Math.abs(v) < Math.abs(overrides.windX) ? 'wind-less' : 'wind-more');
                }} />
              <div className="flex gap-2">
                <button
                  onClick={() => { onChange({ particleSpeedMult: 0.25 }); onInteraction('speed-slower'); }}
                  className="flex-1 py-3 rounded-xl text-sm border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Slow motion
                </button>
                <button
                  onClick={() => { onChange({ particleSpeedMult: 1.0, windX: 0 }); }}
                  className="flex-1 py-3 rounded-xl text-sm border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
