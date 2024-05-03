import crashClip from './sounds/crash.mp3';
import guitarClip from './sounds/guitar-note.mp3';
import hatOpenClip from './sounds/hat-open.mp3';
import kickClip from './sounds/kick-metal.wav';
import snareClip from './sounds/snare-metal.wav';
import bassClip from './sounds/bass-note-f-trim-2.mp3';

export type Generator<GeneratorKeys extends string> = {
  clips: Record<GeneratorKeys, string>;
  activations: Record<GeneratorKeys, boolean[]>;
  patterns: Record<
    GeneratorKeys,
    {
      patterns: number[];
      always: number[];
      match?: GeneratorKeys;
    }
  >;
  volumes: Record<GeneratorKeys, number>;
};

export const DrumsGenerator: Generator<
  'Crash' | 'Hi-hat' | 'Snare' | 'Kick' | 'Guitar' | 'Bass'
> = {
  clips: {
    Crash: crashClip,
    'Hi-hat': hatOpenClip,
    Snare: snareClip,
    Kick: kickClip,
    Guitar: guitarClip,
    Bass: bassClip,
  },
  activations: {
    Crash: Array(32).fill(false),
    'Hi-hat': Array(32).fill(false),
    Snare: Array(32).fill(false),
    Kick: Array(32).fill(false),
    Guitar: Array(32).fill(false),
    Bass: Array(32).fill(false),
  },
  patterns: {
    Crash: { patterns: [8, 32], always: [] },
    'Hi-hat': { patterns: [2, 3, 4], always: [] },
    Snare: { patterns: [2, 3, 4], always: [] },
    Kick: { patterns: [], always: [0] },
    Guitar: { patterns: [], always: [], match: 'Kick' },
    Bass: { patterns: [], always: [], match: 'Kick' },
  },
  volumes: {
    Crash: 0,
    'Hi-hat': 0,
    Snare: 0,
    Kick: 0,
    Guitar: 0,
    Bass: 0,
  },
};
