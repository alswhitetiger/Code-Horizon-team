'use client'
import { useEffect, useState } from 'react'
import { studentAPI } from '@/lib/api'
import { Course, RecommendedContent } from '@/types'
import Card from '@/components/ui/Card'
import ProgressCard from '@/components/student/ProgressCard'
import RecommendList from '@/components/student/RecommendList'
import { mockCourses, mockRecommendations } from '@/lib/mock-data'
import Link from 'next/link'

export default function StudentHome() {
  const [courses, setCourses] = useState<Course[]>([])
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([])
  const [progress, setProgress] = useState({ totalSubmissions: 0, avgScore: 0, studyDays: 0, progressPct: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const [c, r, p] = await Promise.all([
          studentAPI.getCourses(),
          studentAPI.getRecommendations(),
          studentAPI.getProgress()
        ])
        setCourses(c); setRecommendations(r); setProgress(p)
      } catch {
        setCourses(mockCourses); setRecommendations(mockRecommendations)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">학습 홈</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">오늘도 꾸준히 학습해요!</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ProgressCard label="진도율" value={`${progress.progressPct}%`} color="text-indigo-600" />
        <ProgressCard label="평균 점수" value={`${progress.avgScore}점`} color="text-green-600" />
        <ProgressCard label="연속 학습일" value={`${progress.studyDays}일`} color="text-orange-600" />
        <ProgressCard label="총 제출" value={`${progress.totalSubmissions}건`} color="text-purple-600" />
      </div>

      {/* 진로 배너 */}
      <Link href="/student/career">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white cursor-pointer hover:opacity-95 transition-opacity">
          <p className="font-bold text-lg mb-1">나의 진로 탐색하기</p>
          <p className="text-indigo-100 text-sm">AI와 함께 꿈을 설정하고, 진로 안내 · 상담 · 예상 문제를 받아보세요!</p>
        </div>
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">AI 맞춤 추천</h2>
        <RecommendList recommendations={recommendations} />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">진행 중인 강의</h2>
        <div className="space-y-3">
          {courses.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{c.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.subject} · {c.gradeLevel}</p>
              </div>
              <Link href={`/student/assessments/${c.id}`}>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">시험 보기 →</button>
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
