import { FC, memo, useCallback } from 'react';
import InstrumentRow from './InstrumentRow';

interface GridProps {
  activations: {
    [key: string]: boolean[];
  };
  currentBeat: number;
  toggleBeat: (instrument: string, beat: number) => void;
  totalNumberOfBeats: number;
}

const Grid: FC<GridProps> = memo(({
  activations,
  currentBeat,
  toggleBeat,
  totalNumberOfBeats,
}) => {
  const gridColumnString = [
    'auto',
    ...Array(totalNumberOfBeats).fill('1fr'),
  ].join(' ');

  const memoizedToggleBeat = useCallback((instrument: string, beat: number) => {
    toggleBeat(instrument, beat);
  }, [toggleBeat]);

  return (
    <div className="grid" style={{ gridTemplateColumns: gridColumnString }}>
      {Object.keys(activations).map((instrument) => (
        <InstrumentRow
          key={instrument}
          instrumentName={instrument}
          beats={activations[instrument]}
          currentBeat={currentBeat}
          toggleBeat={memoizedToggleBeat}
        />
      ))}
    </div>
  );
});

Grid.displayName = 'BeatGrid';

export default Grid;
