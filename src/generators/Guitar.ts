import * as Tone from 'tone';
import { Activations, Generator } from '../components/SequenceGenerator';
import { SectionTemplate } from '../types/SongStructure';
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

import CSharp1Clip from '../sounds/guitar/guitar-CSharp.mp3';
import C1Clip from '../sounds/guitar/guitar-C.mp3';
import ASharp1Clip from '../sounds/guitar/guitar-ASharp.mp3';
import GSharp1Clip from '../sounds/guitar/guitar-GSharp.mp3';
import G1Clip from '../sounds/guitar/guitar-G.mp3';
import F1Clip from '../sounds/guitar/guitar-F.mp3';

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
  //=================
  // 'CSharp1',
  // 'C1',
  // 'ASharp1',
  // 'GSharp1',
  // 'G1',
  // 'F1',
] as const;

export type GuitarGeneratorKeys = (typeof GuitarGeneratorKeysArray)[number];

const volume = -8;
const offset = 0.05;

export const GuitarGenerator: Generator<GuitarGeneratorKeys> = {
  label: 'Lead Guitar',
  masterVolume: -10,
  clips: {
    // E4: new Tone.Player(E4Clip).toDestination(),
    // 'D#4': new T4one.Player(DSharp4Clip).toDestination(),
    // D4: new Tone.Player(D4Clip).toDestination(),
    CSharp4: new Tone.Player({ url: CSharp4Clip, fadeOut: 0.01 }).toDestination(),
    C4: new Tone.Player({ url: C4Clip, fadeOut: 0.01 }).toDestination(),
    // B4: new Tone.Player(B4Clip).toDestination(),
    ASharp4: new Tone.Player({ url: ASharp4Clip, fadeOut: 0.01 }).toDestination(),
    // A4: new Tone.Player(A4Clip).toDestination(),
    GSharp4: new Tone.Player({ url: GSharp4Clip, fadeOut: 0.01 }).toDestination(),
    G4: new Tone.Player({ url: G4Clip, fadeOut: 0.01 }).toDestination(),
    // 'F#4': new Tone.Player(FSharp4Clip).toDestination(),
    F4: new Tone.Player({ url: F4Clip, fadeOut: 0.01 }).toDestination(),
    //=================
    // CSharp1: new Tone.Player(CSharp1Clip).toDestination(),
    // C1: new Tone.Player(C1Clip).toDestination(),
    // ASharp1: new Tone.Player(ASharp1Clip).toDestination(),
    // GSharp1: new Tone.Player(GSharp1Clip).toDestination(),
    // G1: new Tone.Player(G1Clip).toDestination(),
    // F1: new Tone.Player(F1Clip).toDestination(),
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
    //=================
    // CSharp1: volume,
    // C1: volume,
    // ASharp1: volume,
    // GSharp1: volume,
    // G1: volume,
    // F1: volume,
  },
  offsets: {
    // Apply offset to all keys
    ...(Object.fromEntries(
      GuitarGeneratorKeysArray.map((key) => [key, offset]),
    ) as Record<GuitarGeneratorKeys, number>),
  },
  generateSection: (sectionLength, characteristics) => {
    // 30% chance to generate an empty section with no beats activated
    if (Math.random() < 0.3) {
      return Object.fromEntries(
        GuitarGeneratorKeysArray.map((instrument) => [
          instrument,
          Array(sectionLength).fill(false),
        ]),
      ) as Activations<GuitarGeneratorKeys>;
    }

    if (Math.random() < 0.4) {
      return generateRandomNoteSequence(sectionLength);
    }

    // Choose from lead guitar pattern set
    const leadPatternGenerators = [
      generateMelodicScaleRun,
      generateArpeggioPattern,
      generatePentatonicLicks,
      generateSustainedMelody,
      generateTechnicalRuns,
      generateAmbientSwells,
      generateProgressiveChords,
    ];

    // If characteristics are provided, bias towards certain patterns
    let selectedGenerator;
    if (characteristics) {
      if (characteristics.polyrhythm) {
        selectedGenerator = generateTechnicalRuns; // Technical patterns for polyrhythm
      } else if (characteristics.syncopation && characteristics.syncopation > 0.7) {
        selectedGenerator = generatePentatonicLicks; // Licks work well with syncopation
      } else if (characteristics.complexity && characteristics.complexity > 0.6) {
        selectedGenerator = Math.random() > 0.5 ? generateTechnicalRuns : generateMelodicScaleRun;
      } else if (characteristics.density && characteristics.density < 0.3) {
        selectedGenerator = Math.random() > 0.5 ? generateAmbientSwells : generateSustainedMelody;
      } else {
        selectedGenerator = leadPatternGenerators[Math.floor(Math.random() * leadPatternGenerators.length)];
      }
    } else {
      selectedGenerator = leadPatternGenerators[Math.floor(Math.random() * leadPatternGenerators.length)];
    }

    return selectedGenerator(sectionLength);
  },
  generateDurations: (section: Activations<GuitarGeneratorKeys>, songStructure: SectionTemplate[]) => {
    // For lead guitar, we want longer, more musical durations
    // Each grid position represents a quarter note (0.25 beats)
    const shortBeat = 0.25; // Quarter note for quick passages
    const normalBeat = 0.5;  // Half note for standard notes
    const longBeat = 2.0;    // Long sustain for melodic notes
    const veryLongBeat = 4.0; // Very long sustain for ambient sections

    // First, detect chord positions (where multiple notes play simultaneously)
    const chordPositions = new Set<number>();
    for (let i = 0; i < section[GuitarGeneratorKeysArray[0]].length; i++) {
      const activeNotesAtPosition = GuitarGeneratorKeysArray.filter(
        instrument => section[instrument][i]
      ).length;
      if (activeNotesAtPosition >= 2) {
        chordPositions.add(i);
      }
    }

    const generateInstrumentDurations = (beatsForNote: (boolean | null)[], instrumentName: GuitarGeneratorKeys) => {
      return beatsForNote.map((beat, index) => {
        if (!beat) return null;

        // Check if this position is part of a chord
        const isChordPosition = chordPositions.has(index);
        if (isChordPosition) {
          // For chord positions, sustain until the next chord or end of section
          let sustainUntil = beatsForNote.length; // Default to end of section

          // Find the next chord position
          for (let i = index + 1; i < beatsForNote.length; i++) {
            if (chordPositions.has(i)) {
              sustainUntil = i;
              break;
            }
          }

          // Calculate duration in beats (each position is 0.25 beats)
          const durationInBeats = (sustainUntil - index) * 0.25;
          return durationInBeats;
        }

        // For non-chord positions (single notes), use the original logic
        // Check if ANY instrument has active beats before or after this position
        const hasAnyNoteBefore = index > 0 && GuitarGeneratorKeysArray.some(
          instrument => section[instrument][index - 1]
        );
        const hasAnyNoteAfter = index < beatsForNote.length - 1 && GuitarGeneratorKeysArray.some(
          instrument => section[instrument][index + 1]
        );
        const isInBusySection = hasAnyNoteBefore || hasAnyNoteAfter;

        // Check if this note is followed by a long gap (indicates sustained note)
        let gapAfter = 0;
        for (let i = index + 1; i < beatsForNote.length; i++) {
          // Check if ANY instrument has a note at position i
          const anyInstrumentActive = GuitarGeneratorKeysArray.some(
            instrument => section[instrument][i]
          );
          if (anyInstrumentActive) break;
          gapAfter++;
        }

        // Determine duration based on context
        if (gapAfter >= 8) {
          return veryLongBeat; // Long sustained note
        } else if (gapAfter >= 4) {
          return longBeat; // Medium sustained note
        } else if (isInBusySection) {
          return shortBeat; // Quick notes when other instruments are busy
        } else {
          return normalBeat; // Standard melodic note
        }
      });
    };

    const durations: Record<string, (number | null)[] | null> =
      Object.fromEntries(
        GuitarGeneratorKeysArray.map(
          (note): [string, (number | null)[] | null] => [
            note,
            generateInstrumentDurations(section[note], note),
          ],
        ),
      );
    return durations;
  },
};

