import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker src using CDN matching installed version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface PdfDocumentInfo {
  numPages: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
}

/**
 * Load a PDF file into pdfjs
 */
export async function loadPdfDocument(file: File): Promise<PdfDocumentInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  return {
    numPages: pdfDoc.numPages,
    pdfDoc,
  };
}

/**
 * Render a specific page of a PDF document to a data URL image
 */
export async function renderPdfPageToDataUrl(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 2.0 // High res default
): Promise<{ dataUrl: string; width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) {
    throw new Error('Could not create canvas context for PDF rendering');
  }

  const renderContext = {
    canvasContext: context,
    canvas: canvas,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  const dataUrl = canvas.toDataURL('image/png');
  // Return unscaled original dimensions for layout calculations
  const originalViewport = page.getViewport({ scale: 1.0 });

  return {
    dataUrl,
    width: originalViewport.width,
    height: originalViewport.height,
  };
}
