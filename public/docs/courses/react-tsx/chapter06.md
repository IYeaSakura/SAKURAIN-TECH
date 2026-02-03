## 第6章 副作用管理与异步流程：类型安全与并发控制

### 6.1 useEffect的语义与执行时机深度解析

useEffect是React中处理副作用的核心Hook，深入理解其语义和执行时机对于编写正确的React代码至关重要。

#### 6.1.1 依赖项对比的浅层检查机制

useEffect的依赖项检查使用浅层比较（Shallow Comparison），这决定了其使用方式和注意事项。

**Object.is与深度比较的差异**

```
依赖项比较机制：

React使用Object.is进行依赖项比较：
- 基本类型：值相等
- 对象类型：引用相等
- 数组类型：引用相等

Object.is行为：
Object.is(1, 1)        // true
Object.is('a', 'a')    // true
Object.is({}, {})      // false（不同引用）
Object.is([], [])      // false（不同引用）
Object.is(NaN, NaN)    // true
Object.is(+0, -0)      // false
```

```typescript
// 依赖数组中的对象引用陷阱
function Component() {
  const [user, setUser] = useState({ id: 1, name: 'John' });
  
  // 问题：每次渲染都创建新对象
  useEffect(() => {
    console.log('User changed:', user);
  }, [{ id: user.id, name: user.name }]);  // 每次渲染都是新对象！
  
  return <div />;
}

// 解决方案1：使用原始值
function ComponentFixed1() {
  const [user, setUser] = useState({ id: 1, name: 'John' });
  
  useEffect(() => {
    console.log('User changed:', user);
  }, [user.id, user.name]);  // 使用原始值
  
  return <div />;
}

// 解决方案2：使用useMemo缓存对象
function ComponentFixed2() {
  const [user, setUser] = useState({ id: 1, name: 'John' });
  
  const userKey = useMemo(
    () => ({ id: user.id, name: user.name }),
    [user.id, user.name]
  );
  
  useEffect(() => {
    console.log('User changed:', user);
  }, [userKey]);
  
  return <div />;
}

// 解决方案3：使用JSON.stringify（不推荐用于大对象）
function ComponentFixed3() {
  const [user, setUser] = useState({ id: 1, name: 'John' });
  
  useEffect(() => {
    console.log('User changed:', user);
  }, [JSON.stringify(user)]);  // 字符串比较
  
  return <div />;
}
```

**不可变数据的重要性**

```typescript
// 可变数据的陷阱
function Component() {
  const [items, setItems] = useState([1, 2, 3]);
  
  const addItem = () => {
    // 错误：直接修改数组
    items.push(4);
    setItems(items);  // 引用没变，不会触发重渲染
  };
  
  return <button onClick={addItem}>Add</button>;
}

// 正确的不可变更新
function ComponentFixed() {
  const [items, setItems] = useState([1, 2, 3]);
  
  const addItem = () => {
    // 创建新数组
    setItems([...items, 4]);
  };
  
  const updateItem = (index: number, value: number) => {
    // 创建新数组并更新指定位置
    setItems(items.map((item, i) => (i === index ? value : item)));
  };
  
  const removeItem = (index: number) => {
    // 创建新数组并移除指定位置
    setItems(items.filter((_, i) => i !== index));
  };
  
  return <button onClick={addItem}>Add</button>;
}

// 使用Immer简化不可变更新
import produce from 'immer';

function ComponentWithImmer() {
  const [items, setItems] = useState([1, 2, 3]);
  
  const addItem = () => {
    setItems(produce(items, draft => {
      draft.push(4);  // 看起来是修改，实际是创建新数组
    }));
  };
  
  return <button onClick={addItem}>Add</button>;
}
```

#### 6.1.2 清理函数(Cleanup)的资源释放模式

useEffect可以返回一个清理函数，用于释放资源、取消订阅等。

**订阅取消、竞态取消(Race Condition)与内存泄漏预防**

```typescript
// 场景1：事件订阅
function EventListener() {
  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized');
    };
    
    window.addEventListener('resize', handleResize);
    
    // 清理函数：取消订阅
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return <div />;
}

// 场景2：定时器
function Timer() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
    
    // 清理函数：清除定时器
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  return <div>{count}</div>;
}

// 场景3：竞态条件处理
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<string[]>([]);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchResults = async () => {
      const response = await fetch(`/api/search?q=${query}`);
      const data = await response.json();
      
      // 检查是否被取消
      if (!cancelled) {
        setResults(data);
      }
    };
    
    fetchResults();
    
    // 清理函数：标记为已取消
    return () => {
      cancelled = true;
    };
  }, [query]);
  
  return (
    <ul>
      {results.map((result, i) => (
        <li key={i}>{result}</li>
      ))}
    </ul>
  );
}

// 场景4：使用AbortController（更现代的竞态处理）
function SearchResultsModern({ query }: { query: string }) {
  const [results, setResults] = useState<string[]>([]);
  
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/search?q=${query}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setResults(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
        }
      }
    };
    
    fetchResults();
    
    // 清理函数：取消请求
    return () => {
      controller.abort();
    };
  }, [query]);
  
  return (
    <ul>
      {results.map((result, i) => (
        <li key={i}>{result}</li>
      ))}
    </ul>
  );
}
```

