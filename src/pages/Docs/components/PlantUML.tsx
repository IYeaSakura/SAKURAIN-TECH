import { useState, useEffect, useRef, useCallback } from 'react';
import { encode } from 'plantuml-encoder';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// PlantUML Modal Component
function PlantUMLModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const toolbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetView = useCallback(() => { setScale(1); setPosition({ x: 0, y: 0 }); }, []);

  const showToolbarWithTimeout = useCallback(() => {
    setShowToolbar(true);
    if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    toolbarTimeoutRef.current = setTimeout(() => setShowToolbar(false), 3000);
  }, []);

  useEffect(() => {
    showToolbarWithTimeout();
    return () => { if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current); };
  }, [showToolbarWithTimeout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); resetView(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, resetView]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    showToolbarWithTimeout();
    setScale(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    showToolbarWithTimeout();
    if (isDragging) setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={onClose} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)}>
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`} style={{ background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { showToolbarWithTimeout(); setScale(p => Math.max(0.5, p - 0.2)); }} className="p-2 rounded-lg text-white hover:bg-white/20"><ZoomOut className="w-5 h-5" /></button>
        <span className="text-white text-sm min-w-[60px] text-center font-mono">{Math.round(scale * 100)}%</span>
        <button onClick={() => { showToolbarWithTimeout(); setScale(p => Math.min(3, p + 0.2)); }} className="p-2 rounded-lg text-white hover:bg-white/20"><ZoomIn className="w-5 h-5" /></button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button onClick={() => { showToolbarWithTimeout(); resetView(); }} className="p-2 rounded-lg text-white hover:bg-white/20"><RotateCcw className="w-5 h-5" /></button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button onClick={() => { showToolbarWithTimeout(); onClose(); }} className="p-2 rounded-lg text-white hover:bg-white/20"><X className="w-5 h-5" /></button>
      </div>
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm transition-opacity duration-300 ${showToolbar ? 'opacity-100' : 'opacity-0'}`}>滚轮缩放 · 拖拽移动 · ESC 关闭</div>
      <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing" onWheel={handleWheel} onMouseDown={handleMouseDown} onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="PlantUML" className="max-w-none select-none" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }} draggable={false} />
      </div>
    </div>
  );
}

// PlantUML Renderer Component
export const PlantUML = ({ code }: { code: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const renderedRef = useRef<string>('');

  useEffect(() => {
    if (renderedRef.current === code && imageUrl) return;

    const render = async () => {
      try {
        setLoading(true); setError('');
        let cleanCode = code.trim();
        if (!cleanCode.includes('@startuml')) cleanCode = '@startuml\n' + cleanCode;
        if (!cleanCode.includes('@enduml')) cleanCode = cleanCode + '\n@enduml';
        const encoded = encode(cleanCode);
        const url = `https://www.plantuml.com/plantuml/png/${encoded}`;
        const img = new Image();
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); img.src = url; });
        renderedRef.current = code;
        setImageUrl(url);
      } catch (err) { setError('渲染失败'); }
      finally { setLoading(false); }
    };
    render();
  }, [code, imageUrl]);

  if (loading) return <div className="flex items-center justify-center p-8 rounded-lg" style={{ background: 'var(--bg-secondary)' }}><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} /><span className="ml-3" style={{ color: 'var(--text-secondary)' }}>渲染图表...</span></div>;
  if (error || !imageUrl) return <div className="p-4 rounded-lg border text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}><div className="font-medium mb-2">PlantUML 渲染失败</div></div>;

  return (
    <>
      <div className="plantuml-diagram overflow-x-auto rounded-lg border p-4 my-4 text-center cursor-zoom-in hover:opacity-90 transition-opacity" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} onClick={() => setIsModalOpen(true)} title="点击放大查看"><img src={imageUrl} alt="PlantUML" className="inline-block max-w-full" /></div>
      {isModalOpen && <PlantUMLModal imageUrl={imageUrl} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};
