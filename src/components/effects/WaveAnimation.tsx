import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '@/lib/performance';

interface WaveAnimationProps {
  isDark: boolean;
}

// 波浪网格
function WaveGrid({ isDark }: WaveAnimationProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const geometry = useMemo(() => {
    const width = 6;
    const depth = 6;
    const segmentsW = 40;
    const segmentsD = 40;
    
    const geo = new THREE.PlaneGeometry(width, depth, segmentsW, segmentsD);
    geo.rotateX(-Math.PI / 2.5);
    
    return geo;
  }, []);
  
  const count = useMemo(() => geometry.attributes.position.count, [geometry]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      
      // 多层波浪叠加
      const wave1 = Math.sin(x * 0.8 + time * 0.5) * 0.3;
      const wave2 = Math.cos(z * 0.6 + time * 0.4) * 0.3;
      const wave3 = Math.sin((x + z) * 0.4 + time * 0.3) * 0.2;
      const wave4 = Math.sin(Math.sqrt(x * x + z * z) * 0.5 - time * 0.6) * 0.25;
      
      positions[i3 + 1] = wave1 + wave2 + wave3 + wave4;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    
    // 缓慢旋转
    if (!prefersReducedMotion) {
      meshRef.current.rotation.z = Math.sin(time * 0.1) * 0.05;
    }
  });
  
  const color = isDark ? '#3b82f6' : '#1d4ed8';
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={isDark ? 0.6 : 0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// 浮动粒子
function FloatingParticles({ isDark }: WaveAnimationProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const { positionAttr, colorAttr } = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const color1 = new THREE.Color(isDark ? '#60a5fa' : '#3b82f6');
    const color2 = new THREE.Color(isDark ? '#a78bfa' : '#8b5cf6');
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 8;
      positions[i3 + 1] = (Math.random() - 0.5) * 4;
      positions[i3 + 2] = (Math.random() - 0.5) * 8;
      
      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }
    
    const positionAttr = new THREE.BufferAttribute(positions, 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    
    return { positionAttr, colorAttr };
  }, [isDark]);
  
  useFrame((state) => {
    if (!pointsRef.current || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;
    pointsRef.current.rotation.y = time * 0.05;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3;
      positions[i3 + 1] += Math.sin(time + positions[i3]) * 0.002;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={colorAttr} attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 发光球体阵列
function GlowingSpheres({ isDark }: WaveAnimationProps) {
  const groupRef = useRef<THREE.Group>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const spheres = useMemo(() => {
    const items: { position: [number, number, number]; scale: number; phase: number }[] = [];
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 2.5;
      items.push({
        position: [
          Math.cos(angle) * radius,
          Math.sin(i) * 0.5,
          Math.sin(angle) * radius
        ],
        scale: 0.15 + Math.random() * 0.1,
        phase: i * 0.5,
      });
    }
    
    return items;
  }, []);
  
  useFrame((state) => {
    if (!groupRef.current || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;
    
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const sphere = spheres[i];
      
      // 上下浮动
      mesh.position.y = sphere.position[1] + Math.sin(time * 0.8 + sphere.phase) * 0.3;
      
      // 缩放脉冲
      const scale = sphere.scale * (1 + Math.sin(time * 1.5 + sphere.phase) * 0.2);
      mesh.scale.setScalar(scale);
    });
    
    groupRef.current.rotation.y = time * 0.1;
  });
  
  return (
    <group ref={groupRef}>
      {spheres.map((sphere, i) => (
        <mesh key={i} position={sphere.position}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={isDark ? '#60a5fa' : '#3b82f6'}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

export function WaveAnimation({ isDark }: WaveAnimationProps) {
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
          camera={{ position: [0, 2, 6], fov: 50 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'low-power',
          }}
          dpr={1}
          frameloop="always"
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={isDark ? 0.4 : 0.6} />
          <directionalLight position={[5, 5, 5]} intensity={isDark ? 0.8 : 1} />
          
          <WaveGrid isDark={isDark} />
          <FloatingParticles isDark={isDark} />
          <GlowingSpheres isDark={isDark} />
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

export default WaveAnimation;
