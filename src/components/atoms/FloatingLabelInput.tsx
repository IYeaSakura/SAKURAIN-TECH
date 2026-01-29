import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingLabelInputProps {
  label: string;
  type?: 'text' | 'email' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FloatingLabelInput({
  label,
  type = 'text',
  value,
  onChange,
  className,
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={cn('relative', className)}>
      <motion.label
        className="absolute left-0 text-[#6b7280] pointer-events-none origin-left"
        initial={false}
        animate={{
          y: isActive ? -24 : 0,
          scale: isActive ? 0.85 : 1,
          color: isFocused ? '#2563eb' : '#6b7280',
        }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {label}
      </motion.label>
      <InputComponent
        type={type === 'textarea' ? undefined : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full bg-transparent border-b-2 border-[rgba(0,0,0,0.08)] py-2 outline-none transition-colors duration-300 focus:border-[#2563eb] resize-none"
        rows={type === 'textarea' ? 4 : undefined}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-[#2563eb]"
        initial={{ width: '0%' }}
        animate={{ width: isFocused ? '100%' : '0%' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
