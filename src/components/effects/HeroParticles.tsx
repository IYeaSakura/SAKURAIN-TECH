import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  baseY: number;
  angle: number;
  speed: number;
  radius: number;
  color: string;
  strand: number;
  index: number;
  opacity: number;
  pulsePhase: number;
}

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Theme-aware colors - bright and visible on dark background
  const getColors = useCallback((time: number) => {
    // Dynamic color palette that shifts over time - high brightness for visibility
    const hueShift = (time * 15) % 360;
    return [
      `hsla(${200 + hueShift * 0.1}, 90%, 70%, 1)`,    // Bright blue
      `hsla(${160 + hueShift * 0.15}, 85%, 65%, 1)`,   // Bright teal
      `hsla(${280 + hueShift * 0.1}, 85%, 75%, 1)`,    // Bright purple
      `hsla(${320 + hueShift * 0.12}, 80%, 70%, 1)`,   // Bright pink
      `hsla(${40 + hueShift * 0.08}, 90%, 65%, 1)`,    // Bright gold
      `hsla(${180 + hueShift * 0.1}, 85%, 60%, 1)`,    // Bright cyan
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resize
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking for interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Initialize particles - Two intertwined helices
    const particleCount = 120;
    const strands = 2;
    particlesRef.current = [];

    const centerY = window.innerHeight / 2;
    
    for (let strand = 0; strand < strands; strand++) {
      for (let i = 0; i < particleCount / strands; i++) {
        const progress = i / (particleCount / strands);
        const x = progress * window.innerWidth;
        
        particlesRef.current.push({
          x,
          y: centerY,
          baseY: centerY,
          angle: progress * Math.PI * 6 + (strand * Math.PI), // 3 full rotations
          speed: 0.008 + Math.random() * 0.004,
          radius: 3 + Math.random() * 2.5,
          color: '', // Will be set in animate
          strand,
          index: i,
          opacity: 0.6 + Math.random() * 0.4,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Sort by strand then index for proper line connections
    particlesRef.current.sort((a, b) => {
      if (a.strand !== b.strand) return a.strand - b.strand;
      return a.index - b.index;
    });

    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;
      const colors = getColors(time);
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      const centerY = height / 2;
      
      // Clear with trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, width, height);

      // Wave parameters
      const amplitude = Math.min(height * 0.25, 180);
      const frequency = 3; // Number of wave cycles
      const flowSpeed = time * 0.8;

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Dynamic color based on position and time
        const colorIndex = (particle.index + Math.floor(time * 2)) % colors.length;
        particle.color = colors[colorIndex];
        
        // Update angle for wave motion
        particle.angle += particle.speed;
        
        // Calculate helical wave position
        // Primary sine wave
        const wave1 = Math.sin(particle.angle * frequency + flowSpeed) * amplitude;
        // Secondary smaller wave for complexity
        const wave2 = Math.sin(particle.angle * frequency * 2 + flowSpeed * 1.5) * (amplitude * 0.3);
        
        // Strand offset (double helix)
        const strandOffset = particle.strand === 0 ? 1 : -1;
        
        // Combine waves
        particle.y = centerY + (wave1 + wave2) * strandOffset;
        
        // Horizontal flow - particles drift left
        particle.x -= 0.8;
        
        // Wrap around with smooth transition
        if (particle.x < -100) {
          particle.x = width + 100;
          // Reset angle for seamless loop
          particle.angle = particle.index / (particleCount / strands) * Math.PI * 6 + (particle.strand * Math.PI);
        }
        
        // Mouse interaction - particles avoid mouse
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          particle.y -= (dy / dist) * force * 30;
        }

        // Pulsing opacity
        const pulse = Math.sin(time * 2 + particle.pulsePhase) * 0.3 + 0.7;
        const currentOpacity = particle.opacity * pulse;

        // Draw glow - enhanced for visibility
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.radius * 6
        );
        gradient.addColorStop(0, particle.color.replace('1)', `${currentOpacity})`));
        gradient.addColorStop(0.3, particle.color.replace('1)', `${currentOpacity * 0.6})`));
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace('1)', '1)');
        ctx.fill();

        // Draw connections within same strand
        const strandParticles = particlesRef.current.filter(p => p.strand === particle.strand);
        const nextParticle = strandParticles.find(p => p.index === particle.index + 1);
        
        if (nextParticle) {
          const dx = nextParticle.x - particle.x;
          const dy = nextParticle.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(nextParticle.x, nextParticle.y);
            ctx.strokeStyle = particle.color.replace('1)', `${currentOpacity * 0.3})`);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // Draw cross-strand connections for helix effect
        const crossParticle = particlesRef.current.find(
          p => p.strand !== particle.strand && p.index === particle.index
        );
        
        if (crossParticle) {
          const dx = crossParticle.x - particle.x;
          const dy = crossParticle.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(crossParticle.x, crossParticle.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * currentOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Draw flowing energy waves in background
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = colors[i].replace('1)', '0.15)');
        ctx.lineWidth = 2;
        
        for (let x = 0; x < width; x += 10) {
          const y = centerY + 
            Math.sin((x * 0.01) + time * (0.5 + i * 0.2) + i * 2) * (amplitude * 0.5) +
            Math.sin((x * 0.02) + time * (0.3 + i * 0.1)) * (amplitude * 0.25);
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [getColors]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #0a0a1a 50%, #000000 100%)',
      }}
    />
  );
}
