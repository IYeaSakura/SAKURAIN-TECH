/**
 * 网格地图生成器
 * 用于A*等网格寻路算法的数据生成
 */

import type { GraphNode, GraphEdge, GraphData } from '../types';

export interface GridMapOptions {
  rows?: number;
  cols?: number;
  obstacleRate?: number; // 0-1，障碍物比例
  pattern?: 'random' | 'maze' | 'rooms' | 'corridors' | 'cave';
  ensurePath?: boolean; // 确保起点到终点有路径
  randomStartGoal?: boolean; // 是否随机起点和终点位置
}

export interface GridCell {
  x: number;
  y: number;
  isObstacle: boolean;
  isStart: boolean;
  isGoal: boolean;
  // A*算法状态
  g?: number; // 从起点到当前节点的实际代价
  h?: number; // 从当前节点到终点的估计代价
  f?: number; // g + h
  parent?: { x: number; y: number } | null;
  // 可视化状态
  inOpenSet?: boolean;
  inClosedSet?: boolean;
  isPath?: boolean;
}

export interface GridMapData {
  rows: number;
  cols: number;
  cells: GridCell[][];
  start: { x: number; y: number };
  goal: { x: number; y: number };
  // 转换为GraphData用于可视化
  graphData: GraphData;
}

/**
 * 生成网格地图
 */
export function generateGridMap(options: GridMapOptions = {}): GridMapData {
  const {
    rows = 15,
    cols = 15,
    obstacleRate = 0.3,
    pattern = 'random',
    ensurePath = true,
    randomStartGoal = true
  } = options;

  // 初始化网格
  const cells: GridCell[][] = [];
  for (let y = 0; y < rows; y++) {
    cells[y] = [];
    for (let x = 0; x < cols; x++) {
      cells[y][x] = {
        x,
        y,
        isObstacle: false,
        isStart: false,
        isGoal: false,
        g: Infinity,
        h: 0,
        f: Infinity,
        parent: null,
        inOpenSet: false,
        inClosedSet: false,
        isPath: false
      };
    }
  }

  // 设置起点和终点
  let start: { x: number; y: number };
  let goal: { x: number; y: number };
  
  if (randomStartGoal) {
    // 随机生成起点和终点，确保它们在对角区域（增加路径长度和复杂度）
    const margin = 2; // 边距
    // 起点在左上区域
    start = {
      x: margin + Math.floor(Math.random() * Math.floor(cols / 3)),
      y: margin + Math.floor(Math.random() * Math.floor(rows / 3))
    };
    // 终点在右下区域
    goal = {
      x: cols - margin - 1 - Math.floor(Math.random() * Math.floor(cols / 3)),
      y: rows - margin - 1 - Math.floor(Math.random() * Math.floor(rows / 3))
    };
  } else {
    // 固定在对角（但避免在边界上，确保与迷宫生成兼容）
    start = { x: 1, y: 1 };
    goal = { x: cols - 2, y: rows - 2 };
  }
  
  cells[start.y][start.x].isStart = true;
  cells[goal.y][goal.x].isGoal = true;

  // 根据模式生成障碍物
  switch (pattern) {
    case 'maze':
      generateMaze(cells, rows, cols, ensurePath, start, goal);
      break;
    case 'rooms':
      generateRooms(cells, rows, cols, obstacleRate);
      break;
    case 'corridors':
      generateCorridors(cells, rows, cols, obstacleRate);
      break;
    case 'cave':
      generateCave(cells, rows, cols, ensurePath, start, goal);
      break;
    default:
      generateRandomObstacles(cells, rows, cols, obstacleRate, ensurePath, start, goal);
  }

  // 转换为GraphData
  const graphData = convertToGraphData(cells, rows, cols);

  return {
    rows,
    cols,
    cells,
    start,
    goal,
    graphData
  };
}

/**
 * 随机生成障碍物
 */
