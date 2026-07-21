import React, { useState, useEffect } from 'react';
import gameData from '../gameData/data.json';
import teamsData from '../gameData/teams.json';
import { DateTime } from 'luxon';

const getTeamLogo = (teamName) => {
  const team = teamsData[teamName];
  return team && team.logo ? `${team.logo}` : '/assets/default-logo.png';
};

const CountdownTimer = () => {
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextGames, setNextGames] = useState([]); // For multiple games starting at same time

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = DateTime.now().setZone("Europe/Warsaw");

      // Filter future games, convert to DateTime, sort by time
      const futureGames = gameData
        .map(game => ({
          ...game,
          gameDateTime: DateTime.fromISO(`${game.date}T${game.kickoff}:00`, { zone: "Europe/Warsaw" }),
        }))
        .filter(game => game.gameDateTime > now)
        .sort((a, b) => a.gameDateTime - b.gameDateTime);

      if (futureGames.length === 0) {
        setNextGames([]);
        return;
      }

      // Find the earliest next game datetime
      const earliestDateTime = futureGames[0].gameDateTime;

      // Get all games that start exactly at earliestDateTime (handle simultaneous games)
      const simultaneousGames = futureGames.filter(g => g.gameDateTime.equals(earliestDateTime));
      setNextGames(simultaneousGames);

      // Calculate countdown to that earliest game
      const diff = earliestDateTime.diff(now, ["days", "hours", "minutes", "seconds"]).toObject();
      setTimeRemaining({
        days: Math.floor(diff.days),
        hours: Math.floor(diff.hours),
        minutes: Math.floor(diff.minutes),
        seconds: Math.floor(diff.seconds),
      });
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);


  // Check if this is the last round (kolejka 16)
  const isLastRound = nextGames.length > 0 && nextGames[0].round === 16;


  // Check if all 9 matches are at the same time (meaning all are starting simultaneously)
  const all9MatchesSimultaneous = isLastRound && nextGames.length === 9;

  return (
    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
      {all9MatchesSimultaneous ? (
        // Special banner for Wielki finał, ostatnia kolejka
        <div style={{
          fontFamily: "'Orbitron', 'Arial Black', Arial, sans-serif",
          fontSize: '40px',
          color: '#00FFAA',
          fontWeight: '900',
          textShadow: '0 0 8px #00FFAA, 0 0 15px #00FFAA',
          padding: '40px 0',
        }}>
          Wielki finał, ostatnia kolejka!
        </div>
      ) : (
        // Normal countdown for single game (or multiple but less than 9)
        <div style={{ backgroundColor: '#212529ab', color: 'aliceblue', padding: '24px' }}>
          <p style={{ color: "gold", fontSize: '14px', marginBottom: '10px' }}>Następny mecz:</p>

         {nextGames.length > 0 && nextGames.length < 9 ? (
 
            // Show logos for single next game
            <div style={{ marginTop: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <img style={{ width: '65px', height: '65px' }} src={getTeamLogo(nextGames[0].home)} alt={nextGames[0].home} />
                <hr />
              </div>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'gold' }}>VS</span>
              <div style={{ textAlign: 'center' }}>
                <img style={{ width: '65px', height: '65px' }} src={getTeamLogo(nextGames[0].away)} alt={nextGames[0].away} />
                <hr />
              </div>
            </div>
          ) : (
            // If multiple games but not 9 simultaneous, just show count of next games
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#00FFAA', fontFamily:"Rubik" }}>
              Wielki finał -  Powodzenia !
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8%' }}>
            {["dni", "godz.", "min.", "sek."].map((label, index) => {
              const value = Object.values(timeRemaining)[index];
              const colors = ["#FFF5BA", "#FFF1A3", "#FFE862", "#FFDE21"];
              return (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', color: colors[index], fontWeight: 'bold' }}>{value}</div>
                  <div style={{ color: 'red', fontSize: '14px', fontWeight: '900' }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      
      <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.6', color: '#fff' }}>
      

        
      </div>
    </div>
  );
};

export default CountdownTimer;