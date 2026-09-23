import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 py-24 px-6 md:px-12 overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#10B981]/10 blur-[130px] rounded-full pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-white transition-colors mb-12">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#10B981]/10 text-[#10B981] rounded-2xl border border-[#10B981]/20">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Privacy Policy</h1>
        </div>
        
        <div className="space-y-8 text-slate-400">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. The Short Version</h2>
            <p>We do not collect, store, or transmit your files. Ever. NexusForge operates entirely within your local browser environment.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. File Processing</h2>
            <p>All file manipulation (image conversion, PDF merging, video processing) is executed client-side using WebAssembly and standard browser APIs. Your files remain on your physical hard drive and RAM. At no point is a network request made to transmit your data to an external server.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Local Storage</h2>
            <p>NexusForge may use your browser's `localStorage` to save your UI preferences (such as theme settings or sidebar state) so your workspace remains persistent between visits. This data never leaves your device.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Third-Party Analytics</h2>
            <p>We do not embed third-party tracking scripts, advertising pixels, or invasive session recorders. Your workflow is your business.</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}