**useEffectEvent实验性API的前瞻**

```typescript
// useEffectEvent（实验性API）
// 解决Effect依赖过多的问题

import { useEffectEvent } from 'react';  // 实验性导入

function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  // useEffectEvent创建的函数不依赖任何值
  // 但可以在Effect内部访问最新的props和state
  const onConnected = useEffectEvent((connectionId: string) => {
    // 这里可以访问最新的theme，而不需要将其加入依赖数组
    showNotification(`Connected to ${roomId} with ${theme} theme`, connectionId);
  });
  
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    connection.onConnected = (id) => {
      onConnected(id);  // 调用EffectEvent
    };
    
    return () => connection.disconnect();
  }, [roomId]);  // 只需要roomId，不需要theme
  
  return <div />;
}
```

#### 6.1.3 严格模式下的故意双重挂载

React的严格模式（StrictMode）会故意双重调用某些函数来帮助检测副作用。

**useEffect的行为差异与组件幂等性测试**

```typescript
// 开发环境下（StrictMode开启）：
// 1. 组件挂载
// 2. Effect执行
// 3. 清理函数执行
// 4. Effect再次执行

// 生产环境下：
// 1. 组件挂载
// 2. Effect执行

// 问题示例：非幂等的Effect
function NonIdempotentComponent() {
  useEffect(() => {
    // 每次执行都会添加一个新监听器
    const id = addGlobalListener(() => {
      console.log('Event received');
    });
    
    return () => {
      removeGlobalListener(id);
    };
  }, []);
  
  return <div />;
}

// 在StrictMode下，这个组件会添加两个监听器！

// 解决方案：确保Effect幂等
function IdempotentComponent() {
  useEffect(() => {
    // 使用Ref确保只执行一次
    const hasRun = useRef(false);
    
    if (!hasRun.current) {
      hasRun.current = true;
      const id = addGlobalListener(() => {
        console.log('Event received');
      });
      
      return () => {
        removeGlobalListener(id);
      };
    }
  }, []);
  
  return <div />;
}

// 更好的解决方案：确保清理函数正确
function BetterIdempotentComponent() {
  useEffect(() => {
    const id = addGlobalListener(() => {
      console.log('Event received');
    });
    
    return () => {
      removeGlobalListener(id);
    };
  }, []);
  
  return <div />;
}
// 这个版本在StrictMode下也是正确的：
// 第一次Effect → 添加监听器
// 清理函数 → 移除监听器
// 第二次Effect → 添加监听器
// 最终结果：只有一个监听器
```

**开发环境与生产环境的行为差异调试**

```typescript
// 检测当前环境的工具
const isDevelopment = process.env.NODE_ENV === 'development';
const isStrictMode = isDevelopment;  // StrictMode只在开发环境生效

// 调试技巧：添加日志观察Effect执行
function DebugEffect() {
  useEffect(() => {
    console.log('Effect executed');
    
    return () => {
      console.log('Cleanup executed');
    };
  }, []);
  
  return <div />;
}

// 在StrictMode下的输出：
// Effect executed
// Cleanup executed
// Effect executed

// 在生产环境下的输出：
// Effect executed
```

### 6.2 异步操作的类型安全封装与AI生成

异步操作是React应用中的常见需求，TypeScript的类型系统可以帮助我们构建类型安全的异步流程。

#### 6.2.1 Promise状态在组件中的类型表示

使用Discriminated Union模式可以精确表示异步操作的各种状态。

**Loading、Success、Error的Discriminated Union模式**

```typescript
// 异步状态类型
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// 使用示例
interface User {
  id: string;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: string }) {
  const [state, setState] = useState<AsyncState<User>>({ status: 'idle' });
  
  useEffect(() => {
    setState({ status: 'loading' });
    
    fetchUser(userId)
      .then(user => {
        setState({ status: 'success', data: user });
      })
      .catch(error => {
        setState({ status: 'error', error });
      });
  }, [userId]);
  
  // 类型安全的渲染
  switch (state.status) {
    case 'idle':
      return <div>Click to load</div>;
    case 'loading':
      return <Loading />;
    case 'success':
      return (
        <div>
          <h1>{state.data.name}</h1>
          <p>{state.data.email}</p>
        </div>
      );
    case 'error':
      return <Error message={state.error.message} />;
  }
}

// useAsync的类型实现
interface UseAsyncReturn<T> {
  state: AsyncState<T>;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  
  const execute = useCallback(
    async (...args: any[]) => {
      setState({ status: 'loading' });
      
      try {
        const data = await asyncFunction(...args);
        setState({ status: 'success', data });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', error: err });
        throw err;
      }
    },
    [asyncFunction]
  );
  
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);
  
  return { state, execute, reset };
}

// 使用useAsync
function UserList() {
  const { state, execute } = useAsync(fetchUsers, true);
  
  switch (state.status) {
    case 'idle':
    case 'loading':
      return <Loading />;
    case 'success':
      return (
        <ul>
          {state.data.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      );
    case 'error':
      return <Error message={state.error.message} />;
  }
}
```

