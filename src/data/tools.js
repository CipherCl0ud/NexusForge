export const toolCategories = [
  {
    id: 'image',
    label: 'Image & Vision',
    iconName: 'ImageIcon',
    color: '#3b82f6',
    tools: [
      { id: 'img-to-pdf',      title: 'Image to PDF',          description: 'Convert JPG, PNG, or WebP images into a single polished PDF document.',       iconName: 'FilePlus2' },
      { id: 'img-format',      title: 'Format Converter',      description: 'Convert between PNG, JPG, WebP, AVIF, and more in seconds.',                  iconName: 'RefreshCw' },
      { id: 'bg-remover',      title: 'Background Remover',    description: 'Instantly remove image backgrounds with AI-powered precision.',                 iconName: 'Scissors'  },
      { id: 'img-upscaler',    title: 'AI Image Upscaler',     description: 'Enhance low-resolution images without losing quality.',                         iconName: 'Zap'       },
      { id: 'img-resizer',     title: 'Bulk Image Resizer',    description: 'Resize multiple images to exact pixel dimensions in seconds.',                  iconName: 'Maximize2' },
      { id: 'img-compressor',  title: 'Image Compressor',      description: 'Compress images for the web without visible quality loss.',                     iconName: 'Archive'   },
      { id: 'color-palette',   title: 'Color Palette',         description: 'Extract dominant colors and hex codes from any image instantly.',               iconName: 'Palette'   },
      { id: 'img-watermark',   title: 'Image Watermarker',     description: 'Stamp custom text or logo watermarks on your images.',                          iconName: 'Droplets'  },
      { id: 'vision-annotator',title: 'Vision Annotator',      description: 'Draw pixel-perfect bounding boxes and polygons for dataset generation.',        iconName: 'Crosshair' }
    ],
  },
  {
    id: 'document',
    label: 'Document Suite',
    iconName: 'FileText',
    color: '#8b5cf6',
    tools: [
      { id: 'word-to-pdf',   title: 'Word to PDF',         description: 'Convert .docx Word files to professional PDF documents.',                    iconName: 'FileText'   },
      { id: 'ppt-to-pdf',    title: 'PPT to PDF',          description: 'Convert PowerPoint presentations to sharp PDF exports.',                     iconName: 'Monitor'    },
      { id: 'excel-to-pdf',  title: 'Excel to PDF',        description: 'Transform Excel spreadsheets into clean, printable PDF files.',              iconName: 'Table2'     },
      { id: 'pdf-to-word',   title: 'PDF to Word',         description: 'Extract and convert PDF content into editable .docx files.',                 iconName: 'FileOutput' },
      { id: 'pdf-to-img',    title: 'PDF to Image',        description: 'Export every PDF page as a high-quality PNG or JPG.',                        iconName: 'FileImage'  },
      { id: 'pdf-merger',    title: 'PDF Merger',          description: 'Combine multiple PDF files into one seamless document.',                     iconName: 'GitMerge'   },
      { id: 'pdf-splitter',  title: 'PDF Splitter',        description: 'Split a large PDF into individual pages or custom page ranges.',             iconName: 'Scissors'   },
      { id: 'pdf-compress',  title: 'PDF Compressor',      description: 'Shrink heavy PDFs while preserving their visual quality.',                   iconName: 'Archive'    },
      { id: 'ocr-scanner',   title: 'OCR Scanner',         description: 'Extract editable text from scanned documents, screenshots, and photos.',     iconName: 'Scan'       },
      { id: 'pdf-annotator', title: 'PDF Annotator',       description: 'Add text boxes, drawings, and highlights to any PDF.',                       iconName: 'PenLine'    },
      { id: 'e-signature',   title: 'E-Signature',         description: 'Draw, type, or upload a signature and stamp it on your PDFs.',               iconName: 'Pen'        },
      { id: 'pdf-watermark', title: 'PDF Watermarker',     description: 'Apply text or image watermarks across all PDF pages.',                       iconName: 'Droplets'   },
      { id: 'pdf-pages',     title: 'PDF Page Manager',    description: 'Reorder, rotate, or delete pages with a visual drag editor.',                iconName: 'LayoutGrid' },
      { id: 'doc-protect',   title: 'Doc Protection',      description: 'Encrypt or decrypt PDF files with password protection in-browser.',          iconName: 'Lock'       },
    ],
  },
  {
    id: 'video',
    label: 'Video & Audio',
    iconName: 'Film',
    color: '#ec4899',
    tools: [
      { id: 'video-frames',  title: 'Video to Images',     description: 'Extract image frames from any video at custom time intervals.',               iconName: 'Film'    },
      { id: 'video-gif',     title: 'Video to GIF',        description: 'Convert video clips into animated GIFs with frame-rate control.',             iconName: 'Play'    },
      { id: 'audio-extract', title: 'Audio Extractor',     description: 'Pull the MP3 audio track out of any MP4 video file.',                         iconName: 'Music'   },
      
      // ─── NEW GPX TOOL ADDED HERE ───
      { id: 'video-gpx',     title: 'Video GPX Mapper',    description: 'Extract video frames mapped to GPX spatial data.',                            iconName: 'Map'     },
    ],
  },
  {
    id: 'dev',
    label: 'Dev Utilities',
    iconName: 'Terminal',
    color: '#10b981',
    tools: [
      { id: 'json-studio', title: 'JSON Studio',          description: 'Format, validate, and explore JSON with an interactive tree viewer.',         iconName: 'Braces'   },
      { id: 'md-to-html',  title: 'Markdown to HTML',     description: 'Convert Markdown to HTML with a live split-pane preview.',                  iconName: 'FileCode' },
      { id: 'base64',      title: 'Base64 Coder',         description: 'Encode or decode any text or file into Base64 format instantly.',             iconName: 'Hash'     },
    ],
  },
];

export const allTools = toolCategories.flatMap(cat =>
  cat.tools.map(tool => ({ ...tool, categoryId: cat.id, categoryLabel: cat.label, categoryColor: cat.color }))
);