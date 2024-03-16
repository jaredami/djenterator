import { FC } from 'react';

interface InstrumentRowProps {
  instrumentName: string;
  beats: boolean[];
}

const InstrumentRow: FC<InstrumentRowProps> = ({ instrumentName, beats }) => (
  <div className="instrument-row">
    <div className="label">{instrumentName}</div>
    {beats.map((beat, index) => (
      <div key={index} className={`beat ${beat ? 'active' : ''}`} />
    ))}
  </div>
);

export default InstrumentRow;