**错误边界集成**

```typescript
// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error }>;
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 可以在这里发送错误报告
  }
  
  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}

// 使用错误边界
function App() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <UserProfile userId="123" />
    </ErrorBoundary>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
    </div>
  );
}
```

#### 6.2.2 AbortController与请求取消的集成

AbortController是现代浏览器提供的标准API，用于取消异步操作。

**Fetch API的类型封装与竞态条件消除**

```typescript
// 类型化的Fetch封装
interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function typedFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 在Hook中使用
function useApi<T>(
  url: string | null,
  options?: FetchOptions
) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const execute = useCallback(async () => {
    if (!url) return;
    
    // 取消之前的请求
    abortControllerRef.current?.abort();
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setState({ status: 'loading' });
    
    try {
      const data = await typedFetch<T>(url, {
        ...options,
        signal: controller.signal,
      });
      setState({ status: 'success', data });
    } catch (error) {
      if (error.name !== 'AbortError') {
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
  }, [url, options]);
  
  useEffect(() => {
    execute();
    
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [execute]);
  
  return { state, refetch: execute };
}
```

**_cleanup函数的类型约束与Async Iterator模式**

```typescript
// Async Iterator模式
async function* fetchPaginated<T>(
  baseUrl: string
): AsyncGenerator<T[], void, unknown> {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`${baseUrl}?page=${page}`);
    const data = await response.json();
    
    if (data.items.length === 0) {
      hasMore = false;
    } else {
      yield data.items;
      page++;
    }
  }
}

// 在React中使用Async Iterator
function PaginatedList({ url }: { url: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const iteratorRef = useRef<AsyncGenerator<any[], void, unknown> | null>(null);
  
  const loadMore = async () => {
    if (!iteratorRef.current) {
      iteratorRef.current = fetchPaginated(url);
    }
    
    setLoading(true);
    const result = await iteratorRef.current.next();
    setLoading(false);
    
    if (!result.done) {
      setItems(prev => [...prev, ...result.value]);
    }
  };
  
  useEffect(() => {
    return () => {
      // 清理：停止迭代
      iteratorRef.current?.return?.();
    };
  }, []);
  
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>{JSON.stringify(item)}</div>
      ))}
      <button onClick={loadMore} disabled={loading}>
        {loading ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

#### 6.2.3 Suspense与Error Boundaries的异步边界处理

Suspense和Error Boundaries是React处理异步操作的声明式方案。

**错误类型的传播与捕获**

```typescript
// 自定义错误类型
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// 错误类型守卫
function isApiError(error: Error): error is ApiError {
  return error.name === 'ApiError';
}

function isNetworkError(error: Error): error is NetworkError {
  return error.name === 'NetworkError';
}

// 错误边界中的类型处理
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class TypedErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }
  
  reset = () => {
    this.setState({ error: null });
  };
  
  render() {
    if (this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} reset={this.reset} />;
    }
    
    return this.props.children;
  }
}

// 类型化的错误回退组件
function ErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  let message = 'An unexpected error occurred';
  let action: React.ReactNode = (
    <button onClick={reset}>Try again</button>
  );
  
  if (isApiError(error)) {
    if (error.statusCode === 404) {
      message = 'The requested resource was not found';
    } else if (error.statusCode === 401) {
      message = 'Please log in to continue';
      action = <a href="/login">Go to login</a>;
    } else {
      message = `Server error: ${error.message}`;
    }
  } else if (isNetworkError(error)) {
    message = 'Network connection failed. Please check your internet connection.';
  }
  
  return (
    <div className="error-fallback">
      <h2>Error</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}
```

**ReactErrorInfo的类型定义与错误上报**

```typescript
// React ErrorInfo类型
interface ErrorInfo {
  componentStack: string;
}

// 错误上报服务
interface ErrorReport {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  componentStack: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

class ErrorReportingService {
  static report(error: Error, errorInfo: ErrorInfo) {
    const report: ErrorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    // 发送到错误上报服务
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(console.error);
  }
}

// 在错误边界中使用
class ReportingErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorReportingService.report(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

本章深入探讨了React副作用管理和异步流程的类型安全实现。从useEffect的依赖项检查机制，到清理函数的资源释放模式，再到异步操作的类型安全封装，我们建立了完整的副作用管理知识体系。同时，我们探讨了Suspense、Error Boundaries和AbortController等现代异步处理方案。

副作用管理是React应用开发的核心技能，掌握这些知识对于编写健壮、可维护的React应用至关重要。在下一部分中，我们将深入探讨Fiber架构和并发渲染，建立对React内核的深层理解。
