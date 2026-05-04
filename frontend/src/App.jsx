import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import VideoPlayer from './components/VideoPlayer'
import Quiz from './components/Quiz'
import Slideshow from './components/Slideshow'
import './App.css'

const API_HOST = 'http://10.20.187.247:8000'
const API_BASE = `${API_HOST}/api/content.php`
const USER_TOKEN = '1' // demo user token

function App() {
  const [feed, setFeed] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const viewedContent = useRef(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get(`${API_BASE}/feed`)
      .then((res) => {
        setFeed(res.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const currentItem = feed[currentIndex]
    if (currentItem && !viewedContent.current.has(`${currentItem.type}-${currentItem.id}`)) {
      const endpoint = currentItem.type === 'video' ? `videos.php/${currentItem.id}/view` : `${currentItem.type}/${currentItem.id}/view`
      axios.post(
        `${API_HOST}/api/${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${USER_TOKEN}`,
          },
        }
      )
      viewedContent.current.add(`${currentItem.type}-${currentItem.id}`)
    }
  }, [currentIndex, feed])

  const handleNext = () => {
    if (currentIndex < feed.length - 1) {
      setCurrentIndex((idx) => idx + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1)
    }
  }

  const currentItem = feed[currentIndex]

  if (loading) {
    return <div className="app">Loading feed…</div>
  }

  if (!feed.length) {
    return <div className="app">No content available yet.</div>
  }

  return (
    <div className="app">
      {currentItem.type === 'video' && (
        <VideoPlayer video={currentItem} onNext={handleNext} onPrev={handlePrev} />
      )}
      {currentItem.type === 'quiz' && (
        <Quiz quiz={currentItem} onSkip={handleNext} />
      )}
      {currentItem.type === 'slideshow' && (
        <Slideshow slideshow={currentItem} onNext={handleNext} onPrev={handlePrev} />
      )}
    </div>
  )
}

export default App
