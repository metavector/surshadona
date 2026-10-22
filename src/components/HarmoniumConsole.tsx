import React, { useState } from 'react';
import { Volume2, Activity, Play, Square, Wind, Music2 } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { NoteName, DetectedPitchInfo } from '../types';
import { NOTE_NAMES, getIndianSwara } from '../audio/musicalScales';

interface HarmoniumConsoleProps {
  pitchInfo: DetectedPitchInfo | null;
  rootKey: NoteName;
  autoAccompaniment: boolean;
  onToggleAutoAccompaniment: (enabled: boolean) => void;
  tanpuraActive: boolean;
  onToggleTanpura: () => void;
}

export const HarmoniumConsole: React.FC<HarmoniumConsoleProps> = ({
  pitchInfo,
  rootKey,
  autoAccompaniment,
  onToggleAutoAccompaniment,
  tanpuraActive,
  onToggleTanpura,
}) => {
  const engine = AudioEngine.getInstance();
  const [pressedMidi, setPressedMidi] = useState<number | null>(null);
  const [bellowsPumping, setBellowsPumping] = useState(false);

  // Generate 2 octaves of keyboard: C3 (MIDI 48) to B4 (MIDI 71) or C5 (MIDI 72)
  const startMidi = 48; // C3
  const endMidi = 72; // C5

  const keys = [];
  for (let m = startMidi; m <= endMidi; m++) {
    const noteIndex = m % 12;
    const noteName = NOTE_NAMES[noteIndex];
    const isBlack = noteName.includes('#');
    const octave = Math.floor(m / 12) - 1;
    const swara = getIndianSwara(noteName, rootKey);

    keys.push({
      midi: m,
      noteName,
      octave,
      isBlack,
      swara,
    });
  }

  const activeMidi = pitchInfo ? pitchInfo.tunedMidi : pressedMidi;

  const handleKeyDown = (midi: number) => {
    engine.initAudio();
    setPressedMidi(midi);
    setBellowsPumping(true);
    engine.playHarmoniumNote(midi);
  };

  const handleKeyUp = (midi: number) => {
    if (pressedMidi === midi) {
      setPressedMidi(null);
    }
    engine.stopHarmoniumNote(midi);
    setTimeout(() => setBellowsPumping(false), 200);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Harmonium Header */}
      <div className="relative p-5 sm:p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                ভার্চুয়াল সুর সংগত
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">খাঁটি পিতলের রিড ও চেম্বার সিন্থেসিস</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-100 mt-1">
              হারমোনিয়াম কনসোল (Harmonium)
            </h2>
          </div>

          {/* Quick Action Switches */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onToggleAutoAccompaniment(!autoAccompaniment)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                autoAccompaniment
                  ? 'bg-amber-600 text-neutral-950 border-amber-500 font-bold'
                  : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ভোকাল ফলোয়ার: {autoAccompaniment ? 'চালু' : 'বন্ধ'}</span>
            </button>

            <button
              onClick={onToggleTanpura}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tanpuraActive
                  ? 'bg-emerald-600 text-neutral-950 border-emerald-500 font-bold'
                  : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>তানপুরা ড্রোন: {tanpuraActive ? 'বাজছে' : 'বন্ধ'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Indicator banner */}
        <div className="mt-4 pt-3 border-t border-neutral-800/70 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">বর্তমান সুর:</span>
            <span className="font-mono text-amber-400 font-bold">
              {pitchInfo ? `${pitchInfo.tunedNote}${pitchInfo.octave} (${pitchInfo.tunedSwara})` : 'কোনো সুর নেই'}
            </span>
            {autoAccompaniment && pitchInfo && (
              <span className="text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                স্বয়ংক্রিয় হারমোনিয়াম বাজছে
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">বায়ুর চাপ (Bellows):</span>
            <div className={`w-16 h-2 rounded-full overflow-hidden bg-neutral-950 border border-neutral-800`}>
              <div
                className={`h-full bg-amber-500 transition-all duration-300 ${
                  bellowsPumping || (pitchInfo && autoAccompaniment) ? 'w-full' : 'w-2'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Teakwood Harmonium Keyboard Stage */}
      <div className="p-4 sm:p-6 bg-neutral-950 flex flex-col items-center select-none">
        {/* Wooden Frame */}
        <div className="w-full max-w-4xl bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 p-3 sm:p-5 rounded-xl border-2 border-amber-800/80 shadow-2xl">
          {/* Brass Nameplate */}
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="h-0.5 flex-1 bg-amber-800/40" />
            <span className="mx-4 px-3 py-0.5 text-[11px] font-mono tracking-widest uppercase text-amber-300/80 bg-neutral-900/60 rounded border border-amber-700/40 shadow-xs">
              SUR-SADHANA · DUAL REED HARMONIUM
            </span>
            <div className="h-0.5 flex-1 bg-amber-800/40" />
          </div>

          {/* Interactive Keyboard Canvas */}
          <div className="relative overflow-x-auto pb-2 flex justify-center">
            <div className="relative flex min-w-[620px] sm:min-w-[760px] h-40 sm:h-48 bg-neutral-950 rounded-lg p-1.5 border border-amber-900/40 shadow-inner">
              {/* White Keys */}
              {keys
                .filter((k) => !k.isBlack)
                .map((key) => {
                  const isCurrentActive = activeMidi === key.midi;
                  return (
                    <button
                      key={key.midi}
                      onMouseDown={() => handleKeyDown(key.midi)}
                      onMouseUp={() => handleKeyUp(key.midi)}
                      onMouseLeave={() => handleKeyUp(key.midi)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleKeyDown(key.midi);
                      }}
                      onTouchEnd={() => handleKeyUp(key.midi)}
                      className={`relative flex-1 h-full rounded-b-md border border-neutral-300 flex flex-col justify-end items-center pb-2 transition-all active:translate-y-1 shadow-md cursor-pointer ${
                        isCurrentActive
                          ? 'bg-amber-300 border-amber-400 shadow-lg shadow-amber-400/40 translate-y-0.5'
                          : 'bg-gradient-to-b from-neutral-100 via-neutral-50 to-neutral-200 hover:from-amber-50 hover:to-neutral-100 text-neutral-800'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-medium text-neutral-500">
                        {key.noteName}
                      </span>
                      <span className={`text-xs font-bold leading-tight ${isCurrentActive ? 'text-amber-900' : 'text-neutral-900'}`}>
                        {key.swara}
                      </span>
                    </button>
                  );
                })}

              {/* Black Keys (Overlayed absolute) */}
              <div className="absolute inset-0 pointer-events-none flex px-1.5">
                {/* We map the white key indices and place black keys where applicable */}
                {(() => {
                  const whiteKeys = keys.filter((k) => !k.isBlack);
                  const totalWhites = whiteKeys.length;
                  const whiteKeyWidthPercent = 100 / totalWhites;

                  return keys
                    .filter((k) => k.isBlack)
                    .map((bKey) => {
                      // find white key index immediately before this black key
                      const prevWhiteIndex = whiteKeys.findIndex((w) => w.midi === bKey.midi - 1);
                      if (prevWhiteIndex === -1) return null;

                      // Place black key right on the seam between prevWhite and nextWhite
                      const leftPercent = (prevWhiteIndex + 1) * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.32;
                      const isCurrentActive = activeMidi === bKey.midi;

                      return (
                        <button
                          key={bKey.midi}
                          onMouseDown={() => handleKeyDown(bKey.midi)}
                          onMouseUp={() => handleKeyUp(bKey.midi)}
                          onMouseLeave={() => handleKeyUp(bKey.midi)}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            handleKeyDown(bKey.midi);
                          }}
                          onTouchEnd={() => handleKeyUp(bKey.midi)}
                          className={`pointer-events-auto absolute top-1.5 h-24 sm:h-28 rounded-b-md border border-neutral-900 flex flex-col justify-end items-center pb-1.5 transition-all shadow-xl cursor-pointer ${
                            isCurrentActive
                              ? 'bg-amber-500 border-amber-400 shadow-amber-500/50 translate-y-0.5 text-neutral-950 font-bold'
                              : 'bg-gradient-to-b from-neutral-800 via-neutral-900 to-black hover:from-neutral-700 text-neutral-300'
                          }`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${whiteKeyWidthPercent * 0.64}%`,
                            zIndex: 20,
                          }}
                        >
                          <span className="text-[9px] font-mono leading-none">
                            {bKey.noteName}
                          </span>
                          <span className="text-[10px] font-semibold mt-0.5">
                            {bKey.swara.replace(/\(.*\)/, '°')}
                          </span>
                        </button>
                      );
                    });
                })()}
              </div>
            </div>
          </div>

          {/* Brass Stops / Pulls */}
          <div className="mt-3 flex items-center justify-center gap-3 sm:gap-6 pt-2 border-t border-amber-900/60">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-300 shadow-sm" />
              <span className="text-[11px] text-amber-200/90 font-medium">মেল রিড (Male Reed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-300 shadow-sm" />
              <span className="text-[11px] text-amber-200/90 font-medium">ফিমেল রিড (Female Reed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-300 shadow-sm" />
              <span className="text-[11px] text-amber-200/90 font-medium">বায়ু চেম্বার (Air Bellows)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
