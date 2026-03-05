/**
 * Rod Cutting 算法
 * 钢条切割问题
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../../types";

export const rodCuttingDefinition: AlgorithmDefinition = {
  id: 'rod-cutting',
  name: "Rod Cutting",
  category: "dp",
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(n)',
  description: "钢条切割 - 给定不同长度钢条的价格，求最优切割方案使收益最大",
  code: `// 钢条切割问题 - O(n^2)
function rodCutting(prices: number[], n: number): number {
  const dp: number[] = new Array(n + 1).fill(0);
  
  for (let i = 1; i <= n; i++) {
    let maxRevenue = 0;
    for (let j = 1; j <= i; j++) {
      maxRevenue = Math.max(maxRevenue, prices[j-1] + dp[i-j]);
    }
    dp[i] = maxRevenue;
  }
  
  return dp[n];
}`,
  supportedViews: ['array']
};

export default rodCuttingDefinition;
