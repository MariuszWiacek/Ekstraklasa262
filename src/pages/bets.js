import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';

import usersData from '../gameData/users.json';
import gameData from '../gameData/data.json';
import teamsData from '../gameData/teams.json';

import ExpandableCard from '../components/expandableCard';
import Pagination from '../components/Pagination';
import InstallPWAButton from '../components/PWA';

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
const auth = getAuth();
const database = getDatabase();

const groupGamesIntoKolejki = (games = []) => {
  const kolejki = [];
  games.forEach((game, index) => {
    const currentKolejkaId = Math.floor(index / 9) + 1;
    game.kolejkaId = currentKolejkaId;
    if (!kolejki[currentKolejkaId - 1]) {
      kolejki[currentKolejkaId - 1] = { id: currentKolejkaId, games: [] };
    }
    kolejki[currentKolejkaId - 1].games.push(game);
  });
  return kolejki;
};

const Bets = () => {
  const [kolejki, setKolejki] = useState(() => groupGamesIntoKolejki(gameData));
  const [selectedUser, setSelectedUser] = useState('');
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [submittedData, setSubmittedData] = useState({});
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [results, setResults] = useState({});
  const [currentKolejkaIndex, setCurrentKolejkaIndex] = useState(0);
  const [areInputsEditable, setAreInputsEditable] = useState(true);
  const [isHiddenActive, setIsHiddenActive] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    isConfirm: false,
    onConfirm: null
  });

  useEffect(() => {
    const claimedUser = localStorage.getItem('claimedUser');
    if (claimedUser) {
      setSelectedUser(claimedUser);
      setIsProfileLocked(true);
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user?.displayName && !claimedUser) {
        setSelectedUser(user.displayName);
      }
    });

    const submittedRef = ref(database, 'submittedData');
    const unsubscribeSubmitted = onValue(submittedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSubmittedData(data);
        setIsDataSubmitted(true);
      }
    });

    const resultsRef = ref(database, 'results');
    const unsubscribeResults = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setResults(data);
    });

    const now = new Date();
    const nextGameIndex = gameData.findIndex(
      (game) => new Date(`${game.date}T${game.kickoff}:00+02:00`) > now
    );
    setCurrentKolejkaIndex(nextGameIndex !== -1 ? Math.floor(nextGameIndex / 9) : 0);

    return () => {
      unsubscribeAuth();
      unsubscribeSubmitted();
      unsubscribeResults();
    };
  }, []);

  const handleUserSelect = (e) => {
    const newUser = e.target.value;
    setSelectedUser(newUser);
    if (newUser) {
      localStorage.setItem('claimedUser', newUser);
      setIsProfileLocked(true);
    }
  };

  const handleUnlockProfile = () => {
    setModalConfig({
      show: true,
      title: "Zmiana Profilu",
      message: `Czy na pewno chcesz odblokować profil dla gracza ${selectedUser} i zmienić użytkownika na tym urządzeniu?`,
      type: "confirm",
      isConfirm: true,
      onConfirm: () => {
        localStorage.removeItem('claimedUser');
        setIsProfileLocked(false);
        setSelectedUser('');
        setModalConfig((prev) => ({ ...prev, show: false }));
      }
    });
  };

  const isReadOnly = (user, gameId) => Boolean(submittedData[user] && submittedData[user][gameId]);

  const gameStarted = (gameDate, gameKickoff) => {
    if (!gameDate || !gameKickoff) return false;
    const now = DateTime.now().setZone('Europe/Warsaw');
    const kickoff = DateTime.fromISO(`${gameDate}T${gameKickoff}:00`, { zone: 'Europe/Warsaw' });
    return now >= kickoff;
  };

  const autoDetectBetType = (score) => {
    if (!score || !score.includes(':')) return '';

    const parts = score.split(':');

    if (parts.length !== 2 || parts[0].trim() === '' || parts[1].trim() === '') {
      return '';
    }

    const home = Number(parts[0]);
    const away = Number(parts[1]);

    if (isNaN(home) || isNaN(away)) return '';

    if (home === away) return 'X';
    return home > away ? '1' : '2';
  };

  const handleScoreChange = (gameId, scoreInput) => {
    const cleaned = scoreInput.replace(/[^0-9:]/g, '');
    const formatted = cleaned.replace(/^(?:(\d))([^:]*$)/, '$1:$2');
    const updated = kolejki.map((kolejka) => ({
      ...kolejka,
      games: kolejka.games.map((game) =>
        game.id === gameId
          ? { ...game, score: formatted, bet: autoDetectBetType(formatted) }
          : game
      )
    }));
    setKolejki(updated);
  };

  const handleSubmit = () => {
    if (!selectedUser) {
      setModalConfig({
        show: true,
        title: "Brak użytkownika",
        message: "Proszę wybrać użytkownika przed wysłaniem zakładów.",
        type: "info",
        isConfirm: false
      });
      return;
    }

    const currentKolejka = kolejki[currentKolejkaIndex];
    const userSubmittedBets = submittedData[selectedUser] || {};

    const newBetsToSubmit = currentKolejka?.games.reduce((acc, game) => {
      if (game.score && !userSubmittedBets[game.id]) {
        acc[game.id] = {
          home: game.home,
          away: game.away,
          score: game.score,
          bet: autoDetectBetType(game.score),
          kolejkaId: game.kolejkaId,
          isHidden: isHiddenActive
        };
      }
      return acc;
    }, {}) || {};

    if (Object.keys(newBetsToSubmit).length === 0) {
      setModalConfig({
        show: true,
        title: `Hej, ${selectedUser}!`,
        message: "Wszystkie Twoje zakłady w tej kolejce zostały już wcześniej przesłane.",
        type: "info",
        isConfirm: false
      });
      return;
    }

    update(ref(database, `submittedData/${selectedUser}`), newBetsToSubmit)
      .then(() => {
        setModalConfig({
          show: true,
          title: `Dzięki, ${selectedUser}!`,
          message: "Twoje zakłady zostały pomyślnie przesłane!",
          type: "success",
          isConfirm: false
        });
      })
      .catch((error) => {
        console.error('Błąd:', error);
        setModalConfig({
          show: true,
          title: "Błąd",
          message: `${selectedUser}, niestety nie udało się zapisać Twoich danych. Spróbuj ponownie.`,
          type: "error",
          isConfirm: false
        });
      });
  };

  const getTeamLogo = (name) => teamsData[name]?.logo || '';
  const toggleEditableOff = () => setAreInputsEditable(false);
  const toggleEditableOn = () => setAreInputsEditable(true);

  const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
  };
  const modalStyle = {
    background: "#015f01a9", padding: "25px", borderRadius: "20px", width: "85%", maxWidth: "350px", textAlign: "center", color: "white"
  };
  const modalButtonStyle = {
    backgroundColor: "#DC3545", color: "white", border: "none", padding: "10px 25px", borderRadius: "15px", fontWeight: "bold", marginTop: "15px", cursor: "pointer", margin: "5px"
  };
  const cancelButtonStyle = {
    backgroundColor: "#6c757d", color: "white", border: "none", padding: "10px 25px", borderRadius: "15px", fontWeight: "bold", marginTop: "15px", cursor: "pointer", margin: "5px"
  };

  const logoStyle = {
    width: '24px',
    height: '24px',
    objectFit: 'contain'
  };

  return (
    <div className="fade-in" style={{ textAlign: 'center', color: 'yellow' }}>
      {modalConfig.show && (
        <div style={modalOverlayStyle} onClick={() => setModalConfig({ ...modalConfig, show: false })}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: modalConfig.type === 'success' ? '#28a745' : '#fff', marginTop: 0 }}>
              {modalConfig.title}
            </h2>
            <p style={{ fontSize: "16px", lineHeight: "1.4" }}>{modalConfig.message}</p>
            {modalConfig.isConfirm ? (
              <div>
                <button style={modalButtonStyle} onClick={modalConfig.onConfirm}>
                  Tak, zmień
                </button>
                <button style={cancelButtonStyle} onClick={() => setModalConfig({ ...modalConfig, show: false })}>
                  Anuluj
                </button>
              </div>
            ) : (
              <button style={modalButtonStyle} onClick={() => setModalConfig({ ...modalConfig, show: false })}>
                OK
              </button>
            )}
          </div>
        </div>
      )}

      {/* Prominent High-Visibility User Banner */}
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        margin: '15px auto',
        padding: '12px 20px',
        backgroundColor: '#1b2a4a',
        border: selectedUser ? '2px solid #00d2ff' : '2px dashed #ffc107',
        borderRadius: '16px',
        boxShadow: selectedUser ? '0 0 15px rgba(0, 210, 255, 0.4)' : 'none',
        maxWidth: '90%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FontAwesomeIcon icon={faUser} style={{ fontSize: '18px', color: '#00d2ff' }} />
          <span style={{ fontSize: '12px', color: '#a0c4ff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
            Aktywny Gracze:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            disabled={isProfileLocked}
            style={{
              backgroundColor: isProfileLocked ? '#101726' : '#ffffff',
              color: isProfileLocked ? '#00d2ff' : '#000000',
              fontWeight: 'bold',
              fontSize: '18px',
              fontFamily: 'Rubik, sans-serif',
              padding: '6px 14px',
              borderRadius: '8px',
              border: isProfileLocked ? '1px solid #00d2ff' : '1px solid #ccc',
              cursor: isProfileLocked ? 'default' : 'pointer',
              textAlign: 'center'
            }}
            value={selectedUser}
            onChange={handleUserSelect}
          >
            <option value="">-- Wybierz gracza --</option>
            {Object.keys(usersData).map((user) => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>

          {isProfileLocked ? (
            <button
              onClick={handleUnlockProfile}
              title="Kliknij, aby zmienić profil"
              style={{
                backgroundColor: '#dc3545',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
              }}
            >
              <FontAwesomeIcon icon={faLock} style={{ marginRight: '4px' }} /> Zmień
            </button>
          ) : (
            selectedUser && (
              <span style={{ fontSize: '12px', color: '#ffc107', fontWeight: 'bold' }}>
                <FontAwesomeIcon icon={faLockOpen} /> Nie zablokowano
              </span>
            )
          )}
        </div>
      </div>

      <div style={{ backgroundColor: '#212529ab', color: 'aliceblue', padding: '20px', textAlign: 'center', marginBottom: '10px', marginTop: '1%' }}>
        <Pagination
          currentPage={currentKolejkaIndex}
          totalPages={kolejki.length}
          onPageChange={(page) => setCurrentKolejkaIndex(page)}
          label="Kolejka"
        />

        <table style={{ width: '100%', border: '0.5px solid #444', borderCollapse: 'collapse', marginTop: '5%' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '0.5px solid #444' }}></th>
              <th style={{ borderBottom: '0.5px solid #444', textAlign: 'right', paddingRight: '10px' }}>Gospodarz</th>
              <th style={{ borderBottom: '0.5px solid #444' }}></th>
              <th style={{ borderBottom: '0.5px solid #444', textAlign: 'left', paddingLeft: '10px' }}>Gość</th>
              <th style={{ borderBottom: '0.5px solid #444' }}>Wynik</th>
              <th style={{ borderBottom: '0.5px solid #444' }}>1X2</th>
              <th style={{ borderBottom: '0.5px solid #444' }}>Typ</th>
            </tr>
          </thead>
          <tbody>
            {kolejki[currentKolejkaIndex]?.games.map((game) => (
              <React.Fragment key={game.id}>
                <tr style={{ opacity: game.disabled ? '0.5' : '1', backgroundColor: gameStarted(game.date, game.kickoff) ? '#214029ab' : 'transparent' }}>
                  <td colSpan="12" className="date" style={{ textAlign: 'left', color: 'gold', fontSize: '10px', paddingLeft: '10%' }}>
                    &nbsp;&nbsp;&nbsp; {game.date} &nbsp;&nbsp;&nbsp; {game.kickoff} &nbsp;&nbsp;&nbsp; {game.message}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #444', opacity: game.disabled ? '0.5' : '1', backgroundColor: gameStarted(game.date, game.kickoff) ? '#214029ab' : 'transparent' }}>
                  <td><p style={{ color: 'grey', margin: 0 }}>{game.id}.</p></td>

                  <td style={{ fontSize: '16px', paddingRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <span>{game.home}</span>
                      <img src={getTeamLogo(game.home)} className="logo" alt="" style={logoStyle} />
                    </div>
                  </td>

                  <td style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>-</td>

                  <td style={{ fontSize: '16px', paddingLeft: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                      <img src={getTeamLogo(game.away)} className="logo" alt="" style={logoStyle} />
                      <span>{game.away}</span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center', fontSize: '18px' }}>{results[game.id]}</td>
                  <td style={{ textAlign: 'center' }}>
                    <select value={game.bet || ''} disabled>
                      <option value="">-</option>
                      <option value="1">1</option>
                      <option value="X">X</option>
                      <option value="2">2</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      style={{
                        width: '50px',
                        backgroundColor: game.score ? (isReadOnly(selectedUser, game.id) ? 'transparent' : 'white') : 'white',
                        color: 'red',
                        textAlign: 'center'
                      }}
                      type="text"
                      placeholder={isReadOnly(selectedUser, game.id) ? '✔️' : 'x:x'}
                      value={game.score || ''}
                      onChange={(e) => handleScoreChange(game.id, e.target.value)}
                      maxLength="3"
                      readOnly={areInputsEditable && isReadOnly(selectedUser, game.id)}
                      disabled={areInputsEditable && gameStarted(game.date, game.kickoff)}
                    />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '15px' }}>
          <label style={{ color: 'white', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isHiddenActive}
              onChange={(e) => setIsHiddenActive(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Ukryj moje typy 🔒
          </label>
        </div>

        <button
          style={{ backgroundColor: '#DC3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'inline-block', margin: '10px', fontSize: '14px', width: '60%' }}
          onClick={handleSubmit}
        >
          Prześlij {isHiddenActive ? '🔒' : ''}
        </button>

        {isDataSubmitted && Object.keys(submittedData).map((user) => (
          <ExpandableCard key={user} user={user} bets={submittedData[user]} results={results} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 1px', border: 'none', borderRadius: '5px', marginRight: '10px', cursor: 'pointer' }} onClick={toggleEditableOff}>..</button>
        <button style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 1px', border: 'none', borderRadius: '5px', cursor: 'pointer' }} onClick={toggleEditableOn}>..</button>
      </div>

      <InstallPWAButton />
    </div>
  );
};

export default Bets;
