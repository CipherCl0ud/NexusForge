import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool, X, Download, FileText, Type, Image as ImageIcon, UploadCloud, ShieldCheck, Maximize, Move, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function ESignature() {
  const [sourcePdf, setSourcePdf] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceSize, setSourceSize] = useState(0);
  
  const [originalPdfUrl, setOriginalPdfUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [targetPage, setTargetPage] = useState('first');

  // --- Signature State ---
  const [signMode, setSignMode] = useState('draw');
  const [signColor, setSignColor] = useState('#3b82f6');
  const [sigPreviewUrl, setSigPreviewUrl] = useState(null); 
  
  // --- Native Placement Engine ---
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [posX, setPosX] = useState(50); // % X axis
  const [posY, setPosY] = useState(15); // % Y axis (HTML space: 0 is top)
  const [signScale, setSignScale] = useState(1); 
  
  // High-performance drag states to prevent iframe flashing
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [isBakingPdf, setIsBakingPdf] = useState(false);
  const [wheelTimeout, setWheelTimeout] = useState(null);
  
  // Draw State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawTrigger, setDrawTrigger] = useState(0); 
  
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
      if (sigPreviewUrl) URL.revokeObjectURL(sigPreviewUrl);
    };
  }, [previewUrl, originalPdfUrl, sigPreviewUrl]);

  const isReadyToSign = 
    (signMode === 'draw' && hasDrawn) || 
    (signMode === 'type' && typedSignature.trim().length > 0) || 
    (signMode === 'upload' && uploadedStamp !== null);

  useEffect(() => {
    if (isReadyToSign) setIsPlacementMode(true);
    else setIsPlacementMode(false);
  }, [isReadyToSign]);

  // --- Canvas Drawing Logic ---
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
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
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
    setDrawTrigger(prev => prev + 1);
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handlePdfUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast.error("Please select a valid PDF.");
      return;
    }
    
    setSourceName(file.name);
    setSourceSize(file.size);
    const bytes = await file.arrayBuffer();
    setSourcePdf(bytes);
    
    const blob = new Blob([bytes], { type: 'application/pdf' });
    setOriginalPdfUrl(URL.createObjectURL(blob));
  };

  const handleStampUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file (PNG/JPG).");
      return;
    }
    setUploadedStamp(file);
    setStampPreview(URL.createObjectURL(file));
  };

  // --- PDF & Signature Extraction Logic ---
  const getSignatureBytesAndType = async () => {
    if (signMode === 'draw') {
      return { bytes: await fetch(canvasRef.current.toDataURL('image/png')).then(res => res.arrayBuffer()), type: 'png' };
    } 
    if (signMode === 'type') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 600; tempCanvas.height = 200;
      const ctx = tempCanvas.getContext('2d');
      ctx.fillStyle = signColor;
      ctx.font = 'italic 70px serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(typedSignature, 300, 100);
      return { bytes: await fetch(tempCanvas.toDataURL('image/png')).then(res => res.arrayBuffer()), type: 'png' };
    } 
    if (signMode === 'upload' && uploadedStamp) {
      return { bytes: await uploadedStamp.arrayBuffer(), type: uploadedStamp.type === 'image/jpeg' ? 'jpg' : 'png' };
    }
    throw new Error("No signature provided");
  };

  // Extract a PNG of the signature specifically for the floating HTML preview overlay
  useEffect(() => {
    if (!isReadyToSign) {
      setSigPreviewUrl(null);
      return;
    }
    let isActive = true;
    getSignatureBytesAndType().then(({ bytes, type }) => {
      if (!isActive) return;
      const blob = new Blob([bytes], { type: `image/${type}` });
      const url = URL.createObjectURL(blob);
      setSigPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    }).catch(console.error);
    return () => { isActive = false; };
  }, [signMode, typedSignature, uploadedStamp, signColor, hasDrawn, drawTrigger, isReadyToSign]);

  // --- NATIVE LIVE PREVIEW ENGINE (DEBOUNCED) ---
  useEffect(() => {
    if (!sourcePdf || !isReadyToSign) {
      setPreviewUrl(null);
      return;
    }

    // CRUCIAL: Do not regenerate the heavy PDF iframe while the user is actively dragging.
    // This entirely eliminates the white flashing.
    if (isDraggingThumb) return;

    const applySignature = async () => {
      setIsBakingPdf(true);
      try {
        const { bytes: sigBytes, type: sigType } = await getSignatureBytesAndType();
        const pdfDoc = await PDFDocument.load(sourcePdf);
        
        let embeddedSig;
        if (sigType === 'jpg') embeddedSig = await pdfDoc.embedJpg(sigBytes);
        else embeddedSig = await pdfDoc.embedPng(sigBytes);
        
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 150;
        let { width: origW, height: origH } = embeddedSig.scale(1);
        
        const baseScale = Math.min(MAX_WIDTH / origW, MAX_HEIGHT / origH, 1);
        const finalDims = embeddedSig.scale(baseScale * signScale);

        const pages = pdfDoc.getPages();
        const pageToSign = targetPage === 'first' ? pages[0] : pages[pages.length - 1];
        const { width: pageW, height: pageH } = pageToSign.getSize();

        const pdfYPercent = 100 - posY;
        const actualX = (pageW * (posX / 100)) - (finalDims.width / 2);
        const actualY = (pageH * (pdfYPercent / 100)) - (finalDims.height / 2);

        pageToSign.drawImage(embeddedSig, {
          x: actualX,
          y: actualY, 
          width: finalDims.width,
          height: finalDims.height,
        });
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsBakingPdf(false);
      }
    };

    // Bake the PDF 150ms after the user releases the mouse
    const timeout = setTimeout(applySignature, 150);
    return () => clearTimeout(timeout);
  }, [sourcePdf, signMode, typedSignature, uploadedStamp, signColor, posX, posY, signScale, targetPage, drawTrigger, isDraggingThumb]);

  // --- Interactive Overlay Handlers ---
  const handlePreviewPointerDown = (e) => {
    setIsDraggingThumb(true);
    handlePreviewPointerMove(e);
  };

  const handlePreviewPointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosX(Math.min(100, Math.max(0, x)));
    setPosY(Math.min(100, Math.max(0, y)));
  };

  const handlePreviewPointerUp = () => {
    setIsDraggingThumb(false);
  };

  const handlePreviewWheel = (e) => {
    e.preventDefault();
    setIsDraggingThumb(true); // Treat scroll as a drag event to trigger the smooth HTML preview
    const delta = e.deltaY * -0.002;
    setSignScale(prev => Math.min(Math.max(0.2, prev + delta), 4));

    if (wheelTimeout) clearTimeout(wheelTimeout);
    setWheelTimeout(setTimeout(() => {
      setIsDraggingThumb(false); 
    }, 250));
  };

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Signed_${sourceName}`;
    a.click();
    toast.success("Signed document downloaded!");
  };

  const clearWorkspace = () => {
    setSourcePdf(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
    if (sigPreviewUrl) URL.revokeObjectURL(sigPreviewUrl);
    setPreviewUrl(null);
    setOriginalPdfUrl(null);
    clearSignature();
  };

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Controls (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {!sourcePdf ? (
          <div className="flex-1 flex flex-col h-full">
            <UploadZone 
              onFilesSelected={handlePdfUpload}
              accept=".pdf, application/pdf"
              multiple={false}
              title="Add PDF to Sign"
              subtitle="Drop a PDF to draw, type, or stamp a signature"
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 rounded-2xl flex flex-col h-full overflow-hidden">
            
            <div className="border-b border-white/5 pb-4 mb-5 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <PenTool size={18} className="text-[#06b6d4]" /> Signature Engine
              </h3>
              <button onClick={clearWorkspace} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X size={16}/>
              </button>
            </div>

            {/* File Info */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-3 mb-5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/10 flex items-center justify-center text-[#06b6d4] shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{sourceName}</p>
                <p className="text-[10px] text-slate-500 font-mono">{formatBytes(sourceSize)}</p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-black/40 p-1 rounded-xl mb-4 shrink-0 border border-white/5">
              <button onClick={() => setSignMode('draw')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${signMode === 'draw' ? 'bg-[#06b6d4] text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><PenTool size={14}/> Draw</button>
              <button onClick={() => setSignMode('type')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${signMode === 'type' ? 'bg-[#06b6d4] text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><Type size={14}/> Type</button>
              <button onClick={() => setSignMode('upload')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${signMode === 'upload' ? 'bg-[#06b6d4] text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><ImageIcon size={14}/> Image</button>
            </div>

            {/* Input Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-black/20 rounded-xl border border-white/5 p-4 shrink-0">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {signMode === 'draw' ? 'Canvas' : signMode === 'type' ? 'Keyboard' : 'Image Stamp'}
                </label>
                {isReadyToSign && (
                  <button onClick={clearSignature} className="text-[10px] uppercase font-bold text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>

              {signMode === 'draw' && (
                <div className="flex-1 bg-white border border-white/10 rounded-xl overflow-hidden cursor-crosshair relative shadow-inner mb-3 min-h-[100px]">
                  <canvas ref={canvasRef} width={400} height={150} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} className="w-full h-full" />
                  {!hasDrawn && <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none italic text-sm select-none">Draw signature here...</div>}
                </div>
              )}

              {signMode === 'type' && (
                <div className="flex flex-col gap-3 mb-3 h-full">
                  <input 
                    type="text" value={typedSignature} onChange={(e) => setTypedSignature(e.target.value)} 
                    placeholder="Type your name..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#06b6d4]/50 transition-colors shadow-inner"
                  />
                  <div className="flex-1 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-inner p-4 min-h-[80px]">
                    {typedSignature ? (
                      <span className="text-4xl italic font-serif truncate" style={{ color: signColor }}>{typedSignature}</span>
                    ) : (
                      <span className="text-slate-300 italic text-sm select-none">Preview</span>
                    )}
                  </div>
                </div>
              )}

              {signMode === 'upload' && (
                <div className="flex-1 mb-3 min-h-[120px]">
                  {!stampPreview ? (
                    <label className="h-full relative rounded-xl border border-dashed border-white/20 bg-black/40 hover:bg-black/60 transition-colors flex flex-col items-center justify-center cursor-pointer group">
                      <UploadCloud size={24} className="text-[#06b6d4] mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs text-slate-400 font-medium">Click to upload stamp (PNG/JPG)</p>
                      <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleStampUpload} />
                    </label>
                  ) : (
                    <div className="h-full bg-white rounded-xl flex items-center justify-center p-4 border border-white/10 relative shadow-inner">
                      <img src={stampPreview} alt="Stamp Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
              )}

              {/* Ink Color */}
              {signMode !== 'upload' && (
                <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg border border-white/5 shrink-0 mt-auto">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ink Color</span>
                  <div className="flex gap-2">
                    {colors.map(color => (
                      <button 
                        key={color.name} onClick={() => setSignColor(color.hex)} title={color.name}
                        className={`w-6 h-6 rounded-full transition-all ${signColor === color.hex ? 'scale-110 ring-2 ring-white/50 shadow-md' : 'opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Target Page Selector */}
            <div className="shrink-0 space-y-3 mt-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FileText size={12}/> Document Placement</p>
              </div>
              <div className="flex bg-black/40 rounded-lg border border-white/5 p-1">
                <button onClick={() => setTargetPage('first')} className={`flex-1 px-2 py-2 text-xs font-bold rounded transition-colors ${targetPage === 'first' ? 'bg-[#06b6d4] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>First Page</button>
                <button onClick={() => setTargetPage('last')} className={`flex-1 px-2 py-2 text-xs font-bold rounded transition-colors ${targetPage === 'last' ? 'bg-[#06b6d4] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Last Page</button>
              </div>
            </div>

            {/* Export Button */}
            <div className="mt-auto pt-4 shrink-0 border-t border-white/5">
              <button 
                onClick={downloadPdf} 
                disabled={!previewUrl || !isReadyToSign || isBakingPdf} 
                className="w-full py-4 bg-[#06b6d4] hover:bg-[#0891b2] disabled:opacity-50 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#06b6d4]/20 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download Signed PDF
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── RIGHT PANE: Live Interactive Preview (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col h-full min-h-0 bg-black/20">
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <Maximize size={16} className="text-[#06b6d4]"/> Live Document Canvas
          </span>
          
          {isReadyToSign && (
            <button 
              onClick={() => setIsPlacementMode(!isPlacementMode)}
              className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg transition-all border ${isPlacementMode ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/30 shadow-inner' : 'bg-black/40 text-slate-400 border-transparent hover:text-white'}`}
            >
              <Move size={14} /> {isPlacementMode ? 'Placement Active' : 'Placement Paused'}
            </button>
          )}
        </div>
        
        <div className="flex-1 bg-[#0a0a0a] relative min-h-0 p-4 flex items-center justify-center">
          {!originalPdfUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
              <FileText size={32} className="opacity-20" />
              Waiting for document...
            </div>
          ) : (
            <>
              {/* Native PDF Iframe */}
              <iframe 
                src={`${previewUrl || originalPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                className="w-full h-full border-none rounded-xl bg-white shadow-2xl" 
                title="Signature Preview" 
              />

              {/* The Live Drag & Resize Glass Overlay */}
              {isPlacementMode && isReadyToSign && (
                <div 
                  className="absolute inset-4 z-50 cursor-move rounded-xl touch-none overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.03)',
                    border: '2px dashed rgba(6, 182, 212, 0.4)'
                  }}
                  onPointerDown={handlePreviewPointerDown}
                  onPointerMove={(e) => { if (e.buttons === 1) handlePreviewPointerMove(e); }}
                  onPointerUp={handlePreviewPointerUp}
                  onPointerLeave={handlePreviewPointerUp}
                  onWheel={handlePreviewWheel}
                >
                  {/* Floating HTML Preview - Only visible during drag/scroll to mask the iframe delay */}
                  <div 
                    className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
                    style={{ 
                      left: `${posX}%`, 
                      top: `${posY}%`, 
                      width: `${140 * signScale}px`,
                      opacity: (isDraggingThumb || isBakingPdf) ? 0.9 : 0 
                    }}
                  >
                    {sigPreviewUrl && <img src={sigPreviewUrl} className="w-full h-auto drop-shadow-2xl" alt="Sig" />}
                  </div>

                  <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${isDraggingThumb ? 'opacity-0' : 'opacity-60'}`}>
                    <div className="bg-black/80 px-5 py-3 rounded-full shadow-2xl text-xs font-bold text-white tracking-widest flex items-center gap-3 backdrop-blur-sm border border-white/10">
                      <Move size={16} className="text-[#06b6d4]" /> 
                      Click & Drag to Move <span className="text-slate-600">·</span> Scroll to Resize
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
    </div>
  );
}