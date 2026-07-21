// utils/pointsCalculator.js

export const calculatePoints = (bets, results) => {
    let points = 0, correctTypes = 0, correctResults = 0, correctTypesWithResults = 0;
  
    bets.forEach((bet) => {
      const result = results[bet.id];
      if (result) {
        if (bet.score === result) {
          points += 3;
          correctResults++;
          correctTypesWithResults++;
        } else if (bet.bet === (result.split(':')[0] === result.split(':')[1] ? 'X' : result.split(':')[0] > result.split(':')[1] ? '1' : '2')) {
          points += 1;
          correctTypes++;
        }
      }
    });
  
    return { points, correctTypes, correctResults, correctTypesWithResults }; // Return the new variable
  };
  