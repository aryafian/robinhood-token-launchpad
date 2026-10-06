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
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      {/* Left: Segmented Status Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px',
          gap: '2px',
        }}
      >
        <button
          onClick={() => onStatusFilterChange('all')}
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.78125rem',
            fontWeight: 600,
            transition: 'background-color 0.12s ease',
            backgroundColor: statusFilter === 'all' ? 'var(--accent-lime)' : 'transparent',
            color: statusFilter === 'all' ? 'var(--text-inverted)' : 'var(--text-secondary)',
          }}
        >
          All ({totalTokens})
        </button>

        <button
          onClick={() => onStatusFilterChange('active')}
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.78125rem',
            fontWeight: 600,
            transition: 'background-color 0.12s ease',
            backgroundColor: statusFilter === 'active' ? 'var(--accent-lime)' : 'transparent',
            color: statusFilter === 'active' ? 'var(--text-inverted)' : 'var(--text-secondary)',
          }}
        >
          Active ({activeCount})
        </button>

        <button
          onClick={() => onStatusFilterChange('graduated')}
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.78125rem',
            fontWeight: 600,
            transition: 'background-color 0.12s ease',
            backgroundColor: statusFilter === 'graduated' ? 'var(--accent-lime)' : 'transparent',
            color: statusFilter === 'graduated' ? 'var(--text-inverted)' : 'var(--text-secondary)',
          }}
        >
          Graduated ({graduatedCount})
        </button>
      </div>

      {/* Right: Search & Sort Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', maxWidth: '480px', justifyContent: 'flex-end' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '180px', maxWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search token, symbol, address..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 28px 6px 10px',
              fontSize: '0.78125rem',
              color: 'var(--text-primary)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '8px',
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

        <select
          value={sortOption}
          onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            fontSize: '0.78125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
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
