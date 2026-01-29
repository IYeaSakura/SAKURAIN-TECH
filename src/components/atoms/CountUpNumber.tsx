import { useRef } from 'react';
import NumberFlow from '@number-flow/react';
import { useInView } from '@/hooks/useScrollProgress';
import { cn } from '@/lib/utils';

interface CountUpNumberProps {
  value: number;
  suffix?: string;
  label: string;
  className?: string;
}

export function CountUpNumber({
  value,
  suffix = '',
  label,
  className,
}: CountUpNumberProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { threshold: 0.5 });

  return (
    <div ref={ref} className={cn('text-center', className)}>
      <div className="flex items-baseline justify-center gap-1">
        <NumberFlow
          value={isInView ? value : 0}
          className="text-4xl md:text-5xl font-bold text-[#111827] tabular-nums"
          transformTiming={{ duration: 2500, easing: 'ease-out' }}
        />
        {suffix && (
          <span className="text-2xl md:text-3xl font-semibold text-[#2563eb]">
            {suffix}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[#6b7280]">{label}</p>
    </div>
  );
}
