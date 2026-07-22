# 纹理与光照

## 纹理映射

纹理映射是将2D图像应用到3D模型表面的技术。

### 加载纹理

```javascript
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // 设置默认像素（在图片加载前显示）
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);
  
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);
  
  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);
    
    // 检查图片尺寸是否为2的幂
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;
  
  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
```

## 光照模型

### Phong光照模型

Phong光照模型包含三个分量：
- **环境光(Ambient)**: 模拟间接光照
- **漫反射(Diffuse)**: 模拟直接光照
- **镜面反射(Specular)**: 模拟高光

```glsl
// 顶点着色器
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vTexCoord;

void main() {
  vec4 position = uModelViewMatrix * vec4(aPosition, 1.0);
  vPosition = position.xyz;
  vNormal = mat3(uNormalMatrix) * aNormal;
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * position;
}
```

```glsl
// 片段着色器
precision mediump float;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vTexCoord;

uniform sampler2D uTexture;
uniform vec3 uLightPosition;
uniform vec3 uAmbientLight;
uniform vec3 uDiffuseLight;
uniform vec3 uSpecularLight;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPosition - vPosition);
  vec3 viewDir = normalize(-vPosition);
  vec3 reflectDir = reflect(-lightDir, normal);
  
  // 环境光
  vec3 ambient = uAmbientLight;
  
  // 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uDiffuseLight;
  
  // 镜面反射
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
  vec3 specular = spec * uSpecularLight;
  
  vec3 lighting = ambient + diffuse + specular;
  vec4 texColor = texture2D(uTexture, vTexCoord);
  
  gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
}
```

## 多重纹理

```glsl
uniform sampler2D uBaseTexture;
uniform sampler2D uDetailTexture;

void main() {
  vec4 baseColor = texture2D(uBaseTexture, vTexCoord);
  vec4 detailColor = texture2D(uDetailTexture, vTexCoord * 2.0);
  gl_FragColor = baseColor * detailColor;
}
```
