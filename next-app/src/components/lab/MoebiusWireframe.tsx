'use client';

/**
 * 莫比乌斯线框 —— 发丝级网格 + 强调色边缘轮廓 + 中央核心。
 * 全部使用无光照的 lineBasicMaterial，靠透明度分层营造纵深，
 * 呼应 refact.cc 的细线框工程美学。
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildMoebiusEdgePositions, buildMoebiusGridPositions } from './moebius';

interface MoebiusWireframeProps {
  /** 静帧模式：核心停止自转 */
  frozen: boolean;
}

export function MoebiusWireframe({ frozen }: MoebiusWireframeProps) {
  // 网格与边缘顶点只构建一次（纯静态几何）
  const gridGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(buildMoebiusGridPositions(), 3),
    );
    return geo;
  }, []);

  const edgeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(buildMoebiusEdgePositions(), 3),
    );
    return geo;
  }, []);

  const coreRef = useRef<THREE.Mesh>(null);

  // 中央核心缓慢自转（静帧模式下保持初始角度）
  useFrame((_, delta) => {
    if (frozen || !coreRef.current) return;
    coreRef.current.rotation.y += delta * 0.25;
    coreRef.current.rotation.x += delta * 0.11;
  });

  return (
    <group>
      {/* 主网格：极淡的白色发丝线，仅作结构暗示 */}
      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial color="#9db4c8" transparent opacity={0.1} />
      </lineSegments>

      {/* 边缘轮廓：强调色描边，莫比乌斯扭转的特征线 */}
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#569CD6" transparent opacity={0.5} />
      </lineSegments>

      {/* 中央核心：悬浮的线框二十面体，视觉锚点 */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshBasicMaterial color="#569CD6" wireframe transparent opacity={0.65} />
      </mesh>

      {/* 核心外圈光晕参考环（极淡，暗示轨道平面） */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.0012, 4, 96]} />
        <meshBasicMaterial color="#9db4c8" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}
