import { NoteName, IndianSwara, ScaleDefinition, RhythmPattern, AlankarExercise, SongSheet } from '../types';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const INDIAN_SWARAS_ORDERED: IndianSwara[] = [
  'সা',
  'রে (কোমল)',
  'রে',
  'গা (কোমল)',
  'গা',
  'মা',
  'মা (কড়ি)',
  'পা',
  'ধা (কোমল)',
  'ধা',
  'নি (কোমল)',
  'নি',
];

export const ROOT_KEYS: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440);
}

export function getNoteFromMidi(midi: number): { note: NoteName; octave: number; cents: number } {
  const roundedMidi = Math.round(midi);
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const cents = Math.round((midi - roundedMidi) * 100);
  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
  };
}

export function getIndianSwara(note: NoteName, rootKey: NoteName): IndianSwara {
  const rootIndex = NOTE_NAMES.indexOf(rootKey);
  const noteIndex = NOTE_NAMES.indexOf(note);
  const interval = (noteIndex - rootIndex + 12) % 12;
  return INDIAN_SWARAS_ORDERED[interval];
}

export const SCALES: ScaleDefinition[] = [
  {
    id: 'bilawal',
    name: 'Bilawal / Major Scale',
    bengaliName: 'বিলাবল ঠাট (শুদ্ধ স্বর / মেজর স্কেল)',
    type: 'raag',
    semitones: [0, 2, 4, 5, 7, 9, 11],
    swaras: ['সা', 'রে', 'গা', 'মা', 'পা', 'ধা', 'নি'],
    description: 'সমস্ত স্বর শুদ্ধ। সকালের গান ও উজ্জ্বল আনন্দদায়ক সুরের মূল ভিত্তি।',
    vadi: 'ধা',
    samvadi: 'গা',
    timeOfDay: 'সকাল (প্রথম প্রহর)',
  },
  {
    id: 'yaman',
    name: 'Raag Yaman / Kalyan',
    bengaliName: 'রাগ ইমন / কল্যাণ (তীব্র মা)',
    type: 'raag',
    semitones: [0, 2, 4, 6, 7, 9, 11],
    swaras: ['সা', 'রে', 'গা', 'মা (কড়ি)', 'পা', 'ধা', 'নি'],
    description: 'কড়ি/তীব্র মা সহ শান্ত ও গভীর ভক্তিমূলক সন্ধ্যারাগ। রাগসঙ্গীতের শ্রেষ্ঠ ভিত্তি।',
    vadi: 'গা',
    samvadi: 'নি',
    timeOfDay: 'সন্ধ্যা (প্রথম প্রহর)',
  },
  {
    id: 'bhairav',
    name: 'Raag Bhairav',
    bengaliName: 'রাগ ভৈরব (কোমল রে ও কোমল ধা)',
    type: 'raag',
    semitones: [0, 1, 4, 5, 7, 8, 11],
    swaras: ['সা', 'রে (কোমল)', 'গা', 'মা', 'পা', 'ধা (কোমল)', 'নি'],
    description: 'প্রভাতের গম্ভীর ও ভক্তিমূলক রাগ। সাধনার জন্য সবচেয়ে উপযুক্ত।',
    vadi: 'ধা (কোমল)',
    samvadi: 'রে (কোমল)',
    timeOfDay: 'ভোর / সূর্যোদয়',
  },
  {
    id: 'kafi',
    name: 'Raag Kafi / Dorian',
    bengaliName: 'রাগ কাফি (কোমল গা ও কোমল নি)',
    type: 'raag',
    semitones: [0, 2, 3, 5, 7, 9, 10],
    swaras: ['সা', 'রে', 'গা (কোমল)', 'মা', 'পা', 'ধা', 'নি (কোমল)'],
    description: 'বসন্ত, হোলি ও লোকসঙ্গীতের প্রধান সুরেলা মেলোডি।',
    vadi: 'পা',
    samvadi: 'সা',
    timeOfDay: 'মধ্যরাত / বসন্তকাল',
  },
  {
    id: 'bhairavi',
    name: 'Raag Bhairavi',
    bengaliName: 'রাগ ভৈরবী (সব কোমল স্বর)',
    type: 'raag',
    semitones: [0, 1, 3, 5, 7, 8, 10],
    swaras: ['সা', 'রে (কোমল)', 'গা (কোমল)', 'মা', 'পা', 'ধা (কোমল)', 'নি (কোমল)'],
    description: 'সঙ্গীত আসরের সমাপনী রাগ। হৃদয়স্পর্শী ও গভীর আবেগপূর্ণ।',
    vadi: 'মা',
    samvadi: 'সা',
    timeOfDay: 'সর্বকালিক / আসরের শেষ',
  },
  {
    id: 'asavari',
    name: 'Asavari / Natural Minor',
    bengaliName: 'আশাবরী ঠাট (ন্যাচারাল মাইনর)',
    type: 'raag',
    semitones: [0, 2, 3, 5, 7, 8, 10],
    swaras: ['সা', 'রে', 'গা (কোমল)', 'মা', 'পা', 'ধা (কোমল)', 'নি (কোমল)'],
    description: 'বিষাদ ও করুণ রসের গভীর সুর, মডার্ন পপ ও মেলোডি গানের প্রিয় স্কেল।',
    vadi: 'ধা (কোমল)',
    samvadi: 'গা (কোমল)',
    timeOfDay: 'সকালের দ্বিতীয় প্রহর',
  },
  {
    id: 'khamaj',
    name: 'Raag Khamaj / Mixolydian',
    bengaliName: 'খাম্বাজ ঠাট (কোমল নি)',
    type: 'raag',
    semitones: [0, 2, 4, 5, 7, 9, 10],
    swaras: ['সা', 'রে', 'গা', 'মা', 'পা', 'ধা', 'নি (কোমল)'],
    description: 'রবীন্দ্রসঙ্গীত, আধুনিক বাংলা গান ও ঠুংরির অন্যতম জনপ্রিয় ভিত্তি।',
    vadi: 'গা',
    samvadi: 'নি',
    timeOfDay: 'রাত্রির দ্বিতীয় প্রহর',
  },
  {
    id: 'chromatic',
    name: 'Chromatic (All 12 Notes)',
    bengaliName: 'ক্রোমাটিক (১২টি স্বরই অনুমোদিত)',
    type: 'western',
    semitones: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    swaras: ['সা', 'রে(কো)', 'রে', 'গা(কো)', 'গা', 'মা', 'মা(ক)', 'পা', 'ধা(কো)', 'ধা', 'নি(কো)', 'নি'],
    description: 'কোনো নির্দিষ্ট স্বর বাধা নেই, যেকোনো স্বর স্বয়ংক্রিয়ভাবে নিকটবর্তী সেমিটোনে অটো-টিউন হবে।',
  },
];

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    id: 'keharwa',
    name: 'Keharwa (8 Matra)',
    bengaliName: 'কাহারবা তাল (৮ মাত্রা: ৪/৪)',
    timeSignature: '4/4',
    matras: 8,
    bpm: 96,
    pattern: [
      { beat: 0, type: 'dha', accent: true },
      { beat: 1, type: 'ge', type2: 'kick' } as any,
      { beat: 2, type: 'na', type2: 'hihat' } as any,
      { beat: 3, type: 'ti', type2: 'snare' } as any,
      { beat: 4, type: 'na', type2: 'kick', accent: true } as any,
      { beat: 5, type: 'ka', type2: 'hihat' } as any,
      { beat: 6, type: 'dhi', type2: 'dhin' } as any,
      { beat: 7, type: 'na', type2: 'snare' } as any,
    ],
  },
  {
    id: 'dadra',
    name: 'Dadra (6 Matra)',
    bengaliName: 'দাদরা তাল (৬ মাত্রা: ৩/৪ বা ৬/৮)',
    timeSignature: '6/8',
    matras: 6,
    bpm: 110,
    pattern: [
      { beat: 0, type: 'dha', accent: true },
      { beat: 1, type: 'dhi' },
      { beat: 2, type: 'na' },
      { beat: 3, type: 'dha', accent: true },
      { beat: 4, type: 'ti' },
      { beat: 5, type: 'na' },
    ],
  },
  {
    id: 'roopak',
    name: 'Roopak (7 Matra)',
    bengaliName: 'রূপক তাল (৭ মাত্রা: ৩+২+২)',
    timeSignature: '7/8',
    matras: 7,
    bpm: 88,
    pattern: [
      { beat: 0, type: 'tin', accent: true },
      { beat: 1, type: 'tin' },
      { beat: 2, type: 'na' },
      { beat: 3, type: 'dhin', accent: true },
      { beat: 4, type: 'na' },
      { beat: 5, type: 'dhin' },
      { beat: 6, type: 'na' },
    ],
  },
  {
    id: 'pop_groove',
    name: 'Acoustic Pop (4/4)',
    bengaliName: 'একোস্টিক পপ ও ফোক ড্রামস (৪/৪)',
    timeSignature: '4/4',
    matras: 8,
    bpm: 104,
    pattern: [
      { beat: 0, type: 'kick', accent: true },
      { beat: 1, type: 'hihat' },
      { beat: 2, type: 'snare', accent: true },
      { beat: 3, type: 'hihat' },
      { beat: 4, type: 'kick' },
      { beat: 5, type: 'kick' },
      { beat: 6, type: 'snare', accent: true },
      { beat: 7, type: 'hihat' },
    ],
  },
];

export const ALANKAR_EXERCISES: AlankarExercise[] = [
  {
    id: 'alankar_1',
    title: 'Arohana & Avarohana (সপ্তক সাধনা)',
    bengaliTitle: '১. শুদ্ধ স্বর আরোহণ ও অবরোহণ',
    notes: ['সা', 'রে', 'গা', 'মা', 'পা', 'ধা', 'নি', 'র্সা', 'র্সা', 'নি', 'ধা', 'পা', 'মা', 'গা', 'রে', 'সা'],
    westernNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C5', 'C5', 'B', 'A', 'G', 'F', 'E', 'D', 'C'],
    difficulty: 'beginner',
    description: 'কণ্ঠের সুর স্থায়িত্ব ও সঠিক স্কেল চেনার জন্য প্রাথমিক অলংকার। হারমোনিয়ামের সাথে প্রতিটি স্বর টেনে গাও।',
  },
  {
    id: 'alankar_2',
    title: 'Dual Note Movement (দ্বিস্বর রূপ)',
    bengaliTitle: '২. জোড়া স্বর সাধনা (সা-সা, রে-রে)',
    notes: ['সা-সা', 'রে-রে', 'গা-গা', 'মা-মা', 'পা-পা', 'ধা-ধা', 'নি-নি', 'র্সা-র্সা'],
    westernNotes: ['C C', 'D D', 'E E', 'F F', 'G G', 'A A', 'B B', 'C5 C5'],
    difficulty: 'beginner',
    description: 'প্রতিটি স্বর দুইবার উচ্চারণ করে কণ্ঠের গতি ও স্পষ্টতা বৃদ্ধি করুন।',
  },
  {
    id: 'alankar_3',
    title: 'Triad Wave (ত্রিস্বর অলংকার)',
    bengaliTitle: '৩. ত্রিস্বর তরঙ্গ (সা-রে-গা, রে-গা-মা)',
    notes: ['সা-রে-গা', 'রে-গা-মা', 'গা-মা-পা', 'মা-পা-ধা', 'পা-ধা-নি', 'ধা-নি-র্সা'],
    westernNotes: ['C D E', 'D E F', 'E F G', 'F G A', 'G A B', 'A B C5'],
    difficulty: 'intermediate',
    description: 'সুরের আরোহণ গতি বৃদ্ধির জন্য অত্যন্ত কার্যকর রেওয়াজ অনুশীলন।',
  },
  {
    id: 'alankar_4',
    title: 'Skipping Intervallics (স্বর বিরতি সাধনা)',
    bengaliTitle: '৪. উল্লম্ফন অলংকার (সা-গা, রে-মা)',
    notes: ['সা-গা', 'রে-মা', 'গা-পা', 'মা-ধা', 'পা-নি', 'ধা-র্সা'],
    westernNotes: ['C E', 'D F', 'E G', 'F A', 'G B', 'A C5'],
    difficulty: 'advanced',
    description: 'সুর লক্ষ্যভেদের ক্ষিপ্রতা ও পিচ একিউরেসি পরীক্ষার শ্রেষ্ঠ রেওয়াজ।',
  },
];

export const PRESET_SONGS: SongSheet[] = [
  {
    id: 'song_1',
    title: 'আমার পরান যাহা চায়',
    artist: 'রবীন্দ্রনাথ ঠাকুর',
    category: 'rabindra',
    rootKey: 'C',
    taal: 'কাহারবা (৪/৪)',
    suggestedBpm: 84,
    chords: ['C', 'G', 'F', 'Am', 'Em'],
    lines: [
      {
        lyrics: 'আমার পরান যাহা চায় তুমি তাই, তুমি তাই গো',
        swaralipi: 'সা গা পা ধা | পা মা গা রে | গা মা গা রে সা',
        chords: 'C - - - | F - G - | C - - -',
      },
      {
        lyrics: 'তোমা ছাড়া আর এ জগতে মোর কেহ নাই কিছু নাই গো',
        swaralipi: 'পা ধা র্সা নি ধা | পা মা গা রে | গা মা পা মা গা',
        chords: 'Am - Em - | F - G - | C - - -',
      },
      {
        lyrics: 'তুমি সুখ যদি নাহি পাও, যাও সুখের সন্ধানে যাও',
        swaralipi: 'র্সা র্সা নি ধা পা | মা গা পা | ধা নি র্সা',
        chords: 'C - Am - | F - - - | G - C -',
      },
    ],
  },
  {
    id: 'song_2',
    title: 'তুমি যাকে ভালোবাসো',
    artist: 'অনুপম রায় / ইমন চক্রবর্তী',
    category: 'modern',
    rootKey: 'D',
    taal: 'কাহারবা (৪/৪)',
    suggestedBpm: 88,
    chords: ['D', 'G', 'A', 'Bm', 'F#m'],
    lines: [
      {
        lyrics: 'তুমি যাকে ভালোবাসো স্নানের ঘরে বাষ্প ভাসো',
        swaralipi: 'সা রে গা রে সা - | রে গা মা গা রে -',
        chords: 'D - - - | G - - -',
      },
      {
        lyrics: 'তার কপালে আঁকিবুকি অন্য কারো ছাঁদ',
        swaralipi: 'গা মা পা মা গা রে | সা রে গা রে সা',
        chords: 'A - - - | D - - -',
      },
      {
        lyrics: 'ঘুম ভাঙলে তুমি দেখো আকাশ জুড়ে মেঘের চাদর',
        swaralipi: 'পা পা ধা পা মা গা | মা মা পা মা গা রে',
        chords: 'Bm - F#m - | G - A -',
      },
    ],
  },
  {
    id: 'song_3',
    title: 'মাঝি বাইয়া যাও রে',
    artist: 'নির্মলেন্দু চৌধুরী (পল্লীগীতি / লোকগান)',
    category: 'folk',
    rootKey: 'C',
    taal: 'দাদরা (৬/৮)',
    suggestedBpm: 116,
    chords: ['C', 'F', 'G'],
    lines: [
      {
        lyrics: 'মাঝি বাইয়া যাও রে অকূল দরিয়ার মাঝে',
        swaralipi: 'পা - পা | ধা পা মা | গা - পা | মা গা রে সা',
        chords: 'C - - | F - - | C - - | G - C',
      },
      {
        lyrics: 'ওরে বন্ধু নাই মোর সাথী নাই রে',
        swaralipi: 'সা রে গা | মা পা ধা | পা - মা | গা - -',
        chords: 'C - - | F - - | G - - | C - -',
      },
    ],
  },
  {
    id: 'song_4',
    title: 'ধনধান্য পুষ্পভরা আমাদের এই বসুন্ধরা',
    artist: 'দ্বিজেন্দ্রলাল রায়',
    category: 'classical',
    rootKey: 'C',
    taal: 'কাহারবা (৪/৪)',
    suggestedBpm: 96,
    chords: ['C', 'G', 'F', 'Am'],
    lines: [
      {
        lyrics: 'ধনধান্য পুষ্পভরা আমাদের এই বসুন্ধরা',
        swaralipi: 'সা সা সা রে | গা গা গা মা | পা পা পা ধা | পা - - -',
        chords: 'C - - - | C - - - | F - G - | C - - -',
      },
      {
        lyrics: 'তাহার মাঝে আছে দেশ এক সকল দেশের সেরা',
        swaralipi: 'পা পা পা ধা | নি নি নি র্সা | র্সা নি ধা পা | মা - - -',
        chords: 'Am - - - | F - - - | G - - - | C - - -',
      },
      {
        lyrics: 'ও সে স্বপ্ন দিয়ে তৈরি সে যে স্মৃতি দিয়ে ঘেরা',
        swaralipi: 'মা মা মা পা | ধা ধা ধা নি | পা পা মা গা | রে সা - -',
        chords: 'F - - - | G - - - | C - G - | C - - -',
      },
    ],
  },
];
