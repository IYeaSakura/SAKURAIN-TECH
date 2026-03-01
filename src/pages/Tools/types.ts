/**
 * Toolbox Types - Core type definitions
 * 
 * Highly modular design for easy migration and independent deployment
 * Each tool is self-contained with its own metadata and logic
 * 
 * @author SAKURAIN
 */

import type { LucideIcon } from 'lucide-react';

// Tool category definition
export type ToolCategory = 
  | 'text' 
  | 'crypto' 
  | 'converter' 
  | 'encoder' 
  | 'network' 
  | 'developer'
  | 'security';

// Tool metadata - each tool must implement this interface
export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  keywords: string[];
  isNew?: boolean;
  isPopular?: boolean;
}

// Tool component props
export interface ToolProps {
  className?: string;
}

// Tool module - standard export structure for each tool
export interface ToolModule {
  meta: ToolMeta;
  Component: React.ComponentType<ToolProps>;
}

// Category configuration
export interface CategoryConfig {
  id: ToolCategory;
  name: string;
  description: string;
  icon: LucideIcon;
}

// Tool state for copy functionality
export interface CopyState {
  success: boolean;
  error: string | null;
}
