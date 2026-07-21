import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import xtraBetVideo from '../images/Untitled.mp4';

function Loading({ onLoaded }) {
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoLoaded) {
        onLoaded();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [videoLoaded, onLoaded]);

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${require('../images/stadium.png')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '80%',
          maxWidth: '600px',
          height: 'auto',
          paddingTop: '56.25%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          id="loadingVideo"
          src={xtraBetVideo}
          autoPlay
          muted
          playsInline
          onLoadedData={handleVideoLoaded}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '115%',
            height: '115%',
            objectFit: 'cover',
            opacity: 3.5,
            mixBlendMode: 'screen',
          }}
        />
      </div>
    </motion.div>
  );
}

export default Loading;
