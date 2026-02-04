import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '@/lib/performance';

interface NeuralNetworkProps {
  isDark: boolean;
}

// 节点
function Nodes({ isDark }: NeuralNetworkProps) {
  const nodesRef = useRef<THREE.Group>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const { nodes, lineGeo } = useMemo(() => {
    const nodeCount = 40;
    const nodes: { position: THREE.Vector3; layer: number }[] = [];
    const connections: [number, number][] = [];
    
    // 创建3层神经网络结构
    const layers = 3;
    const nodesPerLayer = Math.floor(nodeCount / layers);
    
    for (let layer = 0; layer < layers; layer++) {
      const x = (layer - 1) * 2.5;
      for (let i = 0; i < nodesPerLayer; i++) {
        const angle = (i / nodesPerLayer) * Math.PI * 2;
        const radius = 1.5 + Math.random() * 0.5;
        const y = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        nodes.push({
          position: new THREE.Vector3(x, y, z),
          layer,
        });
      }
    }
    
    // 创建连接
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // 只连接相邻层或同层节点
        if (Math.abs(node1.layer - node2.layer) <= 1) {
          const distance = node1.position.distanceTo(node2.position);
          if (distance < 3 && Math.random() > 0.7) {
            connections.push([i, j]);
          }
        }
      }
    }
    
    // 创建线条几何体
    const linePositions = new Float32Array(connections.length * 6);
    connections.forEach(([i, j], idx) => {
      const start = nodes[i].position;
      const end = nodes[j].position;
      const idx6 = idx * 6;
      linePositions[idx6] = start.x;
      linePositions[idx6 + 1] = start.y;
      linePositions[idx6 + 2] = start.z;
      linePositions[idx6 + 3] = end.x;
      linePositions[idx6 + 4] = end.y;
      linePositions[idx6 + 5] = end.z;
    });
    
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    return { nodes, lineGeo };
  }, []);
  
  useFrame((state) => {
    if (!nodesRef.current || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;
    
    // 整体缓慢旋转
    nodesRef.current.rotation.y = time * 0.1;
    nodesRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
  });
  
  const nodeColor = isDark ? '#60a5fa' : '#3b82f6';
  
  return (
    <group ref={nodesRef}>
      {/* 节点 */}
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial
            color={nodeColor}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
      
      {/* 连接线 */}
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color={nodeColor}
          transparent
          opacity={0.2}
        />
      </lineSegments>
    </group>
  );
}

// 数据流粒子
function DataFlow({ isDark }: NeuralNetworkProps) {
  const particlesRef = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => {
    const items: {
      curve: THREE.QuadraticBezierCurve3;
      speed: number;
      offset: number;
    }[] = [];
    
    // 创建流动路径
    for (let i = 0; i < 15; i++) {
      const startX = -2.5;
      const endX = 2.5;
      const y = (Math.random() - 0.5) * 3;
      const z = (Math.random() - 0.5) * 3;
      
      const start = new THREE.Vector3(startX, y, z);
      const end = new THREE.Vector3(endX, y + (Math.random() - 0.5), z + (Math.random() - 0.5));
      const mid = new THREE.Vector3(0, y + Math.random() * 2, z);
      
      items.push({
        curve: new THREE.QuadraticBezierCurve3(start, mid, end),
        speed: 0.2 + Math.random() * 0.3,
        offset: Math.random(),
      });
    }
    
    return items;
  }, []);
  
  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    particlesRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const particle = particles[i];
      
      const t = ((time * particle.speed + particle.offset) % 1);
      const position = particle.curve.getPoint(t);
      mesh.position.copy(position);
      
      // 淡入淡出效果
      const material = mesh.material as THREE.MeshBasicMaterial;
      if (t < 0.1) {
        material.opacity = t / 0.1;
      } else if (t > 0.9) {
        material.opacity = (1 - t) / 0.1;
      } else {
        material.opacity = 1;
      }
    });
  });
  
  const particleColor = isDark ? '#a78bfa' : '#8b5cf6';
  
  return (
    <group ref={particlesRef}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial
            color={particleColor}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

// 外层光环
function OuterRings({ isDark }: NeuralNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  useFrame((state) => {
    if (!groupRef.current || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;
    
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      mesh.rotation.x = time * 0.1 * (i + 1) * 0.3;
      mesh.rotation.y = time * 0.15 * (i % 2 === 0 ? 1 : -1);
    });
  });
  
  const ringColor = isDark ? '#3b82f6' : '#1d4ed8';
  
  return (
    <group ref={groupRef}>
      {[3.5, 4.2, 5].map((radius, i) => (
        <mesh key={i}>
          <torusGeometry args={[radius, 0.02, 8, 64]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={0.3 - i * 0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

// 核心发光体
function Core({ isDark }: NeuralNetworkProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  useFrame((state) => {
    if (!meshRef.current || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;
    const scale = 1 + Math.sin(time * 2) * 0.1;
    meshRef.current.scale.setScalar(scale);
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshBasicMaterial
        color={isDark ? '#fbbf24' : '#f59e0b'}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

export function NeuralNetwork({ isDark }: NeuralNetworkProps) {
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
          camera={{ position: [0, 0, 8], fov: 50 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'low-power',
          }}
          dpr={1}
          frameloop="always"
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={isDark ? 0.5 : 0.7} />
          <directionalLight position={[5, 5, 5]} intensity={isDark ? 0.8 : 1} />
          
          <Nodes isDark={isDark} />
          <DataFlow isDark={isDark} />
          <OuterRings isDark={isDark} />
          <Core isDark={isDark} />
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

export default NeuralNetwork;
