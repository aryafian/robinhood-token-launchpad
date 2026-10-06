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
  height = 4,
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
            alignItems: 'baseline',
            fontSize: '0.75rem',
            marginBottom: '6px',
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            Raised:{' '}
            <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {formatWei(realQuoteReserve, 4)} ETH
            </span>
          </span>
          <span
            className="font-mono"
            style={{
              fontWeight: 600,
              fontSize: '0.75rem',
              color: isFull ? 'var(--status-graduated)' : 'var(--accent-lime)',
            }}
          >
            {formatProgress(progressBps)}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: isFull ? 'var(--status-graduated)' : 'var(--accent-lime)',
            borderRadius: '2px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {showLabels && graduationThreshold > 0n && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: '0.6875rem',
            marginTop: '4px',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Target: <span className="font-mono">{formatWei(graduationThreshold, 3)} ETH</span>
          </span>
        </div>
      )}
    </div>
  );
}
