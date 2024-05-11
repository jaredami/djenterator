import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import '../App.scss';
import BeatGrid from './BeatGrid';
import { VolumeControl } from './VolumeControl';

export type Generator<GeneratorKeys extends string> = {
  clips: Record<GeneratorKeys, Tone.Player>;
  volumes: Record<GeneratorKeys, number>;
  generateSection: (sectionLength: number) => Activations<GeneratorKeys>;
};

export type Activations<GeneratorKeys extends string> = Record<
  GeneratorKeys,
  boolean[]
>;

type SequenceGeneratorProps = {
  generators: Generator<string>[];
  keys: readonly (readonly string[])[];
};

const sectionLength = 32;
const totalSections = 4;

const SequenceGenerator = ({ generators, keys }: SequenceGeneratorProps) => {
  const [bpm, setBPM] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  const [activations, setActivations] = useState(
    generators.map(
      (generator, genIndex) =>
        Object.fromEntries(
          keys[genIndex].map((instrument) => [
            instrument,
            Array(sectionLength * totalSections).fill(false),
          ]),
        ) as Activations<string>,
    ),
  );

  const [volumes, setVolumes] = useState(
    generators.map((generator) => generator.volumes),
  );

  useEffect(() => {
    volumes.forEach((volume, genIndex) => {
      Object.entries(volume).forEach(([key, volume]) => {
        generators[genIndex].clips[key].volume.value = volume;
      });
    });
  }, [volumes, generators]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const currentBeatRef = useRef(currentBeat);
  const activationsRef = useRef(activations);
  useEffect(() => {
    currentBeatRef.current = currentBeat;
    activationsRef.current = activations;
  }, [currentBeat, activations]);

  const playPause = useCallback(async (): Promise<void> => {
    if (!isPlaying) {
      await Tone.start();
      Tone.Transport.scheduleRepeat((time) => {
        setCurrentBeat((prevBeat) => {
          const newBeat = (prevBeat + 1) % (sectionLength * totalSections);
          currentBeatRef.current = newBeat;
          return newBeat;
        });
        generators.forEach((generator, genIndex) => {
          Object.keys(activationsRef.current[genIndex]).forEach(
            (instrumentName) => {
              const isActive =
                activationsRef.current[genIndex][instrumentName][
                  currentBeatRef.current
                ];
              if (isActive) {
                // TODO - refactor to store duration info in activations or generator
                // if the key is of length 1, play for a duration of one beat
                if (instrumentName.length === 1) {
                  const durationInSeconds = 60 / bpm / 4;
                  generator.clips[instrumentName].start(
                    time,
                    0,
                    durationInSeconds,
                  );
                } else if (instrumentName === 'Guitar') {
                  const durationInBeats =
                    (Math.floor(Math.random() * 8) + 1) / 8;
                  const durationInSeconds = (60 / bpm) * durationInBeats;
                  generator.clips[instrumentName].start(
                    time,
                    0,
                    durationInSeconds,
                  );

                  // Play the bass note at the same time and for same duration as the guitar note
                  generator.clips['Bass'].start(time, 0, durationInSeconds);
                } else if (instrumentName !== 'Bass') {
                  generator.clips[instrumentName].start(time);
                }
              }
            },
          );
        });
      }, '16n');
      Tone.Transport.start();
    } else {
      Tone.Transport.cancel();
      Tone.Transport.stop();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, generators, bpm]);

  const generateSong = (): void => {
    const newActivations = generators.map((generator, genIndex) => {
      const fullBeat = Object.fromEntries(
        keys[genIndex].map((instrument) => [instrument, []]),
      ) as Activations<string>;

      for (let i = 0; i < totalSections; i++) {
        const section = generator.generateSection(sectionLength);
        Object.keys(section).forEach((instrument) => {
          fullBeat[instrument] = [
            ...section[instrument],
            ...fullBeat[instrument],
          ];
        });
      }

      return fullBeat;
    });

    setActivations(newActivations);
  };

  const toggleBeat = (
    genIndex: number,
    instrument: string,
    index: number,
  ): void => {
    const newInstruments = [...activations];
    newInstruments[genIndex][instrument][index] =
      !newInstruments[genIndex][instrument][index];
    setActivations(newInstruments);
  };

  return (
    <div>
      <div>
        {generators.map((generator, genIndex) =>
          Object.keys(generator.clips).map((instrument) => (
            <VolumeControl
              key={instrument}
              label={instrument}
              value={volumes[genIndex][instrument]}
              onChange={(newVolume) =>
                setVolumes((prevVolumes) => {
                  const newVolumes = [...prevVolumes];
                  newVolumes[genIndex] = {
                    ...newVolumes[genIndex],
                    [instrument]: newVolume,
                  };
                  return newVolumes;
                })
              }
            />
          )),
        )}
      </div>
      <input
        type="number"
        value={bpm}
        onChange={(e) => setBPM(Number(e.target.value))}
      />
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
      {activations.map((singleActivation, genIndex) => (
        <BeatGrid
          key={genIndex}
          instruments={singleActivation}
          currentBeat={currentBeat}
          toggleBeat={(instrument, index) =>
            toggleBeat(genIndex, instrument, index)
          }
          totalNumberOfBeats={sectionLength * totalSections}
        />
      ))}
    </div>
  );
};

export default SequenceGenerator;
