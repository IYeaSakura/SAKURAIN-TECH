/**
 * Tool Registry - Central tool management
 * 
 * Features:
 * - Dynamic tool registration
 * - Category-based organization
 * - Search and filter capabilities
 * - Self-contained, easy to migrate
 * 
 * @author SAKURAIN
 */

import type { ToolModule, ToolCategory, CategoryConfig, ToolMeta } from './types';
import {
  Type,
  Hash,
  ArrowLeftRight,
  Binary,
  Globe,
  Code2,
  Shield,
} from 'lucide-react';

// Category definitions
export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'text',
    name: '文本处理',
    description: '文本转换、格式化、分析工具',
    icon: Type,
  },
  {
    id: 'crypto',
    name: '加密解密',
    description: '哈希、加密、解密工具',
    icon: Hash,
  },
  {
    id: 'converter',
    name: '转换工具',
    description: '单位、格式、编码转换',
    icon: ArrowLeftRight,
  },
  {
    id: 'encoder',
    name: '编解码',
    description: 'Base64、URL、Unicode 编解码',
    icon: Binary,
  },
  {
    id: 'network',
    name: '网络工具',
    description: 'IP、URL、网络相关工具',
    icon: Globe,
  },
  {
    id: 'developer',
    name: '开发工具',
    description: 'JSON、正则、时间戳等开发工具',
    icon: Code2,
  },
  {
    id: 'security',
    name: '安全工具',
    description: '密码生成、安全相关工具',
    icon: Shield,
  },
];

// Tool registry - stores all registered tools
const toolRegistry = new Map<string, ToolModule>();

// Register a tool
export function registerTool(tool: ToolModule): void {
  if (toolRegistry.has(tool.meta.id)) {
    console.warn(`Tool "${tool.meta.id}" is already registered. Overwriting.`);
  }
  toolRegistry.set(tool.meta.id, tool);
}

// Register multiple tools
export function registerTools(tools: ToolModule[]): void {
  tools.forEach(registerTool);
}

// Get a tool by ID
export function getTool(id: string): ToolModule | undefined {
  return toolRegistry.get(id);
}

// Get all tools
export function getAllTools(): ToolModule[] {
  return Array.from(toolRegistry.values());
}

// Get tools by category
export function getToolsByCategory(category: ToolCategory): ToolModule[] {
  return getAllTools().filter(tool => tool.meta.category === category);
}

// Search tools by keyword
export function searchTools(query: string): ToolModule[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return getAllTools();

  return getAllTools().filter(tool => {
    const meta = tool.meta;
    return (
      meta.name.toLowerCase().includes(lowerQuery) ||
      meta.description.toLowerCase().includes(lowerQuery) ||
      meta.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
    );
  });
}

// Get popular tools
export function getPopularTools(): ToolModule[] {
  return getAllTools().filter(tool => tool.meta.isPopular);
}

// Get new tools
export function getNewTools(): ToolModule[] {
  return getAllTools().filter(tool => tool.meta.isNew);
}

// Get tool metadata list
export function getToolMetaList(): ToolMeta[] {
  return getAllTools().map(tool => tool.meta);
}
