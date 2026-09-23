import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, X, Download, FileText, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

export default function PdfCompressor() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceSize, setSourceSize] = useState(0);
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Clean up URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      toast.error("Please upload a valid PDF document.");
      return;
    }
    
    setSourcePdf(file);
    setSourceName(file.name);
    setSourceSize(file.size);
    setPreviewUrl(URL.createObjectURL(file)); // Show original initially
    setCompressedSize(0);
  };

  const clearWorkspace = () => {
    setSourcePdf(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCompressedSize(0);
  };

  const compressPdf = async () => {
    if (!sourcePdf) return;
    setIsProcessing(true);
    const toastId = toast.loading('Deflating structure & optimizing streams...');

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
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(pdfBlob));
        toast.success(`Successfully reduced file size by ${Math.round((1 - (pdfBlob.size / sourceSize)) * 100)}%!`, { id: toastId });
      } else {
        toast.success('Document is already highly optimized!', { id: toastId });
      }
    } catch (error) {
      console.error("Compression failed:", error);
      toast.error("Failed to compress document. Check Python server connection.", { id: toastId });
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
    toast.success("Document downloaded!");
  };

  // Logic to handle already-tiny files
  const isOptimized = compressedSize >= sourceSize && compressedSize !== 0;
  const displaySize = isOptimized ? sourceSize : compressedSize;
  const savedPercent = compressedSize > 0 && !isOptimized 
    ? Math.round((1 - (compressedSize / sourceSize)) * 100) 
    : 0;

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Controls (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {!sourcePdf ? (
          <div className="flex-1 flex flex-col h-full">
            <UploadZone 
              onFilesSelected={handleFilesSelected}
              accept=".pdf, application/pdf"
              multiple={false}
              title="Compress PDF"
              subtitle="Drop a PDF to shrink file size locally"
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 rounded-2xl flex flex-col h-full overflow-hidden">
            
            <div className="border-b border-white/5 pb-4 mb-6 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Minimize2 size={18} className="text-amber-500" /> Compression Engine
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
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{sourceName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5 font-bold">Original</p>
                  <p className="text-sm font-mono text-white">{formatBytes(sourceSize)}</p>
                </div>
                <div className={`rounded-lg p-2 border text-center transition-colors ${compressedSize ? (isOptimized ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20') : 'bg-white/5 border-white/5'}`}>
                  <p className={`text-[9px] uppercase tracking-widest mb-0.5 font-bold ${compressedSize ? (isOptimized ? 'text-emerald-500/70' : 'text-amber-500/70') : 'text-slate-600'}`}>
                    Compressed
                  </p>
                  <p className={`text-sm font-mono ${compressedSize ? (isOptimized ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-500'}`}>
                    {compressedSize ? formatBytes(displaySize) : '---'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-6 flex flex-col justify-center items-center text-center relative overflow-hidden shrink-0">
              {compressedSize > 0 && !isOptimized && (
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl z-0 pointer-events-none" />
              )}
              
              <div className="z-10 flex flex-col items-center">
                {compressedSize > 0 ? (
                  isOptimized ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-4 text-[#10B981] border border-[#10B981]/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <ShieldCheck size={28} />
                      </div>
                      <h4 className="text-white font-bold mb-2">Already Optimized</h4>
                      <p className="text-xs text-slate-400 leading-relaxed px-2">This file is incredibly small. Further compression would only damage quality without saving space.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        <span className="text-xl font-black">-{savedPercent}%</span>
                      </div>
                      <h4 className="text-white font-bold mb-2">Compression Complete</h4>
                      <p className="text-xs text-slate-400 leading-relaxed px-2">Review the quality in the right pane before downloading your optimized file.</p>
                    </>
                  )
                ) : (
                  <>
                    <Minimize2 size={36} className="text-slate-600 mb-4 opacity-50" />
                    <h4 className="text-white font-bold mb-2">Ready to Compress</h4>
                    <p className="text-xs text-slate-400 leading-relaxed px-2">The local engine will strip unused metadata, garbage-collect dead streams, and deflate the structure.</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 shrink-0 border-t border-white/5">
              {!compressedSize ? (
                <button 
                  onClick={compressPdf} 
                  disabled={isProcessing} 
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:shadow-none"
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="animate-spin" /> Compressing...</>
                  ) : (
                    <><Minimize2 size={18} /> Compress File</>
                  )}
                </button>
              ) : (
                <button 
                  onClick={downloadPdf} 
                  className="w-full py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
                >
                  <Download size={18} /> {isOptimized ? 'Keep Original File' : 'Save Compressed PDF'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── RIGHT PANE: Live Quality Inspection (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col h-full min-h-0 bg-black/20">
        
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <Minimize2 size={16} className="text-amber-500"/> Quality Inspection
          </span>
          {compressedSize > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-md">
              <CheckCircle2 size={12} className={isOptimized ? "text-[#10B981]" : "text-amber-500"} /> 
              {isOptimized ? 'Original' : 'Compressed Preview'}
            </div>
          )}
        </div>
        
        <div className="flex-1 bg-[#0a0a0a] relative min-h-0 p-4 flex items-center justify-center">
          {!previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
              <Minimize2 size={32} className="opacity-20" />
              Waiting for document...
            </div>
          ) : (
            <iframe 
              src={previewUrl} 
              className="w-full h-full border-none rounded-xl bg-white shadow-2xl" 
              title="Compressed PDF Preview" 
            />
          )}
        </div>
      </div>
    </div>
  );
}