export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F'
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type IndianSwara =
  | 'সা' // Sa (C)
  | 'রে (কোমল)' // Komal Re (C#)
  | 'রে' // Shuddha Re (D)
  | 'গা (কোমল)' // Komal Ga (D#)
  | 'গা' // Shuddha Ga (E)
  | 'মা' // Shuddha Ma (F)
  | 'মা (কড়ি)' // Tivra Ma (F#)
  | 'পা' // Pa (G)
  | 'ধা (কোমল)' // Komal Dha (G#)
  | 'ধা' // Shuddha Dha (A)
  | 'নি (কোমল)' // Komal Ni (A#)
  | 'নি'; // Shuddha Ni (B)

export type AutoTuneMode = 'off' | 'subtle' | 'studio' | 'hard';

export interface ScaleDefinition {
  id: string;
  name: string;
  bengaliName: string;
  type: 'western' | 'raag';
  semitones: number[]; // semitone offsets from root (e.g. [0, 2, 4, 5, 7, 9, 11] for Major/Bilawal)
  swaras: string[];
  description: string;
  vadi?: string;
  samvadi?: string;
  timeOfDay?: string;
}

export interface DetectedPitchInfo {
  frequency: number;
  note: NoteName;
  octave: number;
  midi: number;
  cents: number; // -50 to +50
  swara: IndianSwara;
  clarity: number; // 0 to 1
  targetMidi: number;
  targetFreq: number;
  tunedMidi: number;
  tunedNote: NoteName;
  tunedSwara: IndianSwara;
}

export interface RhythmPattern {
  id: string;
  name: string;
  bengaliName: string;
  timeSignature: string;
  matras: number;
  bpm: number;
  pattern: { beat: number; type: 'dha' | 'dhin' | 'tin' | 'ta' | 'kick' | 'snare' | 'hihat' | 'shaker'; accent?: boolean }[];
}

export interface AudioTrackVolumes {
  master: number;
  vocal: number;
  harmonium: number;
  guitar: number;
  rhythm: number;
  reverb: number;
  delay: number;
}

export interface RecordedAudio {
  id: string;
  title: string;
  blob: Blob;
  url: string;
  duration: number;
  createdAt: Date;
  vocalKey: string;
  scaleName: string;
}

export interface AlankarExercise {
  id: string;
  title: string;
  bengaliTitle: string;
  notes: string[]; // ['সা', 'রে', 'গা', 'মা', 'পা', 'ধা', 'নি', 'র্সা']
  westernNotes: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
}

export interface SongSheet {
  id: string;
  title: string;
  artist: string;
  category: 'rabindra' | 'nazrul' | 'folk' | 'modern' | 'classical';
  rootKey: string;
  taal: string;
  suggestedBpm: number;
  chords: string[];
  lines: {
    lyrics: string;
    swaralipi: string;
    chords: string;
  }[];
}