// Random sequence of adjacent notes
const generateRandomNoteSequence = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
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

// Lead guitar pattern: Scale-based melodic runs
const generateMelodicScaleRun = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  // Create a melodic scale run with gaps for musicality
  const scaleNotes = [...GuitarGeneratorKeysArray]; // Use available notes as our "scale"
  let currentNoteIndex = Math.floor(Math.random() * scaleNotes.length);

  // Generate melodic phrases with rests between them
  let position = 0;
  while (position < sectionLength) {
    // Phrase length: 3-8 notes
    const phraseLength = Math.floor(Math.random() * 6) + 3;
    const actualPhraseLength = Math.min(phraseLength, sectionLength - position);

    // Generate phrase
    for (let i = 0; i < actualPhraseLength; i++) {
      const note = scaleNotes[currentNoteIndex];
      section[note][position] = true;

      // Move melodically (mostly stepwise motion)
      const direction = Math.random() > 0.5 ? 1 : -1;
      const stepSize = Math.random() > 0.7 ? 2 : 1; // Mostly steps, some leaps
      currentNoteIndex = Math.max(0, Math.min(scaleNotes.length - 1,
        currentNoteIndex + (direction * stepSize)));

      position += Math.random() > 0.3 ? 1 : 2; // Some notes get extra space
    }

    // Rest between phrases (2-6 beats)
    const restLength = Math.floor(Math.random() * 5) + 2;
    position += restLength;
  }

  return section;
};

