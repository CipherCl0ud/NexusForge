import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Maximize2, Download, X, Settings } from 'lucide-react';

export default function BulkResizer() {
  const [images, setImages] = useState([]);
  
  // New Dimensional States
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('');
  const [maintainRatio, setMaintainRatio] = useState(true);
  
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFiles = (files) => {
    const valid = [...files].filter(f => f.type.startsWith('image/'));
    const newImages = valid.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      url: URL.createObjectURL(f),
      status: 'pending' // pending, done
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const processAll = async () => {
    setProcessing(true);
    for (let i = 0; i < images.length; i++) {
      if (images[i].status === 'done') continue;
      
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = images[i].url; });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let newW = img.width;
      let newH = img.height;
      const targetW = width ? Number(width) : null;
      const targetH = height ? Number(height) : null;

      // Smart Resizing Logic
      if (maintainRatio) {
        if (targetW && targetH) {
          // Fit within the box defined by W and H
          const ratio = Math.min(targetW / img.width, targetH / img.height);
          newW = Math.round(img.width * ratio);
          newH = Math.round(img.height * ratio);
        } else if (targetW) {
          newW = targetW;
          newH = Math.round((img.height / img.width) * targetW);
        } else if (targetH) {
          newH = targetH;
          newW = Math.round((img.width / img.height) * targetH);
        }
      } else {
        // Force exact dimensions (Stretch/Squish)
        newW = targetW || img.width;
        newH = targetH || img.height;
      }
      
      canvas.width = newW;
      canvas.height = newH;
      ctx.drawImage(img, 0, 0, newW, newH);
      
      const dataUrl = canvas.toDataURL(images[i].file.type, 0.9);
      
      setImages(prev => prev.map((imgObj, idx) => 
        idx === i ? { ...imgObj, status: 'done', resultData: dataUrl } : imgObj
      ));
    }
    setProcessing(false);
  };

  const downloadAll = () => {
    images.filter(img => img.status === 'done').forEach((img, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = img.resultData;
        a.download = `resized-${img.file.name}`;
        a.click();
      }, i * 300); // Stagger downloads slightly so the browser doesn't block them
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Upload & Queue */}
        <div className="md:col-span-2 space-y-4">
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            className={`relative h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging ? 'border-accent bg-accent/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}
          >
            <div className="flex items-center gap-3 text-slate-300 pointer-events-none">
              <Upload size={20} className="text-accent" />
              <span className="font-medium">Drop multiple images here</span>
            </div>
            <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFiles(e.target.files)} />
          </div>

          <div className="glass-panel p-4 rounded-2xl min-h-[200px] max-h-[400px] overflow-y-auto">
            {images.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2 mt-12">
                No images queued.
              </div>
            ) : (
              <div className="space-y-2">
                {images.map((img) => (
                  <div key={img.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 truncate">
                      <img src={img.url} alt="" className="w-10 h-10 object-cover rounded-lg bg-black/50" />
                      <span className="text-sm text-slate-300 truncate w-48">{img.file.name}</span>
                    </div>
                    {img.status === 'done' ? (
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">Resized</span>
                    ) : (
                      <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))} className="text-slate-500 hover:text-red-400 transition-colors p-1"><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Settings */}
        <div className="glass-panel p-6 rounded-2xl space-y-6 h-fit">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Settings size={18} className="text-accent" />
            <h3 className="font-medium text-white">Resize Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Width (px)</label>
                <input 
                  type="number" value={width} onChange={(e) => setWidth(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent/50 font-mono text-sm placeholder:text-slate-600"
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Height (px)</label>
                <input 
                  type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent/50 font-mono text-sm placeholder:text-slate-600"
                  placeholder="Auto"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors -mx-2">
              <input 
                type="checkbox" 
                checked={maintainRatio} 
                onChange={(e) => setMaintainRatio(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/20 text-accent focus:ring-accent/50 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Maintain aspect ratio</span>
            </label>
            
            <p className="text-[10px] text-slate-500 leading-relaxed border-t border-white/5 pt-3">
              {maintainRatio 
                ? "Images scale safely. If both W and H are set, images fit entirely inside the box." 
                : "Images will be forced to the exact dimensions specified, which may cause stretching."}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button onClick={processAll} disabled={processing || images.length === 0} className="w-full py-3 bg-accent hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2">
              <Maximize2 size={16} /> {processing ? 'Processing...' : 'Resize All Images'}
            </button>
            
            <button onClick={downloadAll} disabled={!images.some(i => i.status === 'done')} className="w-full py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 disabled:opacity-50 text-emerald-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              <Download size={16} /> Download Finished
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}