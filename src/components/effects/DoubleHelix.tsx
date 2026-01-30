import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  baseY: number;
  angle: number;
  speed: number;
  radius: number;
  color: string;
  phase: number;
}

export function DoubleHelix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Theme colors
    const colors = [
      '#0E639C', // accent-primary
      '#569CD6', // accent-tertiary
      '#6A9955', // accent-secondary
      '#4EC9B0', // success
      '#CE9178', // warning
    ];

    // Initialize particles for double helix
    const particleCount = 80;
    const strands = 2;
    particlesRef.current = [];

    for (let strand = 0; strand < strands; strand++) {
      for (let i = 0; i < particleCount / strands; i++) {
        const progress = i / (particleCount / strands);
        particlesRef.current.push({
          x: progress * canvas.width,
          y: canvas.height / 2,
          baseY: canvas.height / 2,
          angle: progress * Math.PI * 4 + (strand * Math.PI),
          speed: 0.002 + Math.random() * 0.001,
          radius: 2 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          phase: strand * Math.PI,
        });
      }
    }

    const animate = () => {
      timeRef.current += 0.016;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;
      const amplitude = Math.min(canvas.height * 0.3, 200);

      particlesRef.current.forEach((particle, index) => {
        // Update angle for wave motion
        particle.angle += particle.speed;
        
        // Calculate double helix position
        const waveOffset = Math.sin(particle.angle + timeRef.current * 0.5) * amplitude;
        particle.y = centerY + waveOffset;
        
        // Add horizontal drift
        particle.x += Math.sin(timeRef.current * 0.3 + particle.phase) * 0.3;
        
        // Wrap around horizontally
        if (particle.x > canvas.width + 50) {
          particle.x = -50;
        } else if (particle.x < -50) {
          particle.x = canvas.width + 50;
        }

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.radius * 3
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.4, particle.color + '60');
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Draw connection lines between nearby particles (same strand)
        particlesRef.current.forEach((other, otherIndex) => {
          if (index === otherIndex) return;
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100 && Math.abs(other.phase - particle.phase) < 0.1) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = particle.color + '20';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{
        background: 'linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary))',
      }}
    />
  );
}
