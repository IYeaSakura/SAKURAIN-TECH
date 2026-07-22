# 第六部分：状态管理架构与数据流工程化：从原子化到分布式

## 第11章 现代状态管理方案：类型安全、性能与AI辅助选型

### 11.1 原子化状态管理(Recoil/Jotai)的数学基础

原子化状态管理是React生态中的新兴范式，它将状态分解为最小的独立单元（原子），实现细粒度的订阅和更新。

#### 11.1.1 状态原子的不可变更新

原子化状态管理的核心是每个原子都是独立的、可订阅的状态单元。

**依赖追踪图的有向无环图(DAG)拓扑排序与重渲染触发算法**

```typescript
// Jotai核心概念
import { atom, useAtom, Provider } from 'jotai';

// 定义原子
const countAtom = atom(0);
const doubleCountAtom = atom((get) => get(countAtom) * 2);
const sumAtom = atom((get) => get(countAtom) + get(doubleCountAtom));

// 依赖关系图：
// countAtom ← doubleCountAtom
//      ↓           ↓
//           sumAtom

// 依赖追踪实现原理（简化版）
class AtomStore {
  private atoms = new Map<Atom<any>, any>();
  private dependencies = new Map<Atom<any>, Set<Atom<any>>>();
  private dependents = new Map<Atom<any>, Set<Atom<any>>>();
  private listeners = new Map<Atom<any>, Set<() => void>>();
  
  // 注册依赖关系
  registerDependency(atom: Atom<any>, dependency: Atom<any>) {
    if (!this.dependencies.has(atom)) {
      this.dependencies.set(atom, new Set());
    }
    this.dependencies.get(atom)!.add(dependency);
    
    if (!this.dependents.has(dependency)) {
      this.dependents.set(dependency, new Set());
    }
    this.dependents.get(dependency)!.add(atom);
  }
  
  // 设置原子值
  set<T>(atom: Atom<T>, value: T) {
    const oldValue = this.atoms.get(atom);
    if (Object.is(oldValue, value)) return;  // 值未变化
    
    this.atoms.set(atom, value);
    
    // 通知所有依赖者
    this.notifyDependents(atom);
  }
  
  // 递归通知依赖者
  private notifyDependents(atom: Atom<any>) {
    // 使用拓扑排序确保正确的更新顺序
    const sorted = this.topologicalSort(atom);
    
    for (const dependent of sorted) {
      const listeners = this.listeners.get(dependent);
      listeners?.forEach(fn => fn());
    }
  }
  
  // 拓扑排序
  private topologicalSort(startAtom: Atom<any>): Atom<any>[] {
    const visited = new Set<Atom<any>>();
    const result: Atom<any>[] = [];
    
    const visit = (atom: Atom<any>) => {
      if (visited.has(atom)) return;
      visited.add(atom);
      
      const dependents = this.dependents.get(atom);
      if (dependents) {
        for (const dependent of dependents) {
          visit(dependent);
        }
      }
      
      result.push(atom);
    };
    
    visit(startAtom);
    return result;
  }
}

// 使用示例
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const [doubleCount] = useAtom(doubleCountAtom);
  const [sum] = useAtom(sumAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <p>Sum: {sum}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

**细粒度订阅与选择性更新**

```typescript
// Recoil的选择器
import { atom, selector, useRecoilValue, useSetRecoilState } from 'recoil';

// 原子状态
const userState = atom({
  key: 'userState',
  default: { id: '', name: '', email: '', preferences: { theme: 'light' } },
});

// 派生状态 - 只订阅name变化
const userNameSelector = selector({
  key: 'userNameSelector',
  get: ({ get }) => get(userState).name,
});

// 派生状态 - 只订阅preferences变化
const userThemeSelector = selector({
  key: 'userThemeSelector',
  get: ({ get }) => get(userState).preferences.theme,
});

// 组件只会在订阅的状态变化时重渲染
function UserName() {
  const name = useRecoilValue(userNameSelector);
  console.log('UserName rendered');  // 只在name变化时打印
  return <span>{name}</span>;
}

function UserTheme() {
  const theme = useRecoilValue(userThemeSelector);
  console.log('UserTheme rendered');  // 只在theme变化时打印
  return <span>{theme}</span>;
}

