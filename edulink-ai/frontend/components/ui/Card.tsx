import { cn } from '@/lib/utils'
import { CSSProperties } from 'react'

export default function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div style={style} className={cn(
      'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6',
      className
    )}>
      {children}
    </div>
  )
}
