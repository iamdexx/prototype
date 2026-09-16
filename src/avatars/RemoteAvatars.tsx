import { usePeersStore } from '../net/peersStore';
import { Avatar } from './Avatar';

export function RemoteAvatars() {
  const peers = usePeersStore((s) => s.peers);
  return (
    <>
      {Object.values(peers).map((p) => (p.state ? <Avatar key={p.id} state={p.state} /> : null))}
    </>
  );
}
