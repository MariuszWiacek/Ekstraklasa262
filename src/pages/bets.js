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
      message: `Czy na pewno chcesz odblokować profil gracza ${selectedUser} i zmienić konto na tym urządzeniu?`,
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
    if (parts.length !== 2 || parts[0].trim() === '' || parts[1].trim() === '') return '';

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
        title: "Wybierz profil",
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
        title: `Hej, ${selectedUser}`,
        message: "Wszystkie Twoje zakłady w tej kolejce zostały już pomyślnie zapisane.",
        type: "info",
        isConfirm: false
      });
      return;
    }

    update(ref(database, `submittedData/${selectedUser}`), newBetsToSubmit)
      .then(() => {
        setModalConfig({
          show: true,
          title: "Sukces!",
          message: `Dzięki ${selectedUser}! Twoje typy zostały zapisane.`,
          type: "success",
          isConfirm: false
        });
      })
      .catch((error) => {
        console.error('Błąd:', error);
        setModalConfig({
          show: true,
          title: "Błąd zapisu",
          message: `Niestety nie udało się zapisać Twoich danych. Spróbuj ponownie.`,
          type: "error",
          isConfirm: false
        });
      });
  };

  const getTeamLogo = (name) => teamsData[name]?.logo || '';
  const toggleEditableOff = () => setAreInputsEditable(false);
  const toggleEditableOn = () => setAreInputsEditable(true);

  return (
    <div className="fade-in" style={{
      maxWidth: '850px',
      margin: '0 auto',
      padding: '16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#e2e8f0'
    }}>
      {modalConfig.show && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }} onClick={() => setModalConfig({ ...modalConfig, show: false })}>
          <div style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "16px",
            padding: "28px 24px",
            width: "90%",
            maxWidth: "380px",
            textAlign: "center",
            color: "#f8fafc",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              color: modalConfig.type === 'success' ? '#34d399' : modalConfig.type === 'error' ? '#f87171' : '#f8fafc',
              marginTop: 0,
              fontSize: "1.25rem",
              fontWeight: "600",
              letterSpacing: "-0.01em"
            }}>
              {modalConfig.title}
            </h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.5", margin: "16px 0 24px 0" }}>
              {modalConfig.message}
            </p>
            {modalConfig.isConfirm ? (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer"
                }} onClick={modalConfig.onConfirm}>
                  Tak, zmień
                </button>
                <button style={{
                  backgroundColor: "#334155",
                  color: "#cbd5e1",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer"
                }} onClick={() => setModalConfig({ ...modalConfig, show: false })}>
                  Anuluj
                </button>
              </div>
            ) : (
              <button style={{
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                padding: "10px 24px",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer"
              }} onClick={() => setModalConfig({ ...modalConfig, show: false })}>
                OK
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        gap: '12px',
        margin: '20px auto 28px auto',
        padding: '8px 16px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        maxWidth: 'fit-content',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <FontAwesomeIcon icon={faUser} style={{ fontSize: '15px', color: '#38bdf8' }} />

        <select
          disabled={isProfileLocked}
          style={{
            backgroundColor: isProfileLocked ? 'transparent' : '#0f172a',
            color: isProfileLocked ? '#f8fafc' : '#38bdf8',
            fontWeight: '600',
            fontSize: '15px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: isProfileLocked ? 'none' : '1px solid #475569',
            cursor: isProfileLocked ? 'default' : 'pointer',
            outline: 'none',
            appearance: isProfileLocked ? 'none' : 'auto'
          }}
          value={selectedUser}
          onChange={handleUserSelect}
        >
          <option value="">Wybierz użytkownika...</option>
          {Object.keys(usersData).map((user) => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>

        {isProfileLocked ? (
          <button
            onClick={handleUnlockProfile}
            title="Kliknij, aby zmienić użytkownika"
            style={{
              backgroundColor: '#334155',
              color: '#cbd5e1',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FontAwesomeIcon icon={faLock} style={{ fontSize: '11px', color: '#f87171' }} />
            Zmień
          </button>
        ) : (
          selectedUser && (
            <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FontAwesomeIcon icon={faLockOpen} /> Niezablokowane
            </span>
          )
        )}
      </div>

      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '24px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }}>
        <Pagination
          currentPage={currentKolejkaIndex}
          totalPages={kolejki.length}
          onPageChange={(page) => setCurrentKolejkaIndex(page)}
          label="Kolejka"
        />

        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '8px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Gospodarz</th>
                <th style={{ padding: '8px', textAlign: 'center' }}></th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Gość</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Wynik</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>1X2</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Typ</th>
              </tr>
            </thead>
            <tbody>
              {kolejki[currentKolejkaIndex]?.games.map((game) => {
                const isStarted = gameStarted(game.date, game.kickoff);
                return (
                  <React.Fragment key={game.id}>
                    <tr>
                      <td colSpan={7} style={{
                        textAlign: 'left',
                        color: '#fbbf24',
                        fontSize: '11px',
                        padding: '12px 0 2px 8px',
                        fontWeight: '500'
                      }}>
                        {game.date} • {game.kickoff} {game.message ? `• ${game.message}` : ''}
                      </td>
                    </tr>
                    <tr style={{
                      backgroundColor: isStarted ? 'rgba(15, 23, 42, 0.5)' : '#0f172a',
                      opacity: game.disabled ? '0.5' : '1'
                    }}>
                      <td style={{ padding: '10px 8px', color: '#64748b', fontSize: '13px', borderRadius: '8px 0 0 8px', textAlign: 'center' }}>
                        {game.id}
                      </td>

                      <td style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <span>{game.home}</span>
                          <img src={getTeamLogo(game.home)} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                        </div>
                      </td>

                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: '600' }}>-</td>

                      <td style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                          <img src={getTeamLogo(game.away)} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                          <span>{game.away}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>
                        {results[game.id] || '-'}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <select
                          value={game.bet || ''}
                          disabled
                          style={{
                            backgroundColor: 'transparent',
                            color: '#94a3b8',
                            border: 'none',
                            fontWeight: '600',
                            textAlign: 'center',
                            appearance: 'none'
                          }}
                        >
                          <option value="">-</option>
                          <option value="1">1</option>
                          <option value="X">X</option>
                          <option value="2">2</option>
                        </select>
                      </td>

                      <td style={{ textAlign: 'center', borderRadius: '0 8px 8px 0', paddingRight: '8px' }}>
                        <input
                          style={{
                            width: '48px',
                            padding: '4px',
                            borderRadius: '6px',
                            border: '1px solid #334155',
                            backgroundColor: game.score ? (isReadOnly(selectedUser, game.id) ? 'transparent' : '#ffffff') : '#ffffff',
                            color: isReadOnly(selectedUser, game.id) ? '#38bdf8' : '#0f172a',
                            fontWeight: '700',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                          type="text"
                          placeholder={isReadOnly(selectedUser, game.id) ? '✔' : 'x:x'}
                          value={game.score || ''}
                          onChange={(e) => handleScoreChange(game.id, e.target.value)}
                          maxLength={3}
                          readOnly={areInputsEditable && isReadOnly(selectedUser, game.id)}
                          disabled={areInputsEditable && isStarted}
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <label style={{
            color: '#94a3b8',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={isHiddenActive}
              onChange={(e) => setIsHiddenActive(e.target.checked)}
              style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            Ukryj moje typy przed innymi 🔒
          </label>

          <button
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
              width: '100%',
              maxWidth: '280px'
            }}
            onClick={handleSubmit}
          >
            Prześlij typy {isHiddenActive ? '🔒' : ''}
          </button>
        </div>

        {isDataSubmitted && Object.keys(submittedData).map((user) => (
          <ExpandableCard key={user} user={user} bets={submittedData[user]} results={results} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', opacity: 0.3 }}>
        <button style={{ backgroundColor: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', marginRight: '5px' }} onClick={toggleEditableOff}>.</button>
        <button style={{ backgroundColor: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }} onClick={toggleEditableOn}>.</button>
      </div>

      <InstallPWAButton />
    </div>
  );
};

export default Bets;
