import React from 'react';
import UploadZone from '../components/UploadZone';

// ── IMAGE & VISION TOOLS ───────────────────────────────────────────────────
import FormatConverter   from './image/FormatConverter';
import ColorPalette      from './image/ColorPalette';    
import BulkResizer       from './image/BulkResizer';     
import ImageCompressor   from './image/ImageCompressor'; 
import BackgroundRemover from './image/BackgroundRemover';
import ImageUpscaler     from './image/ImageUpscaler';
import VisionAnnotator   from './image/VisionAnnotator';

// ── DOCUMENT SUITE TOOLS ───────────────────────────────────────────────────
import ImageToPdf        from './pdf/ImageToPdf';
import PdfToImage        from './pdf/PdfToImage';
import PdfMerger         from './pdf/PdfMerger';
import PdfSplitter       from './pdf/PdfSplitter';
import PdfCompressor     from './pdf/PdfCompressor';
import PdfWatermarker    from './pdf/PdfWatermarker';
import DocProtection     from './pdf/DocProtection';
import ESignature        from './pdf/ESignature';
import PdfAnnotator      from './pdf/PdfAnnotator';

// ── VIDEO & AUDIO TOOLS ────────────────────────────────────────────────────
import VideoGpxProcessor from './video/VideoGpxProcessor';

// ── DEV UTILITIES TOOLS ────────────────────────────────────────────────────
import JsonStudio        from './dev/JsonStudio';
import MarkdownToHtml    from './dev/MarkdownToHtml';
import Base64Coder       from './dev/Base64Coder';

// ── CENTRAL ROUTING REGISTRY ───────────────────────────────────────────────
// Ensure these string keys exactly match the 'id' properties in your sidebar data
const TOOL_COMPONENTS = {
  // Image & Vision
  'img-format':      FormatConverter,
  'color-palette':   ColorPalette,      
  'img-resizer':     BulkResizer,       
  'img-compressor':  ImageCompressor,   
  'bg-remover':      BackgroundRemover,
  'img-upscaler':    ImageUpscaler,
  'vision-annotator': VisionAnnotator,

  // Document Suite
  'img-to-pdf':      ImageToPdf,
  'pdf-to-img':      PdfToImage,
  'pdf-merger':      PdfMerger,
  'pdf-splitter':    PdfSplitter,
  'pdf-compress':    PdfCompressor,
  'pdf-watermark':   PdfWatermarker,
  'doc-protect':     DocProtection,
  'e-signature':     ESignature,
  'pdf-annotator':   PdfAnnotator,
  
  // Video & Audio
  'video-gpx':       VideoGpxProcessor,
  
  // Dev Utilities
  'json-studio':     JsonStudio,
  'md-to-html':      MarkdownToHtml,
  'base64':          Base64Coder,
};

// ──────────────────────────────────────────────────────────────────────────
export default function ToolRouter({ tool }) {
  const Component = TOOL_COMPONENTS[tool.id];
  
  // If the tool is built and registered, render the interactive component
  if (Component) {
    return <Component tool={tool} />;
  }
  
  // If the tool exists in the sidebar but hasn't been built yet, show the fallback UI
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 shadow-inner">
        <span className="text-xl">🚧</span>
        <p className="text-sm text-amber-400/90">
          <span className="font-bold text-amber-400">{tool.title}</span> is currently under construction in the forge.
        </p>
      </div>
      
      {/* Fallback upload zone just to make the empty pages feel interactive */}
      <div className="opacity-50 pointer-events-none grayscale">
        <UploadZone onFilesSelected={() => {}} />
      </div>
    </div>
  );
}