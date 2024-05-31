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

export const DrumGeneratorKeysArray = [
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

export type DrumGeneratorKeys = (typeof DrumGeneratorKeysArray)[number];

const guitarNoteVolume = -5;

export const DrumsGenerator: Generator<DrumGeneratorKeys> = {
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
      DrumGeneratorKeys,
      {
        patterns: number[];
        always: number[];
        match?: DrumGeneratorKeys;
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

    const section: Activations<DrumGeneratorKeys> = Object.fromEntries(
      DrumGeneratorKeysArray.map(
        (instrument): [DrumGeneratorKeys, boolean[]] => [
          instrument,
          Array(sectionLength).fill(false),
        ],
      ),
    ) as Activations<DrumGeneratorKeys>;

    for (const [key, value] of Object.entries(patternsMap)) {
      if (!value) {
        continue;
      }

      const { patterns, always, match } = value;

      // Get the instrument name as a key of the Instruments type
      const typedKey = key as DrumGeneratorKeys;

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
      console.log('🚀 ~ selectedPattern:', selectedPattern);

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

    // Pick one of the keys with a pattern of null and copy the pattern from the Kick into that key
    const nullKeys = DrumGeneratorKeysArray.filter(
      (key) => patternsMap[key] === null,
    );
    const randomNullKey = nullKeys[Math.floor(Math.random() * nullKeys.length)];
    section[randomNullKey] = section.Kick;

    return section;
  },
  generateDurations: (section: Activations<DrumGeneratorKeys>) => {
    const guitarAndBassDurations = section.Guitar1.map((_, i) => {
      if (section.Guitar1[i] || section.Guitar2[i] || section.Bass[i]) {
        // If this is the last note in the section, make it an eighth note
        if (i === section.Guitar1.length - 1) {
          return 0.125;
        }

        // Randomly select a duration between 1/8 and 1/1
        return (Math.floor(Math.random() * 8) + 1) / 8;
      }
      return null;
    });

    const durations: Record<DrumGeneratorKeys, (number | null)[] | null> = {
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
DrumsGenerator.clips.Guitar1 = guitar1;
DrumsGenerator.clips.Guitar2 = guitar2;