// Lead guitar pattern: Arpeggiated chord progressions
const generateArpeggioPattern = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  // Define chord shapes using available notes
  const chordProgressions = [
    ['F1', 'ASharp4', 'CSharp4'], // F major-ish
    ['CSharp4', 'F4', 'GSharp4'], // C# major-ish
    ['G4', 'C4', 'F4'], // G minor-ish
    ['ASharp4', 'CSharp4', 'F1'], // Bb major-ish
  ];

  let position = 0;
  let chordIndex = 0;

  while (position < sectionLength) {
    const currentChord = chordProgressions[chordIndex % chordProgressions.length];
    const arpeggioLength = Math.min(8, sectionLength - position); // 8 beats per chord max

    // Arpeggiate the chord
    for (let i = 0; i < arpeggioLength && position < sectionLength; i++) {
      const noteIndex = i % currentChord.length;
      const note = currentChord[noteIndex] as GuitarGeneratorKeys;

      if (GuitarGeneratorKeysArray.includes(note)) {
        section[note][position] = true;
      }

      position += Math.random() > 0.2 ? 2 : 3; // Varied spacing
    }

    chordIndex++;
  }

  return section;
};

// Lead guitar pattern: Pentatonic licks and bends
const generatePentatonicLicks = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  // Use higher notes for lead lines
  const leadNotes = ['CSharp4', 'C4', 'ASharp4', 'GSharp4', 'G4', 'F4'].filter(note =>
    GuitarGeneratorKeysArray.includes(note as GuitarGeneratorKeys)
  ) as GuitarGeneratorKeys[];

  let position = 0;

  while (position < sectionLength) {
    // Generate short pentatonic licks
    const lickLength = Math.floor(Math.random() * 4) + 2; // 2-5 notes
    const startNote = Math.floor(Math.random() * leadNotes.length);

    for (let i = 0; i < lickLength && position < sectionLength; i++) {
      const noteIndex = (startNote + i) % leadNotes.length;
      const note = leadNotes[noteIndex];
      section[note][position] = true;
      position++;
    }

    // Rest between licks
    position += Math.floor(Math.random() * 6) + 2;
  }

  return section;
};

// Lead guitar pattern: Sustained single notes with vibrato effect
const generateSustainedMelody = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  // Focus on longer, sustained notes
  let position = 0;

  while (position < sectionLength) {
    // Pick a note to sustain
    const note = GuitarGeneratorKeysArray[Math.floor(Math.random() * GuitarGeneratorKeysArray.length)];
    section[note][position] = true;

    // Sustain for 4-12 beats
    const sustainLength = Math.floor(Math.random() * 9) + 4;
    position += Math.min(sustainLength, sectionLength - position);

    // Small gap before next note
    position += Math.floor(Math.random() * 3) + 1;
  }

  return section;
};

// Lead guitar pattern: Technical runs and sweeps
const generateTechnicalRuns = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  let position = 0;

  while (position < sectionLength) {
    // Fast technical run
    const runLength = Math.floor(Math.random() * 8) + 4;
    const direction = Math.random() > 0.5 ? 1 : -1; // Up or down
    let noteIndex = direction > 0 ? 0 : GuitarGeneratorKeysArray.length - 1;

    for (let i = 0; i < runLength && position < sectionLength; i++) {
      const note = GuitarGeneratorKeysArray[noteIndex];
      section[note][position] = true;

      noteIndex = Math.max(0, Math.min(GuitarGeneratorKeysArray.length - 1,
        noteIndex + direction));
      position++;
    }

    // Longer rest after technical runs
    position += Math.floor(Math.random() * 8) + 4;
  }

  return section;
};

// Lead guitar pattern: Ambient/atmospheric swells
const generateAmbientSwells = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  // Very sparse, atmospheric pattern
  const positions = [];
  for (let i = 0; i < sectionLength; i += Math.floor(Math.random() * 8) + 4) {
    positions.push(i);
  }

  positions.forEach(pos => {
    const note = GuitarGeneratorKeysArray[Math.floor(Math.random() * GuitarGeneratorKeysArray.length)];
    if (pos < sectionLength) {
      section[note][pos] = true;
    }
  });

  return section;
};

