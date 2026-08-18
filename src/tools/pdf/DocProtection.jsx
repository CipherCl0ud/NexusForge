import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, X, Download, FileText, Loader2, FileUp, ShieldCheck } from 'lucide-react';

export default function DocProtection() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  
  const [mode, setMode] = useState('encrypt'); // 'encrypt' or 'decrypt'
  const [password, setPassword] = useState('');
  
  const [resultUrl, setResultUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setSourcePdf(file);
    setSourceName(file.name);
    setResultUrl(null);
    setError(null);
  };

  const processFile = async () => {
    if (!sourcePdf || !password) return;
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', sourcePdf);
      formData.append('password', password);
      formData.append('action', mode);

      const response = await fetch('http://localhost:8000/api/protect-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.clone().json().catch(() => null);
      if (data && data.error) throw new Error(data.error);

      if (!response.ok) throw new Error('Processing failed');

      const pdfBlob = await response.blob();
      setResultUrl(URL.createObjectURL(pdfBlob));
    } catch (err) {
      setError(err.message === "Incorrect password" ? "Incorrect password. Unable to unlock." : "Processing failed. Check Python engine.");
      setResultUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${mode === 'encrypt' ? 'Locked' : 'Unlocked'}_${sourceName}`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      <div className="lg:col-span-5 flex flex-col gap-4 h-full">
        {!sourcePdf ? (
          <div className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-10 cursor-pointer shrink-0 h-full">
            <FileUp size={32} className="text-indigo-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Upload PDF</h3>
            <p className="text-xs text-slate-500 text-center">Select a document to secure or unlock</p>
            <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-indigo-500/20 bg-indigo-500/5 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={20} className="text-indigo-400 shrink-0" />
                <p className="text-sm font-medium text-white truncate max-w-[200px]">{sourceName}</p>
              </div>
              <button onClick={() => { setSourcePdf(null); setResultUrl(null); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"><X size={16}/></button>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                <button onClick={() => { setMode('encrypt'); setResultUrl(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'encrypt' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Lock size={16} /> Encrypt
                </button>
                <button onClick={() => { setMode('decrypt'); setResultUrl(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'decrypt' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Unlock size={16} /> Decrypt
                </button>
              </div>

              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                {mode === 'encrypt' ? 'Set Encryption Password' : 'Enter File Password'}
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors mb-4" />
              
              {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg text-center border border-red-500/20">{error}</p>}
            </div>

            {!resultUrl ? (
              <button onClick={processFile} disabled={isProcessing || !password} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
                {isProcessing ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <>{mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />} {mode === 'encrypt' ? 'Lock File' : 'Unlock File'}</>}
              </button>
            ) : (
              <button onClick={downloadPdf} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
                <Download size={18} /> Save {mode === 'encrypt' ? 'Secured' : 'Unlocked'} PDF
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col justify-center items-center text-center p-10">
        {!resultUrl ? (
          <>
            <Lock size={48} className="text-slate-700 mb-4" />
            <h4 className="text-white font-medium mb-2">Military-Grade Security</h4>
            <p className="text-sm text-slate-400">Files are processed entirely on your local machine using AES-256 encryption logic.</p>
          </>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
            <ShieldCheck size={64} className="text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            <h4 className="text-white font-bold text-xl mb-2">Operation Successful</h4>
            <p className="text-sm text-slate-400 max-w-sm">
              {mode === 'encrypt' ? 'Your document is now heavily encrypted. Do not lose the password.' : 'The encryption layer has been successfully stripped from this file.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}