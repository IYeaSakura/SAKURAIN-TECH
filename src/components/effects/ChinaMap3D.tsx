import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Line } from '@react-three/drei';
import {
  COLORS,
  MAP_HEIGHT,
  CAMERA_CONFIG,
  PROJECTION_CONFIG,
  getPlayerData,
  getMaxPlayers,
  getTotalChinaPlayers
} from './ChinaMap3DConfig';

// ============ 类型定义 ============
interface MapData {
  type: string;
  features: Feature[];
}

interface Feature {
  type: string;
  properties: {
    name: string;
    adcode: string | number;
    level: string;
    centroid?: number[];
    center?: number[];
  };
  geometry: {
    type: string;
    coordinates: number[][][][] | number[][][];
  };
}

interface RegionData {
  name: string;
  adcode: string | number;
  level: string;
  center?: number[];
}

// ============ 常量 ============
const DATAV_GEO_URL = '/map-data';

// ============ 工具函数 ============
function project(lon: number, lat: number): [number, number] {
  const { centerLon, centerLat, scale } = PROJECTION_CONFIG;
  const x = (lon - centerLon) * scale;
  const y = (lat - centerLat) * scale;
  // Y轴取反使地图方向正确（北在上）
  return [x, -y];
}

// 计算多边形几何中心（用于柱形图定位）
function calculatePolygonCenter(feature: Feature): { x: number; y: number } | null {
  const coords = feature.geometry.coordinates;
  const geoType = feature.geometry.type;
  const isMultiPolygon = geoType === 'MultiPolygon';
  const polygons = isMultiPolygon
    ? coords as number[][][][]
    : [coords as number[][][]];

  let sumX = 0, sumY = 0, count = 0;

  polygons.forEach(polygon => {
    const rings = Array.isArray(polygon[0][0]) ? polygon : [polygon];
    const outerRing = rings[0] as number[][];
    
    outerRing.forEach(point => {
      const [x, y] = project(point[0], point[1]);
      sumX += x;
      sumY += y;
      count++;
    });
  });

  if (count === 0) return null;
  return { x: sumX / count, y: sumY / count };
}

// 根据数据获取填充颜色
function getRegionColor(name: string, isHovered: boolean, isDrilledDown: boolean = false): string {
  if (isHovered) return COLORS.mapHover;

  const data = getPlayerData(name);
  const maxPlayers = getMaxPlayers();
  const ratio = data.players / maxPlayers;

  // 下钻后使用紫色系，中国地图使用蓝色系
  if (isDrilledDown) {
    // 紫色系 - 下钻后的地市
    if (ratio > 0.8) return '#6b21a8'; // 深紫
    if (ratio > 0.6) return '#7c3aed'; // 紫色
    if (ratio > 0.4) return '#8b5cf6'; // 中紫
    if (ratio > 0.2) return '#a78bfa'; // 浅紫
    return '#c4b5fd'; // 很浅紫
  } else {
    // 蓝色系 - 中国地图的省份
    if (ratio > 0.8) return '#1e40af'; // 深蓝
    if (ratio > 0.6) return '#2563eb'; // 蓝色
    if (ratio > 0.4) return '#3b82f6'; // 中蓝
    if (ratio > 0.2) return '#60a5fa'; // 浅蓝
    return '#93c5fd'; // 很浅蓝
  }
}

