import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Copy, Check, X, Droplet, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

export default function ColorPalette() {
  const [image, setImage] = useState(null);
  const [colors, setColors] = useState([]);
  const [copied, setCopied] = useState(null);
  const canvasRef = useRef(null);

  const extractColors = (imgSrc) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Scale down heavily for fast sampling
      canvas.width = 100;
      canvas.height = (img.height / img.width) * 100;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorMap = {};

      // Sample pixels and quantize (group similar colors)
      for (let i = 0; i < data.length; i += 16) {
        const r = Math.round(data[i] / 24) * 24;
        const g = Math.round(data[i + 1] / 24) * 24;
        const b = Math.round(data[i + 2] / 24) * 24;
        
        // Skip pure white/black boundaries to find true image colors
        if ((r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) continue;
        
        const rgb = `${r},${g},${b}`;
        colorMap[rgb] = (colorMap[rgb] || 0) + 1;
      }

      // Sort by frequency and convert to Hex (Extract Top 12)
      const sorted = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([rgb]) => {
          const [r, g, b] = rgb.split(',').map(Number);
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        });

      setColors(sorted);
    };
    img.src = imgSrc;
  };

  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      return;
    }
    const url = URL.createObjectURL(f);
    setImage({ file: f, url });
    extractColors(url);
  };

  const copyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    toast.success(`Copied ${hex} to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearWorkspace = () => {
    setImage(null);
    setColors([]);
  };

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[500px] max-h-[850px]">
      
      {/* ── LEFT PANE: Controls & Image (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {!image ? (
          <div className="flex-1 flex flex-col h-full">
            <UploadZone 
              onFilesSelected={handleFilesSelected}
              accept="image/png, image/jpeg, image/webp"
              multiple={false}
              title="Extract Color Palette"
              subtitle="Drop an image to extract its dominant HEX codes"
            />
          </div>
        ) : (
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="border-b border-white/5 pb-4 mb-6 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Palette size={18} className="text-[#3b82f6]" /> Source Image
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
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center gap-4 mb-4 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] shrink-0">
                <FileImage size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{image.file.name}</p>
                <p className="text-xs text-slate-500">{(image.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            {/* Source Image Preview */}
            <div className="flex-1 relative rounded-xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center p-4 min-h-0">
              <img 
                src={image.url} 
                alt="Source" 
                className="max-w-full max-h-full object-contain drop-shadow-2xl" 
              />
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>

      {/* ── RIGHT PANE: Extracted Colors (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative flex flex-col h-full min-h-0 bg-black/20">
        <div className="bg-white/5 px-6 py-5 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <Droplet size={16} className="text-[#3b82f6]"/> Dominant Palette
          </span>
          {colors.length > 0 && (
            <span className="text-xs font-mono text-slate-400 bg-black/40 px-2 py-1 rounded-md border border-white/5">
              Top {colors.length} Matches
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {!image ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
              <Palette size={32} className="opacity-20" />
              Waiting for image...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {colors.map((hex, i) => (
                  <motion.button 
                    key={`${hex}-${i}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => copyHex(hex)} 
                    className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                  >
                    <div 
                      className="w-full aspect-video rounded-xl shadow-inner border border-white/10 shrink-0 transition-transform group-hover:scale-[1.02]" 
                      style={{ backgroundColor: hex }} 
                    />
                    
                    <div className="w-full flex items-center justify-between mt-1">
                      <p className="text-sm font-mono font-bold text-slate-300 group-hover:text-white transition-colors">
                        {hex}
                      </p>
                      <div className="p-1.5 rounded-lg bg-black/20 text-slate-500 group-hover:text-[#3b82f6] group-hover:bg-[#3b82f6]/10 transition-all">
                        {copied === hex ? <Check size={14} /> : <Copy size={14} />}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}