import * as Tone from 'tone';
import { Activations, Generator } from '../components/SequenceGenerator';
import { SectionTemplate } from '../types/SongStructure';

import bassClip from '../sounds/bass-note-f-trim-2.mp3';
import crashClip from '../sounds/crash.mp3';
import guitar1Clip from '../sounds/guitar-note.mp3';
import guitar2Clip from '../sounds/guitar-f-note-2.mp3';
import hatOpenClip from '../sounds/hat-open.mp3';
import kickClip from '../sounds/kick-metal.wav';
import snareClip from '../sounds/snare-metal.wav';

import CSharp4Clip from '../sounds/guitar/gCSharp4.mp3';
import C4Clip from '../sounds/guitar/gC4.mp3';
import ASharp4Clip from '../sounds/guitar/gASharp4.mp3';
import GSharp4Clip from '../sounds/guitar/gGSharp4.mp3';
import G4Clip from '../sounds/guitar/gG4.mp3';
import F4Clip from '../sounds/guitar/gF4.mp3';

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
  'CSharp4',
  'C4',
  'ASharp4',
  'GSharp4',
  'G4',
  'F4',
  'CSharp1',
  'C1',
  'ASharp1',
  'GSharp1',
  'G1',
  'F1',
] as const;

export type RhythmGeneratorKeys = (typeof RhythmGeneratorKeysArray)[number];

const guitarNoteVolume = -5;
const guitarNoteOffset = 0.05;

type PatternConfig = {
  patterns: number[];
  always: number[];
  match?: RhythmGeneratorKeys;
  djentPatterns?: number[][];
} | null;

type PatternsMap = Record<RhythmGeneratorKeys, PatternConfig>;

