/**
 * Edit Distance (Levenshtein Distance) 算法
 * 编辑距离 - 计算两个字符串的相似度
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../../types";

export const editDistanceDefinition: AlgorithmDefinition = {
  id: 'edit-distance',
  name: "Edit Distance",
  category: "dp",
  timeComplexity: 'O(m×n)',
  spaceComplexity: 'O(m×n)',
  description: "编辑距离 - 计算将一个字符串转换为另一个字符串的最少操作次数",
  code: `// 编辑距离 (Levenshtein Distance) - O(m*n)
function editDistance(s: string, t: string): number {
  const m = s.length, n = t.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s[i-1] === t[j-1]) {
        dp[i][j] = dp[i-1][j-1];
      } else {
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,    // 删除
          dp[i][j-1] + 1,    // 插入
          dp[i-1][j-1] + 1   // 替换
        );
      }
    }
  }
  
  return dp[m][n];
}`,
  supportedViews: ['matrix']
};

export default editDistanceDefinition;
