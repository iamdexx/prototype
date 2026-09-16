import { useEffect } from 'react';
import { useAccount } from 'wagmi';

/** Module-level short wallet address, mirrored from wagmi for the net layer. */
export const walletInfo = { short: '' };

export function WalletSync() {
  const { address } = useAccount();
  useEffect(() => {
    walletInfo.short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
  }, [address]);
  return null;
}
