import React from 'react';
import usersData from '../gameData/users.json';

const UserSelector = ({ selectedUser, handleUserChange }) => {
  return (
    <select
      style={{ margin: '1px' }}
      value={selectedUser}
      onChange={handleUserChange}
    >
      <option value="">Użytkownik</option>
      {Object.keys(usersData).map((user, index) => (
        <option key={index} value={user}>{user}</option>
      ))}
    </select>
  );
};

export default UserSelector;
