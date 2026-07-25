'use client';

/**
 * Breakout — terminal pixel brick breaker.
 *
 * Arrow keys or A/D move the paddle. Bounce the ball into all bricks.
 * P pauses, R restarts, Q/Escape quits.
 */

import { useEffect, useRef, useState } from 'react';

interface BreakoutGameProps {
  onExit: () => void;
}

const WIDTH = 480;
const HEIGHT = 360;
const PADDLE_W = 72;
const PADDLE_H = 8;
const BALL = 8;
const COLS = 8;
const ROWS = 5;
const BRICK_W = WIDTH / COLS;
const BRICK_H = 22;

export function BreakoutGame({ onExit }: BreakoutGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const stateRef = useRef({
    paddleX: WIDTH / 2 - PADDLE_W / 2,
    ball: { x: WIDTH / 2, y: HEIGHT - 40, vx: 3, vy: -3 },
    bricks: [] as boolean[][],
    score: 0,
    lives: 3,
    paused: false,
    gameOver: false,
    keys: { left: false, right: false },
  });
  const [uiState, setUiState] = useState({ score: 0, lives: 3, gameOver: false });

  const buildBricks = () => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => true));

  const reset = () => {
    stateRef.current = {
      paddleX: WIDTH / 2 - PADDLE_W / 2,
      ball: { x: WIDTH / 2, y: HEIGHT - 40, vx: 3, vy: -3 },
      bricks: buildBricks(),
      score: 0,
      lives: 3,
      paused: false,
      gameOver: false,
      keys: { left: false, right: false },
    };
    setUiState({ score: 0, lives: 3, gameOver: false });
  };

  useEffect(() => {
    reset();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['var(--accent-primary)', 'var(--accent-secondary)', 'var(--text-muted)', 'var(--error, #ff5f56)', 'var(--warning, #ffbd2e)'];

    const loop = () => {
      const state = stateRef.current;
      ctx.fillStyle = 'var(--bg-secondary)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (!state.paused && !state.gameOver) {
        if (state.keys.left) state.paddleX -= 6;
        if (state.keys.right) state.paddleX += 6;
        state.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_W, state.paddleX));

        state.ball.x += state.ball.vx;
        state.ball.y += state.ball.vy;

        if (state.ball.x <= 0 || state.ball.x >= WIDTH - BALL) state.ball.vx *= -1;
        if (state.ball.y <= 0) state.ball.vy *= -1;

        if (
          state.ball.y + BALL >= HEIGHT - PADDLE_H - 8 &&
          state.ball.y <= HEIGHT - 8 &&
          state.ball.x + BALL >= state.paddleX &&
          state.ball.x <= state.paddleX + PADDLE_W &&
          state.ball.vy > 0
        ) {
          state.ball.vy *= -1;
          state.ball.vx += (state.ball.x - (state.paddleX + PADDLE_W / 2)) * 0.05;
        }

        if (state.ball.y > HEIGHT) {
          state.lives -= 1;
          if (state.lives <= 0) {
            state.gameOver = true;
          } else {
            state.ball = { x: WIDTH / 2, y: HEIGHT - 40, vx: 3, vy: -3 };
            state.paddleX = WIDTH / 2 - PADDLE_W / 2;
          }
        }

        // Brick collisions
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (!state.bricks[r]?.[c]) continue;
            const bx = c * BRICK_W;
            const by = 40 + r * BRICK_H;
            if (
              state.ball.x + BALL >= bx &&
              state.ball.x <= bx + BRICK_W &&
              state.ball.y + BALL >= by &&
              state.ball.y <= by + BRICK_H
            ) {
              state.bricks[r][c] = false;
              state.score += 10;
              state.ball.vy *= -1;
            }
          }
        }

        if (state.bricks.every((row) => row.every((b) => !b))) {
          state.gameOver = true;
        }
      }

      // Draw bricks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!state.bricks[r]?.[c]) continue;
          ctx.fillStyle = colors[r % colors.length];
          ctx.fillRect(c * BRICK_W + 2, 40 + r * BRICK_H + 2, BRICK_W - 4, BRICK_H - 4);
        }
      }

      // Draw paddle
      ctx.fillStyle = 'var(--text-primary)';
      ctx.fillRect(state.paddleX, HEIGHT - PADDLE_H - 8, PADDLE_W, PADDLE_H);

      // Draw ball
      ctx.fillStyle = 'var(--accent-primary)';
      ctx.fillRect(state.ball.x, state.ball.y, BALL, BALL);

      // HUD
      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${state.score}  Lives: ${state.lives}`, 8, 20);

      if (state.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        const won = state.lives > 0;
        ctx.fillText(won ? 'CLEARED!' : 'GAME OVER', WIDTH / 2, HEIGHT / 2 - 8);
        ctx.font = '12px monospace';
        ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 14);
      } else if (state.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2);
      }

      setUiState({ score: state.score, lives: state.lives, gameOver: state.gameOver });
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Escape') onExit();
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'p' || e.key === 'P') stateRef.current.paused = !stateRef.current.paused;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.keys.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onExit]);

  return (
    <div className="flex flex-col items-center gap-3 h-full">
      <div className="flex items-center justify-between w-full max-w-xl text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Score: <span style={{ color: 'var(--accent-primary)' }}>{uiState.score}</span></span>
        <span>Lives: <span style={{ color: 'var(--accent-primary)' }}>{uiState.lives}</span></span>
        <span>Arrows/AD · P pause · R restart · Q quit</span>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="border-2"
        style={{ borderColor: 'var(--border-subtle)', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
