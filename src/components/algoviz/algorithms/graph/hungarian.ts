/**
 * Hungarian Algorithm for Maximum Weight Bipartite Matching
 * Uses alternating tree + vertex labels
 * 
 * Time Complexity: O(V³)
 * Space Complexity: O(V²)
 * 
 * Finds maximum weight matching in bipartite graph.
 */

import type { AlgorithmDefinition } from '../../types';

export const hungarianDefinition: AlgorithmDefinition = {
  id: 'hungarian',
  name: '匈牙利算法 (Hungarian)',
  category: 'graph',
  timeComplexity: 'O(V³)',
  spaceComplexity: 'O(V²)',
  description: '用于二分图最大权匹配的经典算法。通过交错树和顶标优化，在O(V³)时间内找到最优匹配。适用于任务分配、资源调度等场景。',
  code: `function hungarianAlgorithm(costMatrix) {
  const n = costMatrix.length;
  const m = costMatrix[0].length;
  
  // Vertex labels
  const lx = new Array(n).fill(0);  // Left side labels
  const ly = new Array(m).fill(0);  // Right side labels
  
  // Matching
  const matchX = new Array(n).fill(-1);  // matchX[i] = j
  const matchY = new Array(m).fill(-1);  // matchY[j] = i
  
  // Slack for each right vertex
  const slack = new Array(m).fill(0);
  const slackX = new Array(m).fill(0);
  
  // Visited flags
  const visX = new Array(n).fill(false);
  const visY = new Array(m).fill(false);
  
  // Initialize labels
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      lx[i] = Math.max(lx[i], costMatrix[i][j]);
    }
  }
  
  // Find augmenting path from left vertex u
  function findPath(u) {
    visX.fill(false);
    visY.fill(false);
    slack.fill(Infinity);
    
    const queue = [u];
    visX[u] = true;
    
    while (true) {
      while (queue.length > 0) {
        const x = queue.shift();
        
        for (let y = 0; y < m; y++) {
          if (visY[y]) continue;
          
          const delta = lx[x] + ly[y] - costMatrix[x][y];
          if (delta < slack[y]) {
            slack[y] = delta;
            slackX[y] = x;
          }
          
          if (slack[y] === 0) {
            visY[y] = true;
            if (matchY[y] === -1) {
              // Found augmenting path
              augment(y);
              return true;
            } else {
              visX[matchY[y]] = true;
              queue.push(matchY[y]);
            }
          }
        }
      }
      
      // Update labels
      let delta = Infinity;
      for (let y = 0; y < m; y++) {
        if (!visY[y]) {
          delta = Math.min(delta, slack[y]);
        }
      }
      
      for (let x = 0; x < n; x++) {
        if (visX[x]) lx[x] -= delta;
      }
      for (let y = 0; y < m; y++) {
        if (visY[y]) ly[y] += delta;
        else slack[y] -= delta;
      }
      
      // Try to find augmenting path again
      for (let y = 0; y < m; y++) {
        if (!visY[y] && slack[y] === 0) {
          visY[y] = true;
          if (matchY[y] === -1) {
            augment(y);
            return true;
          } else {
            visX[matchY[y]] = true;
            queue.push(matchY[y]);
          }
        }
      }
    }
  }
  
  // Augment along path ending at y
  function augment(y) {
    while (y !== -1) {
      const x = slackX[y];
      const nextY = matchX[x];
      matchX[x] = y;
      matchY[y] = x;
      y = nextY;
    }
  }
  
  // Main algorithm
  for (let i = 0; i < n; i++) {
    findPath(i);
  }
  
  // Calculate total cost
  let totalCost = 0;
  const matches = [];
  for (let i = 0; i < n; i++) {
    if (matchX[i] !== -1) {
      totalCost += costMatrix[i][matchX[i]];
      matches.push({ left: i, right: matchX[i], cost: costMatrix[i][matchX[i]] });
    }
  }
  
  return { matches, totalCost, matchX, matchY };
}

// Usage:
// const costMatrix = [
//   [90, 75, 75, 80],
//   [35, 85, 55, 65],
//   [125, 95, 90, 105],
//   [45, 110, 95, 115]
// ];
// const result = hungarianAlgorithm(costMatrix);
// console.log('Maximum cost:', result.totalCost);
// console.log('Matches:', result.matches);`,
  supportedViews: ['graph', 'matrix'],
  parameters: [
    { name: 'leftSize', type: 'number', default: 4, min: 3, max: 6 },
    { name: 'rightSize', type: 'number', default: 4, min: 3, max: 6 }
  ]
};
