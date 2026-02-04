import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '@/lib/performance';

interface ParticleFieldProps {
  isDark: boolean;
}

// 粒子场组件
function ParticleScene({ isDark }: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const particleCount = 800;
  
  const { positionAttr, colorAttr, sizeAttr } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color1 = new THREE.Color(isDark ? '#3b82f6' : '#1d4ed8');
    const color2 = new THREE.Color(isDark ? '#a855f7' : '#7c3aed');
    const color3 = new THREE.Color(isDark ? '#06b6d4' : '#0891b2');
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 球形分布
      const radius = 2 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // 混合颜色
      const mixRatio = Math.random();
      let mixedColor;
      if (mixRatio < 0.33) {
        mixedColor = color1.clone().lerp(color2, Math.random());
      } else if (mixRatio < 0.66) {
        mixedColor = color2.clone().lerp(color3, Math.random());
      } else {
        mixedColor = color3.clone().lerp(color1, Math.random());
      }
      
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
      
      sizes[i] = Math.random() * 0.08 + 0.02;
    }
    
    const positionAttr = new THREE.BufferAttribute(positions, 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    const sizeAttr = new THREE.BufferAttribute(sizes, 1);
    
    return { positionAttr, colorAttr, sizeAttr };
  }, [isDark]);
  
  // 鼠标交互
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    // 缓慢旋转
    if (!prefersReducedMotion) {
      meshRef.current.rotation.y = time * 0.05;
      meshRef.current.rotation.x = Math.sin(time * 0.03) * 0.1;
    }
    
    // 粒子波动效果
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      const wave = Math.sin(time * 0.5 + x * 0.5) * 0.1 +
                   Math.cos(time * 0.3 + y * 0.5) * 0.1;
      
      const originalRadius = Math.sqrt(x * x + y * y + z * z);
      const newRadius = originalRadius + wave * 0.1;
      const scale = newRadius / originalRadius;
      
      positions[i3] *= scale;
      positions[i3 + 1] *= scale;
      positions[i3 + 2] *= scale;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={colorAttr} attach="attributes-color" />
        <primitive object={sizeAttr} attach="attributes-size" />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// 连接线效果
function ConnectionLines({ isDark }: ParticleFieldProps) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const { positionAttr, colorAttr } = useMemo(() => {
    const lineCount = 50;
    const positions = new Float32Array(lineCount * 6); // 2 points * 3 coords
    const colors = new Float32Array(lineCount * 6);
    
    const color = new THREE.Color(isDark ? '#3b82f6' : '#1d4ed8');
    
    for (let i = 0; i < lineCount; i++) {
      const i6 = i * 6;
      const radius = 2.5 + Math.random() * 1.5;
      
      // 起点
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.acos(2 * Math.random() - 1);
      positions[i6] = radius * Math.sin(phi1) * Math.cos(theta1);
      positions[i6 + 1] = radius * Math.sin(phi1) * Math.sin(theta1);
      positions[i6 + 2] = radius * Math.cos(phi1);
      
      // 终点（附近）
      const theta2 = theta1 + (Math.random() - 0.5) * 0.5;
      const phi2 = phi1 + (Math.random() - 0.5) * 0.5;
      positions[i6 + 3] = radius * Math.sin(phi2) * Math.cos(theta2);
      positions[i6 + 4] = radius * Math.sin(phi2) * Math.sin(theta2);
      positions[i6 + 5] = radius * Math.cos(phi2);
      
      // 颜色
      for (let j = 0; j < 6; j += 3) {
        colors[i6 + j] = color.r;
        colors[i6 + j + 1] = color.g;
        colors[i6 + j + 2] = color.b;
      }
    }
    
    const positionAttr = new THREE.BufferAttribute(positions, 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    
    return { positionAttr, colorAttr };
  }, [isDark]);
  
  useFrame((state) => {
    if (!linesRef.current || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;
    linesRef.current.rotation.y = time * 0.02;
    linesRef.current.rotation.z = Math.sin(time * 0.02) * 0.05;
  });
  
  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={colorAttr} attach="attributes-color" />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// 中心核心
function CoreSphere({ isDark }: ParticleFieldProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  useFrame((state) => {
    if (!meshRef.current || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 0.1;
    meshRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshBasicMaterial
        color={isDark ? '#1e3a5f' : '#3b82f6'}
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

export function ParticleField({ isDark }: ParticleFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={containerRef} className="w-full h-full">
      {isVisible ? (
        <Canvas
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'low-power',
          }}
          dpr={1}
          frameloop="always"
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={isDark ? 0.5 : 0.8} />
          <ParticleScene isDark={isDark} />
          <ConnectionLines isDark={isDark} />
          <CoreSphere isDark={isDark} />
        </Canvas>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
        </div>
      )}
    </div>
  );
}

export default ParticleField;
