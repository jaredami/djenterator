import { FC } from 'react';
import InstrumentRow from './InstrumentRow';

interface GridProps {
  instruments: {
    [key: string]: boolean[];
  };
  currentBeat: number;
  toggleBeat: (instrument: string, beat: number) => void;
}

const Grid: FC<GridProps> = ({ instruments, currentBeat, toggleBeat }) => (
  <div className="grid">
    {Object.keys(instruments).map((instrument) => (
      <InstrumentRow
        key={instrument}
        instrumentName={instrument}
        beats={instruments[instrument]}
        currentBeat={currentBeat}
        toggleBeat={toggleBeat}
      />
    ))}
  </div>
);

export default Grid;
