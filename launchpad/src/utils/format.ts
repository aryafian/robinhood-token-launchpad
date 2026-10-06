import { formatEther, formatUnits } from 'viem';

/**
 * Shorten an Ethereum address to 0x1234...5678
 */
export function formatAddress(address?: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a small decimal number using subscript notation for leading zeros,
 * e.g. 0.00001234 -> "0.0₄1234" or standard significant figures.
 * Never returns "0.00"!
 */
export function formatSmallPrice(price: number | string | bigint, symbol = 'ETH'): string {
  let num: number;
  if (typeof price === 'bigint') {
    num = Number(formatEther(price));
  } else if (typeof price === 'string') {
    num = parseFloat(price);
  } else {
    num = price;
  }

  if (isNaN(num) || num === 0) {
    return `0.0₁₀0 ${symbol}`;
  }

  if (num >= 1) {
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${symbol}`;
  }

  if (num >= 0.001) {
    return `${num.toFixed(6)} ${symbol}`;
  }

  // Very small number (e.g. 0.00000001699)
  // Convert to fixed with 18 decimals to count leading zeros
  const str = num.toFixed(18);
  const match = str.match(/^0\.(0+)([1-9]\d*)/);
  if (match) {
    const zeroCount = match[1].length;
    const significantDigits = match[2].slice(0, 4);
    // Subscript Unicode map for 0-9
    const subscripts: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    const countStr = zeroCount.toString().split('').map(c => subscripts[c] || c).join('');
    return `0.0${countStr}${significantDigits} ${symbol}`;
  }

  return `${num.toExponential(4)} ${symbol}`;
}

/**
 * Format Wei to clean ETH string
 */
export function formatWei(wei: bigint, maxDecimals = 4): string {
  const ethStr = formatEther(wei);
  const num = parseFloat(ethStr);
  if (num === 0 && wei > 0n) {
    return '< 0.0001';
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Format Token units (18 decimals standard)
 */
export function formatTokenAmount(amount: bigint, decimals = 18): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  if (num < 0.01 && num > 0) {
    return '< 0.01';
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format progress percentage from basis points (0-10000 = 0% - 100%)
 */
export function formatProgress(bps: bigint | number): string {
  const percent = typeof bps === 'bigint' ? Number(bps) / 100 : bps;
  const clamped = Math.min(100, Math.max(0, percent));
  return `${clamped.toFixed(1)}%`;
}

/**
 * Time ago formatter (e.g. "12s ago", "3m ago")
 */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
