import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import gameData from '../gameData/data.json';
import teamsData from '../gameData/teams.json';
import '../styles/results.css';
import Pagination from '../components/Pagination';

const Results = () => {
  const [games, setGames] = useState([]);
  const [resultsInput, setResultsInput] = useState({});
  const [submittedResults, setSubmittedResults] = useState(false);
  const [submittedData, setSubmittedData] = useState({});

  const itemsPerPage = 9;
  const totalPages = Math.ceil(gameData.length / itemsPerPage);

  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setGames(gameData);

    const now = new Date();
    let closestGameIndex = -1;
    let lastEnteredScoreIndex = -1;

    closestGameIndex = gameData.findIndex((game) => {
      const gameDate = new Date(`${game.date}T${game.kickoff}:00+02:00`);
      return gameDate > now;
    });

    const gameIds = gameData.map((game) => game.id);

    for (let i = gameIds.length - 1; i >= 0; i--) {
      if (resultsInput[gameIds[i]]) {
        lastEnteredScoreIndex = i;
        break;
      }
    }

    const startIndex =
      lastEnteredScoreIndex !== -1
        ? lastEnteredScoreIndex
        : closestGameIndex;

    const startPage =
      startIndex !== -1
        ? Math.floor(startIndex / itemsPerPage)
        : 0;

    setCurrentPage(startPage);
  }, [resultsInput, itemsPerPage]);

  useEffect(() => {
    const submittedDataRef = ref(getDatabase(), 'submittedData');

    return onValue(submittedDataRef, (snapshot) => {
      const data = snapshot.val();
      setSubmittedData(data || {});
    });
  }, []);

  useEffect(() => {
    const resultsRef = ref(getDatabase(), 'results');

    return onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();

      const validResults = gameData.reduce((acc, game) => {
        if (data && data[game.id]) {
          acc[game.id] = data[game.id];
        }
        return acc;
      }, {});

      setResultsInput(validResults);
      setSubmittedResults(!!data);
    });
  }, []);

  const getCorrectTyp = (gameId) => {
    return Object.keys(submittedData).filter(
      (user) =>
        submittedData[user][gameId] &&
        submittedData[user][gameId].score === resultsInput[gameId]
    );
  };

  const getBetPercentages = (gameId) => {
    const betCounts = {
      home: 0,
      draw: 0,
      away: 0,
    };

    let totalBets = 0;

    Object.values(submittedData).forEach((userBets) => {
      const bet = userBets[gameId]?.bet;

      if (!bet) return;

      totalBets++;

      if (bet === '1') betCounts.home++;
      else if (bet === 'X') betCounts.draw++;
      else if (bet === '2') betCounts.away++;
    });

    if (totalBets === 0)
      return {
        home: 0,
        draw: 0,
        away: 0,
      };

    return {
      home: ((betCounts.home / totalBets) * 100).toFixed(0),
      draw: ((betCounts.draw / totalBets) * 100).toFixed(0),
      away: ((betCounts.away / totalBets) * 100).toFixed(0),
    };
  };

  const getParticipationFraction = (gameId) => {
    const totalUsers = Object.keys(submittedData).length;

    const usersWhoBet = Object.values(submittedData).filter(
      (userBets) => userBets[gameId] !== undefined
    ).length;

    return `${usersWhoBet}/${totalUsers}`;
  };

  const getTeamLogo = (teamName) => {
    return teamsData[teamName]?.logo || '';
  };

  const indexOfLastGame = (currentPage + 1) * itemsPerPage;
  const indexOfFirstGame = indexOfLastGame - itemsPerPage;
  const currentGames = games.slice(indexOfFirstGame, indexOfLastGame);

  return (
    <div
      className="fade-in"
      style={{
        backgroundColor: '#212529ab',
        color: 'aliceblue',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '10px',
      }}
    >
      {submittedResults && (
        <div className="text-center text-red-500 mb-5 table-container">
          <h2>Wyniki</h2>
          <hr />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            label="Kolejka"
          />

          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="border bg-green-600 text-gray-100">
                  Data i godzina
                </th>
                <th className="border bg-green-600 text-gray-100">
                  Mecz
                </th>
                <th className="border bg-green-600 text-gray-100">
                  Wynik
                </th>
                <th className="border bg-green-600 text-gray-100">
                  Kto trafił wynik?
                </th>
                <th className="border bg-green-600 text-gray-100">
                  Udział
                </th>
              </tr>
            </thead>

            <tbody>
              {currentGames.map((game) => {
                const gameId = game.id;
                const betPercentages = getBetPercentages(gameId);

                return (
                  <React.Fragment key={gameId}>
                    <tr>
                      <td className="border p-2 td-mobile">
                        {game.date} {game.kickoff}
                      </td>

                      <td className="border p-2">
                        <div className="flex items-center justify-center gap-2 td-mobile">
                          <img
                            src={getTeamLogo(game.home)}
                            alt={`${game.home} logo`}
                            className="logo"
                          />

                          <span>{game.home}</span>

                          <span>&nbsp;-&nbsp;&nbsp;&nbsp;</span>

                          <img
                            src={getTeamLogo(game.away)}
                            alt={`${game.away} logo`}
                            className="logo"
                          />

                          <span>{game.away}</span>
                        </div>

                        <div className="flex justify-center gap-1 mt-1 small-font">
                          <span style={{ color: 'yellow' }}>1:</span>
                          <span style={{ color: 'red' }}>
                            {betPercentages.home}%
                          </span>

                          <span style={{ color: 'yellow' }}>X:</span>
                          <span style={{ color: 'red' }}>
                            {betPercentages.draw}%
                          </span>

                          <span style={{ color: 'yellow' }}>2:</span>
                          <span style={{ color: 'red' }}>
                            {betPercentages.away}%
                          </span>
                        </div>
                      </td>

                      <td className="border p-2 td-mobile">
                        {resultsInput[gameId]}
                      </td>

                      <td className="border p-2 td-mobile">
                        {getCorrectTyp(gameId).join(', ')}
                      </td>

                      <td
                        className={`border p-2 td-mobile ${
                          getParticipationFraction(gameId) === '14/14'
                            ? 'text-yellow-500 font-bold'
                            : ''
                        }`}
                      >
                        {getParticipationFraction(gameId)}
                      </td>
                    </tr>

                    <tr>
                      <td colSpan="5">
                        <hr className="border-t border-gray-100 my-0" />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            label="Kolejka"
          />
        </div>
      )}
    </div>
  );
};

export default Results;