import * as Tone from 'tone';
import { Activations, Generator } from '../components/SequenceGenerator';

import bassClip from '../sounds/bass-note-f-trim-2.mp3';
import crashClip from '../sounds/crash.mp3';
import guitar1Clip from '../sounds/guitar-note.mp3';
import guitar2Clip from '../sounds/guitar-f-note-2.mp3';
import hatOpenClip from '../sounds/hat-open.mp3';
import kickClip from '../sounds/kick-metal.wav';
import snareClip from '../sounds/snare-metal.wav';

import CSharp1Clip from '../sounds/guitar/guitar-CSharp.mp3';
import C1Clip from '../sounds/guitar/guitar-C.mp3';
import ASharp1Clip from '../sounds/guitar/guitar-ASharp.mp3';
import GSharp1Clip from '../sounds/guitar/guitar-GSharp.mp3';
import G1Clip from '../sounds/guitar/guitar-G.mp3';
import F1Clip from '../sounds/guitar/guitar-F.mp3';

export const RhythmGeneratorKeysArray = [
  'Crash',
  'Hi-hat',
  'Snare',
  'Kick',
  'Guitar1',
  'Guitar2',
  'Bass',
  'CSharp1',
  'C1',
  'ASharp1',
  'GSharp1',
  'G1',
  'F1',
] as const;

export type RhythmGeneratorKeys = (typeof RhythmGeneratorKeysArray)[number];

const guitarNoteVolume = -5;

