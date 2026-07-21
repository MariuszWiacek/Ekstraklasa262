import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { faHome, faTableList, faFutbol, faComments } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Chatbox from '../pages/chatbox'; // 


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleChatbox = () => {
    setIsChatboxOpen(!isChatboxOpen);
  };

  const menuClass = isMenuOpen ? 'collapse navbar-collapse show' : 'collapse navbar-collapse';
  const toggleButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    color: 'aliceblue',
    fontSize: '16px',
    fontWeight: 'bold',
  };
  const navbarStyle = {
    position: 'fixed',
    top: 0,
    width: '100%',
    background: scrollPosition > 0 ? '#483e00f1' : 'black',
    zIndex: 1000,
    transition: 'background-color 0.3s ease',
  };

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: '24px',
    fontWeight: 'bold',
    color: scrollPosition > 0 ? 'orange' : 'black',
    transition: 'color 0.3s ease',
  };

  const linksStyle = {
    marginLeft: 'auto',
    fontWeight: '700',
  };

  const messageContainerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50px', // Adjust the height as needed
    backgroundColor: 'black',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between', // Space evenly between icons
    padding: '0 10px', // Adjust padding to make space for icons
  };

  const messageStyle = {
    whiteSpace: 'nowrap',
    fontSize: '16px',
    color: 'aliceblue',
    fontWeight: 'bold',
    position: 'absolute',
    top: '0%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };


  const iconStyle = {
    color: '#ffea02',
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light navbar-white" style={navbarStyle}>
        <div className="container">
          <motion.div
            key="superliga"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 100, damping: 10, duration: 1.5 }}
          >
            <Link to="/" className="navbar-brand" style={brandStyle}>
              <h5 className="glossy-text">EKSTRABET.</h5>
            </Link>
          </motion.div>

          <button
            className={`navbar-toggler ${isMenuOpen ? 'open' : ''}`}
            type="button"
            onClick={toggleMenu}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
          <div className={menuClass} id="navbarNav">
            <ul className="navbar-nav" style={linksStyle}>
              <li className="nav-item">
                <Link to="/bets" className="nav-link" onClick={closeMenu}>
                  Zakłady
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/table" className="nav-link" onClick={closeMenu}>
                  Tabela
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/results" className="nav-link" onClick={closeMenu}>
                  Wyniki
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/stats" className="nav-link" onClick={closeMenu}>
                  Stats
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/rules" className="nav-link" onClick={closeMenu}>
                  Regulamin
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/history" className="nav-link" onClick={closeMenu}>
                  Historia
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/admin" className="nav-link" onClick={closeMenu}>
                  Admin
                </Link>
              
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <Chatbox isOpen={isChatboxOpen} toggleChatbox={toggleChatbox} />
       {/* Moving Message */}
       <div style={messageContainerStyle}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <FontAwesomeIcon icon={faHome} style={iconStyle} />
        </Link>
        <Link to="/bets" style={{ textDecoration: 'none' }}>
          <FontAwesomeIcon icon={faFutbol} size="1x" style={iconStyle} />
        </Link>
        <Link to="/table" style={{ textDecoration: 'none' }}>
          <FontAwesomeIcon icon={faTableList} style={iconStyle} />
        </Link>
        <button onClick={toggleChatbox} style={toggleButtonStyle}>
          <h5 style={{ color: 'aliceblue', marginRight: '8px' }}>chatbox</h5>
          <FontAwesomeIcon icon={faComments} style={iconStyle} />
        </button>
        <motion.div
          style={messageStyle}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
        >
          
        </motion.div>
      </div>
       {/* Chatbox Component */}
       {isChatboxOpen && <Chatbox isOpen={isChatboxOpen} toggleChatbox={toggleChatbox} />}
    </>
  );
};

export default Navbar;