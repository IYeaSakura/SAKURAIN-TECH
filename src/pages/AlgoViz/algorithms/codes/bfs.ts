/**
 * BFS (广度优先搜索) 算法代码模板
 * 支持多种编程语言
 */

export interface CodeTemplate {
  language: string;
  label: string;
  code: string;
}

export const bfsCodeTemplates: CodeTemplate[] = [
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `/**
 * BFS 广度优先搜索
 * 使用队列实现，适合求无权图的最短路径
 * @param {Map} graph - 邻接表表示的图
 * @param {number} start - 起始节点
 * @returns {number[]} - 遍历顺序
 */
function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];
  
  // 标记起点为已访问
  visited.add(start);
  
  while (queue.length > 0) {
    // 取出队首节点
    const node = queue.shift();
    result.push(node);
    
    // 遍历所有邻居
    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  
  return result;
}

// 带距离记录的BFS（求最短路径）
function bfsWithDistance(graph, start) {
  const visited = new Set();
  const queue = [[start, 0]]; // [节点, 距离]
  const distance = new Map();
  const parent = new Map();
  
  visited.add(start);
  distance.set(start, 0);
  
  while (queue.length > 0) {
    const [node, dist] = queue.shift();
    
    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        distance.set(neighbor, dist + 1);
        parent.set(neighbor, node);
        queue.push([neighbor, dist + 1]);
      }
    }
  }
  
  return { distance, parent };
}

// 重建从起点到目标节点的路径
function reconstructPath(parent, start, end) {
  const path = [];
  let current = end;
  
  while (current !== undefined) {
    path.unshift(current);
    if (current === start) break;
    current = parent.get(current);
  }
  
  return path[0] === start ? path : [];
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `from collections import deque

def bfs(graph, start):
    """
    BFS 广度优先搜索
    使用队列实现，适合求无权图的最短路径
    
    Args:
        graph: 字典表示的邻接表 {节点: [邻居列表]}
        start: 起始节点
    
    Returns:
        list: 遍历顺序
    """
    visited = set()
    queue = deque([start])
    result = []
    
    # 标记起点为已访问
    visited.add(start)
    
    while queue:
        # 取出队首节点
        node = queue.popleft()
        result.append(node)
        
        # 遍历所有邻居
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    
    return result


def bfs_with_distance(graph, start):
    """
    带距离记录的BFS（求最短路径）
    
    Returns:
        dict: 每个节点到起点的最短距离
        dict: 每个节点的父节点（用于重建路径）
    """
    visited = set()
    queue = deque([(start, 0)])  # (节点, 距离)
    distance = {start: 0}
    parent = {}
    
    visited.add(start)
    
    while queue:
        node, dist = queue.popleft()
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                distance[neighbor] = dist + 1
                parent[neighbor] = node
                queue.append((neighbor, dist + 1))
    
    return distance, parent


def reconstruct_path(parent, start, end):
    """重建从起点到目标节点的路径"""
    path = []
    current = end
    
    while current is not None:
        path.append(current)
        if current == start:
            break
        current = parent.get(current)
    
    path.reverse()
    return path if path and path[0] == start else []`
  },
  {
    language: 'cpp',
    label: 'C++',
    code: `#include <vector>
#include <queue>
#include <unordered_set>
#include <unordered_map>
#include <algorithm>

using namespace std;

/**
 * BFS 广度优先搜索
 * 使用队列实现，适合求无权图的最短路径
 */
class BFS {
public:
    // 基础BFS遍历
    vector<int> bfs(const unordered_map<int, vector<int>>& graph, int start) {
        unordered_set<int> visited;
        queue<int> q;
        vector<int> result;
        
        visited.insert(start);
        q.push(start);
        
        while (!q.empty()) {
            int node = q.front();
            q.pop();
            result.push_back(node);
            
            // 遍历邻居
            auto it = graph.find(node);
            if (it != graph.end()) {
                for (int neighbor : it->second) {
                    if (visited.find(neighbor) == visited.end()) {
                        visited.insert(neighbor);
                        q.push(neighbor);
                    }
                }
            }
        }
        
        return result;
    }
    
    // 带距离记录的BFS
    struct BFSResult {
        unordered_map<int, int> distance;
        unordered_map<int, int> parent;
    };
    
    BFSResult bfsWithDistance(const unordered_map<int, vector<int>>& graph, int start) {
        unordered_set<int> visited;
        queue<pair<int, int>> q;  // (节点, 距离)
        BFSResult result;
        
        visited.insert(start);
        q.push({start, 0});
        result.distance[start] = 0;
        
        while (!q.empty()) {
            auto [node, dist] = q.front();
            q.pop();
            
            auto it = graph.find(node);
            if (it != graph.end()) {
                for (int neighbor : it->second) {
                    if (visited.find(neighbor) == visited.end()) {
                        visited.insert(neighbor);
                        result.distance[neighbor] = dist + 1;
                        result.parent[neighbor] = node;
                        q.push({neighbor, dist + 1});
                    }
                }
            }
        }
        
        return result;
    }
    
    // 重建路径
    vector<int> reconstructPath(const unordered_map<int, int>& parent, int start, int end) {
        vector<int> path;
        int current = end;
        
        while (current != start) {
            path.push_back(current);
            auto it = parent.find(current);
            if (it == parent.end()) {
                return {};  // 无法到达
            }
            current = it->second;
        }
        path.push_back(start);
        
        reverse(path.begin(), path.end());
        return path;
    }
};`
  }
];

export default bfsCodeTemplates;
