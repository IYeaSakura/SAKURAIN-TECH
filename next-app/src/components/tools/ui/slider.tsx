import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
  className?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min = 0, max = 100, step = 1, onValueChange, ...props }, ref) => {
    const currentValue = value?.[0] ?? min
    
    return (
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        className={cn(
          "relative flex w-full touch-none select-none items-center h-4",
          className
        )}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
