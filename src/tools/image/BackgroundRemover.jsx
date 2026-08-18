import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImagePlus, X, Loader2, Sparkles, Archive } from 'lucide-react';
import JSZip from 'jszip';

export default function BackgroundRemover() {
  const [images, setImages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    const valid = [...files].filter(f => f.type.startsWith('image/'));
    
    // INCREASED LIMIT TO 50
    if (images.length + valid.length > 50) {
      alert("NexusForge limits bulk background removal to 50 images at a time to ensure optimal ZIP bundling performance.");
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
      } catch (error) {
        console.error("Removal failed for", images[i].file.name, error);
        setImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, status: 'error' } : img
        ));
      }
    }

    setProcessing(false);
    setProgressText('');
  };

  const downloadZip = async () => {
    const completed = images.filter(img => img.status === 'done');
    if (completed.length === 0) return;

    setProgressText('Bundling ZIP file...');
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
    setProgressText('');
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            className={`relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
              ${images.length > 0 ? 'h-32' : 'h-64'} 
              ${isDragging ? 'border-accent bg-accent/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}
          >
            <div className="text-center pointer-events-none flex flex-col items-center justify-center h-full">
              {images.length === 0 && (
                <div className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 text-accent">
                  <ImagePlus size={32} />
                </div>
              )}
              <h3 className={`${images.length > 0 ? 'text-base' : 'text-lg'} font-semibold text-white mb-1`}>
                {images.length > 0 ? 'Drop more images' : 'Drop images to strip backgrounds'}
              </h3>
              <p className="text-sm text-slate-500">Max 50 images. Powered by local Python vision engine.</p>
            </div>
            <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFiles(e.target.files)} />
          </div>

          <div className="glass-panel p-4 rounded-2xl min-h-[200px] max-h-[500px] overflow-y-auto">
            {images.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2 mt-12">
                No images queued.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <AnimatePresence>
                  {images.map((img) => (
                    <motion.div key={img.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square flex items-center justify-center">
                      
                      {img.status !== 'processing' && (
                        <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-sm transition-all z-10 opacity-0 group-hover:opacity-100">
                          <X size={14} />
                        </button>
                      )}

                      {img.status === 'done' && (
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIgLz4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZWVlIiAvPgo8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2VlZSIgLz4KPC9zdmc+')] opacity-20 pointer-events-none" />
                      )}

                      <img 
                        src={img.resultUrl || img.url} 
                        alt={img.file.name} 
                        className={`max-w-full max-h-full object-contain p-2 relative z-0 transition-all ${img.status === 'processing' ? 'opacity-30 blur-sm' : ''}`} 
                      />

                      {img.status === 'processing' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={24} className="text-accent animate-spin" />
                        </div>
                      )}

                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center text-red-400 font-medium text-xs backdrop-blur-sm">
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

        <div className="glass-panel p-6 rounded-2xl space-y-6 h-fit">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-medium text-white flex items-center gap-2"><Sparkles size={18} className="text-accent" /> Batch Processing</h3>
            <p className="text-xs text-slate-500 mt-1">{images.length} / 50 Images Queued</p>
          </div>

          <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Status</span>
              <span className={processing ? 'text-accent animate-pulse' : 'text-slate-300'}>
                {processing ? 'Running AI Engine...' : 'Idle'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Completed</span>
              <span className="text-emerald-400 font-mono">
                {images.filter(i => i.status === 'done').length}
              </span>
            </div>
            
            {progressText && (
              <p className="text-[10px] text-accent mt-4 text-center bg-accent/10 py-1.5 rounded-lg border border-accent/20">
                {progressText}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button 
              onClick={processAll} 
              disabled={processing || images.filter(i => i.status === 'pending').length === 0} 
              className="w-full py-3.5 bg-accent hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {processing ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Sparkles size={16} /> Isolate Subjects</>}
            </button>

            <button 
              onClick={downloadZip} 
              disabled={processing || images.filter(i => i.status === 'done').length === 0} 
              className="w-full py-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 disabled:opacity-50 text-emerald-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Archive size={16} /> Download ZIP Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}