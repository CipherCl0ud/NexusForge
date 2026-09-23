import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, X, Download, FileText, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function DocProtection() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceSize, setSourceSize] = useState(0);
  
  const [mode, setMode] = useState('encrypt'); // 'encrypt' or 'decrypt'
  const [password, setPassword] = useState('');
  
  const [resultUrl, setResultUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Clean up URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      toast.error("Please select a valid PDF document.");
      return;
    }
    
    setSourcePdf(file);
    setSourceName(file.name);
    setSourceSize(file.size);
    setResultUrl(null);
    setPassword('');
  };

  const clearWorkspace = () => {
    setSourcePdf(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setPassword('');
  };

  const processFile = async () => {
    if (!sourcePdf || !password) return;
    
    setIsProcessing(true);
    const toastId = toast.loading(`${mode === 'encrypt' ? 'Encrypting' : 'Decrypting'} document...`);

    try {
      const formData = new FormData();
      formData.append('file', sourcePdf);
      formData.append('password', password);
      formData.append('action', mode);

      const response = await fetch('http://localhost:8000/api/protect-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.clone().json().catch(() => null);
        throw new Error((data && data.error) ? data.error : 'Processing failed');
      }

      const pdfBlob = await response.blob();
      
      if (resultUrl) URL.revokeObjectURL(resultUrl); // Free old memory
      setResultUrl(URL.createObjectURL(pdfBlob));
      
      toast.success(`Document successfully ${mode === 'encrypt' ? 'secured' : 'unlocked'}!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.message === "Incorrect password" 
        ? "Incorrect password. Unable to unlock." 
        : "Operation failed. Check local Python engine.", { id: toastId });
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
    toast.success("Document downloaded!");
  };

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Controls (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {!sourcePdf ? (
          <div className="flex-1 flex flex-col h-full">
            <UploadZone 
              onFilesSelected={handleFilesSelected}
              accept=".pdf, application/pdf"
              multiple={false}
              title="Protect or Unlock PDF"
              subtitle="Drop a PDF to encrypt or decrypt locally"
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 rounded-2xl flex flex-col h-full overflow-hidden">
            
            <div className="border-b border-white/5 pb-4 mb-6 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-400" /> Security Settings
              </h3>
              <button 
                onClick={clearWorkspace} 
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear Workspace"
              >
                <X size={16} />
              </button>
            </div>

            {/* File Info Card */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center gap-4 mb-6 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{sourceName}</p>
                <p className="text-xs text-slate-500">{formatBytes(sourceSize)}</p>
              </div>
            </div>

            {/* Operation Toggle & Password Input */}
            <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-6 flex flex-col justify-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="z-10 relative">
                <div className="flex bg-black/40 p-1 rounded-xl mb-8 border border-white/5">
                  <button 
                    onClick={() => { setMode('encrypt'); setResultUrl(null); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'encrypt' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    <Lock size={16} /> Encrypt
                  </button>
                  <button 
                    onClick={() => { setMode('decrypt'); setResultUrl(null); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'decrypt' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    <Unlock size={16} /> Decrypt
                  </button>
                </div>

                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block text-center">
                  {mode === 'encrypt' ? 'Set Target Password' : 'Enter Decryption Password'}
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <KeyRound size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className={`w-full bg-black/40 border rounded-xl pl-11 pr-4 py-4 text-center text-lg font-mono text-white placeholder:text-slate-600 focus:outline-none transition-all shadow-inner border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50`}
                  />
                </div>
                
                <p className="text-[11px] text-slate-500 text-center leading-relaxed mt-4">
                  {mode === 'encrypt' ? 'This password will be required to open the document. Do not lose it.' : 'Enter the password currently protecting this file.'}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-6 shrink-0">
              {!resultUrl ? (
                <button 
                  onClick={processFile} 
                  disabled={isProcessing || !password} 
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing Engine...</>
                  ) : (
                    <>{mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />} {mode === 'encrypt' ? 'Lock Document' : 'Unlock Document'}</>
                  )}
                </button>
              ) : (
                <button 
                  onClick={clearWorkspace} 
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> Process Another Document
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── RIGHT PANE: Output Inspector (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col justify-center items-center text-center p-10 bg-black/20">
        
        <div className="absolute top-0 left-0 w-full bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center z-20">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            {resultUrl ? (
              <><ShieldCheck size={16} className="text-[#10B981]"/> Operation Successful</>
            ) : (
              <><Lock size={16} className="text-indigo-400"/> Security Inspector</>
            )}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-md">
            <ShieldCheck size={12} className="text-indigo-400" /> AES-256 Local Engine
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full mt-14">
          <AnimatePresence mode="wait">
            {!resultUrl ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <Lock size={48} className="text-slate-700 mb-4" />
                <h4 className="text-white font-medium mb-2">Military-Grade Security</h4>
                <p className="text-sm text-slate-500 max-w-sm">Files are processed entirely on your local machine using rigorous AES-256 encryption. Nothing is uploaded to a remote server.</p>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full max-w-lg">
                <div className="w-24 h-24 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-[#10B981]/20">
                  <ShieldCheck size={48} />
                </div>
                
                <h4 className="text-3xl font-black text-white mb-2 tracking-tight">Security Applied</h4>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  {mode === 'encrypt' 
                    ? 'Your document has been heavily encrypted. Do not lose the password; it cannot be recovered.' 
                    : 'The encryption layer has been successfully stripped from this file.'}
                </p>

                <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-500 text-sm font-medium">Output File</span>
                    <span className="text-white font-mono text-sm truncate max-w-[200px]">{mode === 'encrypt' ? 'Locked' : 'Unlocked'}_{sourceName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium">Protection Status</span>
                    <span className={`font-bold text-sm px-2 py-0.5 rounded border ${mode === 'encrypt' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {mode === 'encrypt' ? 'AES-256 Encrypted' : 'Unrestricted'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={downloadPdf} 
                  className="px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 w-full md:w-auto"
                >
                  <Download size={20} /> Download {mode === 'encrypt' ? 'Secured' : 'Unlocked'} PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}