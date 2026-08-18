import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { iconMap } from '../lib/iconMap';

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.4 } },
};

function CategoryCard({ cat, onSelect }) {
  const Icon = iconMap[cat.iconName];
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(cat)}
      className="relative liquid-glass rounded-2xl p-6 cursor-pointer group overflow-hidden"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at top left, ${cat.color}18, transparent 65%)` }}
      />

      <div className="flex justify-between items-start mb-5">
        <div
          className="p-3 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors"
          style={{ backgroundColor: `${cat.color}18` }}
        >
          {Icon && <Icon size={22} style={{ color: cat.color }} />}
        </div>
        <ArrowRight
          size={17}
          className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"
        />
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">{cat.label}</h3>
      <p className="text-xs text-slate-500 mb-4">{cat.tools.length} tools available</p>

      {/* Tool name pills */}
      <div className="flex flex-wrap gap-1.5">
        {cat.tools.slice(0, 3).map(t => (
          <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {t.title}
          </span>
        ))}
        {cat.tools.length > 3 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-500">
            +{cat.tools.length - 3} more
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard({ categories, onSelectCategory }) {
  const totalTools = categories.reduce((sum, c) => sum + c.tools.length, 0);

  return (
    <div className="max-w-5xl mx-auto">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-14 mt-2"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-accent font-medium">
            {totalTools} Tools · All Client-Side · Zero Uploads
          </span>
        </div>
        <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
          Welcome to the<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">
            Forge.
          </span>
        </h2>
        <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
          A premium all-in-one toolkit for images, documents, video, and developer utilities.
          Everything runs directly in your browser — nothing is ever uploaded to a server.
        </p>
      </motion.div>

      {/* Category cards 2×2 grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10"
      >
        {categories.map(cat => (
          <CategoryCard key={cat.id} cat={cat} onSelect={onSelectCategory} />
        ))}
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Tools Available',       value: totalTools },
          { label: 'File Formats Supported', value: '25+'     },
          { label: 'Server Uploads',         value: '0'       },
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-5 text-center">
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}