// 计算地图包围盒并返回适配的相机参数
function calculateCameraFit(features: Feature[], canvasWidth: number, canvasHeight: number, drillLevel: number = 0) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  features.forEach(f => {
    const coords = f.geometry.coordinates;
    const geoType = f.geometry.type;
    // 根据几何类型判断是否为 MultiPolygon
    const isMultiPolygon = geoType === 'MultiPolygon';
    const polygons = isMultiPolygon
      ? coords as unknown as number[][][]
      : [coords as unknown as number[][]];

    polygons.forEach(poly => {
      const rings = Array.isArray(poly[0][0]) ? poly : [poly];
      rings.forEach(ring => {
        (ring as number[][]).forEach(p => {
          const [x, y] = project(p[0], p[1]);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        });
      });
    });
  });

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const width = maxX - minX;
  const height = maxY - minY;

  // 计算合适的相机高度 - 使用正交投影风格的俯瞰视角
  const aspect = canvasWidth / canvasHeight;
  const fov = CAMERA_CONFIG.fov * (Math.PI / 180);
  const distanceHeight = (height / 2) / Math.tan(fov / 2);
  const distanceWidth = (width / 2) / Math.tan(fov / 2) / aspect;
  
  // 根据下钻级别调整缩放比例
  // drillLevel: 0=国家级, 1=省级, 2=地市级
  const zoomFactors = [1.1, 1.0, 0.6];
  const zoomFactor = zoomFactors[Math.min(drillLevel, zoomFactors.length - 1)];
  const distance = Math.max(distanceHeight, distanceWidth) * zoomFactor;

  // 二维平面俯瞰视角
  const pitchAngle = 85;
  const polarAngle = (90 - pitchAngle) * (Math.PI / 180);

  return {
    centerX,
    centerY,
    width,
    height,
    // 相机位置：接近正上方，地图已居中到原点，所以相机也基于原点
    cameraPosition: [
      0,
      distance * Math.cos(polarAngle),
      0
    ] as [number, number, number],
    // 地图已通过 bbox 居中到原点，所以 target 是 [0, 0, 0]
    target: [0, 0, 0] as [number, number, number],
  };
}

function calculateBBox(features: Feature[]) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  features.forEach(f => {
    const coords = f.geometry.coordinates;
    const geoType = f.geometry.type;
    // 根据几何类型判断是否为 MultiPolygon
    const isMultiPolygon = geoType === 'MultiPolygon';
    const polygons = isMultiPolygon
      ? coords as unknown as number[][][]
      : [coords as unknown as number[][]];

    polygons.forEach(poly => {
      const rings = Array.isArray(poly[0][0]) ? poly : [poly];
      rings.forEach(ring => {
        (ring as number[][]).forEach(p => {
          const [x, y] = project(p[0], p[1]);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        });
      });
    });
  });

  return { centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
}

