import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Download, FileText, RefreshCw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function ImageToPdf() {
  const [images, setImages] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFiles = (files) => {
    const valid = [...files].filter(f => f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/webp');
    const newImages = valid.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      url: URL.createObjectURL(f)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  // Live PDF Generation (Client-Side)
  useEffect(() => {
    if (images.length === 0) {
      setPreviewUrl(null);
      return;
    }

    const generatePdf = async () => {
      setIsGenerating(true);
      try {
        const pdfDoc = await PDFDocument.create();
        for (const img of images) {
          const bytes = await img.file.arrayBuffer();
          let embeddedImg;
          
          if (img.file.type === 'image/jpeg') {
            embeddedImg = await pdfDoc.embedJpg(bytes);
          } else if (img.file.type === 'image/png') {
            embeddedImg = await pdfDoc.embedPng(bytes);
          } else {
            continue; // Skip unsupported formats internally
          }
          
          const dims = embeddedImg.scale(1);
          const page = pdfDoc.addPage([dims.width, dims.height]);
          page.drawImage(embeddedImg, { x: 0, y: 0, width: dims.width, height: dims.height });
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setPreviewUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error("PDF Generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    // Debounce the generation slightly to prevent freezing when rapidly deleting images
    const timeout = setTimeout(generatePdf, 300);
    return () => clearTimeout(timeout);
  }, [images]);

  const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id));

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `NexusForge_Document.pdf`;
    a.click();
  };

  return (
    // ── THE FIX: Responsive height constraint with 4/8 split ratio ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[500px] max-h-[850px]">
      
      {/* ── LEFT PANE: Editor & Upload (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {/* Compact Drag & Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-6 cursor-pointer shrink-0"
        >
          <ImagePlus size={24} className="text-[#3b82f6] mb-2" />
          <p className="text-sm font-medium text-white">Add Images (JPG/PNG)</p>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            multiple 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => handleFiles(e.target.files)} 
          />
        </div>

        {/* Scrollable Image Queue */}
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col bg-black/20">
          <div className="px-4 py-3 border-b border-white/5 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex justify-between items-center">
            <span>Image Queue</span>
            <span className="bg-black/30 px-2 py-0.5 rounded-md">{images.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {images.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm font-medium">
                No images added yet.
              </div>
            ) : (
              <AnimatePresence>
                {images.map((img, idx) => (
                  <motion.div 
                    key={img.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <span className="text-[10px] font-mono text-slate-500 w-4 text-center shrink-0">{idx + 1}</span>
                    <img src={img.url} alt="thumbnail" className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0" />
                    <span className="text-sm text-slate-300 truncate flex-1 font-medium">{img.file.name}</span>
                    <button 
                      onClick={() => removeImage(img.id)} 
                      className="p-1.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                    >
                      <X size={14}/>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Export Button */}
        <button 
          onClick={downloadPdf} 
          disabled={!previewUrl || isGenerating} 
          className="shrink-0 w-full py-4 bg-[#3b82f6] hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3b82f6]/20 disabled:shadow-none"
        >
          <Download size={18} /> Export as PDF
        </button>
      </div>

      {/* ── RIGHT PANE: Live Preview (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative flex flex-col h-full min-h-0">
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <FileText size={16} className="text-[#3b82f6]"/> Live PDF Preview
          </span>
          {isGenerating && (
            <span className="text-xs font-medium text-[#3b82f6] flex items-center gap-1.5 animate-pulse bg-[#3b82f6]/10 px-2 py-1 rounded-md">
              <RefreshCw size={12} className="animate-spin"/> Syncing Canvas...
            </span>
          )}
        </div>
        
        <div className="flex-1 bg-[#0a0a0a] relative">
          {!previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
              <FileText size={32} className="opacity-20" />
              Waiting for images...
            </div>
          ) : (
            <iframe 
              src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-full border-none" 
              title="PDF Preview" 
            />
          )}
        </div>
      </div>

    </div>
  );
}