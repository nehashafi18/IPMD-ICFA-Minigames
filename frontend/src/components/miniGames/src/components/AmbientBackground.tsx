import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { SHOWCASE_IMAGES } from '../config/showcaseImages';
import { QuantumTunnelEngine } from '../three/QuantumTunnelEngine';

// The same archive corridor from the transition screen, running as a slow,
// indefinite ambient drift behind the menu — so the menu still feels like
// the same magical art world, not a separate app screen.
export default function AmbientBackground() {
  const prefersReduced = useReducedMotion();
  const storeReduced   = useAppStore(s => s.reducedMotion);
  const reduced         = storeReduced || !!prefersReduced;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const urls = SHOWCASE_IMAGES.map(s => s.src);
    if (!urls.length) return;

    const engine = new QuantumTunnelEngine({
      canvas,
      urls,
      reducedMotion: reduced,
      ambient: true,
    });
    engine.start();

    return () => engine.dispose();
  }, [reduced]);

  if (reduced) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: '#0e0b08' }}
      />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ background: '#000000' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {/* Soft overlay so foreground text and cards stay legible */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 90% 75% at 50% 38%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.72) 100%)' }}
      />
    </div>
  );
}
