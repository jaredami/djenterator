import { FC } from 'react';
import InstrumentRow from './InstrumentRow';

interface GridProps {
  instruments: {
    [key: string]: boolean[];
  };
}

const Grid: FC<GridProps> = ({ instruments }) => (
  <div className="grid">
    {Object.keys(instruments).map((instrument) => (
      <InstrumentRow
        key={instrument}
        instrumentName={instrument}
        beats={instruments[instrument]}
      />
    ))}
  </div>
);

export default Grid;
