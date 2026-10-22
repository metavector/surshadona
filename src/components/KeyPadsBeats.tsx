import React, { useState, useEffect } from 'react';
import { Play, Square, Disc, Sliders, Volume2, Sparkles } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { RHYTHM_PATTERNS } from '../audio/musicalScales';

export const KeyPadsBeats: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const [isPlaying, setIsPlaying] = useState(engine.isRhythmPlaying);
  const [bpm, setBpm] = useState(engine.currentBpm);
  const [selectedTaal, setSelectedTaal] = useState('keharwa');
  const [activePad, setActivePad] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsPlaying(engine.isRhythmPlaying);
      setCurrentStep(engine.currentBeatStep);
    }, 60);
    return () => clearInterval(timer);
  }, [engine]);

  const toggleRhythmPlay = () => {
    engine.initAudio();
    if (isPlaying) {
      engine.stopRhythmLoop();
      setIsPlaying(false);
    } else {
      engine.startRhythmLoop(selectedTaal, bpm);
      setIsPlaying(true);
    }
  };

  const handleTaalChange = (taalId: string) => {
    setSelectedTaal(taalId);
    const pattern = RHYTHM_PATTERNS.find((p) => p.id === taalId);
    if (pattern) {
      setBpm(pattern.bpm);
      if (isPlaying) {
        engine.startRhythmLoop(taalId, pattern.bpm);
      }
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    if (isPlaying) {
      engine.startRhythmLoop(selectedTaal, newBpm);
    }
  };

  const triggerPad = (type: string) => {
    engine.initAudio();
    setActivePad(type);
    engine.triggerPadSound(type);
    setTimeout(() => setActivePad(null), 150);
  };

  const pads = [
    { id: 'dha', label: 'তবলা ধা', sub: 'Tabla Dha', color: 'from-amber-600 to-amber-800' },
    { id: 'dhin', label: 'তবলা ধিন', sub: 'Tabla Dhin', color: 'from-amber-500 to-amber-700' },
    { id: 'tin', label: 'তবলা তিন', sub: 'Tabla Tin', color: 'from-amber-700 to-amber-900' },
    { id: 'ta', label: 'তবলা তা', sub: 'Tabla Ta (চাটি)', color: 'from-amber-800 to-neutral-900' },
    { id: 'kick', label: 'বেস কিক', sub: '808 Kick', color: 'from-orange-600 to-red-800' },
    { id: 'snare', label: 'একোস্টিক স্নিয়ার', sub: 'Snare', color: 'from-blue-600 to-indigo-800' },
    { id: 'hihat', label: 'হাই-হ্যাট', sub: 'Hi-Hat', color: 'from-emerald-600 to-teal-800' },
    { id: 'pad', label: 'ড্রিম সিন্থ প্যাড', sub: 'Ambient Pad', color: 'from-purple-600 to-indigo-900' },
  ];

  const currentPatternObj = RHYTHM_PATTERNS.find((p) => p.id === selectedTaal);
  const totalMatras = currentPatternObj ? currentPatternObj.matras : 8;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                কীপ্যাড ও ছন্দ লুপ
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">তবলা বোল, ড্রাম কিট ও সিন্থেসাইজার প্যাড</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-100 mt-1">
              ছন্দ ও তাল প্যাড (Rhythm Pads)
            </h2>
          </div>

          {/* Loop Master Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleRhythmPlay}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-neutral-950'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  তাল থামান
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  তাল চালু করুন
                </>
              )}
            </button>
          </div>
        </div>

        {/* Taal Selector & BPM controls */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 font-medium">তাল নির্বাচন:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              {RHYTHM_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleTaalChange(p.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedTaal === p.id
                      ? 'bg-amber-600 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {p.bengaliName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* BPM Slider */}
          <div className="flex items-center gap-3 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
            <span className="text-neutral-400 font-medium">গতি (BPM):</span>
            <input
              type="range"
              min="60"
              max="160"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-24 sm:w-32 accent-amber-500 cursor-pointer"
            />
            <span className="font-mono text-amber-400 font-bold w-8 text-right">
              {bpm}
            </span>
          </div>
        </div>

        {/* Step Indicator (Matras) */}
        {isPlaying && (
          <div className="mt-3 flex items-center gap-1.5 justify-center">
            {Array.from({ length: totalMatras }).map((_, idx) => {
              const isCurrentMatra = (currentStep % totalMatras) === idx;
              return (
                <div
                  key={idx}
                  className={`flex-1 max-w-[28px] h-1.5 rounded-full transition-all ${
                    isCurrentMatra
                      ? 'bg-amber-400 shadow-sm shadow-amber-400 scale-y-125'
                      : 'bg-neutral-800'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 8 Pads Soundboard Grid */}
      <div className="p-5 sm:p-6 bg-neutral-950">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {pads.map((pad) => {
            const isPressed = activePad === pad.id;
            return (
              <button
                key={pad.id}
                onClick={() => triggerPad(pad.id)}
                className={`relative aspect-[4/3] rounded-xl p-3 sm:p-4 border text-left flex flex-col justify-between transition-all duration-75 active:scale-95 shadow-md cursor-pointer ${
                  isPressed
                    ? 'border-amber-400 shadow-lg shadow-amber-400/30 scale-[0.98] bg-amber-500 text-neutral-950'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:bg-neutral-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isPressed ? 'bg-neutral-950' : 'bg-amber-500/80'
                    }`}
                  />
                  <span className={`text-[10px] font-mono ${isPressed ? 'text-neutral-900' : 'text-neutral-500'}`}>
                    PAD
                  </span>
                </div>
                <div>
                  <div className={`font-bold text-sm sm:text-base leading-tight ${isPressed ? 'text-neutral-950 font-extrabold' : 'text-neutral-100'}`}>
                    {pad.label}
                  </div>
                  <div className={`text-[11px] font-mono mt-0.5 ${isPressed ? 'text-neutral-900' : 'text-neutral-400'}`}>
                    {pad.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
