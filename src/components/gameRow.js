import React from 'react';

const GameRow = ({ game, index, results, handleScoreChange, isReadOnly, gameStarted }) => {
  return (
    <tr
      key={index}
      className="fade-in"
      style={{
        borderBottom: '0.5px solid #444',
        opacity: game.disabled ? '0.5' : '1',
        pointerEvents: game.disabled ? 'none' : 'auto',
        backgroundColor: gameStarted(game.date, game.kickoff) ? '#214029ab' : 'transparent',
      }}
    >
      <td>{game.date}</td>
      <td>{game.kickoff}</td>
      <td>{game.home}</td>
      <td>{game.away}</td>
      <td>{results[index]}</td>
      <td>
        <select value={game.bet} disabled>
          <option value="1">1</option>
          <option value="X">X</option>
          <option value="2">2</option>
        </select>
      </td>
      <td>
        <input
          style={{
            width: '50px',
            backgroundColor: game.score ? (isReadOnly(index) ? 'transparent' : 'white') : 'white',
            cursor: isReadOnly(index) ? 'not-allowed' : 'text',
            color: 'red',
          }}
          type="text"
          placeholder={isReadOnly(index) ? "✔️" : "x:x"}
          value={game.score}
          onChange={(e) => handleScoreChange(index, e.target.value)}
          maxLength="3"
          readOnly={isReadOnly(index)}
          title={isReadOnly(index) ? "✔️" : ""}
          disabled={gameStarted(game.date, game.kickoff)}
        />
      </td>
    </tr>
  );
};

export default GameRow;
