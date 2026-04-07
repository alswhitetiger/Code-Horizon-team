import { RecommendedContent } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props { recommendations: RecommendedContent[] }

export default function RecommendList({ recommendations }: Props) {
  if (!recommendations.length) return <p className="text-gray-500 text-sm">추천 콘텐츠가 없습니다.</p>
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {recommendations.map(r => (
        <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
          <Badge variant={r.type === '보충학습' ? 'danger' : r.type === '개념복습' ? 'warning' : 'default'}>{r.type}</Badge>
          <h3 className="font-medium mt-2 mb-1 text-gray-900 dark:text-gray-100">{r.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{r.reason}</p>
          <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
            <span>{r.subject}</span>
            <span>약 {r.estimatedMinutes}분</span>
          </div>
        </div>
      ))}
    </div>
  )
}
