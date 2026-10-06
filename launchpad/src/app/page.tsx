'use client';

import { useState, useMemo } from 'react';
import type { TokenData, Address } from '../types';
import { useTokenIndexer } from '../hooks/useTokenIndexer';
import { useTokensWithData } from '../hooks/useTokensWithData';
import { Header } from '../components/Layout/Header';
import { NetworkBanner } from '../components/Layout/NetworkBanner';
import {
  TokenFilters,
  type FilterStatus,
  type SortOption,
} from '../components/TokenList/TokenFilters';
import { TokenGrid } from '../components/TokenList/TokenGrid';
import { BuyModal } from '../components/Trade/BuyModal';
import { TokenDetailsModal } from '../components/Trade/TokenDetailsModal';
import { LaunchTokenModal } from '../components/Launch/LaunchTokenModal';

export default function LaunchpadHome() {
  // Token indexing & live multicall data
  const {
    tokens: rawTokens,
    isLoading: isIndexLoading,
    isRefreshing: isIndexRefreshing,
    error: indexError,
    refresh: refreshIndexer,
    scannedBlock,
    latestBlock,
  } = useTokenIndexer();

  const {
    tokensData,
    isLoading: isDataLoading,
    error: dataError,
    refetch: refetchMarketData,
  } = useTokensWithData(rawTokens);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('progress_desc');

  // Modal states
  const [activeTradeToken, setActiveTradeToken] = useState<TokenData | null>(null);
  const [activeDetailsToken, setActiveDetailsToken] = useState<TokenData | null>(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

  // Refresh both indexer and live data
  const handleRefresh = async () => {
    await refreshIndexer();
    await refetchMarketData();
  };

  // Filter & Sort tokens
  const filteredTokens = useMemo(() => {
    let list = [...tokensData];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.token.toLowerCase().includes(q) ||
          t.deployer.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      list = list.filter((t) => t.phase === 0);
    } else if (statusFilter === 'graduated') {
      list = list.filter((t) => t.phase === 2);
    }

    // Sort option
    switch (sortOption) {
      case 'progress_desc':
        list.sort((a, b) => Number(b.graduationProgressBps - a.graduationProgressBps));
        break;
      case 'newest':
        list.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        break;
      case 'raised_desc':
        list.sort((a, b) => (b.realQuoteReserve > a.realQuoteReserve ? 1 : -1));
        break;
      case 'price_asc':
        list.sort((a, b) => a.spotPriceEth - b.spotPriceEth);
        break;
      default:
        break;
    }

    return list;
  }, [tokensData, searchQuery, statusFilter, sortOption]);

  const activeCount = useMemo(
    () => tokensData.filter((t) => t.phase === 0).length,
    [tokensData]
  );
  const graduatedCount = useMemo(
    () => tokensData.filter((t) => t.phase === 2).length,
    [tokensData]
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Network Warning Banner */}
      <NetworkBanner />

      {/* Main Header */}
      <Header
        onOpenLaunchModal={() => setIsLaunchModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isIndexRefreshing}
      />

      {/* Hero Section */}
      <section
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, rgba(194, 241, 65, 0.03) 0%, rgba(10, 11, 13, 0) 100%)',
          padding: '48px 0 36px',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '820px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span className="live-pulse" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-lime)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Robinhood Chain Testnet · Live Bonding Curves
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                marginBottom: '14px',
              }}
            >
              Discover, Trade, & Launch Tokens with{' '}
              <span style={{ color: 'var(--accent-lime)' }}>Guaranteed Liquidity</span>
            </h1>

            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '24px',
                maxWidth: '680px',
              }}
            >
              Every token launches on a mathematical bonding curve. Once 100% of the threshold is raised,
              the curve automatically graduates into an automated Uniswap v4 liquidity pool.
            </p>

            {/* Quick Metrics Strip */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '24px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.8125rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Total Tokens</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {tokensData.length}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Active Curves</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--status-active)' }}>
                  {activeCount}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Graduated (v4)</span>
                <strong style={{ fontSize: '1.1rem', color: '#a78bfa' }}>
                  {graduatedCount}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Latest Block</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  #{latestBlock.toString()}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Token Explorer */}
      <main style={{ flex: 1, padding: '36px 0 64px' }}>
        <div className="container">
          {/* Controls: Search, Filter Tabs, Sort */}
          <TokenFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
            totalTokens={tokensData.length}
            activeCount={activeCount}
            graduatedCount={graduatedCount}
          />

          {/* Tokens Grid */}
          <TokenGrid
            tokens={filteredTokens}
            isLoading={isIndexLoading || (isDataLoading && tokensData.length === 0)}
            error={indexError || dataError}
            onRetry={handleRefresh}
            onTrade={(token) => setActiveTradeToken(token)}
            onViewDetails={(token) => setActiveDetailsToken(token)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '28px 0',
          backgroundColor: 'var(--bg-secondary)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Robinhood Launchpad</span>
            <span> · Fullstack Web3 Assessment</span>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <a
              href="https://explorer.testnet.chain.robinhood.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-lime)' }}
            >
              Explorer ↗
            </a>
            <a
              href="https://faucet.testnet.chain.robinhood.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Testnet Faucet ↗
            </a>
            <a
              href="https://ponsfamily.com/launchpad"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Design Reference ↗
            </a>
          </div>
        </div>
      </footer>

      {/* Trade Modal */}
      {activeTradeToken && (
        <BuyModal
          token={activeTradeToken}
          onClose={() => setActiveTradeToken(null)}
          onTradeSuccess={() => {
            refetchMarketData();
          }}
        />
      )}

      {/* Details Modal */}
      {activeDetailsToken && (
        <TokenDetailsModal
          token={activeDetailsToken}
          onClose={() => setActiveDetailsToken(null)}
          onTrade={(token) => {
            setActiveDetailsToken(null);
            setActiveTradeToken(token);
          }}
        />
      )}

      {/* Launch Token Modal (Bonus) */}
      {isLaunchModalOpen && (
        <LaunchTokenModal
          onClose={() => setIsLaunchModalOpen(false)}
          onLaunchSuccess={async () => {
            await handleRefresh();
          }}
        />
      )}
    </div>
  );
}
