import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, AlertCircle, CheckCircle2, ChevronRight, ChevronDown, Braces } from 'lucide-react';

// ── OPTIMIZATION: Memoized Tree Node prevents cascading re-renders ────────
const JsonNode = memo(function JsonNode({ keyName, value, isLast = true, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  
  const isObj  = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArr  = Array.isArray(value);
  const isLeaf = !isObj && !isArr;

  if (isLeaf) {
    let color = 'text-[#cccccc]';
    let display = String(value);

    if (value === null) {
      color = 'text-[#569cd6]'; // Blue for null
      display = 'null';
    } else if (typeof value === 'string') {
      color = 'text-[#ce9178]'; // Orange for strings
      display = `"${value}"`;
    } else if (typeof value === 'boolean') {
      color = 'text-[#569cd6]'; // Blue for booleans
    } else if (typeof value === 'number') {
      color = 'text-[#b5cea8]'; // Light green for numbers
    }

    return (
      <div className="flex items-start hover:bg-[#2a2d2e] w-full transition-none cursor-text leading-[22px]">
        <div className="w-5 flex-shrink-0" />
        {keyName !== undefined && (
          <span className="text-[#9cdcfe] mr-1.5 flex-shrink-0">"{keyName}":</span>
        )}
        <span className={`${color} break-all`}>
          {display}{!isLast && <span className="text-[#cccccc]">,</span>}
        </span>
      </div>
    );
  }

  const bracket  = isArr ? ['[', ']'] : ['{', '}'];
  const children = isArr ? value : Object.entries(value);
  const count    = children.length;

  return (
    <div className="font-mono text-[13.5px] leading-[22px] text-[#cccccc] w-full">
      <div 
        className="flex items-start hover:bg-[#2a2d2e] cursor-pointer w-full group transition-none"
        onClick={() => setOpen(!open)}
      >
        <div className="w-5 h-[22px] flex items-center justify-center flex-shrink-0 text-[#858585] group-hover:text-[#cccccc] transition-colors">
          {open ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
        </div>
        
        {keyName !== undefined && (
          <span className="text-[#9cdcfe] mr-1.5">"{keyName}":</span>
        )}
        <span>{bracket[0]}</span>
        
        {!open && (
          <span className="text-[#858585] mx-2 text-[11px] bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.05]">
            {count} {isArr ? 'items' : 'keys'}
          </span>
        )}
        
        {!open && (
          <span>{bracket[1]}{!isLast && ','}</span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1 }}
            className="relative flex flex-col overflow-hidden"
          >
            <div className="absolute left-[9px] top-0 bottom-0 w-[1px] bg-[#404040] hover:bg-[#707070] transition-colors z-0" />
            
            <div className="pl-[14px] z-10 w-full">
              {isArr
                ? value.map((v, i) => (
                    <JsonNode key={i} value={v} isLast={i === value.length - 1} depth={depth + 1} />
                  ))
                : Object.entries(value).map(([k, v], i) => (
                    <JsonNode key={k} keyName={k} value={v} isLast={i === children.length - 1} depth={depth + 1} />
                  ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && (
        <div className="flex items-start hover:bg-[#2a2d2e] w-full transition-none cursor-pointer" onClick={() => setOpen(!open)}>
          <div className="w-5 flex-shrink-0" />
          <span>{bracket[1]}{!isLast && ','}</span>
        </div>
      )}
    </div>
  );
});

// ── Main Layout ────────────────────────────────────────────────────────────
export default function JsonStudio() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('tree'); 
  const [copied, setCopied] = useState(false);

  const PLACEHOLDER = `{
  "name": "NexusForge",
  "version": 1.0,
  "tools": ["JSON Studio", "Format Converter", "Background Remover"],
  "settings": {
    "theme": "dark",
    "hardwareAcceleration": true,
    "maxBatchSize": 50
  },
  "active": true,
  "metadata": null
}`;

  // OPTIMIZATION: Debounce the heavy JSON.parse logic so typing stays fast
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!input.trim()) { 
        setParsed(null); 
        setError(null); 
        return; 
      }
      try {
        setParsed(JSON.parse(input));
        setError(null);
      } catch (e) {
        setParsed(null);
        setError(e.message);
      }
    }, 300); // Waits 300ms after you stop typing to process

    return () => clearTimeout(timeoutId);
  }, [input]);

  const formatted = parsed !== null ? JSON.stringify(parsed, null, 2) : '';

  const copy = () => {
    navigator.clipboard.writeText(formatted || input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = () => setInput(PLACEHOLDER);
  const clear = () => setInput('');
  const minify = () => parsed !== null && setInput(JSON.stringify(parsed));

  const isValid = parsed !== null;
  const isEmpty = !input.trim();

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEmpty ? (
            <span className="text-xs text-slate-600 flex items-center gap-1.5">
              <Braces size={12}/> Paste JSON below
            </span>
          ) : isValid ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={12}/> Valid JSON
            </span>
          ) : (
            <span className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12}/> {error}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadSample} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
            Load sample
          </button>
          {!isEmpty && (
            <button onClick={clear} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              Clear
            </button>
          )}
          {isValid && (
            <button onClick={minify} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              Minify
            </button>
          )}
          {isValid && (
            <button onClick={copy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10">
              {copied ? <><Check size={12} className="text-emerald-400"/>Copied!</> : <><Copy size={12}/>Copy Formatted</>}
            </button>
          )}
        </div>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-2 gap-4 h-[600px]">
        {/* Input */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border border-white/5">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-black/20">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Input</span>
            {!isEmpty && <span className="text-[10px] text-slate-600 font-mono">{input.length} chars</span>}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            className="flex-1 bg-[#1e1e1e] resize-none font-mono text-[13.5px] text-[#cccccc] placeholder:text-slate-700 p-4 focus:outline-none leading-[22px]"
          />
        </div>

        {/* Output */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border border-white/5">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-black/20">
            <div className="flex gap-1">
              {['tree', 'formatted'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all
                    ${view === v ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  {v}
                </button>
              ))}
            </div>
            {isValid && parsed !== null && (
              <span className="text-[10px] text-slate-600 font-mono">
                {Array.isArray(parsed) ? `${parsed.length} items` : `${Object.keys(parsed).length} keys`}
              </span>
            )}
          </div>
          
          {/* Editor Surface */}
          <div className="flex-1 overflow-y-auto bg-[#1e1e1e] py-2">
            {!isValid && !isEmpty && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <AlertCircle size={32} className="text-red-500/50" />
                <p className="text-sm text-red-400">Fix the JSON error to see output</p>
                <p className="text-[11px] text-slate-500 font-mono px-4 max-w-sm">{error}</p>
              </div>
            )}
            {isEmpty && (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                <Braces size={32} className="text-slate-700" />
                <p className="text-sm text-slate-600">Output appears here</p>
              </div>
            )}
            {isValid && view === 'tree' && (
              <div className="w-full">
                <JsonNode value={parsed} depth={0} />
              </div>
            )}
            {isValid && view === 'formatted' && (
              <pre className="text-[13.5px] font-mono text-[#9cdcfe] leading-[22px] whitespace-pre-wrap break-all px-4">
                {formatted}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}