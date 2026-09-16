import { Suspense } from 'react';
import { useWorldStore } from '../state/worldStore';
import { Shell } from './Shell';
import { RecordingStudio } from './RecordingStudio';
import { DJClub } from './DJClub';
import { Hallway } from './Hallway';
import { Outside } from './Outside';
import { PortalTrigger } from './PortalTrigger';

/**
 * Two separate environments connected by a portal hallway; only the current
 * zone is mounted. Textures stream in under Suspense.
 */
export function Studio() {
  const zone = useWorldStore((s) => s.zone);
  return (
    <Suspense fallback={null}>
      <group>
        <Outside zone={zone} />
        <Shell zone={zone} />
        {zone === 'studio' ? <RecordingStudio /> : <DJClub />}
        <Hallway zone={zone} />
        <PortalTrigger />
      </group>
    </Suspense>
  );
}
