import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileOutput, Download, Loader2, AlertCircle, X, FileCheck2, UploadCloud, CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react';

const ACCEPT = '.pdf';
const ENDPOINT = 'http://localhost:8000/api/pdf-to-word';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function PdfToWord() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const addFiles = (fileList) => {
    const valid = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (valid.length === 0) {
      setError('Please select valid .pdf files.');
      return;
    }
    setFiles(prev => [...prev, ...valid]);
    setError(null);
  };

  const handleDrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); };
  const handleSelect = (e) => { addFiles(e.target.files); e.target.value = ''; };
  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const convert = async () => {
    if (files.length === 0) { setError('Please add at least one PDF file.'); return; }
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));

      const response = await fetch(ENDPOINT, { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const isZip = blob.type === 'application/zip';
      const filename = isZip ? 'converted_docs.zip' : `${files[0].name.replace(/\.[^/.]+$/, "")}.docx`;
      setResult({ blob, filename, isZip, size: blob.size });
    } catch (err) {
      console.error('Conversion failed:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = window.URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const reset = () => { setFiles([]); setResult(null); setError(null); };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl space-y-6">

        <div className="border-b border-white/5 pb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-white font-medium flex items-center gap-2 text-lg">
              <FileOutput size={20} className="text-accent" /> PDF to Word
            </h3>
            <p className="text-sm text-slate-400 mt-1">Extract and convert PDF content into editable .docx files.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0 pt-1">
            <ShieldCheck size={13} /> Local processing only
          </div>
        </div>

        <div className="bg-amber-500/[0.08] border border-amber-500/20 text-amber-400/90 text-xs px-4 py-3 rounded-xl">
          Text-only extraction — original layout, images, and tables are not preserved.
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {result ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 space-y-5">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <p className="text-white font-medium text-lg">Conversion complete</p>
              <p className="text-sm text-slate-400 mt-1">{result.filename} · {formatBytes(result.size)}</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={downloadResult} className="px-6 py-3 bg-accent hover:bg-blue-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-accent/20 transition-colors">
                <Download size={16} /> Download {result.isZip ? 'ZIP' : 'DOCX'}
              </button>
              <button onClick={reset} className="px-5 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl flex items-center gap-2 transition-colors">
                <RotateCcw size={14} /> Convert More
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/[0.07] flex flex-col items-center justify-center transition-all py-10 px-4"
            >
              <div className="inline-flex p-3 rounded-full bg-white/5 border border-white/10 mb-3 text-slate-400">
                <UploadCloud size={26} />
              </div>
              <label className="relative cursor-pointer px-5 py-2.5 bg-accent hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors mb-2">
                Choose Files
                <input type="file" accept={ACCEPT} multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleSelect} />
              </label>
              <p className="text-xs text-slate-500">...or drop .pdf files here</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileCheck2 size={18} className="text-emerald-400 shrink-0" />
                      <span className="text-sm text-white truncate">{f.name}</span>
                      <span className="text-xs text-slate-500 shrink-0">{formatBytes(f.size)}</span>
                    </div>
                    <button onClick={() => removeFile(idx)} className="p-1.5 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-400 transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={convert}
              disabled={processing || files.length === 0}
              className={`w-full py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${files.length === 0 ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-accent hover:bg-blue-600 text-white shadow-lg shadow-accent/20'}`}
            >
              {processing ? (<><Loader2 size={18} className="animate-spin" /> Converting...</>) : (<>Convert {files.length > 1 ? `${files.length} Files` : 'to Word'}</>)}
            </button>
          </>
        )}

      </motion.div>
    </div>
  );
}