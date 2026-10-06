'use client';

import { useState } from 'react';

interface TokenLogoProps {
  src?: string;
  symbol: string;
  name: string;
  size?: number;
  className?: string;
}

export function TokenLogo({
  src,
  symbol,
  name,
  size = 44,
  className = '',
}: TokenLogoProps) {
  const [hasError, setHasError] = useState(false);

  const showPlaceholder = !src || src.trim() === '' || hasError;

  if (showPlaceholder) {
    const initials = (symbol || name || 'TK').slice(0, 3).toUpperCase();
    return (
      <div
        className={`token-logo-placeholder font-mono ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '8px',
          backgroundColor: '#1b1e26',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e2e8f0',
          fontWeight: 700,
          fontSize: size > 40 ? `${Math.round(size * 0.32)}px` : '11px',
          userSelect: 'none',
          flexShrink: 0,
          letterSpacing: '-0.02em',
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
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#1b1e26',
        border: '1px solid rgba(255, 255, 255, 0.08)',
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
