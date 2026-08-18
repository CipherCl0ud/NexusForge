import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

import { toolCategories } from './data/tools';
import { iconMap } from './lib/iconMap';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ToolCard from './components/ToolCard';
import ToolRouter from './tools/ToolRouter';

// ── PREMIUM SPRING PHYSICS CONFIG ──
const springTransition = { 
  type: 'spring', 
  stiffness: 260, 
  damping: 25, 
  mass: 0.5 
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const isHome = !activeCategory && !selectedTool;

  const handleSelectCategory = (cat) => { setActiveCategory(cat); setSelectedTool(null); };
  const handleHome = () => { setActiveCategory(null); setSelectedTool(null); };

  return (
    <div className="relative flex h-screen w-full font-sans overflow-hidden">

      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-5%] w-[40%] h-[60%] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
      {activeCategory && (
        <div
          className="absolute top-1/3 right-1/3 w-[35%] h-[45%] blur-[140px] rounded-full pointer-events-none transition-colors duration-1000 ease-in-out"
          style={{ backgroundColor: `${activeCategory.color}12` }}
        />
      )}

      <Sidebar
        categories={toolCategories}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onHome={handleHome}
        isHome={isHome}
      />

      <main className="flex-1 p-10 overflow-y-auto z-10 relative">
        <AnimatePresence mode="wait">

          {/* 1. Dashboard View */}
          {isHome && (
            <motion.div key="dashboard"
              initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }} 
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
              exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
              transition={springTransition}
              className="max-w-[1600px] w-full mx-auto"
            >
              <Dashboard categories={toolCategories} onSelectCategory={handleSelectCategory} />
            </motion.div>
          )}

          {/* 2. Category / Tool List View */}
          {activeCategory && !selectedTool && (
            <motion.div key={activeCategory.id}
              initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }} 
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
              exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
              transition={springTransition}
              className="max-w-[1600px] w-full mx-auto"
            >
              <header className="mb-10 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: activeCategory.color, color: activeCategory.color }} />
                  <span className="text-xs text-slate-500 uppercase tracking-widest">
                    {activeCategory.tools.length} tools
                  </span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">{activeCategory.label}</h2>
                <p className="text-slate-400">Select a tool to get started.</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeCategory.tools.map(tool => {
                  const Icon = iconMap[tool.iconName];
                  return (
                    <ToolCard
                      key={tool.id}
                      title={tool.title}
                      description={tool.description}
                      icon={Icon}
                      accentColor={activeCategory.color}
                      onClick={() => setSelectedTool(tool)}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 3. Active Tool Workspace View */}
          {selectedTool && (
            <motion.div key={selectedTool.id}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} 
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
              exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
              transition={springTransition}
              // THE FIX: Expanded from max-w-4xl to max-w-[1600px]
              className="max-w-[1600px] w-full mx-auto pb-10 flex flex-col h-full"
            >
              <button
                onClick={() => setSelectedTool(null)}
                className="mb-8 flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors group shrink-0 w-fit"
              >
                <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
                Back to {activeCategory.label}
              </button>

              <div className="shrink-0 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: activeCategory.color, color: activeCategory.color }} />
                  <span className="text-xs text-slate-500 uppercase tracking-widest">{activeCategory.label}</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">{selectedTool.title}</h2>
                <p className="text-slate-400 text-lg">{selectedTool.description}</p>
              </div>

              {/* The Router now has plenty of room to expand */}
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