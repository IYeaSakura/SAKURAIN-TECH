/**
 * 0/1背包问题
 * 时间复杂度: O(n × W)
 * 空间复杂度: O(n × W)
 */

import type { AlgorithmDefinition } from '../../types';

export const knapsackDefinition: AlgorithmDefinition = {
  id: 'knapsack',
  name: '0/1背包问题',
  category: 'dp',
  timeComplexity: 'O(n × W)',
  spaceComplexity: 'O(n × W)',
  description: '给定物品的重量和价值，在容量限制下选择物品使总价值最大。每个物品只能选一次。',
  code: `function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - weights[i - 1]] + values[i - 1]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  
  return dp[n][capacity];
}`,
  supportedViews: ['matrix']
};
