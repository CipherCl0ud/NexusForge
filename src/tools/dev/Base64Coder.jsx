import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ArrowLeftRight, Upload, Download, Hash, AlertCircle } from 'lucide-react';

const MODES = ['Text', 'File'];

function safeEncode(str) {
  try   { return { result: btoa(unescape(encodeURIComponent(str))), error: null }; }
  catch { return { result: '',  error: 'Could not encode — check for invalid characters.' }; }
}

function safeDecode(str) {
  try   { return { result: decodeURIComponent(escape(atob(str.replace(/\s/g, '')))), error: null }; }
  catch { return { result: '', error: 'Invalid Base64 — string may be malformed or not UTF-8.' }; }
}

export default function Base64Coder() {
  const [mode,        setMode]        = useState('Text');
  const [direction,   setDirection]   = useState('encode');   // 'encode' | 'decode'
  const [input,       setInput]       = useState('');
  const [fileResult,  setFileResult]  = useState(null);  // { name, b64, mime }
  const [copied,      setCopied]      = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // Text mode
  const { result: textResult, error: textError } =
    mode === 'Text' && input
      ? direction === 'encode' ? safeEncode(input) : safeDecode(input)
      : { result: '', error: null };

  // File encode
  const handleFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const b64     = dataUrl.split(',')[1];
      setFileResult({ name: f.name, b64, mime: f.type, size: f.size });
    };
    reader.readAsDataURL(f);
  };

  // Decode base64 back to file
  const downloadDecoded = () => {
    if (!textResult || textError) return;
    // heuristically detect if result is binary-ish — just download as blob
    try {
      const blob = new Blob([textResult]);
      const url  = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: 'decoded-output' }).click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const swapDirection = () => {
    setDirection(d => d === 'encode' ? 'decode' : 'encode');
    setInput(textResult || '');
  };

  return (
    <div className="space-y-4">

      {/* Mode + direction selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
          {MODES.map(m => (
            <button key={m} onClick={() => { setMode(m); setInput(''); setFileResult(null); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all
                ${mode === m ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {m}
            </button>
          ))}
        </div>

        {mode === 'Text' && (
          <button onClick={swapDirection}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white
              transition-all px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
            <ArrowLeftRight size={13}/>
            {direction === 'encode' ? 'Encoding' : 'Decoding'}
          </button>
        )}
      </div>

      {/* TEXT MODE */}
      {mode === 'Text' && (
        <div className="grid grid-cols-2 gap-4 h-96">

          {/* Input */}
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                {direction === 'encode' ? 'Plain Text' : 'Base64 String'}
              </span>
              {input && (
                <span className="text-[10px] text-slate-600 font-mono">{input.length} chars</span>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={direction === 'encode'
                ? 'Type or paste any text…'
                : 'Paste a Base64 string to decode…'}
              spellCheck={false}
              className="flex-1 bg-transparent resize-none font-mono text-xs text-slate-300
                placeholder:text-slate-700 p-4 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Output */}
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                {direction === 'encode' ? 'Base64 Output' : 'Decoded Text'}
              </span>
              {textResult && !textError && (
                <button onClick={() => copy(textResult, 'text')}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white
                    transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
                  {copied === 'text'
                    ? <><Check size={10} className="text-emerald-400"/>Copied!</>
                    : <><Copy size={10}/>Copy</>}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {textError ? (
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>
                  <p className="text-xs">{textError}</p>
                </div>
              ) : textResult ? (
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                  {textResult}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Hash size={28} className="text-slate-700"/>
                  <p className="text-xs text-slate-600">Output appears here</p>
                </div>
              )}
            </div>
            {textResult && !textError && direction === 'encode' && (
              <div className="p-3 border-t border-white/5 flex-shrink-0">
                <button onClick={swapDirection}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors
                    py-1.5 hover:bg-white/5 rounded-lg">
                  Use output as decode input →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILE MODE */}
      {mode === 'File' && (
        <div className="space-y-4">
          <div
            className="relative h-44 rounded-2xl border-2 border-dashed border-white/10
              bg-white/5 hover:bg-white/[0.07] hover:border-white/20 flex flex-col items-center
              justify-center cursor-pointer transition-all overflow-hidden"
          >
            <div className="text-center pointer-events-none">
              <div className="inline-flex p-3 rounded-xl bg-white/5 border border-white/10 mb-3 text-accent">
                <Upload size={24}/>
              </div>
              <p className="text-white font-medium mb-1">Drop any file to encode</p>
              <p className="text-xs text-slate-500">Images, PDFs, ZIPs — any file type</p>
            </div>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          <AnimatePresence>
            {fileResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-5 rounded-2xl space-y-4">

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-white font-medium mb-1">{fileResult.name}</p>
                    <p className="text-xs text-slate-500">
                      {fileResult.mime || 'unknown type'} ·{' '}
                      {(fileResult.size / 1024).toFixed(1)} KB original ·{' '}
                      {(fileResult.b64.length / 1024).toFixed(1)} KB encoded
                    </p>
                  </div>
                  <button onClick={() => copy(fileResult.b64, 'file')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white
                      transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10">
                    {copied === 'file'
                      ? <><Check size={12} className="text-emerald-400"/>Copied!</>
                      : <><Copy size={12}/>Copy Base64</>}
                  </button>
                </div>

                <div className="bg-black/30 rounded-xl p-4 border border-white/5 max-h-48 overflow-y-auto">
                  <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap break-all leading-relaxed">
                    {fileResult.b64.slice(0, 400)}
                    {fileResult.b64.length > 400 && (
                      `\n… +${(fileResult.b64.length - 400).toLocaleString()} more chars`
                    )}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => copy(`data:${fileResult.mime};base64,${fileResult.b64}`, 'dataurl')}
                    className="py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white
                      bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-1.5">
                    {copied === 'dataurl'
                      ? <><Check size={12} className="text-emerald-400"/>Copied!</>
                      : <><Copy size={12}/>Copy as Data URL</>}
                  </button>
                  <button onClick={() => copy(fileResult.b64, 'file')}
                    className="py-2.5 rounded-xl text-xs font-medium text-emerald-400 hover:text-emerald-300
                      bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5">
                    <Download size={12}/>Raw Base64 string
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}