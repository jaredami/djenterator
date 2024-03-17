import { FC } from 'react';

interface InstrumentRowProps {
  instrumentName: string;
  beats: boolean[];
  currentBeat: number;
}

const InstrumentRow: FC<InstrumentRowProps> = ({
  instrumentName,
  beats,
  currentBeat,
}) => (
  <div className="instrument-row">
    <div className="label">{instrumentName}</div>
    {beats.map((beat, index) => (
      <div
        key={index}
        className={`beat ${beat ? 'active' : ''} ${index === currentBeat ? 'current' : ''}`}
      />
    ))}
  </div>
);

export default InstrumentRow;
