# NexusForge 🛠️

**NexusForge** is a premium, all-in-one local toolkit for images, documents, videos, and developer utilities. Built with a sleek React frontend and a powerhouse Python FastAPI backend, everything runs directly on your machine—meaning zero cloud uploads and complete data privacy.

The engine features full hardware acceleration via ONNX Runtime and native CUDA, utilizing your local NVIDIA GPU to run state-of-the-art AI models for image upscaling and background removal.

---

## 🚀 Features & Tools

### 🎨 Image & Vision
- **AI Image Upscaler:** Enhance low-resolution images by 4x using a local **Real-ESRGAN** tensor pipeline.
- **Background Remover:** Instantly strip backgrounds from images using AI (`rembg`).
- **Utility Tools:** Format conversion, bulk resizing, compression, color palette extraction, and vision annotation.

### 📄 Document Suite
- **PDF Compressor:** Shrink heavy PDFs using dual-pass image quality reduction and structural deflation.
- **PDF Protector:** Encrypt (AES-256) or decrypt PDF files with a password.
- **PDF to Image:** Extract high-quality PNG archives of every page in a PDF document.
- **Utility Tools:** Word/PPT/Excel to PDF, Merger, Splitter, OCR Scanner, and more.

### 🎥 Video & Audio
- **Video GPX Mapper:** Extract video frames at specific intervals and accurately map them to GPS coordinates from a GPX track, outputting a zipped archive with a `FeatureCollection` GeoJSON.

### 💻 Developer Utilities
- **JSON Studio:** Format, validate, and explore JSON trees.
- **Markdown to HTML:** Live split-pane editor.
- **Base64 Coder:** Instant text/file encoding and decoding.

---

## ⚡ Hardware Acceleration & AI Engine

NexusForge is engineered to squeeze maximum performance out of local NVIDIA hardware (specifically tested on GTX 1650 and above).

- **ONNX GPU Pipeline:** AI models completely bypass the CPU and run directly on the GPU using `onnxruntime-gpu`.
- **Dynamic DLL Pre-loader:** The backend features a custom multi-pass Windows DLL pre-loader that securely locks all required NVIDIA libraries into memory on boot, preventing dependency crashes.
- **Auto-Downloading Models:** On first boot, the engine automatically fetches the required AI models (e.g., Real-ESRGAN ~67MB) directly from Hugging Face community mirrors.

---

## 🛠️ Prerequisites

To run NexusForge locally, ensure you have the following installed:

1. **Node.js** (v18+ recommended)
2. **Python** (v3.10+ recommended)
3. **NVIDIA GPU** (For AI features)
   - **CUDA Toolkit:** v13.x
   - **cuDNN:** v9.x

---

## 📦 Setup & Installation

The project is split into two parts: the Vite/React frontend and the FastAPI/Python backend.

### 1. Start the Backend (FastAPI)

Open a terminal and navigate to the backend directory:

```bash
# Navigate to the backend folder
cd nexusforge-backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt

# Start the Engine
python main.py
```

### 2. Start the Frontend (React + Vite)

Open a second terminal and navigate to the frontend directory:

```bash
# Navigate to the frontend folder
cd nexusforge

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will boot up on `http://localhost:5173`. Open this link in your browser to enter the Forge.

---

## 📚 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend:** Python, FastAPI, Uvicorn.
- **AI & Vision:** onnxruntime-gpu, opencv-python, rembg, numpy.
- **Documents & Spatial:** PyMuPDF (fitz), pypdf, gpxpy.

---

## 📝 License

This project is for personal and educational use. Please ensure you comply with the licenses of the respective open-source models (Real-ESRGAN, rembg) if adapting for commercial purposes.
