export type SectionType =
  | 'intro'
  | 'verse'
  | 'chorus'
  | 'breakdown'
  | 'bridge'
  | 'outro'
  | 'ambient'
  | 'buildup';

export type TimeSignature = {
  numerator: number;
  denominator: number;
};

export type Dynamics = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';

export type SectionTemplate = {
  type: SectionType;
  timeSignature: TimeSignature;
  bpm?: number; // Optional BPM change
  dynamics: Dynamics;
  length: number; // in beats
  characteristics: {
    complexity: number; // 0-1 scale
    density: number; // 0-1 scale
    syncopation: number; // 0-1 scale
    polyrhythm: boolean;
  };
};

export const djentSectionTemplates: Record<SectionType, SectionTemplate[]> = {
  intro: [
    {
      type: 'intro',
      timeSignature: { numerator: 4, denominator: 4 },
      dynamics: 'p',
      length: 32 * 4,
      characteristics: {
        complexity: 0.3,
        density: 0.2,
        syncopation: 0.1,
        polyrhythm: false,
      },
    },
    {
      type: 'intro',
      timeSignature: { numerator: 7, denominator: 8 },
      dynamics: 'mp',
      length: 28 * 4, // 4 bars of 7/8
      characteristics: {
        complexity: 0.5,
        density: 0.4,
        syncopation: 0.3,
        polyrhythm: false,
      },
    },
  ],
  verse: [
    {
      type: 'verse',
      timeSignature: { numerator: 4, denominator: 4 },
      dynamics: 'mf',
      length: 32 * 4,
      characteristics: {
        complexity: 0.6,
        density: 0.5,
        syncopation: 0.7,
        polyrhythm: false,
      },
    },
    {
      type: 'verse',
      timeSignature: { numerator: 5, denominator: 4 },
      dynamics: 'mf',
      length: 40 * 4, // 8 bars of 5/4
      characteristics: {
        complexity: 0.7,
        density: 0.6,
        syncopation: 0.8,
        polyrhythm: true,
      },
    },
  ],
  chorus: [
    {
      type: 'chorus',
      timeSignature: { numerator: 4, denominator: 4 },
      dynamics: 'f',
      length: 32 * 4,
      characteristics: {
        complexity: 0.4,
        density: 0.8,
        syncopation: 0.5,
        polyrhythm: false,
      },
    },
  ],
  breakdown: [
    {
      type: 'breakdown',
      timeSignature: { numerator: 7, denominator: 8 },
      dynamics: 'ff',
      length: 28 * 4,
      characteristics: {
        complexity: 0.9,
        density: 0.7,
        syncopation: 0.9,
        polyrhythm: true,
      },
    },
    {
      type: 'breakdown',
      timeSignature: { numerator: 9, denominator: 8 },
      dynamics: 'ff',
      length: 36 * 4, // 4 bars of 9/8
      characteristics: {
        complexity: 0.8,
        density: 0.6,
        syncopation: 0.8,
        polyrhythm: false,
      },
    },
  ],
  bridge: [
    {
      type: 'bridge',
      timeSignature: { numerator: 6, denominator: 8 },
      dynamics: 'mp',
      length: 24 * 4,
      characteristics: {
        complexity: 0.4,
        density: 0.3,
        syncopation: 0.2,
        polyrhythm: false,
      },
    },
  ],
  outro: [
    {
      type: 'outro',
      timeSignature: { numerator: 4, denominator: 4 },
      dynamics: 'p',
      length: 32 * 4,
      characteristics: {
        complexity: 0.2,
        density: 0.1,
        syncopation: 0.1,
        polyrhythm: false,
      },
    },
  ],
  ambient: [
    {
      type: 'ambient',
      timeSignature: { numerator: 4, denominator: 4 },
      dynamics: 'pp',
      length: 64 * 4,
      characteristics: {
        complexity: 0.1,
        density: 0.05,
        syncopation: 0.0,
        polyrhythm: false,
      },
    },
  ],
  buildup: [
    {
      type: 'buildup',
      timeSignature: { numerator: 4, denominator: 4 },
      dynamics: 'mf',
      length: 16 * 4,
      characteristics: {
        complexity: 0.5,
        density: 0.3,
        syncopation: 0.4,
        polyrhythm: false,
      },
    },
  ],
};

export type SongStructure = SectionTemplate[];

// Common djent song structures
export const djentSongStructures: SongStructure[] = [
  [
    djentSectionTemplates.intro[0],
    djentSectionTemplates.verse[0],
    djentSectionTemplates.chorus[0],
    djentSectionTemplates.verse[1],
    djentSectionTemplates.breakdown[0],
    djentSectionTemplates.chorus[0],
    djentSectionTemplates.outro[0],
  ],
  [
    djentSectionTemplates.ambient[0],
    djentSectionTemplates.buildup[0],
    djentSectionTemplates.verse[0],
    djentSectionTemplates.chorus[0],
    djentSectionTemplates.bridge[0],
    djentSectionTemplates.breakdown[1],
    djentSectionTemplates.verse[1],
    djentSectionTemplates.outro[0],
  ],
];