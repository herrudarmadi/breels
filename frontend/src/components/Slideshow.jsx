import { useState, useEffect, useRef } from 'react';

const Slideshow = ({ slideshow, onNext, onPrev }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = JSON.parse(slideshow.images || '[]');
  const touchStartY = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000); // Auto advance every 3 seconds
    return () => clearInterval(interval);
  }, [images.length]);

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

  return (
    <div className="slideshow" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <img src={images[currentImage]} alt={slideshow.title} />
      <div className="info">
        <h3>{slideshow.title}</h3>
        <div className="indicators">
          {images.map((_, index) => (
            <span key={index} className={index === currentImage ? 'active' : ''}></span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Slideshow;