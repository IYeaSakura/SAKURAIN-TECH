/**
 * 动态规划算法模块
 * 包含各种动态规划算法的定义
 */

export { knapsackDefinition } from './knapsack';
export { lcsDefinition } from './lcs';
export { lisDefinition } from './lis';
export { editDistanceDefinition } from './edit-distance';
export { matrixChainDefinition } from './matrix-chain';
export { knapsackCompleteDefinition } from './knapsack-complete';
export { trianglePathDefinition } from './triangle-path';
export { lcSubstringDefinition } from './lc-substring';
export { rodCuttingDefinition } from './rod-cutting';

// 统一导出所有动态规划算法定义
import { knapsackDefinition } from './knapsack';
import { lcsDefinition } from './lcs';
import { lisDefinition } from './lis';
import { editDistanceDefinition } from './edit-distance';
import { matrixChainDefinition } from './matrix-chain';
import { knapsackCompleteDefinition } from './knapsack-complete';
import { trianglePathDefinition } from './triangle-path';
import { lcSubstringDefinition } from './lc-substring';
import { rodCuttingDefinition } from './rod-cutting';

export const dpAlgorithms = [
  knapsackDefinition,
  lcsDefinition,
  lisDefinition,
  editDistanceDefinition,
  matrixChainDefinition,
  knapsackCompleteDefinition,
  trianglePathDefinition,
  lcSubstringDefinition,
  rodCuttingDefinition,
];
