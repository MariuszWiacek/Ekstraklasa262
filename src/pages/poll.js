import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';

const firebaseConfig = {
  apiKey: "AIzaSyB3AOrOzAQ-WVMjeZ3ayNwklR7axBgXJ0I",
  authDomain: "wiosna26-951d6.firebaseapp.com",
  databaseURL: "https://wiosna26-951d6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wiosna26-951d6",
  storageBucket: "wiosna26-951d6.firebasestorage.app",
  messagingSenderId: "58145083288",
  appId: "1:58145083288:web:f2d813d31a64bcdfcba5ed",
  measurementId: "G-0R5JLD75SW"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const SignupPage = ({ onClose }) => {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const playersRef = ref(database, "players");
    onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const playerList = Object.values(data);
        setPlayers(playerList);
      }
    });
  }, []);

  const handleSignup = () => {
    if (name.trim() === "") return;
    const playersRef = ref(database, "players");
    push(playersRef, name.trim());
    setName("");
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <button onClick={onClose} style={closeButtonStyle}>X</button>
        <h8 style={headingStyle}>
          Zapisy ! Typer Ekstraklasa Wiosna 2026 <br /> udowodnij, że znasz się na piłce!
        </h8>
        <hr />
        <p style={descriptionStyle}>
          Zrzutka po ok. 60 <FontAwesomeIcon icon={faCoins} style={{ color: "#f0c419" }} />, w zależności od ilości graczy.<br /><br />
          Zapisy do 30.1
        </p>
        <input
          type="text"
          placeholder="Twoje imię/nick"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleSignup} style={buttonStyle}>Zapisz się</button>

        <hr style={{ margin: "20px 0", borderColor: "#ddd" }} />
        <h8 style={{ color: "#444" }}>
          Ilość zapisanych osób: <span style={{ color: "green" }}>{players.length}</span>
        </h8>
        <hr />
        <h8 style={{ color: "#444" }}>Lista zapisanych graczy:</h8>
        <ul style={horizontalListStyle}>
          {players.map((player, index) => (
            <li key={index} style={playerStyle}>{player}</li>
          ))}
        </ul>
        <hr />
      </div>
    </div>
  );
};

// --- Styles ---
const containerStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "linear-gradient(to bottom right, #141e30, #243b55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
  padding: "20px",
};

const boxStyle = {
  background: "linear-gradient(135deg, #ffffff, #f4f4f4)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  borderRadius: "12px",
  padding: "25px",
  maxWidth: "600px", // widened for horizontal list
  width: "100%",
  textAlign: "center",
  position: "relative",
};

const closeButtonStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "30px",
  height: "30px",
  cursor: "pointer",
  fontWeight: "bold",
};

const headingStyle = {
  color: "purple",
  fontWeight: "bolder",
  marginBottom: "10px",
  fontSize: "20px",
};

const descriptionStyle = {
  fontSize: "16px",
  color: "#555",
  marginBottom: "20px",
};

const inputStyle = {
  padding: "10px",
  width: "80%",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const buttonStyle = {
  padding: "10px 24px",
  backgroundColor: "#1e90ff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "16px",
  cursor: "pointer",
  transition: "background 0.3s",
};

const horizontalListStyle = {
  listStyle: "none",
  padding: "10px 0",
  margin: "10px 0",
  display: "flex",
  flexDirection: "row",
  overflowX: "auto",           // <-- Enables horizontal scrolling
  whiteSpace: "nowrap",
  gap: "10px",
  maxWidth: "100%",            // Optional, ensures it stays inside container
};


const playerStyle = {
  backgroundColor: "#ecf0f1",
  padding: "8px 12px",
  borderRadius: "20px",
  fontWeight: "bold",
  color: "#2c3e50",
};

export default SignupPage;
