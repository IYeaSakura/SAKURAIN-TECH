# React 核心原理

## 虚拟 DOM

虚拟 DOM（Virtual DOM）是 React 的核心概念之一，它是真实 DOM 的轻量级 JavaScript 表示。

### 为什么需要虚拟 DOM？

1. **性能优化**：减少直接操作 DOM 的次数
2. **跨平台**：虚拟 DOM 可以映射到不同平台的渲染层
3. **声明式编程**：开发者只需关注状态变化，无需手动操作 DOM

### 虚拟 DOM 的结构

```javascript
// 虚拟 DOM 示例
const element = {
  type: 'div',
  props: {
    className: 'container',
    children: [
      {
        type: 'h1',
        props: { children: 'Hello React' }
      }
    ]
  }
};
```

## Fiber 架构

Fiber 是 React 16 引入的新协调引擎，主要特点：

### 核心特性

1. **增量渲染**：任务可分割，避免阻塞主线程
2. **优先级调度**：高优先级更新优先处理
3. **错误边界**：更好的错误处理机制

### Fiber 节点结构

```typescript
interface FiberNode {
  type: any;              // 组件类型或 DOM 标签
  key: string | null;     // 用于 diff
  stateNode: any;         // 对应的 DOM 节点或组件实例
  child: FiberNode;       // 第一个子节点
  sibling: FiberNode;     // 下一个兄弟节点
  return: FiberNode;      // 父节点
  pendingProps: any;      // 新 props
  memoizedProps: any;     // 当前 props
  memoizedState: any;     // 当前 state
  effectTag: number;      // 副作用标记
  nextEffect: FiberNode;  // 下一个副作用节点
}
```

### 双缓冲技术

React 维护两棵 Fiber 树：
- **current**：当前屏幕上显示的树
- **workInProgress**：正在构建的新树

```
渲染阶段:
workInProgress = alternate(current)
构建新的 Fiber 树...

提交阶段:
root.current = workInProgress
```

## 协调算法（Reconciliation）

### Diff 策略

React 使用启发式算法，时间复杂度为 O(n)，基于两个假设：

1. **不同类型元素**：产生不同树形结构
2. **key 属性**：标识哪些子元素在不同渲染中保持稳定

### Diff 过程

```javascript
// 元素类型相同 - 保留 DOM，更新属性
<div className="old" /> → <div className="new" />

// 元素类型不同 - 销毁旧树，创建新树
<div /> → <span />

// 使用 key 优化列表 diff
<ul>
  <li key="a">A</li>
  <li key="b">B</li>
</ul>
```

### 列表 Diff 算法

```javascript
// 旧列表: A B C D
// 新列表: B A D C

// 第一轮遍历
// 比较 A vs B -> 不同，记录 lastPlacedIndex = 0
// 比较 B vs A -> 不同，记录 lastPlacedIndex = 0
// ...

// 第二轮遍历（处理剩余节点）
// 使用 key 映射查找可复用节点
```

## 渲染流程

### 完整渲染阶段

```
1. 触发更新（setState、forceUpdate、props 变化）
   ↓
2. 创建更新（createUpdate）
   ↓
3. 调度更新（scheduleUpdateOnFiber）
   ↓
4. render 阶段（可中断）
   - 构建 Fiber 树
   - 执行 diff
   - 标记副作用
   ↓
5. commit 阶段（不可中断）
   - before mutation（getSnapshotBeforeUpdate）
   - mutation（DOM 操作）
   - layout（componentDidMount/Update）
```

### 调度优先级

```javascript
// React 优先级等级（从高到低）
export const ImmediatePriority = 1;    // 同步，立即执行
export const UserBlockingPriority = 2; // 用户交互
export const NormalPriority = 3;       // 普通优先级
export const LowPriority = 4;          // 低优先级
export const IdlePriority = 5;         // 空闲时执行
```

## 时间切片

Fiber 将渲染工作分割成小块，让浏览器有时间处理用户交互：

```javascript
// 概念演示
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 0) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  
  if (nextUnitOfWork) {
    // 还有工作，请求下一次调度
    requestIdleCallback(workLoop);
  }
}
```

## 小结

- 虚拟 DOM 提供了声明式的编程模型
- Fiber 架构实现了可中断的渲染
- 协调算法高效地计算最小变更集
- 优先级调度保证用户交互的响应性

下一章将深入探讨 Hooks 的实现原理。
