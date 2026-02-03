## 第8章 并发特性(Concurrent Features)：现代React的核心竞争力

### 8.1 Lane优先级模型与调度算法

Lane模型是React 18引入的新优先级系统，它取代了之前的Expiration Time模型，提供了更细粒度的优先级控制。

#### 8.1.1 31位优先级的位掩码设计

React使用31位整数来表示优先级，这种设计允许高效的位运算操作。

**不同Lane的按位或(OR)、按位与(AND)操作与优先级合并**

```typescript
// Lane位掩码设计
export const TotalLanes = 31;

// 优先级Lane定义
export const NoLanes: Lanes = 0b0000000000000000000000000000000;
export const NoLane: Lane = 0b0000000000000000000000000000000;

export const SyncHydrationLane: Lane = 0b0000000000000000000000000000001;
export const SyncLane: Lane = 0b0000000000000000000000000000010;
export const SyncLaneIndex: number = 1;

export const InputContinuousHydrationLane: Lane = 0b0000000000000000000000000000100;
export const InputContinuousLane: Lane = 0b0000000000000000000000000001000;

export const DefaultHydrationLane: Lane = 0b0000000000000000000000000010000;
export const DefaultLane: Lane = 0b0000000000000000000000000100000;

// Transition lanes（批量更新，低优先级）
export const TransitionHydrationLane: Lane = 0b0000000000000000000000001000000;
export const TransitionLane1: Lane = 0b0000000000000000000000010000000;
export const TransitionLane2: Lane = 0b0000000000000000000000100000000;
export const TransitionLane3: Lane = 0b0000000000000000000001000000000;
// ... TransitionLane4-15

export const RetryLane1: Lane = 0b0000010000000000000000000000000;
export const RetryLane2: Lane = 0b0000100000000000000000000000000;
// ... RetryLane3-4

export const SomeRetryLane: Lane = RetryLane1;

export const SelectiveHydrationLane: Lane = 0b0001000000000000000000000000000;

export const NonIdleLanes: Lanes = 0b0001111111111111111111111111111;

export const IdleHydrationLane: Lane = 0b0010000000000000000000000000000;
export const IdleLane: Lane = 0b0100000000000000000000000000000;

export const OffscreenLane: Lane = 0b1000000000000000000000000000000;

// Lane操作函数
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;  // 按位或合并优先级
}

export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;  // 按位与移除优先级
}

export function intersectLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a & b;  // 按位与求交集
}

export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane): boolean {
  return (set & subset) === subset;
}

export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane): boolean {
  return (a & b) !== NoLanes;
}

export function includesNonIdleWork(lanes: Lanes): boolean {
  return (lanes & NonIdleLanes) !== NoLanes;
}

export function includesOnlyTransitions(lanes: Lanes): boolean {
  return (lanes & TransitionLanes) === lanes;
}
```

**Transition、Default、Discrete、Idle的分类与使用场景**

```typescript
// 优先级分类与使用场景

/**
 * Sync（同步优先级）
 * 使用场景：
 * - 用户输入（受控组件）
 * - 同步渲染
 * - 紧急状态更新
 */
function SyncExample() {
  const [value, setValue] = useState('');
  
  // 受控组件：同步更新
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);  // Sync优先级
  };
  
  return <input value={value} onChange={handleChange} />;
}

/**
 * Default（默认优先级）
 * 使用场景：
 * - 普通状态更新
 * - 数据获取
 * - 非紧急UI更新
 */
function DefaultExample() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);  // Default优先级
  }, []);
  
  return <div>{data}</div>;
}

/**
 * Transition（过渡优先级）
 * 使用场景：
 * - 大型列表更新
 * - 路由切换
 * - 搜索过滤
 * - 任何可以延迟的更新
 */
function TransitionExample() {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  
  const handleFilterChange = (value: string) => {
    setFilter(value);  // 紧急更新
    
    startTransition(() => {
      // 过渡更新，可以被中断
      setFilteredItems(items.filter(item => 
        item.name.includes(value)
      ));
    });
  };
  
  return (
    <div>
      <input 
        value={filter} 
        onChange={e => handleFilterChange(e.target.value)} 
      />
      {isPending && <Spinner />}
      <List items={filteredItems} />
    </div>
  );
}

/**
 * Idle（空闲优先级）
 * 使用场景：
 * - 预加载数据
 * - 非关键分析
 * - 日志上报
 */
function IdleExample() {
  useEffect(() => {
    // 使用requestIdleCallback或Scheduler
    const id = requestIdleCallback(() => {
      // 在浏览器空闲时执行
      analytics.track('page_view');
    });
    
    return () => cancelIdleCallback(id);
  }, []);
  
  return <div />;
}
```

