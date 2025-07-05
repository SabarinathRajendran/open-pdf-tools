/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Crop, Download, FileText, Scissors, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from './assets/logo.svg';

const PDFCropper = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [cropArea, setCropArea] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pageSelection, setPageSelection] = useState('current');
  const [customPages, setCustomPages] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [originalImageData, setOriginalImageData] = useState(null);
  const [pageViewports, setPageViewports] = useState({});
  const [renderScale] = useState(1.5); // Keep scale consistent
  const [mode, setMode] = useState(null);

  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Load PDF.js and PDF-lib
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    };
    document.head.appendChild(script);

    const pdfLibScript = document.createElement('script');
    pdfLibScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
    document.head.appendChild(pdfLibScript);
    
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
      if (document.head.contains(pdfLibScript)) document.head.removeChild(pdfLibScript);
    };
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setPdfFile(file);
    setIsProcessing(true);

    try {
      if (!window.pdfjsLib) {
        throw new Error('PDF.js not loaded');
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        await loadPage(pdf, i);
      }

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(0);
      setCropArea(null);
      
      setTimeout(() => {
        loadPage(pdf, 1);
      }, 100); // 100–200ms is usually enough
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF file. Please make sure PDF.js is loaded.');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPage = async (pdf, pageNumber) => {
    if (!pdf || pageNumber < 1 || pageNumber > pdf.numPages) return;
    
    setIsLoadingPage(true);
    
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: renderScale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Store viewport info for later use in cropping
      setPageViewports(prev => ({
        ...prev,
        [pageNumber]: {
          ...viewport,
          originalWidth: viewport.width / renderScale,  // Store original dimensions
          originalHeight: viewport.height / renderScale,
          scale: renderScale
        }
      }));
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Store the original image data after rendering
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageData(imageData);
      
    } catch (error) {
      console.error('Error rendering page:', error);
    } finally {
      setIsLoadingPage(false);
    }
  };

  // Load new page when current page changes
  useEffect(() => {
    if (pdfDocument && currentPage >= 0) {
      loadPage(pdfDocument, currentPage + 1);
      setCropArea(null); // Reset crop area when changing pages
    }
  }, [currentPage, pdfDocument]);

  const getMousePosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Get the actual displayed size of the canvas
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Get the internal canvas size
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate scale factors
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;
    
    // Calculate mouse position relative to canvas
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    return {
      x: clientX * scaleX,
      y: clientY * scaleY
    };
  };

  const getResizeHandle = (pos) => {
    if (!cropArea) return null;
    
    const handles = [
      { name: 'nw', x: cropArea.x, y: cropArea.y },
      { name: 'ne', x: cropArea.x + cropArea.width, y: cropArea.y },
      { name: 'sw', x: cropArea.x, y: cropArea.y + cropArea.height },
      { name: 'se', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
      { name: 'n', x: cropArea.x + cropArea.width / 2, y: cropArea.y },
      { name: 's', x: cropArea.x + cropArea.width / 2, y: cropArea.y + cropArea.height },
      { name: 'w', x: cropArea.x, y: cropArea.y + cropArea.height / 2 },
      { name: 'e', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height / 2 }
    ];
    
    const handleSize = 30; // Increased handle size for better interaction
    
    for (const handle of handles) {
      if (
        pos.x >= handle.x - handleSize &&
        pos.x <= handle.x + handleSize &&
        pos.y >= handle.y - handleSize &&
        pos.y <= handle.y + handleSize
      ) {
        return handle.name;
      }
    }
    
    return null;
  };

  const isInsideCropArea = (pos) => {
    if (!cropArea) return false;
    
    return (
      pos.  x >= cropArea.x &&
      pos.x <= cropArea.x + cropArea.width &&
      pos.y >= cropArea.y &&
      pos.y <= cropArea.y + cropArea.height
    );
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePosition(e);
    const handle = getResizeHandle(pos);
    
    if (handle) {
      setMode('resize');
      setResizeHandle(handle);
      setDragStart(pos);
    } else if (isInsideCropArea(pos)) {
      // Move existing crop area
      setMode('move');
      setDragStart({ x: pos.x - cropArea.x, y: pos.y - cropArea.y });
    } else {
      // Create new crop area
      setMode('create');
      setDragStart(pos);
      setCropArea({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const handleCanvasMouseMove = (e) => {
    const pos = getMousePosition(e);
    const canvas = canvasRef.current;
    
    // Update cursor based on position
    if (mode !== 'move' && mode !== 'resize') {
      const handle = getResizeHandle(pos);
      if (handle) {
        const cursors = {
          'nw': 'nw-resize', 'ne': 'ne-resize', 'sw': 'sw-resize', 'se': 'se-resize',
          'n': 'n-resize', 's': 's-resize', 'w': 'w-resize', 'e': 'e-resize'
        };
        canvas.style.cursor = cursors[handle];
      } else if (isInsideCropArea(pos)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }
    

    if (mode === 'resize' && cropArea) {        // RESIZE ---------
      const newCropArea = { ...cropArea };
      
      switch (resizeHandle) {
        case 'nw':
          newCropArea.width += newCropArea.x - pos.x;
          newCropArea.height += newCropArea.y - pos.y;
          newCropArea.x = pos.x;
          newCropArea.y = pos.y;
          break;
        case 'ne':
          newCropArea.width = pos.x - newCropArea.x;
          newCropArea.height += newCropArea.y - pos.y;
          newCropArea.y = pos.y;
          break;
        case 'sw':
          newCropArea.width += newCropArea.x - pos.x;
          newCropArea.height = pos.y - newCropArea.y;
          newCropArea.x = pos.x;
          break;
        case 'se':
          newCropArea.width = pos.x - newCropArea.x;
          newCropArea.height = pos.y - newCropArea.y;
          break;
        case 'n':
          newCropArea.height += newCropArea.y - pos.y;
          newCropArea.y = pos.y;
          break;
        case 's':
          newCropArea.height = pos.y - newCropArea.y;
          break;
        case 'w':
          newCropArea.width += newCropArea.x - pos.x;
          newCropArea.x = pos.x;
          break;
        case 'e':
          newCropArea.width = pos.x - newCropArea.x;
          break;
      }
      
      // Ensure minimum size and bounds
      newCropArea.width = Math.max(10, newCropArea.width);
      newCropArea.height = Math.max(10, newCropArea.height);
      newCropArea.x = Math.max(0, Math.min(newCropArea.x, canvas.width - newCropArea.width));
      newCropArea.y = Math.max(0, Math.min(newCropArea.y, canvas.height - newCropArea.height));
      
      setCropArea(newCropArea);

    } else if (mode === 'move' && cropArea) {   // MOVE -----------
      const newX = Math.max(0, Math.min(pos.x - dragStart.x, canvas.width  - cropArea.width));
      const newY = Math.max(0, Math.min(pos.y - dragStart.y, canvas.height - cropArea.height));
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));

    } else if (mode === 'create') {             // CREATE ---------
      // Create new crop area
      const newCropArea = {
        x: Math.min(dragStart.x, pos.x),
        y: Math.min(dragStart.y, pos.y),
        width: Math.abs(pos.x - dragStart.x),
        height: Math.abs(pos.y - dragStart.y)
      };
      
      // Ensure bounds
      newCropArea.x = Math.max(0, newCropArea.x);
      newCropArea.y = Math.max(0, newCropArea.y);
      newCropArea.width = Math.min(newCropArea.width, canvas.width - newCropArea.x);
      newCropArea.height = Math.min(newCropArea.height, canvas.height - newCropArea.y);
      
      setCropArea(newCropArea);
    }
  };

  const handleCanvasMouseUp = () => {
    // setIsDragging(false);
    // setIsResizing(false);
    // setResizeHandle(null);
    setMode(null);
    setResizeHandle(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair';
    }
  };

  // Separate function to render only the crop overlay without reloading the page
  const renderCropOverlay = useCallback(() => {
    if (!canvasRef.current || !originalImageData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Restore the original image first
    ctx.putImageData(originalImageData, 0, 0);
    
    // Only draw overlay if there's a crop area
    if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clear the crop area
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      
      // Reset composite operation and draw crop border
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.setLineDash([]);
      
      // Draw resize handles
      const handles = [
        { x: cropArea.x, y: cropArea.y },
        { x: cropArea.x + cropArea.width, y: cropArea.y },
        { x: cropArea.x, y: cropArea.y + cropArea.height },
        { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
        { x: cropArea.x + cropArea.width / 2, y: cropArea.y },
        { x: cropArea.x + cropArea.width / 2, y: cropArea.y + cropArea.height },
        { x: cropArea.x, y: cropArea.y + cropArea.height / 2 },
        { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height / 2 }
      ];
      
      ctx.fillStyle = '#3b82f6';
      handles.forEach(handle => {
        ctx.fillRect(handle.x - 6, handle.y - 6, 10, 10);
      });
      
      // Add white border to handles for better visibility
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      handles.forEach(handle => {
        ctx.fillRect(handle.x - 6, handle.y - 6, 10, 10);
      });
    }
  }, [cropArea, originalImageData]);

  // Only re-render overlay when crop area changes
  useEffect(() => {
    renderCropOverlay();
  }, [renderCropOverlay]);

  const downloadPDF = (pdfBytes, filename) => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCrop = async () => {
    if (!cropArea || !pdfFile || !window.PDFLib) {
      alert('Please select a crop area first and ensure PDF-lib is loaded');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Parse page selection
      let pagesToCrop = [];
      
      if (pageSelection === 'current') {
        pagesToCrop = [currentPage + 1];
      } else if (pageSelection === 'all') {
        pagesToCrop = Array.from({ length: totalPages }, (_, i) => i + 1);
      } else if (pageSelection === 'custom') {
        const pages = customPages.split(',').map(p => {
          const trimmed = p.trim();
          if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(n => parseInt(n));
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
          } else {
            return parseInt(trimmed);
          }
        }).flat().filter(p => p >= 1 && p <= totalPages);
        pagesToCrop = pages;
      }

      if (pagesToCrop.length === 0) {
        alert('No valid pages selected');
        return;
      }

      // Read the original PDF file
      const originalPdfBytes = await pdfFile.arrayBuffer();
      const originalPdf = await window.PDFLib.PDFDocument.load(originalPdfBytes);
      
      // Create a new PDF document
      const croppedPdf = await window.PDFLib.PDFDocument.create();
      
      // Get the viewport of the current page to calculate scale
      const currentViewport = pageViewports[currentPage + 1];
      if (!currentViewport) {
        throw new Error('Viewport information not available');
      }

      /* ---  Crop the selected pages  --- */
      for (const pageNum of pagesToCrop) {
        const [originalPage] = await croppedPdf.copyPages(originalPdf, [pageNum - 1]);
        const vp = pageViewports[pageNum];           // saved when we rendered
        if (!vp) continue;

        const { width: pageW, height: pageH } = originalPage.getSize();
        const rot = (originalPage.getRotation().angle ?? 0) % 360;

        // Real pixel-to-point factors for this page
        const sx = vp.width  / pageW;
        const sy = vp.height / pageH;

        // Canvas rectangle (top-left & bottom-right)
        const dx1 = cropArea.x;
        const dy1 = cropArea.y;
        const dx2 = cropArea.x + cropArea.width;
        const dy2 = cropArea.y + cropArea.height;

        // Convert *one* canvas point → PDF point, respecting rotation
        const toPdf = (dx, dy) => {
          switch (rot) {
            case 0:   return [               dx / sx,  pageH - dy / sy];
            case 90:  return [               dy / sy,           dx / sx];
            case 180: return [  pageW - dx / sx,           dy / sy];
            case 270: return [  pageH - dy / sy,  pageW - dx / sx];
            default:  return [               dx / sx,  pageH - dy / sy];
          }
        };

        const [x1, y1] = toPdf(dx1, dy1);
        const [x2, y2] = toPdf(dx2, dy2);

        const left   = Math.max(0,         Math.min(x1, x2));
        const right  = Math.min(pageW,     Math.max(x1, x2));
        const bottom = Math.max(0,         Math.min(y1, y2));
        const top    = Math.min(pageH,     Math.max(y1, y2));

        if (right - left < 2 || top - bottom < 2) continue; // skip 1-pt slivers

        const widthPts  = right - left;
        const heightPts = top   - bottom;

        originalPage.setCropBox(left, bottom, widthPts, heightPts);
        originalPage.setMediaBox(left, bottom, widthPts, heightPts);

        croppedPdf.addPage(originalPage);
      }

      
      // Generate the PDF bytes
      const croppedPdfBytes = await croppedPdf.save();
      
      // Create filename
      const originalName = pdfFile.name.replace('.pdf', '');
      const filename = `${originalName}_cropped.pdf`;
      
      // Download the cropped PDF
      downloadPDF(croppedPdfBytes, filename);
      
      // alert(`Successfully cropped ${pagesToCrop.length} pages and downloaded as ${filename}!`);
      
    } catch (error) {
      console.error('Error cropping PDF:', error);
      alert('Error cropping PDF: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };


  const handlePointerDown = (e) => {
    // enable capture so moves outside still get events:
    e.currentTarget.setPointerCapture(e.pointerId);
    handleCanvasMouseDown(e);
  };

  const handlePointerMove = (e) => {
    handleCanvasMouseMove(e);
  };

  const handlePointerUp = (e) => {
    // release capture
    e.currentTarget.releasePointerCapture(e.pointerId);
    handleCanvasMouseUp();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={Logo} alt="Logo" width={80} height={80} />
            <h1 className="text-4xl font-bold text-gray-800">PDF Cropper</h1>
          </div>
          <p className="text-gray-600 text-lg">Upload, preview, and crop your PDF pages with precision</p>
        </div>

        {/* Upload Section */}
        {!pdfFile && (
          <div className="max-w-2xl mx-auto mb-8 animate-slide-up">
            <div 
              className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center bg-white/70 backdrop-blur-sm hover:border-blue-400 transition-all duration-300 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-12 h-12 text-blue-600 mx-auto" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">Upload Your PDF</h3>
              <p className="text-gray-600 mb-6">Click here or drag and drop your PDF file</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                <FileText className="w-5 h-5" />
                Choose PDF File
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* PDF Viewer and Cropper */}
        {pdfFile && (
          <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
            {/* PDF Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Crop className="w-6 h-6 text-blue-600" />
                    PDF Preview
                  </h2>
                  
                  {/* Page Navigation */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0 || isLoadingPage}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1 || isLoadingPage}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 relative" ref={containerRef}>
                  {isLoadingPage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Loading page...</span>
                      </div>
                    </div>
                  )}
                  
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto cursor-crosshair block mx-auto"  
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    /* Prevent touch scrolling/pinch-zoom on the canvas itself */
                    style={{ touchAction: 'none', userSelect: 'none' }}
                  />
                  
                  {mode === 'move' && (
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium z-10">
                      {cropArea && cropArea.width > 0 ? 'Moving crop area' : 'Drag to select crop area'}
                    </div>
                  )}
                  
                  {mode === 'resize'  && (
                    <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium z-10">
                      Resizing crop area
                    </div>
                  )}
                  
                  {cropArea && cropArea.width > 5 && cropArea.height > 5 && mode !== 'move' && mode !== 'resize' && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium z-10">
                      Selected: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Crop Controls */}
            <div className="space-y-6">
              {/* Crop Settings */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-blue-600" />
                  Crop Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Apply crop to:</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pageSelection"
                          value="current"
                          checked={pageSelection === 'current'}
                          onChange={(e) => setPageSelection(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Current page only</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pageSelection"
                          value="all"
                          checked={pageSelection === 'all'}
                          onChange={(e) => setPageSelection(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">All pages</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pageSelection"
                          value="custom"
                          checked={pageSelection === 'custom'}
                          onChange={(e) => setPageSelection(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Custom pages</span>
                      </label>
                    </div>
                  </div>
                  
                  {pageSelection === 'custom' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page numbers (comma-separated):
                      </label>
                      <input
                        type="text"
                        value={customPages}
                        onChange={(e) => setCustomPages(e.target.value)}
                        placeholder="e.g., 1, 3, 5-7"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use commas for individual pages, hyphens for ranges
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Crop Info */}
                {cropArea && (
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Crop Area Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                        <span>Position:</span>
                        <span>{Math.round(cropArea.x)}, {Math.round(cropArea.y)}</span>
                        </div>
                        <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{Math.round(cropArea.width)} × {Math.round(cropArea.height)}</span>
                        </div>
                        <div className="text-xs text-blue-600 mt-3 p-2 bg-blue-50 rounded">
                        💡 Tip: Click and drag corners/edges to resize, or click inside to move
                        </div>
                    </div>
                    </div>
                )}
    
                {/* Action Buttons */}
                <div className="space-y-4">
                    <button
                    onClick={handleCrop}
                    disabled={!cropArea || isProcessing}
                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
                    >
                    {isProcessing ? (
                        <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                        </>
                    ) : (
                        <>
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Crop & Download PDF
                        </>
                    )}
                    </button>
                    
                    <button
                    onClick={() => {
                        setPdfFile(null);
                        setPdfDocument(null);
                        // setPdfPages([]);
                        setCropArea(null);
                        setCurrentPage(0);
                        setTotalPages(0);
                        setPageSelection('current');
                        setCustomPages('');
                        setOriginalImageData(null);
                    }}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                    Upload New PDF
                    </button>
                </div>
                </div>
            </div>
            )}
        </div>
        
        <style jsx>{`
            @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slide-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
            }
            
            .animate-fade-in {
            animation: fade-in 0.6s ease-out;
            }
            
            .animate-slide-up {
            animation: slide-up 0.8s ease-out;
            }
        `}</style>
        </div>
    );
    };
    
export default PDFCropper;