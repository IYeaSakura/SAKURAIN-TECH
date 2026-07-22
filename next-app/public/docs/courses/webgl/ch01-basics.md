# WebGL 基础入门

## 什么是 WebGL？

WebGL（Web Graphics Library）是一个 JavaScript API，用于在任何兼容的 Web 浏览器中渲染高性能的交互式 3D 和 2D 图形，而无需使用插件。

### 主要特点

- **硬件加速**：利用 GPU 的强大计算能力
- **跨平台**：支持所有现代浏览器
- **标准化**：基于 OpenGL ES 2.0/3.0

## 环境搭建

WebGL 不需要额外的安装，现代浏览器都原生支持。你只需要：

1. 一个支持 WebGL 的浏览器（Chrome、Firefox、Safari、Edge）
2. 一个文本编辑器
3. 本地服务器（可选，用于加载纹理等资源）

## 第一个三角形

让我们创建最简单的 WebGL 程序 - 绘制一个彩色三角形。

### HTML 结构

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>WebGL 第一个三角形</title>
    <style>
        canvas { width: 100%; height: 100%; }
        body { margin: 0; overflow: hidden; }
    </style>
</head>
<body>
    <canvas id="glCanvas"></canvas>
    <script src="triangle.js"></script>
</body>
</html>
```

### JavaScript 代码

```javascript
// 获取 Canvas 和 WebGL 上下文
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

// 顶点着色器
const vsSource = `
    attribute vec4 aPosition;
    attribute vec4 aColor;
    varying vec4 vColor;
    
    void main() {
        gl_Position = aPosition;
        vColor = aColor;
    }
`;

// 片段着色器
const fsSource = `
    precision mediump float;
    varying vec4 vColor;
    
    void main() {
        gl_FragColor = vColor;
    }
`;

// 创建着色器
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

// 创建程序
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// 设置顶点数据
const vertices = new Float32Array([
    // 位置              // 颜色
     0.0,  0.5, 0.0,    1.0, 0.0, 0.0, 1.0,  // 顶点1: 红色
    -0.5, -0.5, 0.0,    0.0, 1.0, 0.0, 1.0,  // 顶点2: 绿色
     0.5, -0.5, 0.0,    0.0, 0.0, 1.0, 1.0   // 顶点3: 蓝色
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// 获取属性位置
const aPosition = gl.getAttribLocation(program, 'aPosition');
const aColor = gl.getAttribLocation(program, 'aColor');

// 配置顶点属性
const FSIZE = vertices.BYTES_PER_ELEMENT;
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, FSIZE * 7, 0);
gl.enableVertexAttribArray(aPosition);

gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, FSIZE * 7, FSIZE * 3);
gl.enableVertexAttribArray(aColor);

// 设置清除颜色并清除画布
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// 绘制三角形
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

## WebGL 坐标系

WebGL 使用**裁剪空间**（Clip Space）坐标系：

| 坐标轴 | 范围 | 含义 |
|--------|------|------|
| X      | -1.0 ~ 1.0 | 水平方向，左到右 |
| Y      | -1.0 ~ 1.0 | 垂直方向，下到上 |
| Z      | -1.0 ~ 1.0 | 深度方向，内到外 |

```
        Y (1.0)
          │
          │
(-1,1)────┼────(1,1)
          │
──────────┼─────────→ X (1.0)
          │
(-1,-1)───┼────(1,-1)
          │
       (0,-1)
```

## 渲染管线概览

WebGL 的渲染管线包含以下几个主要阶段：

1. **顶点处理**
   - 顶点着色器（Vertex Shader）
   - 图元装配

2. **光栅化**
   - 将图元转换为片段

3. **片段处理**
   - 片段着色器（Fragment Shader）
   - 深度/模板测试
   - 混合

4. **输出合并**
   - 写入帧缓冲

## 常见问题

### 黑色屏幕
- 检查 WebGL 上下文是否成功创建
- 确认着色器编译成功
- 验证顶点数据是否正确

### 性能问题
- 减少绘制调用次数
- 使用顶点缓冲对象（VBO）
- 避免在渲染循环中创建对象

## 下一步

在下一章中，我们将深入学习：
- 渲染管线的详细流程
- GLSL 着色器语言
- 矩阵变换与投影

继续学习 [第2章 渲染管线与着色器](../ch02-rendering-pipeline/)。