#### 8.1.2 优先级饥饿(Starvation)预防

React通过过期时间机制防止低优先级任务无限期等待。

**时间切片计数器与优先级aging算法**

```typescript
// 过期时间计算
export const NoTimestamp = -1;

// 不同优先级的超时时间（ms）
const SYNC_TIMEOUT = -1;           // 同步，永不超时
const MAX_SIGNED_31_BIT_INT = 1073741823;

// 优先级到超时时间的映射
function getTimeoutForLane(lane: Lane): number {
  switch (lane) {
    case SyncLane:
      return -1;  // 同步，永不超时
    case InputContinuousLane:
      return 250;  // 250ms
    case DefaultLane:
      return 5000;  // 5s
    case TransitionLane1:
    case TransitionLane2:
      // ...
      return 5000;  // 5s
    case IdleLane:
      return MAX_SIGNED_31_BIT_INT;  // 永不过期
    default:
      return 5000;
  }
}

// 标记过期lane
export function markStarvedLanesAsExpired(
  root: FiberRoot,
  currentTime: number
): void {
  const pendingLanes = root.pendingLanes;
  const expiredLanes = root.expiredLanes;
  
  // 遍历所有pending的lane
  let lanes = pendingLanes;
  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;
    
    const expirationTime = root.expirationTimes[index];
    
    if (expirationTime === NoTimestamp) {
      // 计算过期时间
      root.expirationTimes[index] = currentTime + getTimeoutForLane(lane);
    } else if (expirationTime <= currentTime) {
      // 已过期，提升优先级
      root.expiredLanes |= lane;
    }
    
    lanes &= ~lane;
  }
}

// 获取最高优先级lane（考虑过期）
export function getNextLanes(root: FiberRoot, wipLanes: Lanes): Lanes {
  const pendingLanes = root.pendingLanes;
  
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }
  
  let nextLanes = NoLanes;
  
  // 优先处理已过期的lane
  const expiredLanes = pendingLanes & root.expiredLanes;
  if (expiredLanes !== NoLanes) {
    nextLanes = getHighestPriorityLanes(expiredLanes);
  } else {
    // 获取最高优先级的非过期lane
    const nonExpiredLanes = pendingLanes & ~root.expiredLanes;
    nextLanes = getHighestPriorityLanes(nonExpiredLanes);
  }
  
  return nextLanes;
}
```

**低优先级任务的插队机制与长任务分割**

```typescript
// 工作循环中的优先级检查
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    // 检查是否有更高优先级的任务插入
    if (didReceiveUpdate && 
        getCurrentPriorityLevel() > getPriorityLevel(workInProgress.lanes)) {
      // 让出执行权，让更高优先级的任务先执行
      break;
    }
    
    workInProgress = performUnitOfWork(workInProgress);
  }
}

// 高优先级更新打断低优先级渲染
function ensureRootIsScheduled(root: FiberRoot, currentTime: number): void {
  const existingCallbackNode = root.callbackNode;
  const nextLanes = getNextLanes(root, root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes);
  
  if (nextLanes === NoLanes) {
    // 没有工作要做
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return;
  }
  
  const newCallbackPriority = getHighestPriorityLane(nextLanes);
  const existingCallbackPriority = root.callbackPriority;
  
  // 如果新优先级更高，取消现有回调
  if (newCallbackPriority !== existingCallbackPriority) {
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }
    
    // 调度新的回调
    const schedulerPriorityLevel = laneToSchedulerPriority(newCallbackPriority);
    root.callbackPriority = newCallbackPriority;
    root.callbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
}
```

#### 8.1.3 并发渲染的模式切换

React 18支持两种渲染模式：Legacy模式和Concurrent模式。

**SyncDefaultRoot与ConcurrentRoot的创建差异与行为边界**

