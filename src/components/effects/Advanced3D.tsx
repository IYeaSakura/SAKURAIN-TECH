import { memo, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll, useSpring as useScrollSpring } from 'framer-motion';

// ==================== 3D翻转卡片 ====================
export const FlipCard3D = memo(({
  front,
  back,
  className = '',
  width = 300,
  height = 400,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      style={{ width, height, perspective: 1000 }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
      >
        {/* 正面 */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        
        {/* 背面 */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
});

// ==================== 3D立方体 ====================
export const Cube3D = memo(({
  faces,
  size = 200,
  autoRotate = true,
}: {
  faces: { front: React.ReactNode; back: React.ReactNode; left: React.ReactNode; right: React.ReactNode; top: React.ReactNode; bottom: React.ReactNode };
  size?: number;
  autoRotate?: boolean;
}) => {
  const [rotation, setRotation] = useState({ x: -30, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;
    
    setRotation(prev => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5,
    }));
    
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = () => setIsDragging(false);

  const halfSize = size / 2;

  return (
    <div
      className="relative"
      style={{ 
        width: size, 
        height: size, 
        perspective: 800,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: autoRotate && !isDragging ? [rotation.x, rotation.x + 360] : rotation.x,
          rotateY: autoRotate && !isDragging ? [rotation.y, rotation.y + 360] : rotation.y,
        }}
        transition={autoRotate && !isDragging ? { duration: 20, repeat: Infinity, ease: 'linear' } : { type: 'spring' }}
      >
        {Object.entries(faces).map(([face, content]) => {
          const transforms: Record<string, string> = {
            front: `translateZ(${halfSize}px)`,
            back: `rotateY(180deg) translateZ(${halfSize}px)`,
            left: `rotateY(-90deg) translateZ(${halfSize}px)`,
            right: `rotateY(90deg) translateZ(${halfSize}px)`,
            top: `rotateX(90deg) translateZ(${halfSize}px)`,
            bottom: `rotateX(-90deg) translateZ(${halfSize}px)`,
          };

          return (
            <div
              key={face}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: transforms[face],
                backfaceVisibility: 'hidden',
                background: 'var(--bg-card)',
                border: '2px solid var(--border-subtle)',
              }}
            >
              {content}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
});

// ==================== 视差滚动层 ====================
export const ParallaxLayer = memo(({
  children,
  speed = 0.5,
  className = '',
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -200 * speed]);
  const smoothY = useScrollSpring(y, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y: smoothY }}>
        {children}
      </motion.div>
    </div>
  );
});

// ==================== 3D倾斜卡片 ====================
export const TiltCard3D = memo(({
  children,
  className = '',
  maxTilt = 15,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  }, [x, y]);

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const glareX = useTransform(x, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(y, [-0.5, 0.5], [0, 100]);

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
        
        {glare && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-inherit overflow-hidden"
            style={{
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%, transparent 100%)',
                x: glareX,
                y: glareY,
                transform: 'translate(-50%, -50%)',
                width: '200%',
                height: '200%',
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});

// ==================== 3D轮播 ====================
export const Carousel3D = memo(({
  items,
  className = '',
  radius = 300,
  autoRotate = true,
  rotateSpeed = 30,
}: {
  items: React.ReactNode[];
  className?: string;
  radius?: number;
  autoRotate?: boolean;
  rotateSpeed?: number;
}) => {
  const [rotation] = useState(0);
  const itemCount = items.length;
  const anglePerItem = 360 / itemCount;

  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        perspective: 1000,
        height: 400,
      }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={autoRotate ? { rotateY: [0, 360] } : { rotateY: rotation }}
        transition={autoRotate ? { duration: rotateSpeed, repeat: Infinity, ease: 'linear' } : { type: 'spring' }}
      >
        {items.map((item, i) => {
          const angle = i * anglePerItem;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                left: -100,
                top: -150,
                width: 200,
              }}
            >
              {item}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
});

// ==================== 深度层叠 ====================
export const DepthLayers = memo(({
  layers,
  className = '',
}: {
  layers: Array<{ content: React.ReactNode; depth: number; blur?: number }>;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
    >
      {layers.map((layer, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{
            filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
          }}
          animate={{
            x: mousePos.x * layer.depth * 50,
            y: mousePos.y * layer.depth * 50,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        >
          {layer.content}
        </motion.div>
      ))}
    </div>
  );
});

// ==================== 滚动揭示3D ====================
export const ScrollReveal3D = memo(({
  children,
  className = '',
  direction = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const transforms: Record<string, { x?: any; y?: any; rotateX?: any; rotateY?: any; opacity?: any }> = {
    up: {
      y: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]),
      rotateX: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [45, 0, 0, -45]),
      opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
    },
    down: {
      y: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-100, 0, 0, 100]),
      rotateX: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-45, 0, 0, 45]),
      opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
    },
    left: {
      x: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]),
      rotateY: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-45, 0, 0, 45]),
      opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
    },
    right: {
      x: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-100, 0, 0, 100]),
      rotateY: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [45, 0, 0, -45]),
      opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
    },
  };

  const t = transforms[direction];

  return (
    <div ref={ref} className={`relative ${className}`} style={{ perspective: 1000 }}>
      <motion.div
        style={{
          x: t.x,
          y: t.y,
          rotateX: t.rotateX,
          rotateY: t.rotateY,
          opacity: t.opacity,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
});

// Display names
FlipCard3D.displayName = 'FlipCard3D';
Cube3D.displayName = 'Cube3D';
ParallaxLayer.displayName = 'ParallaxLayer';
TiltCard3D.displayName = 'TiltCard3D';
Carousel3D.displayName = 'Carousel3D';
DepthLayers.displayName = 'DepthLayers';
ScrollReveal3D.displayName = 'ScrollReveal3D';
