"use client";

import { useEffect, useRef } from "react";

interface CelebrateBurstProps {
  active?: boolean;
  onComplete?: () => void;
}

export function CelebrateBurst({ active = false, onComplete }: CelebrateBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const colors = ["#E8628A", "#EBA63E", "#46C2A6", "#D6356E", "#C0396B"];
    const particles = Array.from({ length: 60 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 40,
      y: H / 2 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 6,
      vy: -(Math.random() * 8 + 2),
      size: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      shape: Math.random() > 0.5 ? "circle" : "rect",
    }));

    let frame = 0;
    const maxFrames = 90;

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.alpha = Math.max(0, 1 - frame / maxFrames);

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6);
        }
      });

      ctx.globalAlpha = 1;
      frame++;

      if (frame < maxFrames) {
        animRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, W, H);
        onComplete?.();
      }
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="pointer-events-none absolute inset-0 m-auto"
      style={{ zIndex: 50 }}
      aria-hidden="true"
    />
  );
}
