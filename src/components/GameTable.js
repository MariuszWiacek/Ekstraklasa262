import React from 'react';
import GameRow from './GameRow'

const GameTable = ({ games, results, handleScoreChange, isReadOnly, gameStarted }) => {
  return (
    <table
      style={{
        width: '100%',
        border: '0px solid #444',
        borderCollapse: 'collapse',
        marginTop: '5%',
      }}
    >
      <thead>
        <tr>
          <th style={{ borderBottom: '0.5px solid #444' }}>Data</th>
          <th style={{ borderBottom: '0.5px solid #444' }}>Godzina</th>
          <th style={{ borderBottom: '0.5px solid #444' }}>Gospodarz</th>
          <th style={{ borderBottom: '0.5px solid #444' }}>Gość</th>
          <th style={{ borderBottom: '0.5px solid #444' }}>Wynik</th>
          <th style={{ borderBottom: '0.5px solid #444' }}></th>
          <th style={{ borderBottom: '0.5px solid #444' }}>Typ</th>
        </tr>
      </thead>
      <tbody>
        {games.map((game, index) => (
          <GameRow
            key={index}
            game={game}
            index={index}
            results={results}
            handleScoreChange={handleScoreChange}
            isReadOnly={isReadOnly}
            gameStarted={gameStarted}
          />
        ))}
      </tbody>
    </table>
  );
};

export default GameTable;
