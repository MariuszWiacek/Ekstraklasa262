import React, { useState, useEffect, useMemo, useReducer } from 'react';
import '../styles/card.css';
import Pagination from './Pagination';
import { DateTime } from 'luxon';
import gameData from '../gameData/data.json';

const ExpandableCard = ({ user, bets, results }) => {
  const gamesPerKolejka = 9;
  const [currentKolejka, setCurrentKolejka] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Used only to force a re-render when a game starts
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Group bets into kolejkas (memoized)
  const groupedBets = useMemo(() => {
    return Object.keys(bets).reduce((acc, key) => {
      const betID = parseInt(key, 10);
      const kolejkaIndex = Math.floor((betID - 1) / gamesPerKolejka);

      if (!acc[kolejkaIndex]) acc[kolejkaIndex] = [];

      acc[kolejkaIndex].push({
        id: key,
        ...bets[key],
      });

      return acc;
    }, []);
  }, [bets]);

  const totalKolejkas = groupedBets.length;

  useEffect(() => {
    if (totalKolejkas > 0) {
      setCurrentKolejka(totalKolejkas - 1);
    }
  }, [totalKolejkas]);

  // SMART TIMER: Watches only games in the currently viewed kolejka
  useEffect(() => {
    if (!expanded || !groupedBets[currentKolejka]) return;

    const timers = [];

    groupedBets[currentKolejka].forEach((bet) => {
      const game = gameData.find((g) => g.id === parseInt(bet.id, 10));

      if (!game) return;

      const now = DateTime.now().setZone('Europe/Warsaw');
      const kickoff = DateTime.fromISO(
        `${game.date}T${game.kickoff}:00`,
        { zone: 'Europe/Warsaw' }
      );

      const msUntilKickoff = kickoff.diff(now).milliseconds;

      if (msUntilKickoff > 0) {
        const timer = setTimeout(() => {
          forceUpdate();
        }, msUntilKickoff + 500);

        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [expanded, currentKolejka, groupedBets]);

  const hasGameStarted = (betId) => {
    const game = gameData.find((g) => g.id === parseInt(betId, 10));

    if (!game) return false;

    const now = DateTime.now().setZone('Europe/Warsaw');
    const kickoff = DateTime.fromISO(
      `${game.date}T${game.kickoff}:00`,
      { zone: 'Europe/Warsaw' }
    );

    return now >= kickoff;
  };

  const getTypeFromResult = (result) => {
    if (!result) return null;

    const [homeScore, awayScore] = result.split(':');

    if (homeScore === awayScore) return 'X';

    return homeScore > awayScore ? '1' : '2';
  };

  return (
    <div
      className="paper-card"
      style={{
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '10px',
      }}
    >
      <h4
        className="header-style"
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer' }}
      >
        {user} {expanded ? '-' : '+'}
      </h4>

      {expanded && (
        <div className="card-content">
          <Pagination
            currentPage={currentKolejka}
            totalPages={totalKolejkas}
            onPageChange={setCurrentKolejka}
            label="Kolejka"
          />

          {groupedBets[currentKolejka]?.map((bet) => {
            const isCurrentlyHidden =
              bet.isHidden && !hasGameStarted(bet.id);

            return (
              <div key={bet.id} style={{ marginBottom: '5px' }}>
                <div style={{ fontSize: '10px' }}>
                  <span style={{ color: 'black' }}>
                    {bet.home} vs.
                  </span>{' '}
                  <span style={{ color: 'black' }}>
                    {bet.away} |{' '}
                  </span>

                  {isCurrentlyHidden ? (
                    <>
                      <span style={{ color: 'green' }}>
                        Typ: [ 🔒 ]
                      </span>{' '}
                      |{' '}
                      <span style={{ color: 'green' }}>
                        [ 🔒 ]
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'blue' }}>
                        Typ: [ {bet.bet} ]
                      </span>{' '}
                      |{' '}
                      <span style={{ color: 'black' }}>
                        {bet.score}
                      </span>
                    </>
                  )}

                  <span className="results-style"> Wynik: </span>
                  <span style={{ color: 'black' }}>
                    {results[bet.id]}
                  </span>

                  {!isCurrentlyHidden &&
                    bet.score === results[bet.id] && (
                      <span className="correct-score">✅</span>
                    )}

                  {!isCurrentlyHidden &&
                    getTypeFromResult(results[bet.id]) === bet.bet && (
                      <span className="correct-type">☑️</span>
                    )}
                </div>
              </div>
            );
          })}

          <hr />
        </div>
      )}
    </div>
  );
};

export default ExpandableCard;