import { useState, useCallback, useEffect } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toasts]))
}

export const toast = (options: ToastOptions) => {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast = { id, ...options }
  toasts = [...toasts, newToast]
  notifyListeners()
  
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    notifyListeners()
  }, 3000)
}

export function useToast() {
  const [, setLocalToasts] = useState<Toast[]>([])

  // Subscribe to toast updates
  useEffect(() => {
    const listener = (newToasts: Toast[]) => setLocalToasts(newToasts)
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])

  const showToast = useCallback((options: ToastOptions) => {
    toast(options)
  }, [])

  return { toast: showToast }
}