export const RhythmGenerator: Generator<RhythmGeneratorKeys> = {
  clips: {
    Crash: new Tone.Player(crashClip).toDestination(),
    'Hi-hat': new Tone.Player(hatOpenClip).toDestination(),
    Snare: new Tone.Player(snareClip).toDestination(),
    Kick: new Tone.Player(kickClip).toDestination(),
    Guitar1: new Tone.Player({ url: guitar1Clip, fadeOut: 0.01 }).toDestination(),
    Guitar2: new Tone.Player({ url: guitar2Clip, fadeOut: 0.01 }).toDestination(),
    Bass: new Tone.Player({ url: bassClip, fadeOut: 0.01 }).toDestination(),
    CSharp4: new Tone.Player({ url: CSharp4Clip, fadeOut: 0.01 }).toDestination(),
    C4: new Tone.Player({ url: C4Clip, fadeOut: 0.01 }).toDestination(),
    ASharp4: new Tone.Player({ url: ASharp4Clip, fadeOut: 0.01 }).toDestination(),
    GSharp4: new Tone.Player({ url: GSharp4Clip, fadeOut: 0.01 }).toDestination(),
    G4: new Tone.Player({ url: G4Clip, fadeOut: 0.01 }).toDestination(),
    F4: new Tone.Player({ url: F4Clip, fadeOut: 0.01 }).toDestination(),
    CSharp1: new Tone.Player({ url: CSharp1Clip, fadeOut: 0.01 }).toDestination(),
    C1: new Tone.Player({ url: C1Clip, fadeOut: 0.01 }).toDestination(),
    ASharp1: new Tone.Player({ url: ASharp1Clip, fadeOut: 0.01 }).toDestination(),
    GSharp1: new Tone.Player({ url: GSharp1Clip, fadeOut: 0.01 }).toDestination(),
    G1: new Tone.Player({ url: G1Clip, fadeOut: 0.01 }).toDestination(),
    F1: new Tone.Player({ url: F1Clip, fadeOut: 0.01 }).toDestination(),
  },
  volumes: {
    Crash: -18,
    'Hi-hat': -15,
    Snare: -12,
    Kick: -15,
    Guitar1: -170,
    Guitar2: -170,
    Bass: -180,
    CSharp4: guitarNoteVolume,
    C4: guitarNoteVolume,
    ASharp4: guitarNoteVolume,
    GSharp4: guitarNoteVolume,
    G4: guitarNoteVolume,
    F4: guitarNoteVolume,
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
    CSharp4: guitarNoteOffset,
    C4: guitarNoteOffset,
    ASharp4: guitarNoteOffset,
    GSharp4: guitarNoteOffset,
    G4: guitarNoteOffset,
    F4: guitarNoteOffset,
    CSharp1: guitarNoteOffset,
    C1: guitarNoteOffset,
    ASharp1: guitarNoteOffset,
    GSharp1: guitarNoteOffset,
    G1: guitarNoteOffset,
    F1: guitarNoteOffset,
  },
  generateSection: (sectionLength: number, characteristics?) => {
    // Initialize section with all instruments set to inactive
    const section: Activations<RhythmGeneratorKeys> = Object.fromEntries(
      RhythmGeneratorKeysArray.map(
        (instrument): [RhythmGeneratorKeys, boolean[]] => [
          instrument,
          Array(sectionLength).fill(false),
        ],
      ),
    ) as Activations<RhythmGeneratorKeys>;

    // Generate drum patterns first (kick pattern is needed for other instruments)
    generateDrumPatterns(section, sectionLength, characteristics);

    // Generate rhythm guitar patterns (based on kick pattern)
    generateRhythmGuitarPatterns(section);

    // Generate guitar note patterns (chord progressions)
    generateGuitarNotePatterns(section, sectionLength);

    return section;
  },
  generateDurations: (
    songActivations: Activations<RhythmGeneratorKeys>,
    songStructure: SectionTemplate[],
  ) => {
    // Calculate section boundaries from the song structure
    const sectionBoundaries: { start: number; end: number; template: SectionTemplate }[] = [];
    let currentPosition = 0;

    songStructure.forEach((sectionTemplate) => {
      sectionBoundaries.push({
        start: currentPosition,
        end: currentPosition + sectionTemplate.length,
        template: sectionTemplate
      });
      currentPosition += sectionTemplate.length;
    });

    // Find the last active beat in each section
    const lastActiveBeatsOfSections: number[] = [];
    sectionBoundaries.forEach(({ start, end }) => {
      const section = songActivations.Guitar1.slice(start, end);
      const lastActiveBeatOfSection = section.reduce(
        (acc, beat, i) => (beat ? i : acc),
        0,
      );
      lastActiveBeatsOfSections.push(lastActiveBeatOfSection + start);
    });

    const guitarAndBassDurations = songActivations.Guitar1.map((beat, i) => {
      if (songActivations.Guitar1[i]) {
        // Find which section this beat belongs to
        const currentSection = sectionBoundaries.find(
          ({ start, end }) => i >= start && i < end
        );

        if (!currentSection) return 0.25; // Default duration if section not found

        // If this is the last active beat of a section, set duration to remaining beats
        if (lastActiveBeatsOfSections.includes(i)) {
          const remainingBeatsInSection = currentSection.end - i;
          const maxDuration = remainingBeatsInSection / 4;
          return maxDuration;
        }

        // Calculate which quarter of the current section this beat belongs to
        const sectionLength = currentSection.end - currentSection.start;
        const beatPositionInSection = i - currentSection.start;
        const quarterLength = Math.floor(sectionLength / 4);

        if (quarterLength === 0) {
          // Section is too short to divide into quarters
          return 0.25;
        }

        const currentQuarter = Math.floor(beatPositionInSection / quarterLength);
        const nextQuarterStart = (currentQuarter + 1) * quarterLength;
        const beatsUntilNextQuarter = nextQuarterStart - beatPositionInSection;

        // Calculate maximum duration that won't overlap with next quarter
        const maxDuration = beatsUntilNextQuarter / 4;
        // Generate a random duration that's shorter than the maximum
        const randomDuration = (Math.floor(Math.random() * (maxDuration * 8)) + 1) / 8;
        return Math.min(randomDuration, maxDuration);
      }

      return null;
    });

    // Generate short durations for 4th octave flurry notes
    const generateFlurryDurations = (instrumentKey: RhythmGeneratorKeys) => {
      return songActivations[instrumentKey].map((beat, i) => {
        if (!beat) return null;

        // For flurry notes, find the distance to the next active note (any instrument)
        let nextActiveNoteDistance = 1; // Default to 1 beat
        for (let j = i + 1; j < songActivations[instrumentKey].length; j++) {
          // Check if any instrument has an active note at position j
          const hasAnyActiveNote = Object.keys(songActivations).some(key => {
            const typedKey = key as RhythmGeneratorKeys;
            return songActivations[typedKey][j];
          });

          if (hasAnyActiveNote) {
            nextActiveNoteDistance = j - i;
            break;
          }
        }

        // Duration should be short and not overlap with next note
        // Use at most half the distance to the next note, with a maximum of 0.25 beats
        const maxDuration = Math.min(0.25, (nextActiveNoteDistance - 0.25) / 4);
        return Math.max(0.0625, maxDuration); // Minimum 1/16 note duration
      });
    };

    const durations: Record<RhythmGeneratorKeys, (number | null)[] | null> = {
      Crash: null,
      'Hi-hat': null,
      Snare: null,
      Kick: null,
      Guitar1: guitarAndBassDurations,
      Guitar2: guitarAndBassDurations,
      Bass: guitarAndBassDurations,
      // 4th octave notes use short flurry durations to prevent overlap
      CSharp4: generateFlurryDurations('CSharp4'),
      C4: generateFlurryDurations('C4'),
      ASharp4: generateFlurryDurations('ASharp4'),
      GSharp4: generateFlurryDurations('GSharp4'),
      G4: generateFlurryDurations('G4'),
      F4: generateFlurryDurations('F4'),
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

// Helper function to generate kick patterns
const generateKickPattern = (
  section: Activations<RhythmGeneratorKeys>,
  sectionLength: number,
  characteristics?: any
) => {
  const kickConfig = {
    patterns: [],
    always: [0],
    djentPatterns: [
      [0, 1, 4, 5, 8, 9, 12, 13], // Double bass gallop
      [0, 3, 6, 7, 10, 13], // Syncopated doubles
      [0, 2, 4, 7, 9, 11, 14], // Odd groupings
      [0, 1, 2, 8, 9, 10], // Triplet groups
    ]
  };

  const { patterns, always, djentPatterns } = kickConfig;

  // Activate always-on beats
  for (const i of always) {
    section.Kick[i] = true;
  }

  // Use djent patterns based on characteristics
  const djentPatternChance = characteristics ?
    0.4 + (characteristics.complexity * 0.4) : 0.3;

  if (djentPatterns && Math.random() > (1 - djentPatternChance)) {
    const selectedDjentPattern = djentPatterns[Math.floor(Math.random() * djentPatterns.length)];
    const measureLength = 16; // 16th notes per measure

    for (let measure = 0; measure < Math.floor(sectionLength / measureLength); measure++) {
      const measureStart = measure * measureLength;
      selectedDjentPattern.forEach((beatOffset: number) => {
        const absolutePosition = measureStart + beatOffset;
        if (absolutePosition < sectionLength) {
          section.Kick[absolutePosition] = true;
        }
      });
    }
  } else if (patterns.length === 0) {
    section.Kick = section.Kick.map(
      (beat) => beat || Math.random() > 0.5,
    );
  }
};

const generateDrumPatterns = (
  section: Activations<RhythmGeneratorKeys>,
  sectionLength: number,
  characteristics?: any
) => {
  // 20% chance for drums to "open up" with spacious crash pattern
  const getHeavy = Math.random() < 0.2;
  if (getHeavy) {
    // Heavy pattern: crash every 8 beats, snare on 3rd crash of every group of 4, no hi-hat
    const crashPositions: number[] = [];

    // Set crash every 8 beats
    for (let i = 0; i < sectionLength; i += 8) {
      section.Crash[i] = true;
      crashPositions.push(i);
    }

    // Set snare on the 3rd crash of every group of 4 crashes
    if (crashPositions.length >= 3) {
      const groupsOf4 = Math.floor(crashPositions.length / 4);
      for (let group = 0; group < groupsOf4; group++) {
        const thirdCrashIndex = group * 4 + 2; // 0-indexed, so 2 is the 3rd position
        if (thirdCrashIndex < crashPositions.length) {
          const snarePosition = crashPositions[thirdCrashIndex];
          if (snarePosition < sectionLength) {
            section.Snare[snarePosition] = true;
          }
        }
      }
    }

    // No hi-hat for heavy pattern
    section['Hi-hat'] = Array(sectionLength).fill(false);

    // Generate kick patterns using the helper function
    generateKickPattern(section, sectionLength, characteristics);
    return;
  }

  const drumPatterns: Partial<PatternsMap> = {
    Crash: { patterns: [8, 32], always: [] },
    'Hi-hat': { patterns: [2, 3, 4], always: [] },
    Snare: {
      patterns: [2, 3, 4, 8],
      always: [],
      djentPatterns: [
        [2, 6, 10, 14], // Linear pattern
        [4, 12], // Half-time feel
        [3, 7, 11, 15], // Syncopated
        [2, 5, 8, 11, 14], // Complex fill-like
      ]
    },
  };

  for (const [key, value] of Object.entries(drumPatterns)) {
    if (!value) continue;

    const { patterns, always, djentPatterns } = value as NonNullable<PatternConfig>;
    const typedKey = key as RhythmGeneratorKeys;

    // Activate always-on beats
    for (const i of always) {
      section[typedKey][i] = true;
    }

    // Use djent patterns based on characteristics
    // Calculate probability of using djent patterns:
    // - Without characteristics: 30% chance (0.3)
    // - With characteristics: 40% base + up to 40% more based on complexity
    // - complexity = 0.0 → 40% chance, complexity = 1.0 → 80% chance
    // Higher complexity = more intricate, syncopated djent rhythms
    const djentPatternChance = characteristics ?
      0.4 + (characteristics.complexity * 0.4) : 0.3;

    if (djentPatterns && Math.random() > (1 - djentPatternChance)) {
      const selectedDjentPattern = djentPatterns[Math.floor(Math.random() * djentPatterns.length)];
      const measureLength = 16; // 16th notes per measure

      for (let measure = 0; measure < Math.floor(sectionLength / measureLength); measure++) {
        const measureStart = measure * measureLength;
        selectedDjentPattern.forEach((beatOffset: number) => {
          const absolutePosition = measureStart + beatOffset;
          if (absolutePosition < sectionLength) {
            section[typedKey][absolutePosition] = true;
          }
        });
      }
      continue;
    }

    // Handle regular patterns or random activation
    if (patterns.length === 0) {
      section[typedKey] = section[typedKey].map(
        (beat) => beat || Math.random() > 0.5,
      );
      continue;
    }

    // Apply selected pattern
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
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

  // Generate kick patterns
  generateKickPattern(section, sectionLength, characteristics);
};

const generateRhythmGuitarPatterns = (
  section: Activations<RhythmGeneratorKeys>
) => {
  const rhythmInstruments: RhythmGeneratorKeys[] = ['Guitar1', 'Guitar2', 'Bass'];

  // All rhythm instruments match the kick pattern
  rhythmInstruments.forEach(instrument => {
    section[instrument] = section.Kick;
  });
};

const generateGuitarNotePatterns = (
  section: Activations<RhythmGeneratorKeys>,
  sectionLength: number
) => {
  const guitarNotes: RhythmGeneratorKeys[] = [
    'CSharp1', 'C1', 'ASharp1', 'GSharp1', 'G1', 'F1'
  ];

  // 4th octave notes for flurries
  const fourthOctaveNotes: RhythmGeneratorKeys[] = [
    'CSharp4', 'C4', 'ASharp4', 'GSharp4', 'G4', 'F4'
  ];

  // 60% chance to use all F1 for low octave rhythm notes
  if (Math.random() < 0.6) {
    // Use F1 for all rhythm notes
    for (let i = 0; i < sectionLength; i++) {
      section.F1[i] = section.Kick[i];
    }
  } else {
    // Common djent chord progressions
    const djentProgressions = [
      ['F1', 'CSharp1', 'GSharp1', 'C1'], // i - V - ii - iv
      ['F1', 'ASharp1', 'C1', 'GSharp1'], // i - IV - V - ii
      ['CSharp1', 'F1', 'G1', 'ASharp1'], // V - i - ii - IV
    ];

    const selectedProgression = djentProgressions[Math.floor(Math.random() * djentProgressions.length)];
    const quarterLength = Math.floor(sectionLength / 4);

    for (let quarter = 0; quarter < 4; quarter++) {
      const startIndex = quarter * quarterLength;
      const endIndex = quarter === 3 ? sectionLength : (quarter + 1) * quarterLength;

      // Use chord from progression if available, otherwise random
      const chordNote = selectedProgression[quarter] ||
        guitarNotes[Math.floor(Math.random() * guitarNotes.length)];

      if (guitarNotes.includes(chordNote as RhythmGeneratorKeys)) {
        for (let i = startIndex; i < endIndex; i++) {
          // Only activate the note if the kick is active
          section[chordNote as RhythmGeneratorKeys][i] = section.Kick[i];
        }
      }
    }
  }

  // 30% chance to add flurries of 4th octave notes in gaps between kick beats
  if (Math.random() < 0.3) {
    // Find gaps between kick beats
    for (let i = 0; i < sectionLength - 1; i++) {
      // If current beat has kick and next beat doesn't, check for gap
      if (section.Kick[i] && !section.Kick[i + 1]) {
        let gapLength = 0;
        const gapStart = i + 1;

        // Find the length of the gap
        for (let j = gapStart; j < sectionLength && !section.Kick[j]; j++) {
          gapLength++;
        }

        // Only add flurries to gaps that are 2-6 beats long
        if (gapLength >= 2 && gapLength <= 6) {
          // Generate a flurry of 4th octave notes
          const flurryLength = Math.min(gapLength, Math.floor(Math.random() * 4) + 2);

          for (let k = 0; k < flurryLength; k++) {
            const beatIndex = gapStart + k;
            if (beatIndex < sectionLength) {
              // Randomly select a 4th octave note for the flurry
              const flurryNote = fourthOctaveNotes[Math.floor(Math.random() * fourthOctaveNotes.length)];
              section[flurryNote][beatIndex] = true;
            }
          }

          // Skip ahead to avoid overlapping flurries
          i = gapStart + gapLength - 1;
        }
      }
    }
  }
};
