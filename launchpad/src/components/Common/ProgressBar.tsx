'use client';

import { formatWei, formatProgress } from '../../utils/format';

interface ProgressBarProps {
  progressBps: bigint | number;
  realQuoteReserve: bigint;
  graduationThreshold: bigint;
  showLabels?: boolean;
  height?: number;
}

export function ProgressBar({
  progressBps,
  realQuoteReserve,
  graduationThreshold,
  showLabels = true,
  height = 8,
}: ProgressBarProps) {
  const percent =
    typeof progressBps === 'bigint' ? Number(progressBps) / 100 : progressBps;
  const clamped = Math.min(100, Math.max(0, percent));
  const isFull = clamped >= 100;

  return (
    <div style={{ width: '100%' }}>
      {showLabels && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            marginBottom: '6px',
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            Raised:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {formatWei(realQuoteReserve, 4)} ETH
            </strong>
          </span>
          <span style={{ fontWeight: 600, color: isFull ? 'var(--status-graduated)' : 'var(--accent-lime)' }}>
            {formatProgress(progressBps)}
          </span>
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: isFull
              ? 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)'
              : 'linear-gradient(90deg, #a3e635 0%, #c2f141 100%)',
            borderRadius: '9999px',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: isFull
              ? '0 0 10px rgba(139, 92, 246, 0.5)'
              : '0 0 10px rgba(194, 241, 65, 0.4)',
          }}
        />
      </div>

      {showLabels && graduationThreshold > 0n && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: '0.72rem',
            marginTop: '4px',
            color: 'var(--text-muted)',
          }}
        >
          <span>Target: {formatWei(graduationThreshold, 3)} ETH</span>
        </div>
      )}
    </div>
  );
}
