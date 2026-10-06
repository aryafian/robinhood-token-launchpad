'use client';

export type FilterStatus = 'all' | 'active' | 'graduated';
export type SortOption = 'progress_desc' | 'newest' | 'raised_desc' | 'price_asc';

interface TokenFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (status: FilterStatus) => void;
  sortOption: SortOption;
  onSortOptionChange: (sort: SortOption) => void;
  totalTokens: number;
  activeCount: number;
  graduatedCount: number;
}

export function TokenFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  totalTokens,
  activeCount,
  graduatedCount,
}: TokenFiltersProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '28px',
      }}
    >
      {/* Left: Tab selectors */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          gap: '4px',
        }}
      >
        <button
          onClick={() => onStatusFilterChange('all')}
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            backgroundColor: statusFilter === 'all' ? 'var(--accent-lime)' : 'transparent',
            color: statusFilter === 'all' ? 'var(--text-inverted)' : 'var(--text-secondary)',
          }}
        >
          All ({totalTokens})
        </button>

        <button
          onClick={() => onStatusFilterChange('active')}
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            backgroundColor: statusFilter === 'active' ? 'var(--accent-lime)' : 'transparent',
            color: statusFilter === 'active' ? 'var(--text-inverted)' : 'var(--text-secondary)',
          }}
        >
          Active Curve ({activeCount})
        </button>

        <button
          onClick={() => onStatusFilterChange('graduated')}
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            backgroundColor: statusFilter === 'graduated' ? 'var(--accent-lime)' : 'transparent',
            color: statusFilter === 'graduated' ? 'var(--text-inverted)' : 'var(--text-secondary)',
          }}
        >
          Graduated ({graduatedCount})
        </button>
      </div>

      {/* Right: Search bar & Sort dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', maxWidth: '520px', justifyContent: 'flex-end' }}>
        {/* Search */}
        <div
          style={{
            position: 'relative',
            flex: '1',
            minWidth: '200px',
            maxWidth: '320px',
          }}
        >
          <input
            type="text"
            placeholder="Search name, symbol, or address..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '8px 16px 8px 36px',
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-lime)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
          />
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortOption}
          onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '8px 14px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="progress_desc">Highest Progress</option>
          <option value="newest">Newest First</option>
          <option value="raised_desc">Most Raised</option>
          <option value="price_asc">Lowest Price</option>
        </select>
      </div>
    </div>
  );
}
