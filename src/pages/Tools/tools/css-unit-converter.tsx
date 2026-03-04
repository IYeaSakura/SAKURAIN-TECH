/**
 * CSS Unit Converter Tool
 * CSS单位转换器
 * 
 * @author OpenClaw Auto-Dev
 */

import { useState, useCallback, useMemo } from 'react';
import { Ruler, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ToolModule } from '../types';

const UNITS = [
  { value: 'px', label: 'PX (像素)', factor: 1 },
  { value: 'rem', label: 'REM (根元素)', factor: 16 },
  { value: 'em', label: 'EM (父元素)', factor: 16 },
  { value: 'pt', label: 'PT (点)', factor: 1.333 },
  { value: 'pc', label: 'PC (派卡)', factor: 16 },
  { value: 'in', label: 'IN (英寸)', factor: 96 },
  { value: 'cm', label: 'CM (厘米)', factor: 37.8 },
  { value: 'mm', label: 'MM (毫米)', factor: 3.78 },
  { value: 'vw', label: 'VW (视口宽)', factor: null },
  { value: 'vh', label: 'VH (视口高)', factor: null },
];

function CSSUnitConverter() {
  const [value, setValue] = useState('16');
  const [fromUnit, setFromUnit] = useState('px');
  const [toUnit, setToUnit] = useState('rem');
  const [baseSize, setBaseSize] = useState(16);

  const convertedValue = useMemo(() => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    const from = UNITS.find(u => u.value === fromUnit);
    const to = UNITS.find(u => u.value === toUnit);
    
    if (!from || !to || !from.factor || !to.factor) return 'N/A';
    
    // Convert to px first, then to target
    const pxValue = num * from.factor;
    const result = pxValue / to.factor;
    
    return result.toFixed(4).replace(/\.?0+$/, '');
  }, [value, fromUnit, toUnit]);

  const swapUnits = useCallback(() => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }, [toUnit, fromUnit]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>数值</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="输入数值"
              />
            </div>
            
            <div className="w-32 space-y-2">
              <Label>从</Label>
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="icon" onClick={swapUnits} className="mb-0.5">
              <ArrowRightLeft className="w-4 h-4" />
            </Button>

            <div className="w-32 space-y-2">
              <Label>到</Label>
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">基准字号 (px):</Label>
            <Input
              type="number"
              value={baseSize}
              onChange={(e) => setBaseSize(parseInt(e.target.value) || 16)}
              className="w-20"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">转换结果</p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {value} {fromUnit}
          </Badge>
          <span className="text-muted-foreground">=</span>
          <Badge className="text-lg px-4 py-2">
            {convertedValue} {toUnit}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export const cssUnitConverterMeta = {
  id: 'css-unit-converter',
  name: 'CSS单位转换器',
  description: 'CSS长度单位互转：px/rem/em/vw等',
  icon: Ruler,
  category: 'developer' as const,
  keywords: ['css', '单位', '转换', 'px', 'rem', 'em'],
  isNew: true,
};

export default { meta: cssUnitConverterMeta, Component: CSSUnitConverter } as ToolModule;
