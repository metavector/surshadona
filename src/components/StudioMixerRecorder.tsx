import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Trash2,
  Sliders,
  Scissors,
  Volume2,
  Sparkles,
  Share2,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { RecordedAudio, AudioTrackVolumes } from '../types';

interface StudioMixerRecorderProps {
  isMicActive: boolean;
  onToggleMic: () => void;
}

export const StudioMixerRecorder: React.FC<StudioMixerRecorderProps> = ({
  isMicActive,
  onToggleMic,
}) => {
  const engine = AudioEngine.getInstance();
  const [isRecording, setIsRecording] = useState(engine.isRecording);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordings, setRecordings] = useState<RecordedAudio[]>([]);
  const [activeRecording, setActiveRecording] = useState<RecordedAudio | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]); // percentage start and end

  const [volumes, setVolumes] = useState<AudioTrackVolumes>(engine.volumes);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Visualizer loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      if (engine.micAnalyser) {
        const bufferLength = engine.micAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        engine.micAnalyser.getByteTimeDomainData(dataArray);

        // Draw waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = isRecording ? '#f43f5e' : '#f59e0b';
        ctx.beginPath();

        const sliceWidth = (width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Draw frequency spectrum overlay bars in background
        const freqArray = new Uint8Array(bufferLength);
        engine.micAnalyser.getByteFrequencyData(freqArray);
        const barWidth = (width / 64);
        for (let j = 0; j < 64; j++) {
          const barHeight = (freqArray[j * 2] / 255) * (height / 2);
          ctx.fillStyle = isRecording ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.12)';
          ctx.fillRect(j * barWidth, height - barHeight, barWidth - 1, barHeight);
        }
      } else {
        // Flat center line
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [engine, isRecording]);

  const handleStartRecord = async () => {
    await engine.initAudio();
    if (!isMicActive) {
      await onToggleMic();
    }
    const started = engine.startRecording();
    if (started) {
      setIsRecording(true);
    }
  };

  const handleStopRecord = async () => {
    const take = await engine.stopRecording();
    setIsRecording(false);
    if (take) {
      setRecordings((prev) => [take, ...prev]);
      setActiveRecording(take);
      setTrimRange([0, 100]);
    }
  };

  const handleVolumeChange = (track: keyof AudioTrackVolumes, val: number) => {
    setVolumes((prev) => ({ ...prev, [track]: val }));
    engine.setTrackVolume(track, val);
  };

  const handlePlayActiveTake = () => {
    if (!activeRecording) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(activeRecording.url);
      audioElementRef.current.ontimeupdate = () => {
        if (audioElementRef.current) {
          setPlaybackTime(audioElementRef.current.currentTime);
        }
      };
      audioElementRef.current.onended = () => {
        setIsPlayingRecorded(false);
        setPlaybackTime(0);
      };
    } else {
      if (audioElementRef.current.src !== activeRecording.url) {
        audioElementRef.current.src = activeRecording.url;
      }
    }

    if (isPlayingRecorded) {
      audioElementRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      // Calculate trim start time
      const startTime = (trimRange[0] / 100) * activeRecording.duration;
      audioElementRef.current.currentTime = startTime;
      audioElementRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
      {/* Studio Header */}
      <div className="p-5 sm:p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                মাল্টিট্র্যাক রেকর্ডিং ও এডিটর
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">ভোকাল, হারমোনিয়াম ও বাদ্যযন্ত্রের পূর্ণাঙ্গ মিক্স</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-100 mt-1">
              স্টুডিও মিক্সার ও অডিও এডিটর
            </h2>
          </div>

          {/* Record Control */}
          <div className="flex items-center gap-3">
            {isRecording ? (
              <button
                onClick={handleStopRecord}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-lg shadow-rose-950/50"
              >
                <Square className="w-4 h-4 fill-current" />
                রেকর্ড সম্পন্ন করুন ({formatTime(recordSeconds)})
              </button>
            ) : (
              <button
                onClick={handleStartRecord}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-md"
              >
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                গান রেকর্ড করুন
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Waveform & Spectrum Visualizer */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="font-medium text-neutral-300">
              {isRecording ? 'রেকর্ড হচ্ছে...' : 'লাইভ অডিও ভিজ্যুয়ালাইজার (ওয়েভফর্ম ও স্পেকট্রাম)'}
            </span>
            <span className="font-mono text-amber-400">
              {isRecording ? formatTime(recordSeconds) : '48 kHz Stereo'}
            </span>
          </div>

          <div className="h-28 w-full bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800/80">
            <canvas
              ref={canvasRef}
              width={800}
              height={112}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Multi-Track Fader Busses */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: 'vocal' as const, label: 'ভোকাল (মাইক)' },
            { key: 'harmonium' as const, label: 'হারমোনিয়াম' },
            { key: 'guitar' as const, label: 'একোস্টিক গিটার' },
            { key: 'rhythm' as const, label: 'তবলা ও ছন্দ' },
            { key: 'reverb' as const, label: 'স্টুডিও রিভার্ব' },
            { key: 'delay' as const, label: 'ইকো ও ডিলে' },
            { key: 'master' as const, label: 'মাস্টার সাউন্ড' },
          ].map((bus) => (
            <div
              key={bus.key}
              className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex flex-col justify-between"
            >
              <div className="text-[11px] font-medium text-neutral-300 mb-2 truncate">
                {bus.label}
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes[bus.key]}
                onChange={(e) => handleVolumeChange(bus.key, parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                <span>0%</span>
                <span className="text-amber-400 font-semibold">
                  {Math.round(volumes[bus.key] * 100)}%
                </span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Audio Editor & Recorded Takes Section */}
        <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-neutral-100">
                রেকর্ডকৃত গান ও অডিও এডিটর (Audio Trimmer)
              </h3>
            </div>
            <span className="text-xs text-neutral-500">
              মোট রেকর্ড: {recordings.length}
            </span>
          </div>

          {activeRecording ? (
            <div className="space-y-4 bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-neutral-100 text-sm">
                    {activeRecording.title}
                  </h4>
                  <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span>দৈর্ঘ্য: {formatTime(activeRecording.duration)}</span>
                    <span>·</span>
                    <span>স্কেল: {activeRecording.vocalKey}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayActiveTake}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded-md transition-colors"
                  >
                    {isPlayingRecorded ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        বিরতি
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        প্লে করুন
                      </>
                    )}
                  </button>

                  <a
                    href={activeRecording.url}
                    download={`${activeRecording.title}.webm`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-md border border-neutral-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    ডাউনলোড
                  </a>
                </div>
              </div>

              {/* Trimmer Sliders */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>কাট / ট্রিম শুরু: {Math.round((trimRange[0] / 100) * activeRecording.duration)}s</span>
                  <span>শেষ: {Math.round((trimRange[1] / 100) * activeRecording.duration)}s</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={trimRange[1] - 5}
                    value={trimRange[0]}
                    onChange={(e) => setTrimRange([Number(e.target.value), trimRange[1]])}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <input
                    type="range"
                    min={trimRange[0] + 5}
                    max="100"
                    value={trimRange[1]}
                    onChange={(e) => setTrimRange([trimRange[0], Number(e.target.value)])}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div className="text-[11px] text-neutral-500 flex justify-between">
                  <span>স্লাইডার টেনে শুরু ও শেষের অপ্রয়োজনীয় অংশ বাদ দিন</span>
                  <button
                    onClick={() => setTrimRange([0, 100])}
                    className="text-amber-400 hover:underline"
                  >
                    রিসেট ট্রিম
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500 text-xs">
              এখনো কোনো গান রেকর্ড করা হয়নি। উপরে &quot;গান রেকর্ড করুন&quot; বাটনে ক্লিক করে গান গাওয়া শুরু করুন!
            </div>
          )}

          {/* List of Previous Recordings */}
          {recordings.length > 1 && (
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400 font-medium block mb-2">
                অন্যান্য রেকর্ডসমূহ:
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setActiveRecording(rec);
                      setTrimRange([0, 100]);
                    }}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      activeRecording?.id === rec.id
                        ? 'bg-neutral-850 border-amber-500/50 text-neutral-100'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    <span>{rec.title}</span>
                    <span className="font-mono text-neutral-500">
                      {formatTime(rec.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
