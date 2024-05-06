import crashClip from '../sounds/crash.mp3';
import guitarClip from '../sounds/guitar-note.mp3';
import hatOpenClip from '../sounds/hat-open.mp3';
import kickClip from '../sounds/kick-metal.wav';
import snareClip from '../sounds/snare-metal.wav';
import bassClip from '../sounds/bass-note-f-trim-2.mp3';
import { Generator } from '../components/SequenceGenerator';
import * as Tone from 'tone';

export const DrumGeneratorKeysArray = [
  'Crash',
  'Hi-hat',
  'Snare',
  'Kick',
  'Guitar',
  'Bass',
] as const;

export type DrumGeneratorKeys = (typeof DrumGeneratorKeysArray)[number];

export const DrumsGenerator: Generator<DrumGeneratorKeys> = {
  clips: {
    Crash: new Tone.Player(crashClip).toDestination(),
    'Hi-hat': new Tone.Player(hatOpenClip).toDestination(),
    Snare: new Tone.Player(snareClip).toDestination(),
    Kick: new Tone.Player(kickClip).toDestination(),
    Guitar: new Tone.Player(guitarClip).toDestination(),
    Bass: new Tone.Player(bassClip).toDestination(),
  },
  activations: {
    Crash: Array(32).fill(false),
    'Hi-hat': Array(32).fill(false),
    Snare: Array(32).fill(false),
    Kick: Array(32).fill(false),
    Guitar: Array(32).fill(false),
    Bass: Array(32).fill(false),
  },
  volumes: {
    Crash: -15,
    'Hi-hat': -15,
    Snare: -15,
    Kick: -15,
    Guitar: -20,
    Bass: -18,
  },
  generateSection: (sectionLength: number) => {
    const patternsMap: Record<
      DrumGeneratorKeys,
      {
        patterns: number[];
        always: number[];
        match?: DrumGeneratorKeys;
      }
    > = {
      Crash: { patterns: [8, 32], always: [] },
      'Hi-hat': { patterns: [2, 3, 4], always: [] },
      Snare: { patterns: [2, 3, 4], always: [] },
      Kick: { patterns: [], always: [0] },
      Guitar: { patterns: [], always: [], match: 'Kick' },
      Bass: { patterns: [], always: [], match: 'Kick' },
    };

    const section: Generator<DrumGeneratorKeys>['activations'] =
      Object.fromEntries(
        DrumGeneratorKeysArray.map(
          (instrument): [DrumGeneratorKeys, boolean[]] => [
            instrument,
            Array(sectionLength).fill(false),
          ],
        ),
      ) as Generator<DrumGeneratorKeys>['activations'];

    for (const [key, { patterns, always, match }] of Object.entries(
      patternsMap,
    )) {
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
      for (let i = 0; i < section[typedKey].length; i += selectedPattern) {
        section[typedKey][i] = true;
      }
    }

    return section;
  },
};
