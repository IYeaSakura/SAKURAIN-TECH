import { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { usePrefersReducedMotion } from '@/lib/performance';

// 城市数据 - 主要国际贸易城市
const CITIES = [
  { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { name: 'Shenzhen', lat: 22.5431, lon: 114.0579 },
  { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Seoul', lat: 37.5665, lon: 126.9780 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
];

// 国际贸易主要航线
const TRADE_ROUTES: Array<[number, number]> = [
  [1, 13], [3, 12], // 中国-美国
  [1, 10], [3, 9],  // 中国-欧洲
  [1, 5], [3, 5],   // 中国-东南亚
  [0, 4], [0, 6],   // 中国-日韩
  [12, 9], [13, 10], // 美国-欧洲
  [9, 8], [10, 8],  // 欧洲-中东
  [5, 16], [4, 16], // 亚太-澳洲
  [12, 15],         // 美国-南美
  [4, 12], [6, 13], // 日韩-美国
  [4, 9],           // 日韩-欧洲
  [5, 10],          // 东南亚-欧洲
  [8, 5],           // 中东-亚太
];

interface CesiumGlobeProps {
  isDark: boolean;
}

export function CesiumGlobe({ isDark }: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [beijingTime, setBeijingTime] = useState<string>('--:--');
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // 更新北京时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setBeijingTime(`${hours}:${minutes}`);
    };
    
    updateTime();
    timeIntervalRef.current = setInterval(updateTime, 1000);
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  // 创建国际贸易连线
  const createTradeLines = useCallback((viewer: Cesium.Viewer) => {
    TRADE_ROUTES.forEach(([i, j]) => {
      const city1 = CITIES[i];
      const city2 = CITIES[j];

      const start = Cesium.Cartesian3.fromDegrees(city1.lon, city1.lat, 100000);
      const end = Cesium.Cartesian3.fromDegrees(city2.lon, city2.lat, 100000);

      const mid = Cesium.Cartesian3.add(start, end, new Cesium.Cartesian3());
      Cesium.Cartesian3.multiplyByScalar(mid, 0.5, mid);
      const distance = Cesium.Cartesian3.distance(start, end);
      const height = Math.min(distance * 0.3, 2000000);
      
      const midCartographic = Cesium.Cartographic.fromCartesian(mid);
      midCartographic.height = height;
      const midPoint = Cesium.Cartesian3.fromRadians(
        midCartographic.longitude,
        midCartographic.latitude,
        midCartographic.height
      );

      const curvePoints: Cesium.Cartesian3[] = [];
      for (let t = 0; t <= 1; t += 0.05) {
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * midPoint.x + t * t * end.x;
        const y = oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * midPoint.y + t * t * end.y;
        const z = oneMinusT * oneMinusT * start.z + 2 * oneMinusT * t * midPoint.z + t * t * end.z;
        curvePoints.push(new Cesium.Cartesian3(x, y, z));
      }

      viewer.entities.add({
        polyline: {
          positions: curvePoints,
          width: 1.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.fromCssColorString('#3b82f6'),
          }),
          arcType: Cesium.ArcType.NONE,
        },
      });
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      (window as any).CESIUM_BASE_URL = '/';
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1ZDNkNy1hM2Q1LTRkYjUtODJhMC0wM2Y5YTZlOTQ2ZjUiLCJpZCI6NTYwODUsImlhdCI6MTY5NjA0MjE3OH0.MmK0RXva9E8Z7aW3F9X7v3z9z9z9z9z9z9z9z9z9z9z';

      const imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://webst{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        subdomains: ['01', '02', '03', '04'],
        maximumLevel: 18,
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
      });

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        shouldAnimate: true,
      });

      viewerRef.current = viewer;

      const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement;
      if (creditContainer) {
        creditContainer.style.display = 'none';
      }

      viewer.imageryLayers.removeAll();
      const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
      
      // 保持影像原色
      imageryLayer.alpha = 1.0;
      imageryLayer.brightness = 1.0;
      imageryLayer.contrast = 1.0;

      const scene = viewer.scene;
      scene.globe.show = true;
      // 使用较深的基色作为夜间 fallback
      scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a1628');

      scene.backgroundColor = Cesium.Color.fromCssColorString(
        isDark ? '#050505' : '#1a3a5c'
      );

      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = true;
      }

      // 配置光照 - 启用昼夜光照效果
      scene.globe.enableLighting = true;
      scene.globe.lightingFadeOutDistance = 50000000;
      scene.globe.lightingFadeInDistance = 1000000;
      scene.globe.dynamicAtmosphereLighting = true;
      scene.globe.dynamicAtmosphereLightingFromSun = true;
      
      // 增强光照对比 - 亮处更亮，暗处更暗
      scene.globe.atmosphereLightIntensity = 2.0;
      scene.globe.lightingFadeOutDistance = 100000000;
      scene.globe.lightingFadeInDistance = 100000;

      CITIES.forEach((city) => {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat, 50000),
          point: {
            pixelSize: 8,
            color: Cesium.Color.fromCssColorString('#60a5fa'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: city.name,
            font: '12px sans-serif',
            fillColor: Cesium.Color.fromCssColorString('#ffffff'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -15),
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 1.5e7, 0.5),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      });

      createTradeLines(viewer);

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(80, 30, 20000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
      });

      // 缩放限制 - 允许更大程度的放大
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000000; // 可以放大到1000km
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 40000000;
      viewer.scene.screenSpaceCameraController.enableTilt = false;

      if (!prefersReducedMotion) {
        let lastTime = Date.now();
        const rotate = () => {
          if (!viewerRef.current) return;
          const now = Date.now();
          const delta = now - lastTime;
          lastTime = now;
          
          viewer.scene.camera.rotateRight(0.00004 * delta);
          animationFrameRef.current = requestAnimationFrame(rotate);
        };
        rotate();
      }

      setTimeout(() => {
        setIsLoaded(true);
      }, 2000);

    } catch (error) {
      console.error('Cesium initialization error:', error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [isDark, prefersReducedMotion, createTradeLines]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{
          background: isDark ? '#050505' : '#1e4d6b',
        }}
      />
      
      {/* 北京时间显示 */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
        <div 
          className="px-3 py-2 rounded-lg backdrop-blur-sm text-right"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          <div 
            className="text-lg font-mono font-bold tracking-wider"
            style={{ 
              color: '#fbbf24',
              textShadow: '0 0 8px rgba(251, 191, 36, 0.3)',
            }}
          >
            {beijingTime}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            UTC+8
          </div>
        </div>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
        </div>
      )}
    </div>
  );
}

export default CesiumGlobe;
