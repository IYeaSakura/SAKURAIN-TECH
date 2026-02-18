/**
 * 全站音乐播放器 - 洗牌播放模式
 * 固定在页面右下角，切换页面不会中断播放
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
  Loader2,
  Repeat,
} from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';
import { AudioVisualizer } from './AudioVisualizer';

// 播放列表配置
export const PLAYLIST = [
  {
    id: '1',
    title: '予你成歌',
    artist: 'IRiS七叶、叶里、佑可猫、檀烧',
    src: '/music/yunichengge.mp3',
  },
  {
    id: '2',
    title: '万古如今',
    artist: '镜予歌、袁雨桐、不馋、塔塔Anita、刘小寒、林易笙',
    src: '/music/wangurujin.mp3',
  },
  {
    id: '3',
    title: '万山载雪',
    artist: '漆柚、椒椒JMJ',
    src: '/music/wanshanzaixue.mp3',
  },
  {
    id: '4',
    title: '一路生花',
    artist: '温奕心',
    src: '/music/yilushenghua.mp3',
  },
] as const;

// Fisher-Yates 洗牌算法
const shuffleArray = (length: number): number[] => {
  const array = Array.from({ length }, (_, i) => i);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

interface MusicPlayerProps {
  defaultOpen?: boolean;
}

export function MusicPlayer({ defaultOpen = false }: MusicPlayerProps) {
  const animationEnabled = useAnimationEnabled();
  
  // 使用状态来控制是否显示，而不是直接返回 null
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>(() => shuffleArray(PLAYLIST.length));
  const [currentPosition, setCurrentPosition] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const currentIndex = shuffledOrder[currentPosition];
  const currentSong = PLAYLIST[currentIndex];
  const currentNumber = currentPosition + 1;
  const totalSongs = PLAYLIST.length;

  // 检测移动端并设置可见性
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsVisible(!isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化音频 - 只初始化一次
  useEffect(() => {
    if (!isVisible) return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => handleNext();
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setError('音频加载失败');
      setIsLoading(false);
      setIsPlaying(false);
    };
    const handleCanPlay = () => {
      setIsLoading(false);
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('progress', handleProgress);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('progress', handleProgress);
      audio.pause();
      audio.src = '';
    };
  }, [isVisible]);

  // 切换歌曲时加载音频
  useEffect(() => {
    if (!audioRef.current || !isVisible) return;

    const audio = audioRef.current;
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setBuffered(0);

    // 直接设置 src，让浏览器处理加载
    audio.src = currentSong.src;
    audio.load();

    // 如果正在播放状态，尝试播放
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Play error:', err);
          setIsPlaying(false);
          setIsLoading(false);
        });
      }
    }
  }, [currentIndex, isVisible]);

  // 处理播放/暂停
  useEffect(() => {
    if (!audioRef.current || !isVisible) return;

    const audio = audioRef.current;
    
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Play error:', err);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, isVisible]);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = useCallback(() => {
    if (error) {
      setError(null);
      // 重新加载当前歌曲
      if (audioRef.current) {
        audioRef.current.src = currentSong.src;
        audioRef.current.load();
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [error, currentSong.src]);

  // 下一首
  const handleNext = useCallback(() => {
    setCurrentPosition(prev => {
      const nextPosition = prev + 1;
      if (nextPosition >= shuffledOrder.length) {
        const newOrder = shuffleArray(PLAYLIST.length);
        setShuffledOrder(newOrder);
        return 0;
      }
      return nextPosition;
    });
  }, [shuffledOrder.length]);

  // 上一首
  const handlePrev = useCallback(() => {
    setCurrentPosition(prev => {
      if (prev <= 0) {
        return shuffledOrder.length - 1;
      }
      return prev - 1;
    });
  }, [shuffledOrder.length]);

  // 重新打乱
  const handleReshuffle = useCallback(() => {
    const newOrder = shuffleArray(PLAYLIST.length);
    setShuffledOrder(newOrder);
    setCurrentPosition(0);
    setIsPlaying(true);
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
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  // 移动端不渲染
  if (!isVisible) return null;

  return (
    <>
      {!isOpen ? (
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20, scale: 0.8 } : undefined}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-[100]"
        >
          {/* 迷你播放器 */}
          <motion.button
            onClick={() => setIsOpen(true)}
            whileHover={animationEnabled ? { scale: 1.05 } : undefined}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-md relative overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isPlaying ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              boxShadow: isPlaying ? '0 4px 20px var(--accent-glow), 0 0 30px var(--accent-glow)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* 播放时的背景光效 - 增强深色模式可见性 */}
            {isPlaying && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 50%, var(--accent-primary) 0%, transparent 60%)',
                    'radial-gradient(circle at 80% 50%, var(--accent-secondary) 0%, transparent 60%)',
                    'radial-gradient(circle at 20% 50%, var(--accent-primary) 0%, transparent 60%)',
                  ],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* 音乐图标 - 播放时有动画 */}
            <motion.div
              animate={isPlaying ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                boxShadow: isPlaying ? '0 0 15px var(--accent-glow), 0 0 30px var(--accent-primary)' : '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              <Music className="w-4 h-4 text-white" />
            </motion.div>

            <div className="flex flex-col items-start relative z-10">
              <span className="text-xs font-medium max-w-[80px] truncate" style={{ color: 'var(--text-primary)' }}>
                {currentSong.title}
              </span>
              <span className="text-[10px] max-w-[80px] truncate" style={{ color: isPlaying ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {isLoading ? '加载中...' : isPlaying ? '播放中' : `${currentNumber}/${totalSongs}`}
              </span>
            </div>

            {/* 迷你频谱指示器 - 增强发光效果 */}
            {isPlaying && !isLoading && (
              <div className="flex items-end gap-[3px] h-4 relative z-10">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full"
                    style={{ 
                      background: 'var(--accent-primary)',
                      boxShadow: '0 0 6px var(--accent-primary), 0 0 12px var(--accent-secondary)',
                    }}
                    animate={{
                      height: [4, 14, 6, 12, 4],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}

            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin relative z-10" style={{ color: 'var(--accent-primary)' }} />
            )}

            {!isPlaying && !isLoading && (
              <Pause className="w-4 h-4 relative z-10" style={{ color: 'var(--text-muted)' }} />
            )}
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20, scale: 0.9 } : undefined}
          animate={{ opacity: 1, y: 0, scale: 1 }}
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
                <Shuffle className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  洗牌播放
                </span>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={handleReshuffle}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-accent-primary/10"
                  style={{ color: 'var(--text-muted)' }}
                  title="重新打乱"
                >
                  <Repeat className="w-4 h-4" />
                </motion.button>
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
            </div>

            {/* 歌曲信息 */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
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

              {/* 音频可视化频谱 */}
              <div className="mt-3">
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mt-2 text-xs text-red-400 text-center cursor-pointer" onClick={handlePlayPause}>
                  {error}
                </div>
              )}

              {/* 进度条 */}
              <div className="mt-4">
                <div
                  ref={progressRef}
                  onClick={handleSeek}
                  className="h-1.5 rounded-full cursor-pointer overflow-hidden relative"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div
                    className="absolute top-0 left-0 h-full rounded-full opacity-30"
                    style={{
                      background: 'var(--text-muted)',
                      width: `${bufferedPercent}%`,
                    }}
                  />
                  <motion.div
                    className="h-full rounded-full relative z-10"
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
                  disabled={isLoading}
                  className="p-2 rounded-full transition-colors disabled:opacity-50"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                  title="上一首"
                >
                  <SkipBack className="w-5 h-5" />
                </motion.button>

                <motion.button
                  onClick={handlePlayPause}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading && !error}
                  className="p-3 rounded-full disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 4px 15px var(--accent-glow)',
                  }}
                >
                  {isLoading && !error ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </motion.button>

                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                  className="p-2 rounded-full transition-colors disabled:opacity-50"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                  title="下一首"
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

              {/* 播放信息 */}
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Shuffle className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  第 {currentNumber} 首 / 共 {totalSongs} 首
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
