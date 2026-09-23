import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home, Search, Command, X, ChevronRight } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import { toolCategories } from './data/tools';
import { iconMap } from './lib/iconMap';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ToolCard from './components/ToolCard';
import ToolRouter from './tools/ToolRouter';
import Homepage from './components/Homepage';

// ── LEGAL PAGES (Restored) ──
import About from './components/legal/About';
import Privacy from './components/legal/Privacy';
import Terms from './components/legal/Terms';

const fluidTransition = { type: 'tween', ease: 'easeInOut', duration: 0.2 };

// ─────────────────────────────────────────────────────────────────────────────
// ── GLOBAL COMMAND PALETTE (CMD+K) ───────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function CommandPalette({ isOpen, setIsOpen, categories, navigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Flatten tools for searching
  const allTools = categories.flatMap(c => 
    c.tools.map(t => ({ ...t, categoryId: c.id, categoryLabel: c.label, categoryColor: c.color }))
  );

  const results = query.trim() === '' 
    ? [] 
    : allTools.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) || 
        t.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8); // Limit to top 8 results for UI cleanliness

  const handleSelect = (tool) => {
    navigate(`/app/category/${tool.categoryId}/${tool.id}`);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20, x: '-50%' }} 
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, scale: 0.95, y: -20, x: '-50%' }}
            className="fixed top-[15%] left-1/2 w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[101] overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-4 border-b border-white/10 bg-white/5">
              <Search className="text-slate-400 mr-3" size={20} />
              <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for any tool (e.g., 'PDF', 'Resize', 'Merge')..."
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-slate-600"
              />
              <button onClick={() => setIsOpen(false)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
              {query.trim() === '' ? (
                <div className="px-4 py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <Command size={32} className="opacity-20" />
                  <p>Type to search across {allTools.length} tools.</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Results</p>
                  {results.map((tool) => {
                    const Icon = iconMap[tool.iconName];
                    return (
                      <button 
                        key={tool.id}
                        onClick={() => handleSelect(tool)}
                        className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${tool.categoryColor}15`, color: tool.categoryColor }}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{tool.title}</p>
                          <p className="text-xs text-slate-500 truncate">{tool.categoryLabel} · {tool.description}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-12 text-center text-slate-500">
                  <p>No tools found for "{query}"</p>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Navigate with mouse or</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">↑</kbd><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">↓</kbd></span>
              </div>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono mr-1">Esc</kbd> to close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN LAYOUT WRAPPER ──────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);

  // ── KEYBOARD SHORTCUTS & GLOBAL DROP INTERCEPTOR ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle Sidebar (Cmd+B)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
      // Toggle Command Palette (Cmd+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdKOpen(prev => !prev);
      }
      // Close Command Palette (Esc)
      if (e.key === 'Escape') setIsCmdKOpen(false);
    };

    // Prevents browser from downloading/opening a file if dropped outside an UploadZone
    const preventDefaultDrop = (e) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragover', preventDefaultDrop);
    window.addEventListener('drop', preventDefaultDrop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragover', preventDefaultDrop);
      window.removeEventListener('drop', preventDefaultDrop);
    };
  }, []);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const categoryId = pathParts[1] === 'category' ? pathParts[2] : null;
  const toolId = pathParts[1] === 'category' ? pathParts[3] : null;

  const activeCategory = toolCategories.find((c) => c.id === categoryId) || null;
  const selectedTool = activeCategory?.tools.find((t) => t.id === toolId) || null;
  const isHome = !categoryId && !toolId;

  const handleSelectCategory = (cat) => { navigate(`/app/category/${cat.id}`); setIsMobileMenuOpen(false); };
  const handleHome = () => { navigate('/app'); setIsMobileMenuOpen(false); };
  const handleBackToCategory = () => { navigate(activeCategory ? `/app/category/${activeCategory.id}` : '/app'); };

  return (
    <div className="relative flex h-screen w-full font-sans overflow-hidden bg-[#050505]">
      
      {/* Global Command Palette */}
      <CommandPalette isOpen={isCmdKOpen} setIsOpen={setIsCmdKOpen} categories={toolCategories} navigate={navigate} />

      {/* Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-5%] w-[40%] h-[60%] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
      {activeCategory && (
        <div
          className="absolute top-1/3 right-1/3 w-[35%] h-[45%] blur-[140px] rounded-full pointer-events-none transition-colors duration-1000 ease-in-out"
          style={{ backgroundColor: `${activeCategory.color}12` }}
        />
      )}

      {/* Mobile Top Bar */}
      <div className="md:hidden absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <span className="text-xl font-black tracking-tight drop-shadow-md text-white">
          NEXUS<span className="text-accent">FORGE</span>
        </span>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-white bg-white/5 border border-white/10 rounded-lg">
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop Floating Menu Button (Appears when sidebar collapsed) */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: -20 }}
            onClick={() => setIsSidebarOpen(true)}
            className="hidden md:flex absolute top-10 left-10 z-30 p-2.5 bg-[#0a0a0a]/80 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-colors"
            title="Open Sidebar (Cmd+B)"
          >
            <Menu size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <Sidebar
        categories={toolCategories} activeCategory={activeCategory} onSelectCategory={handleSelectCategory}
        onHome={handleHome} isHome={isHome} isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        onOpenCommandPalette={() => setIsCmdKOpen(true)} // You can pass this to Sidebar to trigger Cmd+K from the search box click
      />

      <main className="flex-1 p-6 pt-24 md:p-10 md:pt-10 overflow-y-auto z-10 relative transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
        <AnimatePresence mode="wait">
          
          {isHome && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={fluidTransition} className="max-w-[1600px] w-full mx-auto">
              <Dashboard categories={toolCategories} onSelectCategory={handleSelectCategory} />
            </motion.div>
          )}

          {activeCategory && !selectedTool && (
            <motion.div key={activeCategory.id} initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }} transition={fluidTransition} className="max-w-[1600px] w-full mx-auto">
              <header className="mb-10 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: activeCategory.color, color: activeCategory.color }} />
                  <span className="text-xs text-slate-500 uppercase tracking-widest">{activeCategory.tools.length} tools</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">{activeCategory.label}</h2>
                <p className="text-slate-400">Select a tool to get started.</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeCategory.tools.map((tool) => {
                  const Icon = iconMap[tool.iconName];
                  return (
                    <ToolCard key={tool.id} title={tool.title} description={tool.description} icon={Icon} accentColor={activeCategory.color} to={`/app/category/${activeCategory.id}/${tool.id}`} />
                  );
                })}
              </div>
            </motion.div>
          )}

          {selectedTool && activeCategory && (
            <motion.div key={selectedTool.id} initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={fluidTransition} className="max-w-[1600px] w-full mx-auto pb-10 flex flex-col h-full">
              <nav className="mb-8 flex items-center text-sm font-medium text-slate-500 overflow-x-auto whitespace-nowrap custom-scrollbar pb-2 shrink-0">
                <button onClick={handleHome} className="hover:text-white transition-colors flex items-center gap-2 rounded px-1"><Home size={14} /> Dashboard</button>
                <span className="mx-2 text-slate-700">/</span>
                <button onClick={handleBackToCategory} className="hover:text-white transition-colors flex items-center gap-2 rounded px-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeCategory.color }} /> {activeCategory.label}
                </button>
                <span className="mx-2 text-slate-700">/</span>
                <span className="text-slate-300 pointer-events-none px-1">{selectedTool.title}</span>
              </nav>

              <div className="shrink-0 mb-8">
                <h2 className="text-4xl font-bold text-white mb-2">{selectedTool.title}</h2>
                <p className="text-slate-400 text-lg">{selectedTool.description}</p>
              </div>

              <div className="flex-1 min-h-0">
                <ToolRouter tool={selectedTool} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage categories={toolCategories} />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/app/*" element={<MainLayout />} />
          <Route path="*" element={<Homepage categories={toolCategories} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}