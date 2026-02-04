// ============ 中国3D地图配置文件 ============

// 颜色配置
export const COLORS = {
  bg: '#0a0f1c',           // 背景色
  mapTop: '#1e3a8a',       // 地图顶面 - 科技蓝
  mapSide: '#0d2847',      // 地图侧面 - 深色
  mapHover: '#3b82f6',     // 悬浮高亮
  mapGlow: '#00ffff',      // 荧光蓝立体块
  edge: '#00d4ff',         // 边界发光色
  edgeNormal: '#1e5a8c',   // 正常边界
  bar: '#00d4ff',          // 柱子颜色
  barTop: '#80eaff',       // 柱子顶部
  barGlow: '#00ffff',      // 柱子发光
};

// 材质配置
export const MATERIAL_CONFIG = {
  top: {
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.5,    // 玻璃透光
    thickness: 1.2,
    opacity: 0.85,
    transparent: true,
  },
  side: {
    metalness: 0.2,
    roughness: 0.6,
    opacity: 0.9,
    transparent: true,
  },
  bar: {
    metalness: 0.3,
    roughness: 0.2,
    transmission: 0.3,
    emissiveIntensity: 0.3,
  },
};

// 地图高度配置
export const MAP_HEIGHT = 1.0;  // 地图厚度

// 相机配置
export const CAMERA_CONFIG = {
  position: [0, 80, 10] as [number, number, number],
  fov: 45,
};

// 投影配置
export const PROJECTION_CONFIG = {
  centerLon: 105,
  centerLat: 36,
  scale: 1.1,
};

// 地球Online玩家人数数据（单位：万人）
export const PLAYER_DATA: Record<string, { players: number; online: number }> = {
  '北京市': { players: 2200, online: 1760 },
  '天津市': { players: 1400, online: 1120 },
  '河北省': { players: 7500, online: 6000 },
  '山西省': { players: 3500, online: 2800 },
  '内蒙古自治区': { players: 2400, online: 1920 },
  '辽宁省': { players: 4200, online: 3360 },
  '吉林省': { players: 2400, online: 1920 },
  '黑龙江省': { players: 3100, online: 2480 },
  '上海市': { players: 2500, online: 2000 },
  '江苏省': { players: 8500, online: 6800 },
  '浙江省': { players: 6500, online: 5200 },
  '安徽省': { players: 6100, online: 4880 },
  '福建省': { players: 4100, online: 3280 },
  '江西省': { players: 4500, online: 3600 },
  '山东省': { players: 10000, online: 8000 },
  '河南省': { players: 9500, online: 7600 },
  '湖北省': { players: 5800, online: 4640 },
  '湖南省': { players: 6600, online: 5280 },
  '广东省': { players: 12500, online: 10000 },
  '广西壮族自治区': { players: 5000, online: 4000 },
  '海南省': { players: 1000, online: 800 },
  '重庆市': { players: 3200, online: 2560 },
  '四川省': { players: 8300, online: 6640 },
  '贵州省': { players: 3800, online: 3040 },
  '云南省': { players: 4700, online: 3760 },
  '西藏自治区': { players: 360, online: 288 },
  '陕西省': { players: 3900, online: 3120 },
  '甘肃省': { players: 2500, online: 2000 },
  '青海省': { players: 590, online: 472 },
  '宁夏回族自治区': { players: 720, online: 576 },
  '新疆维吾尔自治区': { players: 2600, online: 2080 },
  '台湾省': { players: 2300, online: 1840 },
  '香港特别行政区': { players: 750, online: 600 },
  '澳门特别行政区': { players: 68, online: 54 },
};

// 获取数据函数
export function getPlayerData(name: string) {
  const data = PLAYER_DATA[name];
  if (data) {
    return { ...data, hasData: true };
  }
  return { players: 0, online: 0, hasData: false };
}

// 获取最大玩家数（用于柱形图归一化）
export function getMaxPlayers() {
  return Math.max(...Object.values(PLAYER_DATA).map(d => d.players));
}

// 获取国服总人数
export function getTotalChinaPlayers() {
  return Object.values(PLAYER_DATA).reduce((sum, d) => sum + d.players, 0);
}
