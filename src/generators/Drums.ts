import * as Tone from 'tone';
import { Activations, Generator } from '../components/SequenceGenerator';
import bassClip from '../sounds/bass-note-f-trim-2.mp3';
import crashClip from '../sounds/crash.mp3';
import guitar1Clip from '../sounds/guitar-note.mp3';
import guitar2Clip from '../sounds/guitar-f-note-2.mp3';
import hatOpenClip from '../sounds/hat-open.mp3';
import kickClip from '../sounds/kick-metal.wav';
import snareClip from '../sounds/snare-metal.wav';

export const DrumGeneratorKeysArray = [
  'Crash',
  'Hi-hat',
  'Snare',
  'Kick',
  'Guitar1',
  'Guitar2',
  'Bass',
] as const;

export type DrumGeneratorKeys = (typeof DrumGeneratorKeysArray)[number];

export const DrumsGenerator: Generator<DrumGeneratorKeys> = {
  clips: {
    Crash: new Tone.Player(crashClip).toDestination(),
    'Hi-hat': new Tone.Player(hatOpenClip).toDestination(),
    Snare: new Tone.Player(snareClip).toDestination(),
    Kick: new Tone.Player(kickClip).toDestination(),
    Guitar1: new Tone.Player(guitar1Clip).toDestination(),
    Guitar2: new Tone.Player(guitar2Clip).toDestination(),
    Bass: new Tone.Player(bassClip).toDestination(),
  },
  volumes: {
    Crash: -18,
    'Hi-hat': -15,
    Snare: -15,
    Kick: -15,
    Guitar1: -20,
    Guitar2: -20,
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
      Guitar1: { patterns: [], always: [], match: 'Kick' },
      Guitar2: { patterns: [], always: [], match: 'Kick' },
      Bass: { patterns: [], always: [], match: 'Kick' },
    };

    const section: Activations<DrumGeneratorKeys> = Object.fromEntries(
      DrumGeneratorKeysArray.map(
        (instrument): [DrumGeneratorKeys, boolean[]] => [
          instrument,
          Array(sectionLength).fill(false),
        ],
      ),
    ) as Activations<DrumGeneratorKeys>;

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
  generateDurations: (section: Activations<DrumGeneratorKeys>) => {
    const guitarAndBassDurations = section.Guitar1.map((_, i) => {
      if (section.Guitar1[i] || section.Guitar2[i] || section.Bass[i]) {
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
