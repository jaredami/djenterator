import { FC, memo, useCallback, useMemo } from 'react';

interface InstrumentRowProps {
  instrumentName: string;
  beats: boolean[];
  currentBeat: number;
  toggleBeat: (instrument: string, beat: number) => void;
}

const InstrumentRow: FC<InstrumentRowProps> = memo(({
  instrumentName,
  beats,
  currentBeat,
  toggleBeat,
}) => {
  const handleBeatClick = useCallback((index: number) => {
    toggleBeat(instrumentName, index);
  }, [instrumentName, toggleBeat]);

  const beatElements = useMemo(() => {
    return beats.map((beat, index) => {
      const isActive = beat;
      const isCurrent = index + 1 === currentBeat;

      return (
        <div
          key={index}
          className={`beat ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
          onClick={() => handleBeatClick(index)}
        />
      );
    });
  }, [beats, currentBeat, handleBeatClick]);

  return (
    <div className="instrument-row">
      <div className="label">{instrumentName.toUpperCase()}</div>
      {beatElements}
    </div>
  );
});

InstrumentRow.displayName = 'InstrumentRow';

export default InstrumentRow;
