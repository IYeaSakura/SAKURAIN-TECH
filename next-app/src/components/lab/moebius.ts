/**
 * 莫比乌斯数据环 —— 数学与几何构建模块
 *
 * 莫比乌斯带参数方程（u 沿环向，v 横跨带面）：
 *   x = (R + v·cos(u/2)) · cos(u)
 *   z = (R + v·cos(u/2)) · sin(u)
 *   y = v · sin(u/2)
 * u ∈ [0, 2π)，v ∈ [-W, W]。环面平躺在 XZ 平面上，y 为带面厚度方向。
 * 由于 cos(u/2)/sin(u/2) 的半角特性，u 绕行一周 (2π) 后带面翻转，
 * 必须绕行两周 (4π) 才回到原点 —— 这正是"没有正反面"的几何来源。
 */

/** 环体常量：主半径 R 与半带宽 W */
export const MOEBIUS = {
  R: 1.6,
  W: 0.42,
} as const;

/** 粒子规模：桌面 / 移动端两档（移动端降载） */
export const PARTICLE_COUNT_DESKTOP = 14000;
export const PARTICLE_COUNT_MOBILE = 6000;

/** 数据流基础速率 λ（rad/s，沿 u 方向） */
export const FLOW_LAMBDA = 0.35;

/**
 * 计算莫比乌斯带上一点的三维坐标。
 * @param u 环向参数 [0, 2π)
 * @param v 横向参数 [-W, W]
 * @param out 输出数组（长度 ≥ 3），避免热循环中的分配
 */
export function moebiusPoint(
  u: number,
  v: number,
  out: number[] | Float32Array,
  offset = 0,
): void {
  const half = u * 0.5;
  const r = MOEBIUS.R + v * Math.cos(half);
  out[offset] = r * Math.cos(u);
  out[offset + 1] = v * Math.sin(half);
  out[offset + 2] = r * Math.sin(u);
}

export interface GridBuildOptions {
  /** 沿环向的网格列数（横跨带面的短线） */
  uLines?: number;
  /** 沿带面宽度方向的行数（含两条边缘） */
  vLines?: number;
  /** 每条环向行线的采样分段数 */
  uSegments?: number;
}

/**
 * 构建莫比乌斯带的线框网格（lineSegments 顶点数组）。
 * 手工生成线段而非 mesh wireframe，避免三角剖分的对角线，
 * 得到干净的工程制图式正交网格。
 */
export function buildMoebiusGridPositions({
  uLines = 48,
  vLines = 7,
  uSegments = 160,
}: GridBuildOptions = {}): Float32Array {
  const tmp = [0, 0, 0];
  const positions: number[] = [];
  const TAU = Math.PI * 2;

  // 环向行线：v 固定，沿 u 采样连成折线
  for (let row = 0; row < vLines; row++) {
    const v = -MOEBIUS.W + (2 * MOEBIUS.W * row) / (vLines - 1);
    for (let i = 0; i < uSegments; i++) {
      const u0 = (i / uSegments) * TAU;
      const u1 = ((i + 1) / uSegments) * TAU;
      moebiusPoint(u0, v, tmp);
      positions.push(tmp[0], tmp[1], tmp[2]);
      moebiusPoint(u1, v, tmp);
      positions.push(tmp[0], tmp[1], tmp[2]);
    }
  }

  // 横向列线：u 固定，横跨 v。截面关于 v 是线性的，
  // 但半角扭转使相邻截面方向不同，仍采样 8 段以保证视觉平滑。
  const vSamples = 8;
  for (let col = 0; col < uLines; col++) {
    const u = (col / uLines) * TAU;
    for (let i = 0; i < vSamples - 1; i++) {
      const v0 = -MOEBIUS.W + (2 * MOEBIUS.W * i) / (vSamples - 1);
      const v1 = -MOEBIUS.W + (2 * MOEBIUS.W * (i + 1)) / (vSamples - 1);
      moebiusPoint(u, v0, tmp);
      positions.push(tmp[0], tmp[1], tmp[2]);
      moebiusPoint(u, v1, tmp);
      positions.push(tmp[0], tmp[1], tmp[2]);
    }
  }

  return new Float32Array(positions);
}

/**
 * 提取带面两条边缘（v = ±W）的高亮轮廓线。
 * 边缘是最能体现莫比乌斯扭转的特征线，用强调色单独描边。
 */
export function buildMoebiusEdgePositions(segments = 256): Float32Array {
  const tmp = [0, 0, 0];
  const positions: number[] = [];
  const TAU = Math.PI * 2;
  for (const v of [-MOEBIUS.W, MOEBIUS.W]) {
    for (let i = 0; i < segments; i++) {
      const u0 = (i / segments) * TAU;
      const u1 = ((i + 1) / segments) * TAU;
      moebiusPoint(u0, v, tmp);
      positions.push(tmp[0], tmp[1], tmp[2]);
      moebiusPoint(u1, v, tmp);
      positions.push(tmp[0], tmp[1], tmp[2]);
    }
  }
  return new Float32Array(positions);
}
