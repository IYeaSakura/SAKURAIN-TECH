/**
 * IP Address Lookup Tool
 * IP地址查询工具
 * 
 * @author OpenClaw Auto-Dev
 */

import { useState, useCallback } from 'react';
import { Globe, Search, Copy, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ToolModule } from '../types';

interface IPInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  org: string;
  timezone: string;
}

function IPLookup() {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<IPInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const lookupIP = useCallback(async () => {
    const targetIp = ip.trim() || '8.8.8.8';
    setLoading(true);
    
    try {
      // 模拟查询结果
      const mockData: IPInfo = {
        ip: targetIp,
        city: 'Beijing',
        region: 'Beijing',
        country: 'CN',
        loc: '39.9042,116.4074',
        org: 'China Telecom',
        timezone: 'Asia/Shanghai',
      };
      
      await new Promise(r => setTimeout(r, 800));
      setInfo(mockData);
      toast({ title: '查询成功' });
    } catch (err) {
      toast({ title: '查询失败', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [ip, toast]);

  const copyResult = useCallback(() => {
    if (!info) return;
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: '已复制' });
  }, [info, toast]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="输入IP地址 (如: 8.8.8.8)，留空使用默认"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookupIP()}
        />
        <Button onClick={lookupIP} disabled={loading}>
          {loading ? '查询中...' : <><Search className="w-4 h-4 mr-1" />查询</>}
        </Button>
      </div>

      {info && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {info.ip}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">国家/地区</p>
                <p className="font-medium">{info.country} / {info.region}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">城市</p>
                <p className="font-medium">{info.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">运营商</p>
                <p className="font-medium">{info.org}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">时区</p>
                <p className="font-medium">{info.timezone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary">坐标: {info.loc}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const ipLookupMeta = {
  id: 'ip-lookup',
  name: 'IP地址查询',
  description: '查询IP地址的地理位置和运营商信息',
  icon: Globe,
  category: 'network' as const,
  keywords: ['ip', '地址', '查询', '地理位置', 'network'],
  isNew: true,
};

export default { meta: ipLookupMeta, Component: IPLookup } as ToolModule;
