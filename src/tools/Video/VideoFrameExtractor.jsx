import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Clock, Settings, Download, Loader2, AlertCircle, X, FileCheck2, Image as ImageIcon } from 'lucide-react';

export default function VideoFrameExtractor() {
  const [videoFile, setVideoFile] = useState(null);

  // Settings State
  const [startTime, setStartTime] = useState("0:0:0");
  const [endTime, setEndTime] = useState("");
  const [interval, setInterval] = useState(1.0);

  // Process State
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.mp4')) {
      setVideoFile(file);
      setError(null);
    } else {
      setError('Invalid file type. Please upload a valid MP4 file.');
    }
  };

  const processVideo = async () => {
    if (!videoFile) {
      setError('Please upload an MP4 video first.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
      formData.append('interval', interval);

      const response = await fetch('http://localhost:8000/api/video-to-frames', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Backend processing failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoFile.name.replace(/\.[^/.]+$/, "")}_frames.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Processing failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl space-y-6">

        {/* Header */}
        <div className="border-b border-white/5 pb-4">
          <h3 className="text-white font-medium flex items-center gap-2 text-lg">
            <ImageIcon size={20} className="text-accent" /> Video to Images
          </h3>
          <p className="text-sm text-slate-400 mt-1">Extract image frames from any video at custom time intervals — no GPS data required.</p>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className={`relative h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${videoFile ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}
        >
          <div className="text-center pointer-events-none flex flex-col items-center justify-center p-4">
            {videoFile ? (
              <>
                <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
                  <FileCheck2 size={24} />
                </div>
                <p className="text-sm font-medium text-emerald-400 truncate max-w-[300px]">{videoFile.name}</p>
              </>
            ) : (
              <>
                <div className="inline-flex p-3 rounded-full bg-white/5 border border-white/10 mb-2 text-slate-400">
                  <Video size={24} />
                </div>
                <p className="text-sm font-medium text-white mb-1">Upload Video</p>
                <p className="text-xs text-slate-500">Drop .mp4 file here</p>
              </>
            )}
          </div>
          <input
            type="file"
            accept=".mp4"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileDrop}
          />
          {videoFile && (
            <button
              onClick={(e) => { e.preventDefault(); setVideoFile(null); }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors z-10"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Settings Panel */}
        <div className="bg-black/20 rounded-xl border border-white/5 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-4 text-slate-300">
            <Settings size={16} />
            <h4 className="text-sm font-medium uppercase tracking-wider">Extraction Settings</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 ml-1">Start Time (h:m:s)</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="0:0:0" className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 ml-1">End Time (Optional)</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="End of video" className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 ml-1">Frame Interval (Secs)</label>
              <input type="number" step="0.1" min="0.1" value={interval} onChange={(e) => setInterval(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={processVideo}
            disabled={processing || !videoFile}
            className={`w-full py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${!videoFile ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-accent hover:bg-blue-600 text-white shadow-lg shadow-accent/20'}`}
          >
            {processing ? (
              <><Loader2 size={18} className="animate-spin" /> Extracting Frames...</>
            ) : (
              <><Download size={18} /> Extract Frames Archive</>
            )}
          </button>
          {processing && <p className="text-[10px] text-slate-500 mt-3 text-center">This process may take a minute depending on video length and resolution.</p>}
        </div>

      </motion.div>
    </div>
  );
}