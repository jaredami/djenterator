import { FC } from 'react';
import InstrumentRow from './InstrumentRow';

interface GridProps {
  instruments: {
    [key: string]: boolean[];
  };
  currentBeat: number;
}

const Grid: FC<GridProps> = ({ instruments, currentBeat }) => (
  <div className="grid">
    {Object.keys(instruments).map((instrument) => (
      <InstrumentRow
        key={instrument}
        instrumentName={instrument}
        beats={instruments[instrument]}
        currentBeat={currentBeat}
      />
    ))}
  </div>
);

export default Grid;
