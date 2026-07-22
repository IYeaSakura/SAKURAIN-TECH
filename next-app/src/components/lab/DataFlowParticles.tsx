'use client';

/**
 * 数据流粒子 —— 沿莫比乌斯带面循环流动的发光粒子。
 *
 * 粒子位置完全在顶点着色器中由参数方程求值：
 * CPU 侧只存储 (aU, aV, aSeed) 三个静态属性，动画仅推进 uTime uniform，
 * 因此 14000 粒子的每帧成本 = 一次 uniform 写入 + GPU 并行求值。
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLOW_LAMBDA, MOEBIUS } from './moebius';

const TAU = Math.PI * 2;

/** 顶点着色器：参数方程求值 + 点精灵尺寸衰减 */
const vertexShader = /* glsl */ `
  uniform float uTime;        // 全局时间（驱动流动）
  uniform float uBoost;       // 指针扰动增益 [0, ~1.2]
  uniform float uLambda;      // 基础流速 λ
  uniform float uRadius;      // 主半径 R
  uniform float uWidth;       // 半带宽 W
  uniform float uPixelRatio;  // 设备像素比（修正点尺寸）

  attribute float aU;     // 初始环向相位
  attribute float aV;     // 横向位置
  attribute float aSeed;  // 随机种子（速度/亮度/尺寸差异化）

  varying float vAlpha;

  // 莫比乌斯带参数方程（与 CPU 侧 moebius.ts 保持一致）
  vec3 moebius(float u, float v) {
    float half = u * 0.5;
    float r = uRadius + v * cos(half);
    return vec3(r * cos(u), v * sin(half), r * sin(u));
  }

  void main() {
    // 每个粒子以自己的速率沿 u 方向流动；扰动增益叠加在流速上
    float speed = uLambda * (0.6 + 0.8 * aSeed) * (1.0 + uBoost * 1.6);
    float u = mod(aU + uTime * speed, ${TAU.toFixed(8)});
    // 带面呼吸：v 方向轻微往复，让数据流有"活"的厚度
    float v = aV + sin(uTime * 0.8 + aSeed * ${TAU.toFixed(8)}) * 0.03;

    vec3 pos = moebius(u, v);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // 透视衰减点尺寸：近大远小，粒子大小按种子分层
    float size = mix(1.4, 3.4, fract(aSeed * 7.13));
    gl_PointSize = size * uPixelRatio * (3.2 / -mv.z);

    // 亮度按种子分层，叠加缓慢的明暗脉冲
    vAlpha = (0.45 + 0.55 * fract(aSeed * 3.71))
           * (0.75 + 0.25 * sin(uTime * 1.7 + aSeed * 41.0));
  }
`;

/** 片段着色器：径向衰减软圆点 + 白色内核，加色混合叠出辉光 */
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float glow = smoothstep(0.5, 0.0, d);
    glow = pow(glow, 2.4);               // 收紧衰减，模拟点光源辉光
    if (glow < 0.01) discard;
    // 中心混入白色内核，外围保持强调色 —— 单色系内的层次
    vec3 col = mix(uColor, vec3(1.0), smoothstep(0.16, 0.0, d) * 0.55);
    gl_FragColor = vec4(col, glow * vAlpha);
  }
`;

interface DataFlowParticlesProps {
  count: number;
  /** 静帧模式：不推进时间与扰动，保持初始构图 */
  frozen: boolean;
  /** 共享的归一化指针坐标（由页面层写入，避免 React 重渲染） */
  pointerRef: { current: { x: number; y: number } };
}

export function DataFlowParticles({ count, frozen, pointerRef }: DataFlowParticlesProps) {
  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    // position 属性仅为占位（R3F/three 需要它确定 draw 数量），
    // 实际坐标全部在顶点着色器中计算。
    const positions = new Float32Array(count * 3);
    const aU = new Float32Array(count);
    const aV = new Float32Array(count);
    const aSeed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      aU[i] = Math.random() * TAU;
      // 横向分布向中线收拢（越靠边缘越稀疏），突出流线主体
      aV[i] = (Math.random() * 2 - 1) * MOEBIUS.W * (0.3 + 0.7 * Math.random());
      aSeed[i] = Math.random();
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
    geometry.setAttribute('aV', new THREE.BufferAttribute(aV, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false, // 加色混合粒子不写深度，避免互相遮挡出硬边
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 2.4 }, // 非零初相位，首帧即是打散后的自然分布
        uBoost: { value: 0 },
        uLambda: { value: FLOW_LAMBDA },
        uRadius: { value: MOEBIUS.R },
        uWidth: { value: MOEBIUS.W },
        uPixelRatio: { value: 1 },
        uColor: { value: new THREE.Color('#569CD6') }, // 与站点暗色主题强调色一致
      },
    });
    return { geometry, material };
  }, [count]);

  // 显式释放 GPU 资源（组件卸载/dynamic 重挂载时）
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const timeRef = useRef(2.4);
  const boostRef = useRef(0);
  const prevPointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05); // 钳制长帧（切后台回来不跳变）
    material.uniforms.uPixelRatio.value = state.viewport.dpr;

    if (!frozen) {
      // 指针速度 → 流速增益：快速划过会"搅动"数据流，随后自然衰减
      const p = pointerRef.current;
      const dx = p.x - prevPointer.current.x;
      const dy = p.y - prevPointer.current.y;
      prevPointer.current = { x: p.x, y: p.y };
      const impulse = Math.min(Math.hypot(dx, dy) * 6, 1.2);
      boostRef.current += (impulse - boostRef.current) * Math.min(1, step * 3);

      timeRef.current += step;
    }
    material.uniforms.uTime.value = timeRef.current;
    material.uniforms.uBoost.value = boostRef.current;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
