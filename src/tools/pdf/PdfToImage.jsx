import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, Loader2, FileText, Archive, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function PdfToImage() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceSize, setSourceSize] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultSize, setResultSize] = useState(0);

  // Clean up URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      toast.error("Please select a valid PDF document.");
      return;
    }
    
    setSourcePdf(file);
    setSourceName(file.name);
    setSourceSize(file.size);
    setResultUrl(null);
    setResultSize(0);
  };

  const clearWorkspace = () => {
    setSourcePdf(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  };

  const convertToImages = async () => {
    if (!sourcePdf) return;
    setIsProcessing(true);
    const toastId = toast.loading('Extracting pages to PNG...');

    try {
      const formData = new FormData();
      formData.append('file', sourcePdf);

      const response = await fetch('http://localhost:8000/api/pdf-to-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Conversion failed');

      const zipBlob = await response.blob();
      setResultSize(zipBlob.size);
      
      if (resultUrl) URL.revokeObjectURL(resultUrl); // Free memory
      setResultUrl(URL.createObjectURL(zipBlob));
      
      toast.success('Document sliced and archived successfully!', { id: toastId });
    } catch (error) {
      console.error("Conversion failed:", error);
      toast.error("Failed to convert document. Check Python server connection.", { id: toastId });
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
    toast.success("ZIP Archive downloaded!");
  };

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
              title="PDF to Image Sequence"
              subtitle="Drop a PDF to slice pages into high-res PNGs"
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 rounded-2xl flex flex-col h-full overflow-hidden">
            
            <div className="border-b border-white/5 pb-4 mb-6 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-[#ec4899]" /> Extraction Settings
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
              <div className="w-10 h-10 rounded-lg bg-[#ec4899]/10 flex items-center justify-center text-[#ec4899] shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{sourceName}</p>
                <p className="text-xs text-slate-500">{formatBytes(sourceSize)}</p>
              </div>
            </div>

            <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ec4899]/5 rounded-full blur-2xl pointer-events-none" />
              <ImageIcon size={42} className="text-[#ec4899]/40 mb-4 z-10" />
              <h4 className="text-white font-bold mb-2 z-10">Ready to Extract</h4>
              <p className="text-sm text-slate-400 z-10 leading-relaxed">
                The local Python engine will slice this document into individual image files and package them into a compressed ZIP folder.
              </p>
            </div>

            <div className="mt-auto pt-6 shrink-0">
              {!resultUrl ? (
                <button 
                  onClick={convertToImages} 
                  disabled={isProcessing} 
                  className="w-full py-4 bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-50 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ec4899]/20 disabled:shadow-none"
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="animate-spin" /> Engine Processing...</>
                  ) : (
                    <><ImageIcon size={18} /> Convert to Images</>
                  )}
                </button>
              ) : (
                <button 
                  onClick={clearWorkspace} 
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> Convert Another Document
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── RIGHT PANE: Output Inspector (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col h-full min-h-0 bg-black/20">
        
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            {resultUrl ? (
              <><CheckCircle2 size={16} className="text-[#10B981]"/> Conversion Complete</>
            ) : (
              <><Archive size={16} className="text-[#ec4899]"/> Export Inspector</>
            )}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-md">
            <ShieldCheck size={12} className="text-[#ec4899]" /> Local Engine
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center p-10 min-h-0 relative">
          <AnimatePresence mode="wait">
            {!resultUrl ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <Archive size={48} className="text-slate-700 mb-4" />
                <h4 className="text-white font-medium mb-2">Awaiting PDF</h4>
                <p className="text-sm text-slate-500">The generated ZIP payload will appear here.</p>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full max-w-lg">
                <div className="w-24 h-24 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-[#10B981]/20">
                  <Archive size={48} />
                </div>
                
                <h4 className="text-3xl font-black text-white mb-2 tracking-tight">Extraction Complete</h4>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  All PDF pages have been successfully converted to high-resolution PNG format and packaged securely into a ZIP archive.
                </p>

                <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-500 text-sm font-medium">Output Archive</span>
                    <span className="text-white font-mono text-sm truncate max-w-[200px]">{sourceName.replace('.pdf', '')}_Images.zip</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium">Total Size</span>
                    <span className="text-white font-mono text-sm bg-white/5 px-2 py-0.5 rounded border border-white/10">{formatBytes(resultSize)}</span>
                  </div>
                </div>

                <button 
                  onClick={downloadZip} 
                  className="px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 w-full md:w-auto"
                >
                  <Download size={20} /> Download Image Archive
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
}