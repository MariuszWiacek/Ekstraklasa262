import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [leader, setLeader] = useState("");

  return (
    <UserContext.Provider value={{ leader, setLeader }}>
      {children}
    </UserContext.Provider>
  );
};
