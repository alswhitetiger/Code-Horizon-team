import { cn } from '@/lib/utils'
import { CSSProperties } from 'react'

export default function Card({ children, className, style, onClick }: { children: React.ReactNode; className?: string; style?: CSSProperties; onClick?: () => void }) {
  return (
    <div style={style} onClick={onClick} className={cn(
      'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6',
      className
    )}>
      {children}
    </div>
  )
}
