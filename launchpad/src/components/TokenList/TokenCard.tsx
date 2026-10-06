'use client';

import { useState } from 'react';
import type { TokenData } from '../../types';
import { TokenLogo } from '../Common/TokenLogo';
import { ProgressBar } from '../Common/ProgressBar';
import { formatAddress, formatSmallPrice, formatWei } from '../../utils/format';
import { getAddressUrl } from '../../utils/explorer';

interface TokenCardProps {
  token: TokenData;
  onTrade: (token: TokenData) => void;
  onViewDetails: (token: TokenData) => void;
}

export function TokenCard({ token, onTrade, onViewDetails }: TokenCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const taxPercent = Number(token.creatorTaxBps) / 100;

  return (
    <div
      className="token-card"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
        cursor: 'pointer',
      }}
      onClick={() => onViewDetails(token)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)';
        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
      }}
    >
      <div>
        {/* Top: Logo & Status Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <TokenLogo
            src={token.logo}
            symbol={token.symbol}
            name={token.name}
            size={48}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {token.phase === 0 ? (
              <span className="badge badge-active">Active Curve</span>
            ) : token.phase === 2 ? (
              <span className="badge badge-graduated">Graduated v4</span>
            ) : (
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                Phase {token.phase}
              </span>
            )}

            {taxPercent > 0 && (
              <span className="badge badge-tax">
                Tax {taxPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Token Identification */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {token.name}
            </h3>
            <span
              className="font-mono"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--accent-lime)',
              }}
            >
              ${token.symbol}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '2px',
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
            }}
          >
            <span className="font-mono">{formatAddress(token.token)}</span>
            <button
              onClick={handleCopy}
              title="Copy address"
              style={{ color: copied ? 'var(--accent-lime)' : 'var(--text-muted)' }}
            >
              {copied ? '✓' : '⧉'}
            </button>
            <a
              href={getAddressUrl(token.token)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="View Explorer"
              style={{ color: 'var(--text-muted)' }}
            >
              ↗
            </a>
          </div>
        </div>

        {/* Pricing Inset */}
        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
              Spot Price
            </span>
            <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatSmallPrice(token.spotPriceEth)}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
              Raised
            </span>
            <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatWei(token.realQuoteReserve, 3)} ETH
            </span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '14px' }}>
          <ProgressBar
            progressBps={token.graduationProgressBps}
            realQuoteReserve={token.realQuoteReserve}
            graduationThreshold={token.graduationThreshold}
          />
        </div>
      </div>

      {/* Action CTA */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem' }}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(token);
          }}
        >
          Details
        </button>

        {token.phase === 0 ? (
          <button
            className="btn btn-primary"
            style={{ flex: 2, padding: '6px 10px', fontSize: '0.75rem' }}
            onClick={(e) => {
              e.stopPropagation();
              onTrade(token);
            }}
          >
            Buy ${token.symbol}
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            style={{ flex: 2, padding: '6px 10px', fontSize: '0.75rem', opacity: 0.6 }}
            disabled
            onClick={(e) => e.stopPropagation()}
          >
            {token.phase === 2 ? 'Graduated' : `Phase ${token.phase}`}
          </button>
        )}
      </div>
    </div>
  );
}
