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
  const { data: balanceData } = useBalance({ address });
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
          height: '56px',
          gap: '14px',
        }}
      >
        {/* Left: Brand & Network Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="/"
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: 'var(--accent-lime)' }}>PONSPAD</span>
          </a>
          <span className="badge badge-network">
            <span className="status-dot" />
            Robinhood #46630
          </span>
        </div>

        {/* Center: Protocol Parameters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
          className="header-stats-pill"
        >
          <div>
            <span>Launch Fee: </span>
            <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {isFeeLoading ? '...' : `${launchFeeEth} ETH`}
            </strong>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sync latest blocks"
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.75rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: isRefreshing ? 'var(--accent-lime)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{isRefreshing ? '...' : '↻'}</span>
            <span>Sync</span>
          </button>
        </div>

        {/* Right: Actions & Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={onOpenLaunchModal}
            style={{ padding: '6px 12px', fontSize: '0.78125rem' }}
          >
            + Launch Token
          </button>

          {isWrongNetwork && (
            <button
              onClick={switchToRobinhood}
              style={{
                backgroundColor: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              Switch Chain
            </button>
          )}

          {isConnected && address ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                gap: '8px',
                fontSize: '0.78125rem',
              }}
            >
              <div className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {balanceData ? `${formatWei(balanceData.value, 3)} ETH` : '0 ETH'}
              </div>

              <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-subtle)' }} />

              <button
                onClick={handleCopy}
                title="Copy address"
                className="font-mono"
                style={{
                  color: copied ? 'var(--accent-lime)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{formatAddress(address)}</span>
                <span style={{ fontSize: '0.7rem' }}>{copied ? '✓' : '⧉'}</span>
              </button>

              <button
                onClick={() => disconnect()}
                title="Disconnect"
                style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '2px' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              style={{ padding: '6px 14px', fontSize: '0.78125rem' }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
