import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Command, Image as ImageIcon, FileText, Video, Terminal, LayoutGrid } from 'lucide-react';

// Helper to assign the correct icon based on your category labels
const getIconForCategory = (label) => {
  const lower = label.toLowerCase();
  if (lower.includes('image') || lower.includes('vision')) return <ImageIcon size={16} />;
  if (lower.includes('document') || lower.includes('pdf')) return <FileText size={16} />;
  if (lower.includes('video') || lower.includes('audio')) return <Video size={16} />;
  if (lower.includes('dev') || lower.includes('code')) return <Terminal size={16} />;
  return <LayoutGrid size={16} />;
};

export default function Sidebar({ categories, activeCategory, onSelectCategory, onHome, isHome }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // ── KEYBOARD SHORTCUT (Cmd+K / Ctrl+K) ───────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCategories = categories.filter(cat => {
    const matchesCat = cat.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTools = cat.tools.some(tool => tool.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat || matchesTools;
  });

  const totalTools = categories.reduce((acc, cat) => acc + cat.tools.length, 0);

  return (
    // THE FIX: Detached from edges, calc height, margins, rounded-3xl, and full borders
    <aside className="w-[290px] flex flex-col h-[calc(100vh-40px)] my-5 ml-5 rounded-3xl border border-white/10 bg-[#0a0a0a]/40 backdrop-blur-3xl z-20 shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-7 pt-8 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <h1 className="text-2xl font-black tracking-tight text-white mb-0.5 flex items-center drop-shadow-md">
            NEXUS<span className="text-[#3b82f6]">FORGE</span>
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {totalTools} tools
          </p>
        </motion.div>
      </div>

      {/* ── DASHBOARD LINK ──────────────────────────────────────────────── */}
      <div className="px-4 mt-2">
        <motion.button
          onClick={() => { onHome(); setSearchQuery(''); }}
          whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
          whileTap={{ scale: 0.97 }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border ${
            isHome 
              ? 'text-white bg-white/10 border-white/10 shadow-lg backdrop-blur-md' 
              : 'text-slate-400 hover:text-slate-200 border-transparent'
          }`}
        >
          <Home size={18} strokeWidth={isHome ? 2.5 : 2} className={isHome ? 'text-white' : ''} />
          <span className={`text-sm ${isHome ? 'font-semibold' : 'font-medium'}`}>Dashboard</span>
        </motion.button>
      </div>

      {/* ── INTERACTIVE SEARCH BAR (FROSTED) ────────────────────────────── */}
      <div className="px-4 mt-4 mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors duration-300" size={16} />
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..." 
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-3 pl-11 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#3b82f6]/50 focus:bg-white/10 focus:ring-4 focus:ring-[#3b82f6]/10 transition-all duration-300 shadow-sm" 
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-white/5 rounded-md px-1.5 py-1 text-[10px] font-mono text-slate-400 border border-white/10 pointer-events-none group-focus-within:opacity-0 transition-opacity">
            <Command size={10} className="mr-0.5" />K
          </div>
        </div>
      </div>

      {/* ── CATEGORY LIST (ARSENAL) ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence>
          {filteredCategories.length > 0 && (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-4"
            >
              Arsenal
            </motion.p>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <AnimatePresence mode='popLayout'>
            {filteredCategories.map((cat) => {
              const isActive = activeCategory?.id === cat.id && !isHome;
              
              return (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25, layout: { duration: 0.3 } }}
                  key={cat.id}
                  onClick={() => { onSelectCategory(cat); setSearchQuery(''); }}
                  whileHover={{ x: 4, backgroundColor: isActive ? '' : 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 border ${
                    isActive 
                      ? 'text-white bg-white/10 border-white/10 shadow-lg backdrop-blur-md' 
                      : 'text-slate-400 hover:text-slate-200 border-transparent'
                  }`}
                >
                  {/* Colored Icon Box */}
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 shrink-0"
                    style={{ 
                      backgroundColor: isActive ? `${cat.color}25` : 'rgba(255,255,255,0.03)',
                      color: isActive ? cat.color : '#94a3b8',
                      border: isActive ? `1px solid ${cat.color}40` : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {getIconForCategory(cat.label)}
                  </div>
                  
                  <span className={`text-sm text-left flex-1 transition-all duration-300 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {cat.label}
                  </span>
                  
                  {/* Tool Count Badge */}
                  <span className={`text-[10px] font-mono px-2 py-1 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-black/30 text-white border border-white/5 shadow-inner' 
                      : 'bg-white/5 text-slate-500 border border-transparent'
                  }`}>
                    {cat.tools.length}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
          
          {/* Empty Search State */}
          {filteredCategories.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 text-slate-500 text-sm">
              No tools found for "{searchQuery}"
            </motion.div>
          )}
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div className="mt-auto px-6 pb-6 pt-4 shrink-0">
        <div className="border-t border-white/5 pt-4 flex justify-center">
          <p className="text-[10px] text-slate-600 font-medium tracking-wide">Files never leave your device.</p>
        </div>
      </div>
      
    </aside>
  );
}