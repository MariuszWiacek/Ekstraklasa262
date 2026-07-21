import React, { useState } from 'react';

const AdminButtons = () => {
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const verifyAdminPassword = () => {
    if (password === 'maniek123') {
      setIsAdmin(true);
    } else {
      alert('Invalid password!');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      {!isAdmin ? (
        <div>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter admin password"
            style={{
              padding: '10px',
              fontSize: '16px',
              margin: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
          />
          <button
            onClick={verifyAdminPassword}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Verify Password
          </button>
        </div>
      ) : (
        <div>
          <button
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
            onClick={() => console.log('Disable Read-Only/Disabled')}
          >
            Disable Read-Only/Disabled
          </button>
          <button
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            onClick={() => console.log('Enable Read-Only/Disabled')}
          >
            Enable Read-Only/Disabled
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminButtons;
