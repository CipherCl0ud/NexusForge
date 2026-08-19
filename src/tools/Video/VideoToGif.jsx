import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, UploadCloud, Loader2, CheckCircle, Download, RotateCcw, X, ShieldCheck, Settings } from 'lucide-react';

export default function VideoToGif() {
  const [file, setFile] = useState(null);
  const [fps, setFps] = useState(12);
  const [width, setWidth] = useState(480);
  const [speed, setSpeed] = useState(1.0);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultFilename, setResultFilename] = useState('');
  const [resultSize, setResultSize] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = (e.target.files || e.dataTransfer.files)[0];
    if (selected && selected.type.startsWith('video/')) {
      setFile(selected);
      setError(null);
    } else {
      setError('Please upload a valid video file (.mp4, .mov, .webm, etc.).');
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fps', fps);
      formData.append('width', width);
      formData.append('speed', speed);

      const response = await fetch('http://localhost:8000/api/video-to-gif', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to convert video to GIF');
      }

      const blob = await response.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(file.name.replace(/\.[^/.]+$/, '') + '.gif');
      setResultSize((blob.size / (1024 * 1024)).toFixed(2) + ' MB');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultUrl(null);
    setResultFilename('');
    setResultSize('');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden bg-slate-900/60 border border-white/10 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-pink-500/10 text-pink-400 rounded-2xl mb-4">
            <Play size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Video to GIF</h2>
          <p className="text-slate-400">Convert video clips into lightweight, looping animated GIFs.</p>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs font-medium text-emerald-400/80 bg-emerald-400/10 w-fit mx-auto px-3 py-1 rounded-full border border-emerald-400/20">
            <ShieldCheck size={14} /> Local processing only — zero uploads
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!resultUrl ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileSelect(e); }}
                  className="border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/[0.07] rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <UploadCloud size={40} className="text-slate-400 mb-4" />
                  <p className="text-white font-medium mb-1">Drag & drop video clip here</p>
                  <p className="text-sm text-slate-500 mb-6">Supports MP4, MOV, WEBM, MKV</p>
                  <button className="bg-accent hover:bg-pink-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors pointer-events-none">
                    Choose Video
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected File Card */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Play size={20} className="text-pink-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-black/20 rounded-xl border border-white/5">
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-2">Frame Rate (FPS): {fps}</label>
                      <input
                        type="range"
                        min="5"
                        max="24"
                        value={fps}
                        onChange={(e) => setFps(Number(e.target.value))}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-2">Max Width: {width}px</label>
                      <select
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-white/10 text-white text-sm rounded-lg p-2 focus:outline-none"
                      >
                        <option value={320}>320px (Compact)</option>
                        <option value={480}>480px (Standard)</option>
                        <option value={640}>640px (High Res)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-2">Speed: {speed}x</label>
                      <select
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-white/10 text-white text-sm rounded-lg p-2 focus:outline-none"
                      >
                        <option value={0.5}>0.5x (Slow Motion)</option>
                        <option value={1.0}>1.0x (Normal)</option>
                        <option value={1.5}>1.5x (Fast)</option>
                        <option value={2.0}>2.0x (Hyperlapse)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleConvert}
                    disabled={processing}
                    className="w-full bg-pink-600 hover:bg-pink-500 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-pink-600/20"
                  >
                    {processing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Generating GIF...
                      </>
                    ) : (
                      'Convert to GIF'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            /* Results Screen */
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/20 rounded-xl border border-white/5 p-6 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">GIF Generated!</h3>
              <p className="text-xs text-slate-400 mb-5">{resultFilename} • {resultSize}</p>

              {/* Live Preview */}
              <div className="max-h-72 rounded-xl overflow-hidden border border-white/10 mb-6 bg-black/40">
                <img src={resultUrl} alt="Generated GIF" className="object-contain max-h-72 w-auto" />
              </div>

              <div className="flex gap-4 w-full max-w-sm">
                <a
                  href={resultUrl}
                  download={resultFilename}
                  className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-pink-600/20"
                >
                  <Download size={18} /> Download GIF
                </a>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <RotateCcw size={18} /> Convert Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}