import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 py-24 px-6 md:px-12 overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#3b82f6]/10 blur-[130px] rounded-full pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-white transition-colors mb-12">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">Built for the local-first era.</h1>
        
        <div className="space-y-6 text-lg leading-relaxed text-slate-400">
          <p>
            The modern web has a problem: every time you want to merge a PDF, convert an image, or format some JSON, you are forced to upload your sensitive files to a random server, wait in a queue, and hope they actually delete your data.
          </p>
          <p>
            <strong className="text-white">NexusForge was built to change that.</strong>
          </p>
          <p>
            By leveraging modern browser technologies like WebAssembly (WASM), the File System Access API, and local processing pipelines, we’ve brought heavy-duty utility processing directly to your machine. 
          </p>
          <p>
            When you process a file in NexusForge, your CPU does the work. There are no servers, no hidden analytics, no daily quotas, and no paywalls. It’s a premium, executive-grade toolkit designed for developers, designers, and privacy-conscious professionals who want to get things done without compromising their data.
          </p>
        </div>
      </motion.div>
    </div>
  );
}