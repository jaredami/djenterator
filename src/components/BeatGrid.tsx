import { FC } from 'react';
import InstrumentRow from './InstrumentRow';

interface GridProps {
  instruments: {
    [key: string]: boolean[];
  };
  currentBeat: number;
  toggleBeat: (instrument: string, beat: number) => void;
  totalNumberOfBeats: number;
}

const Grid: FC<GridProps> = ({
  instruments,
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
};

export default Grid;
