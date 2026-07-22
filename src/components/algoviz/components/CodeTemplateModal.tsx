/**
 * 代码模板弹窗组件
 * 显示算法在不同编程语言中的实现
 */

import React, { useState } from 'react';
import { X, FileCode, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeTemplate {
  language: string;
  label: string;
  code: string;
}

interface CodeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  algorithmName: string;
  templates: CodeTemplate[];
}

// 代码高亮函数 - 使用 Prism.js 风格的颜色
const highlightCode = (code: string, language: string): React.ReactNode[] => {
  // 先按行分割
  const lines = code.split('\n');
  
  // 关键字定义
  const keywords: Record<string, string[]> = {
    c: ['void', 'int', 'char', 'float', 'double', 'for', 'if', 'else', 'while', 'return', 'struct', 'typedef', 'const', 'sizeof', 'break', 'continue'],
    cpp: ['void', 'int', 'char', 'float', 'double', 'for', 'if', 'else', 'while', 'return', 'vector', 'auto', 'const', 'template', 'class', 'public', 'private', 'namespace', 'using', 'break', 'continue', 'swap'],
    java: ['public', 'static', 'void', 'int', 'char', 'float', 'double', 'for', 'if', 'else', 'while', 'return', 'class', 'new', 'final', 'private', 'protected', 'break', 'continue'],
    python: ['def', 'for', 'in', 'if', 'else', 'elif', 'while', 'return', 'range', 'len', 'import', 'from', 'class', 'self', 'break', 'continue', 'pass', 'None', 'True', 'False'],
    javascript: ['function', 'const', 'let', 'var', 'for', 'if', 'else', 'while', 'return', 'new', 'this', 'typeof', 'instanceof', 'break', 'continue', 'undefined', 'null', 'true', 'false'],
    go: ['func', 'int', 'string', 'for', 'if', 'else', 'return', 'range', 'len', 'make', 'var', 'const', 'package', 'import', 'break', 'continue'],
    rust: ['fn', 'let', 'mut', 'for', 'in', 'if', 'else', 'while', 'return', 'impl', 'struct', 'pub', 'use', 'mod', 'break', 'continue', 'match'],
    csharp: ['public', 'static', 'void', 'int', 'char', 'float', 'double', 'for', 'if', 'else', 'while', 'return', 'class', 'new', 'private', 'protected', 'internal', 'break', 'continue'],
    matlab: ['function', 'for', 'if', 'else', 'while', 'end', 'length', 'size', 'return', 'elseif', 'break', 'continue']
  };

  const langKeywords = keywords[language] || keywords.c;
  
  // 构建关键字正则（按长度排序，优先匹配长的）
  const sortedKeywords = [...langKeywords].sort((a, b) => b.length - a.length);
  const keywordPattern = new RegExp(`\\b(${sortedKeywords.join('|')})\\b`, 'g');
  
  return lines.map((line, lineIndex) => {
    // 处理每行代码
    const tokens: React.ReactNode[] = [];
    let keyIndex = 0;
    
    // 1. 先提取注释
    let codePart = line;
    let commentPart = '';
    
    const commentIndex = line.indexOf('//');
    if (commentIndex >= 0 && (language === 'c' || language === 'cpp' || language === 'java' || language === 'javascript' || language === 'go' || language === 'rust' || language === 'csharp')) {
      codePart = line.substring(0, commentIndex);
      commentPart = line.substring(commentIndex);
    } else {
      const hashIndex = line.indexOf('#');
      if (hashIndex >= 0 && language === 'python') {
        codePart = line.substring(0, hashIndex);
        commentPart = line.substring(hashIndex);
      } else {
        const percentIndex = line.indexOf('%');
        if (percentIndex >= 0 && language === 'matlab') {
          codePart = line.substring(0, percentIndex);
          commentPart = line.substring(percentIndex);
        }
      }
    }
    
    // 2. 处理代码部分的高亮
    const processPart = (part: string, isComment: boolean) => {
      if (!part) return;
      
      if (isComment) {
        tokens.push(
          <span key={`comment-${lineIndex}-${keyIndex++}`} className="code-comment">
            {part}
          </span>
        );
        return;
      }
      
      // 高亮字符串
      const stringRegex = /(".*?"|'.*?')/g;
      // 高亮数字
      const numberRegex = /\b(\d+)\b/g;
      // 高亮函数调用
      const funcRegex = /(\w+)(?=\()/g;
      
      let match;
      
      // 按位置排序所有匹配
      const matches: Array<{ index: number; end: number; type: string; value: string }> = [];
      
      // 匹配关键字
      while ((match = keywordPattern.exec(part)) !== null) {
        matches.push({ index: match.index, end: match.index + match[0].length, type: 'keyword', value: match[0] });
      }
      
      // 匹配字符串
      stringRegex.lastIndex = 0;
      while ((match = stringRegex.exec(part)) !== null) {
        matches.push({ index: match.index, end: match.index + match[0].length, type: 'string', value: match[0] });
      }
      
      // 匹配数字
      numberRegex.lastIndex = 0;
      while ((match = numberRegex.exec(part)) !== null) {
        // 确保不是关键字的一部分
        const isPartOfKeyword = matches.some(m => 
          m.type === 'keyword' && match!.index >= m.index && match!.index < m.end
        );
        if (!isPartOfKeyword) {
          matches.push({ index: match.index, end: match.index + match[0].length, type: 'number', value: match[0] });
        }
      }
      
      // 匹配函数
      funcRegex.lastIndex = 0;
      while ((match = funcRegex.exec(part)) !== null) {
        // 确保不是关键字
        const isKeyword = langKeywords.includes(match[0]);
        if (!isKeyword) {
          matches.push({ index: match.index, end: match.index + match[0].length, type: 'function', value: match[0] });
        }
      }
      
      // 按位置排序
      matches.sort((a, b) => a.index - b.index);
      
      // 去重（优先使用前面的匹配）
      const uniqueMatches: typeof matches = [];
      let lastEnd = -1;
      for (const m of matches) {
        if (m.index >= lastEnd) {
          uniqueMatches.push(m);
          lastEnd = m.end;
        }
      }
      
      // 构建 token
      let currentPos = 0;
      for (const m of uniqueMatches) {
        // 添加普通文本
        if (m.index > currentPos) {
          tokens.push(
            <span key={`text-${lineIndex}-${keyIndex++}`}>
              {part.substring(currentPos, m.index)}
            </span>
          );
        }
        
        // 添加高亮 token
        const className = `code-${m.type}`;
        tokens.push(
          <span key={`${m.type}-${lineIndex}-${keyIndex++}`} className={className}>
            {m.value}
          </span>
        );
        
        currentPos = m.end;
      }
      
      // 添加剩余文本
      if (currentPos < part.length) {
        tokens.push(
          <span key={`text-end-${lineIndex}-${keyIndex++}`}>
            {part.substring(currentPos)}
          </span>
        );
      }
    };
    
    processPart(codePart, false);
    processPart(commentPart, true);
    
    return (
      <div key={`line-${lineIndex}`} className="code-line">
        {tokens.length > 0 ? tokens : line}
      </div>
    );
  });
};

const DEFAULT_TEMPLATES: Record<string, CodeTemplate[]> = {
  bubble: [
    {
      language: 'c',
      label: 'C',
      code: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
    },
    {
      language: 'cpp',
      label: 'C++',
      code: `void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`
    },
    {
      language: 'java',
      label: 'Java',
      code: `public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
    },
    {
      language: 'python',
      label: 'Python',
      code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}`
    },
    {
      language: 'go',
      label: 'Go',
      code: `func bubbleSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        for j := 0; j < n-i-1; j++ {
            if arr[j] > arr[j+1] {
                arr[j], arr[j+1] = arr[j+1], arr[j]
            }
        }
    }
}`
    },
    {
      language: 'rust',
      label: 'Rust',
      code: `fn bubble_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 0..n-1 {
        for j in 0..n-i-1 {
            if arr[j] > arr[j+1] {
                arr.swap(j, j+1);
            }
        }
    }
}`
    },
    {
      language: 'csharp',
      label: 'C#',
      code: `public static void BubbleSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
    },
    {
      language: 'matlab',
      label: 'MatLab',
      code: `function arr = bubbleSort(arr)
    n = length(arr);
    for i = 1:n-1
        for j = 1:n-i
            if arr(j) > arr(j+1)
                temp = arr(j);
                arr(j) = arr(j+1);
                arr(j+1) = temp;
            end
        end
    end
end`
    }
  ],
  selection: [
    {
      language: 'c',
      label: 'C',
      code: `void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`
    },
    {
      language: 'cpp',
      label: 'C++',
      code: `void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            swap(arr[i], arr[minIdx]);
        }
    }
}`
    },
    {
      language: 'java',
      label: 'Java',
      code: `public static void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`
    },
    {
      language: 'python',
      label: 'Python',
      code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `function selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        }
    }
    return arr;
}`
    },
    {
      language: 'go',
      label: 'Go',
      code: `func selectionSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        minIdx := i
        for j := i + 1; j < n; j++ {
            if arr[j] < arr[minIdx] {
                minIdx = j
            }
        }
        if minIdx != i {
            arr[i], arr[minIdx] = arr[minIdx], arr[i]
        }
    }
}`
    },
    {
      language: 'rust',
      label: 'Rust',
      code: `fn selection_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 0..n-1 {
        let mut min_idx = i;
        for j in i+1..n {
            if arr[j] < arr[min_idx] {
                min_idx = j;
            }
        }
        if min_idx != i {
            arr.swap(i, min_idx);
        }
    }
}`
    },
    {
      language: 'csharp',
      label: 'C#',
      code: `public static void SelectionSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`
    },
    {
      language: 'matlab',
      label: 'MatLab',
      code: `function arr = selectionSort(arr)
    n = length(arr);
    for i = 1:n-1
        minIdx = i;
        for j = i+1:n
            if arr(j) < arr(minIdx)
                minIdx = j;
            end
        end
        if minIdx ~= i
            temp = arr(i);
            arr(i) = arr(minIdx);
            arr(minIdx) = temp;
        end
    end