function generateRandomObstacles(
  cells: GridCell[][],
  rows: number,
  cols: number,
  obstacleRate: number,
  ensurePath: boolean,
  start: { x: number; y: number },
  goal: { x: number; y: number }
): void {
  // 随机放置障碍物
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // 起点和终点不能是障碍物
      if ((x === start.x && y === start.y) || (x === goal.x && y === goal.y)) {
        continue;
      }
      if (Math.random() < obstacleRate) {
        cells[y][x].isObstacle = true;
      }
    }
  }

  // 如果需要确保路径存在，进行BFS检查
  if (ensurePath) {
    ensurePathExists(cells, rows, cols, start, goal);
  }
}

/**
 * 生成混合迷宫-洞穴结构
 * 结合递归回溯迷宫的规则性和细胞自动机洞穴的复杂性
 */
function generateMaze(
  cells: GridCell[][], 
  rows: number, 
  cols: number,
  ensurePath: boolean,
  start: { x: number; y: number },
  goal: { x: number; y: number }
): void {
  // 第一步：使用递归回溯生成基础迷宫
  // 初始化所有单元格为障碍物（墙）
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells[y][x].isObstacle = true;
    }
  }

  // 递归回溯生成完美迷宫
  // 从奇数坐标开始，确保迷宫单元格都在奇数位置
  const stack: { x: number; y: number }[] = [];
  const visited = new Set<string>();
  
  const mazeStart = { x: 1, y: 1 };
  stack.push(mazeStart);
  visited.add(`${mazeStart.x},${mazeStart.y}`);
  cells[mazeStart.y][mazeStart.x].isObstacle = false;

  const directions = [
    { x: 0, y: -2 },
    { x: 0, y: 2 },
    { x: -2, y: 0 },
    { x: 2, y: 0 }
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    
    const neighbors: { x: number; y: number; dx: number; dy: number }[] = [];
    
    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      
      // 关键修复：确保不触及最外层边界（留出1格宽的墙）
      // 这样最外层边界就是独立的一层墙，不会形成双层边界
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && !visited.has(`${nx},${ny}`)) {
        neighbors.push({ x: nx, y: ny, dx: dir.x / 2, dy: dir.y / 2 });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      cells[current.y + next.dy][current.x + next.dx].isObstacle = false;
      cells[next.y][next.x].isObstacle = false;
      visited.add(`${next.x},${next.y}`);
      stack.push({ x: next.x, y: next.y });
    } else {
      stack.pop();
    }
  }
  
  // 第二步：确保边界始终是墙（最外层边界）
  // 上边界和下边界
  for (let x = 0; x < cols; x++) {
    cells[0][x].isObstacle = true;
    cells[rows - 1][x].isObstacle = true;
  }
  // 左边界和右边界
  for (let y = 0; y < rows; y++) {
    cells[y][0].isObstacle = true;
    cells[y][cols - 1].isObstacle = true;
  }

  // 修复双层边界问题：打通紧邻边界的内部墙
  // 当网格尺寸为偶数时，迷宫生成会在边界前留下一层额外的墙
  // 这里适当打通这些墙，避免双层边界效果
  const fixDoubleBoundary = () => {
    // 检查右边界附近的墙 (cols - 2)
    for (let y = 1; y < rows - 1; y++) {
      if (cells[y][cols - 2].isObstacle) {
        // 如果左侧有通道，则打通这面墙
        if (!cells[y][cols - 3].isObstacle) {
          // 50%概率打通，保留一些墙保持迷宫复杂性
          if (Math.random() < 0.5) {
            cells[y][cols - 2].isObstacle = false;
          }
        }
      }
    }
    
    // 检查左边界附近的墙 (1)
    for (let y = 1; y < rows - 1; y++) {
      if (cells[y][1].isObstacle && !cells[y][2].isObstacle) {
        if (Math.random() < 0.3) {
          cells[y][1].isObstacle = false;
        }
      }
    }
    
    // 检查下边界附近的墙 (rows - 2)
    for (let x = 1; x < cols - 1; x++) {
      if (cells[rows - 2][x].isObstacle && !cells[rows - 3][x].isObstacle) {
        if (Math.random() < 0.5) {
          cells[rows - 2][x].isObstacle = false;
        }
      }
    }
    
    // 检查上边界附近的墙 (1)
    for (let x = 1; x < cols - 1; x++) {
      if (cells[1][x].isObstacle && !cells[2][x].isObstacle) {
        if (Math.random() < 0.3) {
          cells[1][x].isObstacle = false;
        }
      }
    }
  };
  
  fixDoubleBoundary();

  // 第三步：添加环路 - 随机打通一些墙壁创建分支
  // 降低比例避免太开放，同时避免成块空白
  const extraOpenings = Math.floor(rows * cols * 0.04); // 4%的额外开口
  for (let i = 0; i < extraOpenings; i++) {
    const x = 2 + Math.floor(Math.random() * (cols - 4));
    const y = 2 + Math.floor(Math.random() * (rows - 4));
    
    // 只打通原本是墙的格子，且不是起点/终点
    if (cells[y][x].isObstacle && !(x === start.x && y === start.y) && !(x === goal.x && y === goal.y)) {
      // 限制条件更严格：避免形成大的开放区域
      let openNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !cells[ny][nx].isObstacle) {
            openNeighbors++;
          }
        }
      }
      // 只有当周围有1-3个开放邻居时才打通（更严格限制避免成块空白）
      if (openNeighbors >= 1 && openNeighbors <= 3) {
        cells[y][x].isObstacle = false;
      }
    }
  }

  // 第四步：确保起点和终点是开放的
  cells[start.y][start.x].isObstacle = false;
  cells[goal.y][goal.x].isObstacle = false;
  
  // 第五步：确保起点和终点周围至少有一个出口
  const ensureExit = (x: number, y: number) => {
    const dirs = [{x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0}];
    let hasExit = false;
    for (const d of dirs) {
      const nx = x + d.x;
      const ny = y + d.y;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && !cells[ny][nx].isObstacle) {
        hasExit = true;
        break;
      }
    }
    if (!hasExit) {
      // 随机打开一个邻居（确保不是边界）
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      const nx = Math.max(1, Math.min(cols - 2, x + d.x));
      const ny = Math.max(1, Math.min(rows - 2, y + d.y));
      cells[ny][nx].isObstacle = false;
    }
  };
  
  ensureExit(start.x, start.y);
  ensureExit(goal.x, goal.y);
  
  // 第六步：严格确保起点到终点连通
  if (ensurePath) {
    ensurePathExists(cells, rows, cols, start, goal);
  }
}

