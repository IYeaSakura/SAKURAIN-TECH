/**
 * Graph Algorithm Module
 * Contains definitions for various graph algorithms
 */

// Basic graph representations
export { adjacencyMatrixDefinition } from './adjacency-matrix';
export { adjacencyListDefinition } from './adjacency-list';
export { chainForwardStarDefinition } from './chain-forward-star';

// Traversal algorithms
export { topoSortDefinition } from './topo';
export { sccDefinition } from './scc';
export { bfsDefinition } from './bfs';
export { dfsDefinition } from './dfs';

// Shortest path algorithms
export { dijkstraDefinition } from './dijkstra';
export { bellmanFordDefinition } from './bellmanford';
export { spfaDefinition } from './spfa';
export { floydDefinition } from './floyd';

// Minimum spanning tree
export { kruskalDefinition } from './kruskal';
export { primDefinition } from './prim';

// Connectivity algorithms
export { dsuDefinition } from '../codes/dsu';
export { tarjanDefinition } from '../codes/tarjan';
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
export { dijkstraDefinition as dijkstraFullDefinition } from '../codes/dijkstra';
export { astarDefinition } from '../codes/astar';

// Import all for unified export
import { adjacencyMatrixDefinition } from './adjacency-matrix';
import { adjacencyListDefinition } from './adjacency-list';
import { chainForwardStarDefinition } from './chain-forward-star';
import { topoSortDefinition } from './topo';
import { sccDefinition } from './scc';
import { bfsDefinition } from './bfs';
import { dfsDefinition } from './dfs';
import { dijkstraDefinition } from './dijkstra';
import { bellmanFordDefinition } from './bellmanford';
import { spfaDefinition } from './spfa';
import { floydDefinition } from './floyd';
import { kruskalDefinition } from './kruskal';
import { primDefinition } from './prim';
import { dsuDefinition } from '../codes/dsu';
import { tarjanDefinition } from '../codes/tarjan';
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
import { dijkstraDefinition as dijkstraFullDefinition } from '../codes/dijkstra';
import { astarDefinition } from '../codes/astar';

export const graphAlgorithms = [
  // Level 1: Basic representations
  adjacencyMatrixDefinition,
  adjacencyListDefinition,
  chainForwardStarDefinition,
  
  // Level 2: Traversal
  bfsDefinition,
  dfsDefinition,
  
  // Level 3: Shortest path
  dijkstraDefinition,
  dijkstraFullDefinition,
  astarDefinition,
  bellmanFordDefinition,
  spfaDefinition,
  floydDefinition,
  
  // Level 4: MST
  kruskalDefinition,
  primDefinition,
  
  // Level 5: Connectivity
  topoSortDefinition,
  sccDefinition,
  tarjanDefinition,
  dsuDefinition,
  articulationPointsDefinition,
  
  // Level 6: Network flow
  dinicDefinition,
  isapDefinition,
  mcmfDefinition,
  
  // Level 7: Matching
  hungarianDefinition,
  hopcroftKarpDefinition,
  
  // Level 8: Tree algorithms
  lcaDefinition,
  hldDefinition,
  virtualTreeDefinition,
  
  // Level 9: Advanced
  lctDefinition,
  stoerWagnerDefinition
];
