/**
 * Triangle Path Sum 算法可视化
 * 数字三角形 - 从顶到底的最大路径和
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../types";

export interface TrianglePathState {
  triangle: number[][];
  dp: number[][];
  path: Array<[row: number, col: number]>;
  currentRow: number;
  phase: 'init' | 'compute' | 'complete';
  message: string;
  maxSum: number;
}

export const trianglePathDefinition: AlgorithmDefinition<TrianglePathState, number[][]> = {
  name: "Triangle Path",
  category: "dp",
  description: "数字三角形 - 从顶部到底部寻找路径和最大的路线",
  
  initialParams: [[
    [7],
    [3, 8],
    [8, 1, 0],
    [2, 7, 4, 4],
    [4, 5, 2, 6, 5]
  ]],

  getInitialState([triangle]) {
    const n = triangle.length;
    const dp = triangle.map(row => [...row]);
    
    return {
      triangle,
      dp,
      path: [],
      currentRow: n - 1,
      phase: 'init',
      message: '数字三角形：从顶到底寻找最大路径和',
      maxSum: 0,
    };
  },

  *execute(state) {
    const { triangle, dp } = state;
    const n = triangle.length;
    
    yield { ...state, phase: 'compute', message: '自底向上计算最大路径和' };
    
    for (let i = n - 2; i >= 0; i--) {
      for (let j = 0; j <= i; j++) {
        dp[i][j] += Math.max(dp[i+1][j], dp[i+1][j+1]);
        
        yield {
          ...state,
          dp: dp.map(r => [...r]),
          currentRow: i,
          message: `位置(${i},${j})：选择下方较大值，累计和=${dp[i][j]}`,
        };
      }
    }
    
    // 回溯路径
    const path: Array<[row: number, col: number]> = [[0, 0]];
    let col = 0;
    for (let i = 1; i < n; i++) {
      col = dp[i-1][col] - triangle[i-1][col] === dp[i][col] ? col : col + 1;
      path.push([i, col]);
    }
    
    yield {
      ...state,
      path,
      phase: 'complete',
      maxSum: dp[0][0],
      message: `完成！最大路径和: ${dp[0][0]}，路径: ${path.map(p => triangle[p[0]][p[1]]).join(' -> ')}`,
    };
  },

  getCode() {
    return `// 数字三角形最大路径和
function maxTrianglePath(triangle: number[][]): number {
  const n = triangle.length;
  const dp = triangle.map(row => [...row]);
  
  for (let i = n - 2; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      dp[i][j] += Math.max(dp[i+1][j], dp[i+1][j+1]);
    }
  }
  
  return dp[0][0];
}`;
  },
};
