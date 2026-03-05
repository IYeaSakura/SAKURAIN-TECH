// Tool modules - each tool is self-contained
export { regexTesterTool } from './regex-tester';
export { hashGeneratorTool } from './hash-generator';
export { base64Tool } from './base64-tool';
export { jsonFormatterTool } from './json-formatter';
export { colorConverterTool } from './color-converter';
export { uuidGeneratorTool } from './uuid-generator';
export { passwordGeneratorTool } from './password-generator';
export { timestampConverterTool } from './timestamp-converter';
export { urlEncoderTool } from './url-encoder';
export { numberBaseConverterTool } from './number-base-converter';
export { textStatisticsTool } from './text-statistics';
export { aiPackerTool } from './ai-packer';
export { qrGeneratorTool } from './qr-generator';
export { markdownEditorTool } from './markdown-editor';
export { ipLookupTool } from './ip-lookup';
export { cssUnitConverterTool } from './css-unit-converter';
export { httpStatusLookupTool } from './http-status-lookup';
export { pomodoroTool } from './pomodoro';
export { imageToBase64Tool } from './image-to-base64';
export { codeMinifierTool } from './code-minifier';

// Export all tools array for command palette
import { regexTesterTool } from './regex-tester';
import { hashGeneratorTool } from './hash-generator';
import { base64Tool } from './base64-tool';
import { jsonFormatterTool } from './json-formatter';
import { colorConverterTool } from './color-converter';
import { uuidGeneratorTool } from './uuid-generator';
import { passwordGeneratorTool } from './password-generator';
import { timestampConverterTool } from './timestamp-converter';
import { urlEncoderTool } from './url-encoder';
import { numberBaseConverterTool } from './number-base-converter';
import { textStatisticsTool } from './text-statistics';
import { aiPackerTool } from './ai-packer';
import { qrGeneratorTool } from './qr-generator';
import { markdownEditorTool } from './markdown-editor';
import { ipLookupTool } from './ip-lookup';
import { cssUnitConverterTool } from './css-unit-converter';
import { httpStatusLookupTool } from './http-status-lookup';
import { pomodoroTool } from './pomodoro';
import { imageToBase64Tool } from './image-to-base64';
import { codeMinifierTool } from './code-minifier';

export const allTools = [
  regexTesterTool,
  hashGeneratorTool,
  base64Tool,
  jsonFormatterTool,
  colorConverterTool,
  uuidGeneratorTool,
  passwordGeneratorTool,
  timestampConverterTool,
  urlEncoderTool,
  numberBaseConverterTool,
  textStatisticsTool,
  aiPackerTool,
  qrGeneratorTool,
  markdownEditorTool,
  ipLookupTool,
  cssUnitConverterTool,
  httpStatusLookupTool,
  pomodoroTool,
  imageToBase64Tool,
  codeMinifierTool,
];
