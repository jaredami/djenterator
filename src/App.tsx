import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.scss';
import BPMInput from './components/BPMInput';
import BeatGrid from './components/BeatGrid';
import GeneratorButton from './components/GeneratorButton';
import crashClip from './sounds/crash.mp3';
import hatOpenClip from './sounds/hat-open.mp3';
import kickClip from './sounds/kick-metal.wav';
import snareClip from './sounds/snare-metal.wav';

interface Sounds {
  [key: string]: HTMLAudioElement;
}

const sectionLength = 16;

const App: React.FC = () => {
  const [bpm, setBPM] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [instruments, setInstruments] = useState<{ [key: string]: boolean[] }>({
    Kick: Array(sectionLength).fill(false),
    Snare: Array(sectionLength).fill(false),
    'Hi-hat': Array(sectionLength).fill(false),
    Crash: Array(sectionLength).fill(false),
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

  const beatInterval = useRef<number | null>(null);

  const playPause = (): void => {
    if (!isPlaying) {
      beatInterval.current = window.setInterval(
        () => {
          setCurrentBeat((prevBeat) => (prevBeat + 1) % sectionLength);
        },
        60000 / bpm / 4,
      );
    } else {
      if (beatInterval.current !== null) {
        window.clearInterval(beatInterval.current);
      }
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    Object.keys(instruments).forEach((instrument) => {
      if (instruments[instrument][currentBeat]) {
        sounds[instrument].currentTime = 0;
        sounds[instrument].play();
      }
    });
  }, [sounds, currentBeat, instruments]);

  const generateBeat = (): void => {
    type InstrumentPattern = {
      patterns: number[];
      always: number[];
    };

    const instrumentPatterns: Record<keyof Instruments, InstrumentPattern> = {
      Kick: { patterns: [], always: [0] },
      Snare: { patterns: [2, 3, 4], always: [] },
      'Hi-hat': { patterns: [2, 3, 4], always: [] },
      Crash: { patterns: [8, sectionLength], always: [] },
    };

    type Instruments = {
      Kick: boolean[];
      Snare: boolean[];
      'Hi-hat': boolean[];
      Crash: boolean[];
    };

    const newInstruments: Instruments = {
      Kick: Array(sectionLength).fill(false),
      Snare: Array(sectionLength).fill(false),
      'Hi-hat': Array(sectionLength).fill(false),
      Crash: Array(sectionLength).fill(false),
    };

    for (const [instrument, { patterns, always }] of Object.entries(
      instrumentPatterns,
    )) {
      // Get the instrument name as a key of the Instruments type
      const instrumentName = instrument as keyof Instruments;

      // Activate the beats that should always be active for this instrument
      for (const i of always) {
        newInstruments[instrumentName][i] = true;
      }

      // If there are no patterns for this instrument, randomly activate beats
      if (patterns.length === 0) {
        newInstruments[instrumentName] = newInstruments[instrumentName].map(
          // Randomly activate the beat, but keep it active if it was already active due to the always array
          (beat) => beat || Math.random() > 0.5,
        );
        // Skip the rest of the loop
        continue;
      }

      // Randomly select a pattern and activate the beats for that pattern
      const selectedPattern =
        patterns[Math.floor(Math.random() * patterns.length)];
      for (
        let i = 0;
        i < newInstruments[instrumentName].length;
        i += selectedPattern
      ) {
        newInstruments[instrumentName][i] = true;
      }
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
      <button onClick={playPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <BeatGrid
        instruments={instruments}
        currentBeat={currentBeat}
        toggleBeat={toggleBeat}
      />
    </div>
  );
};

export default App;
