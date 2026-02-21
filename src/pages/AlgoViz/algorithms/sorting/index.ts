/**
 * 排序算法模块
 * 包含各种排序算法的定义和代码模板
 */

export { bubbleSortDefinition, bubbleSortTemplates } from './bubble';
export { selectionSortDefinition, selectionSortTemplates } from './selection';
export { quickSortDefinition, quickSortTemplates } from './quick';
export { mergeSortDefinition, mergeSortTemplates } from './merge';
export { heapSortDefinition, heapSortTemplates } from './heap';

// 统一导出所有排序算法定义
import { bubbleSortDefinition } from './bubble';
import { selectionSortDefinition } from './selection';
import { quickSortDefinition } from './quick';
import { mergeSortDefinition } from './merge';
import { heapSortDefinition } from './heap';

export const sortingAlgorithms = [
  bubbleSortDefinition,
  selectionSortDefinition,
  quickSortDefinition,
  mergeSortDefinition,
  heapSortDefinition
];

// 代码模板映射
import { bubbleSortTemplates } from './bubble';
import { selectionSortTemplates } from './selection';
import { quickSortTemplates } from './quick';
import { mergeSortTemplates } from './merge';
import { heapSortTemplates } from './heap';

export const sortingTemplates: Record<string, { language: string; label: string; code: string }[]> = {
  bubble: bubbleSortTemplates,
  selection: selectionSortTemplates,
  quick: quickSortTemplates,
  merge: mergeSortTemplates,
  heap: heapSortTemplates
};
