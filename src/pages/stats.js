import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Firebase configuration
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

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);


// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Stats = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [generalStats, setGeneralStats] = useState({
    mostChosenCorrectScore: '',
    mostMatchedCorrectScore: '',
    mostChosenCorrectScoreCount: 0,
    mostMatchedCorrectScoreCount: 0,
    mostDraws: 0,
    userWithMostDraws: '',
    mostForgetfulUser: '',
    mostForgetfulCount: 0,
  });
  const [userStats, setUserStats] = useState([]);

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
    if (!submittedData || !results) return;

    const userStatsData = [];
    const scoreCount = {};
    const matchedScores = {};
    const drawCount = {};
    
    const emptyScoreCount = {};

    Object.keys(submittedData).forEach((user) => {
      const bets = Object.entries(submittedData[user] || {});
      const userStats = {
        user,
        chosenTeams: {},
        failureTeams: {},
        successTeams: {},
        maxPointsInOneKolejka: 0,
        kolejki: [],
      };

      bets.forEach(([id, bet]) => {
        if (bet.score === ':::') {
          emptyScoreCount[user] = (emptyScoreCount[user] || 0) + 1;
          return;
        }

        const result = results[id];
        if (!result || !bet.home || !bet.away || !bet.bet || !bet.score) return;

        const { home: homeTeam, away: awayTeam, bet: betOutcome, score: betScore } = bet;
        const [actualHomeScore, actualAwayScore] = result.split(':').map(Number);
        const [betHomeScore, betAwayScore] = betScore.split(':').map(Number);
        const actualOutcome = actualHomeScore === actualAwayScore ? 'X' : actualHomeScore > actualAwayScore ? '1' : '2';

        let points = 0;
        if (betHomeScore === actualHomeScore && betAwayScore === actualAwayScore) {
          points = 3;
        } else if (betOutcome === actualOutcome) {
          points = 1;
        }

        const kolejkaId = bet.kolejkaId;
        if (!userStats.kolejki[kolejkaId]) {
          userStats.kolejki[kolejkaId] = { points: 0 };
        }
        userStats.kolejki[kolejkaId].points += points;
        userStats.maxPointsInOneKolejka = Math.max(userStats.maxPointsInOneKolejka, userStats.kolejki[kolejkaId].points);

        if (betOutcome !== 'X') {
          const chosenTeam = betOutcome === '1' ? homeTeam : awayTeam;
          userStats.chosenTeams[chosenTeam] = (userStats.chosenTeams[chosenTeam] || 0) + 1;

          if (actualOutcome === betOutcome) {
            userStats.successTeams[chosenTeam] = (userStats.successTeams[chosenTeam] || 0) + 1;
          } else {
            userStats.failureTeams[chosenTeam] = (userStats.failureTeams[chosenTeam] || 0) + 1;
          }
        }

        if (actualOutcome === 'X' && betOutcome === 'X') {
          drawCount[user] = (drawCount[user] || 0) + 1;
        }

        scoreCount[betScore] = (scoreCount[betScore] || 0) + 1;
        if (betScore === result) {
          matchedScores[betScore] = (matchedScores[betScore] || 0) + 1;
        }
      });

      const kolejkaLabels = Array.from({ length: 16 }, (_, idx) => `Kolejka ${idx + 1}`);
      const pointsData = userStats.kolejki.slice(1, 16).map(kolejka => Math.min(Math.max(kolejka?.points || 0, 1), 27));

      userStats.chartData = {
        labels: kolejkaLabels,
        datasets: [
          {
            label: 'Pkt/kolejke',
            data: pointsData,
            fill: false,
            borderColor: 'rgb(255, 0, 0)',
            tension: 1,
            backgroundColor: 'yellow'
          },
        ],
      };

      const mostChosenTeams = findMostFrequent(userStats.chosenTeams);
      const mostFailureTeams = findMostFrequent(userStats.failureTeams);
      const mostSuccessTeams = findMostFrequent(userStats.successTeams);

      userStats.mostChosenTeams = mostChosenTeams.length ? mostChosenTeams : ['------'];
      userStats.mostFailureTeams = mostFailureTeams.length ? mostFailureTeams : ['------'];
      userStats.mostSuccessTeams = mostSuccessTeams.length ? mostSuccessTeams : ['------'];

      userStatsData.push(userStats);
    });

    const mostChosenCorrectScore = findMostFrequent(scoreCount);
    const mostMatchedCorrectScore = findMostFrequent(matchedScores);
    const maxDraws = Math.max(...Object.values(drawCount), 0);
    const userWithMostDraws = Object.keys(drawCount).find(user => drawCount[user] === maxDraws) || '------';

    const maxEmpty = Math.max(...Object.values(emptyScoreCount), 0);
    const mostForgetfulUser = Object.keys(emptyScoreCount).find(user => emptyScoreCount[user] === maxEmpty) || '------';

    setGeneralStats({
      mostChosenCorrectScore: mostChosenCorrectScore.length ? mostChosenCorrectScore[0] : '------',
      mostMatchedCorrectScore: mostMatchedCorrectScore.length ? mostMatchedCorrectScore[0] : '------',
      mostChosenCorrectScoreCount: mostChosenCorrectScore.length ? scoreCount[mostChosenCorrectScore[0]] : 0,
      mostMatchedCorrectScoreCount: mostMatchedCorrectScore.length ? matchedScores[mostMatchedCorrectScore[0]] : 0,
      mostDraws: maxDraws,
      userWithMostDraws: userWithMostDraws,
      mostForgetfulUser: mostForgetfulUser,
      mostForgetfulCount: maxEmpty,
    });

    setUserStats(userStatsData);
  }, [submittedData, results]);

  const findMostFrequent = (items) => {
    const maxCount = Math.max(...Object.values(items), 0);
    return Object.keys(items).filter(item => items[item] === maxCount);
  };

  return (
    <Container fluid>
      <Row>
        <Col md={12}> <div style={{ marginTop: '10px', color: '#FFD700' }}>
          Statystyki Ogólne
          <hr />
          <p><strong>🏆 Najczęściej wybierany wynik: </strong> {generalStats.mostChosenCorrectScore} ({generalStats.mostChosenCorrectScoreCount} razy)</p>
          <p><strong>💥 Najczęściej trafiony wynik: </strong> {generalStats.mostMatchedCorrectScore} ({generalStats.mostMatchedCorrectScoreCount} razy)</p>
          <p><strong>🔴 Najwięcej trafionych remisów: </strong> {generalStats.mostDraws} (Użytkownik: {generalStats.userWithMostDraws})</p>
          <p><strong>😵 Największy zapominalski: </strong> {generalStats.mostForgetfulUser} ({generalStats.mostForgetfulCount} pustych typów)</p>
        </div></Col>
      </Row>

      <Row>
        <Col md={12}> <div style={{ marginTop: '10px', color: '#FFD700' }}><hr></hr>
       Statystyki Użytkowników
          <hr /><br></br>
          {userStats.length > 0 ? userStats.map((stats, idx) => (
            <div key={idx}>
              <h3>{stats.user}</h3>
              <hr />
              <p><strong>⚽ Najczęściej obstawiane drużyny: </strong> {stats.mostChosenTeams.join(', ')}</p>
              <p><strong>👎🏿 Największe rozczarowania: </strong> {stats.mostFailureTeams.join(', ')}</p>
              <p><strong>👍 Najczęściej trafione zwycięstwa: </strong> {stats.mostSuccessTeams.join(', ')}</p>

              <div style={{ width: 'max', height: '300px', backgroundColor: '#f0f8ff' }}>
                <Line data={stats.chartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { color: '#e0e0e0' } },
                    y: {
                      min: 1,
                      max: 27,
                      grid: { color: '#e0e0e0' },
                      ticks: { stepSize: 1 }
                    },
                  },
                }} />
              </div>

              <hr />
            </div>
          )) : <p>------</p>}
       </div> </Col>
      </Row>
    </Container>
  );
};

export default Stats;
