import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import { calculatePoints } from '../components/calculatePoints';
import Stats from './stats';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const database = firebaseApp ? getDatabase(firebaseApp) : null;

const linkContainerStyle = {
  textAlign: 'left',
  backgroundColor: '#212529ab',
  padding: '20px',
  borderRadius: '10px',
  marginBottom: '20px',
};

const tableHeaderStyle = {
  padding: '10px',
  border: '1px solid #444',
  backgroundColor: '#212529',
  color: 'white',
  textAlign: 'center',
};

const tableCellStyle = {
  padding: '10px',
  border: '1px solid #444',
  textAlign: 'center',
};

const textToggleStyle = {
  cursor: 'pointer',
  color: '#ffd700',
  textDecoration: 'underline',
  margin: '10px 0',
  fontSize: '1.1em',
  textAlign: 'center',
};

const prizeInfoStyle = {
  color: '#0f0',
  fontSize: '1em',
  textAlign: 'center',
  marginTop: '10px',
};

const earningsStyle = {
  color: '#f39c12',
  fontSize: '1.1em',
  textAlign: 'center',
  marginTop: '30px',
};

const getRankColor = (index) => {
  switch (index) {
    case 0:
      return 'rgba(255, 215, 0, 0.45)';
    case 1:
      return 'rgba(192, 192, 192, 0.45)';
    case 2:
      return 'rgba(205, 127, 50, 0.45)';
    default:
      return 'rgba(0, 0, 0, 0.336)';
  }
};

const compareEntries = (a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
  return b.correctTypes - a.correctTypes;
};

const assignPlaces = (data) => {
  data.forEach((entry, index) => {
    if (index === 0) {
      entry.place = 1;
      return;
    }

    const prev = data[index - 1];
    if (
      entry.points === prev.points &&
      entry.correctResults === prev.correctResults &&
      entry.correctTypes === prev.correctTypes
    ) {
      entry.place = prev.place;
    } else {
      entry.place = index + 1;
    }
  });
};

const generateUserComment = (entry, totalPlayedGames, totalUsers) => {
  const { place, points, ppb, correctTypes, correctResults } = entry;
  const missedGames = totalPlayedGames - entry.totalBets;
  const isTopThree = place <= 3;
  const isHighEfficiency = ppb >= 1.5;

  if (missedGames > 0 && (isTopThree || isHighEfficiency)) {
    return `🎯 Sniper! Missed ${missedGames} bet(s), but still holding place #${place} with ${ppb} pts/bet!`;
  }

  if (place === 1) return '👑 Leader of the pack! Consistent high-value picks.';
  if (place === 2 || place === 3) return '🔥 Podium contender! Heavy pressure on 1st place.';
  if (ppb >= 1.2) return '⭐ Solid efficiency. Very reliable accuracy when picking.';
  if (place <= Math.ceil(totalUsers / 2)) return '📊 Balanced bettor. Cruising safely in the upper half.';
  if (missedGames > 5) return '💤 Missing in action! Needs more submitted bets to push higher.';
  if (ppb < 0.8) return '📉 Rough streak lately. Needs a reset on outcome strategies.';

  return '🎲 In the mix. One good round can jump multiple places.';
};

