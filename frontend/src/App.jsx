import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import VideoPlayer from './components/VideoPlayer'
import Quiz from './components/Quiz'
import Slideshow from './components/Slideshow'
import './App.css'
import { API_HOST } from './config'
import ExternalVideo from './components/ExternalVideo'

const API_BASE = `${API_HOST}/api/content.php/feed`
const USER_TOKEN = '1' // demo user token
const ITEMS_PER_PAGE = 10
const PRELOAD_AHEAD = 3
const FETCH_THRESHOLD = 4

function App() {
  const [feed, setFeed] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [transitionDir, setTransitionDir] = useState('next')
  const [loading, setLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [nextReady, setNextReady] = useState(false)
  const [preloadTrigger, setPreloadTrigger] = useState(0)
  const viewedContent = useRef(new Set())
  const preloadedContent = useRef(new Map())
  const preloadStatus = useRef(new Map())

  // Initial feed load
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await axios.get(`${API_BASE}?limit=${ITEMS_PER_PAGE}&offset=0`, {
          headers: {
            Authorization: `Bearer ${USER_TOKEN}`,
          },
        })
        setFeed(res.data || [])
        setHasMore((res.data || []).length >= ITEMS_PER_PAGE)
        setOffset(ITEMS_PER_PAGE)
      } catch (error) {
        console.error('Error fetching feed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
  }, [])

  // Fetch more feed when approaching the end
  useEffect(() => {
    if (feed.length === 0) return

    const itemsUntilEnd = feed.length - currentIndex

    if (itemsUntilEnd <= FETCH_THRESHOLD && !isLoadingMore && hasMore) {
      setIsLoadingMore(true)

      axios
        .get(`${API_BASE}?limit=${ITEMS_PER_PAGE}&offset=${offset}`, {
          headers: {
            Authorization: `Bearer ${USER_TOKEN}`,
          },
        })
        .then((res) => {
          const newItems = res.data || []
          setFeed((prev) => [...prev, ...newItems])
          setOffset((prev) => prev + ITEMS_PER_PAGE)
          setHasMore(newItems.length >= ITEMS_PER_PAGE)
        })
        .catch((error) => console.error('Error loading more feed:', error))
        .finally(() => setIsLoadingMore(false))
    }
  }, [currentIndex, feed.length, offset, hasMore, isLoadingMore])

  const preloadVideoItem = (item, contentKey) => {
    if (!item.video_url) {
      preloadStatus.current.set(contentKey, true)
      setPreloadTrigger(t => t + 1)
      return
    }

    const video = document.createElement('video')
    video.src = item.video_url
    video.preload = 'metadata'

    const onLoadedMetadata = () => {
      preloadStatus.current.set(contentKey, true)
      setPreloadTrigger(t => t + 1)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
    }

    const onError = () => {
      console.warn(`Failed to preload video ${contentKey}, marking as ready anyway`)
      preloadStatus.current.set(contentKey, true)
      setPreloadTrigger(t => t + 1)
      video.removeEventListener('error', onError)
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('error', onError)
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!preloadStatus.current.get(contentKey)) {
        preloadStatus.current.set(contentKey, true)
        setPreloadTrigger(t => t + 1)
      }
    }, 5000)
  }

  const preloadSlideshowItem = (item, contentKey) => {
    if (!item.images) {
      preloadStatus.current.set(contentKey, true)
      setPreloadTrigger(t => t + 1)
      return
    }

    try {
      const images = Array.isArray(item.images)
        ? item.images
        : JSON.parse(item.images || '[]')

      let loadedCount = 0
      const totalImages = images.length

      images.forEach((imgUrl) => {
        const img = new Image()
        img.onload = () => {
          loadedCount++
          if (loadedCount === totalImages) {
            preloadStatus.current.set(contentKey, true)
            setPreloadTrigger(t => t + 1)
          }
        }
        img.onerror = () => {
          loadedCount++
          if (loadedCount === totalImages) {
            preloadStatus.current.set(contentKey, true)
            setPreloadTrigger(t => t + 1)
          }
        }
        img.src = imgUrl
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!preloadStatus.current.get(contentKey)) {
          preloadStatus.current.set(contentKey, true)
          setPreloadTrigger(t => t + 1)
        }
      }, 5000)
    } catch (e) {
      console.error('Error preloading slideshow:', e)
      preloadStatus.current.set(contentKey, true)
      setPreloadTrigger(t => t + 1)
    }
  }

  const preloadExternalItem = (item, contentKey) => {
    if (item.thumbnail_url) {
      const img = new Image()
      img.onload = () => {
        preloadStatus.current.set(contentKey, true)
        setPreloadTrigger(t => t + 1)
      }
      img.onerror = () => {
        preloadStatus.current.set(contentKey, true)
        setPreloadTrigger(t => t + 1)
      }
      img.src = item.thumbnail_url

      setTimeout(() => {
        if (!preloadStatus.current.get(contentKey)) {
          preloadStatus.current.set(contentKey, true)
          setPreloadTrigger(t => t + 1)
        }
      }, 3000)
    } else {
      preloadStatus.current.set(contentKey, true)
      setPreloadTrigger(t => t + 1)
    }
  }

  // Preload next PRELOAD_AHEAD content items
  useEffect(() => {
    if (feed.length === 0) return

    // Check if next item is ready
    if (currentIndex + 1 < feed.length) {
      const nextItem = feed[currentIndex + 1]
      const contentKey = `${nextItem.type}-${nextItem.id}`
      
      if (!preloadStatus.current.has(contentKey)) {
        preloadStatus.current.set(contentKey, false)
        
        if (nextItem.type === 'video') {
          preloadVideoItem(nextItem, contentKey)
        } else if (nextItem.type === 'slideshow') {
          preloadSlideshowItem(nextItem, contentKey)
        } else if (nextItem.type === 'external') {
          preloadExternalItem(nextItem, contentKey)
        } else {
          // Quiz and other types load instantly
          preloadStatus.current.set(contentKey, true)
        }
      }
    }

    // Preload further items in background
    for (let i = 2; i <= PRELOAD_AHEAD; i++) {
      const nextIndex = currentIndex + i
      if (nextIndex < feed.length) {
        const item = feed[nextIndex]
        const contentKey = `${item.type}-${item.id}`

        if (!preloadedContent.current.has(contentKey)) {
          if (item.type === 'video' && item.thumbnail_url) {
            const img = new Image()
            img.src = item.thumbnail_url
            if (item.video_url) {
              const video = document.createElement('video')
              video.src = item.video_url
              video.preload = 'auto'
            }
            preloadedContent.current.set(contentKey, true)
          } else if (item.type === 'slideshow' && item.images) {
            try {
              const images = Array.isArray(item.images)
                ? item.images
                : JSON.parse(item.images || '[]')
              images.forEach((imgUrl) => {
                const img = new Image()
                img.src = imgUrl
              })
              preloadedContent.current.set(contentKey, true)
            } catch (e) {
              console.error('Error parsing slideshow images:', e)
            }
          } else if (item.type === 'external' && item.thumbnail_url) {
            const img = new Image()
            img.src = item.thumbnail_url
            preloadedContent.current.set(contentKey, true)
          } else {
            preloadedContent.current.set(contentKey, true)
          }
        }
      }
    }
  }, [currentIndex, feed])

  // Check if next item is ready for transition
  useEffect(() => {
    if (currentIndex + 1 < feed.length) {
      const nextItem = feed[currentIndex + 1]
      const contentKey = `${nextItem.type}-${nextItem.id}`
      const isReady = preloadStatus.current.get(contentKey) ?? (nextItem.type === 'quiz' || nextItem.type === 'external')
      setNextReady(isReady)
    } else {
      setNextReady(!hasMore) // Ready if no more items to load
    }
  }, [currentIndex, feed, hasMore, preloadTrigger])

  useEffect(() => {
    const currentItem = feed[currentIndex]
    if (currentItem && !viewedContent.current.has(`${currentItem.type}-${currentItem.id}`)) {
      const endpoint = currentItem.type === 'video' ? `videos.php/${currentItem.id}/view` : `content.php/${currentItem.type}/${currentItem.id}/view`
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
    if (currentIndex < feed.length - 1 && nextReady) {
      setTransitionDir('next')
      setCurrentIndex((idx) => idx + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setTransitionDir('prev')
      setCurrentIndex((idx) => idx - 1)
    }
  }

  const jumpToQuiz = (relatedQuizId) => {
    // Find the quiz in the feed and jump to it
    const quizIndex = feed.findIndex(
      (item) => item.type === 'quiz' && item.id === relatedQuizId
    )
    if (quizIndex !== -1) {
      setTransitionDir('next')
      setCurrentIndex(quizIndex)
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
      <div
        key={`${currentItem.type}-${currentItem.id}`}
        className={`content-card slide-${transitionDir}`}
      >
        <div className="desktop-navigation">
          <button className="nav-button prev" onClick={handlePrev} disabled={currentIndex === 0}>
            Prev
          </button>
          <button className="nav-button next" onClick={handleNext} disabled={currentIndex === feed.length - 1 && !hasMore} title={!nextReady ? 'Loading next...' : ''}>
            {!nextReady && currentIndex < feed.length - 1 ? '⏳' : 'Next'}
          </button>
        </div>

        {currentItem.type === 'video' && (
          <VideoPlayer video={currentItem} onNext={handleNext} onPrev={handlePrev} onJumpToQuiz={jumpToQuiz} isActive={true} />
        )}
        {currentItem.type === 'quiz' && (
          <Quiz quiz={currentItem} onSkip={handleNext} isActive={true} />
        )}
        {currentItem.type === 'slideshow' && (
          <Slideshow slideshow={currentItem} onNext={handleNext} onPrev={handlePrev} onJumpToQuiz={jumpToQuiz} isActive={true} />
        )}
        {currentItem.type === 'external' && (
          <ExternalVideo video={currentItem} onNext={handleNext} onPrev={handlePrev} onJumpToQuiz={jumpToQuiz} />
        )}
      </div>
    </div>
  )
}

export default App
