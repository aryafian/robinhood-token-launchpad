'use client';

import type { TokenData } from '../../types';
import { TokenCard } from './TokenCard';

interface TokenGridProps {
  tokens: TokenData[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onTrade: (token: TokenData) => void;
  onViewDetails: (token: TokenData) => void;
}

export function TokenGrid({
  tokens,
  isLoading,
  error,
  onRetry,
  onTrade,
  onViewDetails,
}: TokenGridProps) {
  // State 1: Error with Retry button
  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: '560px',
          margin: '40px auto',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#f87171' }}>
          Failed to Load Tokens
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
          {error}
        </p>
        <button
          className="btn btn-primary"
          onClick={onRetry}
          style={{ padding: '10px 24px' }}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  // State 2: Loading Skeletons
  if (isLoading && tokens.length === 0) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
              height: '340px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '14px' }} />
                <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '9999px' }} />
              </div>
              <div className="skeleton" style={{ width: '140px', height: '20px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '90px', height: '14px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '10px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '100%', height: '8px', borderRadius: '9999px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="skeleton" style={{ flex: '1', height: '36px', borderRadius: '9999px' }} />
              <div className="skeleton" style={{ flex: '2', height: '36px', borderRadius: '9999px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // State 3: Empty State
  if (tokens.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '64px 24px',
          textAlign: 'center',
          maxWidth: '520px',
          margin: '40px auto',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
          No Tokens Found
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
          No tokens match your current filter or search criteria.
        </p>
        <button
          className="btn btn-secondary"
          onClick={onRetry}
          style={{ padding: '8px 20px', fontSize: '0.8125rem' }}
        >
          Reset Filters
        </button>
      </div>
    );
  }

  // Active Grid
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}
    >
      {tokens.map((token) => (
        <TokenCard
          key={token.token}
          token={token}
          onTrade={onTrade}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
