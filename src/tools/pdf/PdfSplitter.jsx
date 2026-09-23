import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, X, Download, FileText, RefreshCw, Layers } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

export default function PdfSplitter() {
  const [sourceName, setSourceName] = useState('');
  const [sourceSize, setSourceSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [rangeInput, setRangeInput] = useState('1');
  
  // THE FIX: Store the fully parsed document, not the raw ArrayBuffer.
  const [loadedPdfDoc, setLoadedPdfDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      toast.error("Please upload a valid PDF document.");
      return;
    }
    
    const toastId = toast.loading("Parsing document...");
    try {
      setSourceName(file.name);
      setSourceSize(file.size);
      
      const bytes = await file.arrayBuffer();
      // Parse the document exactly ONCE to prevent memory leaks and browser crashes
      const pdfDoc = await PDFDocument.load(bytes);
      const count = pdfDoc.getPageCount();
      
      setTotalPages(count);
      setLoadedPdfDoc(pdfDoc);
      setRangeInput(`1-${Math.min(3, count)}`); 
      
      toast.success("Document loaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to read PDF. It might be corrupted or encrypted.", { id: toastId });
    }
  };

  const parseRange = (rangeStr, maxPages) => {
    const pages = new Set();
    const parts = rangeStr.replace(/\s+/g, '').split(',');
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= maxPages) pages.add(i - 1); // pdf-lib is 0-indexed
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
    if (!loadedPdfDoc) return;

    const generateSplitPdf = async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const indicesToKeep = parseRange(rangeInput, totalPages);
        if (indicesToKeep.length === 0) throw new Error("Invalid page range");

        // Create a new document and copy pages without re-parsing the original
        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(loadedPdfDoc, indicesToKeep);
        copiedPages.forEach((page) => newDoc.addPage(page));
        
        const pdfBytes = await newDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Clean up the old blob URL to prevent memory leaks, then set the new one
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } catch (err) {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setError("Please enter a valid page range.");
      } finally {
        setIsGenerating(false);
      }
    };

    // Debounce generation so we don't slice the PDF on every single keystroke
    const timeout = setTimeout(generateSplitPdf, 400);
    return () => clearTimeout(timeout);
  }, [loadedPdfDoc, rangeInput, totalPages]);

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Extracted_${sourceName}`;
    a.click();
    toast.success("Extracted PDF downloaded!");
  };

  const setQuickRange = (type) => {
    if (type === 'first') setRangeInput('1');
    if (type === 'last') setRangeInput(`${totalPages}`);
    if (type === 'half') setRangeInput(`1-${Math.ceil(totalPages / 2)}`);
    if (type === 'all') setRangeInput(`1-${totalPages}`);
  };

  const clearWorkspace = () => {
    setLoadedPdfDoc(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRangeInput('1');
    setError(null);
  };

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Controls (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {!loadedPdfDoc ? (
          <div className="flex-1 flex flex-col h-full">
            <UploadZone 
              onFilesSelected={handleFilesSelected}
              accept=".pdf, application/pdf"
              multiple={false}
              title="Split & Extract PDF"
              subtitle="Drop a PDF to slice out specific pages"
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 rounded-2xl flex flex-col h-full overflow-hidden">
            
            <div className="border-b border-white/5 pb-4 mb-6 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Scissors size={18} className="text-[#10B981]" /> PDF Slicer
              </h3>
              <button 
                onClick={clearWorkspace} 
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear Workspace"
              >
                <X size={16} />
              </button>
            </div>

            {/* File Info Card */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center gap-4 mb-6 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{sourceName}</p>
                <p className="text-xs text-slate-500">
                  {(sourceSize / 1024 / 1024).toFixed(2)} MB · {totalPages} Pages
                </p>
              </div>
            </div>

            {/* Range Input Section */}
            <div className="flex-1 flex flex-col justify-center relative bg-black/20 rounded-xl border border-white/5 p-5 shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="z-10 relative">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block text-center">
                  Pages to Extract
                </label>
                
                <input 
                  type="text" 
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g., 1, 3, 5-10"
                  className={`w-full bg-black/40 border rounded-xl px-5 py-4 text-center text-xl font-mono text-white placeholder:text-slate-600 focus:outline-none transition-all shadow-inner mb-4
                    ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50' : 'border-white/10 focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]/50'}`}
                />
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => setQuickRange('first')} className="px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10 transition-colors">First Page</button>
                  <button onClick={() => setQuickRange('last')} className="px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10 transition-colors">Last Page</button>
                  <button onClick={() => setQuickRange('half')} className="px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10 transition-colors">First Half</button>
                  <button onClick={() => setQuickRange('all')} className="px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10 transition-colors">All Pages</button>
                </div>

                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Use commas (<span className="text-slate-300 font-mono">1, 4, 6</span>) <br/>
                  or hyphens for ranges (<span className="text-slate-300 font-mono">2-5</span>).
                </p>

                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center mt-4"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Export Button */}
            <div className="mt-auto pt-4 shrink-0">
              <button 
                onClick={downloadPdf} 
                disabled={!previewUrl || isGenerating || error} 
                className="w-full py-4 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 disabled:shadow-none"
              >
                <Download size={18} /> Download Extracted PDF
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── RIGHT PANE: Live Preview (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col h-full min-h-0">
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <Layers size={16} className="text-[#10B981]"/> Live Extraction Preview
          </span>
          {isGenerating && (
            <span className="text-xs font-medium text-[#10B981] flex items-center gap-1.5 animate-pulse bg-[#10B981]/10 px-2 py-1 rounded-md">
              <RefreshCw size={12} className="animate-spin"/> Slicing Document...
            </span>
          )}
        </div>
        
        <div className="flex-1 bg-[#0a0a0a] relative min-h-0 p-4 flex items-center justify-center">
          {!previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
              <Scissors size={32} className="opacity-20" />
              Waiting for document...
            </div>
          ) : (
            // Cleaned up the blob URL to prevent routing errors in strict browsers
            <iframe 
              src={previewUrl} 
              className="w-full h-full border-none rounded-xl bg-white" 
              title="Split PDF Preview" 
            />
          )}
        </div>
      </div>
    </div>
  );
}