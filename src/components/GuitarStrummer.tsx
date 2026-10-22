import React, { useState } from 'react';
import { Music, Play, Disc, ArrowDown, ArrowUp, Activity } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { NoteName, DetectedPitchInfo } from '../types';

interface GuitarStrummerProps {
  pitchInfo: DetectedPitchInfo | null;
  rootKey: NoteName;
  autoAccompanimentGuitar: boolean;
  onToggleAutoGuitar: (enabled: boolean) => void;
}

export const GuitarStrummer: React.FC<GuitarStrummerProps> = ({
  pitchInfo,
  rootKey,
  autoAccompanimentGuitar,
  onToggleAutoGuitar,
}) => {
  const engine = AudioEngine.getInstance();
  const [activeChord, setActiveChord] = useState<string>('C');
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  const [strumDirection, setStrumDirection] = useState<'down' | 'up'>('down');

  // Common chords based around root key
  const commonChords = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'D', 'A', 'E'];

  // Detect chord in real-time if vocal pitch is active
  const detectedChord = engine.getDetectedChordFromVoice();
  const displayedChord = autoAccompanimentGuitar ? detectedChord : activeChord;

  const handleStrum = (chord: string, dir: 'down' | 'up' = 'down') => {
    engine.initAudio();
    setActiveChord(chord);
    setStrumDirection(dir);
    setIsVibrating(true);
    engine.strumGuitarChord(chord, dir);
    setTimeout(() => setIsVibrating(false), 350);
  };

  const handlePluckString = (midi: number) => {
    engine.initAudio();
    engine.playAcousticString(midi);
  };

  // 6 standard acoustic guitar strings (E2, A2, D3, G3, B3, E4)
  const guitarStrings = [
    { label: 'E (খাদ)', midi: 40 },
    { label: 'A', midi: 45 },
    { label: 'D', midi: 50 },
    { label: 'G', midi: 55 },
    { label: 'B', midi: 59 },
    { label: 'E (উচ্চ)', midi: 64 },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
      {/* Guitar Header */}
      <div className="p-5 sm:p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                একোস্টিক গিটার
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">রোজউড সাউন্ডবোর্ড ও কার্প্লাস-স্ট্রং স্ট্রিংস</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-100 mt-1">
              গিটার সংগত ও কর্ড স্ট্রিংগার
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleAutoGuitar(!autoAccompanimentGuitar)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                autoAccompanimentGuitar
                  ? 'bg-amber-600 text-neutral-950 border-amber-500 font-bold'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>স্বয়ংক্রিয় কর্ড সংগত: {autoAccompanimentGuitar ? 'চালু' : 'বন্ধ'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Active Chord Strumming Wheel */}
        <div className="lg:col-span-5 bg-neutral-950 p-5 rounded-xl border border-neutral-800 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-neutral-400 font-medium">বর্তমান কর্ড</span>
          <div className="my-3 text-5xl font-extrabold text-amber-400 font-mono tracking-tight drop-shadow-sm">
            {displayedChord}
          </div>
          <span className="text-xs text-neutral-500 mb-4">
            {autoAccompanimentGuitar
              ? 'ভোকাল সুরে স্বয়ংক্রিয়ভাবে পরিবর্তিত হচ্ছে'
              : 'ম্যানুয়াল স্ট্রাম মোড'}
          </span>

          {/* Quick Strum Actions */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => handleStrum(displayedChord, 'down')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-md"
            >
              <ArrowDown className="w-4 h-4" />
              ডাউন স্ট্রাম
            </button>
            <button
              onClick={() => handleStrum(displayedChord, 'up')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold text-xs rounded-lg transition-transform active:scale-95 border border-neutral-700"
            >
              <ArrowUp className="w-4 h-4" />
              আপ স্ট্রাম
            </button>
          </div>
        </div>

        {/* Right: Guitar Soundhole & Strings Fretboard */}
        <div className="lg:col-span-7 bg-neutral-950 p-5 rounded-xl border border-neutral-800 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">গিটার তার (Strings) - ক্লিক করে সুর শুনুন:</span>
            <span className="text-[11px] text-amber-500">৬টি একোস্টিক স্ট্রিং</span>
          </div>

          {/* Realistic String Representation */}
          <div className="relative bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 p-4 rounded-lg border border-amber-900/50 shadow-inner flex flex-col gap-2.5">
            {guitarStrings.map((string, index) => {
              const thickness = 6 - index; // Thicker strings for lower pitch
              return (
                <button
                  key={string.midi}
                  onClick={() => handlePluckString(string.midi)}
                  className="w-full flex items-center justify-between group py-1 cursor-pointer"
                >
                  <span className="text-[10px] font-mono text-neutral-400 w-16 text-left group-hover:text-amber-300">
                    {string.label}
                  </span>

                  {/* String Line */}
                  <div className="flex-1 mx-3 relative flex items-center">
                    <div
                      className={`w-full rounded-full transition-all duration-75 ${
                        isVibrating
                          ? 'bg-amber-300 shadow-sm shadow-amber-400 translate-y-0.5'
                          : 'bg-neutral-500 group-hover:bg-amber-400/80'
                      }`}
                      style={{ height: `${Math.max(1, thickness * 0.7)}px` }}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-300">
                    প্লাক
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Chord Palette */}
          <div>
            <span className="text-xs text-neutral-400 block mb-2 font-medium">
              কর্ড প্যালেট (দ্রুত পরিবর্তনের জন্য ক্লিক করুন):
            </span>
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
              {commonChords.map((chord) => (
                <button
                  key={chord}
                  onClick={() => handleStrum(chord, 'down')}
                  className={`py-1.5 text-xs font-bold font-mono rounded border transition-colors ${
                    displayedChord === chord
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
