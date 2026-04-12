'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { studentAPI } from '@/lib/api'
import VideoPlayer from '@/components/student/VideoPlayer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Video {
  id: string
  title: string
  description: string
  url: string
  myProgress?: {
    watchedSeconds: number
    totalSeconds: number
    completed: boolean
    watchedPct: number
  }
}

export default function CourseVideosPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVideos()
  }, [courseId])

  const loadVideos = async () => {
    try {
      const data = await studentAPI.getCourseVideos(courseId)
      setVideos(data)
      if (data.length > 0) setSelectedVideo(data[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">불러오는 중...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">← 뒤로가기</button>
        <h1 className="text-2xl font-bold">강의 시청</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {selectedVideo ? (
            <>
              <VideoPlayer
                videoId={selectedVideo.id}
                url={selectedVideo.url}
                title={selectedVideo.title}
                initialWatchedSeconds={selectedVideo.myProgress?.watchedSeconds}
              />
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedVideo.description}</p>
              </div>
            </>
          ) : (
            <Card className="aspect-video flex items-center justify-center text-gray-400">
              영상을 선택해주세요.
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg">강의 목록</h3>
          <div className="space-y-2 overflow-y-auto max-h-[70vh]">
            {videos.length === 0 ? (
              <p className="text-gray-500 text-sm">등록된 강의 영상이 없습니다.</p>
            ) : videos.map(v => (
              <div
                key={v.id}
                onClick={() => setSelectedVideo(v)}
                className={`p-3 border rounded-xl cursor-pointer transition-all ${selectedVideo?.id === v.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className={`text-sm font-semibold ${selectedVideo?.id === v.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {v.title}
                  </p>
                  {v.myProgress?.completed && (
                    <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">완료</span>
                  )}
                </div>
                {v.myProgress && (
                  <div className="space-y-1">
                    <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${v.myProgress.watchedPct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-500 text-right">{v.myProgress.watchedPct}% 시청</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
