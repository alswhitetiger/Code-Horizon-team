export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function getRiskColor(level: string) {
  if (level === '높음') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
  if (level === '보통') return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
  return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
}