// 同时更新多个原子的事务
import { useRecoilTransaction_UNSTABLE } from 'recoil';

function useUpdateUser() {
  return useRecoilTransaction_UNSTABLE(({ set }) => 
    (userData: Partial<User>) => {
      set(userState, prev => ({ ...prev, ...userData }));
    }
  );
}
```

#### 11.1.2 派生原子的缓存策略

派生原子的缓存是性能优化的关键。

**引用稳定性与内存泄漏预防**

```typescript
// Jotai的派生原子缓存
const expensiveAtom = atom((get) => {
  const count = get(countAtom);
  // 昂贵的计算
  return heavyComputation(count);
});

// 缓存策略
/*
1. 值缓存：缓存计算结果
2. 依赖追踪：只在依赖变化时重新计算
3. 引用稳定：相同输入返回相同引用
*/

// 自定义缓存Hook
function useMemoizedAtom<T>(
  compute: (get: Getter) => T,
  deps: Atom<any>[]
): Atom<T> {
  const cacheRef = useRef<Map<string, T>>(new Map());
  
  return atom((get) => {
    // 生成依赖签名
    const depValues = deps.map(d => get(d));
    const signature = JSON.stringify(depValues);
    
    // 检查缓存
    if (cacheRef.current.has(signature)) {
      return cacheRef.current.get(signature)!;
    }
    
    // 计算新值
    const value = compute(get);
    cacheRef.current.set(signature, value);
    
    // LRU淘汰
    if (cacheRef.current.size > 100) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    
    return value;
  });
}

// WeakMap存储的atom-to-atom依赖与垃圾回收优化
class WeakAtomMap {
  private map = new WeakMap<object, Map<string, Atom<any>>>();
  
  set(key: object, subKey: string, atom: Atom<any>) {
    if (!this.map.has(key)) {
      this.map.set(key, new Map());
    }
    this.map.get(key)!.set(subKey, atom);
  }
  
  get(key: object, subKey: string): Atom<any> | undefined {
    return this.map.get(key)?.get(subKey);
  }
}

// 使用WeakMap避免内存泄漏
const atomRegistry = new WeakAtomMap();
```

#### 11.1.3 异步原子的悬浮(Suspense)集成

异步原子与Suspense的集成提供了声明式的数据获取体验。

**Loadable类型与ErrorBoundary的协同**

```typescript
// Jotai的异步原子
import { atom, useAtom } from 'jotai';

// 异步原子
const userDataAtom = atom(async (get) => {
  const userId = get(userIdAtom);
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
});

// 使用Suspense
function UserProfile() {
  const [userData] = useAtom(userDataAtom);
  return <div>{userData.name}</div>;
}

function App() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Loading />}>
        <UserProfile />
      </Suspense>
    </ErrorBoundary>
  );
}

// Loadable模式（不使用Suspense）
const loadableUserDataAtom = loadable(userDataAtom);

function UserProfileWithLoadable() {
  const [userData] = useAtom(loadableUserDataAtom);
  
  if (userData.state === 'loading') {
    return <Loading />;
  }
  
  if (userData.state === 'hasError') {
    return <ErrorMessage error={userData.error} />;
  }
  
  return <div>{userData.data.name}</div>;
}

// 并发请求合并
const userIdsAtom = atom([1, 2, 3, 4, 5]);

const usersAtom = atom(async (get) => {
  const userIds = get(userIdsAtom);
  
  // 批量获取，自动去重
  const uniqueIds = [...new Set(userIds)];
  const users = await Promise.all(
    uniqueIds.map(id => fetchUser(id))
  );
  
  return new Map(users.map(u => [u.id, u]));
});
```

### 11.2 Redux现代架构(RTK)的类型工程

Redux Toolkit (RTK) 是Redux官方推荐的现代开发方式，它简化了Redux的使用并提供了更好的TypeScript支持。

#### 11.2.1 Immer的Proxy机制

RTK使用Immer来简化不可变更新。

**Copy-on-write的内存优化与不可变保证**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Slice定义
interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Immer自动处理不可变更新
    addUser: (state, action: PayloadAction<User>) => {
      // 看起来是修改，实际是创建新对象
      state.users.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<{ id: string; changes: Partial<User> }>) => {
      const { id, changes } = action.payload;
      const user = state.users.find(u => u.id === id);
      if (user) {
        Object.assign(user, changes);
      }
    },
    removeUser: (state, action: PayloadAction<string>) => {
      const index = state.users.findIndex(u => u.id === action.payload);
      if (index !== -1) {
        state.users.splice(index, 1);
      }
    },
  },
});

// Immer原理（简化版）
/*
1. 创建原始状态的Proxy
2. 拦截所有修改操作
3. 记录修改路径
4. 根据修改生成新的不可变对象
5. 共享未修改的部分（结构共享）
*/

// Draft类型的TS映射
import { Draft } from 'immer';

type DraftState = Draft<UserState>;
// DraftState允许"修改"，但实际生成不可变对象
```

