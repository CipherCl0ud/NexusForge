import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Download, FileCode } from 'lucide-react';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

const SAMPLE = `# Welcome to NexusForge

A premium all-in-one toolkit that runs **entirely in your browser**.

## Features

- 🖼️ Image conversion & compression
- 📄 PDF manipulation suite
- 🎬 Video & audio utilities
- 💻 Developer tools

## Code Example

\`\`\`javascript
const result = await convertImage(file, { format: 'webp', quality: 0.85 });
console.log('Done:', result);
\`\`\`

> Files never leave your device. Zero server uploads.

---

Made with ❤️ and React.`;

export default function MarkdownToHtml() {
  const [md,      setMd]      = useState(SAMPLE);
  const [copied,  setCopied]  = useState(false);
  const [copyTarget, setCopyTarget] = useState(null); // 'html' | 'preview'

  const html = marked.parse(md);

  const copy = (type) => {
    navigator.clipboard.writeText(type === 'html' ? html : md);
    setCopied(true);
    setCopyTarget(type);
    setTimeout(() => { setCopied(false); setCopyTarget(null); }, 2000);
  };

  const download = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: 'output.html' }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <FileCode size={12}/> Live preview · GFM enabled
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => copy('html')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white
              transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10">
            {copied && copyTarget === 'html'
              ? <><Check size={12} className="text-emerald-400"/>Copied HTML!</>
              : <><Copy size={12}/>Copy HTML</>}
          </button>
          <button onClick={download}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300
              transition-colors px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20
              border border-emerald-500/20">
            <Download size={12}/>Download .html
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-2 gap-4 h-[520px]">

        {/* Markdown input */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Markdown</span>
            <span className="text-[10px] text-slate-600 font-mono">{md.length} chars</span>
          </div>
          <textarea
            value={md}
            onChange={(e) => setMd(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent resize-none font-mono text-xs text-slate-300
              p-4 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Live HTML preview */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-1 flex-shrink-0">
            {['Preview', 'HTML Source'].map((label, i) => {
              const key = i === 0 ? 'preview' : 'source';
              return (
                <button key={key}
                  onClick={() => setCopyTarget(prev => prev === key ? null : key)}
                  className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all
                    ${copyTarget === key
                      ? 'bg-white/10 text-white'
                      : 'text-slate-500 hover:text-slate-300'}`}>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {copyTarget === 'source' ? (
              <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap break-all leading-relaxed">
                {html}
              </pre>
            ) : (
              <div
                className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-semibold
                  prose-p:text-slate-300 prose-p:leading-relaxed
                  prose-strong:text-white
                  prose-code:text-emerald-400 prose-code:bg-white/5
                  prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                  prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
                  prose-blockquote:border-l-accent prose-blockquote:text-slate-400
                  prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  prose-ul:text-slate-300 prose-li:text-slate-300
                  prose-hr:border-white/10"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}