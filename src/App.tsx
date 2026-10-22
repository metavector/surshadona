import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Music,
  Activity,
  Layers,
  GraduationCap,
  Sliders,
  Volume2,
} from 'lucide-react';
import { AudioEngine } from './audio/AudioEngine';
import { NoteName, AutoTuneMode, ScaleDefinition, DetectedPitchInfo } from './types';
import { SCALES, ROOT_KEYS } from './audio/musicalScales';
import { Header } from './components/Header';
import { PitchTunerBar } from './components/PitchTunerBar';
import { HarmoniumConsole } from './components/HarmoniumConsole';
import { GuitarStrummer } from './components/GuitarStrummer';
import { KeyPadsBeats } from './components/KeyPadsBeats';
import { StudioMixerRecorder } from './components/StudioMixerRecorder';
import { VirtualInstitute } from './components/VirtualInstitute';
import { AICoachModal } from './components/AICoachModal';

export default function App() {
  const engine = AudioEngine.getInstance();

  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [pitchInfo, setPitchInfo] = useState<DetectedPitchInfo | null>(null);
  const [rootKey, setRootKey] = useState<NoteName>('C');
  const [currentScale, setCurrentScale] = useState<ScaleDefinition>(SCALES[0]);
  const [autoTuneMode, setAutoTuneMode] = useState<AutoTuneMode>('studio');

  const [autoHarmonium, setAutoHarmonium] = useState<boolean>(true);
  const [autoGuitar, setAutoGuitar] = useState<boolean>(true);
  const [tanpuraActive, setTanpuraActive] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('studio');
  const [isAICoachOpen, setIsAICoachOpen] = useState<boolean>(false);
  const [coachSongQuery, setCoachSongQuery] = useState<string>('');

  // Subscribe to real-time pitch detection updates
  useEffect(() => {
    const unsubscribe = engine.addPitchListener((info) => {
      setPitchInfo(info);
    });
    return () => {
      unsubscribe();
    };
  }, [engine]);

  const handleToggleMic = async () => {
    if (isMicActive) {
      engine.stopMicrophone();
      setIsMicActive(false);
      setPitchInfo(null);
    } else {
      const ok = await engine.startMicrophone();
      if (ok) {
        setIsMicActive(true);
      }
    }
  };

  const handleRootKeyChange = (newKey: NoteName) => {
    setRootKey(newKey);
    engine.setRootKey(newKey);
  };

  const handleScaleChange = (newScale: ScaleDefinition) => {
    setCurrentScale(newScale);
    engine.setScale(newScale);
  };

  const handleAutoTuneModeChange = (newMode: AutoTuneMode) => {
    setAutoTuneMode(newMode);
    engine.setAutoTuneMode(newMode);
  };

  const handleToggleAutoHarmonium = (enabled: boolean) => {
    setAutoHarmonium(enabled);
    engine.setAutoAccompanimentHarmonium(enabled);
  };

  const handleToggleAutoGuitar = (enabled: boolean) => {
    setAutoGuitar(enabled);
    engine.setAutoAccompanimentGuitar(enabled);
  };

  const handleToggleTanpura = () => {
    const nextState = engine.toggleTanpura();
    setTanpuraActive(nextState);
  };

  const handleOpenCoachWithSong = (songName: string) => {
    setCoachSongQuery(`"${songName}" গানের স্বরলিপি ও কর্ড বিস্তারিত বুঝিয়ে দাও`);
    setIsAICoachOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* 3-Zone Header */}
      <Header
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAICoach={() => {
          setCoachSongQuery('');
          setIsAICoachOpen(true);
        }}
      />

      {/* Hero / Studio Spotlight Banner */}
      <div className="relative border-b border-neutral-800 overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src="/src/assets/images/studio_harmonium_guitar_1792633933213.jpg"
            alt="হারমোনিয়াম ও একোস্টিক গিটার স্টুডিও"
            className="w-full h-full object-cover filter blur-[1px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
              <span>সুরসাধনা স্টুডিও</span>
              <span aria-hidden="true">·</span>
              <span>স্বয়ংক্রিয় বাদ্যযন্ত্র সংগত</span>
              <span aria-hidden="true">·</span>
              <span>রিয়েলটাইম অটো-টিউন</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
              আপনি গাইবেন, বাদ্যযন্ত্র বাজবে আপনার সাথে
            </h1>
            <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
              মাইকে গান গাওয়ার সাথে সাথে আপনার কণ্ঠের নিখুঁত পিচ শনাক্ত করে হারমোনিয়াম, একোস্টিক গিটার ও কি-প্যাড স্বয়ংক্রিয়ভাবে সুর ও তাল মেলাবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isMicActive ? (
              <button
                onClick={handleToggleMic}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-sm rounded-lg shadow-lg shadow-amber-950/40 transition-transform active:scale-95 flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                মাইক্রোফোন চালু করুন
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs">
                <span className="text-emerald-400 font-semibold">মাইক চালু আছে</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-300">গান গাওয়ার জন্য প্রস্তুত</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pitch Tuner & Scale Controls Strip */}
      <PitchTunerBar
        pitchInfo={pitchInfo}
        isMicActive={isMicActive}
        rootKey={rootKey}
        onRootKeyChange={handleRootKeyChange}
        currentScale={currentScale}
        onScaleChange={handleScaleChange}
        autoTuneMode={autoTuneMode}
        onAutoTuneModeChange={handleAutoTuneModeChange}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* TAB 1: ALL-IN-ONE STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-8">
            {/* Harmonium Console */}
            <HarmoniumConsole
              pitchInfo={pitchInfo}
              rootKey={rootKey}
              autoAccompaniment={autoHarmonium}
              onToggleAutoAccompaniment={handleToggleAutoHarmonium}
              tanpuraActive={tanpuraActive}
              onToggleTanpura={handleToggleTanpura}
            />

            {/* Split Row: Guitar Strummer + Key Pads & Beats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <GuitarStrummer
                pitchInfo={pitchInfo}
                rootKey={rootKey}
                autoAccompanimentGuitar={autoGuitar}
                onToggleAutoGuitar={handleToggleAutoGuitar}
              />
              <KeyPadsBeats />
            </div>

            {/* Recorder & Studio Mixer */}
            <StudioMixerRecorder
              isMicActive={isMicActive}
              onToggleMic={handleToggleMic}
            />

            {/* Virtual Institute Preview Bar */}
            <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-900/50 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-neutral-100 text-base">
                  সঙ্গীত শিক্ষা ও রেওয়াজ করতে চান?
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  সা-রে-গা-মা অলংকার রেওয়াজ, রাগ পরিচিতি ও বিখ্যাত বাংলা গানের স্বরলিপি দেখতে একাডেমি ট্যাবে যান।
                </p>
              </div>
              <button
                onClick={() => setActiveTab('institute')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded-lg transition-colors shrink-0"
              >
                ভার্চুয়াল একাডেমি খুলুন →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: HARMONIUM FOCUSED */}
        {activeTab === 'harmonium' && (
          <div className="space-y-8">
            <HarmoniumConsole
              pitchInfo={pitchInfo}
              rootKey={rootKey}
              autoAccompaniment={autoHarmonium}
              onToggleAutoAccompaniment={handleToggleAutoHarmonium}
              tanpuraActive={tanpuraActive}
              onToggleTanpura={handleToggleTanpura}
            />
            <StudioMixerRecorder
              isMicActive={isMicActive}
              onToggleMic={handleToggleMic}
            />
          </div>
        )}

        {/* TAB 3: GUITAR & BEATS FOCUSED */}
        {activeTab === 'guitar-beats' && (
          <div className="space-y-8">
            <GuitarStrummer
              pitchInfo={pitchInfo}
              rootKey={rootKey}
              autoAccompanimentGuitar={autoGuitar}
              onToggleAutoGuitar={handleToggleAutoGuitar}
            />
            <KeyPadsBeats />
          </div>
        )}

        {/* TAB 4: MIXER & RECORDER FOCUSED */}
        {activeTab === 'mixer' && (
          <div className="space-y-8">
            <StudioMixerRecorder
              isMicActive={isMicActive}
              onToggleMic={handleToggleMic}
            />
          </div>
        )}

        {/* TAB 5: VIRTUAL MUSIC ACADEMY */}
        {activeTab === 'institute' && (
          <div className="space-y-8">
            <VirtualInstitute
              pitchInfo={pitchInfo}
              rootKey={rootKey}
              onSelectRootKey={handleRootKeyChange}
              onSelectScale={handleScaleChange}
              onOpenAICoachWithSong={handleOpenCoachWithSong}
            />
          </div>
        )}
      </main>

      {/* AI Coach Dialog */}
      <AICoachModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        vocalKey={rootKey}
        initialSongQuery={coachSongQuery}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>সুরসাধনা · AI মিউজিক স্টুডিও ও ভার্চুয়াল ইনস্টিটিউট</span>
          <span>ওয়েব অডিও এপিআই ও রিয়েলটাইম হারমোনিয়াম সিন্থেসিস দ্বারা চালিত</span>
        </div>
      </footer>
    </div>
  );
}
