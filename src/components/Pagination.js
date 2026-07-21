import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, label }) => {
  const handlePrev = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        onClick={handlePrev}
        disabled={currentPage === 0}
        style={{
          padding: '10px',
          fontSize: '10px',
          fontWeight: 'bold',
          backgroundColor: '#ffffff00',
          color: 'gold',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '0 5px',
          transition: 'background-color 0.3s',
        }}
      >
        &lt;&lt;
      </button>
      <span style={{ margin: '0 0px', fontSize: '16px', fontWeight: 'bold' }}>
        {label} {currentPage + 1} / {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages - 1}
        style={{
          padding: '10px',
          fontSize: '10px',
          fontWeight: 'bold',
          backgroundColor: '#ffffff00',
          color: 'gold',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '0 5px',
          transition: 'background-color 0.3s',
        }}
      >
        &gt;&gt;
      </button>
    </div>
  );
};

export default Pagination;
