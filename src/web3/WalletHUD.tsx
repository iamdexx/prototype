import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { wagmiConfig } from './config';

const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');

const btn = {
  background: '#2a2f3f', color: '#eee', border: '1px solid #444',
  borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12,
} as const;

export function WalletHUD() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains, switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address, chainId: chain?.id });

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        {connectors.map((c) => (
          <button key={c.uid} style={btn} onClick={() => connect({ connector: c })}>
            Connect {c.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <select
        style={{ ...btn, cursor: 'pointer' }}
        value={chain?.id}
        onChange={(e) => switchChain({ chainId: Number(e.target.value) as never })}
      >
        {chains.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <span style={{ color: '#9db4ff', fontSize: 12 }}>
        {short(address)} · {balance ? `${Number(balance.formatted).toFixed(3)} ${balance.symbol}` : '—'}
      </span>
      <button style={btn} onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}

export { wagmiConfig };
