import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Code } from 'lucide-react';
import { iconMap } from '../lib/iconMap';

const MotionLink = motion(Link);

// Presentational nicknames
const STATION_NAMES = {
  'image': 'The Lens',
  'document': 'The Press',
  'video': 'The Reel',
  'dev': 'The Bench',
};

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Nothing uploads',
    body: "Every tool runs in your browser or against your own local backend. Files never touch a server you don't control.",
  },
  {
    icon: Zap,
    title: 'No limits, no signup',
    body: 'No account, no daily quota, no "upgrade to process files over 10MB." Use what you need, as often as you need it.',
  },
  {
    icon: Code,
    title: 'A toolbox, not a suite',
    body: 'Each tool does one job well. Pick the one you need, get your file, get back to work.',
  },
];

const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 6.7) % 100}%`,
  delay: `${(i * 0.31) % 4.5}s`,
  duration: `${4 + (i % 5)}s`,
}));

// Master Sequence for Hero and Feature Sections
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const jumpItemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 220, damping: 18, mass: 1 } 
  }
};

function StationCard({ cat, index }) {
  const Icon = iconMap[cat.iconName];
  const station = STATION_NAMES[cat.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-20px' }} 
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.1 }}
    >
      <MotionLink
        to={`/app/category/${cat.id}`}
        whileHover={{ y: -5, scale: 1.02 }}
        className="group block h-full rounded-2xl p-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 border border-white/5 hover:border-white/10 bg-white/5 transition-all shadow-lg overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div
            className="p-3 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors shadow-sm"
            style={{ backgroundColor: `${cat.color}15` }}
          >
            {Icon && <Icon size={22} style={{ color: cat.color }} />}
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-black/40 text-slate-400 border border-white/5 shadow-inner">
            {cat.tools.length} tools
          </span>
        </div>

        {station && (
          <div className="text-xs font-mono tracking-widest uppercase mb-1 relative z-10" style={{ color: cat.color }}>
            {station}
          </div>
        )}
        <h3 className="text-xl font-bold text-white mb-3 relative z-10">{cat.label}</h3>

        <div className="flex flex-wrap gap-2 mb-6 relative z-10">
          {cat.tools.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300"
            >
              {t.title}
            </span>
          ))}
          {cat.tools.length > 3 && (
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-black/30 border border-white/5 text-slate-500">
              +{cat.tools.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400 group-hover:text-white transition-colors relative z-10">
          Open station
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </div>
      </MotionLink>
    </motion.div>
  );
}

export default function Homepage({ categories }) {
  const shouldReduceMotion = useReducedMotion();
  const totalTools = categories.reduce((sum, c) => sum + c.tools.length, 0);
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-[#050505] text-white overflow-x-hidden selection:bg-[#3b82f6]/30 selection:text-white relative">
      
      {/* ── FIXED FROSTED TOP BAR ────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full flex items-center justify-between px-6 md:px-12 py-5 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <span className="text-2xl font-black tracking-tight text-white drop-shadow-md cursor-default">
          NEXUS<span className="text-[#3b82f6]">FORGE</span>
        </span>
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded group"
        >
          Open Workspace <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </header>

      {/* ── SECTION 1: HERO (100vh) ──────────────────────────────────── */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pt-20">
        {!shouldReduceMotion && (
          <div className="pointer-events-none absolute inset-0">
            {SPARKS.map((s, i) => (
              <span
                key={i}
                className="spark"
                style={{ left: s.left, animationDelay: s.delay, animationDuration: s.duration }}
              />
            ))}
            <div
              className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[130px]"
              style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
            />
          </div>
        )}

        <style>{`
          @keyframes spark-rise {
            0%   { transform: translateY(0) scale(1);   opacity: 0; }
            12%  { opacity: 0.85; }
            100% { transform: translateY(-250px) scale(0.35); opacity: 0; }
          }
          .spark {
            position: absolute;
            bottom: 0;
            width: 3px;
            height: 3px;
            border-radius: 9999px;
            background: #3b82f6;
            box-shadow: 0 0 10px 2px rgba(59, 130, 246, 0.6);
            animation: spark-rise linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .spark { animation: none !important; opacity: 0; }
          }
        `}</style>

        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="relative max-w-4xl mx-auto text-center z-10"
        >
          <motion.div variants={jumpItemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 mb-8 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            <span className="text-sm text-[#3b82f6] font-medium tracking-wide">
              {totalTools} Tools · Local Compute · Zero Uploads
            </span>
          </motion.div>

          <motion.h1 variants={jumpItemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight mb-8">
            Every file,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-purple-500 drop-shadow-sm">
              forged locally.
            </span>
          </motion.h1>
          
          <motion.p variants={jumpItemVariants} className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed">
            {totalTools} browser-based tools for images, documents, video, and code.
            Nothing you drop in ever leaves your machine.
          </motion.p>

          <motion.div variants={jumpItemVariants} className="flex flex-col sm:flex-row gap-5 justify-center">
            <MotionLink
              to="/app"
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-3 bg-[#3b82f6] hover:bg-blue-500 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/70"
            >
              Enter the Forge <ArrowRight size={20} />
            </MotionLink>
            <a
              href="#stations"
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Explore Arsenal
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ── SECTION 2: STATIONS ──────────────────────────────────────── */}
      <section id="stations" className="w-full py-32 px-6 bg-gradient-to-b from-transparent to-white/[0.01] scroll-mt-20">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="max-w-2xl mb-16"
          >
            <motion.h2 variants={jumpItemVariants} className="text-4xl md:text-5xl font-black mb-6 tracking-tight">The Stations</motion.h2>
            <motion.p variants={jumpItemVariants} className="text-slate-400 text-xl leading-relaxed">
              Four workbenches, {totalTools} tools. Walk up to the one that fits the file in front of you.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((cat, i) => (
              <StationCard key={cat.id} cat={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: FEATURES ──────────────────────────────────────── */}
      <section className="w-full py-32 px-6 border-t border-white/5 bg-white/[0.02]">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1400px] mx-auto w-full"
        >
          <motion.h2 variants={jumpItemVariants} className="text-5xl md:text-6xl font-black mb-24 max-w-3xl tracking-tight text-white">
            Built to never see your files.
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div variants={jumpItemVariants} key={f.title}>
                  <div className="w-14 h-14 rounded-2xl bg-[#10B981]/5 flex items-center justify-center text-[#10B981] mb-8 border border-[#10B981]/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                  <p className="text-lg text-slate-400 leading-relaxed">{f.body}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="w-full px-6 py-10 border-t border-white/5 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium text-slate-500">
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">nexusforge</span>
            <span>&copy; {currentYear}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-slate-400">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          </div>

          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-white hover:text-[#3b82f6] transition-colors group font-bold shrink-0"
          >
            Open the toolkit <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </footer>
    </div>
  );
}