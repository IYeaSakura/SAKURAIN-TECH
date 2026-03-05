import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { 
  Search, 
  Code2, 
  Wrench, 
  FileText, 
  Home, 
  User, 
  Settings,
  Moon,
  Sun,
  Github,
  Rss,
  Globe,
  Command as CommandIcon
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '@/hooks';
import { allTools } from '@/pages/Tools/registry';

// 算法列表
const ALGORITHMS = [
  { id: 'sorting/quick', name: '快速排序', category: '排序' },
  { id: 'sorting/merge', name: '归并排序', category: '排序' },
  { id: 'sorting/heap', name: '堆排序', category: '排序' },
  { id: 'graph/dfs', name: '深度优先搜索', category: '图论' },
  { id: 'graph/bfs', name: '广度优先搜索', category: '图论' },
  { id: 'graph/dijkstra', name: 'Dijkstra 最短路', category: '图论' },
  { id: 'graph/dinic', name: 'Dinic 最大流', category: '图论' },
  { id: 'dp/knapsack', name: '01背包', category: '动态规划' },
  { id: 'dp/lcs', name: '最长公共子序列', category: '动态规划' },
  { id: 'dp/lis', name: '最长递增子序列', category: '动态规划' },
  { id: 'dp/edit-distance', name: '编辑距离', category: '动态规划' },
];

// 页面导航
const PAGES = [
  { id: '/', name: '首页', icon: Home },
  { id: '/about', name: '关于', icon: User },
  { id: '/blog', name: '博客', icon: FileText },
  { id: '/algoviz', name: '算法可视化', icon: Code2 },
  { id: '/tools', name: '工具箱', icon: Wrench },
  { id: '/friends', name: '友链', icon: Globe },
  { id: '/feed', name: '动态', icon: Rss },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Cmd+K / Ctrl+K 快捷键
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const filterItems = (items: any[], query: string) => {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lower) ||
      (item.category && item.category.toLowerCase().includes(lower))
    );
  };

  const filteredAlgorithms = filterItems(ALGORITHMS, search);
  const filteredTools = filterItems(allTools.map(t => ({ 
    id: t.id, 
    name: t.name, 
    category: '工具' 
  })), search);
  const filteredPages = filterItems(PAGES, search);

  return (
    <>
      {/* 快捷键提示 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 brutalist-button flex items-center gap-2 text-sm"
        title="Cmd+K"
      >
        <CommandIcon size={16} />
        <span>Cmd+K</span>
      </button>

      {/* 命令面板 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50">
          <Command
            className="w-full max-w-2xl bg-bg-card border-4 border-border-thick shadow-hard-lg"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
          >
            {/* 搜索框 */}
            <div className="flex items-center border-b-4 border-border-thick px-4">
              <Search className="text-text-muted" size={20} />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="搜索算法、工具、页面..."
                className="flex-1 bg-transparent border-none outline-none p-4 text-lg font-mono placeholder:text-text-muted"
              />
              <kbd className="px-2 py-1 bg-bg-secondary border-2 border-border font-mono text-xs">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="p-8 text-center text-text-muted font-mono">
                未找到匹配项
              </Command.Empty>

              {/* 快速操作 */}
              <Command.Group heading="快速操作" className="px-2 py-1 text-xs font-mono text-text-muted uppercase">
                <Command.Item
                  onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-bg-hover border-2 border-transparent hover:border-border-thick data-[selected=true]:bg-bg-hover data-[selected=true]:border-border-thick"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  <span>切换主题 ({theme === 'dark' ? '明亮' : '暗黑'})</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => window.open('https://github.com/IYeaSakura/SAKURAIN-TECH', '_blank'))}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-bg-hover border-2 border-transparent hover:border-border-thick data-[selected=true]:bg-bg-hover data-[selected=true]:border-border-thick"
                >
                  <Github size={18} />
                  <span>查看源码</span>
                </Command.Item>
              </Command.Group>

              {/* 页面导航 */}
              {filteredPages.length > 0 && (
                <Command.Group heading="页面" className="px-2 py-1 text-xs font-mono text-text-muted uppercase">
                  {filteredPages.map((page) => (
                    <Command.Item
                      key={page.id}
                      onSelect={() => runCommand(() => navigate(page.id))}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-bg-hover border-2 border-transparent hover:border-border-thick data-[selected=true]:bg-bg-hover data-[selected=true]:border-border-thick"
                    >
                      <page.icon size={18} />
                      <span>{page.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* 算法 */}
              {filteredAlgorithms.length > 0 && (
                <Command.Group heading="算法" className="px-2 py-1 text-xs font-mono text-text-muted uppercase">
                  {filteredAlgorithms.map((algo) => (
                    <Command.Item
                      key={algo.id}
                      onSelect={() => runCommand(() => navigate(`/algoviz?algo=${algo.id}`))}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-bg-hover border-2 border-transparent hover:border-border-thick data-[selected=true]:bg-bg-hover data-[selected=true]:border-border-thick"
                    >
                      <Code2 size={18} />
                      <div>
                        <div className="font-medium">{algo.name}</div>
                        <div className="text-xs text-text-muted">{algo.category}</div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* 工具 */}
              {filteredTools.length > 0 && (
                <Command.Group heading="工具" className="px-2 py-1 text-xs font-mono text-text-muted uppercase">
                  {filteredTools.map((tool) => (
                    <Command.Item
                      key={tool.id}
                      onSelect={() => runCommand(() => navigate(`/tools?tool=${tool.id}`))}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-bg-hover border-2 border-transparent hover:border-border-thick data-[selected=true]:bg-bg-hover data-[selected=true]:border-border-thick"
                    >
                      <Wrench size={18} />
                      <span>{tool.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* 底部提示 */}
            <div className="flex items-center justify-between px-4 py-2 border-t-4 border-border-thick bg-bg-secondary text-xs font-mono text-text-muted">
              <div className="flex gap-4">
                <span>↑↓ 选择</span>
                <span>↵ 确认</span>
              </div>
              <span>SAKURAIN TECH</span>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}
