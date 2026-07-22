import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useImagePreview } from '@/contexts/ImagePreviewContext';

interface ImageModalProps {
  imageUrl: string;
  alt?: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, alt = '', onClose }: ImageModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const toolbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setIsPreviewOpen } = useImagePreview();

  const resetView = useCallback(() => { 
    setScale(1); 
    setPosition({ x: 0, y: 0 }); 
  }, []);

  const showToolbarWithTimeout = useCallback(() => {
    setShowToolbar(true);
    if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    toolbarTimeoutRef.current = setTimeout(() => setShowToolbar(false), 3000);
  }, []);

  useEffect(() => {
    showToolbarWithTimeout();
    return () => { 
      if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current); 
    };
  }, [showToolbarWithTimeout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) { 
        e.preventDefault(); 
        resetView(); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, resetView]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setIsPreviewOpen(true);
    return () => { 
      document.body.style.overflow = ''; 
      setIsPreviewOpen(false);
    };
  }, [setIsPreviewOpen]);

  // Global mouse event handlers for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      setPosition({ 
        x: e.clientX - dragStart.current.x, 
        y: e.clientY - dragStart.current.y 
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showToolbarWithTimeout();
    setScale(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStart.current = { 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    };
    setIsDragging(true);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center" 
      style={{ background: 'rgba(0,0,0,0.9)' }} 
      onClick={onClose}
    >
      {/* Toolbar */}
      <div 
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
          showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`} 
        style={{ 
          background: 'rgba(30,30,30,0.95)', 
          border: '1px solid rgba(255,255,255,0.2)', 
          backdropFilter: 'blur(10px)' 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => { showToolbarWithTimeout(); setScale(p => Math.max(0.5, p - 0.2)); }} 
          className="p-2 rounded-lg text-white hover:bg-white/20"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white text-sm min-w-[60px] text-center font-mono">
          {Math.round(scale * 100)}%
        </span>
        <button 
          onClick={() => { showToolbarWithTimeout(); setScale(p => Math.min(3, p + 0.2)); }} 
          className="p-2 rounded-lg text-white hover:bg-white/20"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button 
          onClick={() => { showToolbarWithTimeout(); resetView(); }} 
          className="p-2 rounded-lg text-white hover:bg-white/20"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button 
          onClick={() => { showToolbarWithTimeout(); onClose(); }} 
          className="p-2 rounded-lg text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Hint text */}
      <div 
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm transition-opacity duration-300 ${
          showToolbar ? 'opacity-100' : 'opacity-0'
        }`}
      >
        滚轮缩放 · 拖拽移动 · ESC 关闭
      </div>

      {/* Image container */}
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing" 
        onWheel={handleWheel} 
        onMouseDown={handleMouseDown} 
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt={alt} 
          className="max-w-none select-none" 
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
            transition: isDragging ? 'none' : 'transform 0.1s ease-out' 
          }} 
          draggable={false} 
        />
      </div>
    </div>
  );
}

// Wrapper component for clickable images
export function ClickableImage({ src, alt }: { src?: string; alt?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <div className="overflow-x-auto my-4" style={{ maxWidth: '100%' }}>
        <img 
          src={src} 
          alt={alt || ''} 
          className="max-w-full rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
          onClick={() => setIsModalOpen(true)}
        />
      </div>
      {isModalOpen && (
        <ImageModal 
          imageUrl={src} 
          alt={alt} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}
