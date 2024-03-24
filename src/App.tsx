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

type Instruments = {
  Kick: boolean[];
  Snare: boolean[];
  'Hi-hat': boolean[];
  Crash: boolean[];
};

type InstrumentPattern = {
  patterns: number[];
  always: number[];
};

const sectionLength = 32;
const totalSections = 4;

const instrumentPatterns: Record<keyof Instruments, InstrumentPattern> = {
  Crash: { patterns: [8, sectionLength], always: [] },
  'Hi-hat': { patterns: [2, 3, 4], always: [] },
  Snare: { patterns: [2, 3, 4], always: [] },
  Kick: { patterns: [], always: [0] },
};

const App: React.FC = () => {
  const [bpm, setBPM] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [instruments, setInstruments] = useState<{ [key: string]: boolean[] }>({
    Crash: Array(sectionLength * totalSections).fill(false),
    'Hi-hat': Array(sectionLength * totalSections).fill(false),
    Snare: Array(sectionLength * totalSections).fill(false),
    Kick: Array(sectionLength * totalSections).fill(false),
  });

  const sounds: Sounds = useMemo(
    () => ({
      Crash: new Audio(crashClip),
      'Hi-hat': new Audio(hatOpenClip),
      Snare: new Audio(snareClip),
      Kick: new Audio(kickClip),
    }),
    [],
  );

  const beatInterval = useRef<number | null>(null);

  const playPause = (): void => {
    if (!isPlaying) {
      beatInterval.current = window.setInterval(
        () => {
          setCurrentBeat(
            (prevBeat) => (prevBeat + 1) % (sectionLength * totalSections),
          );
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

  const generateBeat = (): Instruments => {
    const instruments: Instruments = {
      Crash: Array(sectionLength).fill(false),
      'Hi-hat': Array(sectionLength).fill(false),
      Snare: Array(sectionLength).fill(false),
      Kick: Array(sectionLength).fill(false),
    };

    for (const [instrument, { patterns, always }] of Object.entries(
      instrumentPatterns,
    )) {
      // Get the instrument name as a key of the Instruments type
      const instrumentName = instrument as keyof Instruments;

      // Activate the beats that should always be active for this instrument
      for (const i of always) {
        instruments[instrumentName][i] = true;
      }

      // If there are no patterns for this instrument, randomly activate beats
      if (patterns.length === 0) {
        instruments[instrumentName] = instruments[instrumentName].map(
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
        i < instruments[instrumentName].length;
        i += selectedPattern
      ) {
        instruments[instrumentName][i] = true;
      }
    }

    return instruments;
  };

  const generateSong = (): void => {
    const fullBeat: Instruments = {
      Crash: [],
      'Hi-hat': [],
      Snare: [],
      Kick: [],
    };

    for (let i = 0; i < 4; i++) {
      const beat = generateBeat();
      Object.keys(beat).forEach((instrument) => {
        const instrumentName = instrument as keyof Instruments;
        fullBeat[instrumentName] = [
          ...beat[instrumentName],
          ...fullBeat[instrumentName],
        ];
      });
    }

    setInstruments(fullBeat);
  };

  const toggleBeat = (instrument: string, index: number): void => {
    const newInstruments = { ...instruments };
    newInstruments[instrument][index] = !newInstruments[instrument][index];
    setInstruments(newInstruments);
  };

  return (
    <div>
      <BPMInput bpm={bpm} setBPM={setBPM} />
      <GeneratorButton generateBeat={generateSong} />
      <button onClick={playPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <BeatGrid
        instruments={instruments}
        currentBeat={currentBeat}
        toggleBeat={toggleBeat}
        totalNumberOfBeats={sectionLength * totalSections}
      />
    </div>
  );
};

export default App;
