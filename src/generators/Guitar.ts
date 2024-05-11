import * as Tone from 'tone';
import { Activations, Generator } from '../components/SequenceGenerator';
import AClip from '../sounds/ga1.wav';
import BClip from '../sounds/gb1.wav';
import DClip from '../sounds/gd1.wav';

export const GuitarGeneratorKeysArray = [
  //   'E',
  //   'D#',
  'D',
  //   'C#',
  //   'C',
  'B',
  //   'A#',
  'A',
  //   'G#',
  //   'G',
  //   'F#',
  //   'F',
] as const;

export type GuitarGeneratorKeys = (typeof GuitarGeneratorKeysArray)[number];

export const GuitarGenerator: Generator<GuitarGeneratorKeys> = {
  clips: {
    //   'E': EClip,
    //   'D#': DSharpClip,
    D: new Tone.Player(DClip).toDestination(),
    //   'C#': CSharpClip,
    //   'C': CClip,
    B: new Tone.Player(BClip).toDestination(),
    //   'A#': ASharpClip,
    A: new Tone.Player(AClip).toDestination(),
    //   'G#': GSharpClip,
    //   'G': GClip,
    //   'F#': FSharpClip,
    //   'F': FClip,
  },
  volumes: {
    // E: -15,
    // 'D#': -15,
    D: -150,
    // 'C#': -15,
    // C: -15,
    B: -150,
    // 'A#': -15,
    A: -150,
    // 'G#': -15,
    // G: -15,
    // 'F#': -15,
    // F: -15,
  },
  generateSection: (sectionLength) => {
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
  },
  generateDurations: (section: Activations<GuitarGeneratorKeys>) => {
    // The durations for each instrument should all be 1 quarter note
    const oneBeat = 0.25; // 0.25 beats = 1 quarter note
    const generateInstrumentDurations = (instrument: (boolean | null)[]) => {
      return instrument.map((beat) => (beat ? oneBeat : null));
    };

    const durations: Record<GuitarGeneratorKeys, (number | null)[] | null> = {
      D: generateInstrumentDurations(section.D),
      B: generateInstrumentDurations(section.B),
      A: generateInstrumentDurations(section.A),
    };

    return durations;
  },
};
