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
    songStructure: SectionTemplate[],
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
        const totalBeats = songStructure.length > 0
          ? songStructure.reduce((total, section) => total + section.length, 0)
          : sectionLength * totalSections;
        const newBeat = (currentBeatRef.current + 1) % totalBeats;
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

                // Mark this instrument as active
                activeInstruments.add(instrumentName);

                // Schedule stopping the note tracking when it ends
                if (durationInSeconds) {
                  Tone.Transport.scheduleOnce(() => {
                    activeInstruments.delete(instrumentName);
                  }, time + durationInSeconds);
                } else {
                  // For percussion/short samples, remove from active set after a short delay
                  Tone.Transport.scheduleOnce(() => {
                    activeInstruments.delete(instrumentName);
                  }, time + 0.1);
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
  }, [isPlaying, generators, bpm, throttledSetCurrentBeat, songStructure]);

  const restart = useCallback((): void => {
    setCurrentBeat(0);
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
  }, []);

  const generateSong = useCallback((): void => {
    // Select a random song structure
    const selectedStructure = djentSongStructures[Math.floor(Math.random() * djentSongStructures.length)];
    setSongStructure(selectedStructure);

    const newActivations = generators.map((generator, genIndex) => {
      const fullBeat = Object.fromEntries(
        keys[genIndex].map((instrument) => [instrument, []]),
      ) as Activations<string>;

      // Generate each section according to its template
      selectedStructure.forEach((sectionTemplate) => {
        // Generate section with the specified length and characteristics
        const sectionActivations = generator.generateSection(
          sectionTemplate.length,
          sectionTemplate.characteristics
        );

        // Concatenate the section activations to the full beat
        Object.keys(sectionActivations).forEach((instrument) => {
          if (!fullBeat[instrument]) fullBeat[instrument] = [];
          fullBeat[instrument] = fullBeat[instrument].concat(sectionActivations[instrument]);
        });
      });

      return fullBeat;
    });

    // Generate durations with section-aware logic
    const songDurations = generators.map((generator, index) => {
      if (generator.generateDurations) {
        return generator.generateDurations(newActivations[index], selectedStructure);
      }
      return {};
    });

    restart();
    setActivations(newActivations);
    setDurations(songDurations);
  }, [generators, keys, restart]);

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
  const totalBeatsInSong = songStructure.length > 0
    ? songStructure.reduce((total, section) => total + section.length, 0)
    : sectionLength * totalSections;
  const shouldUseVirtualizedGrid = totalBeatsInSong > 512;
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
            totalNumberOfBeats={totalBeatsInSong}
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
