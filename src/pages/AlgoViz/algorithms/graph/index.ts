/**
 * 图算法模块
 * 包含各种图算法的定义
 */

export { topoSortDefinition } from './topo';
export { sccDefinition } from './scc';
export { bfsDefinition } from './bfs';
export { dfsDefinition } from './dfs';
export { dijkstraDefinition } from './dijkstra';

// 统一导出所有图算法定义
import { topoSortDefinition } from './topo';
import { sccDefinition } from './scc';
import { bfsDefinition } from './bfs';
import { dfsDefinition } from './dfs';
import { dijkstraDefinition } from './dijkstra';

export const graphAlgorithms = [
  topoSortDefinition,
  sccDefinition,
  bfsDefinition,
  dfsDefinition,
  dijkstraDefinition
];
