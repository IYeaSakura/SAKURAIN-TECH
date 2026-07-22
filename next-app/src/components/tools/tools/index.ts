/**
 * Tools Index - Export all tools
 * 
 * Add new tools here to register them in the toolbox
 * Each tool is self-contained and can be easily added/removed
 * 
 * @author SAKURAIN
 */

// Import all tools
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
import qrGeneratorTool from './qr-generator';
import markdownEditorTool from './markdown-editor';
import ipLookupTool from './ip-lookup';
import cssUnitConverterTool from './css-unit-converter';
import httpStatusLookupTool from './http-status-lookup';
import pomodoroTool from './pomodoro';
import imageToBase64Tool from './image-to-base64';
import codeMinifierTool from './code-minifier';

// Export all tools as array for easy registration
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

// Re-export individual tools
export {
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
};
