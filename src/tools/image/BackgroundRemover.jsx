import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Loader2, Sparkles, Archive, Trash2 } from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

export default function BackgroundRemover() {
  const [images, setImages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  const handleFiles = (files) => {
    const valid = [...files].filter(f => f.type.startsWith('image/'));
    
    if (images.length + valid.length > 50) {
      toast.error("Limit reached: NexusForge processes up to 50 images per batch to ensure optimal local performance.");
      valid.splice(50 - images.length); 
    }

    const newImages = valid.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      url: URL.createObjectURL(f),
      status: 'pending', // pending, processing, done, error
      resultBlob: null,
      resultUrl: null
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const processAll = async () => {
    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    // Process sequentially to keep memory usage stable on the local Python server
    for (let i = 0; i < images.length; i++) {
      if (images[i].status !== 'pending') continue;

      setImages(prev => prev.map((img, idx) => idx === i ? { ...img, status: 'processing' } : img));
      setProgressText(`Extracting subject ${i + 1} of ${images.length}...`);

      try {
        const formData = new FormData();
        formData.append('file', images[i].file);

        const response = await fetch('http://localhost:8000/api/remove-bg', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Backend processing failed');

        const imageBlob = await response.blob();
        const url = URL.createObjectURL(imageBlob);
        
        setImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, status: 'done', resultBlob: imageBlob, resultUrl: url } : img
        ));
        successCount++;
      } catch (error) {
        console.error("Removal failed for", images[i].file.name, error);
        setImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, status: 'error' } : img
        ));
        errorCount++;
      }
    }

    setProcessing(false);
    setProgressText('');
    
    if (successCount > 0) toast.success(`Successfully isolated ${successCount} subjects.`);
    if (errorCount > 0) toast.error(`Failed to process ${errorCount} images.`);
  };

  const downloadZip = async () => {
    const completed = images.filter(img => img.status === 'done');
    if (completed.length === 0) return;

    const toastId = toast.loading('Bundling ZIP archive...');
    setProgressText('Bundling ZIP file...');
    
    try {
      const zip = new JSZip();
      completed.forEach((img) => {
        const safeName = img.file.name.replace(/\.[^/.]+$/, ""); 
        zip.file(`${safeName}-nobg.png`, img.resultBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexusforge-transparent-assets.zip`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Archive downloaded!', { id: toastId });
    } catch (error) {
      toast.error('Failed to generate ZIP archive.', { id: toastId });
    } finally {
      setProgressText('');
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
    setProgressText('');
  };

  const pendingCount = images.filter(i => i.status === 'pending').length;
  const doneCount = images.filter(i => i.status === 'done').length;

  return (
    // ── RESPONSIVE IDE LAYOUT (8/4 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Upload & Image Grid (8 Columns) ── */}
      <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
        
        {/* Compact Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-6 cursor-pointer shrink-0"
        >
          <ImagePlus size={24} className="text-[#3b82f6] mb-2" />
          <p className="text-sm font-medium text-white">Add Images (Max 50)</p>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => handleFiles(e.target.files)} 
          />
        </div>

        {/* Scrollable Image Grid */}
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
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {images.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm font-medium gap-3">
                <Sparkles size={32} className="opacity-20" />
                No images queued.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {images.map((img) => (
                    <motion.div 
                      key={img.id} 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }} 
                      className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square flex items-center justify-center shadow-inner"
                    >
                      {/* Delete Button (Hidden during processing) */}
                      {img.status !== 'processing' && !processing && (
                        <button 
                          onClick={() => removeImage(img.id)} 
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg backdrop-blur-sm transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      )}

                      {/* Transparent Checkerboard for completed images */}
                      {img.status === 'done' && (
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIgLz4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZWVlIiAvPgo8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2VlZSIgLz4KPC9zdmc+')] opacity-[0.15] pointer-events-none" />
                      )}

                      <img 
                        src={img.resultUrl || img.url} 
                        alt={img.file.name} 
                        className={`max-w-full max-h-full object-contain p-2 relative z-10 transition-all duration-300 ${img.status === 'processing' ? 'opacity-30 blur-sm scale-95' : 'scale-100'}`} 
                      />

                      {/* Loading Spinner */}
                      {img.status === 'processing' && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <Loader2 size={24} className="text-[#3b82f6] animate-spin drop-shadow-md" />
                        </div>
                      )}

                      {/* Error State */}
                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center text-red-400 font-medium text-xs backdrop-blur-sm z-20">
                          <X size={20} className="mb-1" />
                          Failed
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANE: Control Panel (4 Columns) ── */}
      <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col h-full min-h-0">
        <div className="border-b border-white/5 pb-4 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-[#3b82f6]" /> AI Batch Engine
          </h3>
          <p className="text-sm text-slate-500 mt-1">{images.length} / 50 Limit Reached</p>
        </div>

        <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-sm my-6 shrink-0 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Status</span>
            <span className={`font-bold ${processing ? 'text-[#3b82f6] animate-pulse' : 'text-slate-300'}`}>
              {processing ? 'Processing locally...' : 'Idle'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Pending</span>
            <span className="text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded">{pendingCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Completed</span>
            <span className="text-[#10B981] font-mono bg-[#10B981]/10 px-2 py-0.5 rounded">{doneCount}</span>
          </div>
          
          {progressText && (
            <div className="pt-3 mt-3 border-t border-white/5">
              <p className="text-xs text-[#3b82f6] text-center font-medium">
                {progressText}
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-3 shrink-0">
          <button 
            onClick={processAll} 
            disabled={processing || pendingCount === 0} 
            className="w-full py-4 bg-[#3b82f6] hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#3b82f6]/20 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {processing ? (
              <><Loader2 size={18} className="animate-spin" /> Isolating Subjects...</>
            ) : (
              <><Sparkles size={18} /> Start Processing</>
            )}
          </button>

          <button 
            onClick={downloadZip} 
            disabled={processing || doneCount === 0} 
            className="w-full py-4 bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 disabled:opacity-50 disabled:bg-white/5 disabled:border-transparent disabled:text-slate-500 text-[#10B981] font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Archive size={18} /> Download ZIP Archive
          </button>
        </div>
      </div>
      
    </div>
  );
}