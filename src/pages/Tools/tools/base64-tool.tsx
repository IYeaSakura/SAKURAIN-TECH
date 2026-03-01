/**
 * Base64 Encoder/Decoder Tool
 * 
 * Encode and decode Base64 strings
 * Supports UTF-8 encoding, image upload/decode
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useRef } from 'react';
import { Binary, Upload, Download, Image as ImageIcon, FileText, X, Copy, Check } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import {
  ToolCard,
  ToolInput,
  ToolOutput,
  ToolActions,
  ClearButton,
  ErrorMessage,
} from '../components/shared';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

type Mode = 'encode' | 'decode';
type ContentType = 'text' | 'image';

interface ImageInfo {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

function Base64Tool({ className = '' }: ToolProps) {
  const [mode, setMode] = useState<Mode>('encode');
  const [contentType, setContentType] = useState<ContentType>('text');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Encode text to Base64
  const encodeText = useCallback((text: string): string => {
    try {
      const utf8Bytes = new TextEncoder().encode(text);
      const binaryString = Array.from(utf8Bytes)
        .map(b => String.fromCharCode(b))
        .join('');
      return btoa(binaryString);
    } catch (err) {
      throw new Error('编码失败：输入包含无效字符');
    }
  }, []);

  // Decode Base64 to text
  const decodeText = useCallback((base64: string): string => {
    try {
      const cleanBase64 = base64.replace(/\s/g, '');
      const binaryString = atob(cleanBase64);
      const utf8Bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        utf8Bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(utf8Bytes);
    } catch (err) {
      throw new Error('解码失败：输入不是有效的 Base64 字符串');
    }
  }, []);

  // Handle image file upload
  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('文件过大，最大支持 10MB');
      return;
    }
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      
      setImageInfo({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: dataUrl,
      });
      setOutput(base64);
    };
    reader.onerror = () => {
      setError('读取文件失败');
    };
    reader.readAsDataURL(file);
  }, []);

  // Decode Base64 to image and download
  const decodeAndDownloadImage = useCallback((base64: string) => {
    setError(null);
    
    try {
      // Clean up base64 string
      let cleanBase64 = base64.replace(/\s/g, '');
      
      // Remove data URL prefix if present
      const dataUrlMatch = cleanBase64.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (dataUrlMatch) {
        cleanBase64 = dataUrlMatch[1];
      }
      
      // Validate base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        throw new Error('无效的 Base64 字符串');
      }
      
      // Determine image type from base64 header
      let imageType = 'image/png';
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Check magic numbers to detect image type
      if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
        imageType = 'image/jpeg';
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        imageType = 'image/png';
      } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        imageType = 'image/gif';
      } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        imageType = 'image/webp';
      }
      
      // Create blob and download
      const blob = new Blob([bytes], { type: imageType });
      const url = URL.createObjectURL(blob);
      
      const extension = imageType.split('/')[1];
      const filename = `decoded-image.${extension}`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show preview
      setImageInfo({
        name: filename,
        type: imageType,
        size: bytes.length,
        dataUrl: `data:${imageType};base64,${cleanBase64}`,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  // Process text input
  const processText = useCallback((text: string, currentMode: Mode) => {
    if (!text) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      setError(null);
      if (currentMode === 'encode') {
        setOutput(encodeText(text));
      } else {
        setOutput(decodeText(text));
      }
    } catch (err) {
      setError((err as Error).message);
      setOutput('');
    }
  }, [encodeText, decodeText]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (contentType === 'text') {
      processText(value, mode);
    }
  }, [mode, processText, contentType]);

  // Handle mode change
  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setImageInfo(null);
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  // Handle content type change
  const handleContentTypeChange = useCallback((newType: ContentType) => {
    setContentType(newType);
    setImageInfo(null);
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setImageInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Copy output
  const handleCopy = useCallback(async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className={`base64-tool ${className}`}>
      <ToolCard 
        title="Base64 编解码" 
        description="支持文本和图片的 Base64 编码与解码"
      >
        <div className="space-y-5">
          {/* Content Type Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleContentTypeChange('text')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                background: contentType === 'text' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                color: contentType === 'text' ? 'white' : 'var(--text-primary)',
                clipPath: clipPathRounded(4),
              }}
            >
              <FileText className="w-4 h-4" />
              文本
            </button>
            <button
              onClick={() => handleContentTypeChange('image')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                background: contentType === 'image' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                color: contentType === 'image' ? 'white' : 'var(--text-primary)',
                clipPath: clipPathRounded(4),
              }}
            >
              <ImageIcon className="w-4 h-4" />
              图片
            </button>
          </div>

          {/* Text Mode */}
          {contentType === 'text' && (
            <>
              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleModeChange('encode')}
                  className="px-3 py-1.5 text-sm font-medium transition-all"
                  style={{
                    background: mode === 'encode' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: mode === 'encode' ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  编码
                </button>
                <button
                  onClick={() => handleModeChange('decode')}
                  className="px-3 py-1.5 text-sm font-medium transition-all"
                  style={{
                    background: mode === 'decode' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: mode === 'decode' ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  解码
                </button>
              </div>

              {/* Input */}
              <ToolInput
                value={input}
                onChange={handleInputChange}
                placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入 Base64 字符串...'}
                label={mode === 'encode' ? '原始文本' : 'Base64 字符串'}
                rows={4}
              />

              {/* Error */}
              {error && <ErrorMessage message={error} />}

              {/* Output */}
              <ToolOutput
                value={output}
                label={mode === 'encode' ? 'Base64 结果' : '解码结果'}
              />

              {/* Actions */}
              <ToolActions>
                <ClearButton onClear={handleClear} />
              </ToolActions>

              {/* Info */}
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <p>* 支持 UTF-8 编码，可处理中文等非 ASCII 字符</p>
                <p>* Base64 编码会使数据体积增加约 33%</p>
              </div>
            </>
          )}

          {/* Image Mode */}
          {contentType === 'image' && (
            <>
              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleModeChange('encode')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
                  style={{
                    background: mode === 'encode' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: mode === 'encode' ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <Upload className="w-4 h-4" />
                  图片转Base64
                </button>
                <button
                  onClick={() => handleModeChange('decode')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
                  style={{
                    background: mode === 'decode' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: mode === 'decode' ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <Download className="w-4 h-4" />
                  Base64转图片
                </button>
              </div>

              {/* Encode Mode - Upload Image */}
              {mode === 'encode' && (
                <>
                  {/* Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative p-8 text-center cursor-pointer transition-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px dashed var(--border-subtle)',
                      clipPath: clipPathRounded(8),
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                      点击或拖拽图片到此处上传
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      支持 PNG, JPG, GIF, WebP，最大 10MB
                    </p>
                  </div>

                  {/* Image Preview */}
                  {imageInfo && (
                    <div
                      className="p-4"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--border-subtle)',
                        clipPath: clipPathRounded(8),
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={imageInfo.dataUrl}
                          alt="Preview"
                          className="w-24 h-24 object-cover flex-shrink-0"
                          style={{ clipPath: clipPathRounded(4) }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {imageInfo.name}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {imageInfo.type} • {formatSize(imageInfo.size)}
                          </div>
                          <button
                            onClick={() => setImageInfo(null)}
                            className="mt-2 text-xs flex items-center gap-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <X className="w-3 h-3" />
                            清除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && <ErrorMessage message={error} />}

                  {/* Output */}
                  {output && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Base64 编码结果
                        </label>
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1 px-2 py-1 text-xs transition-all"
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            color: copied ? '#22c55e' : 'var(--text-muted)',
                            clipPath: clipPathRounded(4),
                          }}
                        >
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied ? '已复制' : '复制'}
                        </button>
                      </div>
                      <div
                        className="p-3 max-h-40 overflow-auto"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '2px solid var(--border-subtle)',
                          clipPath: clipPathRounded(6),
                        }}
                      >
                        <pre className="text-xs font-mono break-all whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                          {output}
                        </pre>
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        输出长度: {formatSize(output.length)} 字符
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Decode Mode - Base64 to Image */}
              {mode === 'decode' && (
                <>
                  {/* Input */}
                  <ToolInput
                    value={input}
                    onChange={(value) => {
                      setInput(value);
                      setError(null);
                    }}
                    placeholder="粘贴图片的 Base64 编码..."
                    label="Base64 字符串"
                    rows={6}
                  />

                  {/* Error */}
                  {error && <ErrorMessage message={error} />}

                  {/* Preview */}
                  {imageInfo && (
                    <div
                      className="p-4"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--border-subtle)',
                        clipPath: clipPathRounded(8),
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={imageInfo.dataUrl}
                          alt="Preview"
                          className="w-24 h-24 object-cover flex-shrink-0"
                          style={{ clipPath: clipPathRounded(4) }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {imageInfo.name}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {imageInfo.type} • {formatSize(imageInfo.size)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <ToolActions>
                    <button
                      onClick={() => decodeAndDownloadImage(input)}
                      disabled={!input}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
                      style={{
                        background: 'var(--accent-primary)',
                        border: '2px solid var(--accent-primary)',
                        color: 'white',
                        clipPath: clipPathRounded(6),
                      }}
                    >
                      <Download className="w-4 h-4" />
                      解码并下载图片
                    </button>
                    <ClearButton onClear={handleClear} />
                  </ToolActions>

                  {/* Info */}
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <p>* 自动检测图片格式 (PNG, JPG, GIF, WebP)</p>
                    <p>* 支持 Data URL 格式 (data:image/...;base64,...)</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </ToolCard>
    </div>
  );
}

// Tool metadata
const meta = {
  id: 'base64-tool',
  name: 'Base64 编解码',
  description: 'Base64 编码与解码，支持文本和图片',
  icon: Binary,
  category: 'encoder' as const,
  keywords: ['base64', '编码', '解码', 'encode', 'decode', 'image', '图片'],
  isPopular: true,
};

// Export as ToolModule
export const base64Tool: ToolModule = {
  meta,
  Component: Base64Tool,
};

export default base64Tool;
