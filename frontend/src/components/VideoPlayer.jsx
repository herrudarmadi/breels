import { useRef, useEffect } from 'react';

const VideoPlayer = ({ video, onNext, onPrev }) => {
  const videoRef = useRef(null);
  const touchStartY = useRef(0);

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, [video]);

  return (
    <div className="video-player" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <video ref={videoRef} src={video.video_url} loop muted />
      <div className="info">
        <h3>{video.title}</h3>
        <p>{video.description}</p>
      </div>
    </div>
  );
};

export default VideoPlayer;