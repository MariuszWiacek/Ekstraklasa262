import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import { calculatePoints } from '../components/calculatePoints';
import Stats from './stats';

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

const Table = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [mainTableData, setMainTableData] = useState([]);
  const [kolejkaTables, setKolejkaTables] = useState({});
  const [visibleKolejka, setVisibleKolejka] = useState(null);
  const [prizes, setPrizes] = useState({});
  const [userEarnings, setUserEarnings] = useState({});
  const previousTableData = useRef([]);
  const rolloverPrize = useRef(0);  // Use ref to track the rollover prize across renders

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
      const { points, correctTypes, correctResults } = calculatePoints(bets, results);

      // Group by kolejka
      bets.forEach((bet) => {
        const gameNumber = parseInt(bet.id, 10);
        const kolejkaID = Math.ceil(gameNumber / 9); // Determine kolejka
        if (!kolejkaPoints[kolejkaID]) kolejkaPoints[kolejkaID] = {};
        if (!kolejkaPoints[kolejkaID][user]) {
          kolejkaPoints[kolejkaID][user] = { user, points: 0, correctTypes: 0, correctResults: 0 };
        }

        const { points, correctTypes, correctResults } = calculatePoints([bet], results);
        kolejkaPoints[kolejkaID][user].points += points;
        kolejkaPoints[kolejkaID][user].correctTypes += correctTypes;
        kolejkaPoints[kolejkaID][user].correctResults += correctResults;
      });

      return { user, points, correctTypes, correctResults };
    });

    // Sort overall table
    overallTableData.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.correctResults - a.correctResults;
    });

    // Assign place and trends for overall table
    overallTableData.forEach((entry, index) => {
      entry.place = index + 1;
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

    Object.keys(kolejkaPoints).forEach((kolejkaID) => {
      const sortedKolejka = Object.values(kolejkaPoints[kolejkaID]).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.correctResults - a.correctResults;
      });

      // Assign place
      sortedKolejka.forEach((entry, index) => {
        entry.place = index + 1;
      });

      // Find winners
      const maxPoints = sortedKolejka[0]?.points || 0;
      const winners = sortedKolejka.filter((entry) => entry.points === maxPoints).map((entry) => entry.user);

      // Handle prize allocation for remis (tie)
      const currentPrize = 10 + rolloverPrize.current;  // Use the rollover value for prize calculation

      if (winners.length === 1) {
        prizePool[kolejkaID] = { winners, prize: currentPrize };
        rolloverPrize.current = 0; // Reset rollover for next round
      } else {
        prizePool[kolejkaID] = { winners, prize: 0, rollover: true }; // No prize for remis
        rolloverPrize.current += 10; // Increase the rollover prize by 10 zł for next round
      }

      // Update earnings for winners (no earnings for remis)
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
                  <th style={tableHeaderStyle}>☑️ <br />typ</th>
                  <th style={tableHeaderStyle}>✅☑️ <br />typ+wynik</th>
                </tr>
              </thead>
              <tbody>
                {mainTableData.map((entry, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index < 3 ? '#ffea007d' : 'rgba(0, 0, 0, 0.336)',
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

          <hr />
          
          {Object.keys(kolejkaTables).map((kolejkaID) => {
  const kolejkaData = kolejkaTables[kolejkaID];

  // Check if all users have 0 points for this kolejka
  const allZeroPoints = kolejkaData.every((entry) => entry.points === 0);

  return (
    <div key={kolejkaID}>
      <hr style={{color: 'white'}} />
      <div style={prizeInfoStyle}>
        <h3><b>Kolejka {kolejkaID}</b><br /></h3>
        {allZeroPoints ? (
          <p>Nikt jeszcze nie zdobył punktów.</p> // Message for no points
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
      
      {visibleKolejka === kolejkaID && !allZeroPoints && ( // Only show table if not all users have 0 points
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
                    backgroundColor:
                      index < 3 ? '#ffea007d' : 'rgba(0, 0, 0, 0.336)',
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
  <p style={{fontSize: '15px', }}>16x60=960 🥮
          16 kolejek x 10 🥮 = 160 🥮
          960 - 160=   800 🥮 w puli
          <hr/></p>
  <div style={{ marginTop: '10px', color: '#FFD700' }}>
          
          <b>Aktualne Nagrody :</b><hr />
          {mainTableData[0] && (
    <p>🥇 1 miejsce – <b>{mainTableData[0].user} - 450 🥮</b></p>
  )}

  {mainTableData[1] && (
    <p>🥈 2 miejsce – <b>{mainTableData[1].user} – 200 🥮</b></p>
  )}

  {mainTableData[2] && (
    <p>🥉 3 miejsce – <b>{mainTableData[2].user} – 150 🥮</b></p>
  )}
         
        </div>
  <hr />
 <div style={{ marginTop: '10px', color: '#FFD700' }}>
          
          <b>Bonusy kolejkowe :<hr></hr></b>
  {Object.entries(userEarnings)
    .filter(([, earningsAmount]) => earningsAmount > 0) // Filter out users with 0 earnings
    .sort(([, earningsA], [, earningsB]) => earningsB - earningsA) // Sort by earnings in descending order
    .map(([user, earningsAmount]) => (
      <p key={user}>
        {user}: {earningsAmount} 🥮
      </p>
              ))}</div>
          </div>
        </Col>
      </Row><hr style={{color: 'white'}}></hr>
      <Stats />
    </Container>
    
  );
};

export default Table;
