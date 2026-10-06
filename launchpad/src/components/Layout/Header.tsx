'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatAddress, formatWei } from '../../utils/format';
import { useFactoryInfo } from '../../hooks/useFactoryInfo';
import { useNetworkManager } from '../../hooks/useNetworkManager';

interface HeaderProps {
  onOpenLaunchModal: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function Header({
  onOpenLaunchModal,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address,
  });
  const { launchFeeEth, isLoading: isFeeLoading } = useFactoryInfo();
  const { isWrongNetwork, switchToRobinhood } = useNetworkManager();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    // Find injected (MetaMask) connector or first connector
    const injectedConnector =
      connectors.find((c) => c.id === 'injected' || c.name.toLowerCase().includes('metamask')) ||
      connectors[0];

    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  return (
    <header className="navbar-sticky">
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          gap: '16px',
        }}
      >
        {/* Left: Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #c2f141 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚡</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                PONS<span style={{ color: 'var(--accent-lime)' }}>PAD</span>
              </span>
              <span className="badge badge-lime" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                RH Testnet
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Robinhood Chain Bonding Curves
            </p>
          </div>
        </div>

        {/* Center: Live Stats Pill (Launch Fee & Testnet status) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 16px',
            fontSize: '0.8rem',
          }}
          className="header-stats-pill"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-pulse" />
            <span style={{ color: 'var(--text-secondary)' }}>Chain:</span>
            <strong style={{ color: 'var(--text-primary)' }}>46630</strong>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Launch Fee:</span>
            <strong style={{ color: 'var(--accent-lime)' }}>
              {isFeeLoading ? '...' : `${launchFeeEth} ETH`}
            </strong>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Token Data"
            style={{
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: isRefreshing ? 'var(--accent-lime)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.8s ease' }}>
              🔄
            </span>
            <span style={{ fontSize: '0.7rem' }}>Sync</span>
          </button>
        </div>

        {/* Right: Actions & Wallet Connect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Launch Token Button (Bonus) */}
          <button
            className="btn btn-primary"
            onClick={onOpenLaunchModal}
            style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
          >
            <span>+</span> Launch Token
          </button>

          {/* Network Switcher Pill if wrong */}
          {isWrongNetwork ? (
            <button
              onClick={switchToRobinhood}
              style={{
                backgroundColor: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>⚠️</span> Switch Chain
            </button>
          ) : null}

          {/* Wallet State */}
          {isConnected && address ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 6px 4px 14px',
                gap: '10px',
              }}
            >
              {/* Balance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Balance:</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {balanceData ? `${formatWei(balanceData.value, 3)} ETH` : '0 ETH'}
                </strong>
              </div>

              {/* Address with copy & disconnect */}
              <button
                onClick={handleCopy}
                title="Click to copy address"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: copied ? 'var(--accent-lime)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{formatAddress(address)}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  {copied ? '✓' : '📋'}
                </span>
              </button>

              <button
                onClick={() => disconnect()}
                title="Disconnect Wallet"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  transition: 'color 0.15s ease',
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={handleConnect}
              style={{ fontSize: '0.8125rem', padding: '8px 18px' }}
            >
              <span>🦊</span> Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