#### 11.2.2 RTK Query的缓存归一化

RTK Query提供了强大的数据获取和缓存能力。

**实体适配器(Entity Adapter)与关系型数据的反规范化查询**

```typescript
import { 
  createEntityAdapter, 
  EntityState,
  EntityAdapter 
} from '@reduxjs/toolkit';

// 实体定义
interface User {
  id: string;
  name: string;
  email: string;
  departmentId: string;
}

interface Department {
  id: string;
  name: string;
}

// 创建实体适配器
const usersAdapter: EntityAdapter<User> = createEntityAdapter<User>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const departmentsAdapter: EntityAdapter<Department> = createEntityAdapter<Department>();

// 状态类型
interface UsersState extends EntityState<User> {
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: UsersState = usersAdapter.getInitialState({
  loading: false,
  error: null,
});

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: usersAdapter.addOne,
    addUsers: usersAdapter.addMany,
    updateUser: usersAdapter.updateOne,
    removeUser: usersAdapter.removeOne,
    setAllUsers: usersAdapter.setAll,
    setManyUsers: usersAdapter.setMany,
    upsertUser: usersAdapter.upsertOne,
  },
});

// 生成的选择器
const usersSelectors = usersAdapter.getSelectors(
  (state: RootState) => state.users
);

// 使用选择器
const allUsers = usersSelectors.selectAll(store.getState());
const userById = usersSelectors.selectById(store.getState(), '1');
const totalUsers = usersSelectors.selectTotal(store.getState());

// RTK Query API定义
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'Department'],
  endpoints: (builder) => ({
    // 查询
    getUsers: builder.query<User[], void>({
      query: () => 'users',
      providesTags: ['User'],
    }),
    
    getUser: builder.query<User, string>({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    // 变更
    addUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: 'users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    
    updateUser: builder.mutation<User, Partial<User> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `users/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
      // 乐观更新
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getUser', id, (draft) => {
            Object.assign(draft, patch);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useAddUserMutation,
  useUpdateUserMutation,
} = api;
```

#### 11.2.3 Slice模式的类型推断

RTK提供了优秀的TypeScript类型推断。

**RootState与AppDispatch的类型注册与模块联邦**

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { userSlice } from './userSlice';
import { api } from './api';

export const store = configureStore({
  reducer: {
    users: userSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// 类型推断
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 类型化的Hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// 使用
function UserList() {
  const users = useAppSelector(state => state.users.users);
  const dispatch = useAppDispatch();
  
  const handleAdd = (user: User) => {
    dispatch(userSlice.actions.addUser(user));
  };
  
  return <div>{/* ... */}</div>;
}

// Duck Typing的TS实现与中间件类型保持
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 异步Thunk
const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice处理异步状态
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        usersAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
```

### 11.3 服务端状态与客户端状态的边界划分

清晰划分服务端状态和客户端状态是架构设计的重要决策。

#### 11.3.1 TanStack Query的乐观更新

TanStack Query（原React Query）是服务端状态管理的事实标准。

**MutationCache的回滚机制与上下文恢复的类型一致性**

