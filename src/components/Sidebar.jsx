import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Command, Image as ImageIcon, FileText, Video, Terminal, LayoutGrid, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { iconMap } from '../lib/iconMap';

const MotionLink = motion(Link);

const getIconForCategory = (label) => {
  const lower = label.toLowerCase();
  if (lower.includes('image') || lower.includes('vision')) return <ImageIcon size={16} />;
  if (lower.includes('document') || lower.includes('pdf')) return <FileText size={16} />;
  if (lower.includes('video') || lower.includes('audio')) return <Video size={16} />;
  if (lower.includes('dev') || lower.includes('code')) return <Terminal size={16} />;
  return <LayoutGrid size={16} />;
};

export default function Sidebar({ 
  categories, 
  activeCategory, 
  isHome, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  isSidebarOpen,
  setIsSidebarOpen 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

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

  const totalTools = categories.reduce((acc, cat) => acc + cat.tools.length, 0);

  const searchResults = searchQuery.trim() !== '' 
    ? categories.flatMap(cat => 
        cat.tools
          .filter(tool => tool.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(tool => ({ ...tool, categoryId: cat.id, categoryColor: cat.color, categoryLabel: cat.label }))
      )
    : [];

  return (
    <>
      {/* ── MOBILE BACKDROP OVERLAY ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR CONTAINER ── */}
      <aside className={`
        fixed md:relative top-0 left-0 h-screen md:h-[calc(100vh-40px)] z-50 md:z-20
        w-[290px] shrink-0 flex flex-col my-0 md:my-5 ml-0 rounded-r-3xl md:rounded-3xl
        border-r md:border border-white/10 bg-[#050505] md:bg-[#0a0a0a]/40 backdrop-blur-3xl 
        shadow-[20px_0_40px_rgba(0,0,0,0.5)] md:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isSidebarOpen ? 'md:ml-5 md:opacity-100' : 'md:-ml-[320px] md:opacity-0'}
      `}>
        
        <div className="flex items-center justify-between px-7 pt-8 pb-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <Link to="/" onClick={() => setSearchQuery('')} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded w-fit">
              <h1 className="text-2xl font-black tracking-tight text-white mb-0.5 flex items-center drop-shadow-md hover:opacity-80 transition-opacity">
                NEXUS<span className="text-[#3b82f6]">FORGE</span>
              </h1>
            </Link>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {totalTools} tools
            </p>
          </motion.div>
          
          <div className="flex items-center gap-2">
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            {/* Desktop Collapse Button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="hidden md:flex p-2 bg-transparent hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Collapse Sidebar (Cmd+B)"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* --- The rest of your Sidebar remains exactly the same --- */}
        <div className="px-4 mt-2">
          <MotionLink
            to="/app"
            onClick={() => {
              setSearchQuery('');
              setIsMobileMenuOpen(false); 
            }}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.97 }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-300 border block ${
              isHome && !searchQuery
                ? 'text-white bg-white/10 border-white/10 shadow-lg backdrop-blur-md' 
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Home size={18} strokeWidth={isHome && !searchQuery ? 2.5 : 2} className={isHome && !searchQuery ? 'text-white' : ''} />
            <span className={`text-sm ${isHome && !searchQuery ? 'font-semibold' : 'font-medium'}`}>Dashboard</span>
          </MotionLink>
        </div>

        <div className="px-4 mt-4 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors duration-300" size={16} />
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..." 
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-3 pl-11 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#3b82f6]/50 focus:bg-white/10 focus:ring-4 focus:ring-[#3b82f6]/10 transition-colors duration-300 shadow-sm" 
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full w-5 h-5 text-[10px] text-white transition-colors"
              >
                ✕
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-white/5 rounded-md px-1.5 py-1 text-[10px] font-mono text-slate-400 border border-white/10 pointer-events-none group-focus-within:opacity-0 transition-opacity hidden md:flex">
                <Command size={10} className="mr-0.5" />K
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
          {searchQuery.trim() !== '' ? (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
                {searchResults.length > 0 ? `Found ${searchResults.length} Tools` : 'No Tools Found'}
              </p>
              <AnimatePresence mode='popLayout'>
                {searchResults.map((tool) => {
                  const ToolIcon = iconMap[tool.iconName] || LayoutGrid;
                  return (
                    <MotionLink
                      to={`/app/category/${tool.categoryId}/${tool.id}`}
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        setSearchQuery('');
                        setIsMobileMenuOpen(false); 
                      }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors duration-300 border block border-transparent group"
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: `${tool.categoryColor}15`, color: tool.categoryColor }}
                      >
                        <ToolIcon size={14} />
                      </div>
                      <div className="flex flex-col flex-1 text-left min-w-0">
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate">
                          {tool.title}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          in {tool.categoryLabel}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </MotionLink>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
                Arsenal
              </p>
              {categories.map((cat) => {
                const isActive = activeCategory?.id === cat.id && !isHome;
                return (
                  <MotionLink
                    to={`/app/category/${cat.id}`}
                    key={cat.id}
                    onClick={() => {
                      setSearchQuery('');
                      setIsMobileMenuOpen(false); 
                    }}
                    whileHover={{ x: 4, backgroundColor: isActive ? '' : 'rgba(255,255,255,0.05)' }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors duration-300 border block ${
                      isActive 
                        ? 'text-white bg-white/10 border-white/10 shadow-lg backdrop-blur-md' 
                        : 'text-slate-400 hover:text-slate-200 border-transparent'
                    }`}
                  >
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-colors duration-300 shrink-0"
                      style={{ 
                        backgroundColor: isActive ? `${cat.color}25` : 'rgba(255,255,255,0.03)',
                        color: isActive ? cat.color : '#94a3b8',
                        border: isActive ? `1px solid ${cat.color}40` : '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      {getIconForCategory(cat.label)}
                    </div>
                    <span className={`text-sm text-left flex-1 transition-colors duration-300 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {cat.label}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-lg transition-colors duration-300 ${
                      isActive 
                        ? 'bg-black/30 text-white border border-white/5 shadow-inner' 
                        : 'bg-white/5 text-slate-500 border border-transparent'
                    }`}>
                      {cat.tools.length}
                    </span>
                  </MotionLink>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-auto px-6 pb-6 pt-4 shrink-0">
          <div className="border-t border-white/5 pt-4 flex justify-center">
            <p className="text-[10px] text-slate-600 font-medium tracking-wide">Files never leave your device.</p>
          </div>
        </div>
      </aside>
    </>
  );
}