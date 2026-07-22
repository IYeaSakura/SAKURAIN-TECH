// 像素风格切角边框 - 用于创建 8-bit 风格的 clip-path
export const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// 渐变文字样式 - 统一使用蓝绿配色
export const gradientTextStyle = {
  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} as const;

// 像素边框样式
export const pixelBorderStyle = (isHovered = false, radius = 8) => ({
  background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
  border: `2px solid ${isHovered ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
  clipPath: clipPathRounded(radius),
});

// 像素卡片悬停样式
export const pixelCardHoverStyle = {
  transform: 'translateY(-4px)',
  transition: 'all 0.3s ease',
};
