// TeamLogos.js
import React from 'react';
import styled, { keyframes } from 'styled-components';
import teamLogosData from '../gameData/teams.json'; // Adjust the path to where your teams.json file is located

// Keyframes for the continuous scrolling animation
const scroll = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
`;

// Styled-components
const TeamLogosContainer = styled.div`
  display: flex;
  overflow: hidden;
  width: 100%;
  background-color: 00ffffff; /* Adjust the background color */
  position: relative;
  height: 60px; /* Adjust height as needed */
`;

const TeamLogosWrapper = styled.div`
  display: flex;
  width: 200%; /* Width of 2x to ensure continuous scroll */
  animation: ${scroll} 30s linear infinite;
`;

const TeamLogosInner = styled.div`
  display: flex;
  flex: 1;
`;

const TeamLogo = styled.img`
  height: 40px;
  object-fit: contain;
  margin-right: 20px; /* Spacing between logos */
  flex-shrink: 0;
`;

const TeamLogos = () => {
  const logos = Object.keys(teamLogosData).map((team) => (
    <TeamLogo
      key={team}
      src={teamLogosData[team].logo}
      alt={`${team} Logo`}
    />
  ));

  return (
    <TeamLogosContainer>
      <TeamLogosWrapper>
        <TeamLogosInner>
          {logos}
          {logos} {/* Duplicate logos to ensure continuous scrolling */}
        </TeamLogosInner>
      </TeamLogosWrapper>
    </TeamLogosContainer>
  );
};

export default TeamLogos;
