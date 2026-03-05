/**
 * Triangle Path 算法
 * 三角形最小路径和
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../../types";

export const trianglePathDefinition: AlgorithmDefinition = {
  id: 'triangle-path',
  name: "Triangle Path Sum",
  category: "dp",
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(n)',
  description: "三角形最小路径和 - 从顶部到底部找到使路径和最小的路径",
  code: `// 三角形最小路径和 - O(n^2)
function minimumTotal(triangle: number[][]): number {
  const n = triangle.length;
  const dp: number[] = [...triangle[n-1]];
  
  for (let i = n - 2; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      dp[j] = triangle[i][j] + Math.min(dp[j], dp[j+1]);
    }
  }
  
  return dp[0];
}`,
  supportedViews: ['grid']
};

export default trianglePathDefinition;
