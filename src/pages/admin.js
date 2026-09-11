import React, { useState, useEffect } from 'react';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import gameData from '../gameData/data.json';
import teamsData from '../gameData/teams.json';
import Pagination from '../components/Pagination';

const Admin = () => {
  const [games, setGames] = useState([]);
  const [resultsInput, setResultsInput] = useState({});
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [currentKolejkaIndex, setCurrentKolejkaIndex] = useState(0);
  const [submittedData, setSubmittedData] = useState({});
  const [nonBettors, setNonBettors] = useState({});

  const gamesPerPage = 9;

  const getTeamLogo = (teamName) => {
    const team = teamsData[teamName];
    return team ? team.logo : '';
  };

  // Funkcja pomocnicza do wyciągania tylko nazwy miasta ze strefy czasowej (np. Europe/Warsaw -> Warszawa)
  const getCleanCity = (timeZone) => {
    if (!timeZone) return 'Brak lokalizacji';
    const rawCity = timeZone.includes('/') ? timeZone.split('/')[1] : timeZone;
    return rawCity.replace(/_/g, ' ');
  };

  // Load games
  useEffect(() => {
    setGames(gameData);
  }, []);

  // Load existing results
  useEffect(() => {
    const resultsRef = ref(getDatabase(), 'results');
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      setResultsInput(data || {});
    });
    return () => unsubscribe();
  }, []);

  // Load submitted bets
  useEffect(() => {
    const submittedDataRef = ref(getDatabase(), 'submittedData');
    const unsubscribe = onValue(submittedDataRef, (snapshot) => {
      const data = snapshot.val();
      setSubmittedData(data || {});
    });
    return () => unsubscribe();
  }, []);

  // Calculate non bettors
  useEffect(() => {
    const nonBettorsData = {};
    const allUsers = Object.keys(submittedData);

    allUsers.forEach((user) => {
      games.forEach((game) => {
        const userBet = submittedData[user]?.[game.id];
        if (!userBet) {
          if (!nonBettorsData[game.id]) {
            nonBettorsData[game.id] = [];
          }
          nonBettorsData[game.id].push(user);
        }
      });
    });

    setNonBettors(nonBettorsData);
  }, [submittedData, games]);

  const handlePasswordSubmit = () => {
    if (password === 'maniek123') {
      setAuthenticated(true);
    } else {
      alert('Nieprawidłowe hasło. Spróbuj ponownie.');
    }
  };

  const handleResultChange = (gameId, result) => {
    setResultsInput((prev) => ({
      ...prev,
      [gameId]: result,
    }));
  };

  const handleSubmitResults = () => {
    set(ref(getDatabase(), 'results'), resultsInput)
      .then(() => {
        alert('Wyniki zostały pomyślnie przesłane!');
      })
      .catch((error) => {
        console.error(error);
        alert('Wystąpił błąd podczas przesyłania wyników.');
      });
  };

  const getPagedGames = (page) => {
    const startIdx = page * gamesPerPage;
    return games.slice(startIdx, startIdx + gamesPerPage);
  };

  const totalPages = Math.ceil(games.length / gamesPerPage);

  // Select current kolejka automatically
  useEffect(() => {
    if (games.length > 0) {
      const now = new Date();
      const nextGameIndex = gameData.findIndex((game) => {
        const gameDate = new Date(`${game.date}T${game.kickoff}:00+02:00`);
        return gameDate > now;
      });

      if (nextGameIndex !== -1) {
        const kolejkaIndex = Math.floor(nextGameIndex / gamesPerPage);
        setCurrentKolejkaIndex(kolejkaIndex);
      } else {
        const lastPage = Math.floor((games.length - 1) / gamesPerPage);
        setCurrentKolejkaIndex(lastPage);
      }
    }
  }, [games]);

  if (!authenticated) {
    return (
      <div
        style={{
          backgroundColor: '#212529ab',
          color: 'aliceblue',
          padding: '20px',
          textAlign: 'center',
          marginTop: '5%',
        }}
      >
        <h2 className="text-xl font-bold mb-4">Wprowadź hasło:</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 text-center border border-gray-300 rounded-md"
        />
        <button
          onClick={handlePasswordSubmit}
          style={{
            backgroundColor: 'red',
            color: 'white',
            fontWeight: 'bold',
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '10px',
          }}
        >
          Zaloguj
        </button>
      </div>
    );
  }

  const pagedGames = getPagedGames(currentKolejkaIndex);

  return (
    <div
      style={{
        backgroundColor: '#212529ab',
        color: 'aliceblue',
        padding: '20px',
        textAlign: 'center',
        marginTop: '5%',
      }}
    >
      <h2 className="text-xl font-bold mb-4">Wprowadź wyniki:</h2>

      <Pagination
        currentPage={currentKolejkaIndex}
        totalPages={totalPages}
        onPageChange={setCurrentKolejkaIndex}
        label="Kolejka"
      />

      {/* GŁÓWNA TABELA DO WPROWADZANIA WYNIKÓW */}
      <table
        style={{
          width: '100%',
          border: '0.5px solid #444',
          borderCollapse: 'collapse',
          marginTop: '20px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#111' }}>
            <th>Mecz</th>
            <th>Gospodarz</th>
            <th>-</th>
            <th>Gość</th>
            <th>Wynik</th>
          </tr>
        </thead>

        <tbody>
          {pagedGames.map((game, index) => (
            <React.Fragment key={index}>
              <tr>
                <td
                  colSpan="5"
                  className="date"
                  style={{
                    textAlign: 'left',
                    color: 'gold',
                    fontSize: '11px',
                    paddingLeft: '10px',
                    backgroundColor: '#1a1d20',
                  }}
                >
                  {game.date} - {game.kickoff}
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid #444' }}>
                <td style={{ fontSize: '12px', color: '#888' }}>#{game.id}</td>
                <td style={{ textAlign: 'center' }}>
                  <img src={getTeamLogo(game.home)} alt="" className="logo" style={{ marginRight: '5px' }} />
                  {game.home}
                </td>

                <td>-</td>

                <td>
                  <img src={getTeamLogo(game.away)} alt="" className="logo" style={{ marginRight: '5px' }} />
                  {game.away}
                </td>

                <td>
                  <input
                    type="text"
                    placeholder="x:x"
                    value={resultsInput[game.id] || ''}
                    onChange={(e) => handleResultChange(game.id, e.target.value)}
                    maxLength="3"
                    style={{
                      width: '50px',
                      color: 'blue',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                  />
                </td>
              </tr>

              {/* Status nieobstawiających */}
              {nonBettors[game.id]?.length === Object.keys(submittedData).length ? (
                <tr>
                  <td colSpan="5" style={{ color: 'green', fontSize: '11px', padding: '4px' }}>
                    <strong>Nikt jeszcze nie obstawił</strong>
                  </td>
                </tr>
              ) : nonBettors[game.id]?.length > 0 ? (
                <tr>
                  <td colSpan="5" style={{ color: '#ff6b6b', fontSize: '11px', padding: '4px' }}>
                    <strong>Nie obstawili: {nonBettors[game.id].join(', ')}</strong>
                  </td>
                </tr>
              ) : null}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSubmitResults}
        style={{
          backgroundColor: 'green',
          color: 'white',
          fontWeight: 'bold',
          padding: '12px 24px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          marginTop: '20px',
          marginBottom: '40px',
        }}
      >
        Zatwierdź wyniki
      </button>

      {/* SEKCJA SZCZEGÓŁÓW I METADANYCH NA DOLE */}
      <div
        style={{
          marginTop: '40px',
          borderTop: '2px solid #555',
          paddingTop: '20px',
          textAlign: 'left',
          backgroundColor: '#16191c',
          padding: '15px',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ color: '#00aaff', marginBottom: '15px', fontSize: '16px' }}>
          📊 Podgląd typów, lokalizacji i urządzeń dla bieżącej kolejki
        </h3>

        {pagedGames.map((game) => {
          const placedBets = Object.keys(submittedData)
            .filter((user) => submittedData[user]?.[game.id])
            .map((user) => {
              const betData = submittedData[user][game.id];
              const isObject = typeof betData === 'object' && betData !== null;
              return {
                user,
                prediction: isObject ? betData.prediction : betData,
                metadata: isObject ? betData.metadata : null,
              };
            });

          if (placedBets.length === 0) return null;

          return (
            <div
              key={game.id}
              style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#212529',
                borderRadius: '6px',
                borderLeft: '4px solid #00aaff',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'gold', marginBottom: '6px' }}>
                {game.home} vs {game.away} ({game.date})
              </div>

              <ul style={{ listStyleType: 'none', paddingLeft: '0', margin: '0' }}>
                {placedBets.map((b, i) => {
                  const meta = b.metadata;
                  const formattedTime = meta?.timestamp
                    ? new Date(meta.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
                    : 'Brak godz.';

                  const city = getCleanCity(meta?.timeZone);
                  const deviceType = meta?.deviceType || 'Urządzenie';
                  const isPWA = meta?.appMode === 'Aplikacja PWA';
                  const deviceHash = meta?.deviceFingerprint;

                  // Wykrywanie czy ktoś użył tego samego urządzenia dla tego meczu
                  const duplicateUser = placedBets.find(
                    (other) =>
                      other.user !== b.user &&
                      other.metadata?.deviceFingerprint &&
                      other.metadata?.deviceFingerprint === deviceHash
                  );

                  return (
                    <li
                      key={i}
                      style={{
                        fontSize: '12px',
                        padding: '4px 0',
                        borderBottom: '1px solid #333',
                        color: '#ccc',
                      }}
                    >
                      <strong style={{ color: '#fff' }}>{b.user}</strong> obstawił:{' '}
                      <span style={{ color: '#ffc107', fontWeight: 'bold' }}>{b.prediction}</span> |{' '}
                      <span style={{ color: '#aaa' }}>
                        🕒 godz. {formattedTime} | 📍 {city} | 📱 {deviceType} {isPWA ? '(Aplikacja)' : '(Przeglądarka)'}
                      </span>
                      {duplicateUser && (
                        <span
                          style={{
                            marginLeft: '8px',
                            color: '#ff4d4d',
                            fontWeight: 'bold',
                            backgroundColor: '#330000',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          ⚠️ Wspólne urządzenie z: {duplicateUser.user}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Admin;
