import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import * as Tone from 'tone';
import '../App.scss';
import BeatGrid from './BeatGrid';
import VirtualizedBeatGrid from './VirtualizedBeatGrid';
import { VolumeControl } from './VolumeControl';

export type Generator<GeneratorKeys extends string> = {
  clips: Record<GeneratorKeys, Tone.Player>;
  volumes: Record<GeneratorKeys, number>;
  offsets: Record<GeneratorKeys, number>;
  generateSection: (sectionLength: number) => Activations<GeneratorKeys>;
  generateDurations?(
    section: Activations<GeneratorKeys>,
    sectionLength: number,
  ): Record<GeneratorKeys, (number | null)[] | null>;
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
const totalSections = 16 * 4;

const SequenceGenerator = ({ generators, keys }: SequenceGeneratorProps) => {
  const [bpm, setBPM] = useState<number>(130);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  // Initialize activations to be all false
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

  // Initialize durations to match activations (all beats for all instruments set to null)
  const [durations, setDurations] = useState(
    activations.map(
      (section) =>
        Object.fromEntries(
          Object.keys(section).map((instrument) => [
            instrument,
            Array(sectionLength * totalSections).fill(null),
          ]),
        ) as Record<string, (number | null)[] | null>,
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
  const durationsRef = useRef(durations);

  useEffect(() => {
    currentBeatRef.current = currentBeat;
    activationsRef.current = activations;
    durationsRef.current = durations;
  }, [currentBeat, activations, durations]);

  // Throttle current beat updates to reduce render frequency
  const lastBeatUpdateRef = useRef(0);
  const throttledSetCurrentBeat = useCallback((newBeat: number) => {
    const now = Date.now();
    if (now - lastBeatUpdateRef.current > 16) { // ~60fps limit
      setCurrentBeat(newBeat);
      lastBeatUpdateRef.current = now;
    }
  }, []);

  const playPause = useCallback(async (): Promise<void> => {
    if (!isPlaying) {
      await Tone.start();
      Tone.Transport.scheduleRepeat((time) => {
        const newBeat = (currentBeatRef.current + 1) % (sectionLength * totalSections);
        currentBeatRef.current = newBeat;

        // Throttle UI updates
        throttledSetCurrentBeat(newBeat);

        generators.forEach((generator, genIndex) => {
          Object.keys(activationsRef.current[genIndex]).forEach(
            (instrumentName) => {
              const isActive =
                activationsRef.current[genIndex][instrumentName][
                  currentBeatRef.current
                ];
              if (isActive) {
                // If there is a duration for this instrument at this beat, use it to determine how long to play the clip
                const durationInBeats =
                  durationsRef.current[genIndex][instrumentName]?.[currentBeatRef.current];
                const durationInSeconds = durationInBeats
                  ? (60 / bpm) * durationInBeats
                  : undefined;

                generator.clips[instrumentName].start(
                  time,
                  generator.offsets[instrumentName] ?? 0,
                  durationInSeconds,
                );
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
  }, [isPlaying, generators, bpm, throttledSetCurrentBeat]);

  const generateSong = useCallback((): void => {
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

    // For each generator, call the generateDurations function if it exists to get the durations based on the activations
    const songDurations = generators.map((generator, index) => {
      return (
        generator.generateDurations?.(newActivations[index], sectionLength) ??
        {}
      );
    });

    restart();
    setActivations(newActivations);
    setDurations(songDurations);
  }, [generators, keys]);

  const restart = useCallback((): void => {
    setCurrentBeat(0);
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
  }, []);

  const toggleBeat = useCallback((
    genIndex: number,
    instrument: string,
    index: number,
  ): void => {
    setActivations(prevActivations => {
      const newInstruments = [...prevActivations];
      newInstruments[genIndex] = {
        ...newInstruments[genIndex],
        [instrument]: [...newInstruments[genIndex][instrument]]
      };
      newInstruments[genIndex][instrument][index] =
        !newInstruments[genIndex][instrument][index];
      return newInstruments;
    });

    // Set the duration to 0.25 for the instrument at the toggled beat
    setDurations(prevDurations => {
      const newDurations = [...prevDurations];
      if (instrument !== null) {
        const gen = { ...newDurations[genIndex] };
        if (gen) {
          const instrumentObj = gen[instrument] ? [...gen[instrument]!] : [];
          if (instrumentObj) {
            instrumentObj[index] = 0.25;
            gen[instrument] = instrumentObj;
          }
        }
        newDurations[genIndex] = gen;
      }
      return newDurations;
    });
  }, []);

  const beatGridToggleFunctions = useMemo(() => {
    return generators.map((_, genIndex) =>
      (instrument: string, index: number) => toggleBeat(genIndex, instrument, index)
    );
  }, [toggleBeat, generators]);

  const volumeChangeHandlers = useMemo(() => {
    return generators.map((generator, genIndex) =>
      Object.keys(generator.clips).map((instrument) => ({
        instrument,
        handler: (newVolume: number) => {
          setVolumes((prevVolumes) => {
            const newVolumes = [...prevVolumes];
            newVolumes[genIndex] = {
              ...newVolumes[genIndex],
              [instrument]: newVolume,
            };
            return newVolumes;
          });
        }
      }))
    );
  }, [generators]);

  // Use virtualized grid for large sequences
  const shouldUseVirtualizedGrid = (sectionLength * totalSections) > 512;
  const GridComponent = shouldUseVirtualizedGrid ? VirtualizedBeatGrid : BeatGrid;

  return (
    <>
      <div className="controls-container">
        <button onClick={generateSong}>Generate Beat</button>
        <button onClick={playPause}>{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={restart}>Restart</button>
        <label className="control-label">BPM:</label>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBPM(Number(e.target.value))}
        />
      </div>
      {activations.map((generatorActivations, genIndex) => (
        <GridComponent
          key={genIndex}
          activations={generatorActivations}
          currentBeat={currentBeat}
          toggleBeat={beatGridToggleFunctions[genIndex]}
          totalNumberOfBeats={sectionLength * totalSections}
        />
      ))}
      <>
        {volumeChangeHandlers.map((generatorHandlers, genIndex) =>
          generatorHandlers.map(({ instrument, handler }) => (
            <VolumeControl
              key={`${genIndex}-${instrument}`}
              label={instrument}
              value={volumes[genIndex][instrument]}
              onChange={handler}
            />
          ))
        )}
      </>
    </>
  );
};

export default SequenceGenerator;
