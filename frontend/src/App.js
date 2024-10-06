import React, { useRef, useEffect } from 'react';
import Orrery from './Orrery';
import OnClickGetTheItem from './component/OnClickGetTheItem';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NeoPage from './component/NeoPage';
import backgroundMusic from './assets/background.mp3';

function App() {
  const audioRef = useRef(null);

  useEffect(() => {
    // Autoplay muted first, then unmute after interaction
    const handleInteraction = () => {
      if (audioRef.current) {
        audioRef.current.muted = false; // Unmute the audio after user interaction
      }
    };

    if (audioRef.current) {
      // Start playing the audio muted
      audioRef.current.muted = true;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.log("Autoplay muted to comply with browser restrictions.");
        });
      }
    }

    // Unmute audio on any user interaction (like a click)
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
