/**
 * 0-1 Knapsack 完全版算法可视化
 * 动态规划经典问题
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../types";

export interface KnapsackCompleteState {
  weights: number[];
  values: number[];
  capacity: number;
  dp: number[][];
  selected: boolean[];
  currentI: number;
  currentW: number;
  phase: 'init' | 'fill' | 'backtrack' | 'complete';
  message: string;
  maxValue: number;
}

export const knapsackCompleteDefinition: AlgorithmDefinition<KnapsackCompleteState, [number[], number[], number]> = {
  name: "0-1 Knapsack",
  category: "dp",
  description: "0-1背包问题 - 在容量限制下选择物品使总价值最大",
  
  initialParams: [[2, 3, 4, 5], [3, 4, 5, 6], 8],

  getInitialState([weights, values, capacity]) {
    const n = weights.length;
    return {
      weights,
      values,
      capacity,
      dp: Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0)),
      selected: Array(n).fill(false),
      currentI: 0,
      currentW: 0,
      phase: 'init',
      message: `背包容量: ${capacity}，${n}个物品可选`,
      maxValue: 0,
    };
  },

  *execute(state) {
    const { weights, values, capacity, dp } = state;
    const n = weights.length;
    
    yield { ...state, phase: 'fill', message: '开始填DP表' };
    
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= capacity; w++) {
        if (weights[i-1] <= w) {
          dp[i][w] = Math.max(
            dp[i-1][w],
            dp[i-1][w - weights[i-1]] + values[i-1]
          );
        } else {
          dp[i][w] = dp[i-1][w];
        }
        
        yield {
          ...state,
          dp: dp.map(r => [...r]),
          currentI: i,
          currentW: w,
          message: `物品${i}(重${weights[i-1]},值${values[i-1]})，容量${w}，最大价值${dp[i][w]}`,
        };
      }
    }
    
    // 回溯
    const selected = [...state.selected];
    let w = capacity;
    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i-1][w]) {
        selected[i-1] = true;
        w -= weights[i-1];
      }
    }
    
    yield {
      ...state,
      selected,
      phase: 'complete',
      maxValue: dp[n][capacity],
      message: `完成！最大价值: ${dp[n][capacity]}，已标记选中物品`,
    };
  },

  getCode() {
    return `// 0-1背包问题 - O(n*W)
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
}`;
  },
};
