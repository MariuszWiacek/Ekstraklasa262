import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Timer from './components/CountdownTimer';
import Home from './pages/home';
import Navbar from './components/navbar';
import Table from './pages/table';
import Admin from './pages/admin';
import Footer from './components/footer';
import Guestbook from './pages/chatbox';
import Results from './pages/results';
import Bets from './pages/bets';
import History from './pages/history';
import Stats from './pages/stats';
import Rules from './pages/rules';
import Loading from './components/loading';

import pitch from './images/pitc.jpeg';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSignup, setShowSignup] = useState(true);
  

  useEffect(() => {
    const handleImageLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    };

    const img = new Image();
    img.src = pitch;
    img.onload = handleImageLoad;

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      img.onload = null;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const containerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '5%',
    marginTop: isMobile ? '15%' : '5%',
  };

  return (
    <Router>
      <AnimatePresence>
        {isLoading ? (
          <Loading onLoaded={() => setIsLoading(false)} key="loading" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div className="container" style={containerStyle}>
              <Timer />
              <hr style={{ color: 'white' }} />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/table" element={<Table />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/results" element={<Results />} />
                <Route path="/guestbook" element={<Guestbook />} />
                <Route path="/bets" element={<Bets />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </div>
            <Footer />
             
          </div>
        )}
      </AnimatePresence>
    </Router>
  );
}

export default App;
