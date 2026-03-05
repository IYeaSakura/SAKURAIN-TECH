/**
 * Edit Distance (Levenshtein Distance) 算法可视化
 * 编辑距离 - 计算两个字符串的相似度
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../types";

export interface EditDistanceState {
  source: string;
  target: string;
  dp: number[][];
  operations: Array<{type: 'insert' | 'delete' | 'replace' | 'match', from: string, to: string}>;
  currentI: number;
  currentJ: number;
  phase: 'init' | 'fill' | 'backtrack' | 'complete';
  message: string;
  highlightedCells: Array<[number, number]>;
}

export const editDistanceDefinition: AlgorithmDefinition<EditDistanceState, [string, string]> = {
  name: "Edit Distance",
  category: "dp",
  description: "编辑距离 - 计算将一个字符串转换为另一个字符串的最少操作次数",
  
  initialParams: ["kitten", "sitting"],

  getInitialState([source, target]) {
    const m = source.length;
    const n = target.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    return {
      source,
      target,
      dp,
      operations: [],
      currentI: -1,
      currentJ: -1,
      phase: 'init',
      message: `计算 "${source}" 和 "${target}" 的编辑距离`,
      highlightedCells: [],
    };
  },

  *execute(state) {
    const { source, target, dp } = state;
    const m = source.length;
    const n = target.length;
    
    yield {
      ...state,
      phase: 'fill',
      message: '初始化DP表：第一行和第一列表示空字符串的转换代价',
      highlightedCells: Array.from({length: m+1}, (_, i) => [i, 0]).concat(
        Array.from({length: n+1}, (_, j) => [0, j])
      ),
    };

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const match = source[i-1] === target[j-1];
        const cost = match ? 0 : 1;
        
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,      // delete
          dp[i][j-1] + 1,      // insert
          dp[i-1][j-1] + cost  // replace or match
        );
        
        yield {
          ...state,
          dp: dp.map(row => [...row]),
          currentI: i,
          currentJ: j,
          highlightedCells: [[i, j], [i-1, j], [i, j-1], [i-1, j-1]],
          message: match 
            ? `"${source[i-1]}" == "${target[j-1]}"，无操作，dp[${i}][${j}] = ${dp[i][j]}`
            : `替换 "${source[i-1]}" -> "${target[j-1]}"，dp[${i}][${j}] = ${dp[i][j]}`,
        };
      }
    }

    const distance = dp[m][n];
    
    yield {
      ...state,
      phase: 'complete',
      highlightedCells: [[m, n]],
      message: `完成！编辑距离为 ${distance}，共需要 ${distance} 次操作`,
    };
  },

  getCode() {
    return `// 编辑距离 (Levenshtein Distance) - O(m*n)
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
}`;
  },
};

export default editDistanceDefinition;