// Lead guitar pattern: Progressive metal chords (multiple notes simultaneously)
const generateProgressiveChords = (sectionLength: number) => {
  const section = Object.fromEntries(
    GuitarGeneratorKeysArray.map((instrument) => [
      instrument,
      Array(sectionLength).fill(false),
    ]),
  ) as Activations<GuitarGeneratorKeys>;

  // Define progressive metal chord voicings using available notes
  const progressiveChordProgressions = [
    // Progression 1: Minor/Dark progression
    [
      ['F4', 'ASharp4', 'CSharp4'], // F minor add9
      ['GSharp4', 'C4', 'F4'], // Ab major
      ['G4', 'ASharp4', 'CSharp4'], // G minor sus2
      ['F4', 'G4', 'C4'], // F sus2
    ],
    // Progression 2: Suspended/Open voicings
    [
      ['CSharp4', 'F4', 'ASharp4'], // C# sus4
      ['C4', 'F4', 'G4'], // C sus4
      ['ASharp4', 'CSharp4', 'GSharp4'], // Bb add2
      ['G4', 'C4', 'F4'], // G sus4
    ],
    // Progression 3: Power chord variations
    [
      ['F4', 'C4'], // F5 power chord
      ['G4', 'CSharp4'], // G5 (with b5)
      ['ASharp4', 'F4'], // Bb5
      ['GSharp4', 'CSharp4'], // Ab5 (with 4th)
    ],
    // Progression 4: Complex extended chords
    [
      ['F4', 'ASharp4', 'C4', 'GSharp4'], // F minor 7
      ['CSharp4', 'G4', 'ASharp4'], // C# dim
      ['G4', 'C4', 'F4', 'ASharp4'], // G minor 7
      ['GSharp4', 'CSharp4', 'F4'], // Ab major
    ],
  ];

  // Progressive metal rhythm patterns (in quarter note beats, 32 beats per bar)
  const rhythmPatterns = [
    [0, 16, 32, 48], // Standard progression - chord every half bar
    [0, 32, 64], // Slow progression - chord every full bar
    [0, 8, 24, 40, 56], // Syncopated pattern - off-beat changes
    [0, 12, 32, 44], // Displaced pattern - unusual timing
    [0, 16, 20, 32, 36, 48], // Complex syncopation with quick changes
    [0, 32], // Very slow - chord every bar
    [0, 8, 16, 24, 32, 40, 48, 56], // Rapid changes for breakdown sections
    [0, 24, 48, 72], // 3/4 feel within 4/4
    [0, 14, 32, 46], // 7/8 pattern across bars
    [0, 16, 48, 64, 80], // Long sustains with quick changes
  ];

  // Choose random progression and rhythm pattern
  const chosenProgression = progressiveChordProgressions[
    Math.floor(Math.random() * progressiveChordProgressions.length)
  ];
  const chosenRhythm = rhythmPatterns[
    Math.floor(Math.random() * rhythmPatterns.length)
  ];

  let chordIndex = 0;
  let rhythmIndex = 0;

  // Apply the rhythm pattern across the section
  while (rhythmIndex < chosenRhythm.length) {
    const position = chosenRhythm[rhythmIndex];

    if (position >= sectionLength) break;

    // Get current chord from progression
    const currentChord = chosenProgression[chordIndex % chosenProgression.length];

    // Activate all notes in the chord simultaneously
    currentChord.forEach(note => {
      if (GuitarGeneratorKeysArray.includes(note as GuitarGeneratorKeys)) {
        section[note as GuitarGeneratorKeys][position] = true;
      }
    });

    // Sometimes add chord variations (inversions or note omissions)
    if (Math.random() < 0.3 && currentChord.length > 2) {
      // Occasionally skip the middle note for a more open sound
      const noteToSkip = currentChord[1] as GuitarGeneratorKeys;
      if (GuitarGeneratorKeysArray.includes(noteToSkip)) {
        section[noteToSkip][position] = false;
      }
    }

    chordIndex++;
    rhythmIndex++;
  }

  // Add some fills between chord hits for more progressive feel
  // TODO - Implement this
  if (Math.random() < 0) {
    for (let i = 1; i < sectionLength; i += 4) {
      if (!GuitarGeneratorKeysArray.some(note => section[note][i])) {
        // Add a single note fill
        const fillNote = GuitarGeneratorKeysArray[
          Math.floor(Math.random() * GuitarGeneratorKeysArray.length)
        ];
        section[fillNote][i] = true;
      }
    }
  }

  return section;
};
