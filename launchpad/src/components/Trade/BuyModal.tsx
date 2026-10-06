'use client';

import { useState, useId } from 'react';
import { parseEther, type Address } from 'viem';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import type { TokenData } from '../../types';
import { TokenLogo } from '../Common/TokenLogo';
import { ProgressBar } from '../Common/ProgressBar';
import {
  calculateCurveBuy,
  calculateCurveSell,
} from '../../utils/curve';
import {
  formatSmallPrice,
  formatTokenAmount,
  formatWei,
  formatAddress,
} from '../../utils/format';
import { getTxUrl, getAddressUrl } from '../../utils/explorer';
import { useCurveTrade } from '../../hooks/useCurveTrade';
import { useNetworkManager } from '../../hooks/useNetworkManager';
import { launcherTokenAbi } from '../../config/abis';

interface BuyModalProps {
  token: TokenData;
  onClose: () => void;
  onTradeSuccess: () => void;
}

export function BuyModal({ token, onClose, onTradeSuccess }: BuyModalProps) {
  const { address: userAddress, isConnected } = useAccount();
  const { data: ethBalanceData, refetch: refetchEthBalance } = useBalance({
    address: userAddress,
  });
  const { isWrongNetwork, switchToRobinhood } = useNetworkManager();
  const { tradeState, executeBuy, executeSell, resetState } = useCurveTrade();

  // Read user's token balance
  const { data: userTokenBalanceWei, refetch: refetchTokenBalance } = useReadContract({
    address: token.token,
    abi: launcherTokenAbi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress),
    },
  });

  const userTokenBalance = (userTokenBalanceWei as bigint | undefined) ?? 0n;

  // Trade Mode: 'buy' or 'sell'
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [amountInput, setAmountInput] = useState('');
  const [slippagePercent, setSlippagePercent] = useState<number>(1.0); // 1% default
  const [customSlippage, setCustomSlippage] = useState(false);
  const slippageInputId = useId();

  const slippageBps = BigInt(Math.round(slippagePercent * 100));

  // Parse input amount to BigInt wei
  let parsedAmountWei = 0n;
  let parseError: string | null = null;

  if (amountInput.trim() !== '') {
    // Validate decimal precision <= 18
    const parts = amountInput.trim().split('.');
    if (parts.length > 2) {
      parseError = 'Invalid decimal number';
    } else if (parts[1] && parts[1].length > 18) {
      parseError = 'Maximum 18 decimal places allowed';
    } else {
      try {
        parsedAmountWei = parseEther(amountInput.trim());
      } catch {
        parseError = 'Invalid amount entered';
      }
    }
  }

  // Calculations
  const buyCalc = calculateCurveBuy(
    parsedAmountWei,
    token.quoteReserve,
    token.tokenReserve,
    token.feeBps,
    token.creatorTaxBps,
    slippageBps
  );

  const sellCalc = calculateCurveSell(
    parsedAmountWei,
    token.quoteReserve,
    token.tokenReserve,
    token.feeBps,
    token.creatorTaxBps,
    slippageBps
  );

  // Balance checking
  const userEthWei = ethBalanceData?.value ?? 0n;
  const isInsufficientEth =
    tradeMode === 'buy' && parsedAmountWei > 0n && parsedAmountWei > userEthWei;
  const isInsufficientTokens =
    tradeMode === 'sell' && parsedAmountWei > 0n && parsedAmountWei > userTokenBalance;

  // Handler for successful trade
  const handleSuccess = () => {
    refetchEthBalance();
    refetchTokenBalance();
    onTradeSuccess();
  };

  const handleAction = () => {
    if (tradeMode === 'buy') {
      executeBuy(token.curve, parsedAmountWei, buyCalc.minTokensOut, handleSuccess);
    } else {
      executeSell(token.token, token.curve, parsedAmountWei, sellCalc.minQuoteOut, handleSuccess);
    }
  };

  // Quick chips
  const quickEthOptions = ['0.001', '0.005', '0.01', '0.05'];

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
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-hover)',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <TokenLogo
              src={token.logo}
              symbol={token.symbol}
              name={token.name}
              size={56}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{token.name}</h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--accent-lime)', fontWeight: 700 }}>
                  ${token.symbol}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Curve: {formatAddress(token.curve)}
              </p>
            </div>
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
              fontSize: '1rem',
              color: 'var(--text-secondary)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Bonding Curve Status Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Spot Price</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {formatSmallPrice(token.spotPriceEth)}
            </strong>
          </div>
          <ProgressBar
            progressBps={token.graduationProgressBps}
            realQuoteReserve={token.realQuoteReserve}
            graduationThreshold={token.graduationThreshold}
            height={6}
          />
        </div>

        {/* Tab Toggle: Buy vs Sell */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-full)',
            padding: '4px',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => {
              setTradeMode('buy');
              setAmountInput('');
              resetState();
            }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.875rem',
              transition: 'all 0.15s ease',
              backgroundColor: tradeMode === 'buy' ? 'var(--accent-lime)' : 'transparent',
              color: tradeMode === 'buy' ? 'var(--text-inverted)' : 'var(--text-secondary)',
            }}
          >
            Buy ${token.symbol}
          </button>
          <button
            onClick={() => {
              setTradeMode('sell');
              setAmountInput('');
              resetState();
            }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.875rem',
              transition: 'all 0.15s ease',
              backgroundColor: tradeMode === 'sell' ? 'var(--accent-lime)' : 'transparent',
              color: tradeMode === 'sell' ? 'var(--text-inverted)' : 'var(--text-secondary)',
            }}
          >
            Sell ${token.symbol}
          </button>
        </div>

        {/* Balance Display */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}
        >
          <span>
            {tradeMode === 'buy' ? 'You Pay (ETH)' : `You Pay ($${token.symbol})`}
          </span>
          <span style={{ display: 'flex', gap: '8px' }}>
            <span>
              ETH: <strong>{ethBalanceData ? formatWei(ethBalanceData.value, 4) : '0'}</strong>
            </span>
            <span>•</span>
            <span>
              {token.symbol}: <strong>{formatTokenAmount(userTokenBalance)}</strong>
            </span>
          </span>
        </div>

        {/* Amount Input */}
        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            border: `1px solid ${parseError ? 'var(--status-error)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              type="text"
              placeholder="0.0"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                resetState();
              }}
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                width: '70%',
                backgroundColor: 'transparent',
              }}
            />
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              {tradeMode === 'buy' ? 'ETH' : token.symbol}
            </span>
          </div>
          {parseError && (
            <p style={{ color: 'var(--status-error)', fontSize: '0.75rem', marginTop: '6px' }}>
              {parseError}
            </p>
          )}
        </div>

        {/* Quick Amount Chips */}
        {tradeMode === 'buy' ? (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {quickEthOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setAmountInput(opt);
                  resetState();
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-lime)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                {opt} ETH
              </button>
            ))}
            <button
              onClick={() => {
                if (userEthWei > 0n) {
                  // Keep a little gas cushion (0.002 ETH)
                  const cushion = parseEther('0.002');
                  const maxSpend = userEthWei > cushion ? userEthWei - cushion : 0n;
                  setAmountInput(formatWei(maxSpend, 6));
                  resetState();
                }
              }}
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--accent-lime)',
              }}
            >
              MAX
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['25%', '50%', '75%', '100%'].map((pct, idx) => (
              <button
                key={pct}
                onClick={() => {
                  const factor = [0.25, 0.5, 0.75, 1][idx];
                  const amount = (userTokenBalance * BigInt(Math.round(factor * 100))) / 100n;
                  setAmountInput(formatWei(amount, 4));
                  resetState();
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                {pct}
              </button>
            ))}
          </div>
        )}

        {/* Estimated Output & Breakdown */}
        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '20px',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>You Receive (est.)</span>
            <strong style={{ color: 'var(--accent-lime)', fontSize: '0.95rem' }}>
              {tradeMode === 'buy'
                ? `${formatTokenAmount(buyCalc.tokensOut)} ${token.symbol}`
                : `${formatWei(sellCalc.netQuoteOut, 5)} ETH`}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span>Minimum Received</span>
            <span>
              {tradeMode === 'buy'
                ? `${formatTokenAmount(buyCalc.minTokensOut)} ${token.symbol}`
                : `${formatWei(sellCalc.minQuoteOut, 5)} ETH`}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span>Curve Protocol Fee (1%)</span>
            <span>
              {tradeMode === 'buy' ? `${formatWei(buyCalc.fee, 6)} ETH` : `${formatWei(sellCalc.fee, 6)} ETH`}
            </span>
          </div>

          {token.creatorTaxBps > 0n && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#f59e0b', fontSize: '0.75rem' }}>
              <span>Creator Tax ({Number(token.creatorTaxBps) / 100}%)</span>
              <span>
                {tradeMode === 'buy' ? `${formatWei(buyCalc.creatorTax, 6)} ETH` : `${formatWei(sellCalc.creatorTax, 6)} ETH`}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span>Price Impact</span>
            <span>
              {tradeMode === 'buy'
                ? `${buyCalc.priceImpactPercent.toFixed(2)}%`
                : `${sellCalc.priceImpactPercent.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Slippage Settings */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Slippage Tolerance
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-lime)', fontWeight: 600 }}>
              {slippagePercent}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSlippagePercent(s);
                  setCustomSlippage(false);
                }}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: !customSlippage && slippagePercent === s ? 'rgba(194, 241, 65, 0.15)' : 'var(--bg-input)',
                  border: `1px solid ${!customSlippage && slippagePercent === s ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                  color: !customSlippage && slippagePercent === s ? 'var(--accent-lime)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {s}%
              </button>
            ))}
            <div style={{ flex: 1 }}>
              <input
                id={slippageInputId}
                aria-label="Custom slippage percentage"
                type="number"
                placeholder="Custom %"
                step="0.1"
                min="0.1"
                max="50"
                value={customSlippage ? slippagePercent : ''}
                onChange={(e) => {
                  setCustomSlippage(true);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setSlippagePercent(val);
                }}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: customSlippage ? 'rgba(194, 241, 65, 0.15)' : 'var(--bg-input)',
                  border: `1px solid ${customSlippage ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                  color: customSlippage ? 'var(--accent-lime)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                }}
              />
            </div>
          </div>
        </div>

        {/* Transaction State Indicators (Langkah 7) */}
        {tradeState.step === 'submitted' && (
          <div
            style={{
              backgroundColor: 'var(--status-pending-bg)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="live-pulse" />
              <strong style={{ color: '#fbbf24' }}>Transaction Pending on Robinhood Testnet</strong>
            </div>
            {tradeState.txHash && (
              <a
                href={getTxUrl(tradeState.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-lime)', textDecoration: 'underline', fontSize: '0.75rem' }}
              >
                View on Explorer ↗
              </a>
            )}
          </div>
        )}

        {tradeState.step === 'success' && (
          <div
            style={{
              backgroundColor: 'var(--status-active-bg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ color: 'var(--status-active)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
              ✓ Trade Successful!
            </div>
            {tradeState.tokensReceived && (
              <p style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>
                Received <strong>{formatTokenAmount(tradeState.tokensReceived)} ${token.symbol}</strong>
              </p>
            )}
            {tradeState.quoteReceived && (
              <p style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>
                Received <strong>{formatWei(tradeState.quoteReceived, 5)} ETH</strong>
              </p>
            )}
            {tradeState.txHash && (
              <a
                href={getTxUrl(tradeState.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-lime)', textDecoration: 'underline', fontSize: '0.75rem' }}
              >
                View Transaction on Explorer ↗
              </a>
            )}
          </div>
        )}

        {tradeState.step === 'rejected' && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              color: '#fca5a5',
              fontSize: '0.8125rem',
            }}
          >
            ⚠️ Transaction was rejected in wallet. Form is ready for another attempt.
          </div>
        )}

        {tradeState.step === 'error' && (
          <div
            style={{
              backgroundColor: 'var(--status-error-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px',
              color: '#f87171',
              fontSize: '0.8125rem',
            }}
          >
            <strong>Error:</strong> {tradeState.errorMessage}
          </div>
        )}

        {/* Primary CTA Button */}
        {!isConnected ? (
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            disabled
          >
            Connect Wallet in Header
          </button>
        ) : isWrongNetwork ? (
          <button
            className="btn btn-danger"
            onClick={switchToRobinhood}
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
          >
            Switch to Robinhood Testnet
          </button>
        ) : token.phase !== 0 ? (
          <button
            className="btn"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '0.95rem',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              color: '#a78bfa',
              cursor: 'not-allowed',
            }}
            disabled
          >
            {token.phase === 2
              ? 'Token Graduated (Trading Disabled on Curve)'
              : `Trading Disabled (Phase ${token.phase})`}
          </button>
        ) : parsedAmountWei <= 0n ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            disabled
          >
            Enter {tradeMode === 'buy' ? 'ETH' : token.symbol} Amount
          </button>
        ) : isInsufficientEth ? (
          <button
            className="btn btn-danger"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            disabled
          >
            Insufficient ETH Balance
          </button>
        ) : isInsufficientTokens ? (
          <button
            className="btn btn-danger"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            disabled
          >
            Insufficient Token Balance
          </button>
        ) : tradeState.step === 'waiting_wallet' ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            disabled
          >
            Confirm in Wallet...
          </button>
        ) : tradeState.step === 'submitted' ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            disabled
          >
            Pending Block Confirmation...
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleAction}
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
          >
            {tradeMode === 'buy' ? `Buy $${token.symbol}` : `Sell $${token.symbol}`}
          </button>
        )}
      </div>
    </div>
  );
}
