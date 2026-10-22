import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Award,
  Music,
  Play,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import {
  ALANKAR_EXERCISES,
  SCALES,
  PRESET_SONGS,
  ROOT_KEYS,
  midiToFrequency,
} from '../audio/musicalScales';
import { NoteName, DetectedPitchInfo, AlankarExercise, ScaleDefinition, SongSheet } from '../types';

interface VirtualInstituteProps {
  pitchInfo: DetectedPitchInfo | null;
  rootKey: NoteName;
  onSelectRootKey: (key: NoteName) => void;
  onSelectScale: (scale: ScaleDefinition) => void;
  onOpenAICoachWithSong?: (songName: string) => void;
}

export const VirtualInstitute: React.FC<VirtualInstituteProps> = ({
  pitchInfo,
  rootKey,
  onSelectRootKey,
  onSelectScale,
  onOpenAICoachWithSong,
}) => {
  const engine = AudioEngine.getInstance();
  const [activeTab, setActiveTab] = useState<'riyaz' | 'raags' | 'songs'>('riyaz');
  const [selectedAlankar, setSelectedAlankar] = useState<AlankarExercise>(ALANKAR_EXERCISES[0]);
  const [alankarStep, setAlankarStep] = useState(0);
  const [activeSong, setActiveSong] = useState<SongSheet>(PRESET_SONGS[0]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  // Practice demonstration playback on harmonium
  const playAlankarDemo = async () => {
    await engine.initAudio();
    setIsPlayingDemo(true);
    const rootIdx = ROOT_KEYS.indexOf(rootKey);
    const baseMidi = 60 + rootIdx; // Middle octave

    // Play each note with 450ms gap
    const noteSequence = [0, 2, 4, 5, 7, 9, 11, 12, 12, 11, 9, 7, 5, 4, 2, 0];
    noteSequence.forEach((semitone, i) => {
      setTimeout(() => {
        engine.playHarmoniumNote(baseMidi + semitone, 0.4);
        setAlankarStep(i);
        if (i === noteSequence.length - 1) {
          setTimeout(() => setIsPlayingDemo(false), 500);
        }
      }, i * 450);
    });
  };

  const playRaagDemo = async (scale: ScaleDefinition) => {
    await engine.initAudio();
    const rootIdx = ROOT_KEYS.indexOf(rootKey);
    const baseMidi = 60 + rootIdx;

    scale.semitones.forEach((semi, i) => {
      setTimeout(() => {
        engine.playHarmoniumNote(baseMidi + semi, 0.35);
      }, i * 400);
    });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
      {/* Academy Banner */}
      <div className="relative p-5 sm:p-7 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                ভার্চুয়াল সঙ্গীত ইনস্টিটিউট
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">সা-রে-গা-মা তালিম, রাগ বিশ্বকোষ ও গান ভল্ট</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 mt-1">
              সুরসাধনা সঙ্গীত একাডেমি (Virtual Institute)
            </h2>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('riyaz')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'riyaz'
                  ? 'bg-amber-600 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              স্বর রেওয়াজ
            </button>
            <button
              onClick={() => setActiveTab('raags')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'raags'
                  ? 'bg-amber-600 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              রাগ ও ঠাট
            </button>
            <button
              onClick={() => setActiveTab('songs')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'songs'
                  ? 'bg-amber-600 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              গানের স্বরলিপি
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* TAB 1: RIYAZ ALANKARS */}
        {activeTab === 'riyaz' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Alankar Selector */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-xs text-neutral-400 font-semibold block mb-2">
                  অনুশীলনী নির্বাচন করুন:
                </span>
                {ALANKAR_EXERCISES.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setSelectedAlankar(ex);
                      setAlankarStep(0);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedAlankar.id === ex.id
                        ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="font-semibold text-sm leading-tight">
                      {ex.bengaliTitle}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      {ex.title}
                    </div>
                  </button>
                ))}
              </div>

              {/* Right: Interactive Riyaz Stage with Pitch Feedback */}
              <div className="lg:col-span-8 bg-neutral-950 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800">
                    <div>
                      <h3 className="font-bold text-base text-neutral-100">
                        {selectedAlankar.bengaliTitle}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {selectedAlankar.description}
                      </p>
                    </div>

                    <button
                      onClick={playAlankarDemo}
                      disabled={isPlayingDemo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold text-xs rounded-md border border-neutral-700 transition-colors shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isPlayingDemo ? 'হারমোনিয়ামে বাজছে...' : 'হারমোনিয়াম ডেমো শুনুন'}
                    </button>
                  </div>

                  {/* Note Sequence Flow */}
                  <div className="my-6">
                    <span className="text-xs text-neutral-400 block mb-2 font-medium">
                      ক্রমিক স্বরলিপি (মাইকে এই স্বরগুলো পর্যায়ক্রমে গাও):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedAlankar.notes.map((note, idx) => {
                        const isCurrentPlaying = isPlayingDemo && alankarStep === idx;
                        const isSingingMatch =
                          pitchInfo &&
                          pitchInfo.swara.startsWith(note.charAt(0)) &&
                          Math.abs(pitchInfo.cents) <= 15;

                        return (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-lg border text-center transition-all ${
                              isCurrentPlaying || isSingingMatch
                                ? 'bg-amber-500 border-amber-400 text-neutral-950 font-bold scale-105 shadow-md shadow-amber-500/30'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                            }`}
                          >
                            <div className="text-sm font-bold">{note}</div>
                            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                              {selectedAlankar.westernNotes[idx] || ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Vocal Pitch Live Assessment Callout */}
                <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        pitchInfo ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'
                      }`}
                    />
                    <span className="text-xs text-neutral-300">
                      {pitchInfo ? (
                        <>
                          আপনার স্বর:{' '}
                          <span className="font-bold text-amber-400">
                            {pitchInfo.note} ({pitchInfo.swara})
                          </span>
                          {' · '}
                          {Math.abs(pitchInfo.cents) <= 10 ? (
                            <span className="text-emerald-400 font-semibold">
                              চমৎকার! সুর একদম সঠিক।
                            </span>
                          ) : pitchInfo.cents > 10 ? (
                            <span className="text-amber-400">
                              সামান্য চড়া (+{pitchInfo.cents}¢), একটু নামান
                            </span>
                          ) : (
                            <span className="text-rose-400">
                              সামান্য নামা ({pitchInfo.cents}¢), একটু তুলুন
                            </span>
                          )}
                        </>
                      ) : (
                        'মাইকে গান গেয়ে সুর মিলিয়ে পরীক্ষা করুন'
                      )}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-500">
                    মূল স্কেল: {rootKey}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RAAG ENCYCLOPEDIA */}
        {activeTab === 'raags' && (
          <div className="space-y-4">
            <span className="text-xs text-neutral-400 block mb-2">
              ভারতীয় উচ্চাঙ্গ ও বাংলা গানের প্রধান রাগসমূহ:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCALES.map((scale) => (
                <div
                  key={scale.id}
                  className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-neutral-100">
                          {scale.bengaliName}
                        </h4>
                        <span className="text-xs text-neutral-400">
                          {scale.name}
                        </span>
                      </div>
                      <button
                        onClick={() => playRaagDemo(scale)}
                        className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded border border-neutral-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        আরোহণ শুনুন
                      </button>
                    </div>

                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                      {scale.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {scale.swaras.map((sw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-neutral-900 border border-neutral-800 rounded font-semibold text-neutral-200"
                        >
                          {sw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                    <span>
                      {scale.vadi ? `বাদি: ${scale.vadi} | সম্বাদি: ${scale.samvadi}` : 'ক্রোমাটিক স্কেল'}
                    </span>
                    <button
                      onClick={() => onSelectScale(scale)}
                      className="text-amber-400 font-semibold hover:underline"
                    >
                      স্টুডিওতে স্কেল সেট করুন →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BENGALI SONGS VAULT */}
        {activeTab === 'songs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Song List */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-xs text-neutral-400 font-semibold block mb-2">
                  জনপ্রিয় গানসমূহ:
                </span>
                {PRESET_SONGS.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => setActiveSong(song)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      activeSong.id === song.id
                        ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="font-semibold text-sm leading-tight">
                      {song.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      {song.artist} · তাল: {song.taal}
                    </div>
                  </button>
                ))}
              </div>

              {/* Song Swaralipi Sheet */}
              <div className="lg:col-span-8 bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                  <div>
                    <h3 className="font-bold text-lg text-neutral-100">
                      {activeSong.title}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      শিল্পী/রচয়িতা: {activeSong.artist} · তাল: {activeSong.taal}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectRootKey(activeSong.rootKey as NoteName);
                        engine.startRhythmLoop('keharwa', activeSong.suggestedBpm);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded-md transition-colors"
                    >
                      গানের সাথে সুর মেলান
                    </button>
                    {onOpenAICoachWithSong && (
                      <button
                        onClick={() => onOpenAICoachWithSong(activeSong.title)}
                        className="px-2.5 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-amber-300 text-xs rounded-md border border-neutral-700"
                      >
                        AI গাইড
                      </button>
                    )}
                  </div>
                </div>

                {/* Lyrics & Swaralipi lines */}
                <div className="space-y-4 pt-2">
                  {activeSong.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-900 rounded-lg border border-neutral-800/80 space-y-1.5"
                    >
                      <div className="font-bold text-neutral-100 text-sm">
                        {line.lyrics}
                      </div>
                      <div className="text-xs font-mono text-amber-400 bg-neutral-950 p-1.5 rounded border border-neutral-800">
                        স্বরলিপি: {line.swaralipi}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
                        <span>কর্ড: {line.chords}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
