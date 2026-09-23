import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Loader2, Sparkles, ZoomIn, FileImage, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

export default function ImageUpscaler() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      return;
    }
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
    setResultUrl(null);
  };

  const upscaleImage = async () => {
    if (!file) return;
    setProcessing(true);
    const toastId = toast.loading('Running Real-ESRGAN Neural Network...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/upscale', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Backend processing failed');

      const imageBlob = await response.blob();
      setResultUrl(URL.createObjectURL(imageBlob));
      toast.success('Upscaling complete!', { id: toastId });
    } catch (error) {
      console.error("Upscaling failed:", error);
      toast.error("Failed to upscale image. Check if local engine is running.", { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}-upscaled-4x.png`;
    a.click();
    toast.success("Image saved!");
  };

  const clearWorkspace = () => {
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
  };

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Controls (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {!file ? (
          <div className="flex-1 flex flex-col h-full">
            <UploadZone 
              onFilesSelected={handleFilesSelected}
              accept="image/png, image/jpeg, image/webp"
              multiple={false}
              title="Drop image to AI Upscale"
              subtitle="Enhance low-res images using EDSR Deep Learning"
            />
          </div>
        ) : (
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-full">
            <div className="border-b border-white/5 pb-4 mb-6 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-[#3b82f6]" /> AI Super Resolution
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
              <div className="w-12 h-12 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] shrink-0">
                <FileImage size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-sm shrink-0 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Engine</span>
                <span className="text-slate-300 font-mono">Real-ESRGAN x4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Compute</span>
                <span className="text-slate-300 font-mono">Local CUDA/WASM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Status</span>
                <span className={`font-bold ${processing ? 'text-[#3b82f6] animate-pulse' : resultUrl ? 'text-[#10B981]' : 'text-slate-300'}`}>
                  {processing ? 'Processing...' : resultUrl ? 'Complete' : 'Ready'}
                </span>
              </div>
            </div>

            <div className="mt-auto space-y-3 shrink-0">
              <button 
                onClick={upscaleImage} 
                disabled={processing || resultUrl} 
                className="w-full py-4 bg-[#3b82f6] hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#3b82f6]/20 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {processing ? (
                  <><Loader2 size={18} className="animate-spin" /> Upscaling 4x...</>
                ) : resultUrl ? (
                  <><Sparkles size={18} /> Enhanced</>
                ) : (
                  <><Sparkles size={18} /> Enhance 4x</>
                )}
              </button>

              {resultUrl && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={download} 
                  className="w-full py-4 bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#10B981] font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Save High-Res Image
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANE: Visual Comparison (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative flex flex-col h-full min-h-0">
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <ZoomIn size={16} className="text-[#3b82f6]"/> Live Comparison
          </span>
        </div>

        <div className="flex-1 flex flex-col md:flex-row bg-[#050505] relative min-h-0">
          
          {!file ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
               <ZoomIn size={32} className="opacity-20" />
               Waiting for image...
             </div>
          ) : (
            <>
              {/* Original Side */}
              <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10 flex flex-col overflow-hidden">
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-300 border border-white/10 shadow-lg">
                  Original
                </div>
                {/* Visual presentation trick */}
                <div className="absolute inset-0 z-0">
                  <img src={originalUrl} alt="Blurred bg" className="w-full h-full object-cover opacity-20 blur-xl scale-110" />
                </div>
                <div className="absolute inset-0 z-10 p-6 flex items-center justify-center">
                  <img src={originalUrl} alt="Original Crisp" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                </div>
              </div>

              {/* Result Side */}
              <div className="flex-1 relative flex flex-col overflow-hidden bg-black/20">
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-[#3b82f6]/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#3b82f6] border border-[#3b82f6]/30 shadow-lg flex items-center gap-2">
                  Upscaled <ArrowRight size={10}/> 4x
                </div>

                {!resultUrl && !processing && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-500 bg-black/40 backdrop-blur-sm">
                    <ZoomIn size={24} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Ready to enhance</p>
                  </div>
                )}

                {processing && (
                  <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-[#3b82f6]">
                    <Loader2 size={32} className="animate-spin mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <p className="text-sm font-bold tracking-wide animate-pulse">Running Neural Network...</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono text-center px-6">
                      Heavy CPU/CUDA compute<br/>Usually takes 5-15 seconds
                    </p>
                  </div>
                )}

                {resultUrl && (
                  <>
                    <div className="absolute inset-0 z-0">
                      <img src={resultUrl} alt="Blurred bg" className="w-full h-full object-cover opacity-20 blur-xl scale-110" />
                    </div>
                    <div className="absolute inset-0 z-10 p-6 flex items-center justify-center">
                      <img src={resultUrl} alt="Upscaled Crisp" className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}