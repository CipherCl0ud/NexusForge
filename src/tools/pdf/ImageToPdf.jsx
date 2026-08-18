import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function ImageToPdf() {
  const [images, setImages] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFiles = (files) => {
    const valid = [...files].filter(f => f.type === 'image/jpeg' || f.type === 'image/png');
    const newImages = valid.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      url: URL.createObjectURL(f)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  // Live PDF Generation
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
          if (img.file.type === 'image/jpeg') embeddedImg = await pdfDoc.embedJpg(bytes);
          else if (img.file.type === 'image/png') embeddedImg = await pdfDoc.embedPng(bytes);
          
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      
      {/* LEFT PANE: Editor & Upload */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-full">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-6 cursor-pointer shrink-0"
        >
          <ImagePlus size={24} className="text-[#3b82f6] mb-2" />
          <p className="text-sm font-medium text-white">Add Images (JPG/PNG)</p>
          <input type="file" accept="image/png, image/jpeg" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        <div className="flex-1 glass-panel rounded-2xl overflow-y-auto p-4 space-y-3">
          {images.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">No images added yet.</div>
          ) : (
            <AnimatePresence>
              {images.map((img, idx) => (
                <motion.div key={img.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
                  <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}</span>
                  <img src={img.url} alt="thumbnail" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                  <span className="text-sm text-slate-300 truncate flex-1">{img.file.name}</span>
                  <button onClick={() => removeImage(img.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X size={16}/></button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <button onClick={downloadPdf} disabled={!previewUrl || isGenerating} className="w-full py-3.5 bg-[#3b82f6] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
          <Download size={18} /> Export as PDF
        </button>
      </div>

      {/* RIGHT PANE: Live Preview */}
      <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col">
        <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-medium flex items-center gap-2"><FileText size={16} className="text-[#3b82f6]"/> Live PDF Preview</span>
          {isGenerating && <span className="text-xs text-[#3b82f6] flex items-center gap-1.5 animate-pulse"><RefreshCw size={12} className="animate-spin"/> Syncing Canvas...</span>}
        </div>
        
        <div className="flex-1 bg-[#1e1e1e] relative">
          {!previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Waiting for images...</div>
          ) : (
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="PDF Preview" />
          )}
        </div>
      </div>

    </div>
  );
}