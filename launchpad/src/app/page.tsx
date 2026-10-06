'use client';

import { useState, useMemo } from 'react';
import type { TokenData } from '../types';
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
  const {
    tokens: rawTokens,
    isLoading: isIndexLoading,
    isRefreshing: isIndexRefreshing,
    error: indexError,
    refresh: refreshIndexer,
    latestBlock,
  } = useTokenIndexer();

  const {
    tokensData,
    isLoading: isDataLoading,
    error: dataError,
    refetch: refetchMarketData,
  } = useTokensWithData(rawTokens);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('progress_desc');

  const [activeTradeToken, setActiveTradeToken] = useState<TokenData | null>(null);
  const [activeDetailsToken, setActiveDetailsToken] = useState<TokenData | null>(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

  const handleRefresh = async () => {
    await refreshIndexer();
    await refetchMarketData();
  };

  const filteredTokens = useMemo(() => {
    let list = [...tokensData];

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

    if (statusFilter === 'active') {
      list = list.filter((t) => t.phase === 0);
    } else if (statusFilter === 'graduated') {
      list = list.filter((t) => t.phase === 2);
    }

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
      <NetworkBanner />

      <Header
        onOpenLaunchModal={() => setIsLaunchModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isIndexRefreshing}
      />

      {/* High-Utility Market Overview Bar (Replaces generic marketing hero) */}
      <section
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '16px 0',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Bonding Curve Explorer
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Tokens trade on mathematical bonding curves and graduate to Uniswap v4 at 0.042 ETH threshold.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Tokens: </span>
                <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{tokensData.length}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Active Curves: </span>
                <strong className="font-mono" style={{ color: 'var(--status-active)' }}>{activeCount}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Graduated (v4): </span>
                <strong className="font-mono" style={{ color: '#a78bfa' }}>{graduatedCount}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Block: </span>
                <strong className="font-mono" style={{ color: 'var(--text-secondary)' }}>#{latestBlock.toString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Token Explorer */}
      <main style={{ flex: 1, padding: '24px 0 48px' }}>
        <div className="container">
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
          padding: '20px 0',
          backgroundColor: 'var(--bg-secondary)',
          fontSize: '0.75rem',
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
            gap: '12px',
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Robinhood Launchpad</span>
            <span> · Fullstack Web3 Assessment</span>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
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
              Faucet ↗
            </a>
            <a
              href="https://ponsfamily.com/launchpad"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Reference ↗
            </a>
          </div>
        </div>
      </footer>

      {activeTradeToken && (
        <BuyModal
          token={activeTradeToken}
          onClose={() => setActiveTradeToken(null)}
          onTradeSuccess={() => {
            refetchMarketData();
          }}
        />
      )}

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
