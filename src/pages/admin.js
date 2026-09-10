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
        const gameDate = new Date(
          `${game.date}T${game.kickoff}:00+02:00`
        );

        return gameDate > now;
      });


      if (nextGameIndex !== -1) {

        const kolejkaIndex = Math.floor(
          nextGameIndex / gamesPerPage
        );

        setCurrentKolejkaIndex(kolejkaIndex);

      } else {

        const lastPage = Math.floor(
          (games.length - 1) / gamesPerPage
        );

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
          marginTop: '5%'
        }}
      >

        <h2 className="text-xl font-bold mb-4">
          Wprowadź hasło:
        </h2>

        <input
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="p-2 text-center border border-gray-300 rounded-md"
        />


        <button
          onClick={handlePasswordSubmit}
          style={{
            backgroundColor:'red',
            color:'white',
            fontWeight:'bold',
            padding:'10px 20px',
            borderRadius:'4px',
            border:'none',
            cursor:'pointer',
            marginTop:'10px'
          }}
        >
          Zaloguj
        </button>

      </div>
    );
  }


  return (

    <div
      style={{
        backgroundColor:'#212529ab',
        color:'aliceblue',
        padding:'20px',
        textAlign:'center',
        marginTop:'5%'
      }}
    >

      <h2 className="text-xl font-bold mb-4">
        Wprowadź wyniki:
      </h2>


      <Pagination
        currentPage={currentKolejkaIndex}
        totalPages={totalPages}
        onPageChange={setCurrentKolejkaIndex}
        label="Kolejka"
      />


      <table
        style={{
          width:'100%',
          border:'0.5px solid #444',
          borderCollapse:'collapse',
          marginTop:'5%'
        }}
      >

        <thead>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th>Wynik</th>
          </tr>
        </thead>


        <tbody>

        {getPagedGames(currentKolejkaIndex).map((game,index)=>(

          <React.Fragment key={index}>

          <tr>
            <td
              colSpan="12"
              className="date"
              style={{
                textAlign:'left',
                color:'gold',
                fontSize:'10px',
                paddingLeft:'10%'
              }}
            >
              {game.date} - {game.kickoff}
            </td>
          </tr>


          <tr style={{borderBottom:'1px solid #444'}}>

            <td style={{textAlign:'center'}}>
              <img
                src={getTeamLogo(game.home)}
                alt=""
                className="logo"
              />
              {game.home}
            </td>


            <td>-</td>


            <td>

              <img
                src={getTeamLogo(game.away)}
                alt=""
                className="logo"
              />

              {game.away}

            </td>


            <td>

              <input
                type="text"
                placeholder="x:x"
                value={resultsInput[game.id] || ''}
                onChange={(e)=>
                  handleResultChange(
                    game.id,
                    e.target.value
                  )
                }
                maxLength="3"
                style={{
                  width:'50px',
                  color:'blue',
                  textAlign:'center'
                }}
              />

            </td>

          </tr>


          {nonBettors[game.id]?.length ===
          Object.keys(submittedData).length ? (

            <tr>
              <td colSpan="4" style={{color:'green'}}>
                <strong>Nikt jeszcze nie obstawił</strong>
              </td>
            </tr>

          ) : nonBettors[game.id]?.length > 0 ? (

            <tr>
              <td colSpan="4" style={{color:'red'}}>
                <strong>
                  Nie obstawili:
                  {' '}
                  {nonBettors[game.id].join(', ')}
                </strong>
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
          backgroundColor:'green',
          color:'white',
          fontWeight:'bold',
          padding:'10px 20px',
          borderRadius:'4px',
          border:'none',
          cursor:'pointer',
          marginTop:'10px'
        }}
      >
        Zatwierdź wyniki
      </button>

      {/* SEPARATE AUDIT LOG SECTION BELOW */}
      <hr style={{ margin: '40px 0', borderColor: '#444' }} />

      <h3 className="text-lg font-bold mb-4" style={{ color: '#00aaff' }}>
        Szczegóły obstawień (Audyt metadata):
      </h3>

      <div style={{ textAlign: 'left', marginTop: '20px' }}>
        {getPagedGames(currentKolejkaIndex).map((game) => {
          const gameBets = Object.keys(submittedData)
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

          if (gameBets.length === 0) return null;

          return (
            <div
              key={game.id}
              style={{
                backgroundColor: '#16191c',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '15px',
                border: '1px solid #333',
              }}
            >
              <h4 style={{ color: 'gold', margin: '0 0 8px 0', fontSize: '14px' }}>
                {game.home} vs {game.away} ({game.date})
              </h4>

              <table
                style={{
                  width: '100%',
                  fontSize: '12px',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #444', color: '#888' }}>
                    <th style={{ textAlign: 'left', padding: '4px' }}>Użytkownik</th>
                    <th style={{ textAlign: 'left', padding: '4px' }}>Typ</th>
                    <th style={{ textAlign: 'left', padding: '4px' }}>Data i czas</th>
                    <th style={{ textAlign: 'left', padding: '4px' }}>IP</th>
                    <th style={{ textAlign: 'left', padding: '4px' }}>Lokalizacja</th>
                  </tr>
                </thead>
                <tbody>
                  {gameBets.map((b, idx) => {
                    const meta = b.metadata;
                    const time = meta?.timestamp
                      ? new Date(meta.timestamp).toLocaleString()
                      : 'Brak';
                    const ip = meta?.ip || 'Brak';
                    const loc = meta
                      ? `${meta.city || '?'}, ${meta.country || '?'}`
                      : 'Brak';

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '4px', color: '#fff' }}>{b.user}</td>
                        <td style={{ padding: '4px', color: '#00ffcc' }}>{b.prediction}</td>
                        <td style={{ padding: '4px', color: '#aaa' }}>{time}</td>
                        <td style={{ padding: '4px', color: '#aaa' }}>{ip}</td>
                        <td style={{ padding: '4px', color: '#aaa' }}>{loc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

    </div>

  );
};


export default Admin;
