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

  // Wyciąganie nazwy miasta ze strefy czasowej
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

  // --- LOGIKA WYKRYWANIA NIEPRAWIDŁOWOŚCI W BIEŻĄCEJ KOLEJCE ---
  const currentWarnings = [];

  // 1. Wspólne urządzenie dla różnych graczy
  pagedGames.forEach((game) => {
    const placedBets = Object.keys(submittedData)
      .filter((user) => submittedData[user]?.[game.id])
      .map((user) => {
        const betData = submittedData[user][game.id];
        const isObject = typeof betData === 'object' && betData !== null;
        return {
          user,
          metadata: isObject ? betData.metadata : null,
        };
      });

    const checkedPairs = new Set();

    placedBets.forEach((b1) => {
      placedBets.forEach((b2) => {
        if (
          b1.user !== b2.user &&
          b1.metadata?.deviceFingerprint &&
          b1.metadata?.deviceFingerprint === b2.metadata?.deviceFingerprint
        ) {
          const pairKey = [b1.user, b2.user].sort().join('-') + `-${game.id}`;
          if (!checkedPairs.has(pairKey)) {
            checkedPairs.add(pairKey);
            currentWarnings.push(
              `Mecz ${game.home} vs ${game.away}: Gracze **${b1.user}** oraz **${b2.user}** wysłali typy z tego samego urządzenia.`
            );
          }
        }
      });
    });
  });

  // 2. Analiza typów przypisanych do konkretnych użytkowników (Strefy czasowe & Przełączanie urządzeń)
  const allUsers = Object.keys(submittedData);

  allUsers.forEach((user) => {
    const userBetsInKolejka = [];

    pagedGames.forEach((game) => {
      const betData = submittedData[user]?.[game.id];
      if (betData && typeof betData === 'object' && betData.metadata) {
        userBetsInKolejka.push({
          gameId: game.id,
          gameTitle: `${game.home} vs ${game.away}`,
          metadata: betData.metadata,
        });
      }
    });

    if (userBetsInKolejka.length > 0) {
      // Wykrywanie zmiany strefy czasowej
      const timeZones = new Set(userBetsInKolejka.map((b) => b.metadata.timeZone).filter(Boolean));
      if (timeZones.size > 1) {
        const cities = Array.from(timeZones).map(getCleanCity).join(', ');
        currentWarnings.push(
          `Gracz **${user}** zmienił strefę czasową / VPN w trakcie obstawiania kolejki (wykryte lokalizacje: ${cities}).`
        );
      }

      // Wykrywanie zbyt szybkiego przełączania urządzeń (< 2 minuty)
      userBetsInKolejka.sort((a, b) => (a.metadata.timestamp || 0) - (b.metadata.timestamp || 0));

      for (let i = 0; i < userBetsInKolejka.length - 1; i++) {
        const bet1 = userBetsInKolejka[i];
        const bet2 = userBetsInKolejka[i + 1];

        if (bet1.metadata.timestamp && bet2.metadata.timestamp) {
          const diffInMs = Math.abs(bet2.metadata.timestamp - bet1.metadata.timestamp);
          const diffInMinutes = diffInMs / (1000 * 60);

          const fp1 = bet1.metadata.deviceFingerprint;
          const fp2 = bet2.metadata.deviceFingerprint;
          const dev1 = bet1.metadata.deviceType;
          const dev2 = bet2.metadata.deviceType;

          const differentDevice = (fp1 && fp2 && fp1 !== fp2) || (dev1 && dev2 && dev1 !== dev2);

          if (diffInMinutes < 2 && differentDevice) {
            currentWarnings.push(
              `Gracz **${user}** zmienił urządzenie w odstępie poniżej 2 minut (${Math.round(
                diffInMinutes * 60
              )} sek.) pomiędzy meczami: ${bet1.gameTitle} (${dev1 || 'Urządzenie 1'}) a ${bet2.gameTitle} (${dev2 || 'Urządzenie 2'}).`
            );
          }
        }
      }
    }
  });

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

      {/* TABELA DO WPROWADZANIA WYNIKÓW */}
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

      {/* SEKCJA SZCZEGÓŁÓW NA DOLE */}
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
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* SEKCJA UWAG I OSTRZEŻEŃ NA SAMYM DOLE */}
        <div
          style={{
            marginTop: '25px',
            backgroundColor: '#211212',
            border: '1px solid #5c2424',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <h4 style={{ color: '#ff4d4d', margin: '0 0 8px 0', fontSize: '14px' }}>
            ⚠️ Uwagi i Ostrzeżenia Systemowe:
          </h4>

          {currentWarnings.length > 0 ? (
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#ffc107', fontSize: '12px' }}>
              {currentWarnings.map((warn, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: warn.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              ))}
            </ul>
          ) : (
            <div style={{ color: '#28a745', fontSize: '12px' }}>
              Brak zastrzeżeń. Wszystkie typy w tej kolejce wyglądają w pełni prawidłowo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
