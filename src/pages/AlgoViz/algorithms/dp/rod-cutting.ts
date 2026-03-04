/**
 * Rod Cutting 算法可视化
 * 钢条切割问题
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../types";

export interface RodCuttingState {
  prices: number[];
  n: number;
  dp: number[];
  cuts: number[];
  currentLen: number;
  phase: 'init' | 'compute' | 'complete';
  message: string;
  maxRevenue: number;
  solution: number[];
}

export const rodCuttingDefinition: AlgorithmDefinition<RodCuttingState, number[]> = {
  name: "Rod Cutting",
  category: "dp",
  description: "钢条切割 - 给定不同长度的价格，求最优切割方案",
  
  initialParams: [0, 1, 5, 8, 9, 10, 17, 17, 20, 24, 30],

  getInitialState(prices) {
    const n = prices.length - 1;
    return {
      prices,
      n,
      dp: Array(n + 1).fill(0),
      cuts: Array(n + 1).fill(0),
      currentLen: 0,
      phase: 'init',
      message: `钢条切割：长度1-${n}的价格为 [${prices.slice(1).join(', ')}]`,
      maxRevenue: 0,
      solution: [],
    };
  },

  *execute(state) {
    const { prices, n, dp, cuts } = state;
    
    yield { ...state, phase: 'compute', message: '计算每个长度的最优收益' };
    
    for (let i = 1; i <= n; i++) {
      let maxVal = -Infinity;
      for (let j = 1; j <= i; j++) {
        if (prices[j] + dp[i-j] > maxVal) {
          maxVal = prices[j] + dp[i-j];
          cuts[i] = j;
        }
        
        yield {
          ...state,
          currentLen: i,
          message: `长度${i}：切下${j}(${prices[j]}) + 剩余${i-j}(${dp[i-j]}) = ${prices[j] + dp[i-j]}`,
        };
      }
      dp[i] = maxVal;
      
      yield {
        ...state,
        dp: [...dp],
        cuts: [...cuts],
        message: `长度${i}最优收益: ${maxVal}，第一刀切${cuts[i]}`,
      };
    }
    
    // 重建解
    const solution: number[] = [];
    let rem = n;
    while (rem > 0) {
      solution.push(cuts[rem]);
      rem -= cuts[rem];
    }
    
    yield {
      ...state,
      phase: 'complete',
      maxRevenue: dp[n],
      solution,
      message: `完成！最优方案: 切成 [${solution.join(', ')}]，总收益: ${dp[n]}`,
    };
  },

  getCode() {
    return `// 钢条切割问题
function rodCutting(prices: number[], n: number): number {
  const dp: number[] = Array(n + 1).fill(0);
  
  for (let i = 1; i <= n; i++) {
    let maxVal = -Infinity;
    for (let j = 1; j <= i; j++) {
      maxVal = Math.max(maxVal, prices[j] + dp[i-j]);
    }
    dp[i] = maxVal;
  }
  
  return dp[n];
}`;
  },
};
