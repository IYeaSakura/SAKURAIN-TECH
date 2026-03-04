/**
 * Image to Base64 Converter Tool
 * 图片转Base64
 * 
 * @author OpenClaw Auto-Dev
 */

import { useState, useCallback } from 'react';
import { Image, Upload, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ToolModule } from '../types';

function ImageToBase64() {
  const [base64, setBase64] = useState('');
  const [fileInfo, setFileInfo] = useState<{name: string, size: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: '请选择图片文件', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBase64(result);
      setFileInfo({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB'
      });
      toast({ title: '转换成功' });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const copyResult = useCallback(() => {
    navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: '已复制到剪贴板' });
  }, [base64, toast]);

  const downloadTxt = useCallback(() => {
    const blob = new Blob([base64], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `base64-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: '下载已开始' });
  }, [base64, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">点击上传图片或拖拽到此处</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      </div>

      {fileInfo && (
        <div className="flex gap-2">
          <Badge variant="secondary">{fileInfo.name}</Badge>
          <Badge variant="outline">{fileInfo.size}</Badge>
        </div>
      )}

      {base64 && (
        <>
          <Card>
            <CardContent className="p-4">
              <Textarea
                value={base64}
                readOnly
                rows={6}
                className="font-mono text-xs resize-none"
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copyResult} className="flex-1">
              {copied ? <><Check className="w-4 h-4 mr-1" />已复制</> : <><Copy className="w-4 h-4 mr-1" />复制</>}
            </Button>
            <Button variant="outline" onClick={downloadTxt} className="flex-1">
              <Download className="w-4 h-4 mr-1" />下载
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export const imageToBase64Meta = {
  id: 'image-to-base64',
  name: '图片转Base64',
  description: '将图片转换为Base64编码字符串',
  icon: Image,
  category: 'encoder' as const,
  keywords: ['image', 'base64', '图片', '编码', '转换'],
  isNew: true,
};

export default { meta: imageToBase64Meta, Component: ImageToBase64 } as ToolModule;
