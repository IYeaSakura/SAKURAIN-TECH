/**
 * Pomodoro Timer Tool
 * 番茄工作法时钟
 * 
 * @author OpenClaw Auto-Dev
 */

import { useState, useEffect, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ToolModule } from '../types';

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

function PomodoroTimer() {
  const [seconds, setSeconds] = useState(WORK_MINUTES * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      if (mode === 'work') {
        setCompletedPomodoros(c => c + 1);
        toast({ title: '专注完成！休息一下吧' });
        setMode('break');
        setSeconds(BREAK_MINUTES * 60);
      } else {
        toast({ title: '休息结束！开始专注' });
        setMode('work');
        setSeconds(WORK_MINUTES * 60);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds, mode, toast]);

  const toggleTimer = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setSeconds(mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60);
  }, [mode]);

  const switchMode = useCallback(() => {
    const newMode = mode === 'work' ? 'break' : 'work';
    setMode(newMode);
    setSeconds(newMode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60);
    setIsActive(false);
  }, [mode]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Badge variant={mode === 'work' ? 'default' : 'secondary'} className="text-sm">
          {mode === 'work' ? <><Brain className="w-4 h-4 inline mr-1" />专注时间</> : <><Coffee className="w-4 h-4 inline mr-1" />休息时间</>}
        </Badge>
      </div>

      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 text-center">
          <div className="text-6xl font-mono font-bold mb-4">
            {formatTime(seconds)}
          </div>
          
          <Progress value={progress} className="mb-6" />
          
          <div className="flex justify-center gap-2">
            <Button onClick={toggleTimer} size="lg">
              {isActive ? <><Pause className="w-5 h-5 mr-1" />暂停</> : <><Play className="w-5 h-5 mr-1" />开始</>}
            </Button>
            <Button variant="outline" onClick={resetTimer}>
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={switchMode}>
              切换
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-muted-foreground">
          今日完成番茄: <span className="font-bold text-primary">{completedPomodoros}</span> 个
        </p>
      </div>
    </div>
  );
}

export const pomodoroMeta = {
  id: 'pomodoro',
  name: '番茄时钟',
  description: '番茄工作法计时器，25分钟专注+5分钟休息',
  icon: Timer,
  category: 'developer' as const,
  keywords: ['番茄', 'pomodoro', '计时器', '专注', '效率'],
  isNew: true,
};

export default { meta: pomodoroMeta, Component: PomodoroTimer } as ToolModule;
