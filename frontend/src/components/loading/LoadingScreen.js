import React from 'react';
import styled, { keyframes } from 'styled-components';

/* CSS-only animated background — zero video decode, zero network cost */
const bgFloat = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const spin = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const StyledLoadingScreen = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #080c14;

  /* Subtle animated radial gradient — GPU-composited, <1 % CPU */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 20% 30%, rgba(171, 159, 242, 0.07) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 70%, rgba(252, 128, 41, 0.06) 0%, transparent 55%),
                radial-gradient(ellipse at 50% 50%, rgba(0, 255, 255, 0.04) 0%, transparent 60%);
    background-size: 200% 200%;
    animation: ${bgFloat} 10s ease infinite;
    pointer-events: none;
  }
`;

const LoaderWrapper = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const GlowingSpinner = styled.div`
  border: 8px solid rgba(255, 255, 255, 0.1);
  border-top: 8px solid #00ffff;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: ${spin} 1.2s linear infinite;
  box-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff66;
`;

const LoadingText = styled.div`
  margin-top: 20px;
  color: white;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 0 10px #00ffff44;
`;

const LoadingScreen = () => (
  <StyledLoadingScreen>
    <LoaderWrapper>
      <GlowingSpinner />
      <LoadingText>Loading experience...</LoadingText>
    </LoaderWrapper>
  </StyledLoadingScreen>
);

export default LoadingScreen;
