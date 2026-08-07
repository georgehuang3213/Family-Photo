import React, { useState, useEffect } from 'react';

const heicCache = new Map();

export default function SafeImage({ src, alt, style, className, onClick, onMouseEnter, onMouseLeave, onError: parentOnError, ...props }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoadingHeic, setIsLoadingHeic] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);

    if (!src) return;

    const isHeic = src.toLowerCase().includes('.heic') || src.toLowerCase().includes('format=heic');
    if (isHeic) {
      if (heicCache.has(src)) {
        setImgSrc(heicCache.get(src));
        return;
      }
      
      // On PC browsers (non-Safari), attempt auto-conversion for HEIC links
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (!isSafari) {
        convertHeicUrl(src);
      }
    }
  }, [src]);

  const convertHeicUrl = async (urlToConvert) => {
    if (!urlToConvert || heicCache.has(urlToConvert)) {
      if (heicCache.has(urlToConvert)) setImgSrc(heicCache.get(urlToConvert));
      return;
    }
    setIsLoadingHeic(true);
    try {
      const response = await fetch(urlToConvert);
      const blob = await response.blob();
      const heic2anyModule = await import('heic2any');
      const heic2any = heic2anyModule.default || heic2anyModule;
      
      const convertedBlob = await heic2any({
        blob,
        toType: 'image/jpeg',
        quality: 0.82
      });
      const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const convertedUrl = URL.createObjectURL(blobToUse);
      heicCache.set(urlToConvert, convertedUrl);
      setImgSrc(convertedUrl);
    } catch (err) {
      console.warn('On-the-fly HEIC conversion failed:', err);
      setHasError(true);
    } finally {
      setIsLoadingHeic(false);
    }
  };

  const handleError = (e) => {
    if (src && !heicCache.has(src) && !isLoadingHeic) {
      convertHeicUrl(src);
    } else {
      setHasError(true);
    }
    if (parentOnError) parentOnError(e);
  };

  if (hasError) {
    return (
      <div 
        onClick={onClick}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(15, 23, 42, 0.8)', 
          color: 'var(--text-muted)', 
          fontSize: '0.8rem',
          padding: '12px',
          textAlign: 'center',
          ...style 
        }}>
        <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🖼️</span>
        <span>無法載入照片</span>
      </div>
    );
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt || ''}
      style={style}
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onError={handleError}
    />
  );
}