/**
 * 生成房间式地图
 */
function generateRooms(
  cells: GridCell[][],
  rows: number,
  cols: number,
  obstacleRate: number
): void {
  // 先随机生成
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (cells[y][x].isStart || cells[y][x].isGoal) continue;
      cells[y][x].isObstacle = Math.random() < obstacleRate;
    }
  }

  // 创建一些开放房间区域
  const roomCount = Math.floor(Math.min(rows, cols) / 3);
  for (let i = 0; i < roomCount; i++) {
    const roomW = 2 + Math.floor(Math.random() * 3);
    const roomH = 2 + Math.floor(Math.random() * 3);
    const roomX = Math.floor(Math.random() * (cols - roomW - 2)) + 1;
    const roomY = Math.floor(Math.random() * (rows - roomH - 2)) + 1;

    for (let y = roomY; y < roomY + roomH && y < rows - 1; y++) {
      for (let x = roomX; x < roomX + roomW && x < cols - 1; x++) {
        cells[y][x].isObstacle = false;
      }
    }
  }
}

/**
 * 生成走廊式地图
 */
function generateCorridors(
  cells: GridCell[][],
  rows: number,
  cols: number,
  _obstacleRate: number
): void {
  // 初始化为障碍物
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!cells[y][x].isStart && !cells[y][x].isGoal) {
        cells[y][x].isObstacle = Math.random() < 0.7;
      }
    }
  }

  // 创建水平和垂直走廊
  const corridorCount = Math.floor(Math.min(rows, cols) / 2);
  
  for (let i = 0; i < corridorCount; i++) {
    // 水平走廊
    const hy = Math.floor(Math.random() * rows);
    for (let x = 0; x < cols; x++) {
      cells[hy][x].isObstacle = false;
    }
    
    // 垂直走廊
    const vx = Math.floor(Math.random() * cols);
    for (let y = 0; y < rows; y++) {
      cells[y][vx].isObstacle = false;
    }
  }
}

