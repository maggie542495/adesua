"use client";

import { useEffect, useRef } from "react";

export function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current!;
    const ctx = canvasEl.getContext("2d")!;

    let animationId: number;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    let isDark = document.documentElement.classList.contains("dark");

    function resize() {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      const particleCount = Math.min(40, Math.floor((canvasEl.width * canvasEl.height) / 35000));
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvasEl.width,
          y: Math.random() * canvasEl.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 2 + 1,
          alpha: Math.random() * 0.4 + 0.1,
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      const color = isDark ? "201, 154, 114" : "73, 40, 63";

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvasEl.width;
        if (p.x > canvasEl.width) p.x = 0;
        if (p.y < 0) p.y = canvasEl.height;
        if (p.y > canvasEl.height) p.y = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${color}, ${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    resize();
    animate();
    window.addEventListener("resize", resize);

    const darkObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
    });
    darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      darkObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 opacity-40 dark:opacity-30"
      aria-hidden
    />
  );
}
