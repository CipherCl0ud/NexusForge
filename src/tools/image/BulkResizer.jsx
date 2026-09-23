import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Download, X, Settings2, Image as ImageIcon, Archive, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';

export default function BulkResizer() {
  const [images, setImages] = useState([]);
  
  // Dimensional States
  const [width, setWidth] = useState('1080');
  const [height, setHeight] = useState('');
  const [maintainRatio, setMaintainRatio] = useState(true);
  
  const [processing, setProcessing] = useState(false);

  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;
    
    const valid = [...files].filter(f => f.type.startsWith('image/'));
    
    if (images.length + valid.length > 100) {
      toast.error("Limit reached: You can resize up to 100 images per batch.");
      valid.splice(100 - images.length); 
    }

    const newImages = valid.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      url: URL.createObjectURL(f),
      status: 'pending', // pending, done
      resultData: null
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const processAll = async () => {
    if (!width && !height) {
      toast.error("Please specify at least a target width or height.");
      return;
    }

    setProcessing(true);
    const toastId = toast.loading(`Resizing ${images.filter(i => i.status === 'pending').length} images...`);
    
    let successCount = 0;

    // Use a slight timeout to allow UI to render the loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    for (let i = 0; i < images.length; i++) {
      if (images[i].status === 'done') continue;
      
      try {
        const img = new Image();
        await new Promise((resolve, reject) => { 
          img.onload = resolve; 
          img.onerror = reject;
          img.src = images[i].url; 
        });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let newW = img.width;
        let newH = img.height;
        const targetW = width ? Number(width) : null;
        const targetH = height ? Number(height) : null;

        // Smart Resizing Logic
        if (maintainRatio) {
          if (targetW && targetH) {
            const ratio = Math.min(targetW / img.width, targetH / img.height);
            newW = Math.max(1, Math.round(img.width * ratio));
            newH = Math.max(1, Math.round(img.height * ratio));
          } else if (targetW) {
            newW = targetW;
            newH = Math.max(1, Math.round((img.height / img.width) * targetW));
          } else if (targetH) {
            newH = targetH;
            newW = Math.max(1, Math.round((img.width / img.height) * targetH));
          }
        } else {
          newW = targetW || img.width;
          newH = targetH || img.height;
        }
        
        canvas.width = newW;
        canvas.height = newH;
        
        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newW, newH);
        
        const dataUrl = canvas.toDataURL(images[i].file.type, 0.9);
        
        setImages(prev => prev.map((imgObj, idx) => 
          idx === i ? { ...imgObj, status: 'done', resultData: dataUrl } : imgObj
        ));
        successCount++;
      } catch (error) {
        console.error("Failed to resize image:", images[i].file.name);
      }
    }
    
    setProcessing(false);
    toast.success(`Successfully resized ${successCount} images!`, { id: toastId });
  };

  const downloadAll = async () => {
    const completed = images.filter(img => img.status === 'done');
    if (completed.length === 0) return;

    if (completed.length === 1) {
      // Single file download
      const a = document.createElement('a');
      a.href = completed[0].resultData;
      a.download = `resized-${completed[0].file.name}`;
      a.click();
      toast.success("Image downloaded!");
      return;
    }

    // Bulk ZIP download to prevent browser popup blocking
    const toastId = toast.loading('Bundling ZIP archive...');
    try {
      const zip = new JSZip();
      
      completed.forEach((img) => {
        // Convert base64 dataUrl back to a clean blob for the ZIP
        const base64Data = img.resultData.split(',')[1];
        zip.file(`resized-${img.file.name}`, base64Data, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexusforge-resized-images.zip`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Archive downloaded!', { id: toastId });
    } catch (error) {
      toast.error('Failed to generate ZIP archive.', { id: toastId });
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
    setWidth('1080');
    setHeight('');
  };

  const pendingCount = images.filter(i => i.status === 'pending').length;
  const doneCount = images.filter(i => i.status === 'done').length;

  return (
    // ── RESPONSIVE IDE LAYOUT (8/4 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Upload & Queue (8 Columns) ── */}
      <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
        
        {/* Compact Dropzone */}
        <div className="shrink-0">
          <UploadZone 
            onFilesSelected={handleFilesSelected}
            accept="image/png, image/jpeg, image/webp"
            multiple={true}
            maxFiles={100}
            title="Add Images to Resize"
            subtitle="Drag & drop up to 100 images"
          />
        </div>

        {/* Scrollable Image Queue */}
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col bg-black/20">
          <div className="px-4 py-3 border-b border-white/5 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex justify-between items-center">
            <span>Image Queue ({images.length})</span>
            {images.length > 0 && !processing && (
              <button 
                onClick={clearAll}
                className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {images.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm font-medium gap-3">
                <ImageIcon size={32} className="opacity-20" />
                No images queued.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <AnimatePresence>
                  {images.map((img) => (
                    <motion.div 
                      key={img.id} 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }} 
                      className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square flex flex-col items-center justify-center shadow-inner"
                    >
                      {/* Delete Button */}
                      {img.status !== 'done' && !processing && (
                        <button 
                          onClick={() => removeImage(img.id)} 
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg backdrop-blur-sm transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      )}

                      <img 
                        src={img.resultData || img.url} 
                        alt={img.file.name} 
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${img.status === 'done' ? 'opacity-40 grayscale' : 'opacity-80'}`} 
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <div className="absolute bottom-0 left-0 w-full p-2 z-10 flex flex-col">
                        <span className="text-[10px] font-bold text-white truncate drop-shadow-md">{img.file.name}</span>
                        {img.status === 'done' ? (
                          <span className="text-[10px] text-[#10B981] font-mono flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={10} /> Resized
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Pending</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANE: Resize Settings (4 Columns) ── */}
      <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col h-full min-h-0">
        
        <div className="flex items-center gap-2 border-b border-white/5 pb-4 shrink-0">
          <Settings2 size={18} className="text-[#3b82f6]" />
          <h3 className="font-bold text-white">Dimensions & Settings</h3>
        </div>
        
        <div className="space-y-6 mt-6 shrink-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Width (px)</label>
              <input 
                type="number" 
                value={width} 
                onChange={(e) => setWidth(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 font-mono text-sm placeholder:text-slate-600 transition-all"
                placeholder="Auto"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Height (px)</label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 font-mono text-sm placeholder:text-slate-600 transition-all"
                placeholder="Auto"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all">
            <input 
              type="checkbox" 
              checked={maintainRatio} 
              onChange={(e) => setMaintainRatio(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#3b82f6] focus:ring-[#3b82f6]/50 focus:ring-offset-0 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Maintain aspect ratio</span>
              <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                {maintainRatio ? "Prevents stretching. Fits inside dimensions." : "Forces exact dimensions. May stretch image."}
              </span>
            </div>
          </label>
        </div>

        <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-sm my-6 shrink-0 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Pending</span>
            <span className="text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded">{pendingCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Resized</span>
            <span className="text-[#10B981] font-mono bg-[#10B981]/10 px-2 py-0.5 rounded">{doneCount}</span>
          </div>
        </div>

        <div className="mt-auto space-y-3 shrink-0">
          <button 
            onClick={processAll} 
            disabled={processing || pendingCount === 0} 
            className="w-full py-4 bg-[#3b82f6] hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#3b82f6]/20 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {processing ? (
              <span className="animate-pulse flex items-center gap-2">Processing...</span>
            ) : (
              <><Maximize2 size={18} /> Resize Images</>
            )}
          </button>
          
          <button 
            onClick={downloadAll} 
            disabled={processing || doneCount === 0} 
            className="w-full py-4 bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 disabled:opacity-50 disabled:bg-white/5 disabled:border-transparent disabled:text-slate-500 text-[#10B981] font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {doneCount > 1 ? <><Archive size={18} /> Download ZIP Archive</> : <><Download size={18} /> Download Image</>}
          </button>
        </div>
      </div>
      
    </div>
  );
}