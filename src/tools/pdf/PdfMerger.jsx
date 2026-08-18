import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilePlus, X, Download, FileText, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function PdfMerger() {
  const [pdfs, setPdfs] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFiles = (files) => {
    const valid = [...files].filter(f => f.type === 'application/pdf');
    const newPdfs = valid.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name
    }));
    setPdfs(prev => [...prev, ...newPdfs]);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const items = [...pdfs];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    setPdfs(items);
  };

  const moveDown = (index) => {
    if (index === pdfs.length - 1) return;
    const items = [...pdfs];
    [items[index + 1], items[index]] = [items[index], items[index + 1]];
    setPdfs(items);
  };

  const removePdf = (id) => setPdfs(prev => prev.filter(p => p.id !== id));

  // Live PDF Merging
  useEffect(() => {
    if (pdfs.length === 0) {
      setPreviewUrl(null);
      return;
    }

    const mergePdfs = async () => {
      setIsGenerating(true);
      try {
        const mergedPdf = await PDFDocument.create();
        for (const item of pdfs) {
          const bytes = await item.file.arrayBuffer();
          const loadedPdf = await PDFDocument.load(bytes);
          const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setPreviewUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Merging failed:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    const timeout = setTimeout(mergePdfs, 500);
    return () => clearTimeout(timeout);
  }, [pdfs]);

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `NexusForge_Merged.pdf`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      
      {/* LEFT PANE: Editor & Sequence */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-full">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-6 cursor-pointer shrink-0"
        >
          <FilePlus size={24} className="text-purple-500 mb-2" />
          <p className="text-sm font-medium text-white">Add PDF Documents</p>
          <input type="file" accept="application/pdf" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        <div className="flex-1 glass-panel rounded-2xl overflow-y-auto p-4 space-y-3">
          {pdfs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">Sequence empty. Add PDFs to merge.</div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {pdfs.map((pdf, idx) => (
                <motion.div layout key={pdf.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                  
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-30 transition-colors"><ArrowUp size={14}/></button>
                    <button onClick={() => moveDown(idx)} disabled={idx === pdfs.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30 transition-colors"><ArrowDown size={14}/></button>
                  </div>
                  
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold">{idx + 1}</span>
                  </div>
                  
                  <span className="text-sm text-slate-300 truncate flex-1">{pdf.name}</span>
                  <button onClick={() => removePdf(pdf.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X size={16}/></button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <button onClick={downloadPdf} disabled={!previewUrl || isGenerating || pdfs.length < 2} className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
          <Download size={18} /> Download Merged PDF
        </button>
      </div>

      {/* RIGHT PANE: Live Preview */}
      <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col">
        <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-medium flex items-center gap-2"><FileText size={16} className="text-purple-400"/> Live Merged Output</span>
          {isGenerating && <span className="text-xs text-purple-400 flex items-center gap-1.5 animate-pulse"><RefreshCw size={12} className="animate-spin"/> Fusing Documents...</span>}
        </div>
        
        <div className="flex-1 bg-[#1e1e1e] relative">
          {!previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Waiting for sequence...</div>
          ) : (
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="Merged PDF Preview" />
          )}
        </div>
      </div>

    </div>
  );
}