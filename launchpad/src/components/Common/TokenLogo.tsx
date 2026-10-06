'use client';

import { useState } from 'react';

interface TokenLogoProps {
  src?: string;
  symbol: string;
  name: string;
  size?: number;
  className?: string;
}

// Generate consistent gradient colors based on symbol
function getGradient(symbol: string): [string, string] {
  const palettes: [string, string][] = [
    ['#c2f141', '#10b981'],
    ['#8b5cf6', '#ec4899'],
    ['#3b82f6', '#06b6d4'],
    ['#f59e0b', '#ef4444'],
    ['#10b981', '#3b82f6'],
    ['#6366f1', '#a855f7'],
    ['#f43f5e', '#fb923c'],
  ];

  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

export function TokenLogo({
  src,
  symbol,
  name,
  size = 48,
  className = '',
}: TokenLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [gradStart, gradEnd] = getGradient(symbol || 'TOKEN');

  const showPlaceholder = !src || src.trim() === '' || hasError;

  if (showPlaceholder) {
    const initials = (symbol || name || 'TK').slice(0, 3).toUpperCase();
    return (
      <div
        className={`token-logo-placeholder ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: size > 40 ? '14px' : '10px',
          background: `linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0a0b0d',
          fontWeight: 800,
          fontSize: size > 40 ? `${Math.round(size * 0.32)}px` : '12px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          userSelect: 'none',
          flexShrink: 0,
        }}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`token-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size > 40 ? '14px' : '10px',
        overflow: 'hidden',
        position: 'relative',
        background: '#181b21',
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}
