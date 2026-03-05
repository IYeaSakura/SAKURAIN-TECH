/**
 * Code Minifier Tool
 * 代码压缩工具
 * 
 * @author OpenClaw Auto-Dev
 */

import { useState, useCallback } from 'react';
import { FileCode, Minimize2, Copy, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ToolModule } from '../types';

function CodeMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const minify = useCallback(() => {
    if (!input.trim()) {
      toast({ title: '请输入代码', variant: 'destructive' });
      return;
    }
    
    // 简单压缩：移除多余空格和换行
    const minified = input
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
      .replace(/\/\/.*$/gm, '') // 移除单行注释
      .replace(/\s+/g, ' ') // 合并空白
      .replace(/;\s*}/g, ';}') // 移除分号后的空格
      .replace(/{\s*/g, '{') // 移除 { 后的空格
      .replace(/\s*}/g, '}') // 移除 } 前的空格
      .trim();
    
    setOutput(minified);
    const saved = input.length - minified.length;
    toast({ 
      title: '压缩完成', 
      description: `减少了 ${saved} 个字符 (${((saved/input.length)*100).toFixed(1)}%)` 
    });
  }, [input, toast]);

  const copyResult = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: '已复制' });
  }, [output, toast]);

  const clearAll = useCallback(() => {
    setInput('');
    setOutput('');
  }, []);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">输入 ({input.length})</TabsTrigger>
          <TabsTrigger value="output">输出 ({output.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="input">
          <Textarea
            placeholder="粘贴要压缩的代码..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
        </TabsContent>
        
        <TabsContent value="output">
          <Textarea
            readOnly
            value={output}
            rows={12}
            className="font-mono text-sm"
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={minify} className="flex-1">
          <Minimize2 className="w-4 h-4 mr-1" />压缩
        </Button>
        <Button variant="outline" onClick={copyResult} disabled={!output}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" onClick={clearAll}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {output && (
        <div className="flex gap-2">
          <Badge variant="secondary">原: {input.length} 字符</Badge>
          <Badge variant="outline">压缩: {output.length} 字符</Badge>
          <Badge>节省: {input.length - output.length} ({((input.length-output.length)/input.length*100).toFixed(1)}%)</Badge>
        </div>
      )}
    </div>
  );
}

export const codeMinifierMeta = {
  id: 'code-minifier',
  name: '代码压缩',
  description: '移除代码中的空白和注释，减小文件体积',
  icon: FileCode,
  category: 'developer' as const,
  keywords: ['code', 'minify', '压缩', '代码优化'],
  isNew: true,
};

export default { meta: codeMinifierMeta, Component: CodeMinifier } as ToolModule;
