/**
 * Longest Common Substring 算法可视化
 * 最长公共子串
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../types";

export interface LCSubstringState {
  str1: string;
  str2: string;
  dp: number[][];
  maxLength: number;
  endIndex: number;
  currentI: number;
  phase: 'init' | 'fill' | 'complete';
  message: string;
  substring: string;
}

export const lcSubstringDefinition: AlgorithmDefinition<LCSubstringState, [string, string]> = {
  name: "LC Substring",
  category: "dp",
  description: "最长公共子串 - 两个字符串中最长的连续相同子串",
  
  initialParams: ["ABABC", "BABCA"],

  getInitialState([str1, str2]) {
    const m = str1.length, n = str2.length;
    return {
      str1,
      str2,
      dp: Array(m + 1).fill(null).map(() => Array(n + 1).fill(0)),
      maxLength: 0,
      endIndex: 0,
      currentI: 0,
      phase: 'init',
      message: `查找 "${str1}" 和 "${str2}" 的最长公共子串`,
      substring: '',
    };
  },

  *execute(state) {
    const { str1, str2, dp } = state;
    const m = str1.length, n = str2.length;
    let maxLen = 0, endIdx = 0;
    
    yield { ...state, phase: 'fill', message: '开始填表' };
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i-1] === str2[j-1]) {
          dp[i][j] = dp[i-1][j-1] + 1;
          if (dp[i][j] > maxLen) {
            maxLen = dp[i][j];
            endIdx = i - 1;
          }
        }
        
        yield {
          ...state,
          dp: dp.map(r => [...r]),
          currentI: i,
          maxLength: maxLen,
          endIndex: endIdx,
          message: str1[i-1] === str2[j-1] 
            ? `"${str1[i-1]}"匹配，长度=${dp[i][j]}`
            : `"${str1[i-1]}"!="${str2[j-1]}"，重置`,
        };
      }
    }
    
    yield {
      ...state,
      substring: str1.substring(endIdx - maxLen + 1, endIdx + 1),
      phase: 'complete',
      message: `完成！最长公共子串: "${str1.substring(endIdx - maxLen + 1, endIdx + 1)}"，长度: ${maxLen}`,
    };
  },

  getCode() {
    return `// 最长公共子串
function longestCommonSubstring(s1: string, s2: string): string {
  const m = s1.length, n = s2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  let maxLen = 0, endIdx = 0;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i-1] === s2[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
        if (dp[i][j] > maxLen) {
          maxLen = dp[i][j];
          endIdx = i - 1;
        }
      }
    }
  }
  
  return s1.substring(endIdx - maxLen + 1, endIdx + 1);
}`;
  },
};
