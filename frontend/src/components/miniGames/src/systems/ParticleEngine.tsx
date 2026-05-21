import { useEffect, useRef } from 'react';
import { getParticleConfig } from './particleStyles';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  scale: number;
  scaleDelta: number;
}

interface Burst {
  x: number;
  y: number;
  artStyleId: string;
}

interface Props {
  bursts: Burst[];
  onBurstsConsumed: () => void;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

function makeParticle(burst: Burst): Particle {
  const cfg = getParticleConfig(burst.artStyleId);
  const angle = rand(0, Math.PI * 2);
  const spreadRad = (cfg.spread / 2) * (Math.PI / 180);
  const actualAngle = angle * (cfg.spread / 360) * 2 * Math.PI;
  const speed = rand(cfg.speed[0], cfg.speed[1]);
  const color = Math.random() > 0.5 ? cfg.color : cfg.secondaryColor;
  const maxLife = rand(cfg.lifetime[0], cfg.lifetime[1]);
  return {
    x: burst.x,
    y: burst.y,
    vx: Math.cos(actualAngle) * speed,
    vy: Math.sin(actualAngle) * speed - rand(0.5, 2),
    size: rand(cfg.size[0], cfg.size[1]),
    color,
    alpha: 1,
    life: 0,
    maxLife,
    rotation: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.1, 0.1),
    scale: 0.1,
    scaleDelta: rand(0.02, 0.06),
  };
  void spreadRad;
}

export default function ParticleEngine({ bursts, onBurstsConsumed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastBurstsRef = useRef<Burst[]>([]);

  useEffect(() => {
    if (bursts.length === 0) return;
    // Only process new bursts
    const newBursts = bursts.filter((b) => !lastBurstsRef.current.includes(b));
    lastBurstsRef.current = bursts;

    newBursts.forEach((burst) => {
      const cfg = getParticleConfig(burst.artStyleId);
      for (let i = 0; i < cfg.count; i++) {
        particlesRef.current.push(makeParticle(burst));
      }
    });
    onBurstsConsumed();
  }, [bursts, onBurstsConsumed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      for (const p of particlesRef.current) {
        const t = p.life / p.maxLife;
        const cfg = getParticleConfig('soft-pastel'); // just for gravity
        void cfg;
        p.life += 16;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.alpha = 1 - t;
        p.scale = t < 0.3 ? lerp(0.1, 1.2, t / 0.3) : lerp(1.2, 0, (t - 0.3) / 0.7);
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scale, p.scale);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 1.5;

        // Draw sparkle as 4-point star, otherwise circle
        if (Math.random() < 0.01) {
          // star
          const s = p.size / 2;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
            ctx.lineTo(Math.cos(angle + Math.PI / 4) * (s * 0.4), Math.sin(angle + Math.PI / 4) * (s * 0.4));
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
