import { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  mode?: 'bars' | 'wave' | 'heatmap';
}

// 全局 ref 来跟踪音频元素是否已经被连接过
const globalAudioMap = new WeakMap<HTMLAudioElement, {
  context: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
}>();

export function AudioVisualizer({ audioRef, isPlaying, mode = 'bars' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isInitializedRef = useRef(false);
  const isActiveRef = useRef(false);
  const colorsRef = useRef({ primary: '#3b82f6', secondary: '#8b5cf6' });
  const modeRef = useRef(mode);

  // 同步 mode ref
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // 绘制柱状图
  const drawBars = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number) => {
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    const { primary: primaryColor, secondary: secondaryColor } = colorsRef.current;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;

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
  }, []);

  // 绘制波形图
  const drawWave = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number) => {
    const { primary: primaryColor, secondary: secondaryColor } = colorsRef.current;
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    // 绘制填充区域
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      const y = canvas.height - (v * canvas.height * 0.8);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth * 2.5;
      if (x > canvas.width) break;
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();

    // 填充渐变
    const fillGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    fillGradient.addColorStop(0, `${primaryColor}80`);
    fillGradient.addColorStop(1, `${secondaryColor}20`);
    ctx.fillStyle = fillGradient;
    ctx.fill();

    // 绘制线条
    x = 0;
    ctx.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      const y = canvas.height - (v * canvas.height * 0.8);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // 使用曲线连接
        const prevX = x - sliceWidth * 2.5;
        const prevV = dataArray[i - 1] / 255;
        const prevY = canvas.height - (prevV * canvas.height * 0.8);
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        ctx.lineTo(x, y);
      }

      x += sliceWidth * 2.5;
      if (x > canvas.width) break;
    }

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = primaryColor;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, []);

  // 绘制热力图
  const drawHeatmap = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number) => {
    const { primary: primaryColor, secondary: secondaryColor } = colorsRef.current;
    
    // 网格配置
    const cols = 12; // 列数
    const rows = 4;  // 行数
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    const gap = 2;
    
    // 采样数据到网格
    for (let col = 0; col < cols; col++) {
      // 从频率数据采样
      const dataIndex = Math.floor((col / cols) * bufferLength);
      const intensity = dataArray[dataIndex] / 255;
      
      // 计算这一列亮起的行数
      const activeRows = Math.max(1, Math.floor(intensity * rows));
      
      for (let row = 0; row < rows; row++) {
        const x = col * cellWidth + gap / 2;
        const y = canvas.height - (row + 1) * cellHeight + gap / 2;
        const w = cellWidth - gap;
        const h = cellHeight - gap;
        
        // 判断这个格子是否应该亮起
        const isActive = row < activeRows;
        
        if (isActive) {
          // 根据高度计算颜色热度（越高的格子越热）
          const heatRatio = (row + 1) / rows;
          
          // 颜色插值 - 从冷色到热色
          let r, g, b;
          if (heatRatio < 0.5) {
            // 冷色区域：深色到主色
            const t = heatRatio * 2;
            r = Math.floor(59 + (parseInt(primaryColor.slice(1, 3), 16) - 59) * t);
            g = Math.floor(130 + (parseInt(primaryColor.slice(3, 5), 16) - 130) * t);
            b = Math.floor(246 + (parseInt(primaryColor.slice(5, 7), 16) - 246) * t);
          } else {
            // 热色区域：主色到副色
            const t = (heatRatio - 0.5) * 2;
            const pr = parseInt(primaryColor.slice(1, 3), 16);
            const pg = parseInt(primaryColor.slice(3, 5), 16);
            const pb = parseInt(primaryColor.slice(5, 7), 16);
            const sr = parseInt(secondaryColor.slice(1, 3), 16);
            const sg = parseInt(secondaryColor.slice(3, 5), 16);
            const sb = parseInt(secondaryColor.slice(5, 7), 16);
            r = Math.floor(pr + (sr - pr) * t);
            g = Math.floor(pg + (sg - pg) * t);
            b = Math.floor(pb + (sb - pb) * t);
          }
          
          const color = `rgb(${r}, ${g}, ${b})`;
          
          // 绘制发光的格子
          ctx.fillStyle = color;
          ctx.shadowBlur = 8 * heatRatio + 2;
          ctx.shadowColor = color;
          ctx.fillRect(x, y, w, h);
          ctx.shadowBlur = 0;
          
          // 内部高光
          ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + heatRatio * 0.3})`;
          ctx.fillRect(x, y, w, h * 0.3);
        } else {
          // 暗色背景格
          ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
          ctx.fillRect(x, y, w, h);
        }
      }
    }
    
    // 整体发光覆盖层
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `${secondaryColor}20`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const draw = useCallback(() => {
    // 使用 ref 检查组件是否仍然活跃，避免在卸载后继续运行
    if (!isActiveRef.current) return;

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

    // 根据当前模式绘制
    const currentMode = modeRef.current;
    if (currentMode === 'bars') {
      drawBars(ctx, canvas, dataArray, bufferLength);
    } else if (currentMode === 'wave') {
      drawWave(ctx, canvas, dataArray, bufferLength);
    } else if (currentMode === 'heatmap') {
      drawHeatmap(ctx, canvas, dataArray, bufferLength);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [drawBars, drawWave, drawHeatmap]);

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

    // 组件挂载时设置为活跃状态
    isActiveRef.current = true;

    // 缓存颜色值，避免每帧强制重排
    const updateColors = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      colorsRef.current = {
        primary: computedStyle.getPropertyValue('--accent-primary').trim() || '#3b82f6',
        secondary: computedStyle.getPropertyValue('--accent-secondary').trim() || '#8b5cf6',
      };
    };
    
    // 初始获取颜色
    updateColors();
    
    // 监听主题变化
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => {
      // 先标记为非活跃，阻止 draw 函数继续递归
      isActiveRef.current = false;
      // 然后取消动画帧
      cancelAnimationFrame(animationRef.current);
      observer.disconnect();
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
      // 确保在活跃状态下才开始绘制
      isActiveRef.current = true;
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
