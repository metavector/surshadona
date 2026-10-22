import {
  NoteName,
  IndianSwara,
  AutoTuneMode,
  ScaleDefinition,
  DetectedPitchInfo,
  AudioTrackVolumes,
  RecordedAudio,
} from '../types';
import {
  NOTE_NAMES,
  ROOT_KEYS,
  SCALES,
  getIndianSwara,
  frequencyToMidi,
  midiToFrequency,
  getNoteFromMidi,
} from './musicalScales';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public ctx: AudioContext | null = null;
  public micStream: MediaStream | null = null;
  public micSourceNode: MediaStreamAudioSourceNode | null = null;
  public micAnalyser: AnalyserNode | null = null;

  // Master and track gain nodes
  public masterGain: GainNode | null = null;
  public vocalGain: GainNode | null = null;
  public harmoniumGain: GainNode | null = null;
  public guitarGain: GainNode | null = null;
  public rhythmGain: GainNode | null = null;

  // Effects nodes
  public reverbNode: ConvolverNode | null = null;
  public reverbGain: GainNode | null = null;
  public delayNode: DelayNode | null = null;
  public delayFeedbackGain: GainNode | null = null;
  public delayWetGain: GainNode | null = null;
  public eqLow: BiquadFilterNode | null = null;
  public eqMid: BiquadFilterNode | null = null;
  public eqHigh: BiquadFilterNode | null = null;

  // Auto-tune & pitch correction
  public autoTuneMode: AutoTuneMode = 'studio';
  public currentRootKey: NoteName = 'C';
  public currentScale: ScaleDefinition = SCALES[0]; // Bilawal
  public autoAccompanimentHarmonium: boolean = true;
  public autoAccompanimentGuitar: boolean = true;
  public tanpuraActive: boolean = false;

  // Active notes tracking
  private activeHarmoniumNotes: Map<number, { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode }> = new Map();
  private lastDetectedMidi: number = -1;
  private vocalPitchHistory: number[] = [];
  private currentDetectedPitch: DetectedPitchInfo | null = null;

  // Rhythm loop & sequencer
  private rhythmIntervalId: any = null;
  public isRhythmPlaying: boolean = false;
  public currentBpm: number = 96;
  public currentBeatStep: number = 0;
  public currentTaalId: string = 'keharwa';

  // Tanpura timer
  private tanpuraTimerId: any = null;
  private tanpuraStep: number = 0;

  // Pitch tracking loop
  private pitchLoopAnimFrame: number | null = null;
  private pitchListeners: ((info: DetectedPitchInfo | null) => void)[] = [];

  // Recorder
  public mediaRecorder: MediaRecorder | null = null;
  public recordingDestination: MediaStreamAudioDestinationNode | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording: boolean = false;
  public recordingStartTime: number = 0;

  // Track volumes
  public volumes: AudioTrackVolumes = {
    master: 0.9,
    vocal: 0.9,
    harmonium: 0.8,
    guitar: 0.75,
    rhythm: 0.75,
    reverb: 0.35,
    delay: 0.2,
  };

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initAudio(): Promise<boolean> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.setupAudioGraph();
      return true;
    } catch (err) {
      console.error('AudioContext initialization failed:', err);
      return false;
    }
  }

  private setupAudioGraph(): void {
    if (!this.ctx) return;

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);

    // Track busses
    this.vocalGain = this.ctx.createGain();
    this.vocalGain.gain.setValueAtTime(this.volumes.vocal, this.ctx.currentTime);

    this.harmoniumGain = this.ctx.createGain();
    this.harmoniumGain.gain.setValueAtTime(this.volumes.harmonium, this.ctx.currentTime);

    this.guitarGain = this.ctx.createGain();
    this.guitarGain.gain.setValueAtTime(this.volumes.guitar, this.ctx.currentTime);

    this.rhythmGain = this.ctx.createGain();
    this.rhythmGain.gain.setValueAtTime(this.volumes.rhythm, this.ctx.currentTime);

    // 3-Band Equalizer on Master
    this.eqLow = this.ctx.createBiquadFilter();
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.eqLow.gain.setValueAtTime(1.5, this.ctx.currentTime);

    this.eqMid = this.ctx.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.setValueAtTime(1500, this.ctx.currentTime);
    this.eqMid.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.eqMid.gain.setValueAtTime(0.5, this.ctx.currentTime);

    this.eqHigh = this.ctx.createBiquadFilter();
    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.setValueAtTime(4500, this.ctx.currentTime);
    this.eqHigh.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Studio Reverb (algorithmic impulse response)
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createSyntheticReverbBuffer(2.2, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(this.volumes.reverb, this.ctx.currentTime);

    // Delay / Echo
    this.delayNode = this.ctx.createDelay(1.5);
    this.delayNode.delayTime.setValueAtTime(0.32, this.ctx.currentTime);
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.delayWetGain = this.ctx.createGain();
    this.delayWetGain.gain.setValueAtTime(this.volumes.delay, this.ctx.currentTime);

    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayWetGain);

    // Recording destination node
    this.recordingDestination = this.ctx.createMediaStreamDestination();

    // Route tracks into EQ chain & Effects
    const trackMixer = this.ctx.createGain();
    this.vocalGain.connect(trackMixer);
    this.harmoniumGain.connect(trackMixer);
    this.guitarGain.connect(trackMixer);
    this.rhythmGain.connect(trackMixer);

    // Vocal specific send to Reverb & Delay
    this.vocalGain.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(trackMixer);

    this.vocalGain.connect(this.delayNode);
    this.delayWetGain.connect(trackMixer);

    // Connect to EQ chain -> Master -> Speakers & Recorder
    trackMixer.connect(this.eqLow);
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.masterGain);

    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.recordingDestination);
  }

  // Create warm natural studio reverb impulse response
  private createSyntheticReverbBuffer(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error('No AudioContext');
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  // Start Microphone and Pitch Detection
  public async startMicrophone(): Promise<boolean> {
    const initialized = await this.initAudio();
    if (!initialized || !this.ctx) return false;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 2048;
      this.micAnalyser.smoothingTimeConstant = 0.85;

      // Filter low frequency rumble (< 70 Hz)
      const micHpFilter = this.ctx.createBiquadFilter();
      micHpFilter.type = 'highpass';
      micHpFilter.frequency.setValueAtTime(70, this.ctx.currentTime);

      this.micSourceNode.connect(micHpFilter);
      micHpFilter.connect(this.micAnalyser);

      // Connect vocal monitor to vocal track gain (for monitoring & recording)
      if (this.vocalGain) {
        micHpFilter.connect(this.vocalGain);
      }

      this.startPitchDetectionLoop();
      return true;
    } catch (err) {
      console.error('Microphone access failed:', err);
      return false;
    }
  }

  public stopMicrophone(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.pitchLoopAnimFrame) {
      cancelAnimationFrame(this.pitchLoopAnimFrame);
      this.pitchLoopAnimFrame = null;
    }
    this.stopAllHarmoniumNotes();
    this.currentDetectedPitch = null;
    this.notifyPitchListeners(null);
  }

  // Autocorrelation pitch detection algorithm
  private startPitchDetectionLoop(): void {
    if (!this.micAnalyser || !this.ctx) return;

    const buffer = new Float32Array(this.micAnalyser.fftSize);

    const checkPitch = () => {
      if (!this.micAnalyser || !this.ctx) return;

      this.micAnalyser.getFloatTimeDomainData(buffer);
      const pitchInfo = this.detectPitchFromBuffer(buffer, this.ctx.sampleRate);

      if (pitchInfo) {
        this.currentDetectedPitch = pitchInfo;
        this.notifyPitchListeners(pitchInfo);

        // Auto-Harmonium Accompaniment
        if (this.autoAccompanimentHarmonium && pitchInfo.clarity > 0.8) {
          const targetNoteMidi = this.autoTuneMode !== 'off' ? pitchInfo.tunedMidi : pitchInfo.midi;
          if (targetNoteMidi !== this.lastDetectedMidi) {
            this.handleAutoHarmoniumFollow(targetNoteMidi);
            this.lastDetectedMidi = targetNoteMidi;
          }
        }

        // Auto-Guitar Accompaniment detection
        if (this.autoAccompanimentGuitar) {
          this.vocalPitchHistory.push(pitchInfo.tunedMidi % 12);
          if (this.vocalPitchHistory.length > 20) {
            this.vocalPitchHistory.shift();
          }
        }
      } else {
        this.currentDetectedPitch = null;
        this.notifyPitchListeners(null);
        if (this.lastDetectedMidi !== -1) {
          this.stopHarmoniumNote(this.lastDetectedMidi);
          this.lastDetectedMidi = -1;
        }
      }

      this.pitchLoopAnimFrame = requestAnimationFrame(checkPitch);
    };

    this.pitchLoopAnimFrame = requestAnimationFrame(checkPitch);
  }

  // Pitch calculation using normalized autocorrelation
  private detectPitchFromBuffer(buf: Float32Array, sampleRate: number): DetectedPitchInfo | null {
    const SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Silence gate threshold
    if (rms < 0.015) {
      return null;
    }

    // Autocorrelation between 65Hz (C2) and 1050Hz (C6)
    const minPeriod = Math.floor(sampleRate / 1050);
    const maxPeriod = Math.floor(sampleRate / 65);

    let bestPeriod = -1;
    let maxCorrelation = 0;

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < SIZE - period; i++) {
        correlation += buf[i] * buf[i + period];
      }
      correlation = correlation / (SIZE - period);

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }

    // Normalizing metric (clarity of pitch)
    const clarity = maxCorrelation / (rms * rms);
    if (clarity < 0.4 || bestPeriod === -1) {
      return null;
    }

    // Parabolic interpolation for fine sub-sample frequency resolution
    let refinedPeriod = bestPeriod;
    if (bestPeriod > minPeriod && bestPeriod < maxPeriod) {
      const prev = this.getLagCorrelation(buf, bestPeriod - 1);
      const curr = maxCorrelation;
      const next = this.getLagCorrelation(buf, bestPeriod + 1);
      const delta = (next - prev) / (2 * (2 * curr - prev - next));
      if (Math.abs(delta) < 1) {
        refinedPeriod = bestPeriod + delta;
      }
    }

    const frequency = sampleRate / refinedPeriod;
    if (frequency < 60 || frequency > 1200) {
      return null;
    }

    const rawMidi = frequencyToMidi(frequency);
    const { note, octave, cents } = getNoteFromMidi(rawMidi);
    const swara = getIndianSwara(note, this.currentRootKey);

    // Auto-tune target calculation
    const tuned = this.calculateAutoTunedMidi(rawMidi);
    const tunedInfo = getNoteFromMidi(tuned);
    const tunedSwara = getIndianSwara(tunedInfo.note, this.currentRootKey);

    return {
      frequency,
      note,
      octave,
      midi: Math.round(rawMidi),
      cents,
      swara,
      clarity: Math.min(1, clarity),
      targetMidi: tuned,
      targetFreq: midiToFrequency(tuned),
      tunedMidi: tuned,
      tunedNote: tunedInfo.note,
      tunedSwara,
    };
  }

  private getLagCorrelation(buf: Float32Array, lag: number): number {
    let sum = 0;
    const len = buf.length - lag;
    for (let i = 0; i < len; i++) {
      sum += buf[i] * buf[i + lag];
    }
    return sum / len;
  }

  // Snaps pitch to nearest note in the selected Scale/Raag
  private calculateAutoTunedMidi(rawMidi: number): number {
    const rootIndex = NOTE_NAMES.indexOf(this.currentRootKey);
    const allowedSemitones = this.currentScale.semitones;

    const roundMidi = Math.round(rawMidi);
    const pitchClass = ((roundMidi % 12) + 12) % 12;
    const relativeToRoot = ((pitchClass - rootIndex) + 12) % 12;

    if (allowedSemitones.includes(relativeToRoot)) {
      return roundMidi;
    }

    // Find closest allowed semitone in scale
    let closestOffset = allowedSemitones[0];
    let minDistance = 999;

    for (const semi of allowedSemitones) {
      const dist = Math.min(
        Math.abs(relativeToRoot - semi),
        Math.abs(relativeToRoot - (semi + 12)),
        Math.abs((relativeToRoot + 12) - semi)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestOffset = semi;
      }
    }

    const targetPitchClass = (rootIndex + closestOffset) % 12;
    const octave = Math.floor(roundMidi / 12);
    let candidate1 = octave * 12 + targetPitchClass;
    let candidate2 = (octave - 1) * 12 + targetPitchClass;
    let candidate3 = (octave + 1) * 12 + targetPitchClass;

    const cands = [candidate1, candidate2, candidate3];
    cands.sort((a, b) => Math.abs(a - rawMidi) - Math.abs(b - rawMidi));
    return cands[0];
  }

  // ---------------------------------------------------------------------------
  // HARMONIUM ENGINE (হারমোনিয়াম সিন্থেসিস)
  // Dual brass reed (Male + Female reeds), bellows pressure airflow, warmth filter
  // ---------------------------------------------------------------------------
  public playHarmoniumNote(midi: number, duration?: number): void {
    if (!this.ctx || !this.harmoniumGain) return;

    // If note is already playing, stop previous instance
    if (this.activeHarmoniumNotes.has(midi)) {
      this.stopHarmoniumNote(midi);
    }

    const freq = midiToFrequency(midi);
    const now = this.ctx.currentTime;

    // Reed 1: Warm Sawtooth (Male reed)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);
    osc1.detune.setValueAtTime(-4, now); // subtle natural reed detuning

    // Reed 2: Pulse/Square harmonic (Female octave/unison reed)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now); // Higher octave reed for characteristic rich harmonium bite
    osc2.detune.setValueAtTime(5, now);

    // Warm Low-pass filter for wooden harmonium body resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(2.5, now);

    // Bellows pressure envelope
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0, now);
    // Soft attack like air rushing into bellows
    noteGain.gain.linearRampToValueAtTime(0.35, now + 0.08);

    // Tremolo LFO for bellows flutter
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(5.5, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.04, now);
    lfo.connect(lfoGain);
    lfoGain.connect(noteGain.gain);
    lfo.start(now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.harmoniumGain);

    osc1.start(now);
    osc2.start(now);

    this.activeHarmoniumNotes.set(midi, { osc1, osc2, gain: noteGain });

    if (duration) {
      setTimeout(() => {
        this.stopHarmoniumNote(midi);
      }, duration * 1000);
    }
  }

  public stopHarmoniumNote(midi: number): void {
    if (!this.ctx) return;
    const voice = this.activeHarmoniumNotes.get(midi);
    if (!voice) return;

    const now = this.ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    // Smooth release of reed air
    voice.gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

    setTimeout(() => {
      try {
        voice.osc1.stop();
        voice.osc2.stop();
        voice.osc1.disconnect();
        voice.osc2.disconnect();
        voice.gain.disconnect();
      } catch (e) {
        // Ignored
      }
    }, 150);

    this.activeHarmoniumNotes.delete(midi);
  }

  public stopAllHarmoniumNotes(): void {
    const keys = Array.from(this.activeHarmoniumNotes.keys());
    keys.forEach((k) => this.stopHarmoniumNote(k));
  }

  private handleAutoHarmoniumFollow(targetMidi: number): void {
    // Stop other melody notes, keep root drone if enabled
    const active = Array.from(this.activeHarmoniumNotes.keys());
    for (const m of active) {
      if (m !== targetMidi) {
        this.stopHarmoniumNote(m);
      }
    }
    this.playHarmoniumNote(targetMidi);
  }

  // ---------------------------------------------------------------------------
  // ACOUSTIC GUITAR ENGINE (গিটার সংগত)
  // Karplus-Strong string synthesis & rhythmic acoustic strumming
  // ---------------------------------------------------------------------------
  public strumGuitarChord(chordName: string, direction: 'down' | 'up' = 'down'): void {
    if (!this.ctx || !this.guitarGain) return;

    const chordPitches = this.getGuitarChordMidis(chordName);
    const now = this.ctx.currentTime;
    const strumSpread = direction === 'down' ? 0.02 : 0.015; // 20ms human finger pick spread

    const orderedPitches = direction === 'down' ? chordPitches : [...chordPitches].reverse();

    orderedPitches.forEach((midi, idx) => {
      const noteTime = now + idx * strumSpread;
      this.playAcousticString(midi, noteTime, 0.4);
    });
  }

  // Plucks a single acoustic guitar string using damped multi-harmonic synthesis
  public playAcousticString(midi: number, when?: number, velocity: number = 0.5): void {
    if (!this.ctx || !this.guitarGain) return;

    const time = when || this.ctx.currentTime;
    const freq = midiToFrequency(midi);

    // Fundamental string body
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    // Metallic pick pluck overtone
    const pickOsc = this.ctx.createOscillator();
    pickOsc.type = 'sawtooth';
    pickOsc.frequency.setValueAtTime(freq * 2, time);

    // Lowpass filter simulates guitar wood body dampening higher harmonics faster
    const stringFilter = this.ctx.createBiquadFilter();
    stringFilter.type = 'lowpass';
    stringFilter.frequency.setValueAtTime(3500, time);
    stringFilter.frequency.exponentialRampToValueAtTime(400, time + 1.2);

    const stringGain = this.ctx.createGain();
    stringGain.gain.setValueAtTime(0.001, time);
    // Instant attack of guitar pick
    stringGain.gain.linearRampToValueAtTime(velocity * 0.45, time + 0.004);
    // Acoustic exponential decay
    stringGain.gain.exponentialRampToValueAtTime(0.001, time + 1.6);

    osc.connect(stringFilter);
    pickOsc.connect(stringFilter);
    stringFilter.connect(stringGain);
    stringGain.connect(this.guitarGain);

    osc.start(time);
    pickOsc.start(time);

    osc.stop(time + 1.8);
    pickOsc.stop(time + 1.8);
  }

  public getGuitarChordMidis(chord: string): number[] {
    // Common acoustic guitar chord fingerings (MIDI numbers)
    const chordMap: Record<string, number[]> = {
      C: [48, 52, 55, 60, 64], // C3, E3, G3, C4, E4
      Cm: [48, 51, 55, 60, 63], // C3, Eb3, G3, C4, Eb4
      D: [50, 57, 62, 66], // D3, A3, D4, F#4
      Dm: [50, 57, 62, 65], // D3, A3, D4, F4
      E: [40, 47, 52, 56, 59, 64], // E2, B2, E3, G#3, B3, E4
      Em: [40, 47, 52, 55, 59, 64], // E2, B2, E3, G3, B3, E4
      F: [41, 48, 53, 57, 60, 65], // F2, C3, F3, A3, C4, F4
      Fm: [41, 48, 53, 56, 60, 65],
      G: [43, 47, 50, 55, 59, 67], // G2, B2, D3, G3, B3, G4
      Gm: [43, 46, 50, 55, 58, 67],
      A: [45, 52, 57, 61, 64], // A2, E3, A3, C#4, E4
      Am: [45, 52, 57, 60, 64], // A2, E3, A3, C4, E4
      B: [47, 54, 59, 63, 66],
      Bm: [47, 54, 59, 62, 66],
    };

    return chordMap[chord] || [48, 52, 55, 60]; // default C
  }

  // Detect matching guitar chord from vocal pitch
  public getDetectedChordFromVoice(): string {
    if (this.vocalPitchHistory.length === 0) {
      return this.currentRootKey;
    }

    // Tally pitch classes
    const counts: Record<number, number> = {};
    for (const pc of this.vocalPitchHistory) {
      counts[pc] = (counts[pc] || 0) + 1;
    }

    const rootIdx = NOTE_NAMES.indexOf(this.currentRootKey);
    const hasFifth = (counts[(rootIdx + 7) % 12] || 0) > 0;
    const hasFourth = (counts[(rootIdx + 5) % 12] || 0) > 0;
    const hasMinorThird = (counts[(rootIdx + 3) % 12] || 0) > 0;
    const hasMajorThird = (counts[(rootIdx + 4) % 12] || 0) > 0;
    const hasSixth = (counts[(rootIdx + 9) % 12] || 0) > 0;

    if (hasSixth && counts[(rootIdx + 9) % 12] > 2) {
      // Relative minor or 6th chord
      const minorRoot = NOTE_NAMES[(rootIdx + 9) % 12];
      return `${minorRoot}m`;
    }
    if (hasFourth && counts[(rootIdx + 5) % 12] > 2) {
      return NOTE_NAMES[(rootIdx + 5) % 12]; // IV chord
    }
    if (hasFifth && counts[(rootIdx + 7) % 12] > 2) {
      return NOTE_NAMES[(rootIdx + 7) % 12]; // V chord
    }

    return this.currentRootKey;
  }

  // ---------------------------------------------------------------------------
  // KEYPAD & PERCUSSION SYNTHESIZER (কীপ্যাড, তবলা বোল ও ড্রাম বিটস)
  // ---------------------------------------------------------------------------
  public triggerPadSound(type: string): void {
    if (!this.ctx || !this.rhythmGain) return;
    const now = this.ctx.currentTime;

    switch (type) {
      case 'dha': {
        // Tabla Dha = Dayan (sharp ring) + Bayan (deep bass bend)
        this.synthesizeBayan(now, 85, 58, 0.45);
        this.synthesizeDayan(now, 260, 0.4);
        break;
      }
      case 'dhin': {
        // Resonant open tabla tone
        this.synthesizeBayan(now, 95, 75, 0.35);
        this.synthesizeDayan(now, 290, 0.45);
        break;
      }
      case 'tin':
      case 'ta': {
        // High crisp Dayan rim slap
        this.synthesizeDayan(now, 440, 0.35, true);
        break;
      }
      case 'kick': {
        // Deep 808/Acoustic kick
        this.synthesizeKick(now);
        break;
      }
      case 'snare': {
        // Acoustic snare
        this.synthesizeSnare(now);
        break;
      }
      case 'hihat': {
        // Crisp hihat
        this.synthesizeHiHat(now);
        break;
      }
      case 'pad': {
        // Lush ambient synth pad chord
        this.playAmbientPadChord();
        break;
      }
      case 'shaker': {
        // Ghungroo / Shaker sparkle
        this.synthesizeShaker(now);
        break;
      }
      default:
        this.synthesizeDayan(now, 320, 0.3);
    }
  }

  private synthesizeBayan(time: number, startFreq: number, endFreq: number, gainVal: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.28);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.rhythmGain);
    osc.start(time);
    osc.stop(time + 0.4);
  }

  private synthesizeDayan(time: number, freq: number, gainVal: number, isSlap: boolean = false): void {
    if (!this.ctx || !this.rhythmGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = isSlap ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isSlap ? 0.08 : 0.25));

    osc.connect(gain);
    gain.connect(this.rhythmGain);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private synthesizeKick(time: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.rhythmGain);
    osc.start(time);
    osc.stop(time + 0.32);
  }

  private synthesizeSnare(time: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    // Tone body
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.35, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    // Noise snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

    osc.connect(oscGain);
    oscGain.connect(this.rhythmGain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.rhythmGain);

    osc.start(time);
    noise.start(time);
    osc.stop(time + 0.2);
    noise.stop(time + 0.2);
  }

  private synthesizeHiHat(time: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.rhythmGain);

    noise.start(time);
    noise.stop(time + 0.06);
  }

  private synthesizeShaker(time: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5500, time);
    filter.Q.setValueAtTime(3.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.rhythmGain);

    noise.start(time);
    noise.stop(time + 0.09);
  }

  private playAmbientPadChord(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const rootMidi = 60 + NOTE_NAMES.indexOf(this.currentRootKey);
    const chordNotes = [rootMidi, rootMidi + 4, rootMidi + 7, rootMidi + 11];

    chordNotes.forEach((midi) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(midiToFrequency(midi), now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      if (this.rhythmGain) gain.connect(this.rhythmGain);

      osc.start(now);
      osc.stop(now + 3.2);
    });
  }

  // ---------------------------------------------------------------------------
  // RHYTHM SEQUENCER LOOP (স্বয়ংক্রিয় তাল ও বিট)
  // ---------------------------------------------------------------------------
  public startRhythmLoop(taalId: string = 'keharwa', bpm: number = 96): void {
    this.initAudio();
    this.stopRhythmLoop();

    this.currentTaalId = taalId;
    this.currentBpm = bpm;
    this.isRhythmPlaying = true;
    this.currentBeatStep = 0;

    const intervalMs = (60 / this.currentBpm / 2) * 1000; // Eighth notes / matra subdivision

    this.rhythmIntervalId = setInterval(() => {
      this.stepRhythm();
    }, intervalMs);
  }

  public stopRhythmLoop(): void {
    if (this.rhythmIntervalId) {
      clearInterval(this.rhythmIntervalId);
      this.rhythmIntervalId = null;
    }
    this.isRhythmPlaying = false;
  }

  private stepRhythm(): void {
    const step = this.currentBeatStep;

    if (this.currentTaalId === 'keharwa') {
      // 8-matra keharwa loop
      const pattern = ['dha', 'hihat', 'snare', 'hihat', 'dha', 'hihat', 'dhin', 'snare'];
      const sound = pattern[step % 8];
      this.triggerPadSound(sound);

      // Guitar auto-strum on beats 0 and 4
      if (this.autoAccompanimentGuitar && (step % 4 === 0)) {
        const detectedChord = this.getDetectedChordFromVoice();
        this.strumGuitarChord(detectedChord, step % 8 === 0 ? 'down' : 'up');
      }
    } else if (this.currentTaalId === 'dadra') {
      // 6-matra dadra loop (3/4 or 6/8)
      const pattern = ['dha', 'dhin', 'tin', 'dha', 'tin', 'ta'];
      const sound = pattern[step % 6];
      this.triggerPadSound(sound);

      if (this.autoAccompanimentGuitar && (step % 3 === 0)) {
        const detectedChord = this.getDetectedChordFromVoice();
        this.strumGuitarChord(detectedChord, 'down');
      }
    } else if (this.currentTaalId === 'roopak') {
      // 7-matra roopak loop
      const pattern = ['tin', 'tin', 'ta', 'dhin', 'na', 'dhin', 'na'];
      const sound = pattern[step % 7];
      this.triggerPadSound(sound);
    } else {
      // Pop 4/4 groove
      const popSteps = ['kick', 'hihat', 'snare', 'hihat', 'kick', 'kick', 'snare', 'hihat'];
      const sound = popSteps[step % 8];
      this.triggerPadSound(sound);

      if (this.autoAccompanimentGuitar && (step % 2 === 0)) {
        const detectedChord = this.getDetectedChordFromVoice();
        this.strumGuitarChord(detectedChord, step % 4 === 0 ? 'down' : 'up');
      }
    }

    this.currentBeatStep = (this.currentBeatStep + 1) % 64;
  }

  // ---------------------------------------------------------------------------
  // TANPURA DRONE ENGINE (তানপুরা সুর সংগত)
  // Continuous 4-string drone cycle: Pa/Ma -> Sa -> Sa -> Sa Kharaj
  // ---------------------------------------------------------------------------
  public toggleTanpura(active?: boolean): boolean {
    this.initAudio();
    this.tanpuraActive = active !== undefined ? active : !this.tanpuraActive;

    if (this.tanpuraActive) {
      this.startTanpuraCycle();
    } else {
      this.stopTanpuraCycle();
    }
    return this.tanpuraActive;
  }

  private startTanpuraCycle(): void {
    this.stopTanpuraCycle();
    this.tanpuraStep = 0;

    const rootIdx = NOTE_NAMES.indexOf(this.currentRootKey);
    const saMidi = 48 + rootIdx; // C3 root
    const paMidi = saMidi + 7; // G3
    const maMidi = saMidi + 5; // F3 (for ragas without Pa like Marwa/Malkauns)
    const kharajMidi = saMidi - 12; // C2 Kharaj Sa

    // 4 strings sequence
    const strings = [paMidi, saMidi, saMidi, kharajMidi];
    const stringDuration = 1100; // 1.1s per pluck cycle

    const pluckNext = () => {
      if (!this.tanpuraActive) return;
      const midi = strings[this.tanpuraStep % 4];
      this.pluckTanpuraString(midi);
      this.tanpuraStep++;
      this.tanpuraTimerId = setTimeout(pluckNext, stringDuration);
    };

    pluckNext();
  }

  private stopTanpuraCycle(): void {
    if (this.tanpuraTimerId) {
      clearTimeout(this.tanpuraTimerId);
      this.tanpuraTimerId = null;
    }
  }

  private pluckTanpuraString(midi: number): void {
    if (!this.ctx || !this.harmoniumGain) return;
    const now = this.ctx.currentTime;
    const freq = midiToFrequency(midi);

    // Jawari buzzing overtone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 3, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

    osc1.connect(filter);
    osc2.connect(gain);
    filter.connect(gain);
    gain.connect(this.harmoniumGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 4.0);
    osc2.stop(now + 4.0);
  }

  // ---------------------------------------------------------------------------
  // MULTI-TRACK AUDIO RECORDER (রেকর্ডিং ও অডিও এক্সপোর্ট)
  // ---------------------------------------------------------------------------
  public startRecording(): boolean {
    if (!this.recordingDestination || !this.ctx) return false;

    this.recordedChunks = [];
    try {
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/wav'];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

      this.mediaRecorder = new MediaRecorder(this.recordingDestination.stream, mimeType ? { mimeType } : undefined);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(250); // Record chunks every 250ms
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      return true;
    } catch (e) {
      console.error('Failed to start recording:', e);
      return false;
    }
  }

  public stopRecording(): Promise<RecordedAudio | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.isRecording = false;
        resolve(null);
        return;
      }

      const duration = (Date.now() - this.recordingStartTime) / 1000;

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        this.isRecording = false;

        const record: RecordedAudio = {
          id: `rec_${Date.now()}`,
          title: `রেকর্ড_${new Date().toLocaleTimeString('bn-BD')}`,
          blob,
          url,
          duration,
          createdAt: new Date(),
          vocalKey: this.currentRootKey,
          scaleName: this.currentScale.bengaliName,
        };

        resolve(record);
      };

      this.mediaRecorder.stop();
    });
  }

  // ---------------------------------------------------------------------------
  // VOLUME & FX CONTROLS
  // ---------------------------------------------------------------------------
  public setTrackVolume(track: keyof AudioTrackVolumes, value: number): void {
    this.volumes[track] = value;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (track) {
      case 'master':
        this.masterGain?.gain.setTargetAtTime(value, now, 0.05);
        break;
      case 'vocal':
        this.vocalGain?.gain.setTargetAtTime(value, now, 0.05);
        break;
      case 'harmonium':
        this.harmoniumGain?.gain.setTargetAtTime(value, now, 0.05);
        break;
      case 'guitar':
        this.guitarGain?.gain.setTargetAtTime(value, now, 0.05);
        break;
      case 'rhythm':
        this.rhythmGain?.gain.setTargetAtTime(value, now, 0.05);
        break;
      case 'reverb':
        this.reverbGain?.gain.setTargetAtTime(value, now, 0.05);
        break;
      case 'delay':
        this.delayWetGain?.gain.setTargetAtTime(value, now, 0.05);
        break;
    }
  }

  public setAutoTuneMode(mode: AutoTuneMode): void {
    this.autoTuneMode = mode;
  }

  public setRootKey(key: NoteName): void {
    this.currentRootKey = key;
    if (this.tanpuraActive) {
      this.startTanpuraCycle();
    }
  }

  public setScale(scale: ScaleDefinition): void {
    this.currentScale = scale;
  }

  public setAutoAccompanimentHarmonium(enabled: boolean): void {
    this.autoAccompanimentHarmonium = enabled;
    if (!enabled) {
      this.stopAllHarmoniumNotes();
    }
  }

  public setAutoAccompanimentGuitar(enabled: boolean): void {
    this.autoAccompanimentGuitar = enabled;
  }

  // Pitch listeners subscription
  public addPitchListener(fn: (info: DetectedPitchInfo | null) => void): () => void {
    this.pitchListeners.push(fn);
    return () => {
      this.pitchListeners = this.pitchListeners.filter((l) => l !== fn);
    };
  }

  private notifyPitchListeners(info: DetectedPitchInfo | null): void {
    this.pitchListeners.forEach((fn) => fn(info));
  }
}
