// App.tsx
import React, { useState } from 'react';
import BPMInput from './components/BPMInput';
import GeneratorButton from './components/GeneratorButton';
import BeatGrid from './components/BeatGrid';
import './App.css';

const App: React.FC = () => {
  const [bpm, setBPM] = useState<number>(100);
  const [instruments, setInstruments] = useState<{ [key: string]: boolean[] }>({
    Kick: Array(16).fill(false),
    Snare: Array(16).fill(false),
    'Hi-hat': Array(16).fill(false),
    Crash: Array(16).fill(false),
  });

  const generateBeat = (): void => {
    const newInstruments = {
      ...instruments,
    };

    for (const instrument in newInstruments) {
      newInstruments[instrument] = newInstruments[instrument].map(
        () => Math.random() > 0.5,
      );
    }

    setInstruments(newInstruments);
    // TODO: Add the play beat logic here
  };

  return (
    <div>
      <BPMInput bpm={bpm} setBPM={setBPM} />
      <GeneratorButton generateBeat={generateBeat} />
      <BeatGrid instruments={instruments} />
    </div>
  );
};

export default App;
