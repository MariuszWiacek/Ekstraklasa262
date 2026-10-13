import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import { calculatePoints } from '../components/calculatePoints';
import Stats from './stats';

const firebaseConfig = {
  apiKey: "AIzaSyDq4d4qabXG-fMMsZijtR6uhFVl85rMmMM",
  authDomain: "jesien2026.firebaseapp.com",
  databaseURL: "https://jesien2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jesien2026",
  storageBucket: "jesien2026.firebasestorage.app",
  messagingSenderId: "656642340528",
  appId: "1:656642340528:web:33265dcdadba31c1842d75",
  measurementId: "G-LK891R7MQ1"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

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

// Helper function to set background colors for top 3 positions
const getRankColor = (index) => {
  switch (index) {
    case 0:
      return 'rgba(255, 215, 0, 0.45)'; // Gold
    case 1:
      return 'rgba(192, 192, 192, 0.45)'; // Silver
    case 2:
      return 'rgba(205, 127, 50, 0.45)'; // Bronze
    default:
      return 'rgba(0, 0, 0, 0.336)'; // Default dark row
  }
};

// Helper function to compare two entries for tie-breaking
const compareEntries = (a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
  return b.correctTypes - a.correctTypes;
};

// Helper function to assign places with ties
const assignPlaces = (data) => {
  data.forEach((entry, index) => {
    if (index === 0) {
      entry.place = 1;
    } else {
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
    }
  });
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
    const resultsRef = ref(database, 'results');
    onValue(resultsRef, (snapshot) => {
      setResults(snapshot.val() || {});
    });

    const submittedDataRef = ref(database, 'submittedData');
    onValue(submittedDataRef, (snapshot) => {
      setSubmittedData(snapshot.val() || {});
    });
  }, []);

  useEffect(() => {
    const kolejkaPoints = {};

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

      // Group by kolejka
      bets.forEach((bet) => {
        const gameNumber = parseInt(bet.id, 10);
        const kolejkaID = Math.ceil(gameNumber / 9);
        if (!kolejkaPoints[kolejkaID]) kolejkaPoints[kolejkaID] = {};
        if (!kolejkaPoints[kolejkaID][user]) {
          kolejkaPoints[kolejkaID][user] = { user, points: 0, correctTypes: 0, correctResults: 0 };
        }

        const singleBetResult = calculatePoints([bet], results);
        kolejkaPoints[kolejkaID][user].points += singleBetResult.points;
        kolejkaPoints[kolejkaID][user].correctTypes += singleBetResult.correctTypes;
        kolejkaPoints[kolejkaID][user].correctResults += singleBetResult.correctResults;
      });

      const ppb = totalBetsSubmitted > 0 ? (points / totalBetsSubmitted).toFixed(2) : '0.00';

      return {
        user,
        points,
        correctTypes,
        correctResults,
        totalBets: totalBetsSubmitted,
        ppb: parseFloat(ppb),
      };
    });

    // Sort overall table
    overallTableData.sort(compareEntries);
    assignPlaces(overallTableData);

    overallTableData.forEach((entry) => {
      const previousEntry = previousTableData.current.find((e) => e.user === entry.user);
      entry.trend = previousEntry
        ? previousEntry.place > entry.place
          ? 'up'
          : previousEntry.place < entry.place
          ? 'down'
          : 'same'
        : 'same';
    });

    previousTableData.current = overallTableData;
    setMainTableData(overallTableData);

    // Process kolejka tables and prizes
    const sortedKolejkaTables = {};
    const prizePool = {};
    let earnings = {};

    let currentRollover = 0;
    const sortedKolejkaIDs = Object.keys(kolejkaPoints).sort((a, b) => Number(a) - Number(b));

    sortedKolejkaIDs.forEach((kolejkaID) => {
      const sortedKolejka = Object.values(kolejkaPoints[kolejkaID]).sort(compareEntries);
      assignPlaces(sortedKolejka);

      const topPlace = sortedKolejka[0]?.place;
      const winners = sortedKolejka.filter((entry) => entry.place === topPlace).map((entry) => entry.user);

      const currentPrize = 15 + currentRollover;

      if (winners.length === 1) {
        prizePool[kolejkaID] = { winners, prize: currentPrize };
        currentRollover = 0;
      } else {
        prizePool[kolejkaID] = { winners, prize: 0, rollover: true };
        currentRollover += 15;
      }

      winners.forEach((winner) => {
        if (!earnings[winner]) earnings[winner] = 0;
        if (prizePool[kolejkaID].prize > 0) {
          earnings[winner] += currentPrize;
        }
      });

      sortedKolejkaTables[kolejkaID] = sortedKolejka;
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
                  <th style={tableHeaderStyle}>Pkt</th>
                  <th style={tableHeaderStyle}>Pkt/Bet</th>
                  <th style={tableHeaderStyle}>☑️ <br />typ</th>
                  <th style={tableHeaderStyle}>✅☑️ <br />typ+wynik</th>
                </tr>
              </thead>
              <tbody>
                {mainTableData.map((entry, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: getRankColor(index),
                    }}
                  >
                    <td style={tableCellStyle}>{entry.place}</td>
                    <td style={tableCellStyle}><b>{entry.user}</b></td>
                    <td style={tableCellStyle}>{entry.points}</td>
                    <td style={tableCellStyle}>{entry.ppb}</td>
                    <td style={tableCellStyle}>{entry.correctTypes}</td>
                    <td style={tableCellStyle}>{entry.correctResults}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr />
          
          {Object.keys(kolejkaTables).map((kolejkaID) => {
            const kolejkaData = kolejkaTables[kolejkaID];
            const allZeroPoints = kolejkaData.every((entry) => entry.points === 0);

            return (
              <div key={kolejkaID}>
                <hr style={{ color: 'white' }} />
                <div style={prizeInfoStyle}>
                  <h3><b>Kolejka {kolejkaID}</b><br /></h3>
                  {allZeroPoints ? (
                    <p>Nikt jeszcze nie zdobył punktów.</p>
                  ) : (
                    <p>
                      {prizes[kolejkaID]?.winners.length === 1 ? (
                        <>
                          <b>Zwycięzca:</b> {prizes[kolejkaID].winners.join(', ')} (
                          <b>{prizes[kolejkaID].prize} 🥮</b>)
                        </>
                      ) : (
                        <>
                          <b>Remis:</b> {prizes[kolejkaID].winners.join(', ')}. <br />
                          Nagroda kumuluje się na następną kolejkę
                        </>
                      )}
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
                            key={index}
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

          <div style={earningsStyle}><hr></hr>
            <p style={{ fontSize: '15px' }}>
              22x60=1320 🥮
              18 kolejek x 15 🥮 = 270 🥮
              1320 - 270 = 1050 🥮 w puli
              <hr/>
            </p>
            <div style={{ marginTop: '10px', color: '#FFD700' }}>
              <b>Aktualne Nagrody :</b><hr />
              {mainTableData[0] && (
                <p>🥇 1 miejsce – <b>{mainTableData[0].user} - 550 🥮</b></p>
              )}

              {mainTableData[1] && (
                <p>🥈 2 miejsce – <b>{mainTableData[1].user} – 350 🥮</b></p>
              )}

              {mainTableData[2] && (
                <p>🥉 3 miejsce – <b>{mainTableData[2].user} – 150 🥮</b></p>
              )}
            </div>
            <hr />
            <div style={{ marginTop: '10px', color: '#FFD700' }}>
              <b>Bonusy kolejkowe :<hr></hr></b>
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
      </Row><hr style={{ color: 'white' }}></hr>
      <Stats />
    </Container>
  );
};

export default Table;
