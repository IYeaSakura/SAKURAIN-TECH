/**
 * LIS (Longest Increasing Subsequence) 算法
 * 最长递增子序列 - 二分优化 O(n log n)
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../../types";

export const lisDefinition: AlgorithmDefinition = {
  id: 'lis',
  name: "LIS",
  category: "dp",
  timeComplexity: 'O(n log n)',
  spaceComplexity: 'O(n)',
  description: "最长递增子序列 - 二分优化算法 O(n log n)",
  code: `// LIS - 最长递增子序列（二分优化 O(n log n)）
function lengthOfLIS(nums: number[]): number {
  const dp: number[] = []; // dp[i] = 长度为 i+1 的 LIS 的最小末尾
  
  for (const num of nums) {
    // 二分查找第一个 >= num 的位置
    let left = 0, right = dp.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (dp[mid] < num) left = mid + 1;
      else right = mid;
    }
    
    if (left === dp.length) {
      dp.push(num); // 延长 LIS
    } else {
      dp[left] = num; // 替换，使末尾更小
    }
  }
  
  return dp.length;
}`,
  supportedViews: ['array']
};

export default lisDefinition;
