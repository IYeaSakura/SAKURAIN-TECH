/**
 * Graph Algorithm Module
 * Contains definitions for various graph algorithms
 */

// Traversal algorithms
export { topoSortDefinition } from './topo';
export { bfsDefinition } from './bfs';
export { dfsDefinition } from './dfs';

// Shortest path algorithms
export { bellmanFordDefinition } from './bellmanford';
export { spfaDefinition } from './spfa';
export { floydDefinition } from './floyd';

// Minimum spanning tree
export { kruskalDefinition } from './kruskal';
export { primDefinition } from './prim';

// Connectivity algorithms
export { dsuDefinition } from '../codes/dsu';
export { articulationPointsDefinition } from './articulation-points';

// Network flow algorithms
export { dinicDefinition } from './dinic';
export { isapDefinition } from './isap';
export { mcmfDefinition } from './mcmf';

// Matching algorithms
export { hungarianDefinition } from './hungarian';
export { hopcroftKarpDefinition } from './hopcroft-karp';

// Tree algorithms
export { lcaDefinition } from './lca';
export { hldDefinition } from './hld';
export { virtualTreeDefinition } from './virtual-tree';

// Advanced algorithms
export { lctDefinition } from './lct';
export { stoerWagnerDefinition } from './stoer-wagner';

// Full definitions from codes directory
export { dijkstraDefinition } from '../codes/dijkstra';
export { astarDefinition } from '../codes/astar';
export { tarjanDefinition } from '../codes/tarjan';

// Import all for unified export
import { topoSortDefinition } from './topo';
import { bfsDefinition } from './bfs';
import { dfsDefinition } from './dfs';
import { bellmanFordDefinition } from './bellmanford';
import { spfaDefinition } from './spfa';
import { floydDefinition } from './floyd';
import { kruskalDefinition } from './kruskal';
import { primDefinition } from './prim';
import { dsuDefinition } from '../codes/dsu';
import { articulationPointsDefinition } from './articulation-points';
import { dinicDefinition } from './dinic';
import { isapDefinition } from './isap';
import { mcmfDefinition } from './mcmf';
import { hungarianDefinition } from './hungarian';
import { hopcroftKarpDefinition } from './hopcroft-karp';
import { lcaDefinition } from './lca';
import { hldDefinition } from './hld';
import { virtualTreeDefinition } from './virtual-tree';
import { lctDefinition } from './lct';
import { stoerWagnerDefinition } from './stoer-wagner';
import { dijkstraDefinition } from '../codes/dijkstra';
import { astarDefinition } from '../codes/astar';
import { tarjanDefinition } from '../codes/tarjan';

export const graphAlgorithms = [
  // Level 1: Traversal
  bfsDefinition,
  dfsDefinition,
  
  // Level 2: Shortest path
  dijkstraDefinition,
  astarDefinition,
  bellmanFordDefinition,
  spfaDefinition,
  floydDefinition,
  
  // Level 3: MST
  kruskalDefinition,
  primDefinition,
  
  // Level 4: Connectivity
  topoSortDefinition,
  tarjanDefinition,
  dsuDefinition,
  articulationPointsDefinition,
  
  // Level 5: Network flow
  dinicDefinition,
  isapDefinition,
  mcmfDefinition,
  
  // Level 6: Matching
  hungarianDefinition,
  hopcroftKarpDefinition,
  
  // Level 7: Tree algorithms
  lcaDefinition,
  hldDefinition,
  virtualTreeDefinition,
  
  // Level 8: Advanced
  lctDefinition,
  stoerWagnerDefinition
];
