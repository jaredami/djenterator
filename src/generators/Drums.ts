import crashClip from '../sounds/crash.mp3';
import guitarClip from '../sounds/guitar-note.mp3';
import hatOpenClip from '../sounds/hat-open.mp3';
import kickClip from '../sounds/kick-metal.wav';
import snareClip from '../sounds/snare-metal.wav';
import bassClip from '../sounds/bass-note-f-trim-2.mp3';
import { Generator } from '../components/SequenceGenerator';

// export type DrumGeneratorKeys =
//   | 'Crash'
//   | 'Hi-hat'
//   | 'Snare'
//   | 'Kick'
//   | 'Guitar'
//   | 'Bass';

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
    Crash: -15,
    'Hi-hat': -15,
    Snare: -15,
    Kick: -15,
    Guitar: -20,
    Bass: -18,
  },
};