```typescript
// 根节点创建
function createRoot(container: Container, options?: CreateRootOptions): Root {
  // React 18默认创建ConcurrentRoot
  return createContainer(
    container,
    ConcurrentRoot,  // 标记为并发根
    null,            // hydrationCallbacks
    false,           // isStrictMode
    false,           // concurrentUpdatesByDefaultOverride
    '',              // identifierPrefix
    null,            // onRecoverableError
    null             // transitionCallbacks
  );
}

// Legacy模式创建（React 17及之前）
function legacyCreateRootFromDOMContainer(
  container: Container,
  initialChildren: ReactNodeList,
  parentComponent: ReactComponent | null,
  callback: Function | null,
  isHydration: boolean
): Root {
  // 创建LegacyRoot
  const root = createContainer(
    container,
    LegacyRoot,  // 标记为Legacy根
    null,
    false,
    null,
    '',
    null,
    null
  );
  
  // 同步渲染
  root.render(initialChildren);
  
  return root;
}

// 渲染模式差异
function performWorkOnRoot(root: FiberRoot, lanes: Lanes, forceSync: boolean): void {
  if (lanes === SyncLane || forceSync) {
    // 同步渲染
    exitStatus = renderRootSync(root, lanes);
  } else {
    // 并发渲染
    exitStatus = renderRootConcurrent(root, lanes);
  }
  
  // ...
}

// React 18的自动升级机制
// 使用ReactDOM.render会发出警告，建议使用createRoot
const ReactDOM = {
  render(element: ReactElement, container: Container, callback?: Function) {
    if (__DEV__) {
      console.error(
        'ReactDOM.render is no longer supported in React 18. ' +
        'Use createRoot instead.'
      );
    }
    
    // 降级到Legacy模式
    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback
    );
  },
  
  createRoot,
  hydrateRoot,
};
```

### 8.2 Suspense与流式渲染架构

Suspense是React的重要特性，它允许组件在异步操作完成前显示fallback UI。

#### 8.2.1 SuspenseComponent的实现

Suspense通过捕获子组件抛出的Promise来实现异步等待。

**抛出Thenable的捕获机制与Retry逻辑**

```typescript
// Suspense工作原理
// 1. 子组件在异步数据未准备好时抛出Promise
// 2. Suspense捕获Promise，显示fallback
// 3. Promise resolve后，重新尝试渲染

// 数据获取Hook（简化版）
function useSuspenseData<T>(fetcher: () => Promise<T>): T {
  const cache = getCacheForType(createCache);
  const key = fetcher;
  
  const cached = cache.get(key);
  if (cached !== undefined) {
    if (cached.status === 'fulfilled') {
      return cached.value;
    } else if (cached.status === 'rejected') {
      throw cached.reason;
    }
  }
  
  // 创建新的Promise
  const thenable = fetcher();
  thenable.then(
    value => {
      cached.status = 'fulfilled';
      cached.value = value;
    },
    reason => {
      cached.status = 'rejected';
      cached.reason = reason;
    }
  );
  
  cache.set(key, { status: 'pending' });
  throw thenable;  // 抛出Promise，触发Suspense
}

// Suspense组件实现
function SuspenseComponent(props: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const { children, fallback } = props;
  
  // 使用Error Boundary类似的机制捕获Promise
  return (
    <SuspenseBoundary fallback={fallback}>
      {children}
    </SuspenseBoundary>
  );
}

// React内部处理
function throwException(
  root: FiberRoot,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: any,
  rootRenderLanes: Lanes
): void {
  if (value !== null && typeof value === 'object' &&
      typeof value.then === 'function') {
    // 这是一个Thenable（Promise）
    const wakeable: Wakeable = value;
    
    // 标记Suspense边界
    const suspenseBoundary = getSuspenseHandler();
    if (suspenseBoundary !== null) {
      // 附加监听器
      attachPingListener(root, wakeable, rootRenderLanes);
      
      // 标记边界需要显示fallback
      suspenseBoundary.flags |= DidCapture;
    }
  }
}
```

**Promise的包装与状态追踪、SuspenseList的协调**

