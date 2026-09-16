import { usePeersStore } from '../net/peersStore';
import { useWorldStore } from '../state/worldStore';
import { Avatar } from './Avatar';

export function RemoteAvatars() {
  const peers = usePeersStore((s) => s.peers);
  const zone = useWorldStore((s) => s.zone);
  return (
    <>
      {Object.values(peers).map((p) =>
        p.state && (p.state.zone ?? 'studio') === zone ? (
          <Avatar key={p.id} state={p.state} />
        ) : null,
      )}
    </>
  );
}
