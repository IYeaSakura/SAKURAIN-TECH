import { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

// 全局 ref 来跟踪音频元素是否已经被连接过
const globalAudioMap = new WeakMap<HTMLAudioElement, {
  context: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
}>();

export function AudioVisualizer({ audioRef, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isInitializedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制频谱条
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    // 获取 CSS 变量颜色
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-primary').trim() || '#3b82f6';
    const secondaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-secondary').trim() || '#8b5cf6';

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height;

      // 创建渐变色
      const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, secondaryColor);

      ctx.fillStyle = gradient;
      
      // 绘制圆角矩形
      const radius = Math.min(barWidth / 2, 4);
      const y = canvas.height - barHeight;
      
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth - 1, barHeight, radius);
      ctx.fill();

      x += barWidth;
      if (x > canvas.width) break;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isInitializedRef.current) return;

    // 检查音频元素是否已经被全局连接过
    const existingConnection = globalAudioMap.get(audio);
    
    if (existingConnection) {
      // 复用现有的连接
      analyserRef.current = existingConnection.analyser;
      isInitializedRef.current = true;
    } else {
      // 创建新的连接
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      try {
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyserRef.current = analyser;
        isInitializedRef.current = true;
        
        // 保存到全局 map
        globalAudioMap.set(audio, {
          context: audioContext,
          analyser,
          source,
        });
      } catch (err) {
        console.error('Audio context init failed:', err);
      }
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [audioRef]);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    if (isPlaying) {
      // 恢复 AudioContext
      const audio = audioRef.current;
      if (audio) {
        const connection = globalAudioMap.get(audio);
        if (connection?.context.state === 'suspended') {
          connection.context.resume();
        }
      }
      draw();
    } else {
      cancelAnimationFrame(animationRef.current);
      // 清空画布
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, draw, audioRef]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={40}
      className="w-full h-10 rounded-lg opacity-80"
      style={{ 
        imageRendering: 'crisp-edges',
      }}
    />
  );
}
