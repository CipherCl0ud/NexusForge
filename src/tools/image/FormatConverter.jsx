import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, X, ImageIcon, Settings2, ArrowRight, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

const FORMATS = [
  { id: 'image/png',  label: 'PNG',  ext: 'png',  lossy: false, note: 'Lossless · Best for graphics' },
  { id: 'image/jpeg', label: 'JPG',  ext: 'jpg',  lossy: true,  note: 'Lossy · Best for photos'     },
  { id: 'image/webp', label: 'WebP', ext: 'webp', lossy: true,  note: 'Lossy · Best for web'        },
  { id: 'image/avif', label: 'AVIF', ext: 'avif', lossy: true,  note: 'Lossy · Next-gen compression' },
];

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FormatConverter() {
  const [file,          setFile]          = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [outputFormat,  setOutputFormat]  = useState(FORMATS[2]); // WebP default
  const [quality,       setQuality]       = useState(0.85);
  const [result,        setResult]        = useState(null);
  const [converting,    setConverting]    = useState(false);
  const [originalSize,  setOriginalSize]  = useState(0);
  const [convertedSize, setConvertedSize] = useState(0);
  const [imgDimensions, setImgDimensions] = useState(null);

  const handleFilesSelected = useCallback((files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      return;
    }
    
    setFile(f);
    setOriginalSize(f.size);
    setResult(null);
    setConvertedSize(0);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      const img = new Image();
      img.onload = () => setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = e.target.result;
    };
    reader.readAsDataURL(f);
  }, []);

  const reset = () => {
    setFile(null); 
    setPreview(null);
    setResult(null); 
    setConvertedSize(0); 
    setImgDimensions(null);
  };

  const convert = async () => {
    if (!preview) return;
    setConverting(true);
    const toastId = toast.loading(`Converting to ${outputFormat.label}...`);

    // Yield to main thread so UI updates before heavy synchronous canvas operations
    setTimeout(() => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');

          // JPG doesn't support transparency — fill white background
          if (outputFormat.id === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          let dataUrl;
          try {
            dataUrl = outputFormat.lossy
              ? canvas.toDataURL(outputFormat.id, quality)
              : canvas.toDataURL(outputFormat.id);
          } catch {
            // AVIF may not be supported on all browsers — fall back to WebP
            dataUrl = canvas.toDataURL('image/webp', quality);
            toast.success("AVIF unsupported. Fallback to WebP used.", { id: toastId });
          }

          const bytes = Math.ceil((dataUrl.split(',')[1].length * 3) / 4);
          setConvertedSize(bytes);
          setResult(dataUrl);
          toast.success('Conversion complete!', { id: toastId });
        } catch (error) {
          console.error("Conversion failed:", error);
          toast.error("Failed to convert image.", { id: toastId });
        } finally {
          setConverting(false);
        }
      };
      img.src = preview;
    }, 100);
  };

  const download = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `${file.name.replace(/\.[^.]+$/, '')}.${outputFormat.ext}`;
    a.click();
    toast.success("File downloaded!");
  };

  const savings = originalSize && convertedSize
    ? Math.round((1 - convertedSize / originalSize) * 100)
    : null;

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
              title="Convert Image Format"
              subtitle="PNG, JPG, WebP, AVIF, GIF, BMP"
            />
          </div>
        ) : (
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="border-b border-white/5 pb-4 mb-6 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Settings2 size={18} className="text-[#3b82f6]" /> Format Settings
              </h3>
              <button 
                onClick={reset}
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
                <p className="text-xs text-slate-500">
                  {formatBytes(originalSize)} {imgDimensions && `· ${imgDimensions.w}×${imgDimensions.h}`}
                </p>
              </div>
            </div>

            {/* Format Selector */}
            <div className="shrink-0 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Output Format</p>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => { setOutputFormat(fmt); setResult(null); }}
                    className={`p-3 rounded-xl text-left border transition-all flex flex-col gap-1
                      ${outputFormat.id === fmt.id
                        ? 'bg-[#3b82f6]/15 border-[#3b82f6]/40 text-white shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}
                  >
                    <span className="text-sm font-bold">{fmt.label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{fmt.note}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            <div className="shrink-0 mt-6 min-h-[80px]">
              <AnimatePresence mode="wait">
                {outputFormat.lossy && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex justify-between items-end mb-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compression Quality</p>
                      <span className="text-sm text-[#3b82f6] font-mono bg-[#3b82f6]/10 px-2 py-0.5 rounded">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0.1" max="1" step="0.05"
                      value={quality}
                      onChange={(e) => { setQuality(parseFloat(e.target.value)); setResult(null); }}
                      className="w-full accent-[#3b82f6] h-1.5 cursor-pointer bg-white/10 rounded-full appearance-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                      <span>Smallest File</span>
                      <span>Best Quality</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3 shrink-0 pt-4 border-t border-white/5">
              <button
                onClick={convert}
                disabled={converting || result}
                className="w-full py-4 bg-[#3b82f6] hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#3b82f6]/20 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {converting ? (
                  <><RefreshCw size={18} className="animate-spin" /> Converting...</>
                ) : result ? (
                  <><RefreshCw size={18} /> Re-Convert Format</>
                ) : (
                  <><RefreshCw size={18} /> Convert to {outputFormat.label}</>
                )}
              </button>

              {result && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={download}
                  className="w-full py-4 bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#10B981] font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download {outputFormat.label}
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANE: Visual Comparison (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative flex flex-col h-full min-h-0 bg-black/20">
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <ImageIcon size={16} className="text-[#3b82f6]"/> Side-by-Side Comparison
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
                    {formatBytes(originalSize)}
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
                  <div className="px-3 py-1.5 bg-[#3b82f6]/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#3b82f6] border border-[#3b82f6]/30 shadow-lg flex items-center gap-2 w-fit">
                    Output <ArrowRight size={10}/> {outputFormat.label}
                  </div>
                  {result && (
                    <div className="flex gap-2">
                      <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded text-xs font-mono text-white border border-white/5 w-fit">
                        {formatBytes(convertedSize)}
                      </div>
                      {savings !== null && (
                        <div className={`px-2 py-1 backdrop-blur-md rounded text-xs font-bold border w-fit ${savings >= 0 ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {savings >= 0 ? `↓ ${savings}% smaller` : `↑ ${Math.abs(savings)}% larger`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!result && !converting && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-500 bg-black/40 backdrop-blur-sm">
                    <RefreshCw size={24} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Press Convert to Preview</p>
                  </div>
                )}

                {converting && (
                  <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-[#3b82f6]">
                    <RefreshCw size={32} className="animate-spin mb-4 drop-shadow-md" />
                    <p className="text-sm font-bold tracking-wide animate-pulse">Encoding {outputFormat.label} locally...</p>
                  </div>
                )}

                {result && (
                  <>
                    <div className="absolute inset-0 z-0">
                      <img src={result} alt="Blurred bg" className="w-full h-full object-cover opacity-20 blur-xl scale-110" />
                    </div>
                    <div className="absolute inset-0 z-10 p-6 flex items-center justify-center">
                      <img src={result} alt="Converted Crisp" className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />
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