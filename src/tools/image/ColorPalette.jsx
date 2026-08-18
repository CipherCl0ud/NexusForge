import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Palette, Copy, Check, X } from 'lucide-react';

export default function ColorPalette() {
  const [image, setImage] = useState(null);
  const [colors, setColors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(null);
  const canvasRef = useRef(null);

  const extractColors = (imgSrc) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Scale down for faster processing
      canvas.width = 150;
      canvas.height = (img.height / img.width) * 150;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorMap = {};

      // Sample pixels and quantize (group similar colors)
      for (let i = 0; i < data.length; i += 16) { // Skip pixels for speed
        const r = Math.round(data[i] / 24) * 24;
        const g = Math.round(data[i + 1] / 24) * 24;
        const b = Math.round(data[i + 2] / 24) * 24;
        const rgb = `${r},${g},${b}`;
        colorMap[rgb] = (colorMap[rgb] || 0) + 1;
      }

      // Sort by frequency and convert to Hex
      const sorted = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([rgb]) => {
          const [r, g, b] = rgb.split(',').map(Number);
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        });

      setColors(sorted);
    };
    img.src = imgSrc;
  };

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f);
    setImage({ file: f, url });
    extractColors(url);
  };

  const copy = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {!image ? (
        <motion.div
          onDragEnter={() => setIsDragging(true)}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
          className={`relative h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging ? 'border-accent bg-accent/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}
        >
          <div className="text-center pointer-events-none">
            <div className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 text-accent"><Palette size={32} /></div>
            <h3 className="text-lg font-semibold text-white mb-1">Drop an image to extract colors</h3>
          </div>
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFile(e.target.files[0])} />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-medium truncate">{image.file.name}</h3>
            <button onClick={() => setImage(null)} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X size={16} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/20 rounded-xl p-2 border border-white/5">
              <img src={image.url} alt="Source" className="w-full h-64 object-contain rounded-lg" />
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-300">Dominant Palette</p>
              <div className="grid grid-cols-2 gap-3">
                {colors.map((hex, i) => (
                  <button key={i} onClick={() => copy(hex)} className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="w-8 h-8 rounded-lg shadow-inner border border-white/10 flex-shrink-0" style={{ backgroundColor: hex }} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-mono text-white group-hover:text-accent transition-colors">{hex}</p>
                    </div>
                    {copied === hex ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </div>
  );
}