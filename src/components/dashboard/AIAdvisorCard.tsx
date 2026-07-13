"use client";

// TODO: THREE.Clock.getElapsedTime() is deprecated upstream in @react-three/fiber.
// Replace with manual delta-based timing: useFrame((state, delta) => { elapsed += delta; })
// Tracked in Phase 6.7 — requires R3F API change across 4 call sites in this file.

/**
 * VaultIQ AI Advisor — JARVIS-Level 3D Experience
 * 
 * Stack: React Three Fiber (r3f) + @react-three/drei + Framer Motion
 * Install: npm i @react-three/fiber @react-three/drei three framer-motion
 *
 * This component:
 * 1. Opens with a 3D orb explosion cinematic
 * 2. Reveals floating holographic data panels
 * 3. Shows neural network lines connecting data streams
 * 4. The orb reacts to idle / thinking / speaking states
 * 5. Full AI chat with streamed responses
 * 6. Mouse parallax camera movement
 */

import { Suspense, useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, Torus, Points, PointMaterial, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import {
  Send, Mic, Check, TrendingUp, PiggyBank,
  Receipt, GraduationCap, ShieldCheck, Landmark, Lightbulb, ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrbState = "idle" | "thinking" | "speaking";

interface Profile {
  income: number | null;
  goal: { name: string; targetAmount?: number } | null;
  riskAppetite: string | null;
  portfolioValue: number | null;
  healthScore: number | null;
  healthLabel: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streamed?: boolean;
}

// ─── Static data (no Math.random() at render time) ───────────────────────────

const PARTICLE_DATA = Array.from({ length: 300 }, (_, i) => {
  const theta = (i / 300) * Math.PI * 2;
  const phi = Math.acos(1 - 2 * (i / 300));
  const r = 0.5 + ((i * 7919) % 100) / 200;
  return {
    x: Math.sin(phi) * Math.cos(theta) * r,
    y: Math.cos(phi) * r,
    z: Math.sin(phi) * Math.sin(theta) * r,
    phase: (i * 0.618) % (Math.PI * 2),
    speed: 0.3 + ((i * 13) % 10) / 30,
  };
});

const EXPLOSION_DATA = Array.from({ length: 150 }, (_, i) => {
  const theta = (i / 150) * Math.PI * 2;
  const phi = Math.acos(1 - 2 * (i / 150));
  const speed = 2 + ((i * 3571) % 100) / 25;
  return {
    vx: Math.sin(phi) * Math.cos(theta) * speed,
    vy: Math.cos(phi) * speed,
    vz: Math.sin(phi) * Math.sin(theta) * speed,
  };
});

const NEWS_ITEMS = [
  { text: "NIFTY 50 hits 52-week high on FII inflows", time: "2m ago", sentiment: "#34d399" },
  { text: "RBI holds repo rate — debt funds rally", time: "18m ago", sentiment: "#f59e0b" },
  { text: "Gold +1.8% — your allocation gains ₹22K", time: "1h ago", sentiment: "#60a5fa" },
];

const PROMPTS = [
  { icon: Landmark, label: "Prepay home loan?" },
  { icon: TrendingUp, label: "Portfolio check" },
  { icon: PiggyBank, label: "Goal planner" },
  { icon: Receipt, label: "Reduce taxes" },
  { icon: GraduationCap, label: "Education planning" },
  { icon: ShieldCheck, label: "Health score" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatINR(n: number | null) {
  if (n == null) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

// ─── 3D: Glass Orb Core ───────────────────────────────────────────────────────

function GlassOrb({ state }: { state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const thinking = state === "thinking";
    const speaking = state === "speaking";
    const speed = thinking ? 3.5 : speaking ? 5 : 1;
    const intensity = thinking ? 0.75 : speaking ? 0.95 : 0.35;

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.004;
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.04;
    }
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = intensity * (0.85 + Math.sin(t * speed) * 0.15);
    }
    if (pulseRef.current) {
      const s = 1 + Math.sin(t * speed * 1.3) * (thinking ? 0.12 : 0.06);
      pulseRef.current.scale.setScalar(s);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.7 + Math.sin(t * speed * 1.3) * 0.3;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2.5 + Math.sin(t * speed) * (thinking ? 1.2 : speaking ? 1.8 : 0.5);
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z += 0.003 * (thinking ? 2.5 : speaking ? 3.5 : 1);
    if (ring2Ref.current) ring2Ref.current.rotation.x += 0.002 * (thinking ? 2 : speaking ? 3 : 1);
    if (ring3Ref.current) ring3Ref.current.rotation.y += 0.0015 * (thinking ? 1.8 : 2.5);
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={lightRef} color={0xD4AF37} intensity={2.5} distance={8} />

      {/* Outer glass shell */}
      <Sphere ref={coreRef} args={[0.7, 64, 64]}>
        <meshPhongMaterial
          color={0x0a0a0c}
          emissive={0x1a0d00}
          specular={0xD4AF37}
          shininess={120}
          transparent
          opacity={0.88}
        />
      </Sphere>

      {/* Inner gold energy */}
      <Sphere ref={innerRef} args={[0.42, 32, 32]}>
        <meshPhongMaterial
          color={0x3a1e00}
          emissive={0xD4AF37}
          emissiveIntensity={0.35}
          transparent
          opacity={0.82}
        />
      </Sphere>

      {/* Core pulse */}
      <Sphere ref={pulseRef} args={[0.22, 16, 16]}>
        <meshBasicMaterial color={0xF5D060} transparent opacity={0.9} />
      </Sphere>

      {/* Orbital rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.006, 6, 80]} />
        <meshBasicMaterial color={0xD4AF37} transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.05, 0.004, 6, 80]} />
        <meshBasicMaterial color={0xF5D060} transparent opacity={0.22} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[1.2, 0.003, 6, 80]} />
        <meshBasicMaterial color={0xC8922A} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

// ─── 3D: Orbiting Particles ───────────────────────────────────────────────────

function OrbParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const positionArray = useMemo(() => {
    const arr = new Float32Array(PARTICLE_DATA.length * 3);
    PARTICLE_DATA.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; });
    return arr;
  }, []);
  const velocities = useMemo(() => PARTICLE_DATA.map(() => ({
    x: (((Math.floor(Math.random() * 1000)) / 1000) - 0.5) * 0.003,
    y: (((Math.floor(Math.random() * 1000)) / 1000) - 0.5) * 0.003,
    z: (((Math.floor(Math.random() * 1000)) / 1000) - 0.5) * 0.003,
  })), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const arr = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_DATA.length; i++) {
      arr[i * 3] += velocities[i].x;
      arr[i * 3 + 1] += velocities[i].y;
      arr[i * 3 + 2] += velocities[i].z;
      const d = Math.sqrt(arr[i*3]**2 + arr[i*3+1]**2 + arr[i*3+2]**2);
      if (d > 1.3 || d < 0.5) { velocities[i].x *= -1; velocities[i].y *= -1; velocities[i].z *= -1; }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    (meshRef.current.material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(t * 0.7) * 0.2;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
      </bufferGeometry>
      <pointsMaterial color={0xF5D060} size={0.018} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ─── 3D: Explosion ────────────────────────────────────────────────────────────

function ExplosionEffect({ onDone }: { onDone: () => void }) {
  const meshRef = useRef<THREE.Points>(null);
  const startTime = useRef<number | null>(null);
  const done = useRef(false);

  const positionArray = useMemo(() => new Float32Array(EXPLOSION_DATA.length * 3), []);

  useFrame(({ clock }) => {
    if (done.current || !meshRef.current) return;
    if (!startTime.current) startTime.current = clock.getElapsedTime();
    const et = clock.getElapsedTime() - startTime.current;

    const arr = meshRef.current.geometry.attributes.position.array as Float32Array;
    EXPLOSION_DATA.forEach((p, i) => {
      arr[i * 3] = p.vx * et * 0.1;
      arr[i * 3 + 1] = p.vy * et * 0.1;
      arr[i * 3 + 2] = p.vz * et * 0.1;
    });
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    (meshRef.current.material as THREE.PointsMaterial).opacity = Math.max(0, 0.9 - et * 1.2);

    if (et > 0.85) { done.current = true; onDone(); }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
      </bufferGeometry>
      <pointsMaterial color={0xF5D060} size={0.045} transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

// ─── 3D: Camera parallax ─────────────────────────────────────────────────────

function CameraRig({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame(({ camera }) => {
    camera.position.x += (mouse.current.x * 0.25 - camera.position.x) * 0.05;
    camera.position.y += (mouse.current.y * 0.15 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Neural Network SVG overlay ───────────────────────────────────────────────

function NeuralOverlay({ visible }: { visible: boolean }) {
  const nodes = [
    { x: 50, y: 50 }, { x: 13, y: 20 }, { x: 87, y: 20 },
    { x: 13, y: 80 }, { x: 87, y: 80 }, { x: 32, y: 50 }, { x: 68, y: 50 },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[5,1],[6,2],[5,3],[6,4]];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1.2, delay: 0.3 }}
      className="absolute inset-0 pointer-events-none"
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <style>{`@keyframes dash-flow { to { stroke-dashoffset: -20; } }`}</style>
        </defs>
        {edges.map(([a, b], i) => (
          <line key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke="rgba(212,175,55,0.15)"
            strokeWidth="0.4"
            strokeDasharray="2 3"
            style={{ animation: `dash-flow ${3 + i * 0.4}s linear infinite` }}
          />
        ))}
        {nodes.map((n, i) => i > 0 && (
          <circle key={i} cx={n.x} cy={n.y} r="0.8"
            fill="rgba(212,175,55,0.4)" stroke="rgba(212,175,55,0.6)" strokeWidth="0.3" />
        ))}
      </svg>
    </motion.div>
  );
}

// ─── Holographic Panel ────────────────────────────────────────────────────────

function HoloPanel({
  children, className, style, delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: "0 0 40px rgba(212,175,55,0.14), inset 0 1px 0 rgba(255,255,255,0.08)" }}
      className={`absolute rounded-xl p-4 ${className ?? ""}`}
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(0,0,0,0.75) 100%)",
        border: "1px solid rgba(212,175,55,0.18)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 0 24px rgba(212,175,55,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimBar({ value, color = "linear-gradient(90deg,#D4AF37,#34d399)", delay = 0 }: {
  value: number; color?: string; delay?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), delay * 1000 + 600); return () => clearTimeout(t); }, [value, delay]);
  return (
    <div className="h-[2px] w-full rounded-full mt-2.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-full rounded-full transition-all duration-[1400ms] ease-out" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

// ─── Waveform thinking indicator ──────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  const heights = [4, 8, 13, 13, 8, 4];
  return (
    <div className="flex items-end gap-0.5" style={{ height: 16 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ background: "rgba(212,175,55,0.65)" }}
          animate={active ? { scaleY: [0.3, 1, 0.3] } : { scaleY: 0.3 }}
          transition={{ duration: 0.8, repeat: active ? Infinity : 0, delay: i * 0.08, ease: "easeInOut" }}
          initial={{ height: h }}
        />
      ))}
    </div>
  );
}

// ─── Markdown content ─────────────────────────────────────────────────────────

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold text-zinc-100">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").filter(Boolean).map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} className="text-[12px] font-semibold text-amber-200/90 mt-2">{renderInline(line.slice(4))}</p>;
        if (/^[-*]\s/.test(line)) return <p key={i} className="text-[12px] text-zinc-400 pl-3 before:content-['·'] before:mr-1.5 before:text-amber-300/50">{renderInline(line.slice(2))}</p>;
        return <p key={i} className="text-[12px] leading-[1.7] text-zinc-400">{renderInline(line)}</p>;
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AIAdvisorCardProps {
  userId: string;
  profile: Profile;
  suggestions?: { icon?: "loan" | "portfolio" | "savings" | "tax" | "education" | "health"; label: string }[];
}

export default function AIAdvisorCard({
  userId,
  profile = {
    income: 0,
    goal: null,
    riskAppetite: "Moderate",
    portfolioValue: 0,
    healthScore: 0,
    healthLabel: "N/A"
  },
  suggestions = []
}: AIAdvisorCardProps) {
  const [uiReady, setUiReady] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const mouse = useRef({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = useCallback(async (msg: string) => {
    if (!msg.trim() || thinking) return;
    setInput("");
    setMessages(p => [...p, { role: "user", content: msg }]);
    setOrbState("thinking");
    setThinking(true);
    const thinkStart = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: Math.random().toString(36).substring(2) + Date.now().toString(36) }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const content = data?.data?.message || data?.message || data?.content || "Response unavailable.";

      // Ensure at least 2.5 seconds of thinking animation
      const elapsed = Date.now() - thinkStart;
      const minDelay = 2500;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      setOrbState("speaking");
      let i = 0;
      setMessages(p => [...p, { role: "assistant", content: "", streamed: false }]);
      const iv = setInterval(() => {
        i += 4;
        setMessages(p => p.map((m, idx) => idx === p.length - 1 ? { ...m, content: content.slice(0, i) } : m));
        if (i >= content.length) {
          clearInterval(iv);
          setMessages(p => p.map((m, idx) => idx === p.length - 1 ? { ...m, content, streamed: true } : m));
          setOrbState("idle");
        }
      }, 14);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Connection issue — please try again.", streamed: true }]);
      setOrbState("idle");
    } finally {
      setThinking(false);
    }
  }, [thinking]);

  const goalPct = profile?.portfolioValue && profile?.goal?.targetAmount
    ? Math.min(100, Math.round((profile.portfolioValue / profile.goal.targetAmount) * 100))
    : 0;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">

      {/* ── Three.js canvas ── */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: "absolute", inset: 0 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.08} />
        <directionalLight position={[-2, 2, 1]} intensity={0.5} color={0xF5D060} />

        <Suspense fallback={null}>
          <GlassOrb state={orbState} />
          <OrbParticles />
          {!uiReady && <ExplosionEffect onDone={() => setTimeout(() => setUiReady(true), 200)} />}
        </Suspense>

        <CameraRig mouse={mouse} />
      </Canvas>

      {/* ── Neural SVG overlay ── */}
      <NeuralOverlay visible={uiReady} />

      {/* ── UI Layer ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: uiReady ? 1 : 0 }}
        transition={{ duration: 1.2 }}
      >
        {/* Orb identity label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          style={{ marginTop: "120px" }}>
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-zinc-600">AI Online</p>
        </div>

        {/* Top-left: Health */}
        <HoloPanel className="top-[8%] left-[2%] w-44 pointer-events-auto" delay={0.1}>
          <p className="text-[9px] uppercase tracking-[0.12em] text-amber-400/60 mb-1.5">Financial Health</p>
          <p className="text-2xl font-semibold text-amber-300 leading-none">
            {profile.healthScore ?? 0}<span className="text-sm text-amber-300/50">%</span>
          </p>
          <p className="text-[11px] text-white/35 mt-1">{profile.healthLabel ?? "N/A"}</p>
          <AnimBar value={profile.healthScore ?? 0} delay={0.1} />
        </HoloPanel>

        {/* Top-right: Portfolio */}
        <HoloPanel className="top-[8%] right-[2%] w-44 pointer-events-auto" delay={0.2}>
          <p className="text-[9px] uppercase tracking-[0.12em] text-amber-400/60 mb-1.5">Portfolio</p>
          <p className="text-2xl font-semibold text-amber-300 leading-none">{formatINR(profile.portfolioValue)}</p>
          <p className="text-[11px] text-white/35 mt-1">{profile.riskAppetite ?? "Moderate"}</p>
          <AnimBar value={68} color="linear-gradient(90deg,#60a5fa,#D4AF37)" delay={0.2} />
        </HoloPanel>

        {/* Bottom-left: Goal */}
        <HoloPanel className="bottom-[30%] left-[2%] w-48 pointer-events-auto" delay={0.3}>
          <p className="text-[9px] uppercase tracking-[0.12em] text-amber-400/60 mb-1.5">{profile.goal?.name ?? "House Purchase"}</p>
          <p className="text-lg font-semibold text-amber-300">₹{((profile.goal?.targetAmount ?? 0) / 100000).toFixed(0)}L <span className="text-xs text-white/30">target</span></p>
          <p className="text-[11px] text-white/35 mt-1">{formatINR(profile.portfolioValue)} saved · {goalPct}% done</p>
          <AnimBar value={goalPct} color="linear-gradient(90deg,#34d399,#D4AF37)" delay={0.3} />
        </HoloPanel>

        {/* Top-center: Live news */}
        <HoloPanel
          className="top-[6%] pointer-events-auto"
          style={{ left: "50%", transform: "translateX(-50%)", width: 240 }}
          delay={0.15}
        >
          <p className="text-[9px] uppercase tracking-[0.12em] text-amber-400/60 mb-2">Live market signals</p>
          {NEWS_ITEMS.map((n, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: n.sentiment }} />
              <div>
                <p className="text-[11px] text-white/50 leading-snug">{n.text}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </HoloPanel>

        {/* Bottom: Chat panel */}
        <div
          className="absolute bottom-[2%] pointer-events-auto"
          style={{
            left: "50%", transform: "translateX(-50%)",
            width: "min(500px, 90%)",
            background: "rgba(4,4,8,0.94)",
            border: "1px solid rgba(212,175,55,0.14)",
            borderRadius: 16,
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.04)",
          }}
        >
          {/* Messages */}
          <div
            ref={scrollRef}
            className="max-h-36 overflow-y-auto px-4 pt-3 pb-2 space-y-2.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-[10px] text-amber-400/50 tracking-wider uppercase mb-1">VaultIQ AI</p>
                  <p className="text-[12px] text-white/55 leading-relaxed">
                    Your financial intelligence is online. Portfolio up 12.4% YTD. Ask me anything.
                  </p>
                </motion.div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className={m.role === "user" ? "flex justify-end" : ""}
                >
                  {m.role === "user" ? (
                    <span className="inline-block text-[12px] text-emerald-100/90 px-3 py-1.5 rounded-[10px]"
                      style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.14)" }}>
                      {m.content}
                    </span>
                  ) : (
                    <div>
                      <p className="text-[9px] tracking-wider uppercase text-amber-400/50 mb-1">VaultIQ AI</p>
                      <div className="inline-block px-3 py-2 rounded-[10px] max-w-[85%]"
                        style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)" }}>
                        <MarkdownContent text={m.content} />
                        {!m.streamed && (
                          <motion.span className="inline-block w-[2px] h-3 bg-amber-300/80 ml-0.5 -translate-y-0.5 align-middle"
                            animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }} />
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              {thinking && (
                <motion.div key="thinking" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[10px]"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "inline-flex" }}>
                  <Waveform active />
                  <span className="text-[11px] text-zinc-500">Analyzing your profile…</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Suggestion chips */}
          <div className="flex gap-1.5 flex-wrap px-4 pb-2 pt-1">
            {PROMPTS.slice(0, 4).map(({ icon: Icon, label }) => (
              <button key={label} onClick={() => sendMessage(label)}
                className="flex items-center gap-1 text-[10.5px] px-2.5 py-1 rounded-[7px] transition-all text-zinc-500 hover:text-zinc-200"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
              >
                <Icon size={10} className="text-amber-400/60" />{label}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 px-4 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask VaultIQ anything…"
              className="flex-1 rounded-[10px] py-2 px-3 text-[12px] text-zinc-100 outline-none placeholder:text-zinc-700 transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(212,175,55,0.3)"; (e.target as HTMLInputElement).style.boxShadow = "0 0 0 1px rgba(212,175,55,0.1)"; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
            />
            <button disabled className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 cursor-not-allowed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Mic size={13} className="text-zinc-600" />
            </button>
            <motion.button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || thinking}
              whileHover={{ y: -1, boxShadow: "0 0 16px rgba(212,175,55,0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 disabled:opacity-30"
              style={{ background: "linear-gradient(135deg, #F5D060, #C8922A)" }}
            >
              <Send size={13} color="#000" />
            </motion.button>
          </div>
        </div>

        {/* Context strip — bottom-right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: uiReady ? 1 : 0 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-[2%] right-[2%] pointer-events-auto"
        >
          <div className="flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
            <p className="text-[9px] uppercase tracking-widest text-zinc-700 mb-1">Using</p>
            {["Income", "Goals", "Portfolio", "Health", "Market"].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                <Check size={8} className="text-emerald-400/80" />{item}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
