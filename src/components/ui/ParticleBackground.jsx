import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 55;
const MAX_DIST = 130;
const GRID_SIZE = 28;

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 0.4,
      baseOpacity: Math.random() * 0.35 + 0.08,
      pulseSpeed: Math.random() * 0.018 + 0.008,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    let tick = 0;

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, w, h);

      // Dot grid
      for (let gx = 0; gx <= w; gx += GRID_SIZE) {
        for (let gy = 0; gy <= h; gy += GRID_SIZE) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.55, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,224,192,0.06)';
          ctx.fill();
        }
      }

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,224,192,${0.11 * (1 - d / MAX_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;

        const op = Math.max(0, p.baseOpacity + Math.sin(tick * p.pulseSpeed + p.pulsePhase) * 0.12);

        // Glow halo for larger dots
        if (p.r > 1.1) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          grd.addColorStop(0, `rgba(0,224,192,${op * 0.25})`);
          grd.addColorStop(1, 'rgba(0,224,192,0)');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,224,192,${op})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