// ============ 地图数据 Hook ============
function useMapData(adcode: string | number = '100000') {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${DATAV_GEO_URL}/${adcode}_full.json`)
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.json();
      })
      .then(data => {
        if (!cancelled) {
          setMapData(data);
          setLoading(false);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [adcode]);

  return { mapData, loading, error };
}

// ============ 组件：地图区域（二维平面填充） ============
function MapRegion({
  feature,
  bbox,
  isHovered,
  onHover,
  onClick,
  isDrilledDown
}: {
  feature: Feature;
  bbox: { centerX: number; centerY: number };
  isHovered: boolean;
  onHover: (name: string | null) => void;
  onClick: (data: RegionData) => void;
  isDrilledDown: boolean;
}) {
  const { name, adcode, level, center } = feature.properties;

  // 创建平面填充形状和边界线
  const { fillGeometries, lineGeometries } = useMemo(() => {
    const coords = feature.geometry.coordinates;
    const geoType = feature.geometry.type;

    // 根据几何类型判断是否为 MultiPolygon
    const isMultiPolygon = geoType === 'MultiPolygon';
    const polygons: number[][][][] = isMultiPolygon
      ? coords as number[][][][]
      : [coords as number[][][]];

    const fillGeos: THREE.BufferGeometry[] = [];
    const lines: { geometry: THREE.BufferGeometry; isClosed: boolean; points?: [number, number, number][] }[] = [];

    polygons.forEach((polygon) => {
      const shape = new THREE.Shape();
      const rings = Array.isArray(polygon[0][0]) ? polygon : [polygon];
      let isFirstRing = true;

      rings.forEach((ring) => {
        const points = ring as number[][];
        const projectedPoints: [number, number][] = [];

        points.forEach((point) => {
          const [x, y] = project(point[0], point[1]);
          projectedPoints.push([x - bbox.centerX, -(y - bbox.centerY)]);
        });

        if (isFirstRing) {
          // 外轮廓 - 用于填充
          projectedPoints.forEach((p, i) => {
            if (i === 0) shape.moveTo(p[0], p[1]);
            else shape.lineTo(p[0], p[1]);
          });
          if (projectedPoints.length > 0) {
            shape.lineTo(projectedPoints[0][0], projectedPoints[0][1]);
          }
          isFirstRing = false;

          // 边界线
          const linePositions: number[] = [];
          const linePoints: [number, number, number][] = [];
          projectedPoints.forEach((p) => {
            const z = -p[1];
            linePositions.push(p[0], 0.01, z);
            linePoints.push([p[0], 0.01, z]);
          });
          if (linePositions.length >= 6) {
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            // 检查首尾点是否相同，判断是否闭合
            const firstPoint = projectedPoints[0];
            const lastPoint = projectedPoints[projectedPoints.length - 1];
            const isClosed = Math.abs(firstPoint[0] - lastPoint[0]) < 0.0001 && 
                            Math.abs(firstPoint[1] - lastPoint[1]) < 0.0001;
            lines.push({ geometry: lineGeo, isClosed, points: linePoints });
          }
        } else {
          // 孔洞
          const holePath = new THREE.Path();
          projectedPoints.forEach((p, i) => {
            if (i === 0) holePath.moveTo(p[0], p[1]);
            else holePath.lineTo(p[0], p[1]);
          });
          if (projectedPoints.length > 0) {
            holePath.lineTo(projectedPoints[0][0], projectedPoints[0][1]);
          }
          shape.holes.push(holePath);
        }
      });

      // 为每个 polygon 创建独立的填充几何体
      const geo = new THREE.ShapeGeometry(shape, 12);
      geo.rotateX(-Math.PI / 2);
      fillGeos.push(geo);
    });

    return { fillGeometries: fillGeos, lineGeometries: lines };
  }, [feature, bbox]);

  const handleClick = useCallback(() => {
    onClick({ name, adcode, level, center });
  }, [onClick, name, adcode, level, center]);

  const handlePointerOver = useCallback(() => {
    onHover(name);
  }, [onHover, name]);

  const handlePointerOut = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const fillColor = getRegionColor(name, isHovered, isDrilledDown);

  return (
    <group>
      {/* 平面填充 - 每个独立的 polygon 都有独立的 mesh */}
      {fillGeometries.map((geo, idx) => (
        <mesh 
          key={`fill-${idx}`} 
          geometry={geo} 
          position={[0, 0, 0]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <meshBasicMaterial
            color={fillColor}
            side={THREE.DoubleSide}
            transparent
            opacity={isHovered ? 0.9 : 0.7}
          />
        </mesh>
      ))}

      {/* 边界线 */}
      {lineGeometries.map((item, idx) => (
        item.isClosed ? (
          <lineLoop key={`line-${idx}`} geometry={item.geometry}>
            <lineBasicMaterial
              color={isHovered ? COLORS.edge : '#1e3a5a'}
              linewidth={isHovered ? 2 : 1}
              transparent
              opacity={isHovered ? 1 : 0.8}
            />
          </lineLoop>
        ) : (
          <Line
            key={`line-${idx}`}
            points={item.points || []}
            color={isHovered ? COLORS.edge : '#1e3a5a'}
            lineWidth={isHovered ? 2 : 1}
            transparent
            opacity={isHovered ? 1 : 0.8}
          />
        )
      ))}
    </group>
  );
}

// ============ 组件：行政中心数据柱 ============
function DataBar({
  feature,
  bbox,
  isHovered
}: {
  feature: Feature;
  bbox: { centerX: number; centerY: number };
  isHovered: boolean;
}) {
  const { name } = feature.properties;

  const data = getPlayerData(name);
  const maxPlayers = getMaxPlayers();
  const height = Math.max(0.5, (data.players / maxPlayers) * 12);

  const center = calculatePolygonCenter(feature);
  if (!center) return null;

  const x = center.x - bbox.centerX;
  const z = center.y - bbox.centerY;

  const beamWidth = 0.08;
  const beamColor = isHovered ? '#00ffff' : '#00d4ff';

  return (
    <group position={[x, MAP_HEIGHT, z]}>
      {/* 激光柱核心 */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[beamWidth, height, beamWidth]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={isHovered ? 0.9 : 0.7}
        />
      </mesh>

      {/* 激光柱外发光 */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[beamWidth * 2, height, beamWidth * 2]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={isHovered ? 0.3 : 0.15}
        />
      </mesh>

      {/* 激光柱顶部光束 */}
      {[0, 0.5, 1].map((offset) => (
        <mesh key={offset} position={[0, height + offset, 0]}>
          <cylinderGeometry args={[beamWidth * 0.5, beamWidth * 0.3, 1, 8]} />
          <meshBasicMaterial
            color={beamColor}
            transparent
            opacity={isHovered ? 0.5 - offset * 0.3 : 0.3 - offset * 0.2}
          />
        </mesh>
      ))}

      {/* 底部光环 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.6, 32]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={isHovered ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 底部内圈 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.25, 32]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={isHovered ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ============ 组件：悬浮信息面板（纯UI组件） ============
function HoverInfo({
  feature,
  visible
}: {
  feature: Feature | null;
  visible: boolean;
}) {
  if (!visible || !feature) return null;

  const { name } = feature.properties;
  const data = getPlayerData(name);

  return (
    <div className="min-w-[200px] px-5 py-4 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/30">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-cyan-400/30">
        <div className="w-2 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-400/50" />
        <div className="flex-1">
          <div className="text-cyan-300 font-bold text-lg tracking-wide">{name}</div>
          <div className="text-cyan-500/60 text-xs mt-0.5">区域信息</div>
        </div>
      </div>
      {data.hasData ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">玩家人数</span>
            <span className="text-cyan-400 font-mono font-bold text-base">{(data.players / 10000).toFixed(2)} <span className="text-xs text-cyan-500/70">亿</span></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">在线人数</span>
            <span className="text-emerald-400 font-mono font-bold text-base">{data.online} <span className="text-xs text-emerald-500/70">万</span></span>
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <span className="text-slate-400 text-sm">仅供演示，暂无数据</span>
        </div>
      )}
    </div>
  );
}

// ============ 组件：主场景 ============
function MapScene({
  mapData,
  onRegionClick,
  hoveredRegion,
  onHover,
  canvasSize,
  isDrilledDown,
  drillLevel,
}: {
  mapData: MapData;
  onRegionClick: (data: RegionData) => void;
  hoveredRegion: string | null;
  onHover: (name: string | null) => void;
  canvasSize: { width: number; height: number };
  isDrilledDown: boolean;
  drillLevel: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const bbox = useMemo(() => calculateBBox(mapData.features), [mapData]);

  // 计算相机适配参数
  const cameraFit = useMemo(() => {
    return calculateCameraFit(mapData.features, canvasSize.width, canvasSize.height, drillLevel);
  }, [mapData, canvasSize, drillLevel]);

  // 右键单击复位功能
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isRightClickRef = useRef(false);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 2) {
      isRightClickRef.current = true;
      mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
    }
  }, []);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (event.button === 2 && isRightClickRef.current && mouseDownPosRef.current) {
      const dx = Math.abs(event.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(event.clientY - mouseDownPosRef.current.y);
      
      // 如果移动距离小于 5 像素，视为单击
      if (dx < 5 && dy < 5) {
        const [x, y, z] = cameraFit.cameraPosition;
        const [tx, ty, tz] = cameraFit.target;
        
        const startPos = camera.position.clone();
        const targetPos = new THREE.Vector3(x, y, z);
        const startTarget = controlsRef.current?.target.clone() || new THREE.Vector3(0, 0, 0);
        const endTarget = new THREE.Vector3(tx, ty, tz);
        
        let progress = 0;
        const duration = 500;
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          camera.position.lerpVectors(startPos, targetPos, easeProgress);
          
          if (controlsRef.current) {
            const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, easeProgress);
            controlsRef.current.target.copy(currentTarget);
            controlsRef.current.update();
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    }
    
    isRightClickRef.current = false;
    mouseDownPosRef.current = null;
  }, [camera, cameraFit]);

  // 添加鼠标事件监听
  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseUp]);

  // 自动适配相机位置 - 当 mapData 变化时（如下钻）重新调整视角
  useEffect(() => {
    const [x, y, z] = cameraFit.cameraPosition;
    const [tx, ty, tz] = cameraFit.target;

    // 使用 GSAP 风格的平滑动画过渡
    const startPos = camera.position.clone();
    const targetPos = new THREE.Vector3(x, y, z);
    const startTarget = controlsRef.current?.target.clone() || new THREE.Vector3(0, 0, 0);
    const endTarget = new THREE.Vector3(tx, ty, tz);

    let progress = 0;
    const duration = 800; // 动画持续时间 ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);

      // 使用 easeOutCubic 缓动
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPos, targetPos, easeProgress);

      if (controlsRef.current) {
        const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, easeProgress);
        controlsRef.current.target.copy(currentTarget);
        controlsRef.current.update();
      } else {
        camera.lookAt(endTarget);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 动画完成后，确保相机和控制器最终状态正确
        camera.position.copy(targetPos);
        if (controlsRef.current) {
          controlsRef.current.target.copy(endTarget);
          controlsRef.current.update();
        }
      }
    };

    animate();
  }, [camera, cameraFit]);  // cameraFit 已包含 mapData 变化的信息

  return (
    <>
      <color attach="background" args={[COLORS.bg]} />

      {/* 灯光 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#3b82f6" />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#00d4ff" />

      {/* 简化网格地面 */}
      <gridHelper args={[80, 16, '#1e3a5f', '#0f172a']} position={[0, -0.1, 0]} />

      {/* 地图区域 */}
      <group>
        {mapData.features.map((feature, index) => (
          <MapRegion
            key={`${feature.properties.adcode}-${index}`}
            feature={feature}
            bbox={bbox}
            isHovered={hoveredRegion === feature.properties.name}
            onHover={onHover}
            onClick={onRegionClick}
            isDrilledDown={isDrilledDown}
          />
        ))}
      </group>

      {/* 数据柱 - 只在国家级地图显示 */}
      {!isDrilledDown && (
        <group>
          {mapData.features.map((feature, index) => (
            <DataBar
              key={`bar-${feature.properties.adcode}-${index}`}
              feature={feature}
              bbox={bbox}
              isHovered={hoveredRegion === feature.properties.name}
            />
          ))}
        </group>
      )}

      {/* 相机控制器 - 只允许平移和缩放，禁止旋转 */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={false}
        minDistance={10}
        maxDistance={300}
        minPolarAngle={0}
        maxPolarAngle={0}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
        enableDamping={false}
        minAzimuthAngle={0}
        maxAzimuthAngle={0}
      />
    </>
  );
}

// ============ UI 组件 ============
function Loader() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full" />
          <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin" />
        </div>
        <span className="text-sm text-cyan-400 tracking-wider">加载地图数据...</span>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-red-500/30 bg-slate-900/80">
        <span className="text-red-400 text-sm">{message}</span>
        <button
          onClick={onRetry}
          className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm transition-colors"
        >
          重新加载
        </button>
      </div>
    </div>
  );
}

function Breadcrumb({
  stack,
  onBack,
  currentName
}: {
  stack: RegionData[];
  onBack: (index: number) => void;
  currentName: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl backdrop-blur-md border border-cyan-500/30 bg-slate-900/60">
      {stack.length === 0 ? (
        <span className="text-cyan-400 font-semibold">中国</span>
      ) : (
        <>
          <button
            onClick={() => onBack(-1)}
            className="text-slate-400 hover:text-cyan-400 transition-colors"
          >
            中国
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-400 font-semibold">{currentName}</span>
        </>
      )}
    </div>
  );
}

// ============ 主组件 ============
export function ChinaMap3D({ isDark }: { isDark: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentAdcode, setCurrentAdcode] = useState<string | number>('100000');
  const [regionStack, setRegionStack] = useState<RegionData[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { mapData, loading, error } = useMapData(currentAdcode);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };

    updateSize();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const handleRegionClick = useCallback((regionData: RegionData) => {
    setRegionStack(prev => {
      if (prev.length < 2) {
        setCurrentAdcode(regionData.adcode);
        return [...prev, regionData];
      }
      return prev;
    });
  }, []);

  const handleBack = useCallback(() => {
    if (regionStack.length > 1) {
      const newStack = regionStack.slice(0, regionStack.length - 1);
      setRegionStack(newStack);
      setCurrentAdcode(newStack[newStack.length - 1].adcode);
    } else {
      setRegionStack([]);
      setCurrentAdcode('100000');
    }
  }, [regionStack]);

  const currentName = regionStack.length > 0
    ? regionStack[regionStack.length - 1].name
    : '中国';

  const hoveredFeature = useMemo(() => {
    if (!hoveredRegion || !mapData) return null;
    return mapData.features.find(f => f.properties.name === hoveredRegion) || null;
  }, [hoveredRegion, mapData]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* 头部导航 */}
      <div className="absolute top-4 left-4 z-10">
        <Breadcrumb stack={regionStack} onBack={handleBack} currentName={currentName} />
      </div>

      {/* 返回按钮 */}
      {regionStack.length > 0 && (
        <button
          onClick={handleBack}
          className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl border border-cyan-500/30 bg-slate-900/60 backdrop-blur-md text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all flex items-center gap-2"
        >
          <span>←</span>
          <span>返回上级</span>
        </button>
      )}

      {/* 悬浮信息面板 - 始终显示在右上角 */}
      <div className="absolute top-4 right-4 z-10">
        <HoverInfo
          feature={hoveredFeature}
          visible={!!hoveredRegion}
        />
      </div>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 z-10 p-4 rounded-xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-md">
        <div className="text-xs text-cyan-300 mb-2 font-medium">地球Online在线人数</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-cyan-400 shadow shadow-cyan-400/50" />
            <span className="text-xs text-slate-300">国服总人数: <span className="text-cyan-400 font-mono font-bold">{(getTotalChinaPlayers() / 10000).toFixed(2)}</span> 亿</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-purple-400 shadow shadow-purple-400/50" />
            <span className="text-xs text-slate-300">当前区域: <span className="text-purple-400 font-mono font-bold">{currentName}</span></span>
          </div>
        </div>
      </div>

      {/* 提示 - 只在地球页面显示 */}
      {regionStack.length === 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <span className="text-xs px-4 py-2 rounded-full border border-cyan-500/20 bg-slate-900/60 backdrop-blur-md text-slate-400">
            点击省份下钻 · 悬停查看详情
          </span>
        </div>
      )}

      {/* 调试信息 - 显示当前悬浮的区域 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <span className="text-xs px-4 py-2 rounded-full border border-yellow-500/30 bg-slate-900/80 backdrop-blur-md text-yellow-400">
          悬浮区域: <span className="font-bold">{hoveredRegion || '无'}</span>
        </span>
      </div>

      {isVisible ? (
        loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setCurrentAdcode(prev => prev)} />
        ) : mapData ? (
          <Canvas
            camera={{
              position: CAMERA_CONFIG.position,
              fov: CAMERA_CONFIG.fov,
            }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 1.5]}
            style={{ background: isDark ? COLORS.bg : '#1a3a5c' }}
          >
            <MapScene
              mapData={mapData}
              onRegionClick={handleRegionClick}
              hoveredRegion={hoveredRegion}
              onHover={setHoveredRegion}
              canvasSize={canvasSize}
              isDrilledDown={regionStack.length > 0}
              drillLevel={regionStack.length}
            />
          </Canvas>
        ) : null
      ) : (
        <Loader />
      )}
    </div>
  );
}

export default ChinaMap3D;
