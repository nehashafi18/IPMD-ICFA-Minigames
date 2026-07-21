import { useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EmotionDef, ParticleType } from '../emotionCanvasData';

export interface SceneOverrides {
  brightness: number;     // 70–180
  saturation: number;     // 50–200
  hueShift: number;       // –60 to +60
  particleSpeedMult: number;  // 0.2–3.0
  windX: number;
  elements: Set<string>;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; color: string;
  type: ParticleType; phase: number; life: number; maxLife: number;
}

const MAX_PARTICLES = 90;

function spawnParticle(w: number, h: number, emotion: EmotionDef, overrides: SceneOverrides): Particle {
  const type  = emotion.particleType;
  const color = emotion.particleColor;
  const spd   = (emotion.particleSpeed + 0.1) * overrides.particleSpeedMult;
  const wx    = (emotion.windX + overrides.windX) * 0.5;

  const base: Particle = {
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * spd * 0.6 + wx,
    vy: (Math.random() - 0.5) * spd * 0.6,
    size: 3 + Math.random() * 5, alpha: 0,
    color, type, phase: Math.random() * Math.PI * 2,
    life: 0, maxLife: 120 + Math.random() * 180,
  };

  switch (type) {
    case 'rain':
      return { ...base, x: Math.random() * w, y: -10, vx: wx * 0.5, vy: 3 * spd,
               size: 1 + Math.random() * 1.5, maxLife: 60 + Math.random() * 60 };
    case 'leaves':
      return { ...base, vy: 0.6 * spd, vx: wx * 0.8, size: 4 + Math.random() * 4 };
    case 'sparkles':
      return { ...base, size: 2 + Math.random() * 3, maxLife: 80 + Math.random() * 80 };
    case 'bubbles':
      return { ...base, y: h + 10, vy: -0.6 * spd, size: 4 + Math.random() * 8 };
    case 'stars':
      return { ...base, vx: wx * 0.2, vy: -0.1 * spd, size: 1.5 + Math.random() * 2.5,
               maxLife: 200 + Math.random() * 300 };
    case 'streaks':
      return { ...base, vx: (1.2 + Math.random() * 0.8) * spd + wx, vy: (Math.random() - 0.5) * spd,
               size: 1.5 + Math.random() * 2, maxLife: 40 + Math.random() * 50 };
    case 'burst':
      const angle = Math.random() * Math.PI * 2;
      return { ...base, x: w / 2 + (Math.random() - 0.5) * w * 0.6, y: h * 0.4,
               vx: Math.cos(angle) * spd * 1.5, vy: Math.sin(angle) * spd * 1.5,
               size: 3 + Math.random() * 4, maxLife: 60 + Math.random() * 60 };
    case 'swirls':
      return { ...base, size: 2 + Math.random() * 4 };
    case 'fireflies':
      return { ...base, vy: -0.2 * spd, size: 2 + Math.random() * 3,
               maxLife: 180 + Math.random() * 240 };
    default:
      return base;
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const fadeIn  = Math.min(1, p.life / 20);
  const fadeOut = Math.min(1, (p.maxLife - p.life) / 30);
  const a = p.alpha * fadeIn * fadeOut;
  if (a <= 0) return;

  ctx.save();
  ctx.globalAlpha = a;

  if (p.type === 'rain') {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.shadowBlur = 4;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
    ctx.stroke();
  } else if (p.type === 'streaks') {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size * 0.6;
    ctx.shadowBlur = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  } else if (p.type === 'bubbles') {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const glowSize = p.type === 'sparkles' || p.type === 'fireflies' ? p.size * 3.5 : p.size * 1.8;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
    grad.addColorStop(0, p.color + 'FF');
    grad.addColorStop(0.4, p.color + '99');
    grad.addColorStop(1, p.color + '00');
    ctx.shadowBlur = p.type === 'stars' || p.type === 'fireflies' ? 12 : 6;
    ctx.shadowColor = p.color;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Ambient SVG blob that drifts slowly
function AmbientBlob({ color, delay, duration, initialX, initialY, size }: {
  color: string; delay: number; duration: number;
  initialX: string; initialY: string; size: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(80px)',
        left: initialX, top: initialY,
        transform: 'translate(-50%, -50%)',
      }}
      animate={{
        x: [0, 60, -40, 30, 0],
        y: [0, -50, 30, -20, 0],
        scale: [1, 1.12, 0.92, 1.06, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

interface Props {
  emotion: EmotionDef;
  overrides: SceneOverrides;
  reducedMotion: boolean;
}

export default memo(function SceneCanvas({ emotion, overrides, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef    = useRef(0);
  const dims      = useRef({ w: 1, h: 1 });

  // Canvas particle loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      dims.current  = { w: canvas.width, h: canvas.height };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    particles.current = [];

    const tick = () => {
      const { w, h } = dims.current;
      ctx.clearRect(0, 0, w, h);

      if (!reducedMotion) {
        // Spawn
        while (particles.current.length < MAX_PARTICLES) {
          const p = spawnParticle(w, h, emotion, overrides);
          p.alpha = 0.6 + Math.random() * 0.4;
          particles.current.push(p);
        }

        // Update & draw
        particles.current = particles.current.filter((p) => {
          p.life += 1;

          const spd = overrides.particleSpeedMult;
          const wx  = (emotion.windX + overrides.windX) * 0.5;

          if (emotion.particleType === 'swirls') {
            const cx = w / 2, cy = h / 2;
            const dx = p.x - cx, dy = p.y - cy;
            const r  = Math.sqrt(dx * dx + dy * dy) || 1;
            const speed = 0.8 * spd;
            p.x += (-dy / r) * speed + wx * 0.2;
            p.y += (dx  / r) * speed;
          } else if (emotion.particleType === 'fireflies') {
            p.phase += 0.03;
            p.x += Math.sin(p.phase) * 1.0 * spd + wx * 0.3;
            p.y += p.vy;
          } else {
            p.x += p.vx;
            p.y += p.vy;
          }

          // Wrap
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;

          drawParticle(ctx, p);
          return p.life < p.maxLife;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [emotion, overrides, reducedMotion]);

  const blobData = useMemo(() => [
    { color: emotion.blobColors[0], delay: 0,   duration: 14, initialX: '25%',  initialY: '30%',  size: 480 },
    { color: emotion.blobColors[1], delay: 4,   duration: 18, initialX: '70%',  initialY: '60%',  size: 520 },
    { color: emotion.blobColors[2], delay: 8,   duration: 22, initialX: '50%',  initialY: '15%',  size: 380 },
  ], [emotion.blobColors]);

  const filterCss = `brightness(${overrides.brightness}%) saturate(${overrides.saturation}%) hue-rotate(${overrides.hueShift}deg)`;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      animate={{ filter: filterCss }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{ background: emotion.bgGradient }}
        transition={{ duration: 2.0, ease: 'easeInOut' }}
      />

      {/* Ambient blobs */}
      {!reducedMotion && blobData.map((b, i) => <AmbientBlob key={i} {...b} />)}

      {/* Scene elements — SD-generated images */}
      <AnimatePresence>
        {(emotion.svgElements.includes('sun') || overrides.elements.has('sunlight')) && (
          <motion.img key="sun" src="/games/emotion-canvas/element-sun.png" alt=""
            className="absolute pointer-events-none"
            style={{ top: '3%', right: '6%', width: 'min(18vw, 160px)', height: 'auto', mixBlendMode: 'screen' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.9, scale: [1, 1.05, 1] }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 1.0, scale: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } }}
          />
        )}

        {(emotion.svgElements.includes('moon') || overrides.elements.has('moon')) && (
          <motion.img key="moon" src="/games/emotion-canvas/element-moon.png" alt=""
            className="absolute pointer-events-none"
            style={{ top: '4%', right: '8%', width: 'min(14vw, 120px)', height: 'auto', mixBlendMode: 'screen' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 0.8, 0.6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {(emotion.svgElements.includes('clouds') || overrides.elements.has('extra-clouds')) && (
          <motion.div key="clouds" className="absolute inset-0 pointer-events-none">
            {[
              { top: '5%',  left: '8%',  size: 'min(22vw, 180px)' },
              { top: '3%',  left: '38%', size: 'min(26vw, 220px)' },
              { top: '6%',  left: '68%', size: 'min(20vw, 160px)' },
            ].map((pos, i) => (
              <motion.img key={i} src="/games/emotion-canvas/element-clouds.png" alt=""
                className="absolute"
                style={{ top: pos.top, left: pos.left, width: pos.size, height: 'auto', opacity: 0.55 }}
                animate={{ x: [0, 12, -6, 0] }}
                transition={{ duration: 16 + i * 5, repeat: Infinity, ease: 'easeInOut', delay: i * 3 }}
              />
            ))}
          </motion.div>
        )}

        {(emotion.svgElements.includes('rain') || emotion.id === 'sad' || emotion.id === 'overwhelmed') && !reducedMotion && (
          <motion.div key="rain" className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
          >
            <motion.img src="/games/emotion-canvas/element-rain.png" alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'cover', opacity: 0.35, mixBlendMode: 'screen' }}
              animate={{ y: ['-5%', '5%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
            />
          </motion.div>
        )}

        {(emotion.svgElements.includes('stars') || overrides.elements.has('extra-stars')) && (
          <motion.img key="stars" src="/games/emotion-canvas/element-stars.png" alt=""
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: 'cover', mixBlendMode: 'screen' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {overrides.elements.has('flowers') && (
          <motion.div key="flowers" className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ height: '45%' }}
            initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <motion.img src="/games/emotion-canvas/element-flowers.png" alt=""
              className="w-full h-full"
              style={{ objectFit: 'cover', objectPosition: 'bottom' }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

        {overrides.elements.has('orbs') && (
          <motion.div key="orbs" className="absolute inset-0 pointer-events-none">
            {[
              { top: '30%', left: '10%', size: 'min(18vw, 150px)' },
              { top: '15%', left: '45%', size: 'min(22vw, 190px)' },
              { top: '40%', left: '72%', size: 'min(16vw, 130px)' },
            ].map((pos, i) => (
              <motion.img key={i} src="/games/emotion-canvas/element-orbs.png" alt=""
                className="absolute"
                style={{ top: pos.top, left: pos.left, width: pos.size, height: 'auto', mixBlendMode: 'screen' }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
                transition={{ duration: 4 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle canvas — topmost */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)' }}
      />
    </motion.div>
  );
});

