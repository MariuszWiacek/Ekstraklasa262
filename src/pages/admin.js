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


    </div>

  );
};


export default Admin;