// src/App.js
import React, { useEffect, useRef } from 'react';
import Orrery from './Orrery';
import OnClickGetTheItem from './component/OnClickGetTheItem';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NeoPage from './component/NeoPage';
import backgroundMusic from './assets/background.mp3';

function App() {
  const audioRef = useRef(null);

  useEffect(() => {
    // Play the audio when the component mounts
    if (audioRef.current) {
      // Try to autoplay and catch any errors caused by browser autoplay restrictions
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Autoplay started
            console.log("Music playing");
          })
          .catch(error => {
            // Autoplay failed
            console.log("Autoplay failed, user interaction required");
          });
      }
    }
  }, []);

  return (
    <>
      {/* Background music element */}
      <audio ref={audioRef} src={backgroundMusic} loop autoPlay>
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
