import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Map, Clock, Settings, Download, Loader2, AlertCircle, X, FileCheck2 } from 'lucide-react';

export default function VideoGpxProcessor() {
  const [videoFile, setVideoFile] = useState(null);
  const [gpxFile, setGpxFile] = useState(null);
  
  // Settings State
  const [startTime, setStartTime] = useState("0:0:0");
  const [endTime, setEndTime] = useState("");
  const [interval, setInterval] = useState(1.0);
  const [gpxCorrection, setGpxCorrection] = useState(false);
  
  // Process State
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileDrop = (e, type) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (!file) return;

    if (type === 'video' && file.name.toLowerCase().endsWith('.mp4')) {
      setVideoFile(file);
      setError(null);
    } else if (type === 'gpx' && file.name.toLowerCase().endsWith('.gpx')) {
      setGpxFile(file);
      setError(null);
    } else {
      setError(`Invalid file type. Please upload a valid ${type.toUpperCase()} file.`);
    }
  };

  const processVideo = async () => {
    if (!videoFile || !gpxFile) {
      setError("Please upload both an MP4 video and a GPX file.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('gpx', gpxFile);
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
      formData.append('interval', interval);
      formData.append('gpx_correction', gpxCorrection ? 'true' : 'false');

      const response = await fetch('http://localhost:8000/api/video-to-gpx-frames', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Backend processing failed');
      }

      // Handle the ZIP file download
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

  const FileDropzone = ({ type, file, icon: Icon, title, accept }) => (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleFileDrop(e, type)}
      className={`relative h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${file ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}
    >
      <div className="text-center pointer-events-none flex flex-col items-center justify-center p-4">
        {file ? (
          <>
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
              <FileCheck2 size={24} />
            </div>
            <p className="text-sm font-medium text-emerald-400 truncate max-w-[200px]">{file.name}</p>
          </>
        ) : (
          <>
            <div className="inline-flex p-3 rounded-full bg-white/5 border border-white/10 mb-2 text-slate-400">
              <Icon size={24} />
            </div>
            <p className="text-sm font-medium text-white mb-1">{title}</p>
            <p className="text-xs text-slate-500">Drop {accept} file here</p>
          </>
        )}
      </div>
      <input 
        type="file" 
        accept={accept} 
        className="absolute inset-0 opacity-0 cursor-pointer" 
        onChange={(e) => handleFileDrop(e, type)} 
      />
      {file && (
        <button 
          onClick={(e) => { e.preventDefault(); type === 'video' ? setVideoFile(null) : setGpxFile(null); }}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors z-10"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl space-y-6">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-4">
          <h3 className="text-white font-medium flex items-center gap-2 text-lg">
            <Map size={20} className="text-accent"/> Video to GPX Frames Mapping
          </h3>
          <p className="text-sm text-slate-400 mt-1">Extract specific frames from an MP4 video and map them to GPS coordinates using a GPX track.</p>
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

        {/* Dual Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileDropzone type="video" file={videoFile} icon={Video} title="Upload Video" accept=".mp4" />
          <FileDropzone type="gpx" file={gpxFile} icon={Map} title="Upload GPX Track" accept=".gpx" />
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

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" checked={gpxCorrection} onChange={(e) => setGpxCorrection(e.target.checked)} className="peer sr-only" />
                <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Apply GPX Coordinate Averaging / Smoothing</span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button 
            onClick={processVideo} 
            disabled={processing || !videoFile || !gpxFile} 
            className={`w-full py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${(!videoFile || !gpxFile) ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-accent hover:bg-blue-600 text-white shadow-lg shadow-accent/20'}`}
          >
            {processing ? (
              <><Loader2 size={18} className="animate-spin" /> Processing & Zipping Frames...</>
            ) : (
              <><Download size={18} /> Extract Frames & GeoJSON Archive</>
            )}
          </button>
          {processing && <p className="text-[10px] text-slate-500 mt-3 text-center">This process may take a minute depending on the video length and resolution.</p>}
        </div>

      </motion.div>
    </div>
  );
}