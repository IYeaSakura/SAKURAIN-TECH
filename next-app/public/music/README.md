# 音乐文件存放目录

将音乐文件放在此目录下，然后在 `src/components/MusicPlayer/index.tsx` 中配置播放列表。

## 使用方法

1. 将 `.mp3` 音乐文件复制到此目录
2. 编辑 `src/components/MusicPlayer/index.tsx` 中的 `PLAYLIST` 数组
3. 修改歌曲信息（标题、艺术家、文件名）

## 示例配置

```typescript
export const PLAYLIST = [
  {
    id: '1',
    title: '你的歌曲名',
    artist: '艺术家名',
    src: '/music/your-song.mp3',  // 放在此目录下的文件
    cover: '/music/your-cover.jpg', // 可选：封面图片
  },
  // ... 更多歌曲
];
```

## 注意事项

- 支持的格式：MP3、WAV、OGG 等浏览器支持的音频格式
- 建议文件名使用英文，避免中文乱码问题
- 封面图片建议使用正方形，尺寸 300x300 或更大
- 音乐文件会自动被复制到构建输出中
