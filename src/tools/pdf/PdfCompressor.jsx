import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, X, Download, FileText, Loader2, FileUp, ShieldCheck } from 'lucide-react';

export default function PdfCompressor() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceSize, setSourceSize] = useState(0);
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    
    setSourcePdf(file);
    setSourceName(file.name);
    setSourceSize(file.size);
    setPreviewUrl(URL.createObjectURL(file)); // Show original initially
    setCompressedSize(0);
  };

  const compressPdf = async () => {
    if (!sourcePdf) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', sourcePdf);

      const response = await fetch('http://localhost:8000/api/compress-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Backend compression failed');

      const pdfBlob = await response.blob();
      setCompressedSize(pdfBlob.size);
      
      // Only update preview if it actually compressed, otherwise keep original
      if (pdfBlob.size < sourceSize) {
        setPreviewUrl(URL.createObjectURL(pdfBlob));
      }
    } catch (error) {
      console.error("Compression failed:", error);
      alert("Failed to compress document. Check Python server connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Compressed_${sourceName}`;
    a.click();
  };

  // Logic to handle already-tiny files
  const isOptimized = compressedSize >= sourceSize && compressedSize !== 0;
  const displaySize = isOptimized ? sourceSize : compressedSize;
  const savedPercent = compressedSize > 0 && !isOptimized 
    ? Math.round((1 - (compressedSize / sourceSize)) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      {/* LEFT PANE */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-full">
        {!sourcePdf ? (
          <div className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-10 cursor-pointer shrink-0 h-full">
            <FileUp size={32} className="text-amber-500 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Upload PDF to Compress</h3>
            <p className="text-xs text-slate-500 text-center">Shrink file size locally via Python Engine</p>
            <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
            <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3 border border-amber-500/20 bg-amber-500/5 relative overflow-hidden shrink-0">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-amber-500 shrink-0" />
                  <p className="text-sm font-medium text-white truncate max-w-[200px]">{sourceName}</p>
                </div>
                <button onClick={() => { setSourcePdf(null); setPreviewUrl(null); }} className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"><X size={16}/></button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2 z-10">
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Original Size</p>
                  <p className="text-lg font-mono text-white">{formatBytes(sourceSize)}</p>
                </div>
                <div className={`rounded-xl p-3 border ${compressedSize ? (isOptimized ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20') : 'bg-white/5 border-white/5'}`}>
                  <p className={`text-[10px] uppercase tracking-widest mb-1 ${compressedSize ? (isOptimized ? 'text-emerald-500/70' : 'text-amber-500/70') : 'text-slate-600'}`}>
                    New Size
                  </p>
                  <p className={`text-lg font-mono ${compressedSize ? (isOptimized ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-500'}`}>
                    {compressedSize ? formatBytes(displaySize) : '---'}
                  </p>
                </div>
              </div>

              {compressedSize > 0 && !isOptimized && (
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl z-0" />
              )}
            </div>

            <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col justify-center items-center text-center">
              {compressedSize > 0 ? (
                isOptimized ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <ShieldCheck size={28} />
                    </div>
                    <h4 className="text-white font-medium mb-1">Already Highly Optimized</h4>
                    <p className="text-sm text-slate-400 px-4">This file is incredibly small. Further compression would only increase its size.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <span className="text-xl font-black">-{savedPercent}%</span>
                    </div>
                    <h4 className="text-white font-medium mb-1">Compression Complete</h4>
                    <p className="text-sm text-slate-400">Review the quality in the right pane before downloading.</p>
                  </>
                )
              ) : (
                <>
                  <Minimize2 size={32} className="text-slate-600 mb-4" />
                  <h4 className="text-white font-medium mb-1">Ready to compress</h4>
                  <p className="text-sm text-slate-400 px-4">This will strip unused metadata, garbage collect dead streams, and deflate the structure.</p>
                </>
              )}
            </div>

            {!compressedSize ? (
              <button onClick={compressPdf} disabled={isProcessing} className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
                {isProcessing ? <><Loader2 size={18} className="animate-spin" /> Engine Processing...</> : <><Minimize2 size={18} /> Compress File</>}
              </button>
            ) : (
              <button onClick={downloadPdf} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
                <Download size={18} /> {isOptimized ? 'Keep Original File' : 'Save Compressed PDF'}
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* RIGHT PANE: Live Preview */}
      <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col">
        <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-medium flex items-center gap-2"><Minimize2 size={16} className="text-amber-500"/> Quality Inspection</span>
        </div>
        
        <div className="flex-1 bg-[#1e1e1e] relative">
          {!previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <Minimize2 size={24} className="opacity-50" />
              Compressed document will appear here
            </div>
          ) : (
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="Compressed PDF Preview" />
          )}
        </div>
      </div>
    </div>
  );
}