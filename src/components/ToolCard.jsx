import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MotionLink = motion(Link);

export default function ToolCard({ title, description, icon: Icon, accentColor, to }) {
  return (
    <MotionLink
      to={to}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="glass-panel p-6 cursor-pointer group relative overflow-hidden flex flex-col h-full border border-white/5 hover:border-white/20 transition-colors text-left w-full block"
    >
      {/* Subtle radial glow that appears on hover, mapped to the category color */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ease-out"
        style={{ backgroundImage: `radial-gradient(circle at top right, ${accentColor}, transparent 70%)` }}
      />

      {/* Icon Wrapper with a slight tilt on hover */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 shadow-lg"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor, boxShadow: `0 4px 20px -5px ${accentColor}40` }}
      >
        {Icon ? (
          <Icon size={24} strokeWidth={1.5} />
        ) : (
          <span className="text-xs font-bold text-red-400" title="Missing icon — check iconMap.js">?</span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 flex-1 leading-relaxed">{description}</p>
    </MotionLink>
  );
}