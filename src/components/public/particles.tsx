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
      // Increased particle count for better visibility
      const particleCount = Math.min(60, Math.floor((canvasEl.width * canvasEl.height) / 25000));
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvasEl.width,
          y: Math.random() * canvasEl.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          r: Math.random() * 3 + 1,
          alpha: Math.random() * 0.6 + 0.2,
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      // Enhanced colors for better visibility in both themes
      const color = isDark ? "255, 255, 255" : "73, 40, 63";

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges instead of wrapping
        if (p.x < 0 || p.x > canvasEl.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvasEl.height) p.vy *= -1;

        // Draw connections between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${color}, ${0.2 * (1 - dist / 180)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw particle with glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${color}, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
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
