# Hooks 深度解析

## Hooks 工作原理

Hooks 是 React 16.8 引入的特性，允许在函数组件中使用状态和其他 React 特性。

### 为什么需要 Hooks

1. **复用状态逻辑**：无需使用 render props 或 HOC
2. **更简洁的代码**：函数组件比类组件更简洁
3. **更好的逻辑复用**：自定义 Hooks 可以提取组件逻辑

## useState 原理

```javascript
// 简化版实现原理
const React = (function() {
  let hooks = [];
  let idx = 0;
  
  function useState(initialValue) {
    const state = hooks[idx] !== undefined ? hooks[idx] : initialValue;
    hooks[idx] = state;
    const _idx = idx;
    idx++;
    
    function setState(newValue) {
      hooks[_idx] = newValue;
      render();
    }
    
    return [state, setState];
  }
  
  function render(Component) {
    idx = 0;
    const comp = Component();
    comp.render();
    return comp;
  }
  
  return { useState, render };
})();
```

## useEffect 详解

```javascript
useEffect(effect, dependencies);
```

### 执行时机

```javascript
// 每次渲染后执行
useEffect(() => {
  console.log('每次渲染');
});

// 只在挂载时执行
useEffect(() => {
  console.log('组件挂载');
  return () => {
    console.log('组件卸载');
  };
}, []);

// 依赖特定状态
useEffect(() => {
  console.log('count 变化:', count);
}, [count]);
```

### 清理副作用

```javascript
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
  
  // 返回清理函数
  return () => {
    clearInterval(timer);
  };
}, []);
```

## useRef 用法

```javascript
function TextInputWithFocusButton() {
  const inputEl = useRef(null);
  
  const onButtonClick = () => {
    // `current` 指向已挂载到 DOM 的文本输入元素
    inputEl.current.focus();
  };
  
  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus</button>
    </>
  );
}
```

## 自定义 Hooks

```javascript
// useLocalStorage.js
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('name', 'Guest');
  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

## Hooks 规则

1. **只在最顶层调用 Hooks**：不要在循环、条件或嵌套函数中调用
2. **只在 React 函数中调用 Hooks**：不要在普通 JavaScript 函数中调用

```javascript
// ❌ 错误：条件中调用
if (condition) {
  useEffect(() => {});
}

// ✅ 正确
useEffect(() => {
  if (condition) {
    // 逻辑放在这里
  }
});
```