```typescript
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  QueryClient,
} from '@tanstack/react-query';

// 查询客户端配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5分钟
      cacheTime: 10 * 60 * 1000,  // 10分钟
    },
  },
});

// 基础查询
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      return response.json() as Promise<User[]>;
    },
  });
}

// 带乐观更新的Mutation
function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updatedUser: User) => {
      const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedUser),
      });
      return response.json() as Promise<User>;
    },
    
    // 乐观更新
    onMutate: async (newUser) => {
      // 取消正在进行的重新获取
      await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });
      
      // 保存之前的值用于回滚
      const previousUser = queryClient.getQueryData<User>(
        ['users', newUser.id]
      );
      
      // 乐观更新缓存
      queryClient.setQueryData(['users', newUser.id], newUser);
      
      // 返回上下文用于onError回滚
      return { previousUser };
    },
    
    // 错误时回滚
    onError: (err, newUser, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(
          ['users', newUser.id],
          context.previousUser
        );
      }
    },
    
    // 完成后重新获取
    onSettled: (newUser) => {
      queryClient.invalidateQueries({ 
        queryKey: ['users', newUser?.id] 
      });
    },
  });
}

// 缓存更新策略与失效配置
function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newUser: Omit<User, 'id'>) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      return response.json() as Promise<User>;
    },
    
    onSuccess: (data) => {
      // 方式1：重新获取整个列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // 方式2：直接更新缓存
      queryClient.setQueryData(['users'], (old: User[] | undefined) => {
        return old ? [...old, data] : [data];
      });
      
      // 方式3：预填充单个用户缓存
      queryClient.setQueryData(['users', data.id], data);
    },
  });
}
```

#### 11.3.2 GraphQL的类型生成

GraphQL与TypeScript的结合可以提供端到端的类型安全。

**Codegen配置与Fragment Colocation的组件耦合**

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['./src/**/*.tsx'],
  generates: {
    './src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
      },
    },
  },
};

export default config;

// 生成的类型（示例）
/*
export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetUserQuery = {
  __typename?: 'Query';
  user?: {
    __typename?: 'User';
    id: string;
    name: string;
    email: string;
  } | null;
};

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;

export type CreateUserMutation = {
  __typename?: 'Mutation';
  createUser: {
    __typename?: 'User';
    id: string;
    name: string;
    email: string;
  };
};
*/

// Fragment Colocation
const UserFragment = gql`
  fragment UserFields on User {
    id
    name
    email
    avatar
  }
`;

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserFields
    }
  }
  ${UserFragment}
`;

// 组件中使用
function UserCard({ userId }: { userId: string }) {
  const { data, loading } = useGetUserQuery({
    variables: { id: userId },
  });
  
  if (loading) return <Skeleton />;
  if (!data?.user) return <NotFound />;
  
  return (
    <div>
      <img src={data.user.avatar} alt={data.user.name} />
      <h3>{data.user.name}</h3>
      <p>{data.user.email}</p>
    </div>
  );
}
```

#### 11.3.3 Zustand与Context的混合架构

Zustand是轻量级的状态管理方案，可以与Context结合使用。

**跨模块状态共享与封装边界的架构防腐层**

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 基础Store
interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  updateProfile: (profile: Partial<User['profile']>) => void;
}

const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        setUser: (user) => set({ user }),
        updateProfile: (profile) =>
          set((state) => {
            if (state.user) {
              state.user.profile = { ...state.user.profile, ...profile };
            }
          }),
      })),
      { name: 'user-storage' }
    ),
    { name: 'UserStore' }
  )
);

// 组合多个Store
interface AppState {
  user: UserStore;
  ui: UIStore;
  settings: SettingsStore;
}

// TypeScript的模块增强与声明合并
declare module 'zustand' {
  interface StoreApi<T> {
    // 扩展StoreApi
  }
}

// 架构防腐层
// 防止直接访问Store，通过服务层封装
class UserService {
  constructor(private store: typeof useUserStore) {}
  
  getCurrentUser() {
    return this.store.getState().user;
  }
  
  async login(credentials: Credentials) {
    const user = await api.login(credentials);
    this.store.getState().setUser(user);
    return user;
  }
  
  async logout() {
    await api.logout();
    this.store.getState().setUser(null);
  }
}

// 使用服务层而非直接访问Store
const userService = new UserService(useUserStore);

// Context集成
const UserServiceContext = createContext<UserService | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserServiceContext.Provider value={userService}>
      {children}
    </UserServiceContext.Provider>
  );
}