/**
 * 生成洞穴式地图（使用细胞自动机算法）
 * 类似于像素游戏中的洞穴，有很多分支和环路
 */
function generateCave(
  cells: GridCell[][],
  rows: number,
  cols: number,
  ensurePath: boolean,
  start: { x: number; y: number },
  goal: { x: number; y: number }
): void {
  // 初始化：随机填充障碍物（较高的初始密度）
  const initialDensity = 0.52; // 52%的初始障碍物密度
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // 边界保持为障碍物
      if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) {
        cells[y][x].isObstacle = true;
      } else if ((x === start.x && y === start.y) || (x === goal.x && y === goal.y)) {
        // 起点和终点不能是障碍物
        cells[y][x].isObstacle = false;
      } else {
        cells[y][x].isObstacle = Math.random() < initialDensity;
      }
    }
  }
  
  // 细胞自动机迭代（平滑处理）
  const iterations = 6;
  
  for (let iter = 0; iter < iterations; iter++) {
    const newCells = cells.map(row => row.map(cell => ({ ...cell })));
    
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        // 跳过起点和终点
        if ((x === start.x && y === start.y) || (x === goal.x && y === goal.y)) {
          continue;
        }
        
        // 计算邻居中的障碍物数量（包括对角线）
        let obstacleCount = 0;
        let totalNeighbors = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              totalNeighbors++;
              if (cells[ny][nx].isObstacle) {
                obstacleCount++;
              }
            }
          }
        }
        
        // 细胞自动机规则：
        // 1. 如果当前是墙且邻居墙少于4个，变成空地
        // 2. 如果当前是空地且邻居墙多于5个，变成墙
        if (cells[y][x].isObstacle && obstacleCount < 4) {
          newCells[y][x].isObstacle = false;
        } else if (!cells[y][x].isObstacle && obstacleCount > 5) {
          newCells[y][x].isObstacle = true;
        }
      }
    }
    
    // 复制回原始数组
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        cells[y][x].isObstacle = newCells[y][x].isObstacle;
      }
    }
  }
  
  // 创建一些额外的开口以增加环路和分支
  const extraOpenings = Math.floor(rows * cols * 0.02); // 2%的额外开口
  for (let i = 0; i < extraOpenings; i++) {
    const x = 2 + Math.floor(Math.random() * (cols - 4));
    const y = 2 + Math.floor(Math.random() * (rows - 4));
    cells[y][x].isObstacle = false;
  }
  
  // 如果需要确保路径存在
  if (ensurePath) {
    ensurePathExists(cells, rows, cols, start, goal);
  }
}

/**
 * 确保起点到终点存在路径（使用BFS）
 */