export const RhythmGenerator: Generator<RhythmGeneratorKeys> = {
  clips: {
    Crash: new Tone.Player(crashClip).toDestination(),
    'Hi-hat': new Tone.Player(hatOpenClip).toDestination(),
    Snare: new Tone.Player(snareClip).toDestination(),
    Kick: new Tone.Player(kickClip).toDestination(),
    Guitar1: new Tone.Player(guitar1Clip).toDestination(),
    Guitar2: new Tone.Player(guitar2Clip).toDestination(),
    Bass: new Tone.Player(bassClip).toDestination(),
    CSharp1: new Tone.Player(CSharp1Clip).toDestination(),
    C1: new Tone.Player(C1Clip).toDestination(),
    ASharp1: new Tone.Player(ASharp1Clip).toDestination(),
    GSharp1: new Tone.Player(GSharp1Clip).toDestination(),
    G1: new Tone.Player(G1Clip).toDestination(),
    F1: new Tone.Player(F1Clip).toDestination(),
  },
  volumes: {
    Crash: -18,
    'Hi-hat': -15,
    Snare: -12,
    Kick: -15,
    Guitar1: -170,
    Guitar2: -170,
    Bass: -180,
    CSharp1: guitarNoteVolume,
    C1: guitarNoteVolume,
    ASharp1: guitarNoteVolume,
    GSharp1: guitarNoteVolume,
    G1: guitarNoteVolume,
    F1: guitarNoteVolume,
  },
  offsets: {
    Crash: 0,
    'Hi-hat': 0,
    Snare: 0,
    Kick: 0,
    Guitar1: 0,
    Guitar2: 0,
    Bass: 0,
    CSharp1: 0.05,
    C1: 0.05,
    ASharp1: 0.05,
    GSharp1: 0.05,
    G1: 0.05,
    F1: 0.05,
  },
  generateSection: (sectionLength: number) => {
    const patternsMap: Record<
      RhythmGeneratorKeys,
      {
        patterns: number[];
        always: number[];
        match?: RhythmGeneratorKeys;
      } | null
    > = {
      Crash: { patterns: [8, 32], always: [] },
      'Hi-hat': { patterns: [2, 3, 4], always: [] },
      Snare: { patterns: [2, 3, 4, 8], always: [] },
      Kick: { patterns: [], always: [0] },
      Guitar1: { patterns: [], always: [], match: 'Kick' },
      Guitar2: { patterns: [], always: [], match: 'Kick' },
      Bass: { patterns: [], always: [], match: 'Kick' },
      CSharp1: null,
      C1: null,
      ASharp1: null,
      GSharp1: null,
      G1: null,
      F1: null,
    };

    const section: Activations<RhythmGeneratorKeys> = Object.fromEntries(
      RhythmGeneratorKeysArray.map(
        (instrument): [RhythmGeneratorKeys, boolean[]] => [
          instrument,
          Array(sectionLength).fill(false),
        ],
      ),
    ) as Activations<RhythmGeneratorKeys>;

    for (const [key, value] of Object.entries(patternsMap)) {
      if (!value) {
        continue;
      }

      const { patterns, always, match } = value;

      // Get the instrument name as a key of the Instruments type
      const typedKey = key as RhythmGeneratorKeys;

      if (match) {
        section[typedKey] = section[match];
        continue;
      }

      // Activate the beats that should always be active for this instrument
      for (const i of always) {
        section[typedKey][i] = true;
      }

      // If there are no patterns for this instrument, randomly activate beats
      if (patterns.length === 0) {
        section[typedKey] = section[typedKey].map(
          // Randomly activate the beat, but keep it active if it was already active due to the always array
          (beat) => beat || Math.random() > 0.5,
        );
        // Skip the rest of the loop
        continue;
      }

      // Randomly select a pattern and activate the beats for that pattern
      const selectedPattern =
        patterns[Math.floor(Math.random() * patterns.length)];

      // 70% of the time, only activate every other index from the pattern for the Snare
      const skipSnareHits = Math.random() > 0.3;
      let previousSnareActivated = true;
      for (let i = 0; i < section[typedKey].length; i += selectedPattern) {
        if (skipSnareHits && typedKey === 'Snare') {
          if (previousSnareActivated) {
            previousSnareActivated = false;
            continue;
          } else {
            previousSnareActivated = true;
            section[typedKey][i] = true;
          }
        } else {
          section[typedKey][i] = true;
        }
      }
    }

    // Switch guitar notes randomly every 1/4 portion of the section
    const nullKeys = RhythmGeneratorKeysArray.filter(
      (key) => patternsMap[key] === null,
    );
    const quarterLength = Math.floor(sectionLength / 4);

    for (let quarter = 0; quarter < 4; quarter++) {
      const startIndex = quarter * quarterLength;
      const endIndex = quarter === 3 ? sectionLength : (quarter + 1) * quarterLength;
      const randomNullKey = nullKeys[Math.floor(Math.random() * nullKeys.length)];

      for (let i = startIndex; i < endIndex; i++) {
        section[randomNullKey][i] = section.Kick[i];
      }
    }

    return section;
  },
  generateDurations: (
    songActivations: Activations<RhythmGeneratorKeys>,
    sectionLength: number,
  ) => {
    const numberOfSections = songActivations.Guitar1.length / sectionLength;
    const lastActiveBeatsOfSections: number[] = [];
    for (let i = 0; i < numberOfSections; i++) {
      const startOfSectionIndex = i * sectionLength;
      const endOfSectionIndex = startOfSectionIndex + sectionLength;
      const section = songActivations.Guitar1.slice(
        startOfSectionIndex,
        endOfSectionIndex,
      );
      const lastActiveBeatOfSection = section.reduce(
        (acc, beat, i) => (beat ? i : acc),
        0,
      );
      lastActiveBeatsOfSections.push(
        lastActiveBeatOfSection + startOfSectionIndex,
      );
    }

    const guitarAndBassDurations = songActivations.Guitar1.map((beat, i) => {
      if (songActivations.Guitar1[i]) {
        // If this is the last active beat of a section, set duration to remaining beats
        if (lastActiveBeatsOfSections.includes(i)) {
          const remainingBeatsInSection = sectionLength - (i % sectionLength);
          const maxDuration = remainingBeatsInSection / 4;
          return maxDuration;
        }

        // Calculate which quarter of the section this beat belongs to
        const quarterLength = Math.floor(sectionLength / 4);
        const currentQuarter = Math.floor((i % sectionLength) / quarterLength);
        const nextQuarterStart = (currentQuarter + 1) * quarterLength;
        const beatsUntilNextQuarter = nextQuarterStart - (i % sectionLength);

        // Calculate maximum duration that won't overlap with next quarter
        const maxDuration = beatsUntilNextQuarter / 4;
        // Generate a random duration that's shorter than the maximum
        const randomDuration = (Math.floor(Math.random() * (maxDuration * 8)) + 1) / 8;
        return Math.min(randomDuration, maxDuration);
      }

      return null;
    });

    const durations: Record<RhythmGeneratorKeys, (number | null)[] | null> = {
      Crash: null,
      'Hi-hat': null,
      Snare: null,
      Kick: null,
      Guitar1: guitarAndBassDurations,
      Guitar2: guitarAndBassDurations,
      Bass: guitarAndBassDurations,
      CSharp1: guitarAndBassDurations,
      C1: guitarAndBassDurations,
      ASharp1: guitarAndBassDurations,
      GSharp1: guitarAndBassDurations,
      G1: guitarAndBassDurations,
      F1: guitarAndBassDurations,
    };

    return durations;
  },
};

// Initialize guitars and panners
const guitar1 = new Tone.Player(guitar1Clip);
const guitar2 = new Tone.Player(guitar2Clip);
const panLeft = new Tone.Panner(-1).toDestination();
const panRight = new Tone.Panner(1).toDestination();

// Connect guitars to the panners
guitar1.connect(panLeft);
guitar2.connect(panRight);

// Add guitars to the generator
RhythmGenerator.clips.Guitar1 = guitar1;
RhythmGenerator.clips.Guitar2 = guitar2;
