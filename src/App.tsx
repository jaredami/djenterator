import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Tone from 'tone';
import './App.scss';
import BPMInput from './components/BPMInput';
import BeatGrid from './components/BeatGrid';
import GeneratorButton from './components/GeneratorButton';
import crashClip from './sounds/crash.mp3';
import guitarClip from './sounds/guitar-note.mp3';
import hatOpenClip from './sounds/hat-open.mp3';
import kickClip from './sounds/kick-metal.wav';
import snareClip from './sounds/snare-metal.wav';

interface Sounds {
  [key: string]: Tone.Player;
}

type Instruments = {
  Kick: boolean[];
  Snare: boolean[];
  'Hi-hat': boolean[];
  Crash: boolean[];
  Guitar: boolean[];
};

type InstrumentPattern = {
  patterns: number[];
  always: number[];
  match?: keyof Instruments;
};

const sectionLength = 32;
const totalSections = 4;

const instrumentPatterns: Record<keyof Instruments, InstrumentPattern> = {
  Crash: { patterns: [8, sectionLength], always: [] },
  'Hi-hat': { patterns: [2, 3, 4], always: [] },
  Snare: { patterns: [2, 3, 4], always: [] },
  Kick: { patterns: [], always: [0] },
  Guitar: { patterns: [], always: [], match: 'Kick' },
};

const App: React.FC = () => {
  const [bpm, setBPM] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [instruments, setInstruments] = useState<{ [key: string]: boolean[] }>({
    Crash: Array(sectionLength * totalSections).fill(false),
    'Hi-hat': Array(sectionLength * totalSections).fill(false),
    Snare: Array(sectionLength * totalSections).fill(false),
    Kick: Array(sectionLength * totalSections).fill(false),
    Guitar: Array(sectionLength * totalSections).fill(false),
  });

  const currentBeatRef = useRef(currentBeat);
  const instrumentsRef = useRef(instruments);
  useEffect(() => {
    currentBeatRef.current = currentBeat;
    instrumentsRef.current = instruments;
  }, [currentBeat, instruments]);

  const sounds: Sounds = useMemo(
    () => ({
      Crash: new Tone.Player(crashClip).toDestination(),
      'Hi-hat': new Tone.Player(hatOpenClip).toDestination(),
      Snare: new Tone.Player(snareClip).toDestination(),
      Kick: new Tone.Player(kickClip).toDestination(),
      Guitar: new Tone.Player(guitarClip).toDestination(),
    }),
    [],
  );

  // Adjust the volume of the sounds for dev purposes
  Object.values(sounds).forEach((sound) => {
    sound.volume.value = -15;
  });
  sounds['Guitar'].volume.value = -20;

  const playPause = useCallback(async (): Promise<void> => {
    if (!isPlaying) {
      await Tone.start();

      Tone.Transport.scheduleRepeat((time) => {
        setCurrentBeat((prevBeat) => {
          const newBeat = (prevBeat + 1) % (sectionLength * totalSections);
          currentBeatRef.current = newBeat;
          return newBeat;
        });
        Object.keys(instrumentsRef.current).forEach((instrument) => {
          const instrumentName = instrument as keyof Instruments;

          if (instrumentsRef.current[instrumentName][currentBeatRef.current]) {
            if (instrumentName === 'Guitar') {
              const durationInBeats = (Math.floor(Math.random() * 8) + 1) / 8;
              const durationInSeconds = (60 / bpm) * durationInBeats;
              sounds[instrumentName].start(time, 0, durationInSeconds);
            } else {
              sounds[instrumentName].start(time);
            }
          }
        });
      }, '16n');
      Tone.Transport.start();
    } else {
      Tone.Transport.cancel();
      Tone.Transport.stop();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, sounds, bpm]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const generateBeat = useCallback((): Instruments => {
    const instruments: Instruments = {
      Crash: Array(sectionLength).fill(false),
      'Hi-hat': Array(sectionLength).fill(false),
      Snare: Array(sectionLength).fill(false),
      Kick: Array(sectionLength).fill(false),
      Guitar: Array(sectionLength).fill(false),
    };

    for (const [instrument, { patterns, always }] of Object.entries(
      instrumentPatterns,
    )) {
      // Get the instrument name as a key of the Instruments type
      const instrumentName = instrument as keyof Instruments;

      // If there is a match property, copy the beats from that instrument
      const match = instrumentPatterns[instrumentName].match;
      if (match) {
        instruments[instrumentName] = instruments[match];
        continue;
      }

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
  }, []);

  const generateSong = (): void => {
    const fullBeat: Instruments = {
      Crash: [],
      'Hi-hat': [],
      Snare: [],
      Kick: [],
      Guitar: [],
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
