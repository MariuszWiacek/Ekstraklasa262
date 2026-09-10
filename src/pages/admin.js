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

  useEffect(() => {
    const submittedRef = ref(database, 'submittedData');
    const unsubscribe = onValue(submittedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSubmittedData(data);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '10px', fontSize: '11px', color: '#fff' }}>
      <h2 style={{ textAlign: 'center', fontSize: '14px', marginBottom: '15px' }}>Panel Administratora</h2>

      {Object.keys(submittedData).map((user) => {
        const userBets = submittedData[user] || {};
        const firstBetKey = Object.keys(userBets)[0];
        const metadata = firstBetKey ? userBets[firstBetKey]?.metadata : null;

        return (
          <div 
            key={user} 
            style={{ 
              backgroundColor: '#1e1e1e', 
              border: '1px solid #333', 
              borderRadius: '8px', 
              padding: '10px', 
              marginBottom: '15px' 
            }}
          >
            <h3 style={{ color: 'gold', fontSize: '12px', margin: '0 0 8px 0', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              Gracz: {user}
            </h3>

            {/* Tabela typów ze zmniejszoną czcionką */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
              <thead>
                <tr style={{ color: '#aaa', borderBottom: '1px solid #444', textAlign: 'left' }}>
                  <th style={{ padding: '3px' }}>Mecz</th>
                  <th style={{ padding: '3px', textAlign: 'center' }}>Typ</th>
                  <th style={{ padding: '3px', textAlign: 'center' }}>1X2</th>
                  <th style={{ padding: '3px', textAlign: 'center' }}>Widoczność</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(userBets).map((gameId) => {
                  const bet = userBets[gameId];
                  const game = gameData.find((g) => String(g.id) === String(gameId));

                  return (
                    <tr key={gameId} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <td style={{ padding: '3px' }}>
                        {game ? `${game.home} - ${game.away}` : `Mecz #${gameId}`}
                      </td>
                      <td style={{ padding: '3px', textAlign: 'center', fontWeight: 'bold', color: '#007bff' }}>
                        {bet.score || bet.prediction}
                      </td>
                      <td style={{ padding: '3px', textAlign: 'center' }}>{bet.bet}</td>
                      <td style={{ padding: '3px', textAlign: 'center' }}>
                        {bet.isHidden ? '🔒' : '👁️'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Dolny panel z metadanymi technologicznymi i czasem */}
            {metadata ? (
              <div style={{ 
                backgroundColor: '#121212', 
                padding: '6px 8px', 
                borderRadius: '5px', 
                fontSize: '9px', 
                color: '#888',
                lineHeight: '1.4'
              }}>
                <div><strong>📅 Czas:</strong> {new Date(metadata.timestamp).toLocaleString('pl-PL')}</div>
                <div><strong>🌍 Strefa czasowa:</strong> {metadata.timeZone || 'Brak'}</div>
                <div><strong>🔑 Hash Sprzętu:</strong> <span style={{ color: '#28a745' }}>{metadata.deviceFingerprint || 'Brak'}</span></div>
                <div><strong>💻 Urządzenie:</strong> {metadata.deviceType || 'Brak'} ({metadata.screenResolution || 'Brak'})</div>
                <div><strong>🚀 Tryb:</strong> {metadata.appMode || 'Brak'} | <strong>Język:</strong> {metadata.language || 'Brak'}</div>
              </div>
            ) : (
              <div style={{ fontSize: '9px', color: '#666', italic: 'true' }}>Brak zgromadzonych metadanych.</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Admin;
