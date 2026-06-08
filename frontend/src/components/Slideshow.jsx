import { useState, useEffect, useRef } from 'react';
import { trackContentAnalytics } from '../utils/analytics';
import { labelLikeCountK, sendLike } from '../utils/like';
import HeartIcon from './HeartIcon';

const Slideshow = ({ slideshow, onNext, onPrev, onJumpToQuiz, isActive = true }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = JSON.parse(slideshow.images || '[]');
  const touchStartY = useRef(0);
  const startTime = useRef(Date.now());
  const slidesViewed = useRef(1);
  const analyticsTracked = useRef(false);

  useEffect(() => {
    startTime.current = Date.now();
    slidesViewed.current = 1;
    analyticsTracked.current = false;
  }, [slideshow.id]);

  // Only auto-advance when active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) => {
        const nextIndex = (prev + 1) % images.length;
        slidesViewed.current = Math.max(slidesViewed.current, nextIndex + 1);
        return nextIndex;
      });
    }, 3000); // Auto advance every 3 seconds
    return () => clearInterval(interval);
  }, [images.length, isActive]);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleLikeToggle = () => {
    slideshow.liked = !slideshow.liked;
    if (slideshow.liked) {
      slideshow.likes++;
    } else {
      slideshow.likes--;
    }
    
    sendLike('slideshow', slideshow.id, {
      content_type: 'slideshow',
      action: slideshow.liked,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('Like action failed:', err));
  };

  const reportSlideshowAnalytics = (action) => {
    if (analyticsTracked.current) return;
    analyticsTracked.current = true;

    trackContentAnalytics('slideshow', slideshow.id, {
      content_type: 'slideshow',
      action,
      duration: Math.round((Date.now() - startTime.current) / 1000),
      slides_viewed: slidesViewed.current,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('Slideshow analytics failed:', err));
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      reportSlideshowAnalytics('skipped');
      onNext();
    } else if (diff < -50) {
      reportSlideshowAnalytics('skipped');
      onPrev();
    }
  };

  useEffect(() => {
    return () => {
      if (!analyticsTracked.current) {
        reportSlideshowAnalytics('abandoned');
      }
    };
  }, [slideshow.id]);

  return (
    <div className="slideshow" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <img src={images[currentImage]} alt={slideshow.title} />
      <button className='like-button' onClick={handleLikeToggle}>
        <span className="like-icon"><HeartIcon color={slideshow.liked ? '#ff0000' : '#fff'} /></span>
        <span className="like-count">{labelLikeCountK(slideshow.likes || 0)}</span>
      </button>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((currentImage + 1) / images.length) * 100}%` }}></div>
      </div>
      <div className="info">
        <h3>{slideshow.title}</h3>
        <div className="indicators">
          {images.map((_, index) => (
            <span key={index} className={index === currentImage ? 'active' : ''}></span>
          ))}
        </div>
        {slideshow.related_quiz_id && onJumpToQuiz && (
          <button 
            className="take-quiz-button" 
            onClick={() => onJumpToQuiz(slideshow.related_quiz_id)}
          >
            Challenge Yourself →
          </button>
        )}
      </div>
    </div>
  );
};

export default Slideshow;