import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';
import '../App.scss';
import { SectionTemplate, djentSongStructures } from '../types/SongStructure';
import BeatGrid from './BeatGrid';
import VirtualizedBeatGrid from './VirtualizedBeatGrid';
import { VolumeControl } from './VolumeControl';

export type Generator<GeneratorKeys extends string> = {
  clips: Record<GeneratorKeys, Tone.Player>;
  volumes: Record<GeneratorKeys, number>;
  offsets: Record<GeneratorKeys, number>;
  generateSection: (
    sectionLength: number,
    characteristics?: {
      complexity: number;
      density: number;
      syncopation: number;
      polyrhythm: boolean;
    }
  ) => Activations<GeneratorKeys>;
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

const sectionLength = 32 * 4;
const totalSections = 16;

const SequenceGenerator = ({ generators, keys }: SequenceGeneratorProps) => {
  const [bpm, setBPM] = useState<number>(130);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [songStructure, setSongStructure] = useState<SectionTemplate[]>([]);

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

      // Keep track of currently playing notes for each generator/instrument
      const activeNotes: Map<string, Set<string>> = new Map();

      Tone.Transport.scheduleRepeat((time) => {
        const newBeat = (currentBeatRef.current + 1) % (sectionLength * totalSections);
        currentBeatRef.current = newBeat;

        // Throttle UI updates
        throttledSetCurrentBeat(newBeat);

        generators.forEach((generator, genIndex) => {
          const generatorKey = `gen-${genIndex}`;
          if (!activeNotes.has(generatorKey)) {
            activeNotes.set(generatorKey, new Set());
          }
          const activeInstruments = activeNotes.get(generatorKey)!;

          Object.keys(activationsRef.current[genIndex]).forEach(
            (instrumentName) => {
              const isActive =
                activationsRef.current[genIndex][instrumentName][
                  currentBeatRef.current
                ];
              if (isActive) {
                // Stop previous note for this instrument to prevent overlap
                if (activeInstruments.has(instrumentName)) {
                  try {
                    generator.clips[instrumentName].stop(time);
                  } catch (error) {
                    // Ignore errors if the clip isn't currently playing
                  }
                }

                // If there is a duration for this instrument at this beat, use it to determine how long to play the clip
                const durationInBeats =
                  durationsRef.current[genIndex][instrumentName]?.[currentBeatRef.current];
                const durationInSeconds = durationInBeats
                  ? (60 / bpm) * durationInBeats
                  : undefined;

                // Start the new note
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

      // Stop all currently playing clips
      generators.forEach((generator) => {
        Object.values(generator.clips).forEach((clip) => {
          try {
            clip.stop();
          } catch (error) {
            // Ignore errors if clips aren't playing
          }
        });
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, generators, bpm, throttledSetCurrentBeat]);

  const generateSong = useCallback((): void => {
    // Select a random song structure
    const selectedStructure = djentSongStructures[Math.floor(Math.random() * djentSongStructures.length)];
    setSongStructure(selectedStructure);

    // Calculate total length from song structure
    const totalBeats = selectedStructure.reduce((total, section) => total + section.length, 0);

    const newActivations = generators.map((generator, genIndex) => {
      const fullBeat = Object.fromEntries(
        keys[genIndex].map((instrument) => [instrument, []]),
      ) as Activations<string>;

      // TODO - Replace with song structure generation
      for (let i = 0; i < totalSections; i++) {
        const section = generator.generateSection(sectionLength);
        Object.keys(section).forEach((instrument) => {
          fullBeat[instrument] = [
            ...section[instrument],
            ...fullBeat[instrument],
          ];
        });
      }

      // TODO - Fix generation via song structures
      // let currentBeatPosition = 0;

      // // Generate each section according to its template
      // selectedStructure.forEach((sectionTemplate) => {
      //   // Modify generation parameters based on section characteristics
      //   const sectionActivations = generator.generateSection(
      //     sectionTemplate.length,
      //     sectionTemplate.characteristics
      //   );

      //   // Apply dynamics (volume adjustments based on section)
      //   const dynamicsMultiplier = getDynamicsMultiplier(sectionTemplate.dynamics);

      //   Object.keys(sectionActivations).forEach((instrument) => {
      //     if (!fullBeat[instrument]) fullBeat[instrument] = [];

      //     // Apply section characteristics to modify patterns
      //     const modifiedPattern = applySectionCharacteristics(
      //       sectionActivations[instrument],
      //       sectionTemplate.characteristics
      //     );

      //     fullBeat[instrument] = fullBeat[instrument].concat(modifiedPattern);
      //   });

      //   currentBeatPosition += sectionTemplate.length;
      // });

      return fullBeat;
    });

    // Generate durations with section-aware logic
    const songDurations = generators.map((generator, index) => {
      if (generator.generateDurations) {
        return generator.generateDurations(newActivations[index], sectionLength);
      }
      return {};
    });

    restart();
    setActivations(newActivations);
    setDurations(songDurations);
  }, [generators, keys]);

  // Helper function to get volume multiplier based on dynamics
  const getDynamicsMultiplier = (dynamics: string): number => {
    const dynamicsMap: Record<string, number> = {
      'pp': 0.1,
      'p': 0.3,
      'mp': 0.5,
      'mf': 0.7,
      'f': 0.9,
      'ff': 1.0,
    };
    return dynamicsMap[dynamics] || 0.7;
  };

  // Helper function to apply section characteristics to patterns
  const applySectionCharacteristics = (
    pattern: boolean[],
    characteristics: SectionTemplate['characteristics']
  ): boolean[] => {
    let modifiedPattern = [...pattern];

    // Apply density - randomly remove notes based on density level
    if (characteristics.density < 1.0) {
      modifiedPattern = modifiedPattern.map(beat =>
        beat && Math.random() < characteristics.density
      );
    }

    // Apply complexity - add or remove syncopated beats
    if (characteristics.syncopation > 0.5) {
      // Add some off-beat activations
      for (let i = 1; i < modifiedPattern.length; i += 2) {
        if (Math.random() < characteristics.syncopation * 0.3) {
          modifiedPattern[i] = true;
        }
      }
    }

    return modifiedPattern;
  };

  // Update current section tracking
  useEffect(() => {
    if (songStructure.length === 0) return;

    let beatSum = 0;
    let sectionIndex = 0;

    for (let i = 0; i < songStructure.length; i++) {
      beatSum += songStructure[i].length;
      if (currentBeat < beatSum) {
        sectionIndex = i;
        break;
      }
    }

    setCurrentSection(sectionIndex);
  }, [currentBeat, songStructure]);

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
      <div className="app-header">
        <h1>Djenterator</h1>
        <p>Generate and customize progressive metal beats</p>
      </div>

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

      {/* Song structure display */}
      {songStructure.length > 0 && (
        <div className="song-structure-display">
          <h3>Song Structure</h3>
          <div className="section-indicators">
            {songStructure.map((section, index) => (
              <div
                key={index}
                className={`section-indicator ${index === currentSection ? 'active' : ''}`}
              >
                <span className="section-type">{section.type}</span>
                <span className="section-time-sig">
                  {section.timeSignature.numerator}/{section.timeSignature.denominator}
                </span>
                <span className="section-dynamics">{section.dynamics}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activations.map((generatorActivations, genIndex) => (
        <div key={genIndex} className="grid-container">
          <GridComponent
            activations={generatorActivations}
            currentBeat={currentBeat}
            toggleBeat={beatGridToggleFunctions[genIndex]}
            totalNumberOfBeats={sectionLength * totalSections}
          />
        </div>
      ))}

      <div className="volume-controls-container">
        <h3>Volume Controls</h3>
        <div className="volume-controls-grid">
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
        </div>
      </div>
    </>
  );
};

export default SequenceGenerator;
