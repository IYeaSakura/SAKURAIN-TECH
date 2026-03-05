/**
 * Matrix Chain Multiplication 算法可视化
 * 矩阵链乘法 - 最优括号化方案
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../types";

export interface MatrixChainState {
  dimensions: number[];
  dp: number[][];
  split: number[][];
  currentLen: number;
  currentI: number;
  phase: 'init' | 'compute' | 'complete';
  message: string;
  optimalCost: number;
}

export const matrixChainDefinition: AlgorithmDefinition<MatrixChainState, number[]> = {
  name: "Matrix Chain",
  category: "dp",
  description: "矩阵链乘法 - 寻找最优计算顺序，最小化标量乘法次数",
  
  initialParams: [30, 35, 15, 5, 10, 20, 25],

  getInitialState(dimensions) {
    const n = dimensions.length - 1;
    return {
      dimensions,
      dp: Array(n).fill(null).map(() => Array(n).fill(0)),
      split: Array(n).fill(null).map(() => Array(n).fill(0)),
      currentLen: 0,
      currentI: 0,
      phase: 'init',
      message: `矩阵链: ${n}个矩阵，维度为 [${dimensions.join(', ')}]`,
      optimalCost: 0,
    };
  },

  *execute(state) {
    const { dimensions, dp, split } = state;
    const n = dimensions.length - 1;
    
    yield { ...state, phase: 'compute', message: '开始计算最优括号化方案' };
    
    for (let len = 2; len <= n; len++) {
      for (let i = 0; i <= n - len; i++) {
        const j = i + len - 1;
        dp[i][j] = Infinity;
        
        for (let k = i; k < j; k++) {
          const cost = dp[i][k] + dp[k+1][j] + dimensions[i] * dimensions[k+1] * dimensions[j+1];
          
          if (cost < dp[i][j]) {
            dp[i][j] = cost;
            split[i][j] = k;
          }
          
          yield {
            ...state,
            dp: dp.map(r => [...r]),
            split: split.map(r => [...r]),
            currentLen: len,
            currentI: i,
            message: `计算 A${i+1}..A${j+1}，在 k=${k+1} 处分割，代价: ${cost}`,
          };
        }
      }
    }
    
    yield {
      ...state,
      phase: 'complete',
      optimalCost: dp[0][n-1],
      message: `完成！最优计算代价: ${dp[0][n-1]} 次标量乘法`,
    };
  },

  getCode() {
    return `// 矩阵链乘法 - O(n^3)
function matrixChainOrder(p: number[]): [number[][], number[][]] {
  const n = p.length - 1;
  const dp: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  const split: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k+1][j] + p[i]*p[k+1]*p[j+1];
        if (cost < dp[i][j]) {
          dp[i][j] = cost;
          split[i][j] = k;
        }
      }
    }
  }
  
  return [dp, split];
}`;
  },
};
