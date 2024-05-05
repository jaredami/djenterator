import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';
import '../App.scss';
import BPMInput from './BPMInput';
import BeatGrid from './BeatGrid';
import { VolumeControl } from './VolumeControl';

export type Generator<GeneratorKeys extends string> = {
  clips: Record<GeneratorKeys, string>;
  activations: Record<GeneratorKeys, boolean[]>;
  patterns: Record<
    GeneratorKeys,
    {
      patterns: number[];
      always: number[];
      match?: GeneratorKeys;
    }
  >;
  volumes: Record<GeneratorKeys, number>;
};

export interface Sounds {
  [key: string]: Tone.Player;
}

type SequenceGeneratorProps<
  T extends Generator<string>,
  K extends readonly string[],
> = {
  generator: T;
  keys: K;
};

const sectionLength = 32;
const totalSections = 4;

const SequenceGenerator = <
  T extends Generator<string>,
  K extends readonly string[],
>({
  generator,
  keys,
}: SequenceGeneratorProps<T, K>) => {
  type GeneratorKeys = keyof typeof generator.clips;

  const [bpm, setBPM] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  const [instruments, setInstruments] = useState<
    Generator<GeneratorKeys>['activations']
  >(
    Object.fromEntries(
      keys.map((instrument): [GeneratorKeys, boolean[]] => [
        instrument,
        Array(sectionLength * totalSections).fill(false),
      ]),
    ) as Generator<GeneratorKeys>['activations'],
  );

  const sounds: Sounds = useMemo(() => {
    return Object.fromEntries(
      keys.map((instrument: GeneratorKeys) => [
        instrument,
        new Tone.Player(generator.clips[instrument]).toDestination(),
      ]),
    );
  }, [generator.clips, keys]);

  const [volumes, setVolumes] = useState<Generator<GeneratorKeys>['volumes']>(
    generator.volumes,
  );

  useEffect(() => {
    Object.entries(volumes).forEach(([key, volume]) => {
      sounds[key].volume.value = volume;
    });
  }, [volumes, sounds]);

  const currentBeatRef = useRef(currentBeat);
  const instrumentsRef = useRef(instruments);
  useEffect(() => {
    currentBeatRef.current = currentBeat;
    instrumentsRef.current = instruments;
  }, [currentBeat, instruments]);

  const playPause = useCallback(async (): Promise<void> => {
    if (!isPlaying) {
      await Tone.start();

      Tone.Transport.scheduleRepeat((time) => {
        setCurrentBeat((prevBeat) => {
          const newBeat = (prevBeat + 1) % (sectionLength * totalSections);
          currentBeatRef.current = newBeat;
          return newBeat;
        });
        Object.keys(instrumentsRef.current).forEach((instrumentName) => {
          const key = instrumentName as GeneratorKeys;
          if (instrumentsRef.current[key][currentBeatRef.current]) {
            if (key === 'Guitar') {
              const durationInBeats = (Math.floor(Math.random() * 8) + 1) / 8;
              const durationInSeconds = (60 / bpm) * durationInBeats;
              sounds[key].start(time, 0, durationInSeconds);

              // Play the bass note at the same time and for same duration as the guitar note
              sounds['Bass'].start(time, 0, durationInSeconds);
            } else if (key !== 'Bass') {
              sounds[key].start(time);
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

  const generateSection =
    useCallback((): Generator<GeneratorKeys>['activations'] => {
      const instrumentsSection: Generator<GeneratorKeys>['activations'] =
        Object.fromEntries(
          keys.map((instrument): [GeneratorKeys, boolean[]] => [
            instrument,
            Array(sectionLength).fill(false),
          ]),
        ) as Generator<GeneratorKeys>['activations'];

      for (const [instrument, { patterns, always, match }] of Object.entries(
        generator.patterns,
      )) {
        // Get the instrument name as a key of the Instruments type
        const instrumentName = instrument as GeneratorKeys;

        if (match) {
          instrumentsSection[instrumentName] = instrumentsSection[match];
          continue;
        }

        // Activate the beats that should always be active for this instrument
        for (const i of always) {
          instrumentsSection[instrumentName][i] = true;
        }

        // If there are no patterns for this instrument, randomly activate beats
        if (patterns.length === 0) {
          instrumentsSection[instrumentName] = instrumentsSection[
            instrumentName
          ].map(
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
          i < instrumentsSection[instrumentName].length;
          i += selectedPattern
        ) {
          instrumentsSection[instrumentName][i] = true;
        }
      }

      return instrumentsSection;
    }, [generator.patterns, keys]);

  const generateSong = (): void => {
    const fullBeat: Generator<GeneratorKeys>['activations'] = {
      Crash: [],
      'Hi-hat': [],
      Snare: [],
      Kick: [],
      Guitar: [],
      Bass: [],
    };

    for (let i = 0; i < 4; i++) {
      const beat = generateSection();
      Object.keys(beat).forEach((instrument) => {
        const instrumentName = instrument as GeneratorKeys;
        fullBeat[instrumentName] = [
          ...beat[instrumentName],
          ...fullBeat[instrumentName],
        ];
      });
    }

    setInstruments(fullBeat);
  };

  const toggleBeat = (instrument: GeneratorKeys, index: number): void => {
    const newInstruments = { ...instruments };
    newInstruments[instrument][index] = !newInstruments[instrument][index];
    setInstruments(newInstruments);
  };

  return (
    <div>
      <div>
        <VolumeControl
          label="Crash"
          value={volumes.Crash}
          onChange={(newVolume) => setVolumes({ ...volumes, Crash: newVolume })}
        />
        <VolumeControl
          label="Hi-hat"
          value={volumes['Hi-hat']}
          onChange={(newVolume) =>
            setVolumes({ ...volumes, 'Hi-hat': newVolume })
          }
        />
        <VolumeControl
          label="Snare"
          value={volumes.Snare}
          onChange={(newVolume) => setVolumes({ ...volumes, Snare: newVolume })}
        />
        <VolumeControl
          label="Kick"
          value={volumes.Kick}
          onChange={(newVolume) => setVolumes({ ...volumes, Kick: newVolume })}
        />
        <VolumeControl
          label="Guitar"
          value={volumes.Guitar}
          onChange={(newVolume) =>
            setVolumes({ ...volumes, Guitar: newVolume })
          }
        />
        <VolumeControl
          label="Bass"
          value={volumes.Bass}
          onChange={(newVolume) => setVolumes({ ...volumes, Bass: newVolume })}
        />
      </div>
      <BPMInput bpm={bpm} setBPM={setBPM} />
      <button onClick={generateSong}>Generate Beat</button>
      <button onClick={playPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <button
        onClick={() => {
          setCurrentBeat(0);
          Tone.Transport.stop();
          Tone.Transport.cancel();
          setIsPlaying(false);
        }}
      >
        Restart
      </button>
      <BeatGrid
        instruments={instruments}
        currentBeat={currentBeat}
        // TODO fix type
        toggleBeat={toggleBeat}
        totalNumberOfBeats={sectionLength * totalSections}
      />
    </div>
  );
};

export default SequenceGenerator;
