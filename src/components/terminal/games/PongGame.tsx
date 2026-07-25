'use client';

/**
 * Pong — terminal pixel tennis against a simple AI.
 *
 * Arrow Up/Down or W/S move your paddle. First to 5 wins.
 * P pauses, R restarts, Q/Escape quits.
 */

import { useEffect, useRef, useState } from 'react';

interface PongGameProps {
  onExit: () => void;
}

const WIDTH = 480;
const HEIGHT = 320;
const PADDLE_H = 64;
const PADDLE_W = 10;
const BALL = 8;
const WIN_SCORE = 5;

export function PongGame({ onExit }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const stateRef = useRef({
    playerY: HEIGHT / 2 - PADDLE_H / 2,
    aiY: HEIGHT / 2 - PADDLE_H / 2,
    ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: 3, vy: 2 },
    playerScore: 0,
    aiScore: 0,
    paused: false,
    gameOver: false,
    keys: { up: false, down: false },
  });
  const [uiState, setUiState] = useState({ player: 0, ai: 0, gameOver: false });

  const reset = (full = false) => {
    const state = stateRef.current;
    state.playerY = HEIGHT / 2 - PADDLE_H / 2;
    state.aiY = HEIGHT / 2 - PADDLE_H / 2;
    state.ball = { x: WIDTH / 2, y: HEIGHT / 2, vx: 3 * (Math.random() > 0.5 ? 1 : -1), vy: (Math.random() - 0.5) * 4 };
    state.paused = false;
    state.gameOver = false;
    if (full) {
      state.playerScore = 0;
      state.aiScore = 0;
    }
    setUiState({ player: state.playerScore, ai: state.aiScore, gameOver: state.gameOver });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const state = stateRef.current;
      ctx.fillStyle = 'var(--bg-secondary)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (!state.paused && !state.gameOver) {
        // Player paddle
        if (state.keys.up) state.playerY -= 5;
        if (state.keys.down) state.playerY += 5;
        state.playerY = Math.max(0, Math.min(HEIGHT - PADDLE_H, state.playerY));

        // AI paddle follows ball
        const aiCenter = state.aiY + PADDLE_H / 2;
        if (aiCenter < state.ball.y - 8) state.aiY += 3.2;
        if (aiCenter > state.ball.y + 8) state.aiY -= 3.2;
        state.aiY = Math.max(0, Math.min(HEIGHT - PADDLE_H, state.aiY));

        // Ball
        state.ball.x += state.ball.vx;
        state.ball.y += state.ball.vy;

        // Wall bounce
        if (state.ball.y <= 0 || state.ball.y >= HEIGHT - BALL) state.ball.vy *= -1;

        // Paddle collisions
        const playerRect = { x: 16, y: state.playerY, w: PADDLE_W, h: PADDLE_H };
        const aiRect = { x: WIDTH - 16 - PADDLE_W, y: state.aiY, w: PADDLE_W, h: PADDLE_H };

        if (
          state.ball.x <= playerRect.x + playerRect.w &&
          state.ball.x >= playerRect.x &&
          state.ball.y + BALL >= playerRect.y &&
          state.ball.y <= playerRect.y + playerRect.h &&
          state.ball.vx < 0
        ) {
          state.ball.vx *= -1.05;
          state.ball.vy += (state.ball.y - (playerRect.y + playerRect.h / 2)) * 0.1;
        }

        if (
          state.ball.x + BALL >= aiRect.x &&
          state.ball.x <= aiRect.x + aiRect.w &&
          state.ball.y + BALL >= aiRect.y &&
          state.ball.y <= aiRect.y + aiRect.h &&
          state.ball.vx > 0
        ) {
          state.ball.vx *= -1.05;
          state.ball.vy += (state.ball.y - (aiRect.y + aiRect.h / 2)) * 0.1;
        }

        // Scoring
        if (state.ball.x < 0) {
          state.aiScore += 1;
          if (state.aiScore >= WIN_SCORE) state.gameOver = true;
          reset(false);
        } else if (state.ball.x > WIDTH) {
          state.playerScore += 1;
          if (state.playerScore >= WIN_SCORE) state.gameOver = true;
          reset(false);
        }
      }

      // Draw
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.fillRect(16, stateRef.current.playerY, PADDLE_W, PADDLE_H);
      ctx.fillRect(WIDTH - 16 - PADDLE_W, stateRef.current.aiY, PADDLE_W, PADDLE_H);

      ctx.fillStyle = 'var(--accent-primary)';
      ctx.fillRect(stateRef.current.ball.x, stateRef.current.ball.y, BALL, BALL);

      ctx.strokeStyle = 'var(--border-subtle)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 0);
      ctx.lineTo(WIDTH / 2, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${stateRef.current.playerScore} : ${stateRef.current.aiScore}`, WIDTH / 2, 28);

      if (stateRef.current.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        const won = stateRef.current.playerScore >= WIN_SCORE;
        ctx.fillText(won ? 'YOU WIN!' : 'AI WINS', WIDTH / 2, HEIGHT / 2 - 8);
        ctx.font = '12px monospace';
        ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 14);
      } else if (stateRef.current.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2);
      }

      setUiState({ player: stateRef.current.playerScore, ai: stateRef.current.aiScore, gameOver: stateRef.current.gameOver });
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Escape') onExit();
      if (e.key === 'r' || e.key === 'R') reset(true);
      if (e.key === 'p' || e.key === 'P') {
        stateRef.current.paused = !stateRef.current.paused;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') stateRef.current.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') stateRef.current.keys.down = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') stateRef.current.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') stateRef.current.keys.down = false;
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
        <span>You: <span style={{ color: 'var(--accent-primary)' }}>{uiState.player}</span></span>
        <span>AI: <span style={{ color: 'var(--accent-primary)' }}>{uiState.ai}</span></span>
        <span>Arrows/WASD · P pause · R restart · Q quit</span>
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
