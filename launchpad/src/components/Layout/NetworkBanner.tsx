'use client';

import { useNetworkManager } from '../../hooks/useNetworkManager';

export function NetworkBanner() {
  const { isWrongNetwork, isSwitching, switchToRobinhood, targetChain, switchError } =
    useNetworkManager();

  if (!isWrongNetwork) return null;

  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#fca5a5',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.875rem',
        fontWeight: 500,
        zIndex: 60,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.1rem' }}>⚠️</span>
        <span>
          You are connected to an unsupported network. Please switch to{' '}
          <strong style={{ color: '#fff' }}>{targetChain.name} (Chain ID: 46630)</strong>.
        </span>
      </div>

      <button
        onClick={switchToRobinhood}
        disabled={isSwitching}
        style={{
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '6px 14px',
          borderRadius: '9999px',
          fontWeight: 600,
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
      >
        {isSwitching ? 'Switching Network...' : 'Switch to Robinhood Testnet'}
      </button>

      {switchError && (
        <span style={{ fontSize: '0.75rem', color: '#f87171', width: '100%', textAlign: 'center' }}>
          {switchError}
        </span>
      )}
    </div>
  );
}
