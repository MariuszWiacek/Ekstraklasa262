import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp, getApps } from 'firebase/app';
import gameData from '../gameData/data.json';

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

if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const database = getDatabase();

const Admin = () => {
  const [submittedData, setSubmittedData] = useState({});
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    const submittedRef = ref(database, 'submittedData');
    const unsubscribe = onValue(submittedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSubmittedData(data);
        // Automatycznie ustaw pierwszego gracza jeśli żaden nie jest wybrany
        const users = Object.keys(data);
        if (users.length > 0 && !selectedUser) {
          setSelectedUser(users[0]);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedUser]);

  const activeUserData = submittedData[selectedUser] || {};
  // Wyciągamy metadane z pierwszego wysłanego zakładu wybranego użytkownika
  const firstBetKey = Object.keys(activeUserData)[0];
  const userMetadata = firstBetKey ? activeUserData[firstBetKey]?.metadata : null;

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#1a1a1a', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#gold' }}>Panel Administratora</h1>

      {/* Wybór użytkownika */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <label style={{ marginRight: '10px', fontSize: '16px' }}>Wybierz gracza:</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{ padding: '8px 15px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold' }}
        >
          {Object.keys(submittedData).map((user) => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Sekcja Metadanych Technicznych */}
          <div style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
            <h3 style={{ marginTop: 0, color: '#007bff', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
              📊 Metadane sesji: {selectedUser}
            </h3>

            {userMetadata ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', fontSize: '14px' }}>
                <div>
                  <strong>🕒 Czas wysłania:</strong>
                  <br />
                  <span style={{ color: '#aaa' }}>{new Date(userMetadata.timestamp).toLocaleString('pl-PL')}</span>
                </div>
                <div>
                  <strong>🌍 Strefa czasowa:</strong>
                  <br />
                  <span style={{ color: '#aaa' }}>{userMetadata.timeZone || 'Brak'}</span>
                </div>
                <div>
                  <strong>🔑 ID Urządzenia (Hash):</strong>
                  <br />
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>{userMetadata.deviceFingerprint || 'Brak'}</span>
                </div>
                <div>
                  <strong>📱 Typ sprzętu:</strong>
                  <br />
                  <span style={{ color: '#aaa' }}>{userMetadata.deviceType || 'Brak'}</span>
                </div>
                <div>
                  <strong>🖥️ Rozdzielczość:</strong>
                  <br />
                  <span style={{ color: '#aaa' }}>{userMetadata.screenResolution || 'Brak'}</span>
                </div>
                <div>
                  <strong>🚀 Tryb uruchomienia:</strong>
                  <br />
                  <span style={{ color: '#aaa' }}>{userMetadata.appMode || 'Brak'}</span>
                </div>
                <div>
                  <strong>🌐 Język systemu:</strong>
                  <br />
                  <span style={{ color: '#aaa' }}>{userMetadata.language || 'Brak'}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#888', margin: 0 }}>Brak zarejestrowanych metadanych dla tego gracza.</p>
            )}
          </div>

          {/* Tabela Przesłanych Typów */}
          <div style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#28a745', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
              ⚽ Przesłane zakłady
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'center' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #555', color: '#ffc107' }}>
                  <th style={{ padding: '8px' }}>Mecz</th>
                  <th style={{ padding: '8px' }}>Typowany wynik</th>
                  <th style={{ padding: '8px' }}>1X2</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(activeUserData).map((gameId) => {
                  const bet = activeUserData[gameId];
                  const game = gameData.find((g) => String(g.id) === String(gameId));

                  return (
                    <tr key={gameId} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '10px' }}>
                        {game ? `${game.home} - ${game.away}` : `Mecz #${gameId}`}
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#007bff' }}>
                        {bet.score || bet.prediction}
                      </td>
                      <td style={{ padding: '10px' }}>{bet.bet}</td>
                      <td style={{ padding: '10px' }}>
                        {bet.isHidden ? '🔒 Ukryty' : '👁️ Widoczny'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
