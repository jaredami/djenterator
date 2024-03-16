import { FC } from 'react';

interface BeatGeneratorButtonProps {
  generateBeat: () => void;
}

const BeatGeneratorButton: FC<BeatGeneratorButtonProps> = ({
  generateBeat,
}) => <button onClick={generateBeat}>Generate Beat</button>;

export default BeatGeneratorButton;
