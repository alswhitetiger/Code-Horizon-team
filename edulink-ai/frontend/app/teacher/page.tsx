'use client'
import { useEffect, useState } from 'react'
import { teacherAPI } from '@/lib/api'
import { Course, Submission } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SubmissionList from '@/components/teacher/SubmissionList'
import { mockCourses, mockSubmissions } from '@/lib/mock-data'
import Link from 'next/link'

export default function TeacherDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const c = await teacherAPI.getCourses()
        setCourses(c)
      } catch {
        setCourses(mockCourses)
      } finally {
        setLoading(false)
        setSubmissions(mockSubmissions)
      }
    }
    load()
  }, [])

  void loading

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">교사 대시보드</h1>
        <p className="text-gray-500 text-sm">내 강의와 학생 현황을 확인하세요.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">내 강의 ({courses.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{c.subject}</span>
                <span className="text-xs text-gray-400">{c.gradeLevel}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
              <p className="text-sm text-gray-500">학생 {c.studentCount || 0}명</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/teacher/questions">
          <Button>AI 문제 생성</Button>
        </Link>
        <Button variant="secondary">채점 대기 {submissions.filter(s => s.status !== '채점완료').length}건</Button>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">최근 제출 현황</h2>
        <SubmissionList submissions={submissions} />
      </Card>
    </div>
  )
}
