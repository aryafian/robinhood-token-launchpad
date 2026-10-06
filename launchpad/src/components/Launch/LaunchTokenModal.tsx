'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { useLaunchToken } from '../../hooks/useLaunchToken';
import { useFactoryInfo } from '../../hooks/useFactoryInfo';
import { getAddressUrl, getTxUrl } from '../../utils/explorer';

interface LaunchTokenModalProps {
  onClose: () => void;
  onLaunchSuccess: (token: Address, curve: Address) => void;
}

export function LaunchTokenModal({
  onClose,
  onLaunchSuccess,
}: LaunchTokenModalProps) {
  const { isConnected } = useAccount();
  const { launchFeeEth } = useFactoryInfo();
  const { launchState, launchToken, resetLaunchState } = useLaunchToken();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [creatorTaxPercent, setCreatorTaxPercent] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !symbol.trim()) return;

    launchToken(
      {
        name,
        symbol,
        logo,
        description,
        twitter,
        telegram,
        website,
        creatorTaxPercent,
      },
      (token, curve) => {
        onLaunchSuccess(token, curve);
      }
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-modal-backdrop)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-hover)',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: 'var(--shadow-modal)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Launch a New Token</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Deploys an ERC-20 token and initial bonding curve on Robinhood Chain
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Success View */}
        {launchState.step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🚀</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-lime)', marginBottom: '8px' }}>
              Token Launched Successfully!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              Your token is now live on Robinhood Chain Testnet and ready for trading.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'left',
                fontSize: '0.8125rem',
                marginBottom: '24px',
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Token Address: </span>
                <a
                  href={getAddressUrl(launchState.newTokenAddress || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-lime)', textDecoration: 'underline' }}
                >
                  {launchState.newTokenAddress}
                </a>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Curve Address: </span>
                <a
                  href={getAddressUrl(launchState.newCurveAddress || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-lime)', textDecoration: 'underline' }}
                >
                  {launchState.newCurveAddress}
                </a>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ width: '100%', padding: '12px' }}
            >
              Done & Explore Tokens
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Name & Ticker */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Token Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Custom Token"
                  maxLength={64}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Symbol (Ticker) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. TEST"
                  maxLength={16}
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>

            {/* Logo URL */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Logo Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Description (Optional)
              </label>
              <textarea
                placeholder="Tell users about your token and vision..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Creator Tax Slider */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Creator Tax: <strong style={{ color: 'var(--accent-lime)' }}>{creatorTaxPercent}%</strong>
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max 10%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={creatorTaxPercent}
                onChange={(e) => setCreatorTaxPercent(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-lime)', cursor: 'pointer' }}
              />
            </div>

            {/* Launch Fee Notice */}
            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8125rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Factory Launch Fee</span>
              <strong style={{ color: 'var(--accent-lime)' }}>{launchFeeEth} ETH</strong>
            </div>

            {/* Error Message */}
            {launchState.step === 'error' && (
              <div
                style={{
                  backgroundColor: 'var(--status-error-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  color: '#f87171',
                  fontSize: '0.8125rem',
                }}
              >
                {launchState.errorMessage}
              </div>
            )}

            {launchState.step === 'rejected' && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  color: '#fca5a5',
                  fontSize: '0.8125rem',
                }}
              >
                Launch transaction was rejected in your wallet.
              </div>
            )}

            {/* Submit CTA */}
            {!isConnected ? (
              <button
                type="button"
                className="btn btn-secondary"
                disabled
                style={{ width: '100%', padding: '14px' }}
              >
                Connect Wallet to Launch
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  launchState.step === 'checking' ||
                  launchState.step === 'waiting_wallet' ||
                  launchState.step === 'submitted' ||
                  !name.trim() ||
                  !symbol.trim()
                }
                style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
              >
                {launchState.step === 'checking'
                  ? 'Checking Permissions...'
                  : launchState.step === 'waiting_wallet'
                  ? 'Confirm in MetaMask...'
                  : launchState.step === 'submitted'
                  ? 'Broadcasting to Robinhood Testnet...'
                  : `Launch Token (${launchFeeEth} ETH)`}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
