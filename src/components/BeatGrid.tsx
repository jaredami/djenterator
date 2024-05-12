import { FC } from 'react';
import InstrumentRow from './InstrumentRow';

interface GridProps {
  activations: {
    [key: string]: boolean[];
  };
  currentBeat: number;
  toggleBeat: (instrument: string, beat: number) => void;
  totalNumberOfBeats: number;
}

const Grid: FC<GridProps> = ({
  activations,
  currentBeat,
  toggleBeat,
  totalNumberOfBeats,
}) => {
  const gridColumnString = [
    'auto',
    ...Array(totalNumberOfBeats).fill('1fr'),
  ].join(' ');

  return (
    <div className="grid" style={{ gridTemplateColumns: gridColumnString }}>
      {Object.keys(activations).map((instrument) => (
        <InstrumentRow
          key={instrument}
          instrumentName={instrument}
          beats={activations[instrument]}
          currentBeat={currentBeat}
          toggleBeat={toggleBeat}
        />
      ))}
    </div>
  );
};

export default Grid;
