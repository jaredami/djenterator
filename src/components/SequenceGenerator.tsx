import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import '../App.scss';
import BPMInput from './BPMInput';
import BeatGrid from './BeatGrid';
import { VolumeControl } from './VolumeControl';

export type Generator<GeneratorKeys extends string> = {
  clips: Record<GeneratorKeys, Tone.Player>;
  activations: Record<GeneratorKeys, boolean[]>;
  volumes: Record<GeneratorKeys, number>;
  generateSection: (sectionLength: number) => Record<GeneratorKeys, boolean[]>;
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

  const [volumes, setVolumes] = useState<Generator<GeneratorKeys>['volumes']>(
    generator.volumes,
  );

  useEffect(() => {
    Object.entries(volumes).forEach(([key, volume]) => {
      generator.clips[key].volume.value = volume;
    });
  }, [volumes, generator.clips]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

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
            // if the key is of length 1, play for a duration of one beat
            if (key.length === 1) {
              const durationInSeconds = 60 / bpm / 4;
              generator.clips[key].start(time, 0, durationInSeconds);
            } else if (key === 'Guitar') {
              const durationInBeats = (Math.floor(Math.random() * 8) + 1) / 8;
              const durationInSeconds = (60 / bpm) * durationInBeats;
              generator.clips[key].start(time, 0, durationInSeconds);

              // Play the bass note at the same time and for same duration as the guitar note
              generator.clips['Bass'].start(time, 0, durationInSeconds);
            } else if (key !== 'Bass') {
              generator.clips[key].start(time);
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
  }, [isPlaying, generator.clips, bpm]);

  const generateSong = (): void => {
    const fullBeat: Generator<GeneratorKeys>['activations'] =
      Object.fromEntries(
        keys.map((instrument): [GeneratorKeys, boolean[]] => [instrument, []]),
      ) as Generator<GeneratorKeys>['activations'];

    for (let i = 0; i < totalSections; i++) {
      const section = generator.generateSection(sectionLength);
      Object.keys(section).forEach((instrument) => {
        const instrumentName = instrument as GeneratorKeys;
        fullBeat[instrumentName] = [
          ...section[instrumentName],
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
        {/* Create volume controls for each instrument of generator */}
        {Object.keys(generator.clips).map((instrument) => (
          <VolumeControl
            key={instrument}
            label={instrument}
            value={volumes[instrument as GeneratorKeys]}
            onChange={(newVolume) =>
              setVolumes({ ...volumes, [instrument]: newVolume })
            }
          />
        ))}
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
        toggleBeat={toggleBeat}
        totalNumberOfBeats={sectionLength * totalSections}
      />
    </div>
  );
};

export default SequenceGenerator;
