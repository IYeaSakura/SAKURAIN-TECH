import { memo } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/lib/performance';

// 3D 立方体面配置
const cubeFaces = [
  { transform: 'translateZ(40px)', border: 'var(--accent-primary)' },
  { transform: 'rotateY(180deg) translateZ(40px)', border: 'var(--accent-secondary)' },
  { transform: 'rotateY(90deg) translateZ(40px)', border: 'var(--accent-tertiary)' },
  { transform: 'rotateY(-90deg) translateZ(40px)', border: 'var(--accent-primary)' },
  { transform: 'rotateX(90deg) translateZ(40px)', border: 'var(--accent-secondary)' },
  { transform: 'rotateX(-90deg) translateZ(40px)', border: 'var(--accent-tertiary)' },
];

export const LoadingPlaceholder = memo(() => {
  const isMobile = useIsMobile();
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden" 
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 背景网格 - 立体透视感 */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--accent-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.03,
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center top',
        }}
      />

      {/* 环境光晕效果 */}
      {!isMobile && (
        <>
          <div
            className="absolute top-1/4 left-1/4 -z-5 pointer-events-none"
            style={{
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
              filter: 'blur(120px)',
              opacity: 0.12,
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 -z-5 pointer-events-none"
            style={{
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
              filter: 'blur(100px)',
              opacity: 0.08,
            }}
          />
        </>
      )}

      {/* 主加载容器 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-10"
      >
        {/* 3D 旋转立方体加载器 */}
        <div 
          className="relative"
          style={{ 
            width: 80, 
            height: 80, 
            perspective: 600,
          }}
        >
          {/* 外发光环 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid var(--accent-primary)',
              opacity: 0.3,
              filter: 'blur(8px)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* 3D 立方体 */}
          <motion.div
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              width: 80,
              height: 80,
            }}
            animate={{
              rotateX: [0, 360],
              rotateY: [0, 360],
              rotateZ: [0, -360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {cubeFaces.map((face, index) => (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: face.transform,
                  backfaceVisibility: 'hidden',
                  background: `linear-gradient(135deg, var(--bg-card) 0%, rgba(var(--accent-primary-rgb, 99, 102, 241), 0.1) 100%)`,
                  border: `2px solid ${face.border}`,
                  borderRadius: '8px',
                  boxShadow: `0 0 20px ${face.border}30, inset 0 0 20px ${face.border}10`,
                  width: 80,
                  height: 80,
                }}
              >
                {/* 面内发光点 */}
                <motion.div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: face.border,
                    boxShadow: `0 0 10px ${face.border}, 0 0 20px ${face.border}`,
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.1,
                  }}
                />
              </div>
            ))}
          </motion.div>

          {/* 内层旋转环 */}
          <motion.div
            className="absolute inset-2 rounded-full"
            style={{
              border: '2px solid var(--accent-secondary)',
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* 中心脉冲核心 */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              boxShadow: `
                0 0 20px var(--accent-primary),
                0 0 40px var(--accent-primary),
                0 0 60px var(--accent-glow),
                inset 0 0 10px rgba(255,255,255,0.5)
              `,
            }}
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 20px var(--accent-primary), 0 0 40px var(--accent-primary), 0 0 60px var(--accent-glow), inset 0 0 10px rgba(255,255,255,0.5)',
                '0 0 30px var(--accent-primary), 0 0 60px var(--accent-primary), 0 0 90px var(--accent-glow), inset 0 0 15px rgba(255,255,255,0.7)',
                '0 0 20px var(--accent-primary), 0 0 40px var(--accent-primary), 0 0 60px var(--accent-glow), inset 0 0 10px rgba(255,255,255,0.5)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* 加载文字区域 */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {/* 主标题 - 立体字效果 */}
          <div className="relative">
            <motion.p
              className="text-2xl font-bold tracking-widest"
              style={{
                color: 'var(--text-primary)',
                textShadow: `
                  0 0 10px var(--accent-glow),
                  0 0 30px var(--accent-glow),
                  2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black),
                  -1px -1px 0 rgba(255,255,255,0.1)
                `,
              }}
              animate={{
                textShadow: [
                  '0 0 10px var(--accent-glow), 0 0 30px var(--accent-glow), 2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black), -1px -1px 0 rgba(255,255,255,0.1)',
                  '0 0 20px var(--accent-glow), 0 0 50px var(--accent-glow), 2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black), -1px -1px 0 rgba(255,255,255,0.2)',
                  '0 0 10px var(--accent-glow), 0 0 30px var(--accent-glow), 2px 2px 0 color-mix(in srgb, var(--bg-secondary) 50%, black), -1px -1px 0 rgba(255,255,255,0.1)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              LOADING
            </motion.p>
          </div>

          {/* 动态点状指示器 */}
          <div className="flex gap-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-3 h-3 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  boxShadow: '0 0 10px var(--accent-glow)',
                }}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 1, 0.4],
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* 进度条 - 带立体效果 */}
        <motion.div
          className="relative w-56 h-2 rounded-full overflow-hidden"
          style={{
            background: 'var(--border-subtle)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '14rem', opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* 进度条光效 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary))',
              backgroundSize: '200% 100%',
              boxShadow: '0 0 10px var(--accent-glow), 0 0 20px var(--accent-primary)',
            }}
            animate={{
              x: ['-100%', '100%'],
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              x: { duration: 2, repeat: Infinity, ease: 'linear' },
              backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
            }}
          />
          
          {/* 进度条高光 */}
          <div
            className="absolute top-0 left-0 right-0 h-px rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            }}
          />
        </motion.div>

        {/* 状态文字 */}
        <motion.p
          className="text-sm font-mono"
          style={{ color: 'var(--text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            系统初始化中...
          </motion.span>
        </motion.p>
      </motion.div>

      {/* 角落装饰 - 3D风格 */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-20 pointer-events-none">
        <div
          className="absolute top-4 left-4 w-12 h-12"
          style={{
            border: '2px solid var(--accent-primary)',
            borderRadius: '4px',
            transform: 'perspective(100px) rotateX(10deg) rotateY(-10deg)',
            boxShadow: '0 0 20px var(--accent-primary)30',
          }}
        />
        <div
          className="absolute top-6 left-6 w-12 h-12"
          style={{
            border: '1px solid var(--accent-secondary)',
            borderRadius: '4px',
            transform: 'perspective(100px) rotateX(10deg) rotateY(-10deg) translateZ(10px)',
          }}
        />
      </div>
      
      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20 pointer-events-none">
        <div
          className="absolute bottom-4 right-4 w-12 h-12"
          style={{
            border: '2px solid var(--accent-secondary)',
            borderRadius: '4px',
            transform: 'perspective(100px) rotateX(-10deg) rotateY(10deg)',
            boxShadow: '0 0 20px var(--accent-secondary)30',
          }}
        />
        <div
          className="absolute bottom-6 right-6 w-12 h-12"
          style={{
            border: '1px solid var(--accent-tertiary)',
            borderRadius: '4px',
            transform: 'perspective(100px) rotateX(-10deg) rotateY(10deg) translateZ(10px)',
          }}
        />
      </div>
    </div>
  );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';
