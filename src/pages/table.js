import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import { calculatePoints } from '../components/calculatePoints';
import Stats from './stats';

const firebaseConfig = {
  apiKey: "AIzaSyDq4d4qabXG-fMMsZijtR6uhFVl85rMmMM",
  authDomain: "jesien2026.firebaseapp.com",
  databaseURL: "https://jesien2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jesien2026",
  storageBucket: "jesien2026.firebasestorage.app",
  messagingSenderId: "656642340528",
  appId: "1:656642340528:web:33265dcdadba31c1842d75",
  measurementId: "G-LK891R7MQ1"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const linkContainerStyle = {
  textAlign: 'left',
  backgroundColor: '#212529ab',
  padding: '20px',
  borderRadius: '10px',
  marginBottom: '20px',
};

const tableHeaderStyle = {
  padding: '10px',
  border: '1px solid #444',
  backgroundColor: '#212529',
  color: 'white',
  textAlign: 'center',
};

const tableCellStyle = {
  padding: '10px',
  border: '1px solid #444',
  textAlign: 'center',
};

const textToggleStyle = {
  cursor: 'pointer',
  color: '#ffd700',
  textDecoration: 'underline',
  margin: '10px 0',
  fontSize: '1.1em',
  textAlign: 'center',
};

const prizeInfoStyle = {
  color: '#0f0',
  fontSize: '1em',
  textAlign: 'center',
  marginTop: '10px',
};

const earningsStyle = {
  color: '#f39c12',
  fontSize: '1.1em',
  textAlign: 'center',
  marginTop: '30px',
};

// Helper function to set background colors for top 3 positions
const getRankColor = (index) => {
  switch (index) {
    case 0:
      return 'rgba(255, 215, 0, 0.45)'; // Gold
    case 1:
      return 'rgba(192, 192, 192, 0.45)'; // Silver
    case 2:
      return 'rgba(205, 127, 50, 0.45)'; // Bronze
    default:
      return 'rgba(0, 0, 0, 0.336)'; // Default dark row
  }
};

// Helper function to compare two entries for tie-breaking
const compareEntries = (a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
  return b.correctTypes - a.correctTypes;
};

// Helper function to assign places with ties
const assignPlaces = (data) => {
  data.forEach((entry, index) => {
    if (index === 0) {
      entry.place = 1;
    } else {
      const prev = data[index - 1];
      if (
        entry.points === prev.points &&
        entry.correctResults === prev.correctResults &&
        entry.correctTypes === prev.correctTypes
      ) {
        entry.place = prev.place;
      } else {
        entry.place = index + 1;
      }
    }
  });
};

// Advanced & Fair OVR Calculation (0-99)
const calculateOVR = (entry, totalUsers) => {
  const { points, totalBets, correctResults, correctTypes, place } = entry;
  if (totalBets === 0) return 50;

  // 1. Efficiency Score (Points per bet, scale 0-35)
  const ppb = points / totalBets;
  const efficiencyScore = Math.min(35, ppb * 22);

  // 2. Precision Ratio (Exact results relative to total hits, scale 0-25)
  const precisionRatio = correctTypes > 0 ? correctResults / correctTypes : 0;
  const precisionScore = Math.min(25, precisionRatio * 40);

  // 3. Table Position Bonus (Scale 0-35)
  const positionBonus = totalUsers > 0 ? Math.max(0, ((totalUsers - place + 1) / totalUsers) * 35) : 0;

  // Base OVR 50 + sub-scores (Max 99)
  const calculatedOVR = Math.round(50 + (efficiencyScore + precisionScore + positionBonus) / 2.2);
  return Math.min(99, Math.max(50, calculatedOVR));
};

// Generates dynamic feedback prioritizing skills, high performance & accuracy over missed bets
const generateUserComment = (entry, totalPlayedGames, totalUsers) => {
  const { place, totalBets, ppb, correctResults, correctTypes } = entry;
  const missedGames = totalPlayedGames - totalBets;
  const isTopThree = place <= 3;
  const exactResultRatio = correctTypes > 0 ? correctResults / correctTypes : 0;

  // 1. High-performing / Top Users - Praise strengths regardless of missed bets
  if (place === 1) return '👑 Lider tabeli! Niesamowita regularność i wysoka chłodna precyzja.';
  if (isTopThree) return '🔥 Walczy o podium! Ogromna presja na liderze i wysoka skuteczność.';

  // 2. PlayStyles / Special Strengths (Precyzja trafień)
  if (exactResultRatio >= 0.4 && correctResults >= 3) {
    return '🎯 Chirurgiczna precyzja! Potrafi trafiać dokładne wyniki (3
