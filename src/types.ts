export interface LanguageContent {
  langBtn: string;
  logoTitle: string;
  logoDesc: string;
  drumTitle: string;
  drumStatusDefault: string;
  drumStatusLoaded: string;
  synthTitle: string;
  synthStatusDefault: string;
  synthStatusLoaded: string;
  multitrackTitle: string;
  multitrackStatusDefault: string;
  multitrackStatusLoaded: string;
  guideAlert: string;
  tagGenre: string;
  tagBpm: string;
  tagScale: string;
  lblMode: string;
  btnModeAi: string;
  btnModeManual: string;
  lblStyle: string;
  slLeft: string;
  slMid: string;
  slRight: string;
  lblSeed: string;
  btnDice: string;
  editorTitle: string;
  restText: string;
  restVocalText: string;
  bottomTip: string;
  btnDownload: string;
  btnDownloadToplineOnly: string;
  btnDownloadMultiTrack: string;
  footerBanner: string;
  engineTitle: string;
  engineDetail: string;
  copyright: string;
  vocalInstrument: string;
}

export type LanguageCode = "ko" | "en";
export type ThemeMode = "day" | "night";

export interface ToplineNote {
  id: string; // unique ID
  midi: number;
  pitchName: string;
  step: number; // 0 to 15 (representing 16th notes in a 4/4 bar, or scaled across bars)
  durationSteps: number; // length of note in grid steps
  isRest?: boolean;
  row?: number; // visual index in the roll
  velocity?: number; // volume velocity (0.1 to 1.0)
}

export type SessionContext = {
  sourceType: "mdbg-session" | "standard-midi" | "fallback-analysis";

  bpm: number;
  timeSignature: string;
  ppq: number;
  ticksPerStep: number;
  patternLength: 16 | 32 | 64;
  bars: 1 | 2 | 4;

  key: string;
  scale: string;

  genrePreset?: string;
  groovePreset?: string;
  bassStrategy?: string;
  drumKit?: string;
  bassSound?: string;

  drumDensity: number;
  bassDensity: number;
  averageDrumVelocity?: number;
  averageBassVelocity?: number;
  rhythmIntensity: "low" | "medium" | "high";
  mood: "happy" | "dark" | "neutral";

  tracks: {
    drums?: {
      trackIndex: number;
      channel: number;
      noteCount: number;
    };
    bass?: {
      trackIndex: number;
      channel: number;
      noteCount: number;
      pitchRange?: [number, number];
    };
  };

  toplineHints: {
    recommendedRegister: "low" | "mid" | "mid-high" | "high";
    phraseDensity: "low" | "medium" | "high";
    avoidTooBusyMelody: boolean;
    safeScaleDegrees: number[];
    strongBeatSteps: number[];
    restBias: number;
  };

  confidence: {
    metadata: number; // 0 to 1
    key: number; // 0 to 1
    tempo: number; // 0 to 1
    trackDetection: number; // 0 to 1
  };

  warnings: string[];
};

export type ToplinePlan = {
  bpm: number;
  key: string;
  scale: string;
  bars: 1 | 2 | 4;

  register: {
    minMidi: number;
    maxMidi: number;
    preferredCenter: number;
  };

  density: "low" | "medium" | "high";
  restBias: number;
  motifLength: 2 | 3 | 4;
  phraseShape: "rise" | "fall" | "arch" | "flat";
  rhythmicStyle: "straight" | "bounce" | "laid-back" | "syncopated";

  allowedNotes: number[];
  strongBeatSteps: number[];
  avoidSteps: number[];
  pickupSteps: number[];

  sourceSummary: string;
};

