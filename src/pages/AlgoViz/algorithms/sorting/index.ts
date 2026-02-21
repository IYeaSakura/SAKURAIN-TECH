/**
 * 排序算法模块
 * 包含各种排序算法的定义和代码模板
 */

export { bubbleSortDefinition, bubbleSortTemplates } from './bubble';
export { selectionSortDefinition, selectionSortTemplates } from './selection';
export { insertionSortDefinition, insertionSortTemplates } from './insertion';
export { shellSortDefinition, shellSortTemplates } from './shell';
export { quickSortDefinition, quickSortTemplates } from './quick';
export { mergeSortDefinition, mergeSortTemplates } from './merge';
export { heapSortDefinition, heapSortTemplates } from './heap';
export { countingSortDefinition, countingSortTemplates } from './counting';
export { radixSortDefinition, radixSortTemplates } from './radix';
export { bucketSortDefinition, bucketSortTemplates } from './bucket';
export { timsortDefinition, timsortTemplates } from './timsort';

// 统一导出所有排序算法定义
import { bubbleSortDefinition } from './bubble';
import { selectionSortDefinition } from './selection';
import { insertionSortDefinition } from './insertion';
import { shellSortDefinition } from './shell';
import { quickSortDefinition } from './quick';
import { mergeSortDefinition } from './merge';
import { heapSortDefinition } from './heap';
import { countingSortDefinition } from './counting';
import { radixSortDefinition } from './radix';
import { bucketSortDefinition } from './bucket';
import { timsortDefinition } from './timsort';

export const sortingAlgorithms = [
  bubbleSortDefinition,
  selectionSortDefinition,
  insertionSortDefinition,
  shellSortDefinition,
  quickSortDefinition,
  mergeSortDefinition,
  heapSortDefinition,
  countingSortDefinition,
  radixSortDefinition,
  bucketSortDefinition,
  timsortDefinition
];

// 代码模板映射
import { bubbleSortTemplates } from './bubble';
import { selectionSortTemplates } from './selection';
import { insertionSortTemplates } from './insertion';
import { shellSortTemplates } from './shell';
import { quickSortTemplates } from './quick';
import { mergeSortTemplates } from './merge';
import { heapSortTemplates } from './heap';
import { countingSortTemplates } from './counting';
import { radixSortTemplates } from './radix';
import { bucketSortTemplates } from './bucket';
import { timsortTemplates } from './timsort';

export const sortingTemplates: Record<string, { language: string; label: string; code: string }[]> = {
  bubble: bubbleSortTemplates,
  selection: selectionSortTemplates,
  insertion: insertionSortTemplates,
  shell: shellSortTemplates,
  quick: quickSortTemplates,
  merge: mergeSortTemplates,
  heap: heapSortTemplates,
  counting: countingSortTemplates,
  radix: radixSortTemplates,
  bucket: bucketSortTemplates,
  timsort: timsortTemplates
};
