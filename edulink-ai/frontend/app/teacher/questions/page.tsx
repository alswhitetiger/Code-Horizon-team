'use client'
import { useState } from 'react'
import { Question } from '@/types'
import Card from '@/components/ui/Card'
import QuestionGenerator from '@/components/teacher/QuestionGenerator'

export default function QuestionsPage() {
  const [saved, setSaved] = useState<Question[]>([])

  const handleSave = (questions: Question[]) => {
    setSaved(prev => [...prev, ...questions])
    alert(`${questions.length}개 문제가 저장되었습니다.`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI 문제 생성</h1>
        <p className="text-gray-500 text-sm">AI가 교육 과정에 맞는 문제를 자동으로 생성합니다.</p>
      </div>
      <Card>
        <QuestionGenerator onSave={handleSave} />
      </Card>
      {saved.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-800 mb-3">저장된 문제 ({saved.length}개)</h2>
          <p className="text-sm text-gray-500">저장된 문제로 시험을 생성하려면 강의 관리 페이지를 이용하세요.</p>
        </Card>
      )}
    </div>
  )
}
