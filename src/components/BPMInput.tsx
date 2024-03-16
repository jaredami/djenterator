import { FC } from 'react';

interface BPMInputProps {
  bpm: number;
  setBPM: (value: number) => void;
}

const BPMInput: FC<BPMInputProps> = ({ bpm, setBPM }) => (
  <input
    type="number"
    value={bpm}
    onChange={(e) => setBPM(Number(e.target.value))}
  />
);

export default BPMInput;
