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
  const gamesPerPage = 9; // Number of games per page

  const getTeamLogo = (teamName) => {
    const team = teamsData[teamName];
    return team ? team.logo : '';
  };

  useEffect(() => {
    setGames(gameData);
  }, [gameData]);

  useEffect(() => {
    const resultsRef = ref(getDatabase(), 'results');
    onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      setResultsInput(data || {});
    });
  }, []);

  useEffect(() => {
    const submittedDataRef = ref(getDatabase(), 'submittedData');
    onValue(submittedDataRef, (snapshot) => {
      const data = snapshot.val();
      setSubmittedData(data || {});
    });
  }, []);

  useEffect(() => {
    const nonBettorsData = {};
    const allUsers = Object.keys(submittedData);

    allUsers.forEach((user) => {
      games.forEach((game) => {
        if (!submittedData[user][game.id]) {
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
    setResultsInput((prevResults) => ({
      ...prevResults,
      [gameId]: result,
    }));
  };

  const handleSubmitResults = () => {
    set(ref(getDatabase(), 'results'), resultsInput)
      .then(() => {
        alert('Wyniki zostały pomyślnie przesłane!');
      })
      .catch((error) => {
        console.error('Error submitting results:', error);
        alert('Wystąpił błąd podczas przesyłania wyników. Spróbuj ponownie.');
      });
  };

  // Calculate games to be displayed based on the current page
  const getPagedGames = (page) => {
    const startIdx = page * gamesPerPage;
    return games.slice(startIdx, startIdx + gamesPerPage);
  };

  // Calculate total pages
  const totalPages = Math.ceil(games.length / gamesPerPage);

  // Set current page to the last page when component is mounted
  useEffect(() => {
    if (games.length > 0) {
      const now = new Date();

      // Find the index of the next game based on current date and time
      const nextGameIndex = gameData.findIndex(game => new Date(`${game.date}T${game.kickoff}:00+02:00`) > now);

      // If a next game exists, calculate which "kolejka" it belongs to
      if (nextGameIndex !== -1) {
        const kolejkaIndex = Math.floor(nextGameIndex / gamesPerPage);
        setCurrentKolejkaIndex(kolejkaIndex);
      } else {
        // If no next game found (all games have been played), set to last page
        const lastPage = Math.floor((games.length - 1) / gamesPerPage);
        setCurrentKolejkaIndex(lastPage);
      }
    }
  }, [games]);

  if (!authenticated) {
    return (
      <div style={{ backgroundColor: '#212529ab', color: 'aliceblue', padding: '20px', textAlign: 'center', marginTop: '5%' }}>
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

  return (
    <div style={{ backgroundColor: '#212529ab', color: 'aliceblue', padding: '20px', textAlign: 'center', marginTop: '5%' }}>
      <h2 className="text-xl font-bold mb-4">Wprowadź wyniki:</h2>

      <Pagination
        currentPage={currentKolejkaIndex}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentKolejkaIndex(page)}
        label="Kolejka"
      />
      <table
        style={{
          width: '100%',
          border: '0.5px solid #444',
          borderCollapse: 'collapse',
          marginTop: '5%',
        }}
      >
        
        <thead>
          <tr>
            <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}></th>
            <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}></th>
            <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}></th>
            <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}>Wynik</th>
          </tr>
        </thead>
        <tbody>
          {getPagedGames(currentKolejkaIndex).map((game, index) => (
            <React.Fragment key={index}>
              <tr>
                <td colSpan="12" className="date" style={{ textAlign: 'left', color: 'gold', fontSize: '10px', paddingLeft: '10%' }}>
                  {game.date} - {game.kickoff}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <td style={{ textAlign: 'center', paddingRight: '10px', fontSize: '20px' }}>
                  <img src={getTeamLogo(game.home)} alt={`${game.home} logo`} className="logo" /> {game.home}
                </td>
                <td style={{ textAlign: 'center', fontSize: '20px' }}>-</td>
                <td style={{ textAlign: 'left', paddingLeft: '10px', fontSize: '20px' }}>
                  <img src={getTeamLogo(game.away)} alt={`${game.away} logo`} className="logo" /> {game.away}
                </td>
                <td style={{ textAlign: 'center', fontSize: '20px' }}>
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
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                    }}
                  />
                </td>
              </tr>
              {/* Display Non-Bettors for this Game */}
              {nonBettors[game.id]?.length === Object.keys(submittedData).length ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'green' }}>
                    <strong>Nikt jeszcze nie obstawił</strong>
                  </td>
                </tr>
              ) : nonBettors[game.id]?.length > 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'red' }}>
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
          padding: '10px 20px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          marginTop: '10px',
        }}
      >
        Zatwierdź wyniki
      </button>
    </div>
  );
};

export default Admin;
