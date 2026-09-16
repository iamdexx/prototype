/**
 * TODO: product contract ABI + address go here once the ApeChain product
 * contract exists (e.g. room passes, NFT wearables, tips).
 */
export const PRODUCT_CONTRACT_ABI = [] as const;

export const PRODUCT_CONTRACT_ADDRESS: `0x${string}` | null = null;

/** Stub hook — returns a placeholder until the contract is defined. */
export function useProductContract() {
  return {
    address: PRODUCT_CONTRACT_ADDRESS,
    abi: PRODUCT_CONTRACT_ABI,
    ready: false as const,
  };
}
