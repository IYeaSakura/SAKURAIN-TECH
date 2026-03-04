/**
 * LIS (Longest Increasing Subsequence) 算法可视化
 * 最长递增子序列 - 二分优化 O(n log n)
 * 
 * @author OpenClaw Auto-Dev
 */

import type { AlgorithmDefinition } from "../types";

export interface LISState {
  array: number[];
  dp: number[];  // dp[i] = 长度为 i+1 的递增子序列的最小末尾元素
  pos: number[]; // 记录元素在 dp 中的位置
  prev: number[]; // 记录前驱，用于重建路径
  lis: number[];  // 最终的 LIS
  currentIndex: number;
  dpLength: number;
  phase: "init" | "process" | "backtrack" | "complete";
  message: string;
  highlightedIndices: number[];
  dpIndices: number[]; // dp 数组对应的原始数组下标
}

export const lisDefinition: AlgorithmDefinition<LISState, number[]> = {
  name: "LIS",
  category: "dp",
  description: "最长递增子序列 - 二分优化算法 O(n log n)",
  
  initialParams: [10, 22, 9, 33, 21, 50, 41, 60, 80],

  getInitialState(array) {
    return {
      array: [...array],
      dp: [],
      pos: new Array(array.length).fill(-1),
      prev: new Array(array.length).fill(-1),
      lis: [],
      currentIndex: -1,
      dpLength: 0,
      phase: "init",
      message: `准备计算 LIS，数组长度: ${array.length}`,
      highlightedIndices: [],
      dpIndices: [],
    };
  },

  *execute(state) {
    const { array } = state;
    const n = array.length;
    const dp: number[] = []; // dp[i] 存储长度为 i+1 的 LIS 的最小末尾值
    const dpIndices: number[] = []; // 对应 dp 的原始数组下标
    const pos = new Array(n).fill(-1); // pos[i] = array[i] 在 dp 中的位置
    const prev = new Array(n).fill(-1); // prev[i] = array[i] 的前驱下标

    for (let i = 0; i < n; i++) {
      yield {
        ...state,
        currentIndex: i,
        highlightedIndices: [i],
        phase: "process",
        message: `处理第 ${i} 个元素: ${array[i]}`,
      };

      // 二分查找：找到 dp 中第一个 >= array[i] 的位置
      let left = 0,
        right = dp.length;
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (dp[mid] < array[i]) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }

      const posInDp = left;

      if (posInDp === dp.length) {
        // 可以延长 LIS
        dp.push(array[i]);
        dpIndices.push(i);
        if (dp.length > 1) {
          prev[i] = dpIndices[dpIndices.length - 2];
        }

        yield {
          ...state,
          dp: [...dp],
          dpIndices: [...dpIndices],
          pos: [...pos.slice(0, i), posInDp, ...pos.slice(i + 1)],
          prev: [...prev],
          dpLength: dp.length,
          message: `${array[i]} 延长 LIS 到长度 ${dp.length}`,
        };
      } else {
        // 替换，使末尾更小
        const oldIdx = dpIndices[posInDp];
        dp[posInDp] = array[i];
        dpIndices[posInDp] = i;
        if (posInDp > 0) {
          prev[i] = dpIndices[posInDp - 1];
        }

        yield {
          ...state,
          dp: [...dp],
          dpIndices: [...dpIndices],
          pos: [...pos.slice(0, i), posInDp, ...pos.slice(i + 1)],
          prev: [...prev],
          message: `${array[i]} 替换位置 ${posInDp} 的 ${dp[posInDp]}，保持 LIS 长度 ${dp.length}`,
        };
      }
    }

    // 回溯重建 LIS
    yield {
      ...state,
      phase: "backtrack",
      highlightedIndices: [],
      message: `开始回溯，重建 LIS，长度: ${dp.length}`,
    };

    const lis: number[] = [];
    const lisIndices: number[] = [];
    let cur = dpIndices[dpIndices.length - 1];

    while (cur !== -1) {
      lis.unshift(array[cur]);
      lisIndices.unshift(cur);

      yield {
        ...state,
        lis: [...lis],
        highlightedIndices: [...lisIndices],
        message: `LIS[${lis.length}]: ${array[cur]}`,
      };

      cur = prev[cur];
    }

    yield {
      ...state,
      lis,
      highlightedIndices: lisIndices,
      phase: "complete",
      message: `✅ LIS 完成！长度: ${lis.length}，序列: [${lis.join(", ")}]`,
    };
  },

  getCode() {
    return `// LIS - 最长递增子序列（二分优化 O(n log n)）
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
}

// 如果需要实际序列，使用路径记录版本
function getLIS(nums: number[]): number[] {
  const dp: number[] = [];
  const pos: number[] = []; // 记录在 dp 中的位置
  const prev: number[] = new Array(nums.length).fill(-1);
  
  for (let i = 0; i < nums.length; i++) {
    let left = 0, right = dp.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (dp[mid] < nums[i]) left = mid + 1;
      else right = mid;
    }
    
    if (left === dp.length) {
      dp.push(nums[i]);
    } else {
      dp[left] = nums[i];
    }
    
    pos[i] = left;
    if (left > 0) {
      // 找到前面长度为 left 的 LIS 的最后一个元素
      for (let j = i - 1; j >= 0; j--) {
        if (pos[j] === left - 1 && nums[j] < nums[i]) {
          prev[i] = j;
          break;
        }
      }
    }
  }
  
  // 回溯重建序列
  const lis: number[] = [];
  let cur = dp.length > 0 ? pos.findIndex(p => p === dp.length - 1) : -1;
  while (cur !== -1) {
    lis.unshift(nums[cur]);
    cur = prev[cur];
  }
  
  return lis;
}`;
  },
};

export default lisDefinition;
