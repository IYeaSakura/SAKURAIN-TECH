/**
 * 动态规划算法模块
 * 包含各种动态规划算法的定义
 */

export { knapsackDefinition } from './knapsack';
export { lcsDefinition } from './lcs';

// 统一导出所有动态规划算法定义
import { knapsackDefinition } from './knapsack';
import { lcsDefinition } from './lcs';

export const dpAlgorithms = [
  knapsackDefinition,
  lcsDefinition
];
