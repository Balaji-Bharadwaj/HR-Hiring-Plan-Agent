import React from 'react';

const RotatingGradientRing = ({ size = 100 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="25%" stopColor="#EA4335" />
          <stop offset="50%" stopColor="#FBBC05" />
          <stop offset="75%" stopColor="#34A853" />
          <stop offset="100%" stopColor="#4285F4" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="10">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

export default RotatingGradientRing;