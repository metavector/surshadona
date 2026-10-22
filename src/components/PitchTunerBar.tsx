import React from 'react';
import { Volume2, Sliders, Music, Zap } from 'lucide-react';
import { NoteName, AutoTuneMode, ScaleDefinition, DetectedPitchInfo } from '../types';
import { ROOT_KEYS, SCALES } from '../audio/musicalScales';

interface PitchTunerBarProps {
  pitchInfo: DetectedPitchInfo | null;
  isMicActive: boolean;
  rootKey: NoteName;
  onRootKeyChange: (key: NoteName) => void;
  currentScale: ScaleDefinition;
  onScaleChange: (scale: ScaleDefinition) => void;
  autoTuneMode: AutoTuneMode;
  onAutoTuneModeChange: (mode: AutoTuneMode) => void;
}

export const PitchTunerBar: React.FC<PitchTunerBarProps> = ({
  pitchInfo,
  isMicActive,
  rootKey,
  onRootKeyChange,
  currentScale,
  onScaleChange,
  autoTuneMode,
  onAutoTuneModeChange,
}) => {
  const cents = pitchInfo ? pitchInfo.cents : 0;
  // Convert -50 to +50 cents to 0% to 100% position on gauge
  const needlePositionPercent = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));

  const isPerfectPitch = pitchInfo && Math.abs(cents) <= 8;
  const isSharp = pitchInfo && cents > 8;
  const isFlat = pitchInfo && cents < -8;

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Live Pitch, Swara and Note Gauge */}
        <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start gap-4">
          {/* Note & Swara Display Box */}
          <div className="flex items-center gap-3">
            <div
              className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center border transition-all ${
                isMicActive && pitchInfo
                  ? isPerfectPitch
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-400'
                    : 'bg-amber-950/40 border-amber-600/60 text-amber-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500'
              }`}
            >
              <span className="text-xl font-bold font-mono tracking-tighter leading-none">
                {pitchInfo ? `${pitchInfo.note}${pitchInfo.octave}` : '--'}
              </span>
              <span className="text-xs font-semibold mt-1">
                {pitchInfo ? pitchInfo.swara : 'সুর'}
              </span>
            </div>

            {/* Pitch Gauge Needle */}
            <div className="flex flex-col gap-1 w-44 sm:w-56">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>-50¢ কোমল</span>
                <span className={`font-semibold ${isPerfectPitch ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {pitchInfo ? `${cents > 0 ? '+' : ''}${cents}¢` : '0¢ নিখুঁত'}
                </span>
                <span>+50¢ তীব্র</span>
              </div>

              {/* Gauge Bar */}
              <div className="relative h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                {/* Center perfect tick */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500/60 z-10 -translate-x-1/2" />
                {/* Moving Indicator */}
                {pitchInfo && (
                  <div
                    className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75 -translate-x-1/2 shadow-sm ${
                      isPerfectPitch
                        ? 'bg-emerald-400 shadow-emerald-500/50'
                        : isSharp
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ left: `${needlePositionPercent}%` }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <span>
                  {pitchInfo ? `${Math.round(pitchInfo.frequency)} Hz` : 'মাইক চালু করুন'}
                </span>
                <span>
                  {isPerfectPitch
                    ? 'নিখুঁত সুর'
                    : isSharp
                    ? 'সামান্য চড়া'
                    : isFlat
                    ? 'সামান্য নামা'
                    : 'রেডি'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right: Scale, Key & Auto-Tune Controls */}
        <div className="w-full lg:w-auto flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4">
          {/* Root Key Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-md border border-neutral-800 text-xs">
            <span className="text-neutral-500 px-2 font-medium">মূল সুর:</span>
            <select
              value={rootKey}
              onChange={(e) => onRootKeyChange(e.target.value as NoteName)}
              className="bg-neutral-900 text-amber-300 font-semibold px-2.5 py-1 rounded border border-neutral-700/60 focus:outline-none cursor-pointer"
            >
              {ROOT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k} স্কেল
                </option>
              ))}
            </select>
          </div>

          {/* Raag / Scale Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-md border border-neutral-800 text-xs">
            <span className="text-neutral-500 px-2 font-medium">ঠাট / রাগ:</span>
            <select
              value={currentScale.id}
              onChange={(e) => {
                const s = SCALES.find((sc) => sc.id === e.target.value);
                if (s) onScaleChange(s);
              }}
              className="bg-neutral-900 text-neutral-100 font-medium px-2.5 py-1 rounded border border-neutral-700/60 focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              {SCALES.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.bengaliName}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Tune Intensity Selector */}
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-md border border-neutral-800 text-xs">
            <div className="flex items-center gap-1 px-2 text-neutral-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>অটো-টিউন:</span>
            </div>
            {(
              [
                { id: 'off', label: 'বন্ধ' },
                { id: 'subtle', label: 'ন্যাচারাল' },
                { id: 'studio', label: 'স্টুডিও' },
                { id: 'hard', label: 'হার্ড' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                onClick={() => onAutoTuneModeChange(mode.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  autoTuneMode === mode.id
                    ? 'bg-amber-600 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
