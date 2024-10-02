// src/App.js
import React from 'react';
import Orrery from './Orrery';
import OnClickGetTheItem from './component/OnClickGetTheItem';
import {BrowserRouter, Routes, Route}  from 'react-router-dom'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Orrery/>}/>
          <Route path='/planet/:planet' element={<OnClickGetTheItem />}/>
        </Routes>
      </BrowserRouter>
      
      // <OnClickGetTheItem />
    
  );
}

export default App;