end`
    }
  ]
};

export const CodeTemplateModal: React.FC<CodeTemplateModalProps> = ({
  isOpen,
  onClose,
  algorithmName,
  templates
}) => {
  // 使用传入的模板，如果没有则使用默认的冒泡排序模板
  const displayTemplates = templates.length > 0 ? templates : (DEFAULT_TEMPLATES['bubble'] || []);
  const [activeLang, setActiveLang] = useState(displayTemplates[0]?.language || 'python');
  const [copied, setCopied] = useState(false);

  const activeTemplate = displayTemplates.find(t => t.language === activeLang) || displayTemplates[0];

  const handleCopy = async () => {
    if (activeTemplate?.code) {
      await navigator.clipboard.writeText(activeTemplate.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const highlightedContent = activeTemplate?.code 
    ? highlightCode(activeTemplate.code, activeTemplate.language)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content code-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="modal-header">
              <div className="modal-title">
                <FileCode size={20} />
                <span>{algorithmName} - 代码模板</span>
              </div>
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* 语言选择 */}
            <div className="language-tabs">
              {displayTemplates.map(template => (
                <button
                  key={template.language}
                  className={`lang-tab ${activeLang === template.language ? 'active' : ''}`}
                  onClick={() => setActiveLang(template.language)}
                >
                  {template.label}
                </button>
              ))}
            </div>

            {/* 代码显示 - 固定尺寸 */}
            <div className="code-display">
              <div className="code-header">
                <span className="code-lang">{activeTemplate?.label}</span>
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="code-block-wrapper">
                <div className="code-block">
                  {highlightedContent}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CodeTemplateModal;
