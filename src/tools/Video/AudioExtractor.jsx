import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, UploadCloud, Loader2, CheckCircle, Download, RotateCcw, X, ShieldCheck, Volume2 } from 'lucide-react';

export default function AudioExtractor() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
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
      setError('Please upload a valid video file.');
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      const response = await fetch('http://localhost:8000/api/audio-extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Audio extraction failed. Verify video contains an audio track.');
      }

      const blob = await response.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(file.name.replace(/\.[^/.]+$/, '') + `.${format}`);
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
            <Music size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Audio Extractor</h2>
          <p className="text-slate-400">Extract high-quality audio tracks directly from video clips.</p>
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
                  <p className="text-white font-medium mb-1">Drag & drop video here</p>
                  <p className="text-sm text-slate-500 mb-6">Extracts MP3 or WAV from any video format</p>
                  <button className="bg-accent hover:bg-pink-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors pointer-events-none">
                    Choose Video
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Card */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Music size={20} className="text-pink-400 shrink-0" />
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

                  {/* Format Selector */}
                  <div className="p-5 bg-black/20 rounded-xl border border-white/5">
                    <label className="text-xs text-slate-400 font-medium block mb-3">Output Audio Format</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormat('mp3')}
                        className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                          format === 'mp3'
                            ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        MP3 (Universal & Compressed)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat('wav')}
                        className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                          format === 'wav'
                            ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        WAV (Lossless Studio Quality)
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleExtract}
                    disabled={processing}
                    className="w-full bg-pink-600 hover:bg-pink-500 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-pink-600/20"
                  >
                    {processing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Demuxing Audio...
                      </>
                    ) : (
                      'Extract Audio Track'
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
              className="bg-black/20 rounded-xl border border-white/5 p-8 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Audio Extracted Successfully!</h3>
              <p className="text-sm text-slate-400 mb-6">{resultFilename} • {resultSize}</p>

              {/* In-Browser Audio Player */}
              <div className="w-full max-w-md bg-white/5 p-4 rounded-2xl border border-white/10 mb-8 flex items-center gap-3">
                <Volume2 size={24} className="text-pink-400 shrink-0" />
                <audio controls className="w-full h-8" src={resultUrl}>
                  Your browser does not support audio playback.
                </audio>
              </div>

              <div className="flex gap-4 w-full max-w-sm">
                <a
                  href={resultUrl}
                  download={resultFilename}
                  className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-pink-600/20"
                >
                  <Download size={18} /> Download
                </a>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <RotateCcw size={18} /> Extract More
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