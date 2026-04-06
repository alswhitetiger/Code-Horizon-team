export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function getRiskColor(level: string) {
  if (level === '높음') return 'text-red-600 bg-red-50'
  if (level === '보통') return 'text-yellow-600 bg-yellow-50'
  return 'text-green-600 bg-green-50'
}
