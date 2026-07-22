/**
 * DFS (深度优先搜索) 算法代码模板
 * 支持多种编程语言
 */

export interface CodeTemplate {
  language: string;
  label: string;
  code: string;
}

export const dfsCodeTemplates: CodeTemplate[] = [
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `/**
 * DFS 深度优先搜索
 * 使用递归或栈实现，适合连通性检测、路径查找
 * @param {Map} graph - 邻接表表示的图
 * @param {number} start - 起始节点
 * @returns {number[]} - 遍历顺序
 */

// 递归实现
function dfsRecursive(graph, start) {
  const visited = new Set();
  const result = [];
  
  function explore(node) {
    visited.add(node);
    result.push(node);
    
    // 遍历所有未访问的邻居
    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        explore(neighbor);
      }
    }
  }
  
  explore(start);
  return result;
}

// 栈实现（显式栈）
function dfsIterative(graph, start) {
  const visited = new Set();
  const stack = [start];
  const result = [];
  
  while (stack.length > 0) {
    const node = stack.pop();
    
    if (!visited.has(node)) {
      visited.add(node);
      result.push(node);
      
      // 将邻居压入栈（注意顺序，保证遍历顺序）
      const neighbors = graph.get(node) || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }
  
  return result;
}

// 带回溯路径记录的DFS
function dfsWithPath(graph, start) {
  const visited = new Set();
  const path = [];
  const allPaths = [];
  
  function backtrack(node) {
    visited.add(node);
    path.push(node);
    
    // 如果当前节点是叶子节点，记录路径
    const neighbors = graph.get(node) || [];
    const unvisitedNeighbors = neighbors.filter(n => !visited.has(n));
    
    if (unvisitedNeighbors.length === 0) {
      allPaths.push([...path]);
    } else {
      for (const neighbor of unvisitedNeighbors) {
        backtrack(neighbor);
      }
    }
    
    // 回溯
    path.pop();
    visited.delete(node);
  }
  
  backtrack(start);
  return allPaths;
}

// 检测图中是否存在环（使用DFS）
function hasCycle(graph) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  
  // 初始化所有节点为白色（未访问）
  for (const node of graph.keys()) {
    color.set(node, WHITE);
  }
  
  function dfs(node) {
    color.set(node, GRAY);  // 标记为灰色（正在访问）
    
    for (const neighbor of graph.get(node) || []) {
      if (color.get(neighbor) === GRAY) {
        return true;  // 发现回边，存在环
      }
      if (color.get(neighbor) === WHITE && dfs(neighbor)) {
        return true;
      }
    }
    
    color.set(node, BLACK);  // 标记为黑色（访问完成）
    return false;
  }
  
  for (const node of graph.keys()) {
    if (color.get(node) === WHITE) {
      if (dfs(node)) return true;
    }
  }
  
  return false;
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def dfs_recursive(graph, start):
    """
    DFS 深度优先搜索 - 递归实现
    适合连通性检测、路径查找
    
    Args:
        graph: 字典表示的邻接表 {节点: [邻居列表]}
        start: 起始节点
    
    Returns:
        list: 遍历顺序
    """
    visited = set()
    result = []
    
    def explore(node):
        visited.add(node)
        result.append(node)
        
        # 遍历所有未访问的邻居
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                explore(neighbor)
    
    explore(start)
    return result


def dfs_iterative(graph, start):
    """
    DFS 深度优先搜索 - 栈实现（显式栈）
    """
    visited = set()
    stack = [start]
    result = []
    
    while stack:
        node = stack.pop()
        
        if node not in visited:
            visited.add(node)
            result.append(node)
            
            # 将邻居压入栈（注意顺序）
            neighbors = graph.get(node, [])
            for neighbor in reversed(neighbors):
                if neighbor not in visited:
                    stack.append(neighbor)
    
    return result


def dfs_with_path(graph, start):
    """
    带回溯路径记录的DFS
    返回从起点到所有叶子节点的路径
    """
    visited = set()
    path = []
    all_paths = []
    
    def backtrack(node):
        visited.add(node)
        path.append(node)
        
        # 获取未访问的邻居
        neighbors = [n for n in graph.get(node, []) if n not in visited]
        
        # 如果是叶子节点，记录路径
        if not neighbors:
            all_paths.append(path[:])
        else:
            for neighbor in neighbors:
                backtrack(neighbor)
        
        # 回溯
        path.pop()
        visited.remove(node)
    
    backtrack(start)
    return all_paths


def has_cycle(graph):
    """
    检测有向图中是否存在环（使用三色标记法）
    
    WHITE = 0: 未访问
    GRAY = 1:  正在访问（在当前DFS路径上）
    BLACK = 2: 访问完成
    """
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {node: WHITE for node in graph}
    
    def dfs(node):
        color[node] = GRAY
        
        for neighbor in graph.get(node, []):
            if color[neighbor] == GRAY:
                return True  # 发现回边，存在环
            if color[neighbor] == WHITE and dfs(neighbor):
                return True
        
        color[node] = BLACK
        return False
    
    for node in graph:
        if color[node] == WHITE:
            if dfs(node):
                return True
    
    return False`
  },
  {
    language: 'cpp',
    label: 'C++',
    code: `#include <vector>
#include <stack>
#include <unordered_set>
#include <unordered_map>
#include <algorithm>

using namespace std;

/**
 * DFS 深度优先搜索
 * 使用递归或栈实现，适合连通性检测、路径查找
 */
class DFS {
public:
    // 递归实现
    vector<int> dfsRecursive(const unordered_map<int, vector<int>>& graph, int start) {
        unordered_set<int> visited;
        vector<int> result;
        
        function<void(int)> explore = [&](int node) {
            visited.insert(node);
            result.push_back(node);
            
            auto it = graph.find(node);
            if (it != graph.end()) {
                for (int neighbor : it->second) {
                    if (visited.find(neighbor) == visited.end()) {
                        explore(neighbor);
                    }
                }
            }
        };
        
        explore(start);
        return result;
    }
    
    // 栈实现（显式栈）
    vector<int> dfsIterative(const unordered_map<int, vector<int>>& graph, int start) {
        unordered_set<int> visited;
        stack<int> stk;
        vector<int> result;
        
        stk.push(start);
        
        while (!stk.empty()) {
            int node = stk.top();
            stk.pop();
            
            if (visited.find(node) == visited.end()) {
                visited.insert(node);
                result.push_back(node);
                
                auto it = graph.find(node);
                if (it != graph.end()) {
                    // 反向遍历以保证顺序
                    for (auto rit = it->second.rbegin(); rit != it->second.rend(); ++rit) {
                        if (visited.find(*rit) == visited.end()) {
                            stk.push(*rit);
                        }
                    }
                }
            }
        }
        
        return result;
    }
    
    // 带回溯路径记录的DFS
    vector<vector<int>> dfsWithPath(const unordered_map<int, vector<int>>& graph, int start) {
        unordered_set<int> visited;
        vector<int> path;
        vector<vector<int>> allPaths;
        
        function<void(int)> backtrack = [&](int node) {
            visited.insert(node);
            path.push_back(node);
            
            auto it = graph.find(node);
            bool isLeaf = true;
            
            if (it != graph.end()) {
                for (int neighbor : it->second) {
                    if (visited.find(neighbor) == visited.end()) {
                        isLeaf = false;
                        backtrack(neighbor);
                    }
                }
            }
            
            if (isLeaf) {
                allPaths.push_back(path);
            }
            
            // 回溯
            path.pop_back();
            visited.erase(node);
        };
        
        backtrack(start);
        return allPaths;
    }
    
    // 检测有向图中是否存在环（三色标记法）
    bool hasCycle(const unordered_map<int, vector<int>>& graph) {
        enum Color { WHITE = 0, GRAY = 1, BLACK = 2 };
        unordered_map<int, Color> color;
        
        // 初始化所有节点为白色
        for (const auto& pair : graph) {
            color[pair.first] = WHITE;
        }
        
        function<bool(int)> dfs = [&](int node) -> bool {
            color[node] = GRAY;
            
            auto it = graph.find(node);
            if (it != graph.end()) {
                for (int neighbor : it->second) {
                    if (color[neighbor] == GRAY) {
                        return true;  // 发现回边
                    }
                    if (color[neighbor] == WHITE && dfs(neighbor)) {
                        return true;
                    }
                }
            }
            
            color[node] = BLACK;
            return false;
        };
        
        for (const auto& pair : graph) {
            if (color[pair.first] == WHITE) {
                if (dfs(pair.first)) return true;
            }
        }
        
        return false;
    }
};`
  }
];

export default dfsCodeTemplates;
