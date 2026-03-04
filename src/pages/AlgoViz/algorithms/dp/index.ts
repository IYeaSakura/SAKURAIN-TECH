/**
 * 动态规划算法模块
 * 包含各种动态规划算法的定义
 */

export { knapsackDefinition } from './knapsack';
export { lcsDefinition } from './lcs';

// 以下算法待实现后 uncomment
// export { lisDefinition } from './lis';
// export { editDistanceDefinition } from './edit-distance';
// export { matrixChainDefinition } from './matrix-chain';

// 统一导出所有动态规划算法定义
import { knapsackDefinition } from './knapsack';
import { lcsDefinition } from './lcs';

export const dpAlgorithms = [
  knapsackDefinition,
  lcsDefinition,
  // 待实现的算法:
  // lisDefinition,
  // editDistanceDefinition,
  // matrixChainDefinition,
];
