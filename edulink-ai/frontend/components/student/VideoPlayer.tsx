'use client'
import { useRef, useEffect, useState } from 'react'
import { studentAPI } from '@/lib/api'

interface VideoPlayerProps {
  videoId: string
  url: string
  title: string
  initialWatchedSeconds?: number
}

export default function VideoPlayer({ videoId, url, title, initialWatchedSeconds = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isReady, setIsReady] = useState(false)
  const lastSavedRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoaded = () => {
      if (initialWatchedSeconds > 0 && initialWatchedSeconds < video.duration - 5) {
        video.currentTime = initialWatchedSeconds
      }
      setIsReady(true)
    }

    video.addEventListener('loadedmetadata', handleLoaded)
    return () => video.removeEventListener('loadedmetadata', handleLoaded)
  }, [initialWatchedSeconds])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const now = video.currentTime
      if (now - lastSavedRef.current >= 10) {
        lastSavedRef.current = now
        studentAPI.updateVideoProgress(videoId, {
          watched_seconds: Math.floor(now),
          total_seconds: Math.floor(video.duration) || 0,
          completed: video.ended || (video.duration > 0 && now / video.duration >= 0.95),
        }).catch(() => {})
      }
    }

    const handleEnded = () => {
      studentAPI.updateVideoProgress(videoId, {
        watched_seconds: Math.floor(video.duration),
        total_seconds: Math.floor(video.duration),
        completed: true,
      }).catch(() => {})
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [videoId])

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full aspect-video"
        title={title}
      >
        브라우저가 동영상을 지원하지 않습니다.
      </video>
    </div>
  )
}
