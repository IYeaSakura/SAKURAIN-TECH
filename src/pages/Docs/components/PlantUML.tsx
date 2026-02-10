import { useState, useEffect, useRef } from 'react';
import { encode } from 'plantuml-encoder';
import { ImageModal } from './ImageModal';

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
      {isModalOpen && <ImageModal imageUrl={imageUrl} alt="PlantUML" onClose={() => setIsModalOpen(false)} />}
    </>
  );
};
