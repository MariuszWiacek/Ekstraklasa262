// Team.js
import React from 'react';

const Team = ({ name, logo }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img src={logo} alt={name} style={{ width: '40px', height: '40px', marginRight: '8px' }} />
      <span>{name}</span>
    </div>
  );
};

export default Team;
