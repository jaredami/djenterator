import * as Tone from 'tone';
import { Activations, Generator } from '../components/SequenceGenerator';
import E4Clip from '../sounds/guitar/gE4.mp3';
import DSharp4Clip from '../sounds/guitar/gDSharp4.mp3';
import D4Clip from '../sounds/guitar/gD4.mp3';
import CSharp4Clip from '../sounds/guitar/gCSharp4.mp3';
import C4Clip from '../sounds/guitar/gC4.mp3';
import B4Clip from '../sounds/guitar/gB4.mp3';
import ASharp4Clip from '../sounds/guitar/gASharp4.mp3';
import A4Clip from '../sounds/guitar/gA4.mp3';
import GSharp4Clip from '../sounds/guitar/gGSharp4.mp3';
import G4Clip from '../sounds/guitar/gG4.mp3';
import FSharp4Clip from '../sounds/guitar/gFSharp4.mp3';
import F4Clip from '../sounds/guitar/gF4.mp3';

export const GuitarGeneratorKeysArray = [
  // 'E4',
  // 'D#4',
  // 'D4',
  'CSharp4',
  'C4',
  // 'B4',
  'ASharp4',
  // 'A4',
  'GSharp4',
  'G4',
  // 'F#4',
  'F4',
] as const;

export type GuitarGeneratorKeys = (typeof GuitarGeneratorKeysArray)[number];

const volume = -10;

export const GuitarGenerator: Generator<GuitarGeneratorKeys> = {
  clips: {
    // E4: new Tone.Player(E4Clip).toDestination(),
    // 'D#4': new T4one.Player(DSharp4Clip).toDestination(),
    // D4: new Tone.Player(D4Clip).toDestination(),
    CSharp4: new Tone.Player(CSharp4Clip).toDestination(),
    C4: new Tone.Player(C4Clip).toDestination(),
    // B4: new Tone.Player(B4Clip).toDestination(),
    ASharp4: new Tone.Player(ASharp4Clip).toDestination(),
    // A4: new Tone.Player(A4Clip).toDestination(),
    GSharp4: new Tone.Player(GSharp4Clip).toDestination(),
    G4: new Tone.Player(G4Clip).toDestination(),
    // 'F#4': new Tone.Player(FSharp4Clip).toDestination(),
    F4: new Tone.Player(F4Clip).toDestination(),
  },
  volumes: {
    // E4: volume,
    // 'D#4': volume,
    // D4: volume,
    CSharp4: volume,
    C4: volume,
    // B4: volume,
    ASharp4: volume,
    // A4: volume,
    GSharp4: volume,
    G4: volume,
    // 'F#4': volume,
    F4: volume,
  },
  offset: 0.05,
  generateSection: (sectionLength) => {
    return generateSectionPattern1(sectionLength);
  },
  generateDurations: (section: Activations<GuitarGeneratorKeys>) => {
    // The durations for each instrument should all be 1 quarter note
    const oneBeat = 0.25; // 0.25 beats = 1 quarter note
    const generateInstrumentDurations = (instrument: (boolean | null)[]) => {
      return instrument.map((beat) => (beat ? oneBeat : null));
    };

    const durations: Record<GuitarGeneratorKeys, (number | null)[] | null> = {
      // E4: generateInstrumentDurations(section.E4),
      // 'D#4': generateInstrumentDurations(section['D#'4]),
      // D4: generateInstrumentDurations(section.D4),
      CSharp4: generateInstrumentDurations(section['CSharp4']),
      C4: generateInstrumentDurations(section.C4),
      // B4: generateInstrumentDurations(section.B),
      ASharp4: generateInstrumentDurations(section['ASharp4']),
      // A4: generateInstrumentDurations(section.A4),
      GSharp4: generateInstrumentDurations(section['GSharp4']),
      G4: generateInstrumentDurations(section.G4),
      // 'F#4': generateInstrumentDurations(section['F#4']),
      F4: generateInstrumentDurations(section.F4),
    };

    return durations;
  },
};

// Random sequence of adjacent notes
const generateSectionPattern1 = (sectionLength: number) => {
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

// Generate repeating sequences of adjacent notes
const generateSectionPattern2 = (sectionLength: number) => {
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

// Generate repeating sequences of notes that are at most 2 notes apart from each other
const generateSectionPattern3 = (sectionLength: number) => {
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
    const direction = directions[Math.floor(Math.random() * directions.length)];

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
};

// Generate repeating sequence of random notes
const generateSectionPattern4 = (sectionLength: number) => {
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

  // Random sequence length between 3 and 10
  let sequenceLength = Math.floor(Math.random() * 12) + 5;
  sequenceLength = Math.min(sequenceLength, sectionLength); // Ensure sequence doesn't exceed section length

  const sequence = [];
  for (let j = 0; j < sequenceLength; j++) {
    // Random start index for sequence
    const randomIndex = Math.floor(
      Math.random() * GuitarGeneratorKeysArray.length,
    );

    const currentIndex = wrapIndex(
      randomIndex,
      GuitarGeneratorKeysArray.length,
    );

    sequence.push(GuitarGeneratorKeysArray[currentIndex]);
  }

  for (let i = 0; i < sectionLength; i++) {
    const note = sequence[i % sequenceLength] as keyof typeof section;
    section[note][i] = true;
  }

  return section;
};
