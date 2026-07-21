import React from 'react';

const SubmitButton = ({ handleSubmit }) => {
  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <button
        style={{
          backgroundColor: '#DC3545',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'inline-block',
          margin: '10px',
          fontSize: '14px',
          width: '60%',
          transition: 'background-color 0.3s',
        }}
        onClick={handleSubmit}
      >
        Prześlij
      </button>
    </div>
  );
};

export default SubmitButton;
