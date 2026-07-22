/**
 * 最长公共子序列 (LCS)
 * 时间复杂度: O(m × n)
 * 空间复杂度: O(m × n)
 */

import type { AlgorithmDefinition } from '../../types';

export const lcsDefinition: AlgorithmDefinition = {
  id: 'lcs',
  name: '最长公共子序列 (LCS)',
  category: 'dp',
  timeComplexity: 'O(m × n)',
  spaceComplexity: 'O(m × n)',
  description: '找出两个字符串的最长公共子序列的长度。子序列不要求连续。',
  code: `function lcs(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}`,
  supportedViews: ['matrix']
};
