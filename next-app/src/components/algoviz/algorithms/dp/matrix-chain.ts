/**
 * Matrix Chain Multiplication 算法
 * 矩阵链乘法 - 最优括号化方案
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../../types";

export const matrixChainDefinition: AlgorithmDefinition = {
  id: 'matrix-chain',
  name: "Matrix Chain Multiplication",
  category: "dp",
  timeComplexity: 'O(n³)',
  spaceComplexity: 'O(n²)',
  description: "矩阵链乘法 - 找到计算矩阵乘积的最优顺序，使得标量乘法次数最少",
  code: `// 矩阵链乘法 - O(n^3)
function matrixChainOrder(dimensions: number[]): number {
  const n = dimensions.length - 1;
  const dp: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k+1][j] + dimensions[i]*dimensions[k+1]*dimensions[j+1];
        dp[i][j] = Math.min(dp[i][j], cost);
      }
    }
  }
  
  return dp[0][n-1];
}`,
  supportedViews: ['matrix']
};

export default matrixChainDefinition;
