"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface Drop { x: number; y: number; len: number; speed: number; opacity: number; }
interface LightningBolt { id: number; x: number; segments: { dx: number; dy: number }[]; width: number; }

function generateBolt(endY: number): { dx: number; dy: number }[] {
  const segments: { dx: number; dy: number }[] = [];
  let currentY = 0;
  while (currentY < endY) {
    const segLen = Math.random() * 40 + 20;
    const dx = (Math.random() - 0.5) * 80;
    const dy = Math.min(segLen, endY - currentY);
    segments.push({ dx, dy });
    currentY += dy;
  }
  return segments;
}

export default function ThunderstormBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lightnings, setLightnings] = useState<LightningBolt[]>([]);
  const [flash, setFlash] = useState(0);
  const idRef = useRef(0);
  const dropsRef = useRef<Drop[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      dropsRef.current = Array.from({ length: 220 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        len: Math.random() * 18 + 10, speed: Math.random() * 10 + 14,
        opacity: Math.random() * 0.4 + 0.15,
      }));
    }
    resize();
    window.addEventListener("resize", resize);
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#a8c8e8";
      ctx.lineWidth = 1;
      for (const drop of dropsRef.current) {
        ctx.globalAlpha = drop.opacity;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.len * 0.2, drop.y + drop.len);
        ctx.stroke();
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.2;
        if (drop.y > canvas.height) { drop.y = -drop.len; drop.x = Math.random() * canvas.width; }
        if (drop.x < 0) drop.x = canvas.width;
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  const triggerLightning = useCallback(() => {
    const id = ++idRef.current;
    const x = Math.random() * 80 + 10;
    const segments = generateBolt(window.innerHeight * 0.6);
    setLightnings((prev) => [...prev, { id, x, segments, width: Math.random() * 2 + 1.5 }]);
    setFlash(1);
    setTimeout(() => setFlash(0.4), 60);
    setTimeout(() => setFlash(0.8), 120);
    setTimeout(() => setFlash(0), 180);
    setTimeout(() => { setLightnings((prev) => prev.filter((l) => l.id !== id)); }, 350);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    function schedule() {
      timeout = setTimeout(() => {
        triggerLightning();
        if (Math.random() > 0.5) setTimeout(triggerLightning, 150);
        schedule();
      }, Math.random() * 3500 + 1200);
    }
    schedule();
    return () => clearTimeout(timeout);
  }, [triggerLightning]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "radial-gradient(ellipse at 50% 0%, #1a1f2e 0%, #0d1117 55%, #060a0f 100%)" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(180, 210, 255, 1)", opacity: flash * 0.18, pointerEvents: "none", zIndex: 10, transition: "opacity 0.05s" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {[
          { top: "-6%", left: "-15%", width: "65%", speed: 28, delay: 0, opacity: 0.88 },
          { top: "2%", left: "40%", width: "55%", speed: 38, delay: -8, opacity: 0.75 },
          { top: "-2%", left: "70%", width: "50%", speed: 22, delay: -4, opacity: 0.82 },
          { top: "12%", left: "-10%", width: "45%", speed: 45, delay: -14, opacity: 0.6 },
          { top: "8%", left: "55%", width: "40%", speed: 32, delay: -6, opacity: 0.7 },
        ].map((cloud, i) => (
          <div key={i} style={{ position: "absolute", top: cloud.top, left: cloud.left, width: cloud.width, animation: `cloudDrift ${cloud.speed}s linear ${cloud.delay}s infinite` }}>
            <svg viewBox="0 0 400 160" style={{ width: "100%", opacity: cloud.opacity }}>
              <defs><filter id={`blur${i}`}><feGaussianBlur stdDeviation="6" /></filter></defs>
              <ellipse cx="200" cy="110" rx="190" ry="55" fill="#1e2535" filter={`url(#blur${i})`} />
              <ellipse cx="140" cy="90" rx="110" ry="65" fill="#232b3e" filter={`url(#blur${i})`} />
              <ellipse cx="260" cy="95" rx="90" ry="55" fill="#1a2030" filter={`url(#blur${i})`} />
              <ellipse cx="200" cy="75" rx="70" ry="50" fill="#2a334a" filter={`url(#blur${i})`} />
            </svg>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2 }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none" }}>
        {lightnings.map((bolt) => {
          let cx = (bolt.x / 100) * (typeof window !== "undefined" ? window.innerWidth : 1280);
          let cy = 0;
          let pathD = `M ${cx} ${cy}`;
          for (const seg of bolt.segments) { cx += seg.dx; cy += seg.dy; pathD += ` L ${cx} ${cy}`; }
          return (
            <g key={bolt.id}>
              <path d={pathD} stroke="rgba(150,200,255,0.25)" strokeWidth={bolt.width * 6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d={pathD} stroke="rgba(180,220,255,0.6)" strokeWidth={bolt.width * 2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d={pathD} stroke="#e8f4ff" strokeWidth={bolt.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
      <style>{`@keyframes cloudDrift { 0% { transform: translateX(0px); } 50% { transform: translateX(40px); } 100% { transform: translateX(0px); } }`}</style>
    </div>
  );
}
