import { useState, useEffect } from 'react';
import { TbChevronLeft, TbChevronRight, TbDownload } from 'react-icons/tb';

export default function DocumentViewer({ doc }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState(null);
  const [PdfComponents, setPdfComponents] = useState(null);

  // Lazy-load react-pdf so a pdfjs failure doesn't break the whole app
  useEffect(() => {
    let cancelled = false;
    import('react-pdf')
      .then((mod) => {
        if (cancelled) return;
        const { Document, Page, pdfjs } = mod;
        // Use CDN worker to avoid Vite bundling issues with pdfjs-dist
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
        // Also import the CSS layers
        import('react-pdf/dist/Page/AnnotationLayer.css').catch(() => {});
        import('react-pdf/dist/Page/TextLayer.css').catch(() => {});
        setPdfComponents({ Document, Page });
      })
      .catch((err) => {
        if (!cancelled) setPdfError('PDF viewer failed to load: ' + err.message);
      });
    return () => { cancelled = true; };
  }, []);

  if (pdfError) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-950 text-surface-400 flex-col gap-4 p-8">
        <p className="text-lg font-semibold text-red-400">PDF Viewer Error</p>
        <p className="text-sm text-center">{pdfError}</p>
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">
            <TbDownload size={16} /> Download PDF
          </a>
        )}
      </div>
    );
  }

  if (!PdfComponents) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-950">
        <div className="w-8 h-8 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { Document, Page } = PdfComponents;

  return (
    <div className="h-full flex flex-col bg-surface-800">
      <div className="h-12 bg-surface-900 border-b border-surface-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-1.5 hover:bg-surface-800 rounded disabled:opacity-50 text-surface-200"
          >
            <TbChevronLeft />
          </button>
          <span className="text-sm text-surface-300">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <button 
            onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
            disabled={pageNumber >= numPages}
            className="p-1.5 hover:bg-surface-800 rounded disabled:opacity-50 text-surface-200"
          >
            <TbChevronRight />
          </button>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="text-sm text-surface-300 hover:text-white px-2">-</button>
           <span className="text-sm text-surface-300">{Math.round(scale * 100)}%</span>
           <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="text-sm text-surface-300 hover:text-white px-2">+</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex justify-center p-6 bg-surface-950">
        <Document
          file={doc.url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(err) => setPdfError(err.message)}
          loading={<div className="text-surface-400 pt-8">Loading PDF...</div>}
          className="shadow-xl"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
