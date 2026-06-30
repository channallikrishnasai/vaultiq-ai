"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LevelCardProps {
  xp: number;
  streak: number;
  
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = display;
    const diff = value - start;
    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{display}</span>;
}

export default function LevelCard({
    xp,
     streak,
 
  
}: LevelCardProps) {
    const level = Math.floor(xp / 100) + 1;
const currentXP = xp % 100;
const xpForNextLevel = 100;
const progressPct = (currentXP / xpForNextLevel) * 100;
  return (
    <div className="relative w-full rounded-2xl border border-zinc-700/50 bg-zinc-900/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* top row */}
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Level
          </p>
          <p className="mt-1 text-4xl font-extrabold leading-none bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            <AnimatedNumber value={level} />
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {streak > 0 && (
            <motion.div
              className="flex items-center gap-1 rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-300"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <span>🔥</span>
              <AnimatedNumber value={streak} />
            </motion.div>
          )}

          <motion.div
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-800/80"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-lg">⚡</span>
            <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-md" />
          </motion.div>
        </div>
      </div>

      {/* progress bar */}
      <div className="relative mt-5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800/80 ring-1 ring-zinc-700/40">
          <motion.div
            className="relative h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-white/40 blur-[6px]"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
          <span>Progress</span>
          <span className="font-medium text-zinc-400">
            <AnimatedNumber value={currentXP} /> / {xpForNextLevel} XP
          </span>
        </div>
      </div>
    </div>
  );
}