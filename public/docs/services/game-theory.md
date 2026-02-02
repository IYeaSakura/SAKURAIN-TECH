# 博弈程序开发

## 概述

博弈程序开发涉及数学建模、算法设计和软件工程的综合应用。

## 纳什均衡计算

### 基本概念

纳什均衡是指在一个博弈中，每个参与者的策略都是对其他参与者策略的最优反应。

### 计算方法

```python
import numpy as np
from scipy.optimize import linprog

def find_nash_equilibrium(payoff_matrix):
    """
    求解两人零和博弈的纳什均衡
    
    Args:
        payoff_matrix: 支付矩阵 (m x n)
    
    Returns:
        (p, q, v): 玩家1策略、玩家2策略、博弈值
    """
    m, n = payoff_matrix.shape
    
    # 转换为线性规划问题
    c = np.zeros(m + 1)
    c[0] = -1  # 最大化 v
    
    A_ub = np.hstack([np.ones((n, 1)), -payoff_matrix.T])
    b_ub = np.zeros(n)
    
    A_eq = np.hstack([[0], np.ones(m)]).reshape(1, -1)
    b_eq = [1]
    
    bounds = [(0, None)] * (m + 1)
    bounds[0] = (None, None)  # v 无约束
    
    result = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq, bounds=bounds)
    
    v = result.x[0]
    p = result.x[1:]
    
    return p, v
```

## 蒙特卡洛树搜索

```python
import math
import random

class MCTSNode:
    def __init__(self, state, parent=None, action=None):
        self.state = state
        self.parent = parent
        self.action = action
        self.children = []
        self.visits = 0
        self.wins = 0
        self.untried_actions = state.get_legal_actions()
    
    def ucb1(self, exploration=1.414):
        if self.visits == 0:
            return float('inf')
        return (self.wins / self.visits + 
                exploration * math.sqrt(math.log(self.parent.visits) / self.visits))
    
    def best_child(self):
        return max(self.children, key=lambda c: c.ucb1())
    
    def expand(self):
        action = self.untried_actions.pop()
        next_state = self.state.apply_action(action)
        child = MCTSNode(next_state, self, action)
        self.children.append(child)
        return child
    
    def is_fully_expanded(self):
        return len(self.untried_actions) == 0
    
    def is_terminal(self):
        return self.state.is_terminal()

class MCTS:
    def search(self, root_state, iterations=1000):
        root = MCTSNode(root_state)
        
        for _ in range(iterations):
            node = self._select(root)
            reward = self._simulate(node.state)
            self._backpropagate(node, reward)
        
        return max(root.children, key=lambda c: c.visits).action
    
    def _select(self, node):
        while not node.is_terminal():
            if not node.is_fully_expanded():
                return node.expand()
            node = node.best_child()
        return node
    
    def _simulate(self, state):
        while not state.is_terminal():
            action = random.choice(state.get_legal_actions())
            state = state.apply_action(action)
        return state.get_reward()
    
    def _backpropagate(self, node, reward):
        while node:
            node.visits += 1
            node.wins += reward
            node = node.parent
```

## 架构设计

### 系统模块

```
博弈引擎
├── 规则引擎 (Rule Engine)
│   ├── 状态验证
│   ├── 合法动作检查
│   └── 终局判定
├── 搜索算法 (Search)
│   ├── Minimax
│   ├── Alpha-Beta
│   └── MCTS
├── 评估函数 (Evaluation)
│   ├── 特征提取
│   └── 神经网络评估
└── 接口层 (API)
    ├── REST API
    └── WebSocket
```
