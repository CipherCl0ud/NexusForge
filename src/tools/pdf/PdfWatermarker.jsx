import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplet, X, Download, FileText, RefreshCw, FileUp } from 'lucide-react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

export default function PdfWatermarker() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    
    setSourceName(file.name);
    const bytes = await file.arrayBuffer();
    setSourcePdf(bytes);
  };

  useEffect(() => {
    if (!sourcePdf) return;

    const applyWatermark = async () => {
      setIsGenerating(true);
      try {
        const pdfDoc = await PDFDocument.load(sourcePdf);
        const pages = pdfDoc.getPages();
        
        pages.forEach(page => {
          const { width, height } = page.getSize();
          page.drawText(watermarkText || ' ', {
            x: width / 2 - (watermarkText.length * 12),
            y: height / 2,
            size: 60,
            color: rgb(0.5, 0.5, 0.5),
            opacity: parseFloat(opacity),
            rotate: degrees(45),
          });
        });
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setPreviewUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    };

    const timeout = setTimeout(applyWatermark, 300);
    return () => clearTimeout(timeout);
  }, [sourcePdf, watermarkText, opacity]);

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Watermarked_${sourceName}`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      <div className="lg:col-span-5 flex flex-col gap-4 h-full">
        {!sourcePdf ? (
          <div className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-10 cursor-pointer shrink-0 h-full">
            <FileUp size={32} className="text-purple-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Upload PDF to Watermark</h3>
            <p className="text-xs text-slate-500 text-center">Stamp text across all pages</p>
            <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-purple-500/20 bg-purple-500/5 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={20} className="text-purple-400 shrink-0" />
                <p className="text-sm font-medium text-white truncate max-w-[200px]">{sourceName}</p>
              </div>
              <button onClick={() => { setSourcePdf(null); setPreviewUrl(null); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"><X size={16}/></button>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="z-10 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Watermark Text</label>
                  <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="CONFIDENTIAL" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opacity</label>
                    <span className="text-xs text-purple-400 font-mono">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(e.target.value)} className="w-full accent-purple-500" />
                </div>
              </div>
            </div>

            <button onClick={downloadPdf} disabled={!previewUrl || isGenerating} className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
              <Download size={18} /> Download Watermarked PDF
            </button>
          </motion.div>
        )}
      </div>

      <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col">
        <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-medium flex items-center gap-2"><Droplet size={16} className="text-purple-400"/> Live Preview</span>
          {isGenerating && <span className="text-xs text-purple-400 flex items-center gap-1.5 animate-pulse"><RefreshCw size={12} className="animate-spin"/> Stamping...</span>}
        </div>
        <div className="flex-1 bg-[#1e1e1e] relative">
          {!previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <Droplet size={24} className="opacity-50" /> Upload a document to preview
            </div>
          ) : (
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="Watermark Preview" />
          )}
        </div>
      </div>
    </div>
  );
}