import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, ImagePlus, X, Loader2, Sparkles, ZoomIn } from 'lucide-react';

export default function ImageUpscaler() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
    setResultUrl(null);
  };

  const upscaleImage = async () => {
    if (!file) return;
    setProcessing(true);

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
    } catch (error) {
      console.error("Upscaling failed:", error);
      alert("Failed to upscale image. Check console for details.");
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
  };

  const reset = () => {
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`relative h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
              ${isDragging ? 'border-accent bg-accent/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}
          >
            <div className="text-center pointer-events-none flex flex-col items-center justify-center h-full">
              <div className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 text-accent">
                <ZoomIn size={32} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Drop image to AI Upscale (4x)</h3>
              <p className="text-sm text-slate-500">Enhance low-res images using EDSR Deep Learning</p>
            </div>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFile(e.target.files[0])} />
          </motion.div>
        ) : (
          <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Sparkles size={18} className="text-accent"/> AI Super Resolution
              </h3>
              <button onClick={reset} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Preview */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Original Image</p>
                <div className="bg-black/30 rounded-xl border border-white/5 h-80 flex items-center justify-center overflow-hidden relative">
                  <img src={originalUrl} alt="Original" className="w-full h-full object-cover opacity-80 blur-[1px]" />
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                     <img src={originalUrl} alt="Original Crisp" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                  </div>
                </div>
              </div>

              {/* Result Preview */}
              <div className="space-y-2">
                <p className="text-xs text-accent uppercase tracking-widest flex justify-between items-center">
                  <span>Upscaled Result</span>
                  {resultUrl && <span className="text-emerald-400">4x Resolution</span>}
                </p>
                <div className="bg-black/40 rounded-xl border border-white/10 h-80 flex items-center justify-center overflow-hidden relative">
                  {!resultUrl && !processing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-slate-400">
                      <ZoomIn size={24} className="mb-2 opacity-50" />
                      <p className="text-sm">Ready to enhance</p>
                    </div>
                  )}

                  {processing && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-accent">
                      <Loader2 size={32} className="animate-spin mb-4" />
                      <p className="text-sm font-medium animate-pulse">Running Neural Network...</p>
                      <p className="text-[10px] text-slate-500 mt-2 text-center px-4">This requires heavy CPU computation.<br/>Usually takes 5-15 seconds.</p>
                    </div>
                  )}

                  {resultUrl && (
                    <>
                      <img src={resultUrl} alt="Blurred bg" className="w-full h-full object-cover opacity-30" />
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                         <img src={resultUrl} alt="Upscaled" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={upscaleImage} 
                disabled={processing || resultUrl} 
                className={`flex-1 py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${resultUrl ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-accent hover:bg-blue-600 text-white shadow-lg shadow-accent/20'}`}
              >
                {processing ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Sparkles size={16} /> Enhance 4x</>}
              </button>

              {resultUrl && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={download} 
                  className="flex-1 py-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Save High-Res Image
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}