'use client';

/**
 * Snake — a classic pixel snake game for the terminal.
 *
 * Eat food to grow. Avoid walls and yourself. Arrow keys or WASD to steer,
 * P to pause, R to restart, Q/Escape to quit.
 */

import { useEffect, useRef, useState } from 'react';

interface SnakeGameProps {
  onExit: () => void;
}

const COLS = 24;
const ROWS = 18;
const TICK_MS = 120;

type Direction = 'up' | 'down' | 'left' | 'right';

export function SnakeGame({ onExit }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const stateRef = useRef({
    snake: [{ x: 4, y: 9 }],
    dir: 'right' as Direction,
    nextDir: 'right' as Direction,
    food: { x: 14, y: 9 },
    score: 0,
    gameOver: false,
    paused: false,
  });
  const [uiState, setUiState] = useState({ score: 0, gameOver: false, paused: false });

  const reset = () => {
    stateRef.current = {
      snake: [{ x: 4, y: 9 }],
      dir: 'right',
      nextDir: 'right',
      food: { x: 14, y: 9 },
      score: 0,
      gameOver: false,
      paused: false,
    };
    setUiState({ score: 0, gameOver: false, paused: false });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellW = canvas.width / COLS;
    const cellH = canvas.height / ROWS;

    const drawPixel = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x * cellW), Math.floor(y * cellH), Math.ceil(cellW), Math.ceil(cellH));
    };

    const placeFood = () => {
      const { snake } = stateRef.current;
      let pos = { x: 0, y: 0 };
      do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
      stateRef.current.food = pos;
    };

    const tick = () => {
      const state = stateRef.current;
      if (state.gameOver || state.paused) return;

      state.dir = state.nextDir;
      const head = state.snake[0];
      const next = { x: head.x, y: head.y };
      if (state.dir === 'up') next.y -= 1;
      if (state.dir === 'down') next.y += 1;
      if (state.dir === 'left') next.x -= 1;
      if (state.dir === 'right') next.x += 1;

      if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS || state.snake.some((s) => s.x === next.x && s.y === next.y)) {
        state.gameOver = true;
        setUiState((prev) => ({ ...prev, gameOver: true }));
        return;
      }

      state.snake.unshift(next);
      if (next.x === state.food.x && next.y === state.food.y) {
        state.score += 10;
        setUiState((prev) => ({ ...prev, score: state.score }));
        placeFood();
      } else {
        state.snake.pop();
      }
    };

    const draw = () => {
      ctx.fillStyle = 'var(--bg-secondary)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const state = stateRef.current;
      state.snake.forEach((seg, i) => drawPixel(seg.x, seg.y, i === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)'));
      drawPixel(state.food.x, state.food.y, 'var(--error, #ff5f56)');

      if (state.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 8);
        ctx.font = '12px monospace';
        ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 12);
      } else if (state.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      }
    };

    const loop = (time: number) => {
      if (time - lastTickRef.current >= TICK_MS) {
        tick();
        lastTickRef.current = time;
      }
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Escape') {
        onExit();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        reset();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        stateRef.current.paused = !stateRef.current.paused;
        setUiState((prev) => ({ ...prev, paused: stateRef.current.paused }));
        return;
      }

      const state = stateRef.current;
      if (state.gameOver) return;

      const opposites: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
      let next: Direction | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') next = 'up';
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') next = 'down';
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') next = 'left';
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') next = 'right';
      if (next && opposites[next] !== state.dir) {
        state.nextDir = next;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit]);

  return (
    <div className="flex flex-col items-center gap-3 h-full">
      <div className="flex items-center justify-between w-full max-w-xl text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Score: <span style={{ color: 'var(--accent-primary)' }}>{uiState.score}</span></span>
        <span>Arrows/WASD · P pause · R restart · Q quit</span>
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={360}
        className="border-2"
        style={{ borderColor: 'var(--border-subtle)', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
