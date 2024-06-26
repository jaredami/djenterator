import { FC } from 'react';

interface InstrumentRowProps {
  instrumentName: string;
  beats: boolean[];
  currentBeat: number;
  toggleBeat: (instrument: string, beat: number) => void;
}

const InstrumentRow: FC<InstrumentRowProps> = ({
  instrumentName,
  beats,
  currentBeat,
  toggleBeat,
}) => (
  <div className="instrument-row">
    <div className="label">{instrumentName.toUpperCase()}</div>
    {beats.map((beat, index) => (
      <div
        key={index}
        className={`beat ${beat ? 'active' : ''} ${index + 1 === currentBeat ? 'current' : ''}`}
        onClick={() => toggleBeat(instrumentName, index)}
      />
    ))}
  </div>
);

export default InstrumentRow;
