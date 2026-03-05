/**
 * Longest Common Substring 算法
 * 最长公共子串
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../../types";

export const lcSubstringDefinition: AlgorithmDefinition = {
  id: 'lc-substring',
  name: "Longest Common Substring",
  category: "dp",
  timeComplexity: 'O(m×n)',
  spaceComplexity: 'O(m×n)',
  description: "最长公共子串 - 计算两个字符串的最长连续相同子串长度",
  code: `// 最长公共子串 - O(m*n)
function longestCommonSubstring(s1: string, s2: string): string {
  const m = s1.length, n = s2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  let maxLen = 0, endIndex = 0;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i-1] === s2[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
        if (dp[i][j] > maxLen) {
          maxLen = dp[i][j];
          endIndex = i;
        }
      }
    }
  }
  
  return s1.substring(endIndex - maxLen, endIndex);
}`,
  supportedViews: ['matrix']
};

export default lcSubstringDefinition;
