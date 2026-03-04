/**
 * HTTP Status Code Lookup Tool
 * HTTP状态码速查表
 * 
 * @author OpenClaw Auto-Dev
 */

import { useState, useMemo } from 'react';
import { Globe, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ToolModule } from '../types';

const HTTP_STATUSES = [
  { code: 200, name: 'OK', desc: '请求成功', type: 'success' },
  { code: 201, name: 'Created', desc: '资源创建成功', type: 'success' },
  { code: 204, name: 'No Content', desc: '无内容返回', type: 'success' },
  { code: 301, name: 'Moved Permanently', desc: '永久重定向', type: 'redirect' },
  { code: 302, name: 'Found', desc: '临时重定向', type: 'redirect' },
  { code: 304, name: 'Not Modified', desc: '资源未修改', type: 'redirect' },
  { code: 400, name: 'Bad Request', desc: '请求参数错误', type: 'error' },
  { code: 401, name: 'Unauthorized', desc: '未授权', type: 'error' },
  { code: 403, name: 'Forbidden', desc: '禁止访问', type: 'error' },
  { code: 404, name: 'Not Found', desc: '资源不存在', type: 'error' },
  { code: 500, name: 'Internal Server Error', desc: '服务器内部错误', type: 'error' },
  { code: 502, name: 'Bad Gateway', desc: '网关错误', type: 'error' },
  { code: 503, name: 'Service Unavailable', desc: '服务不可用', type: 'error' },
];

function HTTPStatusLookup() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return HTTP_STATUSES;
    const q = query.toLowerCase();
    return HTTP_STATUSES.filter(s => 
      s.code.toString().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.desc.includes(q)
    );
  }, [query]);

  const getVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'redirect': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="搜索状态码或描述..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />

      <div className="grid gap-2">
        {filtered.map(status => (
          <Card key={status.code} className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <Badge variant={getVariant(status.type)} className="text-lg px-3 py-1 min-w-[60px] text-center">
                {status.code}
              </Badge>
              <div className="flex-1">
                <p className="font-medium">{status.name}</p>
                <p className="text-sm text-muted-foreground">{status.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const httpStatusLookupMeta = {
  id: 'http-status-lookup',
  name: 'HTTP状态码速查',
  description: '常见HTTP状态码快速查询和说明',
  icon: Globe,
  category: 'developer' as const,
  keywords: ['http', 'status', '状态码', '404', '500', 'api'],
  isNew: true,
};

export default { meta: httpStatusLookupMeta, Component: HTTPStatusLookup } as ToolModule;
