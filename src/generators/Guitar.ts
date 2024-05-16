import * as Tone from 'tone';
import { Activations, Generator } from '../components/SequenceGenerator';
import EClip from '../sounds/guitar/guitar-E.mp3';
import DSharpClip from '../sounds/guitar/guitar-DSharp.mp3';
import DClip from '../sounds/guitar/guitar-D.mp3';
import CSharpClip from '../sounds/guitar/guitar-CSharp.mp3';
import CClip from '../sounds/guitar/guitar-C.mp3';
import BClip from '../sounds/guitar/guitar-B.mp3';
import ASharpClip from '../sounds/guitar/guitar-ASharp.mp3';
import AClip from '../sounds/guitar/guitar-A.mp3';
import GSharpClip from '../sounds/guitar/guitar-GSharp.mp3';
import GClip from '../sounds/guitar/guitar-G.mp3';
import FSharpClip from '../sounds/guitar/guitar-FSharp.mp3';
import FClip from '../sounds/guitar/guitar-F.mp3';

export const GuitarGeneratorKeysArray = [
  // 'E',
  'D#',
  // 'D',
  'C#',
  'C',
  // 'B',
  'A#',
  // 'A',
  'G#',
  // 'G',
  // 'F#',
  'F',
] as const;

export type GuitarGeneratorKeys = (typeof GuitarGeneratorKeysArray)[number];

export const GuitarGenerator: Generator<GuitarGeneratorKeys> = {
  clips: {
    // E: new Tone.Player(EClip).toDestination(),
    'D#': new Tone.Player(DSharpClip).toDestination(),
    // D: new Tone.Player(DClip).toDestination(),
    'C#': new Tone.Player(CSharpClip).toDestination(),
    C: new Tone.Player(CClip).toDestination(),
    // B: new Tone.Player(BClip).toDestination(),
    'A#': new Tone.Player(ASharpClip).toDestination(),
    // A: new Tone.Player(AClip).toDestination(),
    'G#': new Tone.Player(GSharpClip).toDestination(),
    // G: new Tone.Player(GClip).toDestination(),
    // 'F#': new Tone.Player(FSharpClip).toDestination(),
    F: new Tone.Player(FClip).toDestination(),
  },
  volumes: {
    // E: -15,
    'D#': -15,
    // D: -15,
    'C#': -15,
    C: -15,
    // B: -15,
    'A#': -15,
    // A: -15,
    'G#': -15,
    // G: -15,
    // 'F#': -15,
    F: -15,
  },
  generateSection: (sectionLength) => {
    const section = Object.fromEntries(
      GuitarGeneratorKeysArray.map((instrument) => [
        instrument,
        Array(sectionLength).fill(false),
      ]),
    ) as Activations<GuitarGeneratorKeys>;

    // Helper function to wrap index correctly
    function wrapIndex(index: number, length: number) {
      return ((index % length) + length) % length;
    }

    let i = 0;
    while (i < sectionLength) {
      // Random sequence length between 3 and 10
      let sequenceLength = Math.floor(Math.random() * 8) + 3;
      sequenceLength = Math.min(sequenceLength, sectionLength - i); // Ensure sequence doesn't exceed section length

      // Random start index for sequence
      const startIndex = Math.floor(
        Math.random() * GuitarGeneratorKeysArray.length,
      );

      // Decide direction: -2, -1 for previous instruments; 1, 2 for next instruments
      const directions = [-2, -1, 1, 2];
      const direction =
        directions[Math.floor(Math.random() * directions.length)];

      for (let j = 0; j < sequenceLength; j++) {
        // Wrap around on reaching ends
        const currentIndex = wrapIndex(
          startIndex + j * direction,
          GuitarGeneratorKeysArray.length,
        );
        section[GuitarGeneratorKeysArray[currentIndex]][i] = true;
        i++;
      }
    }

    return section;
  },
  generateDurations: (section: Activations<GuitarGeneratorKeys>) => {
    // The durations for each instrument should all be 1 quarter note
    const oneBeat = 0.25; // 0.25 beats = 1 quarter note
    const generateInstrumentDurations = (instrument: (boolean | null)[]) => {
      return instrument.map((beat) => (beat ? oneBeat : null));
    };

    const durations: Record<GuitarGeneratorKeys, (number | null)[] | null> = {
      // E: generateInstrumentDurations(section.E),
      'D#': generateInstrumentDurations(section['D#']),
      // D: generateInstrumentDurations(section.D),
      'C#': generateInstrumentDurations(section['C#']),
      C: generateInstrumentDurations(section.C),
      // B: generateInstrumentDurations(section.B),
      'A#': generateInstrumentDurations(section['A#']),
      // A: generateInstrumentDurations(section.A),
      'G#': generateInstrumentDurations(section['G#']),
      // G: generateInstrumentDurations(section.G),
      // 'F#': generateInstrumentDurations(section['F#']),
      F: generateInstrumentDurations(section.F),
    };

    return durations;
  },
};

const generateRandomAdjacentNotes = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(32).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  let lastKey: GuitarGeneratorKeys | null = null;

  // Activate a random instrument for each beat in the section
  for (let i = 0; i < sectionLength; i++) {
    let randomKey: GuitarGeneratorKeys;
    do {
      const randomIndex = Math.floor(
        Math.random() * GuitarGeneratorKeysArray.length,
      );
      randomKey = GuitarGeneratorKeysArray[randomIndex];
    } while (randomKey === lastKey);
    section[randomKey][i] = true;
    lastKey = randomKey;
  }

  return section;
};

const generateRepeatingSequencesOfAdjacentNotes = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  let i = 0;
  while (i < sectionLength) {
    // Random sequence length between 3 and 10
    let sequenceLength = Math.floor(Math.random() * 8) + 3;
    sequenceLength = Math.min(sequenceLength, sectionLength - i); // Ensure sequence doesn't exceed section length

    // Random start index for sequence
    const startIndex = Math.floor(
      Math.random() * GuitarGeneratorKeysArray.length,
    );
    const direction = Math.random() > 0.5 ? 1 : -1; // Decide direction: 1 for next instrument, -1 for previous

    for (let j = 0; j < sequenceLength; j++) {
      // Wrap around on reaching ends
      const currentIndex =
        (startIndex + j * direction + GuitarGeneratorKeysArray.length) %
        GuitarGeneratorKeysArray.length;
      section[GuitarGeneratorKeysArray[currentIndex]][i] = true;
      i++;
    }
  }

  return section;
};
