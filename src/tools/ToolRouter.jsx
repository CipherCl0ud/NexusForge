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
import WordToPdf         from './pdf/WordToPdf';
import PptToPdf          from './pdf/PptToPdf';
import ExcelToPdf        from './pdf/ExcelToPdf';
import PdfToWord         from './pdf/PdfToWord';

// ── VIDEO & AUDIO TOOLS ────────────────────────────────────────────────────
import VideoGpxProcessor   from './video/VideoGpxProcessor';
import VideoFrameExtractor from './video/VideoFrameExtractor';
import VideoToGif          from './video/VideoToGif';
import AudioExtractor      from './video/AudioExtractor';

// ── DEV UTILITIES TOOLS ────────────────────────────────────────────────────
import JsonStudio        from './dev/JsonStudio';
import MarkdownToHtml    from './dev/MarkdownToHtml';
import Base64Coder       from './dev/Base64Coder';

// ── CENTRAL ROUTING REGISTRY ───────────────────────────────────────────────
// Keys below match the SEO-renamed `id` values in data/tools.js.
const TOOL_COMPONENTS = {
  // Image & Vision
  'image-format-converter':   FormatConverter,
  'color-palette-extractor':  ColorPalette,
  'bulk-image-resizer':       BulkResizer,
  'image-compressor':         ImageCompressor,
  'ai-background-remover':    BackgroundRemover,
  'ai-image-upscaler':        ImageUpscaler,
  'vision-annotator':         VisionAnnotator,
  'image-to-pdf':             ImageToPdf,

  // Document Suite
  'pdf-to-image':             PdfToImage,
  'pdf-merger':                PdfMerger,
  'pdf-splitter':              PdfSplitter,
  'pdf-compressor':            PdfCompressor,
  'pdf-watermarker':           PdfWatermarker,
  'pdf-password-protect':      DocProtection,
  'pdf-signature':             ESignature,
  'pdf-annotator':             PdfAnnotator,
  'word-to-pdf':               WordToPdf,
  'ppt-to-pdf':                PptToPdf,
  'excel-to-pdf':              ExcelToPdf,
  'pdf-to-word':               PdfToWord,

  // Video & Audio
  'video-gpx-mapper':          VideoGpxProcessor,
  'video-to-image-converter':  VideoFrameExtractor,
  'video-to-gif':              VideoToGif,
  'audio-extractor':           AudioExtractor,

  // Dev Utilities
  'json-formatter-validator':  JsonStudio,
  'markdown-to-html':          MarkdownToHtml,
  'base64-encoder-decoder':    Base64Coder,
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