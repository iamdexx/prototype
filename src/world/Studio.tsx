import { Shell } from './Shell';
import { RecordingStudio } from './RecordingStudio';
import { DJClub } from './DJClub';

/** Two-zone venue: recording studio (x<0) + DJ club (x>0). */
export function Studio() {
  return (
    <group>
      <Shell />
      <RecordingStudio />
      <DJClub />
      {/* subtle fill light over the doorway */}
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 4.5, 0]} intensity={8} distance={18} color="#c0c8ff" />
    </group>
  );
}
