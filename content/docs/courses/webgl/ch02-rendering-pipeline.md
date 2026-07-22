# 渲染管线与着色器

## WebGL 渲染管线

渲染管线是图形学中用于将 3D 场景转换为 2D 图像的一系列处理步骤。WebGL 采用的是**可编程渲染管线**，允许开发者通过着色器控制渲染过程。

## 渲染管线流程

```
顶点数据 → 顶点着色器 → 图元装配 → 光栅化 → 片段着色器 → 输出合并
```

### 1. 顶点着色器（Vertex Shader）

顶点着色器是渲染管线的第一个可编程阶段，主要任务：
- 变换顶点位置（模型-视图-投影变换）
- 计算顶点颜色
- 传递属性到片段着色器

```glsl
// 典型顶点着色器结构
attribute vec3 aPosition;      // 顶点位置（模型空间）
attribute vec2 aTexCoord;      // 纹理坐标
attribute vec3 aNormal;        // 法线向量

uniform mat4 uModelViewMatrix; // 模型视图矩阵
uniform mat4 uProjectionMatrix;// 投影矩阵

varying vec2 vTexCoord;        // 传递给片段着色器
varying vec3 vNormal;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    vTexCoord = aTexCoord;
    vNormal = aNormal;
}
```

### 2. 图元装配

顶点着色器输出的顶点被组装成图元：
- `gl.POINTS` - 点
- `gl.LINES` / `gl.LINE_STRIP` / `gl.LINE_LOOP` - 线
- `gl.TRIANGLES` / `gl.TRIANGLE_STRIP` / `gl.TRIANGLE_FAN` - 三角形

### 3. 光栅化

将图元转换为片段（Fragments），每个片段对应屏幕上的一个像素。

### 4. 片段着色器（Fragment Shader）

片段着色器决定每个片段的最终颜色：

```glsl
precision mediump float;       // 精度限定符

varying vec2 vTexCoord;
varying vec3 vNormal;

uniform sampler2D uTexture;
uniform vec3 uLightDirection;

void main() {
    // 纹理采样
    vec4 texColor = texture2D(uTexture, vTexCoord);
    
    // 简单光照计算
    float light = max(dot(vNormal, uLightDirection), 0.0);
    
    gl_FragColor = texColor * light;
}
```

## GLSL 基础

### 数据类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `float` | 浮点数 | `float x = 1.0;` |
| `vec2/3/4` | 向量 | `vec3 position = vec3(1.0, 2.0, 3.0);` |
| `mat2/3/4` | 矩阵 | `mat4 m = mat4(1.0);` |
| `sampler2D` | 2D纹理 | `uniform sampler2D uTexture;` |

### 修饰符

```glsl
// attribute - 顶点属性，每个顶点不同
attribute vec3 aPosition;

// uniform - 全局变量，所有顶点/片段相同
uniform mat4 uMatrix;
uniform float uTime;

// varying - 顶点着色器输出，片段着色器输入
varying vec3 vNormal;
varying vec2 vTexCoord;
```

## 变换矩阵

### 模型矩阵（Model Matrix）
将顶点从模型空间变换到世界空间。

### 视图矩阵（View Matrix）
将世界空间变换到相机空间。

### 投影矩阵（Projection Matrix）
将相机空间变换到裁剪空间：

**透视投影**：
```javascript
function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ]);
}
```

**正交投影**：
```javascript
function ortho(left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    
    return new Float32Array([
        -2 * lr, 0, 0, 0,
        0, -2 * bt, 0, 0,
        0, 0, 2 * nf, 0,
        (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
    ]);
}
```

## 绘制立方体示例

```javascript
// 立方体顶点数据（36个顶点，每个面2个三角形）
const vertices = new Float32Array([
    // 前面 (z = 0.5)
    -0.5, -0.5,  0.5,  0.0, 0.0,  // 顶点 + 纹理坐标
     0.5, -0.5,  0.5,  1.0, 0.0,
     0.5,  0.5,  0.5,  1.0, 1.0,
    -0.5, -0.5,  0.5,  0.0, 0.0,
     0.5,  0.5,  0.5,  1.0, 1.0,
    -0.5,  0.5,  0.5,  0.0, 1.0,
    // ... 其他五个面
]);

// 在渲染循环中
function render(time) {
    // 创建旋转矩阵
    const angle = time * 0.001;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const modelMatrix = new Float32Array([
        cos, 0, sin, 0,
        0, 1, 0, 0,
        -sin, 0, cos, 0,
        0, 0, 0, 1
    ]);
    
    // 上传矩阵到 uniform
    gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
    
    // 绘制
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    
    requestAnimationFrame(render);
}
```

## 深度测试

启用深度测试以实现正确的遮挡关系：

```javascript
// 启用深度测试
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

// 清除深度缓冲
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
```

## 背面剔除

提高性能，不渲染不可见的背面：

```javascript
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.frontFace(gl.CCW); // 逆时针为正面
```

## 小结

本章学习了：
- 完整的 WebGL 渲染管线流程
- GLSL 着色器编程基础
- 矩阵变换原理
- 立方体绘制示例

下一章将学习纹理映射和光照模型。
