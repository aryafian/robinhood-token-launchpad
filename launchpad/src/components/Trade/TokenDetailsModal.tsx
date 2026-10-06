'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbiItem, type Address } from 'viem';
import type { TokenData, TradeHistoryItem } from '../../types';
import { TokenLogo } from '../Common/TokenLogo';
import { ProgressBar } from '../Common/ProgressBar';
import {
  formatAddress,
  formatSmallPrice,
  formatWei,
  formatTokenAmount,
  timeAgo,
} from '../../utils/format';
import { getAddressUrl, getTxUrl } from '../../utils/explorer';
import { robinhoodTestnet } from '../../config/chain';
import { bondingCurveAbi } from '../../config/abis';

interface TokenDetailsModalProps {
  token: TokenData;
  onClose: () => void;
  onTrade: (token: TokenData) => void;
}

const CURVE_BUY_EVENT = parseAbiItem(
  'event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)'
);
const CURVE_SELL_EVENT = parseAbiItem(
  'event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)'
);

export function TokenDetailsModal({
  token,
  onClose,
  onTrade,
}: TokenDetailsModalProps) {
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function fetchTradeHistory() {
      setIsLoadingTrades(true);
      try {
        const client = createPublicClient({
          chain: robinhoodTestnet,
          transport: http('https://robinhood-sepolia-rpc.publicnode.com'),
        });

        const currentBlock = await client.getBlockNumber();
        // Public RPC limits to 50,000 blocks per eth_getLogs
        const safeWindow = 48000n;
        const fromBlock =
          currentBlock > safeWindow
            ? (token.blockNumber > currentBlock - safeWindow ? token.blockNumber : currentBlock - safeWindow)
            : 0n;

        // Query Buy logs
        const buyLogs = await client.getLogs({
          address: token.curve,
          event: CURVE_BUY_EVENT,
          fromBlock,
          toBlock: currentBlock,
        });

        // Query Sell logs
        const sellLogs = await client.getLogs({
          address: token.curve,
          event: CURVE_SELL_EVENT,
          fromBlock,
          toBlock: currentBlock,
        });

        const tradeItems: TradeHistoryItem[] = [];

        for (const b of buyLogs) {
          tradeItems.push({
            id: `${b.transactionHash}-${b.logIndex}`,
            type: 'buy',
            trader: (b.args.buyer || b.args.recipient) as Address,
            quoteAmount: b.args.quoteIn ?? 0n,
            tokenAmount: b.args.tokensOut ?? 0n,
            fee: b.args.fee ?? 0n,
            tax: b.args.tax ?? 0n,
            transactionHash: b.transactionHash ?? '',
            blockNumber: b.blockNumber ?? 0n,
          });
        }

        for (const s of sellLogs) {
          tradeItems.push({
            id: `${s.transactionHash}-${s.logIndex}`,
            type: 'sell',
            trader: (s.args.seller || s.args.recipient) as Address,
            quoteAmount: s.args.quoteOut ?? 0n,
            tokenAmount: s.args.tokensIn ?? 0n,
            fee: s.args.fee ?? 0n,
            tax: s.args.tax ?? 0n,
            transactionHash: s.transactionHash ?? '',
            blockNumber: s.blockNumber ?? 0n,
          });
        }

        // Sort descending by block number
        tradeItems.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        if (!isCancelled) {
          setTrades(tradeItems);
        }
      } catch (err) {
        console.warn('Failed to load trade events:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingTrades(false);
        }
      }
    }

    fetchTradeHistory();

    return () => {
      isCancelled = true;
    };
  }, [token.curve, token.blockNumber]);

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
          maxWidth: '640px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: 'var(--shadow-modal)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <TokenLogo
              src={token.logo}
              symbol={token.symbol}
              name={token.name}
              size={64}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{token.name}</h2>
                <span style={{ fontSize: '1.1rem', color: 'var(--accent-lime)', fontWeight: 700 }}>
                  ${token.symbol}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Deployed by {formatAddress(token.deployer)}
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

        {/* Description */}
        {token.description && (
          <div
            style={{
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {token.description}
          </div>
        )}

        {/* Quick Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Spot Price</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--accent-lime)' }}>{formatSmallPrice(token.spotPriceEth)}</strong>
          </div>
          <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>ETH Raised</span>
            <strong style={{ fontSize: '0.9rem' }}>{formatWei(token.realQuoteReserve, 4)} ETH</strong>
          </div>
          <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Curve Status</span>
            <strong style={{ fontSize: '0.9rem', color: token.phase === 2 ? '#a78bfa' : 'var(--status-active)' }}>
              {token.phase === 2 ? 'Graduated' : 'Trading on Curve'}
            </strong>
          </div>
          <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Creator Tax</span>
            <strong style={{ fontSize: '0.9rem' }}>{Number(token.creatorTaxBps) / 100}%</strong>
          </div>
        </div>

        {/* Progress Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>
            Graduation Progress
          </h4>
          <ProgressBar
            progressBps={token.graduationProgressBps}
            realQuoteReserve={token.realQuoteReserve}
            graduationThreshold={token.graduationThreshold}
          />
        </div>

        {/* Contract Links */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.8125rem',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <a
            href={getAddressUrl(token.token)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-lime)', textDecoration: 'underline' }}
          >
            Token Contract ↗
          </a>
          <a
            href={getAddressUrl(token.curve)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-lime)', textDecoration: 'underline' }}
          >
            Bonding Curve ↗
          </a>
          <a
            href={getAddressUrl(token.deployer)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
          >
            Deployer Wallet ↗
          </a>
        </div>

        {/* Recent Trades Table */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Recent Trades</span>
            {trades.length > 0 && <span className="badge badge-lime">{trades.length}</span>}
          </h4>

          {isLoadingTrades ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading trades from Robinhood Chain...</p>
          ) : trades.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No trades recorded on this bonding curve yet. Be the first to buy!
            </p>
          ) : (
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '8px 4px' }}>Type</th>
                    <th style={{ padding: '8px 4px' }}>Trader</th>
                    <th style={{ padding: '8px 4px' }}>ETH Amount</th>
                    <th style={{ padding: '8px 4px' }}>Tokens</th>
                    <th style={{ padding: '8px 4px' }}>Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 4px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: t.type === 'buy' ? 'var(--status-active)' : 'var(--status-error)',
                          }}
                        >
                          {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '8px 4px', color: 'var(--text-secondary)' }}>
                        {formatAddress(t.trader)}
                      </td>
                      <td style={{ padding: '8px 4px' }}>{formatWei(t.quoteAmount, 4)} ETH</td>
                      <td style={{ padding: '8px 4px' }}>{formatTokenAmount(t.tokenAmount)}</td>
                      <td style={{ padding: '8px 4px' }}>
                        <a
                          href={getTxUrl(t.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-lime)' }}
                        >
                          ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1, padding: '12px' }}
          >
            Close
          </button>
          {token.phase === 0 ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onTrade(token);
              }}
              style={{ flex: 2, padding: '12px' }}
            >
              Trade ${token.symbol}
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              disabled
              style={{ flex: 2, padding: '12px', opacity: 0.5 }}
            >
              Graduated to Uniswap v4
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
