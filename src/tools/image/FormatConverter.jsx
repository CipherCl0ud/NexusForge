import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, RefreshCw, X, ImageIcon } from 'lucide-react';

const FORMATS = [
  { id: 'image/png',  label: 'PNG',  ext: 'png',  lossy: false, note: 'Lossless · best for graphics' },
  { id: 'image/jpeg', label: 'JPG',  ext: 'jpg',  lossy: true,  note: 'Lossy · best for photos'     },
  { id: 'image/webp', label: 'WebP', ext: 'webp', lossy: true,  note: 'Lossy · best for web'        },
  { id: 'image/avif', label: 'AVIF', ext: 'avif', lossy: true,  note: 'Lossy · next-gen compression' },
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
  const [isDragging,    setIsDragging]    = useState(false);
  const [result,        setResult]        = useState(null);
  const [converting,    setConverting]    = useState(false);
  const [originalSize,  setOriginalSize]  = useState(0);
  const [convertedSize, setConvertedSize] = useState(0);
  const [imgDimensions, setImgDimensions] = useState(null);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return;
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setFile(null); setPreview(null);
    setResult(null); setConvertedSize(0); setImgDimensions(null);
  };

  const convert = async () => {
    if (!preview) return;
    setConverting(true);
    await new Promise(r => setTimeout(r, 60)); // let spinner render

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // JPG doesn't support transparency — fill white
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
        // AVIF may not be supported — fall back to WebP
        dataUrl = canvas.toDataURL('image/webp', quality);
      }

      const bytes = Math.ceil((dataUrl.split(',')[1].length * 3) / 4);
      setConvertedSize(bytes);
      setResult(dataUrl);
      setConverting(false);
    };
    img.src = preview;
  };

  const download = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `${file.name.replace(/\.[^.]+$/, '')}.${outputFormat.ext}`;
    a.click();
  };

  const savings = originalSize && convertedSize
    ? Math.round((1 - convertedSize / originalSize) * 100)
    : null;

  return (
    <div className="space-y-5">

      {/* ── Upload zone (shown when no file) ── */}
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative h-64 rounded-2xl border-2 border-dashed flex flex-col items-center
              justify-center transition-all overflow-hidden cursor-pointer
              ${isDragging
                ? 'border-accent bg-accent/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]'
                : 'border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/20'}`}
          >
            <div className="text-center z-10 pointer-events-none">
              <div className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 text-accent">
                <Upload size={32} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Drop your image here</h3>
              <p className="text-sm text-slate-500">PNG · JPG · WebP · AVIF · GIF · BMP</p>
            </div>
            <input
              type="file" accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </motion.div>
        ) : (

          /* ── Preview panes (shown after file selected) ── */
          <motion.div
            key="previews"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            {/* Original */}
            <div className="glass-panel p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Original</span>
                <button onClick={reset} className="text-slate-500 hover:text-white transition-colors p-1">
                  <X size={14} />
                </button>
              </div>
              <img
                src={preview} alt="original"
                className="w-full h-44 object-contain rounded-xl bg-white/5"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span className="truncate max-w-[60%]">{file.name}</span>
                <span>{formatBytes(originalSize)}</span>
              </div>
              {imgDimensions && (
                <p className="text-[10px] text-slate-600 mt-0.5">
                  {imgDimensions.w} × {imgDimensions.h} px
                </p>
              )}
            </div>

            {/* Output */}
            <div className="glass-panel p-4 rounded-2xl">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-3">
                Output · {outputFormat.label}
              </span>
              {result ? (
                <>
                  <img
                    src={result} alt="converted"
                    className="w-full h-44 object-contain rounded-xl bg-white/5"
                  />
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-slate-500">{formatBytes(convertedSize)}</span>
                    {savings !== null && (
                      <span className={savings >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {savings >= 0 ? `↓ ${savings}% smaller` : `↑ ${Math.abs(savings)}% larger`}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-44 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2">
                  <ImageIcon size={28} className="text-slate-700" />
                  <p className="text-xs text-slate-600">Press Convert to preview</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls panel (visible once file loaded) ── */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass-panel p-6 rounded-2xl space-y-6"
          >

            {/* Format selector */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-3">Output Format</p>
              <div className="grid grid-cols-4 gap-2">
                {FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => { setOutputFormat(fmt); setResult(null); }}
                    className={`p-3 rounded-xl text-left border transition-all
                      ${outputFormat.id === fmt.id
                        ? 'bg-accent/15 border-accent/40 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}
                  >
                    <p className="text-sm font-semibold mb-0.5">{fmt.label}</p>
                    <p className="text-[10px] leading-tight opacity-60">{fmt.note}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality slider — only for lossy formats */}
            {outputFormat.lossy && (
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium text-slate-300">Quality</p>
                  <span className="text-sm text-accent font-mono">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range" min="0.1" max="1" step="0.05"
                  value={quality}
                  onChange={(e) => { setQuality(parseFloat(e.target.value)); setResult(null); }}
                  className="w-full accent-blue-500 h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1.5">
                  <span>Smallest file</span>
                  <span>Best quality</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={convert}
                disabled={converting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent
                  hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                  text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent/20"
              >
                <RefreshCw size={16} className={converting ? 'animate-spin' : ''} />
                {converting ? 'Converting…' : `Convert to ${outputFormat.label}`}
              </button>

              {result && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={download}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500/15
                    hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400
                    font-semibold rounded-xl transition-all"
                >
                  <Download size={16} />
                  Download
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}