import React, { useEffect, useMemo, useState } from 'react';
import './App.scss';
import BPMInput from './components/BPMInput';
import BeatGrid from './components/BeatGrid';
import GeneratorButton from './components/GeneratorButton';
import crashClip from './sounds/crash.mp3';
import hatOpenClip from './sounds/hat-open.mp3';
import kickClip from './sounds/kick.mp3';
import snareClip from './sounds/snare-flanged.mp3';

interface Sounds {
  [key: string]: HTMLAudioElement;
}

const App: React.FC = () => {
  const [bpm, setBPM] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [instruments, setInstruments] = useState<{ [key: string]: boolean[] }>({
    Kick: Array(16).fill(false),
    Snare: Array(16).fill(false),
    'Hi-hat': Array(16).fill(false),
    Crash: Array(16).fill(false),
  });

  const sounds: Sounds = useMemo(
    () => ({
      Kick: new Audio(kickClip),
      Snare: new Audio(snareClip),
      'Hi-hat': new Audio(hatOpenClip),
      Crash: new Audio(crashClip),
    }),
    [],
  );

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(
        () => {
          setCurrentBeat((currentBeat + 1) % 16);
        },
        (60 / bpm) * 1000,
      );

      return () => clearInterval(timer);
    }
  }, [isPlaying, bpm, currentBeat]);

  useEffect(() => {
    Object.keys(instruments).forEach((instrument) => {
      if (instruments[instrument][currentBeat]) {
        sounds[instrument].currentTime = 0;
        sounds[instrument].play();
      }
    });
  }, [sounds, currentBeat, instruments]);

  const generateBeat = (): void => {
    const newInstruments = { ...instruments };

    for (const instrument in newInstruments) {
      newInstruments[instrument] = newInstruments[instrument].map(
        () => Math.random() > 0.5,
      );
    }

    setInstruments(newInstruments);
  };

  const toggleBeat = (instrument: string, index: number): void => {
    const newInstruments = { ...instruments };
    newInstruments[instrument][index] = !newInstruments[instrument][index];
    setInstruments(newInstruments);
  };

  return (
    <div>
      <BPMInput bpm={bpm} setBPM={setBPM} />
      <GeneratorButton generateBeat={generateBeat} />
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <BeatGrid
        instruments={instruments}
        currentBeat={currentBeat}
        toggleBeat={toggleBeat}
      />
    </div>
  );
};

export default App;
