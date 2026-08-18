import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, X, Download, FileText, RefreshCw, FileUp } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function PdfSplitter() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [rangeInput, setRangeInput] = useState('1');
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    
    setSourceName(file.name);
    const bytes = await file.arrayBuffer();
    
    const pdfDoc = await PDFDocument.load(bytes);
    const count = pdfDoc.getPageCount();
    setTotalPages(count);
    setSourcePdf(bytes);
    setRangeInput(`1-${Math.min(3, count)}`); 
  };

  const parseRange = (rangeStr, maxPages) => {
    const pages = new Set();
    const parts = rangeStr.replace(/\s+/g, '').split(',');
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= maxPages) pages.add(i - 1);
          }
        }
      } else {
        const num = Number(part);
        if (num > 0 && num <= maxPages) pages.add(num - 1);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  useEffect(() => {
    if (!sourcePdf) return;

    const generateSplitPdf = async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const indicesToKeep = parseRange(rangeInput, totalPages);
        if (indicesToKeep.length === 0) throw new Error("Invalid page range");

        const originalDoc = await PDFDocument.load(sourcePdf);
        const newDoc = await PDFDocument.create();
        
        const copiedPages = await newDoc.copyPages(originalDoc, indicesToKeep);
        copiedPages.forEach((page) => newDoc.addPage(page));
        
        const pdfBytes = await newDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setPreviewUrl(URL.createObjectURL(blob));
      } catch (err) {
        setPreviewUrl(null);
        setError("Please enter a valid page range.");
      } finally {
        setIsGenerating(false);
      }
    };

    const timeout = setTimeout(generateSplitPdf, 400);
    return () => clearTimeout(timeout);
  }, [sourcePdf, rangeInput, totalPages]);

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Extracted_${sourceName}`;
    a.click();
  };

  const setQuickRange = (type) => {
    if (type === 'first') setRangeInput('1');
    if (type === 'last') setRangeInput(`${totalPages}`);
    if (type === 'half') setRangeInput(`1-${Math.ceil(totalPages / 2)}`);
    if (type === 'all') setRangeInput(`1-${totalPages}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      {/* LEFT PANE */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-full">
        {!sourcePdf ? (
          <div className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-10 cursor-pointer shrink-0 h-full">
            <FileUp size={32} className="text-emerald-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Upload PDF to Split</h3>
            <p className="text-xs text-slate-500 text-center">Select a document to extract specific pages</p>
            <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-emerald-500/20 bg-emerald-500/5 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={20} className="text-emerald-400 shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-medium text-white truncate max-w-[200px]">{sourceName}</p>
                  <p className="text-xs text-slate-400">{totalPages} total pages</p>
                </div>
              </div>
              <button onClick={() => { setSourcePdf(null); setPreviewUrl(null); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"><X size={16}/></button>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="z-10">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block text-center">Pages to Extract</label>
                
                <input 
                  type="text" 
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g., 1, 3, 5-10"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-center text-xl font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-inner mb-4"
                />
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <button onClick={() => setQuickRange('first')} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-black/30 border border-white/5 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">First Page</button>
                  <button onClick={() => setQuickRange('last')} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-black/30 border border-white/5 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">Last Page</button>
                  <button onClick={() => setQuickRange('half')} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-black/30 border border-white/5 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">First Half</button>
                  <button onClick={() => setQuickRange('all')} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-black/30 border border-white/5 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">All Pages</button>
                </div>

                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Use commas to separate pages (<span className="text-slate-300">1, 4, 6</span>) <br/>
                  or hyphens for ranges (<span className="text-slate-300">2-5</span>).
                </p>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center mt-4">
                    {error}
                  </motion.p>
                )}
              </div>
            </div>

            <button onClick={downloadPdf} disabled={!previewUrl || isGenerating} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
              <Download size={18} /> Download Extracted PDF
            </button>
          </motion.div>
        )}
      </div>

      {/* RIGHT PANE: Live Preview */}
      <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col">
        <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-medium flex items-center gap-2"><Scissors size={16} className="text-emerald-400"/> Extraction Preview</span>
          {isGenerating && <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-pulse"><RefreshCw size={12} className="animate-spin"/> Slicing Document...</span>}
        </div>
        
        <div className="flex-1 bg-[#1e1e1e] relative">
          {!previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <Scissors size={24} className="opacity-50" />
              Upload a document and select pages
            </div>
          ) : (
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="Split PDF Preview" />
          )}
        </div>
      </div>
    </div>
  );
}