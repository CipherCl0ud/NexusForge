import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Archive, Download, X } from 'lucide-react';

export default function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [quality, setQuality] = useState(0.6);
  const [resultData, setResultData] = useState(null);
  const [resultSize, setResultSize] = useState(0);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    compress(url, 0.6, f.type);
  };

  const compress = (imgUrl, q, type) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Force lossy format for compression
      const outType = type === 'image/png' ? 'image/jpeg' : type; 
      const dataUrl = canvas.toDataURL(outType, q);
      
      setResultData(dataUrl);
      setResultSize(Math.ceil((dataUrl.split(',')[1].length * 3) / 4));
    };
    img.src = imgUrl;
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = resultData;
    a.download = `compressed-${file.name}`;
    a.click();
  };

  const savings = file && resultSize ? Math.round((1 - resultSize / file.size) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {!file ? (
        <div className="relative h-64 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/[0.07] flex flex-col items-center justify-center transition-all cursor-pointer">
          <Upload size={32} className="text-accent mb-4" />
          <h3 className="text-white font-medium mb-1">Drop image to compress</h3>
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-white font-medium">{file.name}</h3>
            <button onClick={() => setFile(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Original: {(file.size / 1024).toFixed(1)} KB</p>
              <img src={preview} alt="Original" className="w-full h-48 object-contain rounded-xl bg-black/30 border border-white/5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-emerald-400 uppercase tracking-widest flex justify-between">
                <span>Compressed: {(resultSize / 1024).toFixed(1)} KB</span>
                <span>-{savings}%</span>
              </p>
              <img src={resultData} alt="Compressed" className="w-full h-48 object-contain rounded-xl bg-black/30 border border-emerald-500/20" />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <div className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Compression Quality</span>
                <span className="font-mono text-accent">{Math.round(quality * 100)}%</span>
              </div>
              <input 
                type="range" min="0.1" max="1" step="0.05" value={quality} 
                onChange={(e) => {
                  const q = parseFloat(e.target.value);
                  setQuality(q);
                  compress(preview, q, file.type);
                }}
                className="w-full accent-blue-500 h-1.5 cursor-pointer"
              />
            </div>

            <button onClick={download} className="w-full py-3 bg-accent hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
              <Archive size={16} /> Save Compressed Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}