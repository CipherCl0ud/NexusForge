import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, X, Download, FileText, Loader2, FileUp, Archive } from 'lucide-react';

export default function PdfToImage() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setSourcePdf(file);
    setSourceName(file.name);
    setResultUrl(null);
  };

  const convertToImages = async () => {
    if (!sourcePdf) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', sourcePdf);

      const response = await fetch('http://localhost:8000/api/pdf-to-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Conversion failed');

      const zipBlob = await response.blob();
      setResultUrl(URL.createObjectURL(zipBlob));
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert document. Check Python server connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadZip = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${sourceName.replace('.pdf', '')}_Images.zip`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      {/* LEFT PANE */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-full">
        {!sourcePdf ? (
          <div className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-10 cursor-pointer shrink-0 h-full">
            <FileUp size={32} className="text-pink-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Upload PDF</h3>
            <p className="text-xs text-slate-500 text-center">Convert pages to high-res PNGs</p>
            <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-pink-500/20 bg-pink-500/5 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={20} className="text-pink-400 shrink-0" />
                <p className="text-sm font-medium text-white truncate max-w-[200px]">{sourceName}</p>
              </div>
              <button onClick={() => { setSourcePdf(null); setResultUrl(null); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"><X size={16}/></button>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              <ImageIcon size={48} className="text-slate-700 mb-4 z-10" />
              <h4 className="text-white font-medium mb-2 z-10">Ready to Extract</h4>
              <p className="text-sm text-slate-400 max-w-xs z-10">The engine will slice this document into individual image files and package them into a compressed ZIP folder.</p>
            </div>

            {!resultUrl ? (
              <button onClick={convertToImages} disabled={isProcessing} className="w-full py-3.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
                {isProcessing ? <><Loader2 size={18} className="animate-spin" /> Engine Processing...</> : <><ImageIcon size={18} /> Convert to Images</>}
              </button>
            ) : (
              <button onClick={downloadZip} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
                <Archive size={18} /> Download Image ZIP
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* RIGHT PANE: Output Inspector */}
      <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col justify-center items-center text-center p-10">
        {!resultUrl ? (
          <>
            <Archive size={48} className="text-slate-700 mb-4" />
            <h4 className="text-white font-medium mb-2">Export Inspector</h4>
            <p className="text-sm text-slate-400">ZIP payload will be generated here.</p>
          </>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
            <Archive size={64} className="text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            <h4 className="text-white font-bold text-xl mb-2">Extraction Complete</h4>
            <p className="text-sm text-slate-400 max-w-sm">
              All PDF pages have been successfully converted to high-resolution PNG format and packaged securely into a ZIP archive.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}