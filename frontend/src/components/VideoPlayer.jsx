import { useRef, useEffect, useState } from 'react';
import { trackContentAnalytics } from '../utils/analytics';
import { labelLikeCountK, getLike, sendLike } from '../utils/like';
import HeartIcon from './HeartIcon';


const VideoPlayer = ({ video, onNext, onPrev, onJumpToQuiz, isActive = true }) => {
  const videoRef = useRef(null);
  const touchStartY = useRef(0);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const watchStartTime = useRef(Date.now());
  const maxWatchedTime = useRef(0);
  const analyticsTracked = useRef(false);

  // Only play/pause when active state changes
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch((err) => console.warn('Play failed:', err));
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      onNext();
    } else if (diff < -50) {
      onPrev();
    }
  };

  const handleLikeToggle = () => {
    video.liked = !video.liked;
    if (video.liked) {
      video.likes++;
      video.like_count_labelled = labelLikeCountK(video.likes);
    } else {
      video.likes--;
    }

    sendLike('video', video.id, {
      content_type: 'video',
      action: video.liked,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('Like action failed:', err));
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const trackAnalytics = (action) => {
    if (!videoRef.current || analyticsTracked.current) return;

    const currentTime = videoRef.current.currentTime || 0;
    const duration = videoRef.current.duration || 0;
    const watchedDuration = Math.round(maxWatchedTime.current);
    const completionPercent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

    const payload = {
      content_type: 'video',
      watched_duration: watchedDuration,
      completion_percent: completionPercent,
      action,
      timestamp: new Date().toISOString(),
    };

    analyticsTracked.current = true;
    trackContentAnalytics('video', video.id, payload).catch((err) =>
      console.error('Analytics tracking failed:', err)
    );
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      maxWatchedTime.current = Math.max(maxWatchedTime.current, videoRef.current.currentTime);
      const progressPercent = (videoRef.current.currentTime / videoRef.current.duration) * 100 || 0;
      setProgress(progressPercent);
    }
  };

  const handleVideoEnded = () => {
    trackAnalytics('completed');
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
    watchStartTime.current = Date.now();
    maxWatchedTime.current = 0;
    analyticsTracked.current = false;

    return () => {
      if (!analyticsTracked.current) {
        trackAnalytics('skipped');
      }
    };
  }, [video]);

  return (
    <div className="video-player" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <video
        ref={videoRef}
        src={video.video_url}
        loop
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onClick={handleMuteToggle}
      />
      <button className='like-button' onClick={handleLikeToggle}>
        <span className="like-icon"><HeartIcon color={video.liked ? '#ff0000' : '#fff'} /></span>
        <span className="like-count">{labelLikeCountK(video.likes)}</span>
      </button>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="info">
        <h3>{video.title}</h3>
        <p>{video.description}</p>
        {video.related_quiz_id && onJumpToQuiz && (
          <button 
            className="take-quiz-button" 
            onClick={() => onJumpToQuiz(video.related_quiz_id)}
          >
            Challenge Yourself →
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;