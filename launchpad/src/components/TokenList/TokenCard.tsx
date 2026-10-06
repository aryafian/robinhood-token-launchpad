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

  const getPhaseBadge = () => {
    switch (token.phase) {
      case 0:
        return <span className="badge badge-active">Active Curve</span>;
      case 1:
        return <span className="badge badge-awaiting">Awaiting Pool</span>;
      case 2:
        return <span className="badge badge-graduated">Graduated v4</span>;
      case 3:
        return <span className="badge badge-error">Cancelled</span>;
      default:
        return null;
    }
  };

  const taxPercent = Number(token.creatorTaxBps) / 100;

  return (
    <div
      className="token-card"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
        cursor: 'pointer',
      }}
      onClick={() => onViewDetails(token)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'var(--border-hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        {/* Top: Logo, Badges & Socials */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <TokenLogo
            src={token.logo}
            symbol={token.symbol}
            name={token.name}
            size={52}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {getPhaseBadge()}
            {taxPercent > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                Tax {taxPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Token Name, Ticker, and Address */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {token.name}
            </h3>
            <span
              style={{
                fontSize: '0.85rem',
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
              marginTop: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>{formatAddress(token.token)}</span>
            <button
              onClick={handleCopy}
              title="Copy token address"
              style={{
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: copied ? 'var(--accent-lime)' : 'var(--text-muted)',
              }}
            >
              {copied ? '✓' : '📋'}
            </button>
            <a
              href={getAddressUrl(token.token)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="View on Robinhood Explorer"
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                opacity: 0.8,
              }}
            >
              ↗
            </a>
          </div>
        </div>

        {/* Description snippet */}
        {token.description && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              marginBottom: '14px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.4em',
            }}
          >
            {token.description}
          </p>
        )}

        {/* Pricing Metrics */}
        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              Spot Price
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatSmallPrice(token.spotPriceEth)}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              Raised
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatWei(token.realQuoteReserve, 3)} ETH
            </span>
          </div>
        </div>

        {/* Graduation Progress Bar */}
        <div style={{ marginBottom: '16px' }}>
          <ProgressBar
            progressBps={token.graduationProgressBps}
            realQuoteReserve={token.realQuoteReserve}
            graduationThreshold={token.graduationThreshold}
          />
        </div>
      </div>

      {/* Action Button */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-secondary"
          style={{ flex: '1', fontSize: '0.8125rem', padding: '8px 12px' }}
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
            style={{ flex: '2', fontSize: '0.8125rem', padding: '8px 14px' }}
            onClick={(e) => {
              e.stopPropagation();
              onTrade(token);
            }}
          >
            Buy ${token.symbol}
          </button>
        ) : token.phase === 2 ? (
          <button
            className="btn"
            style={{
              flex: '2',
              fontSize: '0.8125rem',
              padding: '8px 14px',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa',
              cursor: 'default',
            }}
            disabled
            onClick={(e) => e.stopPropagation()}
          >
            Graduated
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            style={{ flex: '2', fontSize: '0.8125rem', padding: '8px 14px', opacity: 0.6 }}
            disabled
            onClick={(e) => e.stopPropagation()}
          >
            Phase {token.phase}
          </button>
        )}
      </div>
    </div>
  );
}
