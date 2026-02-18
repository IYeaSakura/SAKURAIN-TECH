/**
 * 全站音乐播放器
 * 固定在页面右下角，切换页面不会中断播放
 * 随机播放模式
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Shuffle,
} from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';
import { useIsMobile } from '@/hooks/use-mobile';

// 播放列表配置
// 将音乐文件放在 public/music/ 目录下
// 注意：路径使用 /music/ 开头，不要带 /public/ 前缀
export const PLAYLIST = [
  {
    id: '1',
    title: '诗话小镇',
    artist: 'CRITTY、潇梦临',
    src: '/music/CRITTY、潇梦临 - 诗话小镇.mp3',
    // cover: '/music/cover1.jpg', // 可选
  },
] as const;

// 获取随机索引（排除上一首，列表只有一首时除外）
const getRandomIndex = (prevIndex: number, length: number): number => {
  if (length <= 1) return 0;
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * length);
  } while (newIndex === prevIndex);
  return newIndex;
};

interface MusicPlayerProps {
  defaultOpen?: boolean;
}

export function MusicPlayer({ defaultOpen = false }: MusicPlayerProps) {
  const animationEnabled = useAnimationEnabled();
  const isMobile = useIsMobile();

  // 移动端不显示音乐播放器
  if (isMobile) return null;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef<number>(0); // 记录上一首索引

  const currentSong = PLAYLIST[currentIndex];

  // 初始化音频
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();
    const handleError = () => setError('音频加载失败');

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // 切换歌曲
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentSong.src;
      audioRef.current.load();
      setCurrentTime(0);
      setError(null);
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentIndex]);

  // 播放/暂停控制
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // 随机播放下一首（不重复上一首）
  const handleNext = useCallback(() => {
    setCurrentIndex(prev => {
      prevIndexRef.current = prev;
      return getRandomIndex(prev, PLAYLIST.length);
    });
  }, []);

  // 随机播放上一首（也是随机，不重复）
  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => {
      prevIndexRef.current = prev;
      return getRandomIndex(prev, PLAYLIST.length);
    });
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // 迷你播放器模式（收起状态）
  const MiniPlayer = () => (
    <motion.button
      onClick={() => setIsOpen(true)}
      whileHover={animationEnabled ? { scale: 1.05 } : undefined}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-md"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* 旋转的唱片动画 */}
      <motion.div
        animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
        transition={isPlaying ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        }}
      >
        <Music className="w-4 h-4 text-white" />
      </motion.div>

      <div className="flex flex-col items-start">
        <span className="text-xs font-medium max-w-[80px] truncate" style={{ color: 'var(--text-primary)' }}>
          {currentSong.title}
        </span>
        <span className="text-[10px] max-w-[80px] truncate" style={{ color: 'var(--text-muted)' }}>
          {isPlaying ? '随机播放中' : '已暂停'}
        </span>
      </div>

      {isPlaying ? (
        <Pause className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
      ) : (
        <Play className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      )}
    </motion.button>
  );

  return (
    <>
      {!isOpen ? (
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20, scale: 0.8 } : undefined}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={animationEnabled ? { opacity: 0, y: 20, scale: 0.8 } : undefined}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-[100]"
        >
          <MiniPlayer />
        </motion.div>
      ) : (
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20, scale: 0.9 } : undefined}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={animationEnabled ? { opacity: 0, y: 20, scale: 0.9 } : undefined}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-[100] w-[280px]"
        >
          <div
            className="rounded-2xl overflow-hidden backdrop-blur-xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  随机播放
                </span>
              </div>
              <motion.button
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                style={{ color: 'var(--text-muted)' }}
                title="收起播放器"
              >
                <span className="text-xs">✕</span>
              </motion.button>
            </div>

            {/* 歌曲信息 */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                {/* 封面 */}
                <motion.div
                  animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                  transition={isPlaying ? { duration: 8, repeat: Infinity, ease: 'linear' } : {}}
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 4px 15px var(--accent-glow)',
                  }}
                >
                  <Music className="w-7 h-7 text-white" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <motion.p
                    key={currentSong.title}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {currentSong.title}
                  </motion.p>
                  <motion.p
                    key={currentSong.artist}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {currentSong.artist}
                  </motion.p>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mt-2 text-xs text-red-400 text-center">{error}</div>
              )}

              {/* 进度条 */}
              <div className="mt-4">
                <div
                  ref={progressRef}
                  onClick={handleSeek}
                  className="h-1.5 rounded-full cursor-pointer overflow-hidden"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                      width: `${progressPercent}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="flex items-center justify-center gap-4 mt-3">
                <motion.button
                  onClick={handlePrev}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full transition-colors"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                  title="随机上一首"
                >
                  <SkipBack className="w-5 h-5" />
                </motion.button>

                <motion.button
                  onClick={handlePlayPause}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 4px 15px var(--accent-glow)',
                  }}
                  title={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </motion.button>

                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full transition-colors"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                  title="随机下一首"
                >
                  <SkipForward className="w-5 h-5" />
                </motion.button>
              </div>

              {/* 音量控制 */}
              <div className="flex items-center gap-2 mt-3">
                <motion.button
                  onClick={() => setIsMuted(!isMuted)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </motion.button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, var(--accent-primary) ${(isMuted ? 0 : volume) * 100}%, var(--bg-secondary) ${(isMuted ? 0 : volume) * 100}%)`,
                  }}
                />
              </div>

              {/* 随机播放提示 */}
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Shuffle className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  随机播放模式 · 共 {PLAYLIST.length} 首
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default MusicPlayer;
