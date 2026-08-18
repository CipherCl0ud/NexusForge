import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, X, Download, FileText, Loader2, FileUp, Trash2, Type, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function ESignature() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetPage, setTargetPage] = useState('last');

  // --- Signature State ---
  const [signMode, setSignMode] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [signColor, setSignColor] = useState('#3b82f6'); // Default Blue
  
  // Draw State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  // Type State
  const [typedSignature, setTypedSignature] = useState('');
  
  // Upload State
  const [uploadedStamp, setUploadedStamp] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);

  const colors = [
    { name: 'Black', hex: '#1e293b' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Red', hex: '#ef4444' }
  ];

  // --- Canvas Drawing Logic with Offset Fix ---
  useEffect(() => {
    if (signMode === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = signColor;
    }
  }, [signMode, signColor, sourcePdf]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (signMode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    } else if (signMode === 'type') {
      setTypedSignature('');
    } else if (signMode === 'upload') {
      setUploadedStamp(null);
      setStampPreview(null);
    }
    setPreviewUrl(null);
  };

  // --- File Upload Logic ---
  const handlePdfFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setSourceName(file.name);
    const bytes = await file.arrayBuffer();
    setSourcePdf(bytes);
  };

  const handleStampUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadedStamp(file);
    setStampPreview(URL.createObjectURL(file));
  };

  // --- PDF Processing Logic ---
  const getSignatureBytesAndType = async () => {
    if (signMode === 'draw') {
      return { bytes: await fetch(canvasRef.current.toDataURL('image/png')).then(res => res.arrayBuffer()), type: 'png' };
    } 
    
    if (signMode === 'type') {
      // Create a temporary canvas to render the typed text as an image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400; tempCanvas.height = 150;
      const ctx = tempCanvas.getContext('2d');
      ctx.fillStyle = signColor;
      ctx.font = 'italic 50px serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(typedSignature, 200, 75);
      return { bytes: await fetch(tempCanvas.toDataURL('image/png')).then(res => res.arrayBuffer()), type: 'png' };
    } 
    
    if (signMode === 'upload' && uploadedStamp) {
      return { 
        bytes: await uploadedStamp.arrayBuffer(), 
        type: uploadedStamp.type === 'image/jpeg' ? 'jpg' : 'png' 
      };
    }
    throw new Error("No signature provided");
  };

  const applySignature = async () => {
    setIsGenerating(true);
    try {
      const { bytes: sigBytes, type: sigType } = await getSignatureBytesAndType();
      const pdfDoc = await PDFDocument.load(sourcePdf);
      
      let embeddedSig;
      if (sigType === 'jpg') embeddedSig = await pdfDoc.embedJpg(sigBytes);
      else embeddedSig = await pdfDoc.embedPng(sigBytes);
      
      // Calculate a reasonable scale so huge stamps don't cover the whole page
      const MAX_WIDTH = 250;
      const MAX_HEIGHT = 150;
      let { width, height } = embeddedSig.scale(1);
      
      const scaleRatio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
      const finalDims = embeddedSig.scale(scaleRatio);

      const pages = pdfDoc.getPages();
      const pageToSign = targetPage === 'first' ? pages[0] : pages[pages.length - 1];

      pageToSign.drawImage(embeddedSig, {
        x: 50,
        y: 50, 
        width: finalDims.width,
        height: finalDims.height,
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      alert("Failed to apply signature or stamp.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Signed_${sourceName}`;
    a.click();
  };

  const isReadyToSign = 
    (signMode === 'draw' && hasDrawn) || 
    (signMode === 'type' && typedSignature.trim().length > 0) || 
    (signMode === 'upload' && uploadedStamp !== null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
      {/* LEFT PANE */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-full">
        {!sourcePdf ? (
          <div className="relative rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center p-10 cursor-pointer shrink-0 h-full">
            <FileUp size={32} className="text-cyan-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Upload PDF</h3>
            <p className="text-xs text-slate-500 text-center">Select a document to sign or stamp</p>
            <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePdfFile} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full">
            
            {/* File Info Header */}
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-cyan-500/20 bg-cyan-500/5 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={20} className="text-cyan-400 shrink-0" />
                <p className="text-sm font-medium text-white truncate max-w-[200px]">{sourceName}</p>
              </div>
              <button onClick={() => { setSourcePdf(null); setPreviewUrl(null); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"><X size={16}/></button>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col relative overflow-hidden">
              
              {/* Mode Switcher */}
              <div className="flex bg-black/40 p-1 rounded-xl mb-4 shrink-0">
                <button onClick={() => setSignMode('draw')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${signMode === 'draw' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><PenTool size={14}/> Draw</button>
                <button onClick={() => setSignMode('type')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${signMode === 'type' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><Type size={14}/> Type</button>
                <button onClick={() => setSignMode('upload')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${signMode === 'upload' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><ImageIcon size={14}/> Image</button>
              </div>

              {/* Dynamic Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {signMode === 'draw' ? 'Draw Signature' : signMode === 'type' ? 'Type Signature' : 'Upload Stamp'}
                  </label>
                  {isReadyToSign && (
                    <button onClick={clearSignature} className="text-[10px] uppercase font-bold text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                      <Trash2 size={12} /> Clear
                    </button>
                  )}
                </div>

                {/* MODE: DRAW */}
                {signMode === 'draw' && (
                  <div className="flex-1 bg-white border border-white/10 rounded-xl overflow-hidden cursor-crosshair relative shadow-inner mb-3">
                    <canvas ref={canvasRef} width={400} height={200} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} className="w-full h-full" />
                    {!hasDrawn && <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none italic text-sm select-none">Draw here...</div>}
                  </div>
                )}

                {/* MODE: TYPE */}
                {signMode === 'type' && (
                  <div className="flex-1 flex flex-col gap-3 mb-3">
                    <input 
                      type="text" 
                      value={typedSignature} 
                      onChange={(e) => setTypedSignature(e.target.value)} 
                      placeholder="Type your name..." 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <div className="flex-1 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-inner p-4">
                      {typedSignature ? (
                        <span className="text-4xl italic font-serif" style={{ color: signColor }}>{typedSignature}</span>
                      ) : (
                        <span className="text-slate-300 italic text-sm select-none">Preview</span>
                      )}
                    </div>
                  </div>
                )}

                {/* MODE: UPLOAD */}
                {signMode === 'upload' && (
                  <div className="flex-1 mb-3">
                    {!stampPreview ? (
                      <div className="h-full relative rounded-xl border border-dashed border-white/20 bg-black/20 hover:bg-black/40 transition-colors flex flex-col items-center justify-center cursor-pointer">
                        <UploadCloud size={24} className="text-slate-400 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Click or drop image (PNG/JPG)</p>
                        <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleStampUpload} />
                      </div>
                    ) : (
                      <div className="h-full bg-black/40 rounded-xl flex items-center justify-center p-4 border border-white/10 relative">
                        <img src={stampPreview} alt="Stamp Preview" className="max-w-full max-h-full object-contain drop-shadow-xl" />
                      </div>
                    )}
                  </div>
                )}

                {/* Color Picker (Only for Draw and Type) */}
                {signMode !== 'upload' && (
                  <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-lg border border-white/5 shrink-0">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Ink Color</span>
                    <div className="flex gap-2">
                      {colors.map(color => (
                        <button 
                          key={color.name} 
                          onClick={() => setSignColor(color.hex)}
                          className={`w-6 h-6 rounded-full transition-transform ${signColor === color.hex ? 'scale-125 ring-2 ring-white/50 shadow-md' : 'scale-100 opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Page Selector */}
              <div className="flex bg-black/40 p-1 rounded-xl mt-4 shrink-0">
                <button onClick={() => setTargetPage('first')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${targetPage === 'first' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                  First Page
                </button>
                <button onClick={() => setTargetPage('last')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${targetPage === 'last' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                  Last Page
                </button>
              </div>
            </div>

            {/* Actions */}
            {!previewUrl ? (
              <button onClick={applySignature} disabled={isGenerating || !isReadyToSign} className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shrink-0">
                {isGenerating ? <><Loader2 size={18} className="animate-spin" /> Stamping...</> : <><PenTool size={18} /> Apply to PDF</>}
              </button>
            ) : (
              <button onClick={downloadPdf} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shrink-0">
                <Download size={18} /> Download Signed PDF
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* RIGHT PANE: Live Preview */}
      <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col">
        <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-medium flex items-center gap-2"><PenTool size={16} className="text-cyan-400"/> Validation Preview</span>
        </div>
        <div className="flex-1 bg-[#1e1e1e] relative">
          {!previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <PenTool size={24} className="opacity-50" /> Configure signature to preview document
            </div>
          ) : (
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="Signature Preview" />
          )}
        </div>
      </div>
    </div>
  );
}