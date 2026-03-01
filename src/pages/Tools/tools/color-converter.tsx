/**
 * Color Converter Tool
 * 
 * Convert colors between different formats
 * HEX, RGB, HSL, HSV, CMYK
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Palette, Copy, Check } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import { ToolCard } from '../components/shared';

// CSS clip-path helper
const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// Color formats
interface ColorFormats {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsv: { h: number; s: number; v: number };
  cmyk: { c: number; m: number; y: number; k: number };
}

// Parse color from various formats
function parseColor(input: string): ColorFormats | null {
  const trimmed = input.trim().toLowerCase();
  
  // Try HEX
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    let r: number, g: number, b: number;
    
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return null;
    }
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return fromRgb(r, g, b);
  }
  
  // Try RGB
  const rgbMatch = trimmed.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    if (r > 255 || g > 255 || b > 255) return null;
    return fromRgb(r, g, b);
  }
  
  // Try HSL
  const hslMatch = trimmed.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]);
    const l = parseInt(hslMatch[3]);
    return fromHsl(h, s, l);
  }
  
  return null;
}

// Create all formats from RGB
function fromRgb(r: number, g: number, b: number): ColorFormats {
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  
  // RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  const d = max - min;
  
  let h = 0;
  let s = 0;
  
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
      case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
      case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
    }
  }
  
  // RGB to HSV
  let sHsv = 0;
  let v = max;
  if (v !== 0) {
    sHsv = d / v;
  }
  
  // RGB to CMYK
  const k = 1 - max;
  const c = k === 1 ? 0 : (1 - rNorm - k) / (1 - k);
  const m = k === 1 ? 0 : (1 - gNorm - k) / (1 - k);
  const y = k === 1 ? 0 : (1 - bNorm - k) / (1 - k);
  
  return {
    hex,
    rgb: { r, g, b },
    hsl: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
    hsv: { h: Math.round(h * 360), s: Math.round(sHsv * 100), v: Math.round(v * 100) },
    cmyk: { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) },
  };
}

// Create all formats from HSL
function fromHsl(h: number, s: number, l: number): ColorFormats {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  let r: number, g: number, b: number;
  
  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }
  
  return fromRgb(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

function ColorConverter({ className = '' }: ToolProps) {
  const [input, setInput] = useState('#3b82f6');
  const [colors, setColors] = useState<ColorFormats | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Parse input on change
  useEffect(() => {
    const parsed = parseColor(input);
    setColors(parsed);
  }, [input]);

  // Copy color value
  const copyValue = useCallback(async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  // Color format display items
  const formatItems = useMemo(() => {
    if (!colors) return [];
    
    return [
      {
        label: 'HEX',
        value: colors.hex.toUpperCase(),
        example: colors.hex,
      },
      {
        label: 'RGB',
        value: `rgb(${colors.rgb.r}, ${colors.rgb.g}, ${colors.rgb.b})`,
        example: `rgb(${colors.rgb.r}, ${colors.rgb.g}, ${colors.rgb.b})`,
      },
      {
        label: 'HSL',
        value: `hsl(${colors.hsl.h}, ${colors.hsl.s}%, ${colors.hsl.l}%)`,
        example: `hsl(${colors.hsl.h}, ${colors.hsl.s}%, ${colors.hsl.l}%)`,
      },
      {
        label: 'HSV',
        value: `hsv(${colors.hsv.h}, ${colors.hsv.s}%, ${colors.hsv.v}%)`,
        example: `hsv(${colors.hsv.h}, ${colors.hsv.s}%, ${colors.hsv.v}%)`,
      },
      {
        label: 'CMYK',
        value: `cmyk(${colors.cmyk.c}%, ${colors.cmyk.m}%, ${colors.cmyk.y}%, ${colors.cmyk.k}%)`,
        example: `cmyk(${colors.cmyk.c}%, ${colors.cmyk.m}%, ${colors.cmyk.y}%, ${colors.cmyk.k}%)`,
      },
    ];
  }, [colors]);

  // Preset colors
  const presetColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#000000',
  ];

  return (
    <div className={`color-converter ${className}`}>
      <ToolCard title="颜色转换器" description="在 HEX、RGB、HSL 等格式之间转换颜色">
        <div className="space-y-6">
          {/* Color picker and input */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="color"
                value={colors?.hex || '#000000'}
                onChange={(e) => setInput(e.target.value)}
                className="w-16 h-16 cursor-pointer"
                style={{
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(8),
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                输入颜色值
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="#3b82f6 或 rgb(59, 130, 246)"
                className="w-full px-4 py-3 font-mono focus:outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  clipPath: clipPathRounded(8),
                }}
              />
            </div>
          </div>

          {/* Preset colors */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              预设颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setInput(color)}
                  className="w-8 h-8 transition-transform hover:scale-110"
                  style={{
                    background: color,
                    border: '2px solid var(--border-subtle)',
                    clipPath: clipPathRounded(4),
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Color preview */}
          {colors && (
            <div
              className="h-20 transition-colors"
              style={{
                background: colors.hex,
                border: '2px solid var(--border-subtle)',
                clipPath: clipPathRounded(8),
              }}
            />
          )}

          {/* Format results */}
          {colors && (
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                转换结果
              </label>
              {formatItems.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    clipPath: clipPathRounded(6),
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-medium text-sm"
                      style={{ color: 'var(--accent-primary)', minWidth: '40px' }}
                    >
                      {item.label}
                    </span>
                    <code
                      className="text-sm font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.value}
                    </code>
                  </div>
                  <button
                    onClick={() => copyValue(item.value, index)}
                    className="p-2 transition-colors hover:bg-white/5"
                    style={{
                      background: copiedIndex === index ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                      color: copiedIndex === index ? '#22c55e' : 'var(--text-muted)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <p>* 支持输入格式：HEX (#fff, #ffffff)、RGB、HSL</p>
            <p>* 点击颜色值可复制到剪贴板</p>
          </div>
        </div>
      </ToolCard>
    </div>
  );
}

// Tool metadata
const meta = {
  id: 'color-converter',
  name: '颜色转换器',
  description: 'HEX、RGB、HSL、HSV、CMYK 颜色格式转换',
  icon: Palette,
  category: 'converter' as const,
  keywords: ['color', '颜色', 'hex', 'rgb', 'hsl', '转换'],
  isPopular: true,
};

// Export as ToolModule
export const colorConverterTool: ToolModule = {
  meta,
  Component: ColorConverter,
};

export default colorConverterTool;
