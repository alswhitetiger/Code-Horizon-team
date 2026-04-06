'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: Array<{ date: string; avg: number; submissions: number }> }

export default function CourseStats({ data }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={false} name="평균점수" />
          <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} dot={false} name="제출수" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
