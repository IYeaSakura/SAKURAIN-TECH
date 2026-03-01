/**
 * AI Packer Tool
 * 
 * Pack multiple text files into a single Markdown or XML file
 * Supports folder upload, .gitignore exclusion, regex filtering, line numbers
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Package, Upload, Download, FileText, Code, FolderOpen, X } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import { ToolCard } from '../components/shared';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

type OutputFormat = 'markdown' | 'xml';

interface FileItem {
  path: string;
  content: string;
  size: number;
  lineCount: number;
}

interface PackerOptions {
  format: OutputFormat;
  addLineNumbers: boolean;
  removeEmptyLines: boolean;
  includeFilePath: boolean;
  filePattern: string;
  useGitignore: boolean;
  maxFileSize: number;
}

interface ExclusionRules {
  dirPatterns: RegExp[];
  filePatterns: RegExp[];
}

// Text file extensions to include
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.json', '.xml', '.yaml', '.yml',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.go', '.rs', '.swift', '.kt', '.scala',
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.sql', '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd',
  '.vue', '.svelte', '.astro',
  '.toml', '.ini', '.cfg', '.conf', '.env', '.example',
  '.gitignore', '.dockerignore', '.editorconfig',
  '.svg', '.csv', '.tsv',
  '.proto', '.graphql', '.gql',
  '.dockerfile', '.makefile', '.rakefile',
  '.license', '.copying', '.authors', '.changelog',
  '.log', '.diff', '.patch',
]);

// Binary extensions to explicitly exclude
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.tiff',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.mkv', '.flv',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
  '.exe', '.dll', '.so', '.dylib', '.app',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.sqlite', '.db', '.mdb',
]);

// Common directories to always exclude
const DEFAULT_EXCLUDED_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', '.idea', '.vscode',
  'dist', 'build', 'out', 'target', 'bin', 'obj',
  '.next', '.nuxt', '.cache', 'coverage', '.nyc_output',
  'vendor', 'Pods', '.gradle', '__pycache__', '.pytest_cache',
  '.mypy_cache', 'egg-info', 'site-packages',
]);

// Parse gitignore content and extract exclusion rules
function parseGitignoreRules(content: string): ExclusionRules {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  
  const dirPatterns: RegExp[] = [];
  const filePatterns: RegExp[] = [];
  
  for (let line of lines) {
    // Skip negation patterns for now
    if (line.startsWith('!')) continue;
    
    const isDirPattern = line.endsWith('/');
    if (isDirPattern) {
      line = line.slice(0, -1);
    }
    
    // Check if it's a directory pattern (contains / or ends with /)
    const isDirectoryRule = isDirPattern || line.includes('/');
    
    // Convert gitignore pattern to regex
    let regexPattern = line
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLESTAR>>>/g, '.*')
      .replace(/\?/g, '[^/]');
    
    try {
      if (isDirectoryRule) {
        // Directory pattern: match the directory and all contents
        const pattern = `(^|/)${regexPattern}(/.*)?$`;
        dirPatterns.push(new RegExp(pattern));
      } else {
        // Simple file pattern
        const pattern = `(^|/)${regexPattern}$`;
        filePatterns.push(new RegExp(pattern));
      }
    } catch {
      // Invalid pattern, skip
    }
  }
  
  return { dirPatterns, filePatterns };
}

// Check if path matches any exclusion pattern
function isPathExcluded(path: string, rules: ExclusionRules): boolean {
  // Check directory patterns first (more likely to exclude large trees)
  for (const pattern of rules.dirPatterns) {
    if (pattern.test(path)) {
      return true;
    }
  }
  
  // Check file patterns
  for (const pattern of rules.filePatterns) {
    if (pattern.test(path)) {
      return true;
    }
  }
  
  return false;
}

// Check if path is in a default excluded directory
function isInDefaultExcludedDir(path: string): boolean {
  const parts = path.split('/');
  for (const part of parts) {
    if (DEFAULT_EXCLUDED_DIRS.has(part)) {
      return true;
    }
  }
  return false;
}

// Check if file should be included
function shouldIncludeFile(
  filePath: string,
  options: PackerOptions,
  gitignoreRules: ExclusionRules
): boolean {
  const fileName = filePath.split('/').pop() || '';
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  
  // Check binary exclusion
  if (BINARY_EXTENSIONS.has(ext)) {
    return false;
  }
  
  // Check if it's a text file
  const isTextLike = TEXT_EXTENSIONS.has(ext) || 
    fileName.startsWith('.') || 
    fileName.toLowerCase() === 'makefile' ||
    fileName.toLowerCase() === 'dockerfile' ||
    fileName.toLowerCase() === 'license' ||
    fileName.toLowerCase() === 'changelog' ||
    fileName.toLowerCase() === 'readme';
  
  if (!isTextLike) {
    if (!ext || ext === '.' + fileName.toLowerCase()) {
      // Files without extension might still be text
    } else {
      return false;
    }
  }
  
  // Check gitignore patterns
  if (options.useGitignore && isPathExcluded(filePath, gitignoreRules)) {
    return false;
  }
  
  // Check regex pattern
  if (options.filePattern) {
    try {
      const regex = new RegExp(options.filePattern, 'i');
      if (!regex.test(fileName) && !regex.test(filePath)) {
        return false;
      }
    } catch {
      // Invalid regex, ignore
    }
  }
  
  return true;
}

// Format output as Markdown
function formatAsMarkdown(files: FileItem[], options: PackerOptions): string {
  const lines: string[] = [];
  
  lines.push('# AI Packer Output');
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push(`Total files: ${files.length}`);
  lines.push(`Total lines: ${files.reduce((sum, f) => sum + f.lineCount, 0)}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  for (const file of files) {
    if (options.includeFilePath) {
      lines.push(`## File: ${file.path}`);
      lines.push('');
    }
    lines.push('```');
    
    let content = file.content;
    
    if (options.removeEmptyLines) {
      content = content
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
    }
    
    if (options.addLineNumbers) {
      const contentLines = content.split('\n');
      const maxDigits = String(contentLines.length).length;
      content = contentLines
        .map((line, i) => `${String(i + 1).padStart(maxDigits, ' ')}| ${line}`)
        .join('\n');
    }
    
    lines.push(content);
    lines.push('```');
    lines.push('');
  }
  
  return lines.join('\n');
}

// Format output as XML
function formatAsXml(files: FileItem[], options: PackerOptions): string {
  const lines: string[] = [];
  
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<ai_packer>');
  lines.push('  <metadata>');
  lines.push(`    <generated_at>${new Date().toISOString()}</generated_at>`);
  lines.push(`    <total_files>${files.length}</total_files>`);
  lines.push(`    <total_lines>${files.reduce((sum, f) => sum + f.lineCount, 0)}</total_lines>`);
  lines.push('  </metadata>');
  lines.push('  <files>');
  
  for (const file of files) {
    lines.push('    <file>');
    lines.push(`      <path>${escapeXml(file.path)}</path>`);
    lines.push(`      <size>${file.size}</size>`);
    lines.push(`      <line_count>${file.lineCount}</line_count>`);
    lines.push('      <content>');
    
    let content = file.content;
    
    if (options.removeEmptyLines) {
      content = content
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
    }
    
    if (options.addLineNumbers) {
      const contentLines = content.split('\n');
      const maxDigits = String(contentLines.length).length;
      content = contentLines
        .map((line, i) => `${String(i + 1).padStart(maxDigits, ' ')}| ${line}`)
        .join('\n');
    }
    
    lines.push(`        <![CDATA[${content}]]>`);
    lines.push('      </content>');
    lines.push('    </file>');
  }
  
  lines.push('  </files>');
  lines.push('</ai_packer>');
  
  return lines.join('\n');
}

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function AIPacker({ className = '' }: ToolProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [options, setOptions] = useState<PackerOptions>({
    format: 'markdown',
    addLineNumbers: false,
    removeEmptyLines: false,
    includeFilePath: true,
    filePattern: '',
    useGitignore: true,
    maxFileSize: 500 * 1024,
  });
  const [gitignoreRules, setGitignoreRules] = useState<ExclusionRules>({ dirPatterns: [], filePatterns: [] });
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Read file content
  const readFileContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // Process files from FileList
  const processFiles = useCallback(async (fileList: FileList, basePath: string = '') => {
    setError(null);
    const totalFiles = fileList.length;
    setProcessingProgress({ current: 0, total: totalFiles });
    
    const filesArray = Array.from(fileList);
    
    // Step 1: Find and read .gitignore files first
    const gitignoreFiles = filesArray.filter(f => f.name === '.gitignore');
    let collectedRules: ExclusionRules = { dirPatterns: [], filePatterns: [] };
    
    for (const file of gitignoreFiles) {
      try {
        const content = await readFileContent(file);
        const rules = parseGitignoreRules(content);
        collectedRules = {
          dirPatterns: [...collectedRules.dirPatterns, ...rules.dirPatterns],
          filePatterns: [...collectedRules.filePatterns, ...rules.filePatterns],
        };
      } catch {
        // Ignore read errors for gitignore
      }
    }
    
    // Merge with existing rules
    const allRules: ExclusionRules = {
      dirPatterns: [...gitignoreRules.dirPatterns, ...collectedRules.dirPatterns],
      filePatterns: [...gitignoreRules.filePatterns, ...collectedRules.filePatterns],
    };
    
    if (collectedRules.dirPatterns.length > 0 || collectedRules.filePatterns.length > 0) {
      setGitignoreRules(allRules);
    }
    
    // Step 2: Process files with early exclusion
    const newFiles: FileItem[] = [];
    const BATCH_SIZE = 100;
    let processedCount = 0;
    
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      
      let relativePath = file.webkitRelativePath || file.name;
      if (basePath && relativePath.startsWith(basePath)) {
        relativePath = relativePath.slice(basePath.length);
      }
      relativePath = relativePath.replace(/^\/+/, '');
      
      // Skip .gitignore files
      if (file.name === '.gitignore') {
        processedCount++;
        continue;
      }
      
      // Early exclusion: check default excluded directories first (fastest)
      if (isInDefaultExcludedDir(relativePath)) {
        processedCount++;
        continue;
      }
      
      // Early exclusion: check file size
      if (file.size > options.maxFileSize) {
        processedCount++;
        continue;
      }
      
      // Early exclusion: check binary files
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
      if (BINARY_EXTENSIONS.has(ext)) {
        processedCount++;
        continue;
      }
      
      // Check gitignore rules
      if (options.useGitignore && isPathExcluded(relativePath, allRules)) {
        processedCount++;
        continue;
      }
      
      // Check if it's a text file
      const fileName = file.name;
      const isTextLike = TEXT_EXTENSIONS.has(ext) || 
        fileName.startsWith('.') || 
        fileName.toLowerCase() === 'makefile' ||
        fileName.toLowerCase() === 'dockerfile' ||
        fileName.toLowerCase() === 'license' ||
        fileName.toLowerCase() === 'changelog' ||
        fileName.toLowerCase() === 'readme';
      
      if (!isTextLike && ext !== '.' + fileName.toLowerCase()) {
        processedCount++;
        continue;
      }
      
      // Check regex pattern
      if (options.filePattern) {
        try {
          const regex = new RegExp(options.filePattern, 'i');
          if (!regex.test(fileName) && !regex.test(relativePath)) {
            processedCount++;
            continue;
          }
        } catch {
          // Invalid regex, ignore
        }
      }
      
      // Read file content
      try {
        const content = await readFileContent(file);
        const lineCount = content.split('\n').length;
        
        newFiles.push({
          path: relativePath,
          content,
          size: file.size,
          lineCount,
        });
      } catch {
        // Skip files that can't be read
      }
      
      processedCount++;
      
      // Update progress every BATCH_SIZE files
      if (processedCount % BATCH_SIZE === 0 || processedCount === filesArray.length) {
        setProcessingProgress({ current: processedCount, total: totalFiles });
        // Yield to UI occasionally
        if (processedCount % BATCH_SIZE === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    
    setProcessingProgress(null);
    return newFiles;
  }, [options, gitignoreRules, readFileContent]);

  // Handle file input change
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    try {
      const newFiles = await processFiles(fileList);
      setFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      setError((err as Error).message);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  }, [processFiles]);

  // Remove file from list
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setGitignoreRules({ dirPatterns: [], filePatterns: [] });
    setError(null);
  }, []);

  // Generate output
  const output = useMemo(() => {
    const filteredFiles = files.filter(file => 
      shouldIncludeFile(file.path, options, gitignoreRules)
    );
    
    if (filteredFiles.length === 0) return '';
    
    if (options.format === 'markdown') {
      return formatAsMarkdown(filteredFiles, options);
    } else {
      return formatAsXml(filteredFiles, options);
    }
  }, [files, options, gitignoreRules]);

  // Download output
  const handleDownload = useCallback(() => {
    if (!output) return;
    
    const extension = options.format === 'markdown' ? 'md' : 'xml';
    const filename = `ai-packed.${extension}`;
    const mimeType = options.format === 'markdown' ? 'text/markdown' : 'application/xml';
    
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output, options.format]);

  // Copy output
  const handleCopy = useCallback(async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
    }
  }, [output]);

  // Statistics
  const stats = useMemo(() => {
    const filteredFiles = files.filter(file => 
      shouldIncludeFile(file.path, options, gitignoreRules)
    );
    
    return {
      totalFiles: filteredFiles.length,
      totalLines: filteredFiles.reduce((sum, f) => sum + f.lineCount, 0),
      totalSize: filteredFiles.reduce((sum, f) => sum + f.size, 0),
    };
  }, [files, options, gitignoreRules]);

  return (
    <div className={`ai-packer ${className}`}>
      <ToolCard 
        title="AI 打包工具" 
        description="将多个文本文件打包成单个 Markdown 或 XML 文件"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-5">
            {/* Upload Buttons */}
            <div className="flex gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={!!processingProgress}
              />
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is not in standard types
                webkitdirectory=""
                directory=""
                onChange={handleFileChange}
                className="hidden"
                disabled={!!processingProgress}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!!processingProgress}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--accent-primary)',
                  border: '2px solid var(--accent-primary)',
                  color: 'white',
                  clipPath: clipPathRounded(6),
                }}
              >
                <Upload className="w-4 h-4" />
                选择文件
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                disabled={!!processingProgress}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  clipPath: clipPathRounded(6),
                }}
              >
                <FolderOpen className="w-4 h-4" />
                选择文件夹
              </button>
              {files.length > 0 && !processingProgress && (
                <button
                  onClick={clearFiles}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    clipPath: clipPathRounded(6),
                  }}
                >
                  <X className="w-4 h-4" />
                  清空
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {processingProgress && (
              <div
                className="p-3"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(6),
                }}
              >
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>处理中...</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {processingProgress.current} / {processingProgress.total}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden"
                  style={{
                    background: 'var(--bg-card)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      background: 'var(--accent-primary)',
                      width: `${(processingProgress.current / processingProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  已添加文件 ({files.length} 个)
                </label>
                <div
                  className="max-h-60 overflow-y-auto space-y-1"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    clipPath: clipPathRounded(6),
                  }}
                >
                  {files.map((file, index) => {
                    const isExcluded = !shouldIncludeFile(file.path, options, gitignoreRules);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 group"
                        style={{
                          background: isExcluded ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                          opacity: isExcluded ? 0.5 : 1,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono truncate" style={{ color: 'var(--text-primary)' }}>
                            {file.path}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatSize(file.size)} • {file.lineCount} 行
                            {isExcluded && ' • 已排除'}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="p-3 text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  clipPath: clipPathRounded(6),
                }}
              >
                {error}
              </div>
            )}

            {/* Options - Always visible */}
            <div className="space-y-3 p-3" style={{ background: 'var(--bg-secondary)', clipPath: clipPathRounded(6) }}>
              {/* Output Format */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  输出格式
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'markdown', label: 'Markdown', icon: FileText },
                    { value: 'xml', label: 'XML', icon: Code },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOptions(prev => ({ ...prev, format: opt.value as OutputFormat }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        background: options.format === opt.value ? 'var(--accent-primary)' : 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: options.format === opt.value ? 'white' : 'var(--text-primary)',
                        clipPath: clipPathRounded(4),
                      }}
                    >
                      <opt.icon className="w-3 h-3" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'addLineNumbers', label: '添加行号' },
                  { key: 'removeEmptyLines', label: '去除空行' },
                  { key: 'includeFilePath', label: '包含文件路径' },
                  { key: 'useGitignore', label: '使用 .gitignore' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options[opt.key as keyof PackerOptions] as boolean}
                      onChange={(e) => setOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* File Pattern */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  文件名正则过滤
                </label>
                <input
                  type="text"
                  value={options.filePattern}
                  onChange={(e) => setOptions(prev => ({ ...prev, filePattern: e.target.value }))}
                  placeholder="如: \\.tsx?$ (仅 TypeScript 文件)"
                  className="w-full px-3 py-1.5 text-sm focus:outline-none font-mono"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                />
              </div>

              {/* Max File Size */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  最大文件大小 (KB)
                </label>
                <input
                  type="number"
                  value={Math.floor(options.maxFileSize / 1024)}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    maxFileSize: Math.max(1, parseInt(e.target.value) || 500) * 1024 
                  }))}
                  className="w-24 px-3 py-1.5 text-sm focus:outline-none"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                />
              </div>
            </div>

            {/* Statistics */}
            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '文件数', value: stats.totalFiles },
                  { label: '总行数', value: stats.totalLines.toLocaleString() },
                  { label: '总大小', value: formatSize(stats.totalSize) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-2.5 text-center"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                    <div className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Output */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                输出预览
              </label>
              {output && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs transition-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    复制
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs transition-all"
                    style={{
                      background: 'var(--accent-primary)',
                      border: '1px solid var(--accent-primary)',
                      color: 'white',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    <Download className="w-3 h-3" />
                    下载
                  </button>
                </div>
              )}
            </div>
            
            {output ? (
              <div
                className="flex-1 p-3 overflow-auto"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(8),
                  minHeight: '300px',
                  maxHeight: '500px',
                }}
              >
                <pre className="text-xs font-mono whitespace-pre-wrap break-all" style={{ color: 'var(--text-primary)' }}>
                  {output}
                </pre>
              </div>
            ) : (
              <div
                className="flex-1 flex items-center justify-center p-8"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(8),
                  minHeight: '300px',
                }}
              >
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    选择文件或文件夹开始打包
                  </p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div
              className="mt-4 p-2.5 text-xs"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '2px solid rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                clipPath: clipPathRounded(6),
              }}
            >
              <div className="font-medium mb-1">使用提示：</div>
              <ul className="list-disc list-inside space-y-0.5">
                <li>自动排除 node_modules、.git、dist 等目录</li>
                <li>自动识别文本文件，排除二进制文件</li>
                <li>支持 .gitignore 自动排除规则</li>
              </ul>
            </div>
          </div>
        </div>
      </ToolCard>
    </div>
  );
}

const meta = {
  id: 'ai-packer',
  name: 'AI 打包工具',
  description: '将多个文本文件打包成单个文件，适用于 AI 分析',
  icon: Package,
  category: 'text' as const,
  keywords: ['pack', '打包', 'ai', 'markdown', 'xml', '文件'],
  isPopular: true,
};

export const aiPackerTool: ToolModule = {
  meta,
  Component: AIPacker,
};

export default aiPackerTool;
