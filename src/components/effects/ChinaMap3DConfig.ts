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

// 地球Online玩家人数数据（单位：万人）- 使用2024年真实人口数据
export const PLAYER_DATA: Record<string, { players: number; online: number }> = {
  '北京市': { players: 2183, online: 1746 },
  '天津市': { players: 1364, online: 1091 },
  '河北省': { players: 7378, online: 5902 },
  '山西省': { players: 3446, online: 2757 },
  '内蒙古自治区': { players: 2388, online: 1910 },
  '辽宁省': { players: 4155, online: 3324 },
  '吉林省': { players: 2317, online: 1854 },
  '黑龙江省': { players: 3029, online: 2423 },
  '上海市': { players: 2480, online: 1984 },
  '江苏省': { players: 8526, online: 6821 },
  '浙江省': { players: 6670, online: 5336 },
  '安徽省': { players: 6123, online: 4898 },
  '福建省': { players: 4193, online: 3354 },
  '江西省': { players: 4502, online: 3602 },
  '山东省': { players: 10080, online: 8064 },
  '河南省': { players: 9785, online: 7828 },
  '湖北省': { players: 5834, online: 4667 },
  '湖南省': { players: 6539, online: 5231 },
  '广东省': { players: 12780, online: 10224 },
  '广西壮族自治区': { players: 5013, online: 4010 },
  '海南省': { players: 1048, online: 838 },
  '重庆市': { players: 3190, online: 2552 },
  '四川省': { players: 8364, online: 6691 },
  '贵州省': { players: 3860, online: 3088 },
  '云南省': { players: 4655, online: 3724 },
  '西藏自治区': { players: 370, online: 296 },
  '陕西省': { players: 3953, online: 3162 },
  '甘肃省': { players: 2458, online: 1966 },
  '青海省': { players: 593, online: 474 },
  '宁夏回族自治区': { players: 729, online: 583 },
  '新疆维吾尔自治区': { players: 2623, online: 2098 },
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

// 数据来源信息
export const DATA_SOURCE = {
  name: '聚汇数据',
  url: 'https://population.gotohui.com/topic-4861',
  year: 2024,
  updateDate: '2025-06-10',
  note: '中国大陆地区数据，不含港澳台'
};
