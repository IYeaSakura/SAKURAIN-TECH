# 高级渲染技术

## 帧缓冲对象（FBO）

帧缓冲对象允许将渲染结果输出到纹理，而不是屏幕。

```javascript
function createFramebuffer(gl, width, height) {
  // 创建纹理
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  // 创建渲染缓冲（用于深度测试）
  const depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  
  // 创建帧缓冲
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  return { framebuffer, texture };
}
```

## 后期处理效果

### 模糊效果

```glsl
precision mediump float;
uniform sampler2D uTexture;
uniform vec2 uTextureSize;
varying vec2 vTexCoord;

void main() {
  vec2 onePixel = vec2(1.0) / uTextureSize;
  vec4 color = vec4(0.0);
  
  // 3x3 高斯模糊
  float kernel[9];
  kernel[0] = 0.045; kernel[1] = 0.122; kernel[2] = 0.045;
  kernel[3] = 0.122; kernel[4] = 0.332; kernel[5] = 0.122;
  kernel[6] = 0.045; kernel[7] = 0.122; kernel[8] = 0.045;
  
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
      vec2 offset = vec2(float(i-1), float(j-1)) * onePixel;
      color += texture2D(uTexture, vTexCoord + offset) * kernel[i*3+j];
    }
  }
  
  gl_FragColor = color;
}
```

## 阴影映射

```javascript
// 1. 从光源视角渲染深度图
function renderShadowMap(gl, shadowProgram, objects, lightMatrix) {
  gl.useProgram(shadowProgram);
  gl.uniformMatrix4fv(uLightMatrix, false, lightMatrix);
  
  // 绑定阴影贴图FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
  gl.viewport(0, 0, shadowMapSize, shadowMapSize);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  
  // 渲染场景（仅深度）
  objects.forEach(obj => renderObjectDepth(obj));
}

// 2. 正常渲染，使用阴影贴图
function renderSceneWithShadows(gl, program, objects, cameraMatrix, shadowTexture) {
  gl.useProgram(program);
  gl.uniformMatrix4fv(uCameraMatrix, false, cameraMatrix);
  gl.uniform1i(uShadowMap, 0);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
  
  objects.forEach(obj => renderObject(obj));
}
```
