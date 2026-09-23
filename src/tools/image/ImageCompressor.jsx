import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, ImageIcon, Settings2, ArrowRight, FileImage, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [quality, setQuality] = useState(0.6);
  const [resultData, setResultData] = useState(null);
  const [resultSize, setResultSize] = useState(0);

  const handleFilesSelected = useCallback((files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      return;
    }
    
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    compress(url, 0.6, f.type);
  }, []);

  const compress = (imgUrl, q, type) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Force a lossy format for compression. PNGs ignore the quality parameter.
      const outType = type === 'image/png' ? 'image/jpeg' : type; 
      const dataUrl = canvas.toDataURL(outType, q);
      
      setResultData(dataUrl);
      setResultSize(Math.ceil((dataUrl.split(',')[1].length * 3) / 4));
    };
    img.src = imgUrl;
  };

  const handleQualityChange = (e) => {
    const q = parseFloat(e.target.value);
    setQuality(q);
    
    // Slight timeout prevents the slider thumb from stuttering during heavy canvas processing
    setTimeout(() => {
      compress(preview, q, file.type);
    }, 10);
  };

  const download = () => {
    if (!resultData || !file) return;
    const a = document.createElement('a');
    a.href = resultData;
    // Update extension if we converted a PNG to JPG for compression
    const ext = (file.type === 'image/png') ? 'jpg' : file.name.split('.').pop();
    a.download = `${file.name.replace(/\.[^.]+$/, '')}-compressed.${ext}`;
    a.click();
    toast.success("Image saved!");
  };

  const clearWorkspace = () => {
    setFile(null);
    setPreview(null);
    setResultData(null);
    setResultSize(0);
    setQuality(0.6);
  };

  const savings = file && resultSize ? Math.round((1 - resultSize / file.size) * 100) : 0;

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Controls (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {!file ? (
          <div className="flex-1 flex flex-col h-full">
            <UploadZone 
              onFilesSelected={handleFilesSelected}
              accept="image/*"
              multiple={false}
              title="Compress Image"
              subtitle="Reduce file size instantly while preserving quality"
            />
          </div>
        ) : (
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="border-b border-white/5 pb-4 mb-6 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Settings2 size={18} className="text-[#3b82f6]" /> Compression Settings
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
              <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] shrink-0">
                <FileImage size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-500">Original Size: {formatBytes(file.size)}</p>
              </div>
            </div>

            {/* Quality Slider */}
            <div className="shrink-0 space-y-4">
              <div className="flex justify-between items-end mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Quality</p>
                <span className="text-sm text-[#3b82f6] font-mono bg-[#3b82f6]/10 px-2 py-0.5 rounded border border-[#3b82f6]/20">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              
              <input 
                type="range" min="0.1" max="1" step="0.05" 
                value={quality} 
                onChange={handleQualityChange}
                className="w-full accent-[#3b82f6] h-1.5 cursor-pointer bg-white/10 rounded-full appearance-none"
              />
              
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                <span>Maximum Compression</span>
                <span>Maximum Quality</span>
              </div>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-sm my-6 shrink-0 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">New Size</span>
                <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {formatBytes(resultSize)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Savings</span>
                <span className={`font-mono px-2 py-0.5 rounded border ${savings >= 0 ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {savings >= 0 ? `-${savings}%` : `+${Math.abs(savings)}%`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3 shrink-0 pt-4 border-t border-white/5">
              <button
                onClick={download}
                disabled={!resultData}
                className="w-full py-4 bg-[#3b82f6] hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#3b82f6]/20 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <Archive size={18} /> Save Compressed Image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANE: Visual Comparison (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative flex flex-col h-full min-h-0 bg-black/20">
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <ImageIcon size={16} className="text-[#3b82f6]"/> Live Comparison
          </span>
        </div>

        <div className="flex-1 flex flex-col md:flex-row relative min-h-0">
          
          {!file ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
               <ImageIcon size={32} className="opacity-20" />
               Waiting for image...
             </div>
          ) : (
            <>
              {/* Original Side */}
              <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10 flex flex-col overflow-hidden bg-black/40">
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
                  <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-300 border border-white/10 shadow-lg w-fit">
                    Original
                  </div>
                  <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded text-xs font-mono text-slate-400 border border-white/5 w-fit">
                    {formatBytes(file.size)}
                  </div>
                </div>
                
                <div className="absolute inset-0 z-0">
                  <img src={preview} alt="Blurred bg" className="w-full h-full object-cover opacity-20 blur-xl scale-110" />
                </div>
                <div className="absolute inset-0 z-10 p-6 flex items-center justify-center">
                  <img src={preview} alt="Original Crisp" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                </div>
              </div>

              {/* Result Side */}
              <div className="flex-1 relative flex flex-col overflow-hidden bg-black/40">
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
                  <div className="px-3 py-1.5 bg-[#10B981]/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#10B981] border border-[#10B981]/30 shadow-lg flex items-center gap-2 w-fit">
                    Compressed <ArrowRight size={10}/> {Math.round(quality * 100)}%
                  </div>
                  {resultData && (
                    <div className="flex gap-2">
                      <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded text-xs font-mono text-white border border-white/5 w-fit">
                        {formatBytes(resultSize)}
                      </div>
                      <div className={`px-2 py-1 backdrop-blur-md rounded text-xs font-bold border w-fit ${savings >= 0 ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {savings >= 0 ? `↓ ${savings}% smaller` : `↑ ${Math.abs(savings)}% larger`}
                      </div>
                    </div>
                  )}
                </div>

                {resultData && (
                  <>
                    <div className="absolute inset-0 z-0">
                      <img src={resultData} alt="Blurred bg" className="w-full h-full object-cover opacity-20 blur-xl scale-110" />
                    </div>
                    <div className="absolute inset-0 z-10 p-6 flex items-center justify-center">
                      <img src={resultData} alt="Compressed Crisp" className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />
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