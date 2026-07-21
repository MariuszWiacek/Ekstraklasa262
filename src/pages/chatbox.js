import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


import '../styles/guestbook.css';

const firebaseConfig = {
  apiKey: "AIzaSyCGD41f7YT-UQyGZ7d1GzzB19B9wDNbg58",
  authDomain: "guestbook-73dfc.firebaseapp.com",
  databaseURL: "https://guestbook-73dfc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "guestbook-73dfc",
  storageBucket: "guestbook-73dfc.appspot.com",
  messagingSenderId: "674344514507",
  appId: "1:674344514507:web:fc587317fa516369a3bc4e",
  measurementId: "G-1TZ4B0BK9D"
};

const Chatbox = ({ isOpen, toggleChatbox }) => {
  const [username, setUsername] = useState('');

  const [message, setMessage] = useState('');
  const [guestbookEntries, setGuestbookEntries] = useState([]);
  const chatContainerRef = useRef(null);

  // Initialize a secondary Firebase app
  const secondaryApp = initializeApp(firebaseConfig, 'secondary');
  const analytics = getAnalytics(secondaryApp);
  const db = getDatabase(secondaryApp);

  useEffect(() => {
    // Scroll to the bottom of the chat container when the component mounts or when guestbookEntries change
    scrollToBottom();
  }, [guestbookEntries]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Fetch guestbook entries from Firebase when the component mounts
    const entriesRef = ref(db, 'guestbookEntries');
    onValue(entriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          const entries = Object.values(data).reverse(); // Reverse the order of entries
          setGuestbookEntries(entries);
          scrollToBottom(); // Scroll to the bottom after setting chat entries
        }
      }
    });
  }, [db]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('selectedUser');
      setUsername(storedUser || '');
    };
  
    // Set username initially based on what's in localStorage
    handleStorageChange();
  
    // Add an event listener to detect changes to localStorage
    window.addEventListener('storage', handleStorageChange);
  
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  

  const handleSubmit = (e) => {
    e.preventDefault();

    // Push the new entry to the Firebase Realtime Database
    const entriesRef = ref(db, 'guestbookEntries');
    const now = new Date();
    const formattedDateAndTime = now.toISOString(); // Use toISOString to format date and time

    push(entriesRef, {
      name: username, // Use the username in the entry
      message,
      dateAndTime: formattedDateAndTime, // Include date and time in the entry
    });

    // Save the username to local storage
    localStorage.setItem('username', username);

    // Clear the input fields
    setMessage('');
  };

  const chatboxStyle = {
    position: 'fixed',
    bottom: isOpen ? '0' : '-400px', // Adjust as per your needs
    right: '20px',
    width: '300px',
    height: '400px',
    backgroundColor: isOpen ? '#008131' : '#fff', // Change background color based on isOpen state
    boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
    borderRadius: '10px 10px 0 0',
    transition: 'bottom 0.3s ease',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    backgroundColor: isOpen ? 'darkgreen' : '#007bff', // Adjust header background color
    color: 'white',
    padding: '10px',
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
  };

  const messagesContainerStyle = {
    fontFamily: 'Rubik, sans-serif',
    fontSize: '14px',
    flex: 1,
    border: '1px solid #ccc',
    padding: '10px',
    backgroundColor: '#2727277b',
    borderRadius: '8px',
    overflowY: 'scroll',
    scrollbarWidth: 'thin',
    scrollbarColor: '#888888 #f0f0f0',
    maxHeight: '400px',
    marginBottom: '10px', // Adjust margin as needed
  };

  const messageStyle = {
    whiteSpace: 'nowrap',
    fontSize: '16px',
    color: 'aliceblue',
    fontWeight: 'bold',
  };

  return (
    <div style={chatboxStyle}>
      <div style={headerStyle}>
        Chatbox
        <button style={closeButtonStyle} onClick={toggleChatbox}>
          &times;
        </button>
      </div>
      <div className="messages" style={messagesContainerStyle} ref={chatContainerRef}>
        <h2 className="chat-title" style={{ textAlign: 'center', color: 'aliceblue', textDecoration: 'underline', marginBottom: '5%' }}>Chatbox:</h2>
        <ul className="message-list">
          {guestbookEntries.map((entry, index) => (
            <div key={index} className="message">
              <strong className="username" style={{ color: "red" }}>{entry.name}:</strong> <strong style={{ color: "aliceblue" }}>{entry.message}</strong>
              <div className="date-time" style={{ color: "grey", fontSize:'10px' }}>wysłano :  {new Date(entry.dateAndTime).toLocaleString()}</div>
            </div>
          )).reverse() // Reverse the order when mapping to display newest messages at the bottom
        }
        </ul>
      </div>
      <form className="form" onSubmit={handleSubmit} style={{ padding: '10px' }}>
        <input
          type="text"
          className="username-input"
          placeholder="uzytkownik"
          value={username}
          readOnly
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ marginBottom: '10px', width: '100%', padding: '8px' }}
        />
        <input
          type="text"
          className="message-input"
          placeholder="wiadomość"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          style={{ marginBottom: '10px', width: '100%', padding: '8px' }}
        />
        <button type="submit" className="send-button" style={{ color: 'aliceblue', width: '100%', padding: '10px' }}>
          Wyślij
        </button>
      </form>
    </div>
  );
};

export default Chatbox;