function useUserService() {
  const service = useContext(UserServiceContext);
  if (!service) throw new Error('UserService not found');
  return service;
}
```

### 11.4 AI辅助的状态架构设计

AI可以辅助分析业务需求并推荐合适的状态管理方案。

#### 11.4.1 从需求描述生成状态管理方案

AI可以根据项目特征推荐状态管理方案。

**LLM分析业务逻辑复杂度并推荐Zustand/Redux/Context**

```typescript
// AI选型决策Prompt
const stateManagementSelectionPrompt = `
基于以下项目特征，推荐合适的状态管理方案：

项目特征：
- 组件数量: {{componentCount}}
- 状态复杂度: {{stateComplexity}}
- 团队规模: {{teamSize}}
- 是否需要服务端状态: {{needsServerState}}
- 是否需要时间旅行调试: {{needsTimeTravel}}
- 性能要求: {{performanceRequirement}}

可选方案：
1. Context + useState/useReducer
2. Zustand
3. Redux Toolkit
4. Recoil/Jotai
5. TanStack Query + 本地状态

请推荐最佳方案，并说明理由。
`;

// 选型决策矩阵
interface ProjectProfile {
  componentCount: 'small' | 'medium' | 'large';
  stateComplexity: 'simple' | 'medium' | 'complex';
  teamSize: 'small' | 'medium' | 'large';
  needsServerState: boolean;
  needsTimeTravel: boolean;
  performanceRequirement: 'low' | 'medium' | 'high';
}

function recommendStateManagement(profile: ProjectProfile): string {
  // 简单规则引擎
  if (profile.componentCount === 'small' && profile.stateComplexity === 'simple') {
    return 'Context + useState';
  }
  
  if (profile.needsServerState && profile.stateComplexity !== 'complex') {
    return 'TanStack Query + Zustand';
  }
  
  if (profile.stateComplexity === 'complex' || profile.needsTimeTravel) {
    return 'Redux Toolkit';
  }
  
  if (profile.performanceRequirement === 'high') {
    return 'Recoil/Jotai';
  }
  
  return 'Zustand';
}
```

#### 11.4.2 自动化生成RTK Slice

AI可以从API文档自动生成RTK Slice代码。

**从API文档到Slice、Thunk、Selector的完整代码生成**

```typescript
// OpenAPI到Redux的转换
interface OpenAPIOperation {
  operationId: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'body';
    required: boolean;
    schema: any;
  }>;
  responses: {
    [code: string]: {
      description: string;
      content?: {
        'application/json': {
          schema: any;
        };
      };
    };
  };
}

// AI生成代码示例
function generateRTKSliceFromOpenAPI(
  resourceName: string,
  operations: OpenAPIOperation[]
): string {
  return `
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createEntityAdapter } from '@reduxjs/toolkit';

interface ${resourceName} {
  id: string;
  // ... 根据schema生成
}

const ${resourceName.toLowerCase()}Adapter = createEntityAdapter<${resourceName}>();

// Async Thunks
${operations.map(op => generateThunk(op)).join('\n')}

// Slice
const ${resourceName.toLowerCase()}Slice = createSlice({
  name: '${resourceName.toLowerCase()}',
  initialState: ${resourceName.toLowerCase()}Adapter.getInitialState({
    loading: false,
    error: null,
  }),
  reducers: {},
  extraReducers: (builder) => {
    ${operations.map(op => generateExtraReducer(op)).join('\n    ')}
  },
});

export default ${resourceName.toLowerCase()}Slice.reducer;
`;
}

function generateThunk(operation: OpenAPIOperation): string {
  return `
export const ${operation.operationId} = createAsyncThunk(
  '${operation.operationId}',
  async (${generateParams(operation)}) => {
    const response = await fetch('${operation.path}', {
      method: '${operation.method.toUpperCase()}',
      ${generateBody(operation)}
    });
    return response.json();
  }
);
`;
}
```

---

本章深入探讨了现代React状态管理方案，从原子化状态管理到Redux现代架构，从服务端状态管理到AI辅助的状态架构设计。状态管理是React应用架构的核心，选择合适的状态管理方案对于应用的可维护性和性能至关重要。

在下一部分中，我们将探讨服务端渲染和全栈架构，建立端到端的类型安全体系。