const Table = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [mainTableData, setMainTableData] = useState([]);
  const [kolejkaTables, setKolejkaTables] = useState({});
  const [visibleKolejka, setVisibleKolejka] = useState(null);
  const [prizes, setPrizes] = useState({});
  const [userEarnings, setUserEarnings] = useState({});
  const previousTableData = useRef([]);

  useEffect(() => {
    if (!database) return;

    const resultsRef = ref(database, 'results');
    const submittedDataRef = ref(database, 'submittedData');

    const unsubscribeResults = onValue(resultsRef, (snapshot) => {
      setResults(snapshot.val() || {});
    });

    const unsubscribeSubmittedData = onValue(submittedDataRef, (snapshot) => {
      setSubmittedData(snapshot.val() || {});
    });

    return () => {
      unsubscribeResults();
      unsubscribeSubmittedData();
    };
  }, []);

  useEffect(() => {
    const kolejkaPoints = {};
    const totalFinishedMatches = Object.keys(results).filter((id) => results[id]?.result).length;

    const overallTableData = Object.keys(submittedData).map((user) => {
      const bets = Object.entries(submittedData[user]).map(([id, bet]) => ({
        ...bet,
        id,
      }));

      const userTotal = calculatePoints(bets, results);
      const points = userTotal.points;
      const correctTypes = userTotal.correctTypes;
      const correctResults = userTotal.correctResults;

      const totalBetsSubmitted = bets.filter((b) => results[b.id]?.result).length;

      bets.forEach((bet) => {
        const gameNumber = Number.parseInt(bet.id, 10);
        const kolejkaID = Math.ceil(gameNumber / 9);

        if (!kolejkaPoints[kolejkaID]) {
          kolejkaPoints[kolejkaID] = {};
        }

        if (!kolejkaPoints[kolejkaID][user]) {
          kolejkaPoints[kolejkaID][user] = {
            user,
            points: 0,
            correctTypes: 0,
            correctResults: 0,
            totalBets: 0,
          };
        }

        const betResult = calculatePoints([bet], results);

        kolejkaPoints[kolejkaID][user].points += betResult.points;
        kolejkaPoints[kolejkaID][user].correctTypes += betResult.correctTypes;
        kolejkaPoints[kolejkaID][user].correctResults += betResult.correctResults;
        kolejkaPoints[kolejkaID][user].totalBets += 1;
      });

      const ppb = totalBetsSubmitted > 0 ? Number((points / totalBetsSubmitted).toFixed(2)) : 0;

      return {
        user,
        points,
        correctTypes,
        correctResults,
        totalBets: totalBetsSubmitted,
        ppb,
      };
    });

    overallTableData.sort(compareEntries);
    assignPlaces(overallTableData);

    const totalUsers = overallTableData.length;

    overallTableData.forEach((entry) => {
      const positionBonus = Math.max(0, (totalUsers - entry.place + 1) * 3);
      const efficiencyBonus = entry.ppb * 15;
      entry.ovr = Math.min(99, Math.round(50 + efficiencyBonus + positionBonus));
      entry.comment = generateUserComment(entry, totalFinishedMatches, totalUsers);
    });

    previousTableData.current = overallTableData;
    setMainTableData(overallTableData);

    const sortedKolejkaTables = {};
    const prizePool = {};
    const earnings = {};

    let currentRollover = 0;
    const sortedKolejkaIDs = Object.keys(kolejkaPoints).sort((a, b) => Number(a) - Number(b));

    sortedKolejkaIDs.forEach((kolejkaID) => {
      const entries = Object.values(kolejkaPoints[kolejkaID]).sort(compareEntries);
      assignPlaces(entries);

      const topPlace = entries[0]?.place ?? 1;
      const winners = entries
        .filter((entry) => entry.place === topPlace)
        .map((entry) => entry.user);

      const isSingleWinner = winners.length === 1;
      const prizeAmount = isSingleWinner ? 15 + currentRollover : 0;

      if (isSingleWinner) {
        prizePool[kolejkaID] = {
          winners,
          prize: prizeAmount,
          rollover: false,
        };
        currentRollover = 0;
      } else {
        prizePool[kolejkaID] = {
          winners,
          prize: 0,
          rollover: true,
        };
        currentRollover += 15;
      }

      winners.forEach((winner) => {
        earnings[winner] = (earnings[winner] || 0) + prizeAmount;
      });

      sortedKolejkaTables[kolejkaID] = entries;
    });

    setPrizes(prizePool);
    setKolejkaTables(sortedKolejkaTables);
    setUserEarnings(earnings);
  }, [submittedData, results]);

  const toggleKolejkaVisibility = (kolejkaID) => {
    setVisibleKolejka((prev) => (prev === kolejkaID ? null : kolejkaID));
  };

  return (
    <Container fluid style={linkContainerStyle}>
      <Row>
        <Col md={12}>
          <h3 style={{ textAlign: 'center' }}>Tabela</h3>

          <div className="fade-in" style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#212529', color: 'white' }}>
                  <th style={tableHeaderStyle}>Miejsce</th>
                  <th style={tableHeaderStyle}>Użytkownik</th>
                  <th style={tableHeaderStyle}>OVR</th>
                  <th style={tableHeaderStyle}>Pkt</th>
                  <th style={tableHeaderStyle}>Pkt/Bet</th>
                  <th style={tableHeaderStyle}>☑️ <br />typ</th>
                  <th style={tableHeaderStyle}>✅☑️ <br />typ+wynik</th>
                  <th style={tableHeaderStyle}>Komentarz</th>
                </tr>
              </thead>

              <tbody>
                {mainTableData.map((entry, index) => (
                  <tr
                    key={entry.user || index}
                    style={{
                      backgroundColor: getRankColor(index),
                    }}
                  >
                    <td style={tableCellStyle}>{entry.place}</td>
                    <td style={tableCellStyle}>
                      <b>{entry.user}</b>
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', color: '#ffd700' }}>
                      {entry.ovr}
                    </td>
                    <td style={tableCellStyle}>{entry.points}</td>
                    <td style={tableCellStyle}>{entry.ppb}</td>
                    <td style={tableCellStyle}>{entry.correctTypes}</td>
                    <td style={tableCellStyle}>{entry.correctResults}</td>
                    <td style={{ ...tableCellStyle, fontSize: '0.85em', textAlign: 'left' }}>
                      {entry.comment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr />

          {Object.keys(kolejkaTables).map((kolejkaID) => {
            const kolejkaData = kolejkaTables[kolejkaID] || [];
            const prizeInfo = prizes[kolejkaID] || { winners: [], prize: 0, rollover: false };
            const winners = prizeInfo.winners || [];
            const allZeroPoints = kolejkaData.length === 0 || kolejkaData.every((entry) => entry.points === 0);

            return (
              <div key={kolejkaID}>
                <hr style={{ color: 'white' }} />
                <div style={prizeInfoStyle}>
                  <h3>
                    <b>Kolejka {kolejkaID}</b>
                  </h3>

                  {allZeroPoints ? (
                    <p>Nikt jeszcze nie zdobył punktów.</p>
                  ) : winners.length === 1 ? (
                    <p>
                      <b>Zwycięzca:</b> {winners.join(', ')} (<b>{prizeInfo.prize} 🥮</b>)
                    </p>
                  ) : (
                    <p>
                      <b>Remis:</b> {winners.join(', ')}. <br />
                      Nagroda kumuluje się na następną kolejkę.
                    </p>
                  )}
                </div>

                <div
                  style={textToggleStyle}
                  onClick={() => toggleKolejkaVisibility(kolejkaID)}
                >
                  {visibleKolejka === kolejkaID
                    ? `Ukryj Tabelę: Kolejka ${kolejkaID}`
                    : `Pokaż Tabelę: Kolejka ${kolejkaID}`}
                </div>

                <hr />

                {visibleKolejka === kolejkaID && !allZeroPoints && (
                  <div className="fade-in" style={{ overflowX: 'auto', marginTop: '10px' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#212529', color: 'white' }}>
                          <th style={tableHeaderStyle}>Miejsce</th>
                          <th style={tableHeaderStyle}>Użytkownik</th>
                          <th style={tableHeaderStyle}>Pkt</th>
                          <th style={tableHeaderStyle}>☑️ <br />typ</th>
                          <th style={tableHeaderStyle}>✅☑️ <br />typ+wynik</th>
                        </tr>
                      </thead>

                      <tbody>
                        {kolejkaData.map((entry, index) => (
                          <tr
                            key={`${kolejkaID}-${entry.user || index}`}
                            style={{
                              backgroundColor: getRankColor(index),
                            }}
                          >
                            <td style={tableCellStyle}>{entry.place}</td>
                            <td style={tableCellStyle}>{entry.user}</td>
                            <td style={tableCellStyle}>{entry.points}</td>
                            <td style={tableCellStyle}>{entry.correctTypes}</td>
                            <td style={tableCellStyle}>{entry.correctResults}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          <div style={earningsStyle}>
            <hr />
            <p style={{ fontSize: '15px' }}>
              22x60=1320 🥮
              <br />
              18 kolejek x 15 🥮 = 270 🥮
              <br />
              1320 - 270 = 1050 🥮 w puli
            </p>

            <div style={{ marginTop: '10px', color: '#FFD700' }}>
              <b>Aktualne Nagrody :</b>
              <hr />

              {mainTableData[0] && (
                <p>
                  🥇 1 miejsce – <b>{mainTableData[0].user} - 550 🥮</b>
                </p>
              )}

              {mainTableData[1] && (
                <p>
                  🥈 2 miejsce – <b>{mainTableData[1].user} – 350 🥮</b>
                </p>
              )}

              {mainTableData[2] && (
                <p>
                  🥉 3 miejsce – <b>{mainTableData[2].user} – 150 🥮</b>
                </p>
              )}
            </div>

            <hr />

            <div style={{ marginTop: '10px', color: '#FFD700' }}>
              <b>Bonusy kolejkowe :</b>
              <hr />

              {Object.entries(userEarnings)
                .filter(([, earningsAmount]) => earningsAmount > 0)
                .sort(([, earningsA], [, earningsB]) => earningsB - earningsA)
                .map(([user, earningsAmount]) => (
                  <p key={user}>
                    {user}: {earningsAmount} 🥮
                  </p>
                ))}
            </div>
          </div>
        </Col>
      </Row>

      <hr style={{ color: 'white' }} />

      <Stats />
    </Container>
  );
};

export default Table;