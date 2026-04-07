interface Props { label: string; value: string | number; sub?: string; color?: string }

export default function ProgressCard({ label, value, sub, color = 'text-indigo-600' }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5">
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