```typescript
// SuspenseList：协调多个Suspense组件的加载顺序
interface SuspenseListProps {
  children: ReactNode;
  revealOrder?: 'forwards' | 'backwards' | 'together';
  tail?: 'collapsed' | 'hidden';
}

function SuspenseListComponent(props: SuspenseListProps) {
  const { children, revealOrder = 'forwards', tail } = props;
  
  // 根据revealOrder决定显示策略
  // forwards: 按顺序显示，前面的加载完成才显示后面的
  // backwards: 反向显示
  // together: 全部加载完成后一起显示
  
  return (
    <SuspenseListContext.Provider value={{ revealOrder, tail }}>
      {children}
    </SuspenseListContext.Provider>
  );
}

// 使用示例
<SuspenseList revealOrder="forwards" tail="collapsed">
  <Suspense fallback={<Skeleton />}>
    <ProfileData />
  </Suspense>
  <Suspense fallback={<Skeleton />}>
    <FriendsData />
  </Suspense>
  <Suspense fallback={<Skeleton />}>
    <PhotosData />
  </Suspense>
</SuspenseList>
```

#### 8.2.2 HTML流式传输

React 18支持服务端渲染的流式传输，允许浏览器渐进式接收和渲染HTML。

**NDJSON格式与渐进式增强的DOM占位机制**

```typescript
// 流式SSR架构

// 服务端：流式渲染
async function renderToPipeableStream(
  children: ReactNode,
  options: RenderToPipeableStreamOptions
): Promise<PipeableStream> {
  const request = createRequest(children, options);
  
  // 开始流式渲染
  startWork(request);
  
  return {
    pipe(response: ServerResponse): void {
      const stream = createOutputStream(response);
      startFlowing(request, stream);
    },
  };
}

// 流式传输格式
/*
初始HTML：
<html>
  <head>...</head>
  <body>
    <div id="root">
      <!-- 同步渲染的内容 -->
      <nav>...</nav>
      
      <!-- Suspense边界占位 -->
      <template id="B:1"></template>
      <div hidden id="S:1">
        <p>Loading comments...</p>
      </div>
    </div>
  </body>
</html>

后续流（当Suspense resolve后）：
<div hidden id="S:1">
  <!-- 实际内容 -->
  <div class="comments">...</div>
</div>
<script>
  // 替换占位符
  $RC(1);
</script>
*/

// 客户端水合策略
function hydrateRoot(
  container: Document | Element,
  initialChildren: ReactNode,
  options?: HydrationOptions
): Root {
  // 创建并发根
  const root = createHydrationContainer(
    initialChildren,
    container,
    ConcurrentRoot,
    options
  );
  
  // 渐进式水合
  // 1. 立即水合同步内容
  // 2. 延迟水合Suspense边界内的内容
  
  return root;
}
```

**SSR中的Suspense边界与水合策略**

```typescript
// 服务端组件（RSC）与Suspense
async function ServerComponent() {
  // 异步数据获取
  const data = await fetchData();
  
  return <ClientComponent data={data} />;
}

// Suspense边界配置
function App() {
  return (
    <html>
      <body>
        <nav>同步导航</nav>
        
        {/* 这个Suspense边界会在服务端渲染fallback */}
        <Suspense fallback={<Spinner />}>
          <ServerComponent />
        </Suspense>
        
        {/* 另一个Suspense边界 */}
        <Suspense fallback={<Skeleton />}>
          <Comments />
        </Suspense>
      </body>
    </html>
  );
}
```

#### 8.2.3 use的Promise解包

React 18.3+引入了`use` API，用于在组件中解包Promise。

**Context与Suspense的集成读取**

```typescript
// use API（实验性）
// 可以在条件语句中使用，与useContext不同

function Component({ shouldShowUser }: { shouldShowUser: boolean }) {
  // 可以在条件中使用
  if (shouldShowUser) {
    // use会挂起组件直到Promise resolve
    const user = use(fetchUser());
    return <div>{user.name}</div>;
  }
  
  return <div>No user</div>;
}

// 与Context结合
function ThemedComponent() {
  // use可以读取Context
  const theme = use(ThemeContext);
  
  return <div style={{ color: theme.primary }}>Themed</div>;
}

// unwrap API的类型约束与错误处理
function DataComponent() {
  try {
    const data = use(fetchData());
    return <div>{data}</div>;
  } catch (error) {
    // 处理错误
    return <ErrorDisplay error={error} />;
  }
}
```

### 8.3 Transitions与Deferred Values的并发控制

Transitions和Deferred Values是React 18提供的并发控制工具。

