import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '@/lib/performance';

// 城市数据
const CITIES = [
  { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
];

// 纹理路径配置 - 优先使用本地纹理，如果不存在则使用 CDN
const TEXTURE_PATHS = {
  // 本地纹理路径（推荐，国内访问快）
  local: {
    day: '/textures/earth-day.jpg',
    night: '/textures/earth-night.jpg',
    bump: '/textures/earth-topology.png',
  },
  // CDN 备用路径
  cdn: {
    day: 'https://gcore.jsdelivr.net/npm/three-globe@2.24.13/example/img/earth-blue-marble.jpg',
    night: 'https://gcore.jsdelivr.net/npm/three-globe@2.24.13/example/img/earth-night.jpg',
    bump: 'https://gcore.jsdelivr.net/npm/three-globe@2.24.13/example/img/earth-topology.png',
  },
};

// 将经纬度转换为3D坐标
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// 加载纹理的辅助函数
function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 8;
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}



// 地球组件
function Earth({ isHovered, isDark }: { isHovered: boolean; isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [textures, setTextures] = useState<{
    map?: THREE.Texture;
    bumpMap?: THREE.Texture;
  }>({});
  const [loading, setLoading] = useState(true);

  // 加载纹理
  useEffect(() => {
    let isMounted = true;

    const loadTextures = async () => {
      try {
        setLoading(true);

        // 确定使用哪个主题
        const textureKey = isDark ? 'night' : 'day';

        // 先尝试加载本地纹理
        let mapTexture: THREE.Texture | undefined;
        let bumpTexture: THREE.Texture | undefined;

        try {
          // 尝试本地纹理
          mapTexture = await loadTexture(TEXTURE_PATHS.local[textureKey as keyof typeof TEXTURE_PATHS.local]);
          console.log('Loaded local texture:', TEXTURE_PATHS.local[textureKey as keyof typeof TEXTURE_PATHS.local]);
        } catch (localError) {
          console.warn('Local texture not found, trying CDN...');
          try {
            // 尝试 CDN
            mapTexture = await loadTexture(TEXTURE_PATHS.cdn[textureKey as keyof typeof TEXTURE_PATHS.cdn]);
            console.log('Loaded CDN texture');
          } catch (cdnError) {
            console.warn('CDN texture also failed');
          }
        }

        // 尝试加载 bump 贴图
        try {
          bumpTexture = await loadTexture(TEXTURE_PATHS.local.bump);
        } catch {
          try {
            bumpTexture = await loadTexture(TEXTURE_PATHS.cdn.bump);
          } catch {
            // bump 贴图不是必须的
          }
        }

        if (isMounted) {
          setTextures({ map: mapTexture, bumpMap: bumpTexture });
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load textures:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTextures();

    return () => {
      isMounted = false;
    };
  }, [isDark]);

  // 自动旋转
  useFrame((_, delta) => {
    if (meshRef.current && !prefersReducedMotion) {
      const speed = isHovered ? 0.03 : 0.08;
      meshRef.current.rotation.y += delta * speed;
    }
    if (atmosphereRef.current && !prefersReducedMotion) {
      atmosphereRef.current.rotation.y += delta * 0.01;
    }
  });

  // 如果纹理未加载，显示占位
  if (loading || !textures.map) {
    return (
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={isDark ? '#1a3a5c' : '#4a7c9b'}
          wireframe={false}
        />
      </mesh>
    );
  }

  const atmosphereColor = isDark ? '#3b82f6' : '#60a5fa';

  return (
    <group>
      {/* 地球主体 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={textures.map}
          bumpMap={textures.bumpMap}
          bumpScale={0.05}
          roughness={0.6}
          metalness={0.1}
          emissive={isDark ? '#1a1a2e' : '#000000'}
          emissiveIntensity={isDark ? 0.2 : 0}
        />
      </mesh>

      {/* 大气层光晕 */}
      <mesh ref={atmosphereRef} scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={isDark ? 0.12 : 0.18}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 外层光晕 */}
      <mesh scale={[1.18, 1.18, 1.18]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={isDark ? 0.05 : 0.08}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// 城市标记点
function CityMarkers({ isDark }: { isDark: boolean }) {
  const points = useMemo(() => {
    return CITIES.map(city => {
      const position = latLonToVector3(city.lat, city.lon, 2.05);
      return { position, name: city.name };
    });
  }, []);

  const color = isDark ? '#60a5fa' : '#1d4ed8';

  return (
    <group>
      {points.map((point, index) => (
        <mesh key={index} position={point.position}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

// 发光点效果
function GlowPoints({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    return CITIES.map(city => {
      const position = latLonToVector3(city.lat, city.lon, 2.08);
      return { position, phase: Math.random() * Math.PI * 2 };
    });
  }, []);

  const color = isDark ? '#60a5fa' : '#3b82f6';

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5 + points[i].phase) * 0.3;
        mesh.scale.setScalar(scale);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {points.map((point, index) => (
        <mesh key={index} position={point.position}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// 网络连接线
function ConnectionLines({ isDark }: { isDark: boolean }) {
  const linesRef = useRef<THREE.Group>(null);

  const connections = useMemo(() => {
    const lines: { start: THREE.Vector3; end: THREE.Vector3; phase: number }[] = [];
    const connections_list = [
      [0, 2],   // 北京 - 东京
      [0, 5],   // 北京 - 伦敦
      [0, 9],   // 北京 - 纽约
      [2, 9],   // 东京 - 纽约
      [5, 9],   // 伦敦 - 纽约
      [5, 10],  // 伦敦 - 洛杉矶
      [9, 10],  // 纽约 - 洛杉矶
      [9, 11],  // 纽约 - 旧金山
    ];

    connections_list.forEach(([i, j]) => {
      const city1 = CITIES[i];
      const city2 = CITIES[j];
      const start = latLonToVector3(city1.lat, city1.lon, 2.05);
      const end = latLonToVector3(city2.lat, city2.lon, 2.05);
      lines.push({ start, end, phase: Math.random() * Math.PI * 2 });
    });

    return lines;
  }, []);

  const curves = useMemo(() => {
    return connections.map(conn => {
      const midPoint = conn.start.clone().add(conn.end).multiplyScalar(0.5);
      midPoint.normalize().multiplyScalar(2.8);
      return new THREE.QuadraticBezierCurve3(conn.start, midPoint, conn.end);
    });
  }, [connections]);

  const lineColor = isDark ? '#3b82f6' : '#2563eb';

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        const material = line.material as THREE.LineBasicMaterial;
        const opacity = 0.3 + Math.sin(state.clock.elapsedTime + connections[i].phase) * 0.15;
        material.opacity = opacity;
      });
    }
  });

  return (
    <group ref={linesRef}>
      {curves.map((curve, index) => {
        const points = curve.getPoints(30);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive key={index} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: 0.3,
          }))} />
        );
      })}
    </group>
  );
}

// 流动的数据包
function DataPackets({ isDark }: { isDark: boolean }) {
  const packetsRef = useRef<THREE.Group>(null);

  const packets = useMemo(() => {
    const items: { curve: THREE.QuadraticBezierCurve3; speed: number; offset: number }[] = [];
    const connections_list = [
      [0, 2], [0, 5], [0, 9], [2, 9], [5, 9],
    ];

    connections_list.forEach(([i, j]) => {
      const city1 = CITIES[i];
      const city2 = CITIES[j];
      const start = latLonToVector3(city1.lat, city1.lon, 2.05);
      const end = latLonToVector3(city2.lat, city2.lon, 2.05);
      const midPoint = start.clone().add(end).multiplyScalar(0.5);
      midPoint.normalize().multiplyScalar(2.8);
      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
      items.push({
        curve,
        speed: 0.15 + Math.random() * 0.15,
        offset: Math.random(),
      });
    });
    return items;
  }, []);

  const packetColor = isDark ? '#93c5fd' : '#60a5fa';

  useFrame((state) => {
    if (packetsRef.current) {
      packetsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const packet = packets[i];
        const t = ((state.clock.elapsedTime * packet.speed + packet.offset) % 1);
        const position = packet.curve.getPoint(t);
        mesh.position.copy(position);

        const material = mesh.material as THREE.MeshBasicMaterial;
        const fadeStart = 0.8;
        if (t > fadeStart) {
          material.opacity = 1 - (t - fadeStart) / (1 - fadeStart);
        } else if (t < 0.2) {
          material.opacity = t / 0.2;
        } else {
          material.opacity = 1;
        }
      });
    }
  });

  return (
    <group ref={packetsRef}>
      {packets.map((_, index) => (
        <mesh key={index}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={packetColor} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

// 场景组件
function Scene({ isHovered, isDark }: { isHovered: boolean; isDark: boolean }) {
  const { camera } = useThree();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    camera.position.z = 5;
  }, [camera]);

  return (
    <>
      <ambientLight intensity={isDark ? 0.5 : 0.8} />
      <directionalLight position={[5, 3, 5]} intensity={isDark ? 0.8 : 1.2} />

      <Stars
        radius={60}
        depth={30}
        count={200}
        factor={2}
        saturation={0}
        fade
        speed={prefersReducedMotion ? 0 : 0.2}
      />

      <Earth isHovered={isHovered} isDark={isDark} />
      <CityMarkers isDark={isDark} />
      <GlowPoints isDark={isDark} />
      <ConnectionLines isDark={isDark} />
      <DataPackets isDark={isDark} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.4}
        autoRotate={!prefersReducedMotion && !isHovered}
        autoRotateSpeed={0.2}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.8}
      />
    </>
  );
}

// 加载占位组件
function GlobeLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

// 主组件
export function Globe3D() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听主题变化
  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme !== 'light');
    };

    updateTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // 懒加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full pointer-events-auto cursor-move"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isVisible ? (
        <Canvas
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'low-power',
          }}
          dpr={1}
          frameloop="always"
          style={{ background: 'transparent' }}
        >
          <Scene isHovered={isHovered} isDark={isDark} />
        </Canvas>
      ) : (
        <GlobeLoader />
      )}
    </div>
  );
}

export default Globe3D;