function ensurePathExists(
  cells: GridCell[][],
  rows: number,
  cols: number,
  start: { x: number; y: number },
  goal: { x: number; y: number }
): void {
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ];

  // BFS寻找路径
  const queue: { x: number; y: number }[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const parent = new Map<string, { x: number; y: number } | null>();
  parent.set(`${start.x},${start.y}`, null);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.x === goal.x && current.y === goal.y) {
      // 找到路径，无需处理
      return;
    }

    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key = `${nx},${ny}`;

      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && 
          !visited.has(key) && !cells[ny][nx].isObstacle) {
        visited.add(key);
        parent.set(key, current);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  // 如果没有找到路径，使用BFS找到可达区域中最接近目标的点，然后打通路径
  // 或者简单地在起点和终点之间创建一条L形或直线路径
  
  // 方法：从起点和终点同时进行BFS，找到最近的可以连接的两点
  const startQueue: { x: number; y: number }[] = [start];
  const startVisited = new Set<string>([`${start.x},${start.y}`]);
  const startParent = new Map<string, { x: number; y: number } | null>();
  startParent.set(`${start.x},${start.y}`, null);
  
  const goalQueue: { x: number; y: number }[] = [goal];
  const goalVisited = new Set<string>([`${goal.x},${goal.y}`]);
  const goalParent = new Map<string, { x: number; y: number } | null>();
  goalParent.set(`${goal.x},${goal.y}`, null);
  
  let meetPoint: { x: number; y: number } | null = null;
  let fromStart = true;
  
  // 双向BFS寻找连接点
  while ((startQueue.length > 0 || goalQueue.length > 0) && !meetPoint) {
    const queue = fromStart ? startQueue : goalQueue;
    const visited = fromStart ? startVisited : goalVisited;
    const otherVisited = fromStart ? goalVisited : startVisited;
    const parent = fromStart ? startParent : goalParent;
    
    if (queue.length === 0) {
      fromStart = !fromStart;
      continue;
    }
    
    const current = queue.shift()!;
    
    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key = `${nx},${ny}`;
      
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited.has(key)) {
        if (otherVisited.has(key)) {
          // 找到连接点
          meetPoint = { x: nx, y: ny };
          break;
        }
        
        // 只遍历空地，如果是墙则跳过（但在下一步会考虑打通）
        if (!cells[ny][nx].isObstacle) {
          visited.add(key);
          parent.set(key, current);
          queue.push({ x: nx, y: ny });
        }
      }
    }
    
    fromStart = !fromStart;
  }
  
  if (meetPoint) {
    // 找到了连接点，打通从起点到连接点的路径
    let current: { x: number; y: number } | null = meetPoint;
    while (current) {
      cells[current.y][current.x].isObstacle = false;
      current = startParent.get(`${current.x},${current.y}`) || null;
    }
    // 打通从终点到连接点的路径
    current = meetPoint;
    while (current) {
      cells[current.y][current.x].isObstacle = false;
      current = goalParent.get(`${current.x},${current.y}`) || null;
    }
  } else {
    //  fallback：直接创建一条直线路径
    let current = { ...start };
    while (current.x !== goal.x || current.y !== goal.y) {
      if (current.x < goal.x) current.x++;
      else if (current.x > goal.x) current.x--;
      else if (current.y < goal.y) current.y++;
      else if (current.y > goal.y) current.y--;
      
      cells[current.y][current.x].isObstacle = false;
    }
  }
}

/**
 * 将网格地图转换为GraphData
 */
function convertToGraphData(cells: GridCell[][], rows: number, cols: number): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  const nodeMap = new Map<string, number>(); // key -> nodeId
  let nodeId = 0;

  // 创建节点（非障碍物）
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!cells[y][x].isObstacle) {
        nodes.push({
          id: nodeId,
          x: x * 40 + 50, // 可视化位置
          y: y * 40 + 50,
          label: `(${x},${y})`,
          visited: false,
          distance: Infinity
        });
        nodeMap.set(`${x},${y}`, nodeId);
        nodeId++;
      }
    }
  }

  // 创建边（四方向连接）
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (cells[y][x].isObstacle) continue;
      
      const fromId = nodeMap.get(`${x},${y}`);
      if (fromId === undefined) continue;

      for (const dir of directions) {
        const nx = x + dir.x;
        const ny = y + dir.y;
        
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !cells[ny][nx].isObstacle) {
          const toId = nodeMap.get(`${nx},${ny}`);
          if (toId !== undefined && toId > fromId) { // 避免重复边
            edges.push({
              from: fromId,
              to: toId,
              weight: 1 // 网格移动代价为1
            });
          }
        }
      }
    }
  }

  return { nodes, edges, directed: false, weighted: true };
}

/**
 * 计算曼哈顿距离
 */
export function manhattanDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * 计算欧几里得距离
 */
export function euclideanDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * 重置网格状态（用于重新运行算法）
 */
export function resetGridState(cells: GridCell[][]): void {
  for (const row of cells) {
    for (const cell of row) {
      cell.g = Infinity;
      cell.h = 0;
      cell.f = Infinity;
      cell.parent = null;
      cell.inOpenSet = false;
      cell.inClosedSet = false;
      cell.isPath = false;
    }
  }
}

/**
 * 获取单元格的key
 */
export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}