#### 8.3.1 startTransition的标记机制

startTransition用于标记非紧急更新，允许React在渲染过程中保持响应。

**isTransition优先级位与并发更新的标记传播**

```typescript
// startTransition实现
function startTransition(
  setPending: (pending: boolean) => void,
  callback: () => void,
  options?: StartTransitionOptions
): void {
  const previousPriority = getCurrentUpdatePriority();
  
  try {
    // 设置Transition优先级
    setCurrentUpdatePriority(TransitionPriority);
    
    // 标记pending状态
    setPending(true);
    
    // 执行回调
    callback();
  } finally {
    // 恢复优先级
    setCurrentUpdatePriority(previousPriority);
    setPending(false);
  }
}

// useTransition Hook
function useTransition(): [boolean, (callback: () => void) => void] {
  const [isPending, setPending] = useState(false);
  
  const startTransition = useCallback((callback: () => void) => {
    startTransitionImpl(setPending, callback);
  }, []);
  
  return [isPending, startTransition];
}

// 使用示例
function SearchResults() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 紧急更新：更新输入框
    setQuery(value);
    
    // 非紧急更新：更新搜索结果
    startTransition(() => {
      setResults(search(value));
    });
  };
  
  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <Results data={results} />
    </div>
  );
}
```

**非紧急更新的UI保持响应策略与并发状态的类型表示**

```typescript
// 并发状态的类型表示
type ConcurrentState<T> =
  | { status: 'pending'; current: T }
  | { status: 'transitioning'; current: T; pending: T }
  | { status: 'committed'; current: T };

// 使用useDeferredValue
function DeferredExample() {
  const [text, setText] = useState('');
  
  // deferredText会在text变化后延迟更新
  // 允许UI保持响应
  const deferredText = useDeferredValue(text);
  
  // 使用isPending检查是否有过渡
  const isStale = deferredText !== text;
  
  return (
    <div>
      <input 
        value={text} 
        onChange={e => setText(e.target.value)}
        style={{ opacity: isStale ? 0.5 : 1 }}
      />
      {/* 使用deferredText渲染可能较慢的组件 */}
      <SlowList text={deferredText} />
    </div>
  );
}
```

#### 8.3.2 useDeferredValue的滞后渲染

useDeferredValue用于延迟某些状态的更新，保持UI响应。

**双版本保持(tearing)问题与一致性保障**

```typescript
// tearing问题示例
function TearingExample() {
  const [count, setCount] = useState(0);
  const deferredCount = useDeferredValue(count);
  
  // 问题：count和deferredCount可能不一致
  // 导致UI显示不一致的状态
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Deferred: {deferredCount}</p>
    </div>
  );
}

// 解决方案：使用一致性检查
function ConsistentExample() {
  const [count, setCount] = useState(0);
  const deferredCount = useDeferredValue(count);
  
  // 使用isTransitionPending检查一致性
  const isStale = deferredCount !== count;
  
  return (
    <div style={{ opacity: isStale ? 0.7 : 1 }}>
      <ExpensiveTree value={deferredCount} />
      {isStale && <div>Updating...</div>}
    </div>
  );
}

// useMemo的依赖延迟更新与乐观UI的冲突解决
function OptimisticExample() {
  const [items, setItems] = useState([]);
  const deferredItems = useDeferredValue(items);
  
  // 使用deferredItems作为缓存依赖
  const sortedItems = useMemo(
    () => [...deferredItems].sort((a, b) => a.price - b.price),
    [deferredItems]
  );
  
  const handleAdd = (item) => {
    // 乐观更新
    setItems(prev => [...prev, item]);
    
    // 异步提交
    api.addItem(item).catch(() => {
      // 回滚
      setItems(prev => prev.filter(i => i.id !== item.id));
    });
  };
  
  return <ItemList items={sortedItems} onAdd={handleAdd} />;
}
```

---

本章深入探讨了React的并发特性，包括Lane优先级模型、Suspense架构和Transitions机制。这些特性是React 18的核心竞争力，使得React应用能够在保持响应的同时处理复杂的渲染任务。

理解并发特性对于开发现代React应用至关重要，特别是在处理大型列表、路由切换和搜索过滤等场景时。在下一部分中，我们将探讨性能工程和量化优化，建立系统的性能优化方法论。
