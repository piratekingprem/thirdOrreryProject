import React, { useRef, useEffect } from 'react';
import Orrery from './Orrery';
import OnClickGetTheItem from './component/OnClickGetTheItem';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NeoPage from './component/NeoPage';
import backgroundMusic from './assets/background.mp3';

function App() {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    // Autoplay muted first, then unmute after interaction
    const handleInteraction = () => {
      if (audio && audio.paused) {
        audio.muted = false; // Unmute the audio after user interaction
        audio.play().catch(error => {
          console.error('Error attempting to play audio:', error);
        });
      }
    };

    // Attempt to autoplay muted
    if (audio) {
      audio.muted = true; // Start muted
      const playPromise = audio.play();

      // Autoplay might be blocked, handle it
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Autoplay started (muted).');
        }).catch(error => {
          console.log('Autoplay blocked or failed:', error);
        });
      }
    }

    // Add event listener to unmute and play on interaction
    window.addEventListener('click', handleInteraction);
    
    // Cleanup the event listener
    return () => {
      window.removeEventListener('click', handleInteraction);
    };
  }, []);

  return (
    <>
      {/* Background music element */}
      <audio ref={audioRef} src={backgroundMusic} loop>
        Your browser does not support the audio element.
      </audio>

      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Orrery />} />
          <Route path='/planet/:planet' element={<OnClickGetTheItem />} />
          <Route path="/neo/:name" element={<NeoPage />} /> 
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
