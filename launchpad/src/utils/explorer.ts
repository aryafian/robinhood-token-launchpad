import { EXPLORER_URL } from '../config/contracts';

export function getTxUrl(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function getAddressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}

export function getBlockUrl(block: bigint | number): string {
  return `${EXPLORER_URL}/block/${block.toString()}`;
}
