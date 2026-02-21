/**
 * 算法可视化平台 - 算法核心模块
 * 包含所有算法定义和代码模板
 * 
 * 模块结构：
 * - sorting/: 排序算法
 * - graph/: 图算法
 * - dp/: 动态规划算法
 */

import type { AlgorithmDefinition, AlgorithmId, AlgorithmCategory } from '../types';

// 导入各算法模块
import { sortingAlgorithms, sortingTemplates } from './sorting';
import { graphAlgorithms } from './graph';
import { dpAlgorithms } from './dp';

// 导出各算法模块
export { sortingAlgorithms, sortingTemplates } from './sorting';
export { graphAlgorithms } from './graph';
export { dpAlgorithms } from './dp';

// ============ 所有算法 ============
export const ALL_ALGORITHMS: AlgorithmDefinition[] = [
  ...sortingAlgorithms,
  ...graphAlgorithms,
  ...dpAlgorithms
];

// ============ 代码模板获取函数 ============
export function getCodeTemplates(algorithmId: string): { language: string; label: string; code: string }[] {
  // 排序算法模板
  if (sortingTemplates[algorithmId]) {
    return sortingTemplates[algorithmId];
  }
  
  // 默认返回冒泡排序模板
  return sortingTemplates['bubble'] || [];
}

// ============ 辅助函数 ============
export function getAlgorithmById(id: AlgorithmId): AlgorithmDefinition | undefined {
  return ALL_ALGORITHMS.find(a => a.id === id);
}

export function getAlgorithmsByCategory(category: AlgorithmCategory): AlgorithmDefinition[] {
  return ALL_ALGORITHMS.filter(a => a.category === category);
}

export function getAllCategories(): { id: AlgorithmCategory; name: string; icon: string }[] {
  return [
    { id: 'sorting', name: '排序算法', icon: 'Binary' },
    { id: 'graph', name: '图算法', icon: 'GitBranch' },
    { id: 'tree', name: '树算法', icon: 'Network' },
    { id: 'dp', name: '动态规划', icon: 'Grid3X3' },
    { id: 'ml', name: '机器学习', icon: 'Brain' }
  ];
}

export default ALL_ALGORITHMS;
