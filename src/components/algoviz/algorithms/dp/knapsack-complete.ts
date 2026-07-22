/**
 * 0-1 Knapsack 完全版算法
 * 动态规划经典问题
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../../types";

export const knapsackCompleteDefinition: AlgorithmDefinition = {
  id: 'knapsack-complete',
  name: "0-1 Knapsack",
  category: "dp",
  timeComplexity: 'O(n×W)',
  spaceComplexity: 'O(n×W)',
  description: "0-1背包问题 - 在容量限制下选择物品使总价值最大",
  code: `// 0-1背包问题 - O(n*W)
function knapsack(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(W + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      if (weights[i-1] <= w) {
        dp[i][w] = Math.max(
          dp[i-1][w],
          dp[i-1][w - weights[i-1]] + values[i-1]
        );
      } else {
        dp[i][w] = dp[i-1][w];
      }
    }
  }
  
  return dp[n][W];
}`,
  supportedViews: ['matrix']
};

export default knapsackCompleteDefinition;
