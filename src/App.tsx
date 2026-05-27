/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { analyzeMidiFile, generateToplineMidi, generateMultiTrackMidi, ParsedMidiData, AnalyzedNote, createToplinePlan } from "./utils/midiAnalyzer";
import { langPack } from "./utils/languagePack";
import { HowToUseModal } from "./components/HowToUseModal";
import { LanguageCode, ThemeMode, ToplineNote, SessionContext, ToplinePlan } from "./types";
import { Sparkles, Calendar, Volume2, VolumeX, Play, Square, Music, HelpCircle, Sun, Moon, Globe, Trash2, Sliders, Lock, Unlock, Undo, Redo } from "lucide-react";
import * as Tone from "tone";

const SUPPORTED_PITCHES = [
  { name: "C5", midi: 72, isBlack: false },
  { name: "B4", midi: 71, isBlack: false },
  { name: "A4", midi: 69, isBlack: false },
  { name: "G#4", midi: 68, isBlack: true },
  { name: "G4", midi: 67, isBlack: false },
  { name: "F#4", midi: 66, isBlack: true },
  { name: "F4", midi: 65, isBlack: false },
  { name: "E4", midi: 64, isBlack: false },
  { name: "D#4", midi: 63, isBlack: true },
  { name: "D4", midi: 62, isBlack: false },
  { name: "C#4", midi: 61, isBlack: true },
  { name: "C4", midi: 60, isBlack: false },
  { name: "B3", midi: 59, isBlack: false },
  { name: "A3", midi: 57, isBlack: false },
];

const DRUM_LANES = [
  { name: "Hihat", midi: 42, tag: "Hihat", color: "bg-amber-400 border-amber-500 text-amber-950 dark:text-amber-100" },
  { name: "Clap", midi: 39, tag: "Clap", color: "bg-pink-400 border-pink-500 text-pink-950 dark:text-pink-100" },
  { name: "Snare", midi: 38, tag: "Snare", color: "bg-sky-400 border-sky-500 text-sky-950 dark:text-sky-100" },
  { name: "Kick", midi: 36, tag: "Kick", color: "bg-rose-500 border-rose-600 text-rose-50 dark:text-rose-100" },
];

const SYNTH_LANES = [
  { name: "High", midi: 64, tag: "E4", color: "bg-indigo-400 border-indigo-500 text-indigo-950 dark:text-indigo-100" },
  { name: "Mid-High", midi: 60, tag: "C4", color: "bg-violet-400 border-violet-500 text-violet-950 dark:text-violet-100" },
  { name: "Mid", midi: 57, tag: "A3", color: "bg-purple-400 border-purple-500 text-purple-950 dark:text-purple-100" },
  { name: "Low-Mid", midi: 52, tag: "E3", color: "bg-fuchsia-400 border-fuchsia-500 text-fuchsia-950 dark:text-fuchsia-100" },
  { name: "Bass", midi: 45, tag: "A2", color: "bg-emerald-400 border-emerald-500 text-emerald-950 dark:text-emerald-100" },
];

const LEAD_SYNTH_OPTIONS = [
  { id: "triangle8", nameKo: "✨ 영롱한 벨 (Bell)", nameEn: "✨ Glassy Bell", type: "triangle8" },
  { id: "sine", nameKo: "👄 따뜻한 음색 (Sine Voice)", nameEn: "👄 Pure Sine Voice", type: "sine" },
  { id: "sawtooth", nameKo: "🎸 몽환적인 리드 (Lead)", nameEn: "🎸 Dreamy Saw Lead", type: "sawtooth" },
  { id: "square", nameKo: "👾 8비트 칩튠 (Retro)", nameEn: "👾 Retro Chiptune", type: "square" },
  { id: "sawtooth8", nameKo: "🔊 웅장한 신스 (Fat Buzz)", nameEn: "🔊 Fat Buzz Lead", type: "sawtooth8" }
];

const DEMO_PRESETS_DATA = [
  { id: "trap", nameKo: "힙합 Trap 808", nameEn: "Hip-Hop Trap 808" },
  { id: "lofi", nameKo: "로파이 Lofi Lounge", nameEn: "Lo-Fi Lounge" },
  { id: "house", nameKo: "하우스 Club Plucks", nameEn: "Club Plucks" },
  { id: "synthwave", nameKo: "신스웨이브 Synthwave 80s", nameEn: "80s Retro Synthwave" },
  { id: "kpop", nameKo: "K-Pop 퓨처 베이스", nameEn: "K-Pop Future Bass" },
  { id: "ballad", nameKo: "감성 발라드 피아노", nameEn: "Emotional Pop Ballad" },
  { id: "afrobeat", nameKo: "아프로비트 댄스", nameEn: "Sunset Afrobeat" },
  { id: "rnb", nameKo: "R&B 네오 소울", nameEn: "R&B Neo Soul" },
  { id: "ukdrill", nameKo: "UK 드릴 그라임", nameEn: "UK Drill / Grime" },
  { id: "techno", nameKo: "베를린 테크노", nameEn: "Peak Berliner Techno" },
  { id: "reggaeton", nameKo: "레게톤 라틴 댄스", nameEn: "Latin Reggaeton Caliente" },
  { id: "futurerave", nameKo: "퓨처 레이브 EDM", nameEn: "Epic Future Rave Pulse" },
  { id: "dnb", nameKo: "드럼앤베이스 정글", nameEn: "Fast Drum & Bass Jungle" },
  { id: "hyperpop", nameKo: "하이퍼팝 글리치", nameEn: "Glitchy Hyperpop Candy" },
  { id: "indierock", nameKo: "포스트펑크 인디 록", nameEn: "Post-Punk Indie Rock" },
  { id: "folk", nameKo: "어쿠스틱 포크 캠프", nameEn: "Tender Acoustic Folk" },
  { id: "ambient", nameKo: "우주 미니멀 앰비언트", nameEn: "Cosmic Minimal Ambient" },
  { id: "discofunk", nameKo: "레트로 디스코 펑크", nameEn: "70s Retro Disco Funk" },
  { id: "citypop", nameKo: "시티 팝 드라이브", nameEn: "City Pop Drive" },
  { id: "jerseyclub", nameKo: "저지 클럽 바운스", nameEn: "Newark Jersey Club Bounce" },
];

function isPitchInScale(midi: number, scaleName: string): boolean {
  const scaleRoot = scaleName.split(" ")[0]; // e.g. "C", "A#", "G"
  const isMinor = scaleName.toLowerCase().includes("minor");
  
  const pitchesStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rootIndex = pitchesStr.indexOf(scaleRoot);
  if (rootIndex === -1) return true; // fallback
  
  const pitchOffset = (midi - rootIndex) % 12;
  const normalizedOffset = pitchOffset < 0 ? pitchOffset + 12 : pitchOffset;
  
  // Standard Minor/Major scale intervals
  const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  return intervals.includes(normalizedOffset);
}

// Check if it is the root tonic pitch of the scale
function isRootPitch(midi: number, scaleName: string): boolean {
  const scaleRoot = scaleName.split(" ")[0];
  const pitchesStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rootIndex = pitchesStr.indexOf(scaleRoot);
  if (rootIndex === -1) return false;
  return (midi - rootIndex) % 12 === 0;
}

// High-precision Linear Congruential Generator for robust, seed-based determinism
function getSeededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  let state = Math.abs(h) || 123456789;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Helper convert percentage to dB decibel scale for Tone Volume node
function percentToDb(percent: number, baseQuietDb: number = -36, maxDb: number = 0): number {
  if (percent <= 0) return -Infinity;
  return baseQuietDb + (percent / 100) * (maxDb - baseQuietDb);
}

export default function App() {
  const [lang, setLang] = useState<LanguageCode>("ko");
  const [theme, setTheme] = useState<ThemeMode>("night");
  
  // Dashboard parsed metadata
  const [drumFileName, setDrumFileName] = useState<string>("");
  const [drumStatus, setDrumStatus] = useState<"default" | "loaded">("default");
  
  const [synthFileName, setSynthFileName] = useState<string>("");
  const [synthStatus, setSynthStatus] = useState<"default" | "loaded">("default");

  const [multitrackFileName, setMultitrackFileName] = useState<string>("");
  const [multitrackStatus, setMultitrackStatus] = useState<"default" | "loaded">("default");

  const [bpm, setBpm] = useState<number>(120);
  const [genre, setGenre] = useState<string>("미지정");
  const [scale, setScale] = useState<string>("C Major");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState<boolean>(false);
  const [leadSynthType, setLeadSynthType] = useState<string>("triangle8");

  // New features states
  const [humanizePercent, setHumanizePercent] = useState<number>(0);
  const [gridToolMode, setGridToolMode] = useState<"select" | "brush" | "eraser">("select");
  const [isMouseDownOnGrid, setIsMouseDownOnGrid] = useState<boolean>(false);
  const lastPaintedCellRef = useRef<{ step: number; midi: number } | null>(null);

  const [midiBriefing, setMidiBriefing] = useState<{
    fileName: string;
    bpm: number;
    scale: string;
    genre: string;
    duration: number;
    notesCount: number;
    octaveRange: string;
    tracksCount: number;
  } | null>(null);

  const calculateOctaveRange = (analyzedNotes: Array<{ midi: number }>) => {
    if (!analyzedNotes || analyzedNotes.length === 0) return "-";
    const midis = analyzedNotes.map(n => n.midi);
    const minMidi = Math.min(...midis);
    const maxMidi = Math.max(...midis);
    
    const midiToNoteName = (midiVal: number) => {
      const notesNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const name = notesNames[midiVal % 12];
      const octave = Math.floor(midiVal / 12) - 1;
      return `${name}${octave}`;
    };
    
    return `${midiToNoteName(minMidi)} ~ ${midiToNoteName(maxMidi)} (Octave ${Math.floor(minMidi / 12) - 1} - ${Math.floor(maxMidi / 12) - 1})`;
  };
  
  // Controls
  const [creationMode, setCreationMode] = useState<"ai" | "manual">("ai");
  const [styleSlider, setStyleSlider] = useState<number>(5); // 1 to 10
  const [seed, setSeed] = useState<string>("#5489");
  const [barMode, setBarMode] = useState<1 | 2 | 3 | 4>(4);
  const [drawDuration, setDrawDuration] = useState<number>(1); // default 1 step (16th note)

  // Bar Lock State for selective regeneration
  const [lockedBars, setLockedBars] = useState<boolean[]>([false, false, false, false]);

  // Note dragging editing state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const dragInitialRef = useRef<{ step: number; midi: number; hasMoved: boolean } | null>(null);

  // Piano Roll active notes state
  const [notes, setNotes] = useState<ToplineNote[]>([]);

  // Individual Note Editing Popup state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // [History States for Undo/Redo Engine]
  const [history, setHistory] = useState<ToplineNote[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyRef = useRef<ToplineNote[][]>([]);
  const historyIndexRef = useRef<number>(-1);

  // [DAW Channel Mixer Board States]
  const [mixerVolumeLead, setMixerVolumeLead] = useState<number>(80); // percentage (0 - 100%)
  const [mixerVolumeDrums, setMixerVolumeDrums] = useState<number>(80);
  const [mixerVolumeSynth, setMixerVolumeSynth] = useState<number>(75);
  const [mixerVolumeClick, setMixerVolumeClick] = useState<number>(50);

  const [mixerMuteLead, setMixerMuteLead] = useState<boolean>(false);
  const [mixerMuteDrums, setMixerMuteDrums] = useState<boolean>(false);
  const [mixerMuteSynth, setMixerMuteSynth] = useState<boolean>(false);
  const [mixerMuteClick, setMixerMuteClick] = useState<boolean>(false);

  // Scale Snap Transposition State
  const [snapTransposeToScale, setSnapTransposeToScale] = useState<boolean>(true);

  // [DAW Mixer Refs for fast scheduler lookup to completely avoid rendering stutters]
  const volumeLeadRef = useRef<number>(80);
  const volumeDrumsRef = useRef<number>(80);
  const volumeSynthRef = useRef<number>(75);
  const volumeClickRef = useRef<number>(50);

  const muteLeadRef = useRef<boolean>(false);
  const muteDrumsRef = useRef<boolean>(false);
  const muteSynthRef = useRef<boolean>(false);
  const muteClickRef = useRef<boolean>(false);

  // Keep refs synchronized
  useEffect(() => {
    volumeLeadRef.current = mixerVolumeLead;
    volumeDrumsRef.current = mixerVolumeDrums;
    volumeSynthRef.current = mixerVolumeSynth;
    volumeClickRef.current = mixerVolumeClick;

    muteLeadRef.current = mixerMuteLead;
    muteDrumsRef.current = mixerMuteDrums;
    muteSynthRef.current = mixerMuteSynth;
    muteClickRef.current = mixerMuteClick;
  }, [mixerVolumeLead, mixerVolumeDrums, mixerVolumeSynth, mixerVolumeClick, mixerMuteLead, mixerMuteDrums, mixerMuteSynth, mixerMuteClick]);

  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  // Push target notes state into history
  const pushToHistory = (currentNotesList?: ToplineNote[]) => {
    const listToPush = currentNotesList || notes;
    const snap = listToPush.map(n => ({ ...n }));
    
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyIndexRef.current + 1);
      nextHistory.push(snap);
      if (nextHistory.length > 50) {
        nextHistory.shift(); // keep size at 50 max
      }
      return nextHistory;
    });
    setHistoryIndex(prev => {
      const nextIdx = historyIndexRef.current + 1;
      return nextIdx >= 50 ? 49 : nextIdx;
    });
  };

  const undo = () => {
    if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1;
      setHistoryIndex(newIndex);
      setNotes(historyRef.current[newIndex].map(n => ({ ...n })));
      setEditingNoteId(null);
    }
  };

  const redo = () => {
    if (historyRef.current.length > 0 && historyIndexRef.current < historyRef.current.length - 1) {
      const newIndex = historyIndexRef.current + 1;
      setHistoryIndex(newIndex);
      setNotes(historyRef.current[newIndex].map(n => ({ ...n })));
      setEditingNoteId(null);
    }
  };

  // Drum Track (Kick, Snare, Hihat, Clap) active notes state
  const [drumNotes, setDrumNotes] = useState<ToplineNote[]>([]);

  // Synth Chords track active notes state
  const [synthNotes, setSynthNotes] = useState<ToplineNote[]>([]);

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlaybackStep, setCurrentPlaybackStep] = useState<number>(-1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  
  // High-performance backing multi-track players
  const drumKickRef = useRef<Tone.MembraneSynth[] | null>(null);
  const drumSnareRef = useRef<Tone.Synth[] | null>(null);
  const drumHatRef = useRef<Tone.MetalSynth[] | null>(null);
  const drumKickIdx = useRef<number>(0);
  const drumSnareIdx = useRef<number>(0);
  const drumHatIdx = useRef<number>(0);
  const backingSynthRef = useRef<Tone.PolySynth | null>(null);

  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const playbackIntervalRef = useRef<any>(null);

  // High performance real-time synchronization refs to prevent stale state closure issues
  const isStartingPreviewRef = useRef<boolean>(false);
  const playbackCancelledRef = useRef<boolean>(false);
  const clickSynthRef = useRef<Tone.Synth | null>(null);
  const bpmRef = useRef<number>(bpm);
  const barModeRef = useRef<1 | 2 | 3 | 4>(barMode);
  const notesRef = useRef<ToplineNote[]>(notes);
  const drumNotesRef = useRef<ToplineNote[]>(drumNotes);
  const synthNotesRef = useRef<ToplineNote[]>(synthNotes);
  const humanizePercentRef = useRef<number>(humanizePercent);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { barModeRef.current = barMode; }, [barMode]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { drumNotesRef.current = drumNotes; }, [drumNotes]);
  useEffect(() => { synthNotesRef.current = synthNotes; }, [synthNotes]);
  useEffect(() => { humanizePercentRef.current = humanizePercent; }, [humanizePercent]);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.set({
        oscillator: { type: leadSynthType as any }
      });
    }
  }, [leadSynthType]);

  // Seamlessly adapt playback immediately when BPM or Loop Length changes
  useEffect(() => {
    if (isPlaying) {
      stopPreview();
      const timer = setTimeout(() => {
        playPreview();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [bpm, barMode]);

  // Keep theme attribute updated on html element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Register Global Keyboard Event Listeners for Undo / Redo (Optimized)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "SELECT" || activeEl.tagName === "TEXTAREA" || activeEl.getAttribute("contenteditable") === "true")) {
        return;
      }
      
      const isZ = e.key.toLowerCase() === "z";
      const isY = e.key.toLowerCase() === "y";
      
      if ((e.ctrlKey || e.metaKey) && isZ) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && isY) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync DAW mixer volumes directly to active Tone.js players in real-time
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = mixerMuteLead ? -Infinity : percentToDb(mixerVolumeLead, -32, 2);
    }
  }, [mixerVolumeLead, mixerMuteLead]);

  useEffect(() => {
    if (backingSynthRef.current) {
      backingSynthRef.current.volume.value = mixerMuteSynth ? -Infinity : percentToDb(mixerVolumeSynth, -36, 0);
    }
  }, [mixerVolumeSynth, mixerMuteSynth]);

  useEffect(() => {
    const vol = mixerMuteDrums ? -Infinity : percentToDb(mixerVolumeDrums, -30, 2);
    if (drumKickRef.current) {
      drumKickRef.current.forEach(s => { s.volume.value = vol - 2; });
    }
    if (drumSnareRef.current) {
      drumSnareRef.current.forEach(s => { s.volume.value = vol - 5; });
    }
    if (drumHatRef.current) {
      drumHatRef.current.forEach(s => { s.volume.value = vol - 12; });
    }
  }, [mixerVolumeDrums, mixerMuteDrums]);

  useEffect(() => {
    if (clickSynthRef.current) {
      clickSynthRef.current.volume.value = mixerMuteClick ? -Infinity : percentToDb(mixerVolumeClick, -40, -10);
    }
  }, [mixerVolumeClick, mixerMuteClick]);

  // Initialize languages
  const p = langPack[lang];

  const loopPatternToFullLength = (rawNotes: ToplineNote[], targetLength: number = 64) => {
    if (!rawNotes || rawNotes.length === 0) return [];
    
    let maxStep = 0;
    rawNotes.forEach(n => {
      const end = n.step + (n.durationSteps || 1);
      if (end > maxStep) maxStep = end;
    });
    
    let patternLength = 16;
    if (maxStep > 16) {
      patternLength = 32;
    }
    if (maxStep > 32) {
      patternLength = 64;
    }
    
    const looped: ToplineNote[] = [];
    for (let offset = 0; offset < targetLength; offset += patternLength) {
      rawNotes.forEach(n => {
        const newStep = n.step + offset;
        if (newStep < targetLength) {
          looped.push({
            ...n,
            id: `${n.id}-loop-${offset}-${Math.random()}`,
            step: newStep
          });
        }
      });
    }
    return looped;
  };

  // Helper trigger to load sample preset MIDIs
  const loadPresetDemo = (presetType: string) => {
    setSelectedPreset(presetType);
    loadPresetDemoRaw(
      presetType,
      (notesList) => setDrumNotes(loopPatternToFullLength(notesList, barMode * 16)),
      (notesList) => setSynthNotes(loopPatternToFullLength(notesList, barMode * 16)),
      (notesList) => setNotes(loopPatternToFullLength(notesList, barMode * 16))
    );
  };

  const loadPresetDemoRaw = (
    presetType: string,
    setDrumNotes: (notes: ToplineNote[]) => void,
    setSynthNotes: (notes: ToplineNote[]) => void,
    setNotes: (notes: ToplineNote[]) => void
  ) => {
    if (presetType === "trap") {
      setDrumFileName("Trap_Drum_Heavy_808.mid");
      setSynthFileName("Trap_Ambient_Chords_Fmin.mid");
      setBpm(135);
      setGenre(lang === "ko" ? "힙합 (Trap/Hip-Hop)" : "Trap/Hip-Hop Layout");
      setScale("F Minor");
      setNotes([
        { id: "t1", midi: 65, pitchName: "F4", step: 0, durationSteps: 2 },
        { id: "t2", midi: 68, pitchName: "G#4", step: 2, durationSteps: 1 },
        { id: "t3", midi: 65, pitchName: "F4", step: 3, durationSteps: 2, isRest: true },
        { id: "t4", midi: 72, pitchName: "C5", step: 5, durationSteps: 3 },
        { id: "t5", midi: 71, pitchName: "B4", step: 8, durationSteps: 1 },
        { id: "t6", midi: 68, pitchName: "G#4", step: 9, durationSteps: 2 },
        { id: "t7", midi: 60, pitchName: "C4", step: 12, durationSteps: 4, isRest: true },
      ]);
      setDrumNotes([
        { id: "tdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "tdh-1", midi: 42, pitchName: "Hihat", step: 1, durationSteps: 1 },
        { id: "tdh-2", midi: 42, pitchName: "Hihat", step: 2, durationSteps: 1 },
        { id: "tdh-3", midi: 42, pitchName: "Hihat", step: 3, durationSteps: 1 },
        { id: "tds-4", midi: 38, pitchName: "Snare", step: 4, durationSteps: 1 },
        { id: "tdh-5", midi: 42, pitchName: "Hihat", step: 5, durationSteps: 1 },
        { id: "tdk-6", midi: 36, pitchName: "Kick", step: 6, durationSteps: 1 },
        { id: "tdh-7", midi: 42, pitchName: "Hihat", step: 7, durationSteps: 1 },
        { id: "tdh-8", midi: 42, pitchName: "Hihat", step: 8, durationSteps: 1 },
        { id: "tdk-10", midi: 36, pitchName: "Kick", step: 10, durationSteps: 1 },
        { id: "tds-12", midi: 38, pitchName: "Snare", step: 12, durationSteps: 1 },
        { id: "tdh-14", midi: 42, pitchName: "Hihat", step: 14, durationSteps: 1 },
        { id: "tdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "tds-20", midi: 38, pitchName: "Snare", step: 20, durationSteps: 1 },
        { id: "tdk-22", midi: 36, pitchName: "Kick", step: 22, durationSteps: 1 },
        { id: "tds-28", midi: 38, pitchName: "Snare", step: 28, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "tsy-0", midi: 53, pitchName: "F3", step: 0, durationSteps: 8 },
        { id: "tsy-1", midi: 56, pitchName: "Ab3", step: 0, durationSteps: 8 },
        { id: "tsy-2", midi: 60, pitchName: "C4", step: 0, durationSteps: 8 },
        { id: "tsy-3", midi: 51, pitchName: "Eb3", step: 8, durationSteps: 8 },
        { id: "tsy-4", midi: 55, pitchName: "G3", step: 8, durationSteps: 8 },
        { id: "tsy-5", midi: 60, pitchName: "C4", step: 8, durationSteps: 8 },
        { id: "tsy-6", midi: 53, pitchName: "F3", step: 16, durationSteps: 16 },
        { id: "tsy-7", midi: 56, pitchName: "Ab3", step: 16, durationSteps: 16 },
        { id: "tsy-8", midi: 60, pitchName: "C4", step: 16, durationSteps: 16 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "lofi") {
      setDrumFileName("Lofi_Acoustic_Snare_Loop.mid");
      setSynthFileName("Lofi_FenderRhodes_Chords.mid");
      setBpm(80);
      setGenre(lang === "ko" ? "로파이 (Lo-Fi Chill)" : "Lo-Fi Lounge");
      setScale("C Major");
      setNotes([
        { id: "l1", midi: 60, pitchName: "C4", step: 0, durationSteps: 3 },
        { id: "l2", midi: 64, pitchName: "E4", step: 3, durationSteps: 2 },
        { id: "l3", midi: 67, pitchName: "G4", step: 5, durationSteps: 3, isRest: true },
        { id: "l4", midi: 69, pitchName: "A4", step: 8, durationSteps: 2 },
        { id: "l5", midi: 72, pitchName: "C5", step: 10, durationSteps: 2 },
        { id: "l6", midi: 64, pitchName: "E4", step: 12, durationSteps: 4, isRest: true },
      ]);
      setDrumNotes([
        { id: "ldk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "ldh-2", midi: 42, pitchName: "Hihat", step: 2, durationSteps: 1 },
        { id: "lds-4", midi: 38, pitchName: "Snare", step: 4, durationSteps: 1 },
        { id: "ldh-6", midi: 42, pitchName: "Hihat", step: 6, durationSteps: 1 },
        { id: "ldk-10", midi: 36, pitchName: "Kick", step: 10, durationSteps: 1 },
        { id: "lds-12", midi: 38, pitchName: "Snare", step: 12, durationSteps: 1 },
        { id: "ldh-14", midi: 42, pitchName: "Hihat", step: 14, durationSteps: 1 },
        { id: "ldk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "lds-20", midi: 38, pitchName: "Snare", step: 20, durationSteps: 1 },
        { id: "ldk-26", midi: 36, pitchName: "Kick", step: 26, durationSteps: 1 },
        { id: "lds-28", midi: 38, pitchName: "Snare", step: 28, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "lsy-0", midi: 48, pitchName: "C3", step: 0, durationSteps: 8 },
        { id: "lsy-1", midi: 52, pitchName: "E3", step: 0, durationSteps: 8 },
        { id: "lsy-2", midi: 55, pitchName: "G3", step: 0, durationSteps: 8 },
        { id: "lsy-3", midi: 59, pitchName: "B3", step: 0, durationSteps: 8 },
        { id: "lsy-4", midi: 45, pitchName: "A2", step: 8, durationSteps: 8 },
        { id: "lsy-5", midi: 48, pitchName: "C3", step: 8, durationSteps: 8 },
        { id: "lsy-6", midi: 52, pitchName: "E3", step: 8, durationSteps: 8 },
        { id: "lsy-7", midi: 57, pitchName: "A3", step: 8, durationSteps: 8 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "house") {
      setDrumFileName("House_4onTheFloor_Beat.mid");
      setSynthFileName("FM_Pluck_Club_Progression.mid");
      setBpm(126);
      setGenre(lang === "ko" ? "댄스/하우스 (Dance/House)" : "Dance/House Rhythm");
      setScale("D Minor");
      setNotes([
        { id: "h1", midi: 62, pitchName: "D4", step: 0, durationSteps: 1 },
        { id: "h2", midi: 65, pitchName: "F4", step: 1, durationSteps: 1 },
        { id: "h3", midi: 69, pitchName: "A4", step: 2, durationSteps: 2 },
        { id: "h4", midi: 62, pitchName: "D4", step: 4, durationSteps: 1, isRest: true },
        { id: "h5", midi: 72, pitchName: "C5", step: 5, durationSteps: 2 },
        { id: "h6", midi: 69, pitchName: "A4", step: 7, durationSteps: 1 },
        { id: "h7", midi: 67, pitchName: "G4", step: 8, durationSteps: 2 },
        { id: "h8", midi: 62, pitchName: "D4", step: 10, durationSteps: 2, isRest: true },
      ]);
      setDrumNotes([
        { id: "hdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "hdk-4", midi: 36, pitchName: "Kick", step: 4, durationSteps: 1 },
        { id: "hdk-8", midi: 36, pitchName: "Kick", step: 8, durationSteps: 1 },
        { id: "hdk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
        { id: "hdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "hdk-20", midi: 36, pitchName: "Kick", step: 20, durationSteps: 1 },
        { id: "hdk-24", midi: 36, pitchName: "Kick", step: 24, durationSteps: 1 },
        { id: "hdk-28", midi: 36, pitchName: "Kick", step: 28, durationSteps: 1 },
        { id: "hdh-2", midi: 42, pitchName: "Hihat", step: 2, durationSteps: 1 },
        { id: "hdh-6", midi: 42, pitchName: "Hihat", step: 6, durationSteps: 1 },
        { id: "hdh-10", midi: 42, pitchName: "Hihat", step: 10, durationSteps: 1 },
        { id: "hdh-14", midi: 42, pitchName: "Hihat", step: 14, durationSteps: 1 },
        { id: "hdh-18", midi: 42, pitchName: "Hihat", step: 18, durationSteps: 1 },
        { id: "hdh-22", midi: 42, pitchName: "Hihat", step: 22, durationSteps: 1 },
        { id: "hdh-26", midi: 42, pitchName: "Hihat", step: 26, durationSteps: 1 },
        { id: "hdh-30", midi: 42, pitchName: "Hihat", step: 30, durationSteps: 1 },
        { id: "hdc-4", midi: 39, pitchName: "Clap", step: 4, durationSteps: 1 },
        { id: "hdc-12", midi: 39, pitchName: "Clap", step: 12, durationSteps: 1 },
        { id: "hdc-20", midi: 39, pitchName: "Clap", step: 20, durationSteps: 1 },
        { id: "hdc-28", midi: 39, pitchName: "Clap", step: 28, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "hsy-0", midi: 50, pitchName: "D3", step: 0, durationSteps: 3 },
        { id: "hsy-1", midi: 53, pitchName: "F3", step: 0, durationSteps: 3 },
        { id: "hsy-2", midi: 57, pitchName: "A3", step: 0, durationSteps: 3 },
        { id: "hsy-3", midi: 48, pitchName: "C3", step: 4, durationSteps: 2 },
        { id: "hsy-4", midi: 52, pitchName: "E3", step: 4, durationSteps: 2 },
        { id: "hsy-5", midi: 50, pitchName: "D3", step: 8, durationSteps: 4 },
        { id: "hsy-6", midi: 53, pitchName: "F3", step: 8, durationSteps: 4 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "synthwave") {
      setDrumFileName("Synthwave_Dreamy_GateDrums.mid");
      setSynthFileName("Synthwave_Analog_80sPad.mid");
      setBpm(115);
      setGenre(lang === "ko" ? "신스웨이브 (Retro Synthwave)" : "Retro Synthwave");
      setScale("A Minor");
      setNotes([
        { id: "sw1", midi: 64, pitchName: "E4", step: 0, durationSteps: 4 },
        { id: "sw2", midi: 67, pitchName: "G4", step: 4, durationSteps: 4 },
        { id: "sw3", midi: 69, pitchName: "A4", step: 8, durationSteps: 4 },
        { id: "sw4", midi: 71, pitchName: "B4", step: 12, durationSteps: 4 },
        { id: "sw5", midi: 69, pitchName: "A4", step: 16, durationSteps: 8 },
      ]);
      setDrumNotes([
        { id: "swdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "swdk-4", midi: 36, pitchName: "Kick", step: 4, durationSteps: 1 },
        { id: "swdk-8", midi: 36, pitchName: "Kick", step: 8, durationSteps: 1 },
        { id: "swdk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
        { id: "swdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "swdk-20", midi: 36, pitchName: "Kick", step: 20, durationSteps: 1 },
        { id: "swdk-24", midi: 36, pitchName: "Kick", step: 24, durationSteps: 1 },
        { id: "swdk-28", midi: 36, pitchName: "Kick", step: 28, durationSteps: 1 },
        { id: "swdc-4", midi: 38, pitchName: "Snare", step: 4, durationSteps: 1 },
        { id: "swdc-12", midi: 38, pitchName: "Snare", step: 12, durationSteps: 1 },
        { id: "swdc-20", midi: 38, pitchName: "Snare", step: 20, durationSteps: 1 },
        { id: "swdc-28", midi: 38, pitchName: "Snare", step: 28, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "swsy-0", midi: 45, pitchName: "A2", step: 0, durationSteps: 8 },
        { id: "swsy-1", midi: 48, pitchName: "C3", step: 0, durationSteps: 8 },
        { id: "swsy-2", midi: 52, pitchName: "E3", step: 0, durationSteps: 8 },
        { id: "swsy-3", midi: 43, pitchName: "G2", step: 8, durationSteps: 8 },
        { id: "swsy-4", midi: 47, pitchName: "B2", step: 8, durationSteps: 8 },
        { id: "swsy-5", midi: 50, pitchName: "D3", step: 8, durationSteps: 8 },
        { id: "swsy-6", midi: 41, pitchName: "F2", step: 16, durationSteps: 16 },
        { id: "swsy-7", midi: 45, pitchName: "A2", step: 16, durationSteps: 16 },
        { id: "swsy-8", midi: 48, pitchName: "C3", step: 16, durationSteps: 16 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "kpop") {
      setDrumFileName("KPop_Upbeat_DanceBeat.mid");
      setSynthFileName("KPop_FutureBass_WallPower.mid");
      setBpm(128);
      setGenre(lang === "ko" ? "K-Pop 댄스 (Future Bass)" : "K-Pop Future Bass");
      setScale("F Major");
      setNotes([
        { id: "kp1", midi: 69, pitchName: "A4", step: 0, durationSteps: 2 },
        { id: "kp2", midi: 72, pitchName: "C5", step: 2, durationSteps: 2 },
        { id: "kp3", midi: 74, pitchName: "D5", step: 4, durationSteps: 2 },
        { id: "kp4", midi: 72, pitchName: "C5", step: 6, durationSteps: 4 },
        { id: "kp5", midi: 69, pitchName: "A4", step: 10, durationSteps: 2 },
        { id: "kp6", midi: 67, pitchName: "G4", step: 12, durationSteps: 4 },
      ]);
      setDrumNotes([
        { id: "kpdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "kpdk-6", midi: 36, pitchName: "Kick", step: 6, durationSteps: 1 },
        { id: "kpdk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
        { id: "kpdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "kpdk-22", midi: 36, pitchName: "Kick", step: 22, durationSteps: 1 },
        { id: "kpdk-28", midi: 36, pitchName: "Kick", step: 28, durationSteps: 1 },
        { id: "kpds-8", midi: 38, pitchName: "Snare", step: 8, durationSteps: 1 },
        { id: "kpds-24", midi: 38, pitchName: "Snare", step: 24, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "kpsy-0", midi: 53, pitchName: "F3", step: 0, durationSteps: 6 },
        { id: "kpsy-1", midi: 57, pitchName: "A3", step: 0, durationSteps: 6 },
        { id: "kpsy-2", midi: 60, pitchName: "C4", step: 0, durationSteps: 6 },
        { id: "kpsy-3", midi: 64, pitchName: "E4", step: 0, durationSteps: 6 },
        { id: "kpsy-4", midi: 55, pitchName: "G3", step: 6, durationSteps: 10 },
        { id: "kpsy-5", midi: 59, pitchName: "B3", step: 6, durationSteps: 10 },
        { id: "kpsy-6", midi: 62, pitchName: "D4", step: 6, durationSteps: 10 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "ballad") {
      setDrumFileName("Ballad_SoftAcoustic_Brush.mid");
      setSynthFileName("Ballad_GrandPiano_Chords.mid");
      setBpm(70);
      setGenre(lang === "ko" ? "감성 발라드 (Pop Ballad)" : "Pop Ballad Piano");
      setScale("C Major");
      setNotes([
        { id: "ba1", midi: 67, pitchName: "G4", step: 0, durationSteps: 6 },
        { id: "ba2", midi: 69, pitchName: "A4", step: 8, durationSteps: 4 },
        { id: "ba3", midi: 71, pitchName: "B4", step: 12, durationSteps: 2 },
        { id: "ba4", midi: 72, pitchName: "C5", step: 16, durationSteps: 8 },
      ]);
      setDrumNotes([
        { id: "badk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "bads-8", midi: 38, pitchName: "Snare", step: 8, durationSteps: 1 },
        { id: "badk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "basy-0", midi: 48, pitchName: "C3", step: 0, durationSteps: 8 },
        { id: "basy-1", midi: 52, pitchName: "E3", step: 0, durationSteps: 8 },
        { id: "basy-2", midi: 55, pitchName: "G3", step: 0, durationSteps: 8 },
        { id: "basy-3", midi: 47, pitchName: "B2", step: 8, durationSteps: 8 },
        { id: "basy-4", midi: 50, pitchName: "D3", step: 8, durationSteps: 8 },
        { id: "basy-5", midi: 55, pitchName: "G3", step: 8, durationSteps: 8 },
        { id: "basy-6", midi: 45, pitchName: "A2", step: 16, durationSteps: 8 },
        { id: "basy-7", midi: 48, pitchName: "C3", step: 16, durationSteps: 8 },
        { id: "basy-8", midi: 52, pitchName: "E3", step: 16, durationSteps: 8 },
        { id: "basy-9", midi: 41, pitchName: "F2", step: 24, durationSteps: 8 },
        { id: "basy-10", midi: 45, pitchName: "A2", step: 24, durationSteps: 8 },
        { id: "basy-11", midi: 48, pitchName: "C3", step: 24, durationSteps: 8 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "afrobeat") {
      setDrumFileName("Afrobeat_Syncopated_Rhythm.mid");
      setSynthFileName("Afrobeat_WarmEpiano_Chops.mid");
      setBpm(105);
      setGenre(lang === "ko" ? "아프로비트 (Afrobeat Modern)" : "Afrobeat Modern");
      setScale("A Minor");
      setNotes([
        { id: "af1", midi: 64, pitchName: "E4", step: 2, durationSteps: 2 },
        { id: "af2", midi: 69, pitchName: "A4", step: 4, durationSteps: 2 },
        { id: "af3", midi: 67, pitchName: "G4", step: 6, durationSteps: 2 },
        { id: "af4", midi: 64, pitchName: "E4", step: 8, durationSteps: 2 },
        { id: "af5", midi: 60, pitchName: "C4", step: 10, durationSteps: 2 },
      ]);
      setDrumNotes([
        { id: "afdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "afdk-6", midi: 36, pitchName: "Kick", step: 6, durationSteps: 1 },
        { id: "afdk-10", midi: 36, pitchName: "Kick", step: 10, durationSteps: 1 },
        { id: "afkick-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "afkick-22", midi: 36, pitchName: "Kick", step: 22, durationSteps: 1 },
        { id: "afkick-26", midi: 36, pitchName: "Kick", step: 26, durationSteps: 1 },
        { id: "afds-6", midi: 38, pitchName: "Snare", step: 6, durationSteps: 1 },
        { id: "afds-14", midi: 38, pitchName: "Snare", step: 14, durationSteps: 1 },
        { id: "afds-22", midi: 38, pitchName: "Snare", step: 22, durationSteps: 1 },
        { id: "afds-30", midi: 38, pitchName: "Snare", step: 30, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "afsy-0", midi: 45, pitchName: "A2", step: 0, durationSteps: 12 },
        { id: "afsy-1", midi: 48, pitchName: "C3", step: 0, durationSteps: 12 },
        { id: "afsy-2", midi: 52, pitchName: "E3", step: 0, durationSteps: 12 },
        { id: "afsy-3", midi: 55, pitchName: "G3", step: 0, durationSteps: 12 },
        { id: "afsy-4", midi: 59, pitchName: "B3", step: 0, durationSteps: 12 },
        { id: "afsy-5", midi: 38, pitchName: "D2", step: 16, durationSteps: 12 },
        { id: "afsy-6", midi: 53, pitchName: "F3", step: 16, durationSteps: 12 },
        { id: "afsy-7", midi: 57, pitchName: "A3", step: 16, durationSteps: 12 },
        { id: "afsy-8", midi: 60, pitchName: "C4", step: 16, durationSteps: 12 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "rnb") {
      setDrumFileName("RnB_Smooth_EighthHats.mid");
      setSynthFileName("RnB_Sexy_Minor9_Keys.mid");
      setBpm(90);
      setGenre(lang === "ko" ? "R&B 네오소울 (Neo Soul Lounge)" : "Neo Soul Lounge");
      setScale("F# Minor");
      setNotes([
        { id: "rn1", midi: 61, pitchName: "C#4", step: 0, durationSteps: 4 },
        { id: "rn2", midi: 64, pitchName: "E4", step: 4, durationSteps: 2 },
        { id: "rn3", midi: 66, pitchName: "F#4", step: 6, durationSteps: 2 },
        { id: "rn4", midi: 69, pitchName: "A4", step: 8, durationSteps: 4 },
        { id: "rn5", midi: 68, pitchName: "G#4", step: 12, durationSteps: 4 },
      ]);
      setDrumNotes([
        { id: "rndk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "rnds-8", midi: 38, pitchName: "Snare", step: 8, durationSteps: 1 },
        { id: "rnds-24", midi: 38, pitchName: "Snare", step: 24, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "rnsy-0", midi: 42, pitchName: "F#2", step: 0, durationSteps: 12 },
        { id: "rnsy-1", midi: 45, pitchName: "A2", step: 0, durationSteps: 12 },
        { id: "rnsy-2", midi: 49, pitchName: "C#3", step: 0, durationSteps: 12 },
        { id: "rnsy-3", midi: 52, pitchName: "E3", step: 0, durationSteps: 12 },
        { id: "rnsy-4", midi: 56, pitchName: "G#3", step: 0, durationSteps: 12 },
        { id: "rnsy-5", midi: 35, pitchName: "B1", step: 16, durationSteps: 12 },
        { id: "rnsy-6", midi: 50, pitchName: "D3", step: 16, durationSteps: 12 },
        { id: "rnsy-7", midi: 54, pitchName: "F#3", step: 16, durationSteps: 12 },
        { id: "rnsy-8", midi: 57, pitchName: "A3", step: 16, durationSteps: 12 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "ukdrill") {
      setDrumFileName("UKDrill_Ghost_HardRolls.mid");
      setSynthFileName("UKDrill_Tense_C#mPad.mid");
      setBpm(140);
      setGenre(lang === "ko" ? "UK 드릴 (UK Drill/Grime)" : "UK Drill/Grime");
      setScale("C# Minor");
      setNotes([
        { id: "dr1", midi: 68, pitchName: "G#4", step: 0, durationSteps: 2 },
        { id: "dr2", midi: 68, pitchName: "G#4", step: 2, durationSteps: 2 },
        { id: "dr3", midi: 68, pitchName: "G#4", step: 4, durationSteps: 2 },
        { id: "dr4", midi: 66, pitchName: "F#4", step: 6, durationSteps: 2 },
        { id: "dr5", midi: 64, pitchName: "E4", step: 8, durationSteps: 4 },
      ]);
      setDrumNotes([
        { id: "drdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "drdk-10", midi: 36, pitchName: "Kick", step: 10, durationSteps: 1 },
        { id: "drdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "drdk-26", midi: 36, pitchName: "Kick", step: 26, durationSteps: 1 },
        { id: "drds-6", midi: 38, pitchName: "Snare", step: 6, durationSteps: 1 },
        { id: "drds-22", midi: 38, pitchName: "Snare", step: 22, durationSteps: 1 },
        { id: "drh-0", midi: 42, pitchName: "Hihat", step: 0, durationSteps: 1 },
        { id: "drh-3", midi: 42, pitchName: "Hihat", step: 3, durationSteps: 1 },
        { id: "drh-4", midi: 42, pitchName: "Hihat", step: 4, durationSteps: 1 },
        { id: "drh-6", midi: 42, pitchName: "Hihat", step: 6, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "drsy-0", midi: 49, pitchName: "C#3", step: 0, durationSteps: 16 },
        { id: "drsy-1", midi: 52, pitchName: "E3", step: 0, durationSteps: 16 },
        { id: "drsy-2", midi: 56, pitchName: "G#3", step: 0, durationSteps: 16 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "techno") {
      setDrumFileName("Techno_4onTheFloor_Industrial.mid");
      setSynthFileName("Techno_Drone_SubOsc.mid");
      setBpm(132);
      setGenre(lang === "ko" ? "테크노 (Berlin Peak Techno)" : "Berlin Peak Techno");
      setScale("G Minor");
      setNotes([
        { id: "tc1", midi: 62, pitchName: "D4", step: 0, durationSteps: 2 },
        { id: "tc2", midi: 62, pitchName: "D4", step: 2, durationSteps: 2 },
        { id: "tc3", midi: 65, pitchName: "F4", step: 4, durationSteps: 2 },
        { id: "tc4", midi: 62, pitchName: "D4", step: 6, durationSteps: 2 },
        { id: "tc5", midi: 60, pitchName: "C4", step: 8, durationSteps: 2 },
        { id: "tc6", midi: 62, pitchName: "D4", step: 10, durationSteps: 2 },
        { id: "tc7", midi: 58, pitchName: "A#3", step: 12, durationSteps: 4 },
      ]);
      setDrumNotes([
        { id: "tcdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "tcdk-4", midi: 36, pitchName: "Kick", step: 4, durationSteps: 1 },
        { id: "tcdk-8", midi: 36, pitchName: "Kick", step: 8, durationSteps: 1 },
        { id: "tcdk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
        { id: "tcdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "tcdk-20", midi: 36, pitchName: "Kick", step: 20, durationSteps: 1 },
        { id: "tcdk-24", midi: 36, pitchName: "Kick", step: 24, durationSteps: 1 },
        { id: "tcdk-28", midi: 36, pitchName: "Kick", step: 28, durationSteps: 1 },
        { id: "tcdh-2", midi: 42, pitchName: "Hihat", step: 2, durationSteps: 1 },
        { id: "tcdh-6", midi: 42, pitchName: "Hihat", step: 6, durationSteps: 1 },
        { id: "tcdh-10", midi: 42, pitchName: "Hihat", step: 10, durationSteps: 1 },
        { id: "tcdh-14", midi: 42, pitchName: "Hihat", step: 14, durationSteps: 1 },
        { id: "tcdh-18", midi: 42, pitchName: "Hihat", step: 18, durationSteps: 1 },
        { id: "tcdh-22", midi: 42, pitchName: "Hihat", step: 22, durationSteps: 1 },
        { id: "tcdh-26", midi: 42, pitchName: "Hihat", step: 26, durationSteps: 1 },
        { id: "tcdh-30", midi: 42, pitchName: "Hihat", step: 30, durationSteps: 1 },
        { id: "tcdb-8", midi: 39, pitchName: "Clap", step: 8, durationSteps: 1 },
        { id: "tcdb-24", midi: 39, pitchName: "Clap", step: 24, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "tcsy-0", midi: 43, pitchName: "G2", step: 0, durationSteps: 32 },
        { id: "tcsy-1", midi: 46, pitchName: "Bb2", step: 0, durationSteps: 32 },
        { id: "tcsy-2", midi: 50, pitchName: "D3", step: 0, durationSteps: 32 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "reggaeton") {
      setDrumFileName("Reggaeton_DemBow_Rhythm.mid");
      setSynthFileName("Reggaeton_Pluck_Progression.mid");
      setBpm(96);
      setGenre(lang === "ko" ? "레게톤 (Latin Reggaeton)" : "Latin Reggaeton Caliente");
      setScale("D Major");
      setNotes([
        { id: "rg1", midi: 66, pitchName: "F#4", step: 0, durationSteps: 3 },
        { id: "rg2", midi: 67, pitchName: "G4", step: 3, durationSteps: 1 },
        { id: "rg3", midi: 69, pitchName: "A4", step: 4, durationSteps: 3 },
        { id: "rg4", midi: 67, pitchName: "G4", step: 7, durationSteps: 1 },
        { id: "rg5", midi: 66, pitchName: "F#4", step: 8, durationSteps: 3 },
        { id: "rg6", midi: 64, pitchName: "E4", step: 11, durationSteps: 5 },
      ]);
      setDrumNotes([
        { id: "rgdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "rgdk-4", midi: 36, pitchName: "Kick", step: 4, durationSteps: 1 },
        { id: "rgdk-8", midi: 36, pitchName: "Kick", step: 8, durationSteps: 1 },
        { id: "rgdk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
        { id: "rgdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "rgdk-20", midi: 36, pitchName: "Kick", step: 20, durationSteps: 1 },
        { id: "rgdk-24", midi: 36, pitchName: "Kick", step: 24, durationSteps: 1 },
        { id: "rgdk-28", midi: 36, pitchName: "Kick", step: 28, durationSteps: 1 },
        { id: "rgds-3", midi: 38, pitchName: "Snare", step: 3, durationSteps: 1 },
        { id: "rgds-7", midi: 38, pitchName: "Snare", step: 7, durationSteps: 1 },
        { id: "rgds-11", midi: 38, pitchName: "Snare", step: 11, durationSteps: 1 },
        { id: "rgds-15", midi: 38, pitchName: "Snare", step: 15, durationSteps: 1 },
        { id: "rgds-19", midi: 38, pitchName: "Snare", step: 19, durationSteps: 1 },
        { id: "rgds-23", midi: 38, pitchName: "Snare", step: 23, durationSteps: 1 },
        { id: "rgds-27", midi: 38, pitchName: "Snare", step: 27, durationSteps: 1 },
        { id: "rgds-31", midi: 38, pitchName: "Snare", step: 31, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "rgsy-0", midi: 50, pitchName: "D3", step: 0, durationSteps: 12 },
        { id: "rgsy-1", midi: 54, pitchName: "F#3", step: 0, durationSteps: 12 },
        { id: "rgsy-2", midi: 57, pitchName: "A3", step: 0, durationSteps: 12 },
        { id: "rgsy-3", midi: 43, pitchName: "G2", step: 16, durationSteps: 12 },
        { id: "rgsy-4", midi: 47, pitchName: "B2", step: 16, durationSteps: 12 },
        { id: "rgsy-5", midi: 50, pitchName: "D3", step: 16, durationSteps: 12 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "futurerave") {
      setDrumFileName("FutureRave_Driving_EDMBeat.mid");
      setSynthFileName("FutureRave_Detuned_Saws.mid");
      setBpm(126);
      setGenre(lang === "ko" ? "퓨처 레이브 (Future Rave Pulse)" : "Future Rave Pulse");
      setScale("E Minor");
      setNotes([
        { id: "fr1", midi: 71, pitchName: "B4", step: 0, durationSteps: 4 },
        { id: "fr2", midi: 76, pitchName: "E5", step: 4, durationSteps: 4 },
        { id: "fr3", midi: 75, pitchName: "D#5", step: 8, durationSteps: 4 },
        { id: "fr4", midi: 71, pitchName: "B4", step: 12, durationSteps: 4 },
        { id: "fr5", midi: 67, pitchName: "G4", step: 16, durationSteps: 8 },
      ]);
      setDrumNotes([
        { id: "frdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "frdk-4", midi: 36, pitchName: "Kick", step: 4, durationSteps: 1 },
        { id: "frdk-8", midi: 36, pitchName: "Kick", step: 8, durationSteps: 1 },
        { id: "frdk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
        { id: "frdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "frdk-20", midi: 36, pitchName: "Kick", step: 20, durationSteps: 1 },
        { id: "frdk-24", midi: 36, pitchName: "Kick", step: 24, durationSteps: 1 },
        { id: "frdk-28", midi: 36, pitchName: "Kick", step: 28, durationSteps: 1 },
        { id: "frds-8", midi: 38, pitchName: "Snare", step: 8, durationSteps: 1 },
        { id: "frds-24", midi: 38, pitchName: "Snare", step: 24, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "frsy-0", midi: 52, pitchName: "E3", step: 0, durationSteps: 8 },
        { id: "frsy-1", midi: 55, pitchName: "G3", step: 0, durationSteps: 8 },
        { id: "frsy-2", midi: 59, pitchName: "B3", step: 0, durationSteps: 8 },
        { id: "frsy-3", midi: 48, pitchName: "C3", step: 8, durationSteps: 8 },
        { id: "frsy-4", midi: 52, pitchName: "E3", step: 8, durationSteps: 8 },
        { id: "frsy-5", midi: 55, pitchName: "G3", step: 8, durationSteps: 8 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "dnb") {
      setDrumFileName("DnB_Jungle_Breakbeat.mid");
      setSynthFileName("DnB_SubBass_LowBlow.mid");
      setBpm(172);
      setGenre(lang === "ko" ? "드럼앤베이스 (Drum & Bass Jungle)" : "Drum & Bass Jungle");
      setScale("B Minor");
      setNotes([
        { id: "db1", midi: 66, pitchName: "F#4", step: 0, durationSteps: 2 },
        { id: "db2", midi: 69, pitchName: "A4", step: 2, durationSteps: 2 },
        { id: "db3", midi: 71, pitchName: "B4", step: 4, durationSteps: 6 },
        { id: "db4", midi: 74, pitchName: "D5", step: 10, durationSteps: 2 },
        { id: "db5", midi: 71, pitchName: "B4", step: 12, durationSteps: 4 },
      ]);
      setDrumNotes([
        { id: "dbdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "dbdk-10", midi: 36, pitchName: "Kick", step: 10, durationSteps: 1 },
        { id: "dbdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "dbdk-26", midi: 36, pitchName: "Kick", step: 26, durationSteps: 1 },
        { id: "dbds-4", midi: 38, pitchName: "Snare", step: 4, durationSteps: 1 },
        { id: "dbds-12", midi: 38, pitchName: "Snare", step: 12, durationSteps: 1 },
        { id: "dbds-20", midi: 38, pitchName: "Snare", step: 20, durationSteps: 1 },
        { id: "dbds-28", midi: 38, pitchName: "Snare", step: 28, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "dbsy-0", midi: 47, pitchName: "B2", step: 0, durationSteps: 16 },
        { id: "dbsy-1", midi: 50, pitchName: "D3", step: 0, durationSteps: 16 },
        { id: "dbsy-2", midi: 54, pitchName: "F#3", step: 0, durationSteps: 16 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "hyperpop") {
      setDrumFileName("Hyperpop_Glitchy_DigitalBeat.mid");
      setSynthFileName("Hyperpop_Saturated_Buzz.mid");
      setBpm(155);
      setGenre(lang === "ko" ? "하이퍼팝 (Hyperpop Candy)" : "Hyperpop Candy");
      setScale("C Major");
      setNotes([
        { id: "hp1", midi: 72, pitchName: "C5", step: 0, durationSteps: 2 },
        { id: "hp2", midi: 76, pitchName: "E5", step: 2, durationSteps: 2 },
        { id: "hp3", midi: 79, pitchName: "G5", step: 4, durationSteps: 2 },
        { id: "hp4", midi: 77, pitchName: "F5", step: 6, durationSteps: 2 },
        { id: "hp5", midi: 76, pitchName: "E5", step: 8, durationSteps: 2 },
        { id: "hp6", midi: 74, pitchName: "D5", step: 10, durationSteps: 6 },
      ]);
      setDrumNotes([
        { id: "hpdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "hpdk-4", midi: 36, pitchName: "Kick", step: 4, durationSteps: 1 },
        { id: "hpdk-10", midi: 36, pitchName: "Kick", step: 10, durationSteps: 1 },
        { id: "hpdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "hpdk-20", midi: 36, pitchName: "Kick", step: 20, durationSteps: 1 },
        { id: "hpdk-26", midi: 36, pitchName: "Kick", step: 26, durationSteps: 1 },
        { id: "hpds-8", midi: 38, pitchName: "Snare", step: 8, durationSteps: 1 },
        { id: "hpds-24", midi: 38, pitchName: "Snare", step: 24, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "hpsy-0", midi: 48, pitchName: "C3", step: 0, durationSteps: 6 },
        { id: "hpsy-1", midi: 52, pitchName: "E3", step: 0, durationSteps: 6 },
        { id: "hpsy-2", midi: 55, pitchName: "G3", step: 0, durationSteps: 6 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "indierock") {
      setDrumFileName("Indie_GuitarRock_Punchy.mid");
      setSynthFileName("Indie_Overdrive_GuitarSynth.mid");
      setBpm(120);
      setGenre(lang === "ko" ? "인디 록 (Post-Punk Indie)" : "Post-Punk Indie Rock");
      setScale("E Minor");
      setNotes([
        { id: "ir1", midi: 67, pitchName: "G4", step: 0, durationSteps: 4 },
        { id: "ir2", midi: 66, pitchName: "F#4", step: 4, durationSteps: 4 },
        { id: "ir3", midi: 64, pitchName: "E4", step: 8, durationSteps: 4 },
        { id: "ir4", midi: 59, pitchName: "B3", step: 12, durationSteps: 4 },
        { id: "ir5", midi: 64, pitchName: "E4", step: 16, durationSteps: 16 },
      ]);
      setDrumNotes([
        { id: "irdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "irdk-8", midi: 36, pitchName: "Kick", step: 8, durationSteps: 1 },
        { id: "irdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "irdk-24", midi: 36, pitchName: "Kick", step: 24, durationSteps: 1 },
        { id: "irds-4", midi: 38, pitchName: "Snare", step: 4, durationSteps: 1 },
        { id: "irds-12", midi: 38, pitchName: "Snare", step: 12, durationSteps: 1 },
        { id: "irds-20", midi: 38, pitchName: "Snare", step: 20, durationSteps: 1 },
        { id: "irds-28", midi: 38, pitchName: "Snare", step: 28, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "irsy-0", midi: 40, pitchName: "E2", step: 0, durationSteps: 8 },
        { id: "irsy-1", midi: 47, pitchName: "B2", step: 0, durationSteps: 8 },
        { id: "irsy-2", midi: 52, pitchName: "E3", step: 0, durationSteps: 8 },
        { id: "irsy-3", midi: 55, pitchName: "G3", step: 0, durationSteps: 8 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "folk") {
      setDrumFileName("Folk_Tender_Handrim.mid");
      setSynthFileName("Folk_Acoustic_GuitarPluck.mid");
      setBpm(78);
      setGenre(lang === "ko" ? "어쿠스틱 포크 (Tender Folk)" : "Tender Folk Acoustic");
      setScale("D Major");
      setNotes([
        { id: "fk1", midi: 66, pitchName: "F#4", step: 0, durationSteps: 4 },
        { id: "fk2", midi: 69, pitchName: "A4", step: 4, durationSteps: 4 },
        { id: "fk3", midi: 67, pitchName: "G4", step: 8, durationSteps: 4 },
        { id: "fk4", midi: 66, pitchName: "F#4", step: 12, durationSteps: 4 },
        { id: "fk5", midi: 64, pitchName: "E4", step: 16, durationSteps: 16 },
      ]);
      setDrumNotes([
        { id: "fkdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "fkds-8", midi: 39, pitchName: "Clap", step: 8, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "fksy-0", midi: 50, pitchName: "D3", step: 0, durationSteps: 16 },
        { id: "fksy-1", midi: 54, pitchName: "F#3", step: 0, durationSteps: 16 },
        { id: "fksy-2", midi: 57, pitchName: "A3", step: 0, durationSteps: 16 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "ambient") {
      setDrumFileName("Ambient_Atmospheric_Rumble.mid");
      setSynthFileName("Ambient_Ethereal_CelestialPads.mid");
      setBpm(65);
      setGenre(lang === "ko" ? "앰비언트 (Ethereal Ambient)" : "Ethereal Ambient");
      setScale("F Major");
      setNotes([
        { id: "am1", midi: 72, pitchName: "C5", step: 0, durationSteps: 12 },
        { id: "am2", midi: 74, pitchName: "D5", step: 12, durationSteps: 8 },
        { id: "am3", midi: 69, pitchName: "A4", step: 20, durationSteps: 12 },
      ]);
      setDrumNotes([
        { id: "amdh-0", midi: 42, pitchName: "Hihat", step: 0, durationSteps: 1 },
        { id: "amdh-16", midi: 42, pitchName: "Hihat", step: 16, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "amsy-0", midi: 41, pitchName: "F2", step: 0, durationSteps: 32 },
        { id: "amsy-1", midi: 48, pitchName: "C3", step: 0, durationSteps: 32 },
        { id: "amsy-2", midi: 53, pitchName: "F3", step: 0, durationSteps: 32 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "discofunk") {
      setDrumFileName("DiscoFunk_70s_PumpBeat.mid");
      setSynthFileName("DiscoFunk_Retro_Clavinet.mid");
      setBpm(118);
      setGenre(lang === "ko" ? "디스코 펑크 (Retro Disco Funk)" : "Retro Disco Funk");
      setScale("A Minor");
      setNotes([
        { id: "df1", midi: 64, pitchName: "E4", step: 0, durationSteps: 2 },
        { id: "df2", midi: 67, pitchName: "G4", step: 2, durationSteps: 2 },
        { id: "df3", midi: 69, pitchName: "A4", step: 4, durationSteps: 4 },
        { id: "df4", midi: 72, pitchName: "C5", step: 8, durationSteps: 4 },
        { id: "df5", midi: 71, pitchName: "B4", step: 12, durationSteps: 2 },
        { id: "df6", midi: 69, pitchName: "A4", step: 14, durationSteps: 2 },
      ]);
      setDrumNotes([
        { id: "dfdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "dfdk-4", midi: 36, pitchName: "Kick", step: 4, durationSteps: 1 },
        { id: "dfdk-8", midi: 36, pitchName: "Kick", step: 8, durationSteps: 1 },
        { id: "dfdk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
        { id: "dfdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "dfdk-20", midi: 36, pitchName: "Kick", step: 20, durationSteps: 1 },
        { id: "dfdk-24", midi: 36, pitchName: "Kick", step: 24, durationSteps: 1 },
        { id: "dfdk-28", midi: 36, pitchName: "Kick", step: 28, durationSteps: 1 },
        { id: "dfds-4", midi: 38, pitchName: "Snare", step: 4, durationSteps: 1 },
        { id: "dfds-12", midi: 38, pitchName: "Snare", step: 12, durationSteps: 1 },
        { id: "dfds-20", midi: 38, pitchName: "Snare", step: 20, durationSteps: 1 },
        { id: "dfds-28", midi: 38, pitchName: "Snare", step: 28, durationSteps: 1 },
        { id: "dfdh-2", midi: 42, pitchName: "Hihat", step: 2, durationSteps: 1 },
        { id: "dfdh-6", midi: 42, pitchName: "Hihat", step: 6, durationSteps: 1 },
        { id: "dfdh-10", midi: 42, pitchName: "Hihat", step: 10, durationSteps: 1 },
        { id: "dfdh-14", midi: 42, pitchName: "Hihat", step: 14, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "dfsy-0", midi: 45, pitchName: "A2", step: 0, durationSteps: 4 },
        { id: "dfsy-1", midi: 48, pitchName: "C3", step: 0, durationSteps: 4 },
        { id: "dfsy-2", midi: 52, pitchName: "E3", step: 0, durationSteps: 4 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "citypop") {
      setDrumFileName("CityPop_FM_NeonDrive.mid");
      setSynthFileName("CityPop_Smooth_JazzVoicings.mid");
      setBpm(112);
      setGenre(lang === "ko" ? "시티 팝 (Neo City Pop)" : "Neo City Pop Retro");
      setScale("C Major");
      setNotes([
        { id: "cp1", midi: 71, pitchName: "B4", step: 0, durationSteps: 4 },
        { id: "cp2", midi: 72, pitchName: "C5", step: 4, durationSteps: 4 },
        { id: "cp3", midi: 73, pitchName: "C#5", step: 8, durationSteps: 4 },
        { id: "cp4", midi: 74, pitchName: "D5", step: 12, durationSteps: 4 },
        { id: "cp5", midi: 76, pitchName: "E5", step: 16, durationSteps: 16 },
      ]);
      setDrumNotes([
        { id: "cpdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "cpdk-6", midi: 36, pitchName: "Kick", step: 6, durationSteps: 1 },
        { id: "cpds-4", midi: 38, pitchName: "Snare", step: 4, durationSteps: 1 },
        { id: "cpds-12", midi: 38, pitchName: "Snare", step: 12, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "cpsy-0", midi: 48, pitchName: "C3", step: 0, durationSteps: 8 },
        { id: "cpsy-1", midi: 52, pitchName: "E3", step: 0, durationSteps: 8 },
        { id: "cpsy-2", midi: 55, pitchName: "G3", step: 0, durationSteps: 8 },
        { id: "cpsy-3", midi: 59, pitchName: "B3", step: 0, durationSteps: 8 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    } else if (presetType === "jerseyclub") {
      setDrumFileName("JerseyClub_Slick_Woodblock.mid");
      setSynthFileName("JerseyClub_Flicker_Pulse.mid");
      setBpm(135);
      setGenre(lang === "ko" ? "저지 클럽 (Jersey Club Bounce)" : "Jersey Club Bounce");
      setScale("A Minor");
      setNotes([
        { id: "jc1", midi: 69, pitchName: "A4", step: 0, durationSteps: 2 },
        { id: "jc2", midi: 69, pitchName: "A4", step: 2, durationSteps: 1 },
        { id: "jc3", midi: 72, pitchName: "C5", step: 3, durationSteps: 3 },
        { id: "jc4", midi: 72, pitchName: "C5", step: 6, durationSteps: 2 },
        { id: "jc5", midi: 69, pitchName: "A4", step: 8, durationSteps: 8 },
      ]);
      setDrumNotes([
        { id: "jcdk-0", midi: 36, pitchName: "Kick", step: 0, durationSteps: 1 },
        { id: "jcdk-3", midi: 36, pitchName: "Kick", step: 3, durationSteps: 1 },
        { id: "jcdk-6", midi: 36, pitchName: "Kick", step: 6, durationSteps: 1 },
        { id: "jcdk-8", midi: 36, pitchName: "Kick", step: 8, durationSteps: 1 },
        { id: "jcdk-12", midi: 36, pitchName: "Kick", step: 12, durationSteps: 1 },
        { id: "jcdk-16", midi: 36, pitchName: "Kick", step: 16, durationSteps: 1 },
        { id: "jcdp-4", midi: 39, pitchName: "Clap", step: 4, durationSteps: 1 },
        { id: "jcdp-12", midi: 39, pitchName: "Clap", step: 12, durationSteps: 1 },
      ]);
      setSynthNotes([
        { id: "jcsy-0", midi: 45, pitchName: "A2", step: 0, durationSteps: 4 },
        { id: "jcsy-1", midi: 48, pitchName: "C3", step: 0, durationSteps: 4 },
        { id: "jcsy-2", midi: 52, pitchName: "E3", step: 0, durationSteps: 4 },
      ]);
      setDrumStatus("loaded");
      setSynthStatus("loaded");
    }
  };

  // MIDI file drag/upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "drum" | "synth" | "multitrack") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "drum") {
      setDrumFileName(file.name);
      setDrumStatus("loaded");
    } else if (target === "synth") {
      setSynthFileName(file.name);
      setSynthStatus("loaded");
    } else {
      setMultitrackFileName(file.name);
      setMultitrackStatus("loaded");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        try {
          const analyzed = analyzeMidiFile(event.target.result, file.name);
          
          let targetBarMode = barMode;
          if (analyzed.sessionContext && analyzed.sessionContext.bars) {
            targetBarMode = analyzed.sessionContext.bars as any;
          }
          
          // Update states based on parsing and algorithm
           setBpm(analyzed.bpm);
          setGenre(analyzed.genre);
          setScale(analyzed.scale);

          // Populate the beautiful briefing card with rich analytical data
          const allParsedNotes = (analyzed.notes || []).concat(analyzed.synthNotes || []).concat(analyzed.drumNotes || []);
          const octRange = calculateOctaveRange(allParsedNotes.length > 0 ? allParsedNotes : analyzed.notes || []);
          setMidiBriefing({
            fileName: file.name,
            bpm: analyzed.bpm,
            scale: analyzed.scale,
            genre: analyzed.genre,
            duration: analyzed.duration || 4.0,
            notesCount: allParsedNotes.length || (analyzed.notes || []).length,
            octaveRange: octRange,
            tracksCount: analyzed.tracksCount || 1,
          });

          if (analyzed.sessionContext) {
            setSessionContext(analyzed.sessionContext);
            if (analyzed.sessionContext.bars) {
              setBarMode(analyzed.sessionContext.bars as any);
            }
          }

          const stepDuration = 60 / analyzed.bpm / 4;

          if (target === "drum") {
            const parsedDrums: ToplineNote[] = [];
            // Extract drum notes: prefer drumNotes if present, otherwise fallback to any notes
            const drumSrc = (analyzed.drumNotes && analyzed.drumNotes.length > 0) ? analyzed.drumNotes : analyzed.notes;
            
            drumSrc.forEach((n, i) => {
              const m = n.midi;
              let targetMidi = 36;
              let name = "Kick";
              if (m === 36 || m === 35 || m < 38) { targetMidi = 36; name = "Kick"; }
              else if (m === 38 || m === 40 || m === 37) { targetMidi = 38; name = "Snare"; }
              else if (m === 42 || m === 44 || m === 46 || m === 48) { targetMidi = 42; name = "Hihat"; }
              else { targetMidi = 39; name = "Clap"; }

              const step = Math.round(n.time / stepDuration) % (targetBarMode * 16);
              parsedDrums.push({
                id: `drum-ind-${i}-${Date.now()}-${Math.random()}`,
                midi: targetMidi,
                pitchName: name,
                step,
                durationSteps: 1,
              });
            });

            setDrumNotes(parsedDrums);
            setDrumFileName(file.name);
            setDrumStatus("loaded");
          } else if (target === "synth") {
            const parsedSynths: ToplineNote[] = [];
            const synthSrc = (analyzed.synthNotes && analyzed.synthNotes.length > 0) ? analyzed.synthNotes : analyzed.notes;
            
            synthSrc.forEach((n, i) => {
              const step = Math.round(n.time / stepDuration) % (targetBarMode * 16);
              const durationSteps = Math.max(1, Math.round(n.duration / stepDuration));
              parsedSynths.push({
                id: `synth-ind-${i}-${Date.now()}-${Math.random()}`,
                midi: n.midi,
                pitchName: n.name || "Synth",
                step,
                durationSteps: Math.min(16, durationSteps),
              });
            });

            setSynthNotes(parsedSynths);
            setSynthFileName(file.name);
            setSynthStatus("loaded");

            // Populate main topline grid for edit guidance from synth notes
            const mappedNotes: ToplineNote[] = synthSrc.map((n, i) => {
              const matchedRow = SUPPORTED_PITCHES.find(p => p.midi === n.midi) || 
                                 SUPPORTED_PITCHES.find(p => Math.abs(p.midi - n.midi) < 3) ||
                                 SUPPORTED_PITCHES[2];

              const step = Math.round(n.time / stepDuration) % (targetBarMode * 16);
              const durationSteps = Math.max(1, Math.round(n.duration / stepDuration));

              return {
                id: `parsed-${i}-${Date.now()}-${Math.random()}`,
                midi: matchedRow.midi,
                pitchName: matchedRow.name,
                step,
                durationSteps: Math.min(16, durationSteps),
              };
            });

            if (mappedNotes.length > 0) {
              setNotes(mappedNotes);
            }
          } else {
            // target === "multitrack" - load both drums and synth simultaneously
            const parsedDrums: ToplineNote[] = [];
            const drumSrc = (analyzed.drumNotes && analyzed.drumNotes.length > 0) ? analyzed.drumNotes : [];
            
            drumSrc.forEach((n, i) => {
              const m = n.midi;
              let targetMidi = 36;
              let name = "Kick";
              if (m === 36 || m === 35 || m < 38) { targetMidi = 36; name = "Kick"; }
              else if (m === 38 || m === 40 || m === 37) { targetMidi = 38; name = "Snare"; }
              else if (m === 42 || m === 44 || m === 46 || m === 48) { targetMidi = 42; name = "Hihat"; }
              else { targetMidi = 39; name = "Clap"; }

              const step = Math.round(n.time / stepDuration) % (targetBarMode * 16);
              parsedDrums.push({
                id: `drum-ind-mt-${i}-${Date.now()}-${Math.random()}`,
                midi: targetMidi,
                pitchName: name,
                step,
                durationSteps: 1,
              });
            });

            const parsedSynths: ToplineNote[] = [];
            const synthSrc = (analyzed.synthNotes && analyzed.synthNotes.length > 0) ? analyzed.synthNotes : analyzed.notes;
            
            synthSrc.forEach((n, i) => {
              const step = Math.round(n.time / stepDuration) % (targetBarMode * 16);
              const durationSteps = Math.max(1, Math.round(n.duration / stepDuration));
              parsedSynths.push({
                id: `synth-ind-mt-${i}-${Date.now()}-${Math.random()}`,
                midi: n.midi,
                pitchName: n.name || "Synth",
                step,
                durationSteps: Math.min(16, durationSteps),
              });
            });

            // Set both drums and synths tracks
            setDrumNotes(parsedDrums);
            setDrumFileName(file.name + " (Drums)");
            setDrumStatus("loaded");

            setSynthNotes(parsedSynths);
            setSynthFileName(file.name + " (Synths)");
            setSynthStatus("loaded");

            // Also populate main topline editor with synth-based chord guidance
            const mappedNotes: ToplineNote[] = synthSrc.map((n, i) => {
              const matchedRow = SUPPORTED_PITCHES.find(p => p.midi === n.midi) || 
                                 SUPPORTED_PITCHES.find(p => Math.abs(p.midi - n.midi) < 3) ||
                                 SUPPORTED_PITCHES[2];

              const step = Math.round(n.time / stepDuration) % (targetBarMode * 16);
              const durationSteps = Math.max(1, Math.round(n.duration / stepDuration));

              return {
                id: `parsed-mt-${i}-${Date.now()}-${Math.random()}`,
                midi: matchedRow.midi,
                pitchName: matchedRow.name,
                step,
                durationSteps: Math.min(16, durationSteps),
              };
            });

            if (mappedNotes.length > 0) {
              setNotes(mappedNotes);
            }
          }
        } catch (error) {
          console.error("MIDI parsing/loading failure caught gracefully:", error);
          alert(lang === "ko" 
            ? "오류: 비정상적이거나 손상된 미디 파일입니다. 분석 및 로드가 취소되었습니다." 
            : "Error: Unsupported or corrupted MIDI file. Parsing and loading has been aborted.");
          
          // Revert visual loading status
          if (target === "drum") {
            setDrumStatus("default");
            setDrumFileName("");
          } else if (target === "synth") {
            setSynthStatus("default");
            setSynthFileName("");
          } else {
            setMultitrackStatus("default");
            setMultitrackFileName("");
          }
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Dice mutation logic ("주사위 콕콕" - Vary Pattern deterministically based on Slider & Seed & Scale)
  const rollDiceMelody = () => {
    // Deterministic random generator based purely on the current seed string state.
    // This guarantees that clicking the Dice button with the same seed will always produce 100% identical notes.
    const rand = getSeededRandom(seed);

    let plan: ToplinePlan | null = null;
    if (sessionContext) {
      plan = createToplinePlan(sessionContext);
    }

    const scaleRoot = scale.split(" ")[0];
    const isMinor = scale.includes("Minor");
    const rootIndex = SUPPORTED_PITCHES.findIndex(p => p.name.startsWith(scaleRoot)) || 2;
    const rootPitchClass = rootIndex !== -1 ? SUPPORTED_PITCHES[rootIndex].midi % 12 : 0;
    
    // Filter active pitches strictly inside the recommended scale/register
    const activePitches = SUPPORTED_PITCHES.filter((p) => {
      if (plan) {
        return plan.allowedNotes.includes(p.midi);
      }
      return isPitchInScale(p.midi, scale);
    });

    if (activePitches.length === 0) {
      activePitches.push(...SUPPORTED_PITCHES);
    }

    const stepsPerGrid = barMode * 16;
    const generatedNotes: ToplineNote[] = [];
    
    let currentStep = 0;
    while (currentStep < stepsPerGrid) {
      // Human Phrasing Rest Algorithm:
      // In musical bars, vocalists naturally take a breath towards the end of bars or phrases.
      const stepInBar = currentStep % 16;
      const isEndOfBar = stepInBar >= 12;
      const isFullEndOfPhrase = (currentStep >= stepsPerGrid - 4); // end of entire loop

      let isRest = false;

      // Rest biases selection using plan or styleSlider fallback
      if (plan) {
        let rBias = plan.restBias;
        
        // Lower rest chances on downbeats, maximize during designated avoidSteps (breaths)
        if (plan.strongBeatSteps.includes(currentStep)) {
          rBias *= 0.4;
        }
        if (plan.avoidSteps.includes(currentStep)) {
          rBias = 0.92;
        } else if (isEndOfBar) {
          rBias += 0.15;
        }
        
        isRest = rand() < rBias;
      } else {
        let isRestChance = (11 - styleSlider) * 0.08; // 1 -> 80% baseline, 10 -> 8% baseline
        if (isEndOfBar) {
          isRestChance += 0.25; // Boost rest chance at the end of a bar
        }
        if (isFullEndOfPhrase) {
          isRestChance += 0.40; // Extremely high rest chance at the absolute end of the loop
        }
        isRest = rand() < Math.min(0.95, isRestChance);
      }

      // Determine appropriate note/rest durations based on stylePreset/Plan or styleSlider fallback
      let minDur = 1;
      let maxDur = 1;
      
      if (plan) {
        const dens = plan.density;
        const motif = plan.motifLength;

        if (dens === "high") {
          minDur = 1; maxDur = 3;
        } else if (dens === "low") {
          minDur = 3; maxDur = 6;
        } else {
          minDur = 2; maxDur = 4;
        }

        if (motif === 4) {
          maxDur = Math.max(maxDur, 5);
        } else if (motif === 2) {
          maxDur = Math.min(maxDur, 3);
        }
      } else {
        if (styleSlider === 1) {
          minDur = 6; maxDur = 12; // Extremely long sustained ballad notes (up to 3 beats)
        } else if (styleSlider === 2) {
          minDur = 5; maxDur = 10; // Very long notes
        } else if (styleSlider === 3) {
          minDur = 4; maxDur = 8;  // Long ballad notes
        } else if (styleSlider === 4) {
          minDur = 3; maxDur = 6;  // Medium-long notes
        } else if (styleSlider === 5) {
          minDur = 2; maxDur = 5;  // Medium notes
        } else if (styleSlider === 6) {
          minDur = 2; maxDur = 4;  // Average pop notes
        } else if (styleSlider === 7) {
          minDur = 1; maxDur = 3;  // Medium-fast upbeat notes
        } else if (styleSlider === 8) {
          minDur = 1; maxDur = 2;  // Fast dance/upbeat notes
        } else { // 9 and 10 (Rapid Rap/Trap runs)
          minDur = 1; maxDur = 1;
        }
      }

      // Clamp potential duration strictly inside the bar constraints
      let duration = Math.floor(rand() * (maxDur - minDur + 1)) + minDur;
      duration = Math.min(duration, stepsPerGrid - currentStep);

      if (duration <= 0) break;

      if (isRest) {
        // Create rest layout item anchored near a comfortable middle pitch
        const anchorPitch = activePITCHESHelp();
        generatedNotes.push({
          id: `rest-${currentStep}-${seed}`,
          midi: anchorPitch.midi,
          pitchName: anchorPitch.name,
          step: currentStep,
          durationSteps: duration,
          isRest: true,
        });
      } else {
        // High quality chord-tracking logic: align the topline to the underlying synth/chords track
        const activeSynthsAtStep = synthNotes.filter(
          (s) => s.step <= currentStep && s.step + s.durationSteps > currentStep && !s.isRest
        );
        const chordMidiClasses = activeSynthsAtStep.map((s) => s.midi % 12);

        let chosenPitch = activePitches[0];

        // Filter stable candidate pitches specifically for strong beats to build sturdy resolution
        let targetPool = [...activePitches];
        if (plan && plan.strongBeatSteps.includes(currentStep)) {
          const stableIntervals = isMinor ? [0, 3, 7] : [0, 4, 7]; // Stable scale degrees (1, 3, 5)
          const stablePool = activePitches.filter(p => {
            const di = (p.midi - rootPitchClass + 12) % 12;
            return stableIntervals.includes(di);
          });
          if (stablePool.length > 0 && rand() < 0.85) { // 85% probability on stable chord degrees for downbeat strength
            targetPool = stablePool;
          }
        }

        if (targetPool.length > 0) {
          if (chordMidiClasses.length > 0) {
            // Find which pitches within the scale key match the currently active chord pitch classes (e.g. C, E, G)
            const chordTones = targetPool.filter(p => chordMidiClasses.includes(p.midi % 12));
            
            // 75% weighted chance to play an authentic chord tone for sweet vocal resolution, 25% passing scale note
            if (chordTones.length > 0 && rand() < 0.75) {
              const pitchIndex = Math.floor(rand() * chordTones.length);
              chosenPitch = chordTones[pitchIndex];
            } else {
              const pitchIndex = Math.floor(rand() * targetPool.length);
              chosenPitch = targetPool[pitchIndex];
            }
          } else {
            // No chord active at this step: standard scale tone selection
            const pitchIndex = Math.floor(rand() * targetPool.length);
            chosenPitch = targetPool[pitchIndex];
          }
        }

        generatedNotes.push({
          id: `note-${currentStep}-${seed}-${chosenPitch.midi}`,
          midi: chosenPitch.midi,
          pitchName: chosenPitch.name,
          step: currentStep,
          durationSteps: duration,
        });
      }

      currentStep += duration;
    }

    // Combine generated music notes with locked notes per bar
    const finalNotes: ToplineNote[] = [];
    for (let b = 0; b < barMode; b++) {
      const isLocked = lockedBars[b];
      const startStep = b * 16;
      const endStep = (b + 1) * 16;

      if (isLocked) {
        // Keep currently stored notes/rests in this bar
        const saved = notes.filter(n => n.step >= startStep && n.step < endStep);
        finalNotes.push(...saved);
      } else {
        // Use newly generated notes/rests in this bar
        const newlyGenerated = generatedNotes.filter(n => n.step >= startStep && n.step < endStep);
        finalNotes.push(...newlyGenerated);
      }
    }

    setNotes(finalNotes);
  };

  // Safe helper to obtain standard visual middle pitch to ground the rest labels beautifully
  const activePITCHESHelp = () => {
    const activePitches = SUPPORTED_PITCHES.filter((p) => isPitchInScale(p.midi, scale));
    if (activePitches.length > 0) {
      return activePitches[Math.min(activePitches.length - 1, Math.floor(activePitches.length / 2))];
    }
    return SUPPORTED_PITCHES[4];
  };

  // Lightweight string dependency token representing synth/chord steps and pitches (avoids raw array object comparison re-renders)
  const synthNotesToken = synthNotes.map(s => `${s.step}-${s.midi}-${s.durationSteps}-${s.isRest ? 1 : 0}`).join(",");

  // Auto-regenerate melody in AI mode when parameters change, preserving strict determinism per seed
  useEffect(() => {
    if (creationMode === "ai") {
      rollDiceMelody();
    }
  }, [seed, barMode, styleSlider, scale, creationMode, lockedBars, synthNotesToken]);

  // Drag and drop notes editing actions
  const handleNoteMouseDown = (e: React.MouseEvent, note: ToplineNote) => {
    e.preventDefault();
    e.stopPropagation();
    if (gridToolMode === "eraser") {
      pushToHistory();
      setNotes(prev => prev.filter(n => n.id !== note.id));
      return;
    }
    if (gridToolMode === "brush") {
      return;
    }
    pushToHistory(); // Save snapshot of melody state before dragging starts
    setDraggedNoteId(note.id);
    dragInitialRef.current = { step: note.step, midi: note.midi, hasMoved: false };
    if (creationMode === "ai") {
      setCreationMode("manual");
    }
  };

  const handleNoteMouseUp = (e: React.MouseEvent, note: ToplineNote) => {
    e.stopPropagation();
    setDraggedNoteId(null);
    
    // If the note did NOT move during dragging, treat as click to open note editor popover
    if (dragInitialRef.current && !dragInitialRef.current.hasMoved) {
      setEditingNoteId(prev => prev === note.id ? null : note.id);
    }
    dragInitialRef.current = null;
  };

  const handleCellMouseEnter = (stepIndex: number, pitchMidi: number, pitchName: string) => {
    if (draggedNoteId && creationMode === "manual") {
      if (dragInitialRef.current) {
        if (dragInitialRef.current.step !== stepIndex || dragInitialRef.current.midi !== pitchMidi) {
          dragInitialRef.current.hasMoved = true;
        }
      }
      setNotes(prevNotes => {
        return prevNotes.map(n => {
          if (n.id === draggedNoteId) {
            const clampedStep = Math.max(0, Math.min(stepIndex, (barMode * 16) - n.durationSteps));
            return {
              ...n,
              step: clampedStep,
              midi: pitchMidi,
              pitchName: pitchName
            };
          }
          return n;
        });
      });
    }
  };

  const tapTimestampsRef = useRef<number[]>([]);

  const handleTapTempo = () => {
    const now = Date.now();
    const lastTap = tapTimestampsRef.current[tapTimestampsRef.current.length - 1];
    
    // If last tap was more than 2.0 seconds ago, reset taps
    if (lastTap && now - lastTap > 2000) {
      tapTimestampsRef.current = [now];
    } else {
      tapTimestampsRef.current.push(now);
      // Keep only last 5 taps for a responsive moving average
      if (tapTimestampsRef.current.length > 5) {
        tapTimestampsRef.current.shift();
      }
    }
    
    if (tapTimestampsRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimestampsRef.current.length; i++) {
        intervals.push(tapTimestampsRef.current[i] - tapTimestampsRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      const clampedBpm = Math.max(40, Math.min(240, calculatedBpm));
      setBpm(clampedBpm);
    }
  };

  const paintNote = (stepIndex: number, pitchMidi: number, pitchName: string) => {
    if (creationMode === "ai") {
      setCreationMode("manual");
    }
    // Check if an existing note covers this step and pitch
    const hasOverlap = notes.some(n => n.step === stepIndex && n.midi === pitchMidi && !n.isRest);
    if (!hasOverlap) {
      const maxAllowedLength = (barMode * 16) - stepIndex;
      const actualDuration = Math.min(drawDuration, maxAllowedLength);
      if (actualDuration <= 0) return;

      pushToHistory();
      // Remove rests or overlapping notes starting exactly here
      const cleanNotes = notes.filter(n => n.step !== stepIndex);
      const newNote: ToplineNote = {
        id: `manual-${stepIndex}-${pitchMidi}-${Date.now()}-${Math.random()}`,
        midi: pitchMidi,
        pitchName,
        step: stepIndex,
        durationSteps: actualDuration,
        velocity: 0.8,
      };
      setNotes([...cleanNotes, newNote]);
      triggerPitchSound(pitchMidi);
    }
  };

  const eraseNote = (stepIndex: number, pitchMidi: number) => {
    const hasNote = notes.some(n => n.step === stepIndex && n.midi === pitchMidi && !n.isRest);
    if (hasNote) {
      pushToHistory();
      setNotes(prev => prev.filter(n => !(n.step === stepIndex && n.midi === pitchMidi)));
    }
  };

  // Set up global mouseup listener to end dragging anywhere safely
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggedNoteId(null);
      dragInitialRef.current = null;
      setIsMouseDownOnGrid(false);
      lastPaintedCellRef.current = null;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  // Toggle active cell notes on user manual piano roll click editing
  const handleGridCellClick = (stepIndex: number, pitchMidi: number, pitchName: string) => {
    if (creationMode === "ai") {
      // Switch manually to edit mode when user starts sketching
      setCreationMode("manual");
    }

    // Check if a note already exists on this coordinate (same step and same pitch)
    const existingIndex = notes.findIndex(n => n.step === stepIndex && n.midi === pitchMidi && !n.isRest);
    
    if (existingIndex !== -1) {
      // Delete note
      pushToHistory();
      setNotes(notes.filter((_, idx) => idx !== existingIndex));
      setEditingNoteId(null);
    } else {
      // Adjust duration steps to fit inside grid length
      const maxAllowedLength = (barMode * 16) - stepIndex;
      const actualDuration = Math.min(drawDuration, maxAllowedLength);
      
      if (actualDuration <= 0) return;

      pushToHistory();
      // Delete any rest block or overlapping note starting exactly here
      let cleanNotes = notes.filter(n => n.step !== stepIndex);
      
      // Create a nice styled note
      const newNote: ToplineNote = {
        id: `manual-${stepIndex}-${pitchMidi}-${Date.now()}`,
        midi: pitchMidi,
        pitchName,
        step: stepIndex,
        durationSteps: actualDuration,
        velocity: 0.8, // default velocity at 80%
      };

      setNotes([...cleanNotes, newNote]);
      triggerPitchSound(pitchMidi);
      setEditingNoteId(null);
    }
  };

  // Toggle active cell notes on user manual drum click editing
  const handleDrumCellClick = (stepIndex: number, drumMidi: number, drumName: string) => {
    const existingIndex = drumNotes.findIndex(d => d.step === stepIndex && d.midi === drumMidi);
    if (existingIndex !== -1) {
      setDrumNotes(drumNotes.filter((_, idx) => idx !== existingIndex));
    } else {
      const newDrum: ToplineNote = {
        id: `drum-m-${stepIndex}-${drumMidi}-${Date.now()}`,
        midi: drumMidi,
        pitchName: drumName,
        step: stepIndex,
        durationSteps: 1, // trigger beats are 1 step long
      };
      setDrumNotes([...drumNotes, newDrum]);
      triggerDrumSound(drumMidi, drumName);
    }
  };

  // Toggle active cell notes on user manual synth click editing
  const handleSynthCellClick = (stepIndex: number, synthMidi: number, synthName: string) => {
    const existingIndex = synthNotes.findIndex(s => s.step === stepIndex && s.midi === synthMidi);
    if (existingIndex !== -1) {
      setSynthNotes(synthNotes.filter((_, idx) => idx !== existingIndex));
    } else {
      const maxAllowedLength = (barMode * 16) - stepIndex;
      // standard drawn backing chords are 4 steps (quarter note) or max remaining
      const chordLen = Math.min(4, maxAllowedLength);
      if (chordLen <= 0) return;
      
      const newSynth: ToplineNote = {
        id: `synth-m-${stepIndex}-${synthMidi}-${Date.now()}`,
        midi: synthMidi,
        pitchName: synthName,
        step: stepIndex,
        durationSteps: chordLen,
      };
      setSynthNotes([...synthNotes, newSynth]);
      triggerSynthBackingSound(synthMidi);
    }
  };

  // Real-time responsive sound feedback helpers for manual clicks & keys previewing
  const triggerPitchSound = async (midi: number) => {
    try {
      if (muteLeadRef.current) return;
      await Tone.start();
      const synth = new Tone.Synth({
        oscillator: { type: leadSynthType as any },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.3 }
      }).toDestination();
      synth.volume.value = percentToDb(volumeLeadRef.current, -32, 2);
      const noteName = Tone.Frequency(midi, "midi").toNote();
      synth.triggerAttackRelease(noteName, "8n", Tone.now());
      setTimeout(() => synth.dispose(), 500);
    } catch (e) {}
  };

  const triggerDrumSound = async (drumMidi: number, drumName: string) => {
    try {
      if (muteDrumsRef.current) return;
      await Tone.start();
      const drumVolume = percentToDb(volumeDrumsRef.current, -30, 2);
      if (drumName === "Kick") {
        const kick = new Tone.MembraneSynth().toDestination();
        kick.volume.value = drumVolume - 2;
        kick.triggerAttackRelease("C1", "8n", Tone.now());
        setTimeout(() => kick.dispose(), 400);
      } else if (drumName === "Snare") {
        const snare = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.08 }
        }).toDestination();
        snare.volume.value = drumVolume - 5;
        snare.triggerAttackRelease("G4", "16n", Tone.now());
        setTimeout(() => snare.dispose(), 300);
      } else if (drumName === "Hihat") {
        const hat = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.04, release: 0.04 },
          resonance: 6000
        }).toDestination();
        hat.volume.value = drumVolume - 12;
        hat.triggerAttackRelease("16n", Tone.now());
        setTimeout(() => hat.dispose(), 200);
      } else {
        const clap = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.08 }
        }).toDestination();
        clap.volume.value = drumVolume - 5;
        clap.triggerAttackRelease("C5", "16n", Tone.now());
        setTimeout(() => clap.dispose(), 300);
      }
    } catch (e) {}
  };

  const triggerSynthBackingSound = async (synthMidi: number) => {
    try {
      if (muteSynthRef.current) return;
      await Tone.start();
      const synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.4 }
      }).toDestination();
      synth.volume.value = percentToDb(volumeSynthRef.current, -36, 0);
      const noteName = Tone.Frequency(synthMidi, "midi").toNote();
      synth.triggerAttackRelease(noteName, "4n", Tone.now());
      setTimeout(() => synth.dispose(), 1000);
    } catch (e) {}
  };

  // Trigger Tone.js virtual piano synthesizer preview
  const playPreview = async () => {
    if (isPlaying || playbackIntervalRef.current || isStartingPreviewRef.current) {
      stopPreview();
      return;
    }

    isStartingPreviewRef.current = true;
    playbackCancelledRef.current = false;

    try {
      // Ensure Tone's AudioContext is resumed/started on user click
      await Tone.start();
      
      // If stopPreview was requested in the meantime, abort playback initialization
      if (playbackCancelledRef.current) {
        isStartingPreviewRef.current = false;
        return;
      }
    } catch (e) {
      console.warn("Could not start audio context on user interaction:", e);
      isStartingPreviewRef.current = false;
      return;
    }

    isStartingPreviewRef.current = false;

    // Lazy load the high-quality virtual EP (electric piano) synth
    if (!synthRef.current) {
      const mainSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: leadSynthType as any
        },
        envelope: {
          attack: 0.03, // smooth gentle strike
          decay: 0.15,
          sustain: 0.5,
          release: 1.2 // long ringing natural release
        }
      });

      // Chain audio through standard studio spatial components
      const lowpass = new Tone.Filter(1500, "lowpass");
      const delay = new Tone.FeedbackDelay("8n.", 0.2); // sweet dotted 8th note delay trail
      
      mainSynth.connect(lowpass);
      lowpass.connect(delay);
      delay.toDestination();
      mainSynth.toDestination();
      
      // Fine-tune safety volumes (EP can be loud or resonant)
      mainSynth.volume.value = -8;
      synthRef.current = mainSynth;
      filterRef.current = lowpass;
      delayRef.current = delay;
    }

    // Lazy load backing synth for synth chord progressions
    if (!backingSynthRef.current) {
      const bSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.08, decay: 0.2, sustain: 0.5, release: 0.8 }
      }).toDestination();
      bSynth.volume.value = -18; // soft backing
      backingSynthRef.current = bSynth;
    }

    // Lazy load drum synthesizers
    if (!drumKickRef.current) {
      const pool: Tone.MembraneSynth[] = [];
      for (let i = 0; i < 4; i++) {
        const kick = new Tone.MembraneSynth().toDestination();
        kick.volume.value = -6;
        pool.push(kick);
      }
      drumKickRef.current = pool;
      drumKickIdx.current = 0;
    }
    if (!drumSnareRef.current) {
      const pool: Tone.Synth[] = [];
      for (let i = 0; i < 4; i++) {
        const snare = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.08 }
        }).toDestination();
        snare.volume.value = -14;
        pool.push(snare);
      }
      drumSnareRef.current = pool;
      drumSnareIdx.current = 0;
    }
    if (!drumHatRef.current) {
      const pool: Tone.MetalSynth[] = [];
      for (let i = 0; i < 4; i++) {
        const hat = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.04, release: 0.04 },
          resonance: 6000
        }).toDestination();
        hat.volume.value = -22;
        pool.push(hat);
      }
      drumHatRef.current = pool;
      drumHatIdx.current = 0;
    }

    // Lazy load metronome synth
    if (!clickSynthRef.current) {
      const clickSynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 }
      }).toDestination();
      clickSynth.volume.value = -24; // subtle, unobtrusive tick guide
      clickSynthRef.current = clickSynth;
    }

    setIsPlaying(true);
    let stepCount = 0;
    setCurrentPlaybackStep(0);
    
    // speed calculations (1 step = 1/4 of a beat in 16th resolution)
    const stepDurationSec = (60 / bpmRef.current) / 4;

    playbackIntervalRef.current = setInterval(() => {
      const currentGridSize = barModeRef.current * 16;
      if (stepCount >= currentGridSize) {
        stepCount = 0;
      }

      setCurrentPlaybackStep(stepCount);

      // 1. Play main topline vocal guide notes triggered on this active step count
      const activeNotes = notesRef.current.filter(n => n.step === stepCount && !n.isRest);
      activeNotes.forEach((n) => {
        try {
          if (synthRef.current) {
            // Translate MIDI index to standard musical note notation, e.g. "C5"
            const noteName = Tone.Frequency(n.midi, "midi").toNote();
            const noteDurationSec = n.durationSteps * stepDurationSec;
            
            const humanVal = humanizePercentRef.current;
            const jitterSec = (humanVal / 100) * 0.040;
            const offset = humanVal > 0 ? (Math.random() - 0.5) * jitterSec : 0;
            const triggerTime = Math.max(Tone.now(), Tone.now() + offset);

            const velVar = (humanVal / 100) * 0.25;
            const velOffset = humanVal > 0 ? (Math.random() - 0.5) * velVar : 0;
            let finalVel = (n.velocity !== undefined ? n.velocity : 0.8) + velOffset;
            finalVel = Math.max(0.15, Math.min(1.0, finalVel));
            
            // Trigger attack and release with dynamic note velocity and humanized timing
            synthRef.current.triggerAttackRelease(noteName, noteDurationSec, triggerTime, finalVel);
          }
        } catch (e) {
          console.error("Tone.js EP Synth Error: ", e);
        }
      });

      // 2. Play backing drums (Kick, Snare, Hihat, Clap) on this step count
      const activeDrums = drumNotesRef.current.filter(d => d.step === stepCount);
      activeDrums.forEach((d) => {
        try {
          const humanVal = humanizePercentRef.current;
          const jitterSec = (humanVal / 100) * 0.040;
          const offset = humanVal > 0 ? (Math.random() - 0.5) * jitterSec : 0;
          const triggerTime = Math.max(Tone.now(), Tone.now() + offset);

          if (d.pitchName === "Kick" && drumKickRef.current && drumKickRef.current.length > 0) {
            const idx = drumKickIdx.current;
            drumKickIdx.current = (idx + 1) % drumKickRef.current.length;
            drumKickRef.current[idx].triggerAttackRelease("C1", "8n", triggerTime);
          } else if (d.pitchName === "Snare" && drumSnareRef.current && drumSnareRef.current.length > 0) {
            const idx = drumSnareIdx.current;
            drumSnareIdx.current = (idx + 1) % drumSnareRef.current.length;
            drumSnareRef.current[idx].triggerAttackRelease("G4", "16n", triggerTime);
          } else if (d.pitchName === "Hihat" && drumHatRef.current && drumHatRef.current.length > 0) {
            const idx = drumHatIdx.current;
            drumHatIdx.current = (idx + 1) % drumHatRef.current.length;
            drumHatRef.current[idx].triggerAttackRelease("16n", triggerTime);
          } else if (drumSnareRef.current && drumSnareRef.current.length > 0) {
            // Clap/percussion - routes to snare synth instance
            const idx = drumSnareIdx.current;
            drumSnareIdx.current = (idx + 1) % drumSnareRef.current.length;
            drumSnareRef.current[idx].triggerAttackRelease("C5", "16n", triggerTime);
          }
        } catch (e) {
          console.error("Drum Synth Error: ", e);
        }
      });

      // 3. Play backing synth chords/bass on this step count
      const activeSynths = synthNotesRef.current.filter(s => s.step === stepCount);
      activeSynths.forEach((s) => {
        try {
          if (backingSynthRef.current) {
            const humanVal = humanizePercentRef.current;
            const jitterSec = (humanVal / 100) * 0.040;
            const offset = humanVal > 0 ? (Math.random() - 0.5) * jitterSec : 0;
            const triggerTime = Math.max(Tone.now(), Tone.now() + offset);

            const noteName = Tone.Frequency(s.midi, "midi").toNote();
            const noteDurationSec = s.durationSteps * stepDurationSec;
            backingSynthRef.current.triggerAttackRelease(noteName, noteDurationSec, triggerTime);
          }
        } catch (e) {
          console.error("Backing Synth Error: ", e);
        }
      });

      // Play a tiny guideline/metronome click on start of beat (every 4 steps) using the pre-allocated high-performance click synth
      if (stepCount % 4 === 0) {
        try {
          if (clickSynthRef.current) {
            const clickFreq = stepCount % 16 === 0 ? "C6" : "G5";
            clickSynthRef.current.triggerAttackRelease(clickFreq, "32n", Tone.now());
          }
        } catch (err) {}
      }

      stepCount++;
      if (stepCount >= currentGridSize) {
        stepCount = 0; // loop
      }
    }, stepDurationSec * 1000);
  };

  const stopPreview = () => {
    setIsPlaying(false);
    setCurrentPlaybackStep(-1);
    playbackCancelledRef.current = true; // Signal pending playPreview to abort
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }

    // Clean up active synths to stop lingering releases immediately
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    if (backingSynthRef.current) {
      backingSynthRef.current.dispose();
      backingSynthRef.current = null;
    }
    if (drumKickRef.current) {
      drumKickRef.current.forEach(k => k.dispose());
      drumKickRef.current = null;
    }
    if (drumSnareRef.current) {
      drumSnareRef.current.forEach(s => s.dispose());
      drumSnareRef.current = null;
    }
    if (drumHatRef.current) {
      drumHatRef.current.forEach(h => h.dispose());
      drumHatRef.current = null;
    }
    if (clickSynthRef.current) {
      clickSynthRef.current.dispose();
      clickSynthRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      // Properly dispose of active Tone.js modules to release hardware resources safely
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      if (backingSynthRef.current) {
        backingSynthRef.current.dispose();
        backingSynthRef.current = null;
      }
      if (drumKickRef.current) {
        drumKickRef.current.forEach(k => k.dispose());
        drumKickRef.current = null;
      }
      if (drumSnareRef.current) {
        drumSnareRef.current.forEach(s => s.dispose());
        drumSnareRef.current = null;
      }
      if (drumHatRef.current) {
        drumHatRef.current.forEach(h => h.dispose());
        drumHatRef.current = null;
      }
      if (clickSynthRef.current) {
        clickSynthRef.current.dispose();
        clickSynthRef.current = null;
      }
      if (filterRef.current) {
        filterRef.current.dispose();
        filterRef.current = null;
      }
      if (delayRef.current) {
        delayRef.current.dispose();
        delayRef.current = null;
      }
    };
  }, []);

  // Export & Download generated standard midi file (Vocal Topline ONLY)
  const downloadFinishedMidi = () => {
    // Generate notes representation
    const bpmForMidi = bpm;
    const stepDuration = 60 / bpmForMidi / 4; // 1 step = quarter beat
    const maxSteps = barMode * 16;
    
    const jitterSec = (humanizePercent / 100) * 0.040;
    const velVar = (humanizePercent / 100) * 0.25;

    // Map ToplineNote to standard midi-friendly elements (only within active loop boundaries)
    const standardNotes = notes
      .filter(n => !n.isRest && n.step < maxSteps)
      .map(n => {
        const offset = humanizePercent > 0 ? (Math.random() - 0.5) * jitterSec : 0;
        const velOffset = humanizePercent > 0 ? (Math.random() - 0.5) * velVar : 0;
        const finalTime = Math.max(0, n.step * stepDuration + offset);
        const finalVel = Math.max(0.15, Math.min(1.0, (n.velocity || 0.8) + velOffset));
        return {
          midi: n.midi,
          time: finalTime,
          duration: n.durationSteps * stepDuration,
          name: n.pitchName,
          velocity: finalVel,
        };
      });

    const midiArray = generateToplineMidi(
      bpmForMidi,
      standardNotes,
      "Piano Topline",
      scale,
      genre,
      synthNotes.filter(s => s.step < maxSteps),
      drumNotes.filter(d => d.step < maxSteps)
    );
    
    // Trigger browser file download
    const blob = new Blob([midiArray], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `O2_Topline_Only_${scale.replace(" ", "_").replace("#", "sharp")}_${bpm}BPM.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export & Download full synced multi-track MIDI file (Drums, Synths, and Piano Topline harmonized)
  const downloadAllTracksMidi = () => {
    const bpmForMidi = bpm;
    const stepDuration = 60 / bpmForMidi / 4; // 1 step = quarter beat
    const maxSteps = barMode * 16;
    
    const jitterSec = (humanizePercent / 100) * 0.040;
    const velVar = (humanizePercent / 100) * 0.25;

    // Map ToplineNote states to standard midi-friendly elements within current active loop boundary
    const toplineNotesMapped = notes
      .filter(n => !n.isRest && n.step < maxSteps)
      .map(n => {
        const offset = humanizePercent > 0 ? (Math.random() - 0.5) * jitterSec : 0;
        const velOffset = humanizePercent > 0 ? (Math.random() - 0.5) * velVar : 0;
        const finalTime = Math.max(0, n.step * stepDuration + offset);
        const finalVel = Math.max(0.15, Math.min(1.0, (n.velocity || 0.8) + velOffset));
        return {
          midi: n.midi,
          time: finalTime,
          duration: n.durationSteps * stepDuration,
          name: n.pitchName,
          velocity: finalVel,
        };
      });

    const drumNotesMapped = drumNotes
      .filter(n => !n.isRest && n.step < maxSteps)
      .map(n => {
        const offset = humanizePercent > 0 ? (Math.random() - 0.5) * jitterSec : 0;
        const finalTime = Math.max(0, n.step * stepDuration + offset);
        return {
          midi: n.midi,
          time: finalTime,
          duration: n.durationSteps * stepDuration,
          name: n.pitchName
        };
      });

    const synthNotesMapped = synthNotes
      .filter(n => !n.isRest && n.step < maxSteps)
      .map(n => {
        const offset = humanizePercent > 0 ? (Math.random() - 0.5) * jitterSec : 0;
        const finalTime = Math.max(0, n.step * stepDuration + offset);
        return {
          midi: n.midi,
          time: finalTime,
          duration: n.durationSteps * stepDuration,
          name: n.pitchName
        };
      });

    const midiArray = generateMultiTrackMidi(
      bpmForMidi,
      {
        topline: toplineNotesMapped,
        drums: drumNotesMapped,
        synths: synthNotesMapped
      },
      scale,
      genre,
      synthNotes.filter(s => s.step < maxSteps),
      drumNotes.filter(d => d.step < maxSteps),
      sessionContext
    );
    
    // Trigger browser file download
    const blob = new Blob([midiArray], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `O2_MultiTrack_Full_${scale.replace(" ", "_").replace("#", "sharp")}_${bpm}BPM.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearGrid = () => {
    pushToHistory();
    setNotes([]);
  };

  const transposeNotes = (semitones: number) => {
    if (notes.length === 0) return;
    pushToHistory();
    
    // Perform transposition with optional scale-snapping to stay perfectly harmonized
    setNotes(prev => {
      return prev.map(note => {
        let newMidi = note.midi + semitones;
        newMidi = Math.max(36, Math.min(newMidi, 96)); // Clamp to standard piano layout bounds
        
        if (snapTransposeToScale) {
          // Relocate to closest pitch class inside currently selected scale key
          const scalePitches = SUPPORTED_PITCHES.filter(p => isPitchInScale(p.midi, scale));
          if (scalePitches.length > 0) {
            let closestPitch = scalePitches[0];
            let minDiff = Math.abs(scalePitches[0].midi - newMidi);
            scalePitches.forEach(p => {
              const d = Math.abs(p.midi - newMidi);
              if (d < minDiff) {
                minDiff = d;
                closestPitch = p;
              }
            });
            newMidi = closestPitch.midi;
          }
        }
        
        const matchingPitch = SUPPORTED_PITCHES.find(p => p.midi === newMidi);
        const pitchName = matchingPitch ? matchingPitch.name : Tone.Frequency(newMidi, "midi").toNote();
        
        return {
          ...note,
          midi: newMidi,
          pitchName
        };
      });
    });
  };

  const resetEntireWorkspace = () => {
    pushToHistory();
    setNotes([]);
    setDrumNotes([]);
    setSynthNotes([]);
    setDrumFileName("");
    setSynthFileName("");
    setMultitrackFileName("");
    setDrumStatus("default");
    setSynthStatus("default");
    setMultitrackStatus("default");
    setCreationMode("manual");
    setSelectedPreset("");
    setBpm(120);
    setGenre(lang === "ko" ? "미지정" : "Not specified");
    setScale("C Major");
    setSeed("#5489");
    setStyleSlider(5);
    setBarMode(4);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  return (
    <div id="app-root" className="w-full max-w-[1000px] bg-[var(--panel-bg)] rounded-3xl p-7 mx-auto my-5">
      
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-dashed border-[var(--border-color)]">
        <div id="txt-logo-container" className="logo-area">
          <h1 id="lbl-logo" className="text-2xl font-bold text-[var(--brand-color)] flex items-center gap-3">
            <div id="logo-img-wrapper" className="flex items-center justify-center bg-slate-900 border border-amber-500/40 rounded-xl w-12 h-12 relative overflow-hidden shrink-0 shadow-sm">
              <img 
                id="img-logo" 
                src="/logo.png" 
                alt="Logo" 
                className="logo-icon w-full h-full object-cover transition-all"
                onError={(e) => {
                  // Fallback to text logo if there's any loading error
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallbackSpan = parent.querySelector('.logo-fallback');
                    if (fallbackSpan) {
                      (fallbackSpan as HTMLElement).style.display = 'flex';
                    }
                  }
                }} 
              />
              <span className="logo-fallback hidden text-[10px] text-amber-500 font-extrabold flex-col items-center justify-center select-none leading-none leading-tight">
                <span>MIDI</span>
                <span className="text-[7px] text-slate-400 font-medium">PNG</span>
              </span>
            </div>
            <span id="txt-logo-title">{p.logoTitle}</span> 
            <span className="text-sm px-2 py-0.5 bg-[var(--pastel-blue)] rounded-full text-[var(--brand-color)] font-mono">v0.5</span>
          </h1>
        </div>
        
        {/* TOP TOOLBAR INTERFACE */}
        <div className="top-utilities flex items-center gap-2">
          {/* How to Use Button */}
          <button
            id="btn-how-to-use"
            onClick={() => setIsHowToUseOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold shadow-sm hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:border-amber-400 transition-all"
            title={lang === "ko" ? "사용 설명서 팝업 열기" : "Open user guide popup modal"}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{lang === "ko" ? "사용법" : "How to Use"}</span>
          </button>

          {/* Preset Demo Quick Tester - 20 Diverse Popular Genres Dropdown */}
          <div className="flex items-center mr-1">
            <select
              id="select-presets"
              value={selectedPreset}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedPreset(e.target.value);
                  loadPresetDemo(e.target.value);
                }
              }}
              className="bg-[var(--panel-bg)] text-[var(--text-dark)] border border-[var(--border-color)] hover:border-[var(--brand-color)] rounded-full text-xs font-bold px-3 py-1.5 outline-none cursor-pointer tracking-tight transition-all focus:ring-1 focus:ring-[var(--brand-color)]"
            >
              <option value="" disabled>
                {lang === "ko" ? "장르" : "Genre"}
              </option>
              {DEMO_PRESETS_DATA.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {lang === "ko" ? preset.nameKo : preset.nameEn}
                </option>
              ))}
            </select>
          </div>



          {/* Bilingual Switcher */}
          <button 
            id="btn-lang" 
            onClick={() => setLang(lang === "ko" ? "en" : "ko")}
            className="toggle-btn cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-dark)] rounded-full text-xs font-bold shadow-sm hover:border-[var(--brand-color)] hover:bg-[var(--bg-main)] transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span id="lbl-lang-btn">한/EN</span>
          </button>
          
          {/* Day / Night Theme Controller */}
          <button 
            id="btn-theme" 
            onClick={() => setTheme(theme === "day" ? "night" : "day")}
            className="toggle-btn cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-dark)] rounded-full text-xs font-bold shadow-sm hover:border-[var(--brand-color)] hover:bg-[var(--bg-main)] transition-all"
          >
            {theme === "day" ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span id="lbl-theme-btn">{lang === "ko" ? "주간/야간" : "Day/Night"}</span>
          </button>

          {/* Workspace Trash Bin Button */}
          <button 
            id="btn-workspace-clear-trash" 
            onClick={() => {
              if (window.confirm(lang === "ko" ? "정말로 작업 중인 모든 트랙(드럼, 신스, 탑라인)을 초기화하시겠습니까?" : "Are you sure you want to clear all tracks (drums, synths, and topline)?")) {
                resetEntireWorkspace();
              }
            }}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full text-xs font-bold shadow-sm transition-all hover:bg-red-100 dark:hover:bg-red-950/40 hover:border-red-400"
            title={lang === "ko" ? "작업 중인 전체 데이터 비우기 (휴지통)" : "Clear all working data (Trash bin)"}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>{lang === "ko" ? "휴지통" : "Trash"}</span>
          </button>
        </div>
      </header>

      {/* 1. MIDI FILE UPLOAD GRID */}
      <section className="file-uploader-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* MULTITRACK UPLOAD BOX */}
        <div 
          id="block-multitrack-upload"
          className="upload-box relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all bg-[var(--card-sub-bg)] hover:bg-[var(--bg-main)] min-h-[95px] flex flex-col justify-center items-center"
          style={{ borderColor: "var(--accent-mint-border)" }}
        >
          <input 
            type="file" 
            accept=".mid,.midi" 
            onChange={(e) => handleFileUpload(e, "multitrack")}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {multitrackStatus === "loaded" ? (
            <p id="txt-multitrack-status" className="font-bold text-sm text-[var(--brand-color)] flex items-center justify-center gap-1.5 truncate max-w-full px-2" title={multitrackFileName}>
              {multitrackFileName}
            </p>
          ) : (
            <>
              <p id="txt-multitrack-title" className="title font-bold text-sm text-[var(--brand-color)] flex items-center justify-center gap-1">
                {p.multitrackTitle}
              </p>
              <p id="txt-multitrack-status" className="status text-xs text-[var(--text-muted)] mt-1">
                {p.multitrackStatusDefault}
              </p>
            </>
          )}
        </div>

        {/* DRUM UPLOAD BOX */}
        <div 
          id="block-drum-upload"
          className="upload-box relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all bg-[var(--card-sub-bg)] hover:bg-[var(--bg-main)] min-h-[95px] flex flex-col justify-center items-center"
          style={{ borderColor: "var(--accent-pink-border)" }}
        >
          <input 
            type="file" 
            accept=".mid,.midi" 
            onChange={(e) => handleFileUpload(e, "drum")}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {drumStatus === "loaded" ? (
            <p id="txt-drum-status" className="font-bold text-sm text-[var(--brand-color)] flex items-center justify-center gap-1.5 truncate max-w-full px-2" title={drumFileName}>
              {drumFileName}
            </p>
          ) : (
            <>
              <p id="txt-drum-title" className="title font-bold text-sm text-[var(--brand-color)] flex items-center justify-center gap-1">
                {p.drumTitle}
              </p>
              <p id="txt-drum-status" className="status text-xs text-[var(--text-muted)] mt-1">
                {p.drumStatusDefault}
              </p>
            </>
          )}
        </div>

        {/* SYNTH UPLOAD BOX */}
        <div 
          id="block-synth-upload"
          className="upload-box relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all bg-[var(--card-sub-bg)] hover:bg-[var(--bg-main)] min-h-[95px] flex flex-col justify-center items-center"
          style={{ borderColor: "var(--accent-lavender-border)" }}
        >
          <input 
            type="file" 
            accept=".mid,.midi" 
            onChange={(e) => handleFileUpload(e, "synth")}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {synthStatus === "loaded" ? (
            <p id="txt-synth-status" className="font-bold text-sm text-[var(--brand-color)] flex items-center justify-center gap-1.5 truncate max-w-full px-2" title={synthFileName}>
              {synthFileName}
            </p>
          ) : (
            <>
              <p id="txt-synth-title" className="title font-bold text-sm text-[var(--brand-color)] flex items-center justify-center gap-1">
                {p.synthTitle}
              </p>
              <p id="txt-synth-status" className="status text-xs text-[var(--text-muted)] mt-1">
                {p.synthStatusDefault}
              </p>
            </>
          )}
        </div>
      </section>

      {/* MIDI ANALYSIS BRIEFING DISPLAY BOX */}
      {midiBriefing && (
        <div className="bg-gradient-to-r from-indigo-950/80 to-slate-900/90 border-2 border-indigo-500/30 rounded-2xl p-5 mb-6 text-white shadow-xl relative animate-fade-in backdrop-blur-md">
          <button 
            onClick={() => setMidiBriefing(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-900/50 p-1.5 rounded-full hover:bg-slate-800 cursor-pointer transition-all font-bold text-xs"
            title="Dismiss Briefing"
          >
            ✕
          </button>
          
          <div className="flex items-center gap-2 mb-3.5 border-b border-indigo-500/20 pb-2">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="font-extrabold text-indigo-400 tracking-tight uppercase text-xs">
                {lang === "ko" ? "외부 MIDI 파일 메타 데이터 자동 분석 브리핑" : "External MIDI File Meta-data Analysis"}
              </h3>
              <p className="text-xs font-mono font-bold text-slate-300 truncate max-w-xl">{midiBriefing.fileName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-indigo-500/10 hover:border-indigo-500/20 transition-all">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider mb-1">
                {lang === "ko" ? "템포 (BPM)" : "Tempo (BPM)"}
              </span>
              <p className="font-mono text-lg font-black text-amber-400">{midiBriefing.bpm} BPM</p>
            </div>
            
            <div className="bg-slate-950/40 p-3 rounded-xl border border-indigo-500/10 hover:border-indigo-500/20 transition-all">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider mb-1">
                {lang === "ko" ? "대표 스케일 & 조표" : "Signature Scale & Key"}
              </span>
              <p className="text-sm font-black text-emerald-400 tracking-tight">{midiBriefing.scale}</p>
            </div>
            
            <div className="bg-slate-950/40 p-3 rounded-xl border border-indigo-500/10 hover:border-indigo-500/20 transition-all">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider mb-1">
                {lang === "ko" ? "총 옥타브 음역대" : "Melodic Pitch/Octave Range"}
              </span>
              <p className="text-xs font-mono font-bold text-indigo-300 leading-tight mt-1">{midiBriefing.octaveRange}</p>
            </div>
            
            <div className="bg-slate-950/40 p-3 rounded-xl border border-indigo-500/10 hover:border-indigo-500/20 transition-all">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider mb-1">
                {lang === "ko" ? "길이 & 트랙 수" : "Duration & Tracks count"}
              </span>
              {(() => {
                const totalSec = Math.round(midiBriefing.duration);
                const min = Math.floor(totalSec / 60);
                const sec = totalSec % 60;
                const formattedTime = `${min}:${sec < 10 ? '0' : ''}${sec}`;
                return (
                  <div>
                    <span className="font-mono text-xs font-black text-purple-400">{formattedTime} min </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-bold text-[9px] truncate">
                      {lang === "ko" ? `총 ${midiBriefing.tracksCount}개 채널 트랙 / ${midiBriefing.notesCount}개 음표` : `${midiBriefing.tracksCount} Ch / ${midiBriefing.notesCount} Notes`}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 2. SMART GUIDE & CONTEXT DASHBOARD PANEL */}
      {sessionContext && (
        <section id="panel-session-dashboard" className="mb-6 bg-[var(--panel-bg)] rounded-3xl border border-[var(--border-color)] p-6 shadow-md transition-all">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--brand-color)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Session Context Dashboard
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-[var(--border-color)]">
                Confidence: <span className="text-emerald-500 font-extrabold">{sessionContext.sourceType === "mdbg-session" ? "HIGH (100%)" : `${Math.round((sessionContext.confidence.key + sessionContext.confidence.tempo + sessionContext.confidence.trackDetection) / 3 * 100)}%`}</span>
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-[var(--card-sub-bg)] rounded-xl p-3 border border-[var(--border-color)]/60">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase tracking-wider">Source Type</span>
              <span className="font-extrabold text-[var(--text-dark)] mt-0.5 block">
                {sessionContext.sourceType === "mdbg-session" ? "🎹 MDBG Session" : "🎵 Standard MIDI"}
              </span>
            </div>
            <div className="bg-[var(--card-sub-bg)] rounded-xl p-3 border border-[var(--border-color)]/60">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase tracking-wider">Tempo & Timing</span>
              <span className="font-extrabold text-[var(--text-dark)] mt-0.5 block font-mono">
                {sessionContext.bpm} BPM ({sessionContext.timeSignature})
              </span>
            </div>
            <div className="bg-[var(--card-sub-bg)] rounded-xl p-3 border border-[var(--border-color)]/60">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase tracking-wider">Key & Scale Highlight</span>
              <span className="font-extrabold text-[var(--text-dark)] mt-0.5 block uppercase tracking-tight">
                {sessionContext.key} {sessionContext.scale}
              </span>
            </div>
            <div className="bg-[var(--card-sub-bg)] rounded-xl p-3 border border-[var(--border-color)]/60">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase tracking-wider">Style & Groove Preset</span>
              <span className="font-extrabold text-[var(--text-dark)] mt-0.5 block truncate" title={`${sessionContext.genrePreset} (${sessionContext.groovePreset})`}>
                {sessionContext.genrePreset} / {sessionContext.groovePreset}
              </span>
            </div>
            <div className="bg-[var(--card-sub-bg)] rounded-xl p-3 border border-[var(--border-color)]/60">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase tracking-wider">Bass Strategy</span>
              <span className="font-extrabold text-[var(--text-dark)] mt-0.5 block">
                {sessionContext.bassStrategy || "Unknown"}
              </span>
            </div>
            <div className="bg-[var(--card-sub-bg)] rounded-xl p-3 border border-[var(--border-color)]/60">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase tracking-wider">Length & Sections</span>
              <span className="font-extrabold text-[var(--text-dark)] mt-0.5 block font-mono">
                {sessionContext.bars} Bars ({sessionContext.patternLength} steps)
              </span>
            </div>
            <div className="bg-[var(--card-sub-bg)] rounded-xl p-3 border border-[var(--border-color)]/60">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase tracking-wider">Intensity / Mood</span>
              <span className="font-extrabold text-[var(--text-dark)] mt-0.5 block uppercase">
                {sessionContext.rhythmIntensity} / {sessionContext.mood}
              </span>
            </div>
            <div className="bg-[var(--card-sub-bg)] rounded-xl p-3 border border-[var(--border-color)]/60">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase tracking-wider">Track Notes Active</span>
              <span className="font-extrabold text-[var(--text-dark)] mt-0.5 block">
                🥁 {sessionContext.tracks.drums?.noteCount || 0}   🎸 {sessionContext.tracks.bass?.noteCount || 0}
              </span>
            </div>
          </div>
          
          {sessionContext.warnings && sessionContext.warnings.length > 0 && (
            <div className="mt-3.5 pt-2.5 border-t border-[var(--border-color)]/40 flex flex-col gap-1">
              {sessionContext.warnings.map((warn, wIdx) => (
                <p key={wIdx} className="text-[10px] font-bold text-amber-500 flex items-center gap-1.5 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">
                  ⚠️ {warn}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. SMART GUIDE DASHBOARD PANEL */}
      <section id="banner-smart-guide" className="dashboard-info bg-[var(--accent-yellow)] rounded-2xl px-5 py-3.5 mb-6 flex justify-between items-center text-sm font-semibold border border-[var(--accent-yellow-border)] text-amber-900 shadow-sm">
        <div className="flex items-center gap-2">
          <span>✨</span>
          <span id="txt-guide-alert" dangerouslySetInnerHTML={{ __html: p.guideAlert }}></span>
        </div>
        <div className="info-tags flex gap-3">
          <span id="tag-genre" className="tag bg-[rgba(255,255,255,0.45)] dark:bg-[rgba(0,0,0,0.3)] dark:text-white px-2.5 py-1 rounded-full text-xs border border-amber-200/50">
            {p.tagGenre}: {genre}
          </span>
          <span id="tag-bpm" className="tag bg-[rgba(255,255,255,0.45)] dark:bg-[rgba(0,0,0,0.3)] dark:text-white px-2.5 py-1 rounded-full text-xs border border-amber-200/50 font-mono">
            {p.tagBpm}: {bpm}
          </span>
          <span id="tag-scale" className="tag bg-[rgba(255,255,255,0.45)] dark:bg-[rgba(0,0,0,0.3)] dark:text-white px-2.5 py-1 rounded-full text-xs font-bold border border-[var(--accent-lavender-border)]">
            {p.tagScale}: {scale}
          </span>
        </div>
      </section>

      {/* 3. CONTROL PANEL CONFIG */}
      <section id="panel-vocal-controls" className="controls-panel bg-[var(--bg-main)] rounded-2xl p-5 mb-6 border border-[var(--border-color)] shadow-inner">
        <div className="control-row grid grid-cols-[1fr_1.2fr_1fr] gap-6 items-center">
          
          {/* AI Collaboration Mode Switching */}
          <div className="control-group flex flex-col gap-2">
            <label id="lbl-mode" className="text-xs font-extrabold text-[var(--text-dark)] tracking-wider uppercase">
              {p.lblMode}
            </label>
            <div className="btn-group flex gap-2">
              <button 
                id="btn-mode-ai" 
                onClick={() => setCreationMode("ai")}
                className={`flex-1 py-2 px-3 border rounded-xl cursor-pointer text-xs font-bold transition-all ${
                  creationMode === "ai" 
                    ? "bg-[var(--accent-lavender)] border-[var(--accent-lavender-border)] text-[var(--accent-lavender-text)] shadow-sm" 
                    : "bg-[var(--panel-bg)] border-[var(--border-color)] text-[var(--text-dark)] hover:bg-[var(--editor-header-bg)]"
                }`}
              >
                {p.btnModeAi}
              </button>
              <button 
                id="btn-mode-manual" 
                onClick={() => setCreationMode("manual")}
                className={`flex-1 py-2 px-3 border rounded-xl cursor-pointer text-xs font-bold transition-all ${
                  creationMode === "manual" 
                    ? "bg-[var(--accent-lavender)] border-[var(--accent-lavender-border)] text-[var(--accent-lavender-text)] shadow-sm" 
                    : "bg-[var(--panel-bg)] border-[var(--border-color)] text-[var(--text-dark)] hover:bg-[var(--editor-header-bg)]"
                }`}
              >
                {p.btnModeManual}
              </button>
            </div>
          </div>
          
          {/* Vocal rest density slider */}
          <div className="control-group flex flex-col gap-2">
            <label id="lbl-style" className="text-xs font-extrabold text-[var(--text-dark)] tracking-wider uppercase flex justify-between">
              <span>{p.lblStyle}</span>
              <span className="text-[var(--brand-color)] font-mono font-bold">Lvl {styleSlider}</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={styleSlider} 
              onChange={(e) => setStyleSlider(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--brand-color)] h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="slider-labels flex justify-between text-[10px] text-[var(--text-muted)] font-medium">
              <span id="sl-label-left">{p.slLeft}</span>
              <span id="sl-label-mid">{p.slMid}</span>
              <span id="sl-label-right">{p.slRight}</span>
            </div>
          </div>

          {/* Seeds and patterns generator trigger */}
          <div className="control-group flex flex-col gap-2">
            <label id="lbl-seed" className="text-xs font-extrabold text-[var(--text-dark)] tracking-wider uppercase">
              {p.lblSeed}
            </label>
            <div className="action-bar flex gap-2 w-full">
              <button 
                id="btn-dice-text" 
                onClick={rollDiceMelody}
                className="btn-action btn-dice cursor-pointer bg-[var(--accent-pink)] text-[var(--accent-pink-text)] border border-[var(--accent-pink-border)] rounded-xl font-bold py-2 px-3 text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all w-full"
                title="Generate melody deterministically based on seed"
              >
                {p.btnDice}
              </button>
              <div className="flex items-center gap-1 flex-shrink-0">
                <input 
                  type="text" 
                  value={seed} 
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-[80px] text-center border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-dark)] rounded-xl py-2 font-mono text-xs font-bold"
                  title="Seed Value"
                />
                <button
                  id="btn-shuffle-seed"
                  onClick={() => {
                    const val = Math.floor(Math.random() * 8999) + 1000;
                    setSeed(`#${val}`);
                  }}
                  className="p-2 border border-[var(--border-color)] hover:border-[var(--brand-color)] bg-[var(--panel-bg)] hover:bg-[var(--bg-main)] rounded-xl cursor-pointer transition-all"
                  title="Generate random new seed"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--brand-color)]" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. PIANO ROLL EDITOR VIEW */}
      <section className="editor-container border border-[var(--border-color)] rounded-2xl overflow-hidden bg-[var(--panel-bg)] shadow-md">
        
        {/* Editor Options bar */}
        <div className="editor-header bg-black dark:bg-black px-4 py-2.5 flex justify-between items-center text-xs font-bold border-b-2 border-amber-500/80 text-white">
          <div id="txt-editor-title" className="flex items-center gap-2.5 text-amber-500 dark:text-amber-500 font-extrabold uppercase tracking-wider flex-wrap">
            <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">{lang === "ko" ? "가이드 음색 선택" : "Vocal Synth Voice"}</span>
            <div className="flex items-center">
              <select
                id="select-lead-synth-header"
                value={leadSynthType}
                onChange={(e) => setLeadSynthType(e.target.value)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black px-2 py-0.5 outline-none cursor-pointer tracking-tight transition-all shadow-sm border border-amber-600 uppercase"
                title={lang === "ko" ? "메인 가이드 보컬 멜로디의 악기 음색 변경" : "Change main guide vocal melody instrument sound"}
              >
                {LEAD_SYNTH_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.type} className="bg-slate-950 text-amber-500 text-[10px] font-bold">
                    {lang === "ko" ? opt.nameKo : opt.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Play preview and Stop controls in editor */}
            <div className="flex items-center gap-1">
              <button 
                id="btn-play-sound"
                onClick={playPreview}
                className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                  isPlaying ? "bg-red-500 text-white" : "bg-amber-500 text-slate-950 hover:bg-amber-400 font-black"
                }`}
                title="Play topline synth preview"
              >
                {isPlaying ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-black" />}
              </button>
              <button 
                id="btn-clear-track"
                onClick={clearGrid}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white cursor-pointer border border-slate-700"
                title="Clear sequence"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Note length step selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 border border-slate-800 rounded-lg text-white">
              <span className="text-[9px] px-1 text-slate-400 uppercase tracking-tight font-extrabold">
                {lang === "ko" ? "그리기:" : "Draw:"}
              </span>
              <button 
                onClick={() => setDrawDuration(1)}
                className={`cursor-pointer text-[10px] px-2 py-0.5 rounded transition-all ${
                  drawDuration === 1 
                    ? "bg-amber-500 text-slate-950 font-extrabold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                16th
              </button>
              <button 
                onClick={() => setDrawDuration(2)}
                className={`cursor-pointer text-[10px] px-2 py-0.5 rounded transition-all ${
                  drawDuration === 2 
                    ? "bg-amber-500 text-slate-950 font-extrabold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                8th
              </button>
              <button 
                onClick={() => setDrawDuration(4)}
                className={`cursor-pointer text-[10px] px-2 py-0.5 rounded transition-all ${
                  drawDuration === 4 
                    ? "bg-amber-500 text-slate-950 font-extrabold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Quarter
              </button>
            </div>

            {/* Bars selectors */}
            <div className="bar-selectors flex gap-1 bg-slate-900 p-0.5 border border-slate-800 rounded-lg text-white">
              <button 
                onClick={() => setBarMode(1)}
                className={`bar-tab cursor-pointer text-[10px] px-2.5 py-1 rounded-md transition-all ${
                  barMode === 1 
                    ? "bg-emerald-500 text-slate-950 font-extrabold border border-emerald-400" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                1 Bar
              </button>
              <button 
                onClick={() => setBarMode(2)}
                className={`bar-tab cursor-pointer text-[10px] px-2.5 py-1 rounded-md transition-all ${
                  barMode === 2 
                    ? "bg-emerald-500 text-slate-950 font-extrabold border border-emerald-400" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2 Bars
              </button>
              <button 
                onClick={() => setBarMode(3)}
                className={`bar-tab cursor-pointer text-[10px] px-2.5 py-1 rounded-md transition-all ${
                  barMode === 3 
                    ? "bg-emerald-500 text-slate-950 font-extrabold border border-emerald-400" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3 Bars
              </button>
              <button 
                onClick={() => setBarMode(4)}
                className={`bar-tab cursor-pointer text-[10px] px-2.5 py-1 rounded-md transition-all ${
                  barMode === 4 
                    ? "bg-emerald-500 text-slate-950 font-extrabold border border-emerald-400" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                4 Bars
              </button>
            </div>
          </div>
        </div>

        {/* DAW Precision Editor Tools Row */}
        <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2 flex flex-wrap gap-4 items-center justify-between text-xs font-semibold text-white select-none">
          {/* 1. Grid Tool Mode Selection */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mr-1">
              {lang === "ko" ? "그리드 도구:" : "GRID MODE:"}
            </span>
            <button 
              onClick={() => setGridToolMode("select")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 border ${
                gridToolMode === "select"
                  ? "bg-amber-500 border-amber-400 text-slate-950 font-extrabold shadow-md"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              }`}
              title={lang === "ko" ? "포인터 선택 및 개별 노트 편집 모드" : "Select & Edit Pointer Mode"}
            >
              <span>🖱️</span>
              <span>{lang === "ko" ? "포인터 선택" : "Pointer Select"}</span>
            </button>
            <button 
              onClick={() => setGridToolMode("brush")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 border ${
                gridToolMode === "brush"
                  ? "bg-indigo-500 border-indigo-400 text-white font-extrabold shadow-md"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              }`}
              title={lang === "ko" ? "연속 드래그 앤 드로우 붓 도구" : "Drag-to-Paint Continuous Brush Mode"}
            >
              <span>🖌️</span>
              <span>{lang === "ko" ? "연속 붓" : "Brush Paint"}</span>
            </button>
            <button 
              onClick={() => setGridToolMode("eraser")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 border ${
                gridToolMode === "eraser"
                  ? "bg-red-500 border-red-400 text-white font-extrabold shadow-md"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              }`}
              title={lang === "ko" ? "연속 지우개 모드" : "Continuous Eraser Mode"}
            >
              <span>🧹</span>
              <span>{lang === "ko" ? "연속 지우개" : "Eraser Mode"}</span>
            </button>
          </div>

          {/* 2. BPM Input & Tap Tempo Assistance */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "ko" ? "템포 설정:" : "TEMPO (BPM):"}</span>
            <div className="flex items-center gap-1.5">
              <input 
                type="number" 
                min="40" 
                max="240" 
                value={bpm} 
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setBpm(Math.max(40, Math.min(240, val)));
                  }
                }} 
                className="w-14 bg-slate-900 border border-slate-800 text-amber-500 font-mono font-black text-center text-xs rounded-lg py-1 px-1.5 focus:border-[var(--brand-color)] focus:outline-none"
              />
              <button 
                onClick={handleTapTempo}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black cursor-pointer uppercase transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                title={lang === "ko" ? "박자에 맞춰 탭하면 BPM 변경" : "Tap tempo on the beat"}
              >
                <span>🥁</span>
                <span>TAP</span>
              </button>
            </div>
          </div>

          {/* 3. Humanize Timing & Velocity Slider */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex-1 md:flex-initial">
             <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
               <span>🕺</span> {lang === "ko" ? "휴머나이즈:" : "HUMANIZE:"}
             </span>
             <input 
               type="range" 
               min="0" 
               max="100" 
               step="5"
               value={humanizePercent}
               onChange={(e) => setHumanizePercent(parseInt(e.target.value, 10))}
               className="w-24 accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
               title={lang === "ko" ? "0%: 완벽한 기계 정박, 100%: 실제 어쿠스틱 연주 뉘앙스의 타이밍 및 악센트 편차 적용" : "0%: Perfectly quantized, 100%: Maximum human rhythm and velocity deviation"}
             />
             <span className="text-[10px] font-mono text-indigo-400 font-bold w-9 text-right">{humanizePercent}%</span>
          </div>
        </div>

        {/* Sleek DAW Mixer & Transpose Tool Belt */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap gap-4 items-center justify-between text-xs font-semibold text-white select-none">
          {/* Transpose Tool Belt */}
          <div className="flex items-center gap-2 flex-wrap bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "ko" ? "트랜스포즈 (조옮김):" : "TRANSPOSE:"}</span>
            <div className="flex gap-1">
              <button 
                onClick={() => transposeNotes(-12)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold cursor-pointer transition-all active:scale-90"
                title="Octave Down"
              >
                -12
              </button>
              <button 
                onClick={() => transposeNotes(-1)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold cursor-pointer transition-all active:scale-90"
                title="Semitone Down"
              >
                -1
              </button>
              <button 
                onClick={() => transposeNotes(1)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold cursor-pointer transition-all active:scale-90"
                title="Semitone Up"
              >
                +1
              </button>
              <button 
                onClick={() => transposeNotes(12)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold cursor-pointer transition-all active:scale-90"
                title="Octave Up"
              >
                +12
              </button>
            </div>
            
            {/* Snap to Scale Toggle */}
            <label className="flex items-center gap-1.5 ml-2 cursor-pointer text-[10px] text-slate-300 font-bold hover:text-white select-none">
              <input 
                type="checkbox" 
                checked={snapTransposeToScale}
                onChange={(e) => setSnapTransposeToScale(e.target.checked)}
                className="rounded border-slate-800 text-emerald-400 focus:ring-0 bg-slate-900 w-3 h-3 cursor-pointer"
              />
              <span>{lang === "ko" ? "추천 스케일 고정 (Snap)" : "Snap to Scale"}</span>
            </label>
          </div>

          {/* Undo & Redo Tool Belt */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <button 
              onClick={undo}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 border border-slate-800 cursor-pointer transition-all active:scale-90 flex items-center justify-center"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={redo}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 border border-slate-800 cursor-pointer transition-all active:scale-90 flex items-center justify-center"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* DAW Mixer Belt */}
          <div className="flex items-center gap-4 flex-wrap bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex-1 md:flex-initial">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === "ko" ? "컨솔 믹서 [VOLUME]:" : "DAW CONSOLE MIXER:"}</span>
            
            <div className="flex gap-4 items-center flex-1 md:flex-initial">
              {/* Lead Channel */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-emerald-400 font-bold">VOCAL</span>
                <button 
                  onClick={() => setMixerMuteLead(v => !v)}
                  className={`p-1 rounded text-[8px] font-black cursor-pointer ${mixerMuteLead ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'}`}
                >
                  MUTE
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={mixerVolumeLead}
                  onChange={(e) => setMixerVolumeLead(parseInt(e.target.value))}
                  disabled={mixerMuteLead}
                  className="w-16 accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-30"
                />
                <span className="font-mono text-[8px] text-slate-400 w-6 text-right">{mixerMuteLead ? "Mute" : `${mixerVolumeLead}%`}</span>
              </div>

              {/* Drums Channel */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-amber-500 font-bold">DRUMS</span>
                <button 
                  onClick={() => setMixerMuteDrums(v => !v)}
                  className={`p-1 rounded text-[8px] font-black cursor-pointer ${mixerMuteDrums ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'}`}
                >
                  MUTE
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={mixerVolumeDrums}
                  onChange={(e) => setMixerVolumeDrums(parseInt(e.target.value))}
                  disabled={mixerMuteDrums}
                  className="w-16 accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-30"
                />
                <span className="font-mono text-[8px] text-slate-400 w-6 text-right">{mixerMuteDrums ? "Mute" : `${mixerVolumeDrums}%`}</span>
              </div>

              {/* Synth Backing Channel */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-purple-400 font-bold">SYNTH</span>
                <button 
                  onClick={() => setMixerMuteSynth(v => !v)}
                  className={`p-1 rounded text-[8px] font-black cursor-pointer ${mixerMuteSynth ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'}`}
                >
                  MUTE
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={mixerVolumeSynth}
                  onChange={(e) => setMixerVolumeSynth(parseInt(e.target.value))}
                  disabled={mixerMuteSynth}
                  className="w-16 accent-purple-400 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-30"
                />
                <span className="font-mono text-[8px] text-slate-400 w-6 text-right">{mixerMuteSynth ? "Mute" : `${mixerVolumeSynth}%`}</span>
              </div>

              {/* Metronome Channel */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-cyan-400 font-bold">CLICK</span>
                <button 
                  onClick={() => setMixerMuteClick(v => !v)}
                  className={`p-1 rounded text-[8px] font-black cursor-pointer ${mixerMuteClick ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'}`}
                >
                  MUTE
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={mixerVolumeClick}
                  onChange={(e) => setMixerVolumeClick(parseInt(e.target.value))}
                  disabled={mixerMuteClick}
                  className="w-16 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-30"
                />
                <span className="font-mono text-[8px] text-slate-400 w-6 text-right">{mixerMuteClick ? "Mute" : `${mixerVolumeClick}%`}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sleek DAW Bar Lock Header Strip */}
        <div className="bar-lock-header-strip flex bg-[var(--editor-header-bg)] border-b border-[var(--border-color)] h-9 items-center select-none text-xs font-bold relative">
          {/* Spacer corresponding to left keyboard width (70px) */}
          <div className="w-[70px] border-r-2 border-[var(--border-color)] flex items-center justify-center text-[10px] text-[var(--text-muted)] tracking-wider font-extrabold bg-[var(--editor-header-bg)] h-full">
            LOCK
          </div>
          {/* Aligned Bar locks strip using matching flex-1 layout divisions */}
          <div className="flex-1 flex h-full items-center relative">
            {Array.from({ length: barMode }).map((_, barIdx) => {
              const isLocked = lockedBars[barIdx];
              return (
                <div 
                  key={barIdx} 
                  style={{ width: `${100 / barMode}%` }}
                  className="flex justify-center items-center px-4 h-full border-r border-[var(--border-color)] last:border-r-0"
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const copy = [...lockedBars];
                      copy[barIdx] = !copy[barIdx];
                      setLockedBars(copy);
                    }}
                    className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest shadow-sm transition-all active:scale-95 ${
                      isLocked 
                        ? "bg-amber-500/95 border-amber-400 text-slate-950 hover:bg-amber-400/95 shadow-[0_0_8px_rgba(212,175,55,0.4)]" 
                        : "bg-slate-800/85 hover:bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                    title={isLocked ? "Bar Locked - Click to Unlock" : "Bar Unlocked - Click to Lock"}
                  >
                    {isLocked ? <Lock className="w-2.5 h-2.5 text-slate-950" /> : <Unlock className="w-2.5 h-2.5 text-slate-400" />}
                    <span>Bar {barIdx + 1} {isLocked ? "🔒" : ""}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* PIANO ROLL GRID IMPLEMENTATION */}
        <div className="piano-roll flex h-[280px] relative bg-[var(--grid-bg)] overflow-hidden">
          
          {/* Y AXIS: Piano Keyboard Keys */}
          <div className="piano-keys w-[70px] bg-[var(--editor-header-bg)] border-r-2 border-[var(--border-color)] flex flex-col z-2 sticky left-0">
            {SUPPORTED_PITCHES.map((pitch) => {
              const inScale = isPitchInScale(pitch.midi, scale);
              const isRoot = isRootPitch(pitch.midi, scale);
              return (
                <div 
                  key={pitch.name} 
                  onMouseDown={() => triggerPitchSound(pitch.midi)}
                  className={`key h-[20px] border-b border-[var(--border-color)] text-[10px] pl-2 flex items-center justify-between pr-1.5 font-bold relative cursor-pointer select-none active:bg-slate-300 dark:active:bg-slate-700 transition-colors ${
                    pitch.isBlack 
                      ? "bg-slate-800 dark:bg-slate-950 text-slate-300 border-b-slate-900" 
                      : "bg-[var(--panel-bg)] text-[var(--text-dark)]"
                  } ${inScale ? "text-[var(--brand-color)]" : "opacity-60"}`}
                >
                  <span className="flex items-center gap-0.5">
                    {pitch.name}
                    {isRoot && <span className="text-[10px] text-amber-500 font-extrabold" title="Root Tonic">★</span>}
                  </span>
                  {inScale && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-color)] bg-opacity-80" />}
                  {/* Visual tiny indicator on black keys */}
                  {pitch.isBlack && <div className="absolute right-0 top-0.5 bottom-0.5 w-1 bg-purple-400/70" />}
                </div>
              );
            })}
          </div>

          {/* X AXIS & COMPOSITIONS: Grid Container */}
          <div 
            id="piano-grid-area"
            className="grid-container flex-1 relative select-none"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${barMode * 16}, 1fr)`,
              gridTemplateRows: "repeat(14, 20px)",
            }}
          >
            {/* Visual Sweeping Playback Neon Bar Scan Guide */}
            {isPlaying && currentPlaybackStep >= 0 && (
              <div 
                id="playback-sweeper"
                className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500/10 via-amber-400/35 to-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.55)] border-l border-r border-amber-400/45 z-10 pointer-events-none transition-all duration-75 ease-out backdrop-blur-[0.5px]"
                style={{
                  left: `${(currentPlaybackStep / (barMode * 16)) * 100}%`,
                  width: `${100 / (barMode * 16)}%`,
                }}
              />
            )}

            {/* Vertical Bar boundary Separator Guide-Lines */}
            {Array.from({ length: barMode - 1 }).map((_, idx) => (
              <div 
                key={idx}
                className="grid-vertical-line bar-line absolute top-0 bottom-0 w-[2px] bg-[var(--pastel-blue)] z-1 pointer-events-none"
                style={{
                  left: `${((idx + 1) / barMode) * 100}%`,
                }}
              />
            ))}

            {/* Extra sub grid lines for beats (every 4th step) */}
            {Array.from({ length: barMode * 4 }).map((_, beatIdx) => (
              <div 
                key={beatIdx}
                className="grid-vertical-line absolute top-0 bottom-0 w-[1px] bg-[var(--grid-line)] border-r border-[var(--border-color)]/30 pointer-events-none"
                style={{
                  left: `${(beatIdx / (barMode * 4)) * 100}%`,
                }}
              />
            ))}

            {/* Background Cell Triggers for clickable manual notes insertion with scale indicators */}
            {React.useMemo(() => {
              return SUPPORTED_PITCHES.map((pitch, rIdx) => {
                const inScale = isPitchInScale(pitch.midi, scale);
                const isRoot = isRootPitch(pitch.midi, scale);
                const isMinor = scale.toLowerCase().includes("minor");
                
                let scaleColorBg = "";
                if (inScale) {
                  if (isRoot) {
                    scaleColorBg = isMinor 
                      ? "bg-purple-500/[0.08] dark:bg-purple-400/[0.12]" 
                      : "bg-amber-300/[0.10] dark:bg-amber-400/[0.14]";
                  } else {
                    scaleColorBg = isMinor 
                      ? "bg-purple-500/[0.03] dark:bg-purple-400/[0.05]" 
                      : "bg-amber-300/[0.03] dark:bg-amber-400/[0.05]";
                  }
                }

                return Array.from({ length: barMode * 16 }).map((_, sIdx) => {
                  return (
                    <div 
                      key={`${rIdx}-${sIdx}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (gridToolMode === "select") {
                          handleGridCellClick(sIdx, pitch.midi, pitch.name);
                        } else if (gridToolMode === "brush") {
                          setIsMouseDownOnGrid(true);
                          lastPaintedCellRef.current = { step: sIdx, midi: pitch.midi };
                          paintNote(sIdx, pitch.midi, pitch.name);
                        } else if (gridToolMode === "eraser") {
                          setIsMouseDownOnGrid(true);
                          eraseNote(sIdx, pitch.midi);
                        }
                      }}
                      onMouseEnter={() => {
                        if (isMouseDownOnGrid) {
                          if (gridToolMode === "brush") {
                            if (!lastPaintedCellRef.current || lastPaintedCellRef.current.step !== sIdx || lastPaintedCellRef.current.midi !== pitch.midi) {
                              lastPaintedCellRef.current = { step: sIdx, midi: pitch.midi };
                              paintNote(sIdx, pitch.midi, pitch.name);
                            }
                          } else if (gridToolMode === "eraser") {
                            eraseNote(sIdx, pitch.midi);
                          }
                        } else {
                          handleCellMouseEnter(sIdx, pitch.midi, pitch.name);
                        }
                      }}
                      className={`h-[20px] border-b border-r border-[var(--grid-line)] custom-precise-crosshair transition-colors ${scaleColorBg} ${
                        sIdx % 4 === 0 ? "bg-slate-100/10 dark:bg-slate-900/5" : "hover:bg-slate-500/5"
                      } ${
                        gridToolMode === "eraser" ? "hover:bg-red-500/10" : ""
                      }`}
                      style={{
                        gridRowStart: rIdx + 1,
                        gridColumnStart: sIdx + 1,
                      }}
                    />
                  );
                });
              });
            }, [barMode, scale, gridToolMode, isMouseDownOnGrid, handleGridCellClick, paintNote, eraseNote, handleCellMouseEnter])}

            {/* Visual playhead tracking line (sweeps flowing fluidly in real-time) */}
            {isPlaying && currentPlaybackStep !== -1 && (
              <div 
                className="absolute top-0 bottom-0 pointer-events-none bg-indigo-500/10 border-l border-r border-[var(--brand-color)]/80 shadow-[0_0_12px_rgba(168,85,247,0.4)] z-20"
                style={{
                  left: `${(currentPlaybackStep / (barMode * 16)) * 100}%`,
                  width: `${100 / (barMode * 16)}%`,
                  transition: "left 0.08s linear"
                }}
              />
            )}

            {/* Plotted Melodic Notes and Rest blocks on top */}
            {notes.map((n) => {
              // find rows index of the note pitch coordinates
              const rowIndex = SUPPORTED_PITCHES.findIndex(p => p.midi === n.midi);
              if (rowIndex === -1 || n.step >= barMode * 16) return null;

              const notePercentLeft = (n.step / (barMode * 16)) * 100;
              const notePercentWidth = (n.durationSteps / (barMode * 16)) * 100;
              const notePercentTop = rowIndex * 20;

              if (n.isRest) {
                // Return breath/rest blocks
                return (
                  <div 
                    key={n.id}
                    className="note rest-indicator absolute h-[16px] mt-[2px] rounded-md border border-dashed border-slate-400 text-[9px] text-[var(--text-muted)] dark:text-slate-400 flex items-center justify-center font-bold px-1 animate-pulse pointer-events-none"
                    style={{
                      left: `${notePercentLeft}%`,
                      width: `${notePercentWidth}%`,
                      top: `${notePercentTop}px`,
                      zIndex: 1,
                    }}
                  >
                    {n.step % 8 === 0 ? p.restVocalText : p.restText}
                  </div>
                );
              }

              const isPlayed = isPlaying && currentPlaybackStep >= n.step && currentPlaybackStep < n.step + n.durationSteps;
              const noteColorClass = isPlayed
                ? "bg-emerald-400 border border-emerald-200 text-slate-950 shadow-[0_0_15px_#10b981] scale-[1.04] z-10 font-black animate-pulse"
                : (creationMode === "ai" 
                    ? "bg-[var(--accent-lavender)] border border-[var(--accent-lavender-border)] text-[var(--accent-lavender-text)]" 
                    : "bg-[var(--accent-mint)] border border-[var(--accent-mint-border)] text-[var(--accent-mint-text)]");

              const showPopover = editingNoteId === n.id;

              return (
                <React.Fragment key={n.id}>
                  <div 
                    onMouseDown={(e) => handleNoteMouseDown(e, n)}
                    onMouseUp={(e) => handleNoteMouseUp(e, n)}
                    className={`note absolute h-[16px] mt-[2px] rounded-md flex items-center justify-between font-bold text-[9px] px-1 truncate select-none shadow-sm transition-all hover:brightness-110 cursor-pointer z-10 ${noteColorClass} ${draggedNoteId === n.id ? "ring-2 ring-emerald-400 opacity-90 cursor-grabbing scale-[1.02] z-25" : ""}`}
                    style={{
                      left: `${notePercentLeft}%`,
                      width: `${notePercentWidth}%`,
                      top: `${notePercentTop}px`,
                      opacity: n.velocity !== undefined ? 0.35 + n.velocity * 0.65 : 1.0,
                    }}
                    title={lang === "ko" ? "클릭 시 음량/길이 설정 열기 • 드래그 시 음정/싱코페이션 수정" : "Click to edit Note properties • Drag to transpose or shift steps"}
                  >
                    <span className="truncate">{n.pitchName}</span>
                    <span className="text-[7.5px] opacity-75 font-mono ml-0.5">v{Math.round((n.velocity || 0.8) * 100)}</span>
                  </div>

                  {showPopover && (
                    <div 
                      className="absolute z-[100] bg-slate-900 border-2 border-slate-700 text-white rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 w-[210px] text-xs pointer-events-auto select-none"
                      style={{
                        left: `${Math.min(80, notePercentLeft)}%`,
                        top: `${notePercentTop <= 200 ? notePercentTop + 22 : notePercentTop - 110}px`,
                      }}
                      onMouseDown={(e) => e.stopPropagation()} 
                    >
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                        <span className="font-extrabold text-slate-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-mint)]"></span>
                          {n.pitchName} {lang === "ko" ? "음표 편집" : "Note Editor"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNoteId(null);
                          }}
                          className="text-slate-400 hover:text-white font-black text-xs leading-none bg-slate-800 border border-slate-700/50 rounded-md w-5 h-5 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Velocity Section */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          <span>{lang === "ko" ? "벨로시티 (음량)" : "Velocity (Volume)"}</span>
                          <span className="text-[var(--accent-mint)] font-mono">{Math.round((n.velocity || 0.8) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="100"
                          step="5"
                          value={Math.round((n.velocity || 0.8) * 100)}
                          onChange={(e) => {
                            const newVel = parseInt(e.target.value) / 100;
                            setNotes(prev => prev.map(note => note.id === n.id ? { ...note, velocity: newVel } : note));
                          }}
                          className="w-full h-1 bg-slate-850 rounded-lg cursor-pointer accent-emerald-400"
                        />
                      </div>

                      {/* Duration Steps */}
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          <span>{lang === "ko" ? "음표 길이 (그리드 칸수)" : "Duration (Grid Steps)"}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 text-[9px] font-bold">
                          {[1, 2, 4, 8, 16].map((steps) => {
                            const isCurrent = n.durationSteps === steps;
                            return (
                              <button
                                key={steps}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  pushToHistory();
                                  setNotes(prev => prev.map(note => note.id === n.id ? { ...note, durationSteps: steps } : note));
                                }}
                                className={`py-1 rounded bg-slate-800 border cursor-pointer transition-all active:scale-95 ${
                                  isCurrent 
                                    ? "text-emerald-400 border-emerald-500 bg-emerald-900/30" 
                                    : "text-slate-300 border-slate-700 hover:text-white hover:bg-slate-750"
                                }`}
                              >
                                {steps}x
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Delete Trigger */}
                      <div className="flex gap-1.5 mt-0.5 pt-2 border-t border-slate-800">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pushToHistory();
                            setNotes(prev => prev.filter(note => note.id !== n.id));
                            setEditingNoteId(null);
                          }}
                          className="flex-1 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-100 flex items-center justify-center gap-1 font-bold cursor-pointer transition-all active:scale-95 text-[10px]"
                        >
                          <Trash2 className="w-3 h-3 text-red-300" />
                          {lang === "ko" ? "삭제" : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

        </div>

        {/* DRUM TRACK GRID SECTION */}
        <div className="bg-black dark:bg-black border-t-2 border-b-2 border-amber-500/80 px-4 py-2.5 flex justify-between items-center text-[11px] font-extrabold text-white tracking-wide uppercase">
          <div className="flex items-center gap-1.5 text-amber-500 font-extrabold">
            {lang === "ko" ? "드럼 백킹 가이드 트랙 (마우스 클릭으로 비트 패턴 수정 / 편집 가능)" : "DRUM BACKING SEQUENCE (CLICK TO SEQUENCE PATTERNS)"}
          </div>
          {drumNotes.length > 0 && (
            <span className="text-[10px] text-amber-400 font-mono font-black tracking-wider leading-none bg-slate-900 border border-amber-500/40 rounded px-1.5 py-0.5">
              {drumNotes.length} {lang === "ko" ? "노드 활성화" : "triggers active"}
            </span>
          )}
        </div>
        
        <div className="drum-roll flex h-[100px] relative bg-[var(--grid-bg)] overflow-hidden border-b border-[var(--border-color)]">
          {/* Y AXIS: Drum Labels */}
          <div className="w-[70px] bg-[var(--editor-header-bg)] border-r-2 border-[var(--border-color)] flex flex-col z-2 sticky left-0 shrink-0">
            {DRUM_LANES.map((lane) => (
              <div 
                key={lane.name} 
                className="h-[25px] border-b border-[var(--border-color)] text-[10px] pl-2 flex items-center justify-between font-bold select-none bg-[var(--panel-bg)] text-[var(--text-dark)] shrink-0"
              >
                <span className="text-[10px]">{lane.name}</span>
              </div>
            ))}
          </div>

          {/* Drum Grid Area Columns Content */}
          <div 
            className="grid-content flex-1 h-full relative"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${barMode * 16}, 1fr)`,
              gridTemplateRows: "repeat(4, 25px)",
            }}
          >
            {/* Visual Sweeping Playback Neon Bar Scan Guide */}
            {isPlaying && currentPlaybackStep >= 0 && (
              <div 
                className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500/10 via-amber-400/35 to-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.55)] border-l border-r border-amber-400/45 z-10 pointer-events-none transition-all duration-75 ease-out backdrop-blur-[0.5px]"
                style={{
                  left: `${(currentPlaybackStep / (barMode * 16)) * 100}%`,
                  width: `${100 / (barMode * 16)}%`,
                }}
              />
            )}

            {/* Vertical Bar Separator Guide-Lines */}
            {Array.from({ length: barMode - 1 }).map((_, idx) => (
              <div 
                key={idx}
                className="grid-vertical-line bar-line absolute top-0 bottom-0 w-[2px] bg-[var(--pastel-blue)] z-5 pointer-events-none"
                style={{
                  left: `${((idx + 1) / barMode) * 100}%`,
                }}
              />
            ))}

            {/* Grid vertical lines for beats */}
            {Array.from({ length: barMode * 4 }).map((_, beatIdx) => (
              <div 
                key={beatIdx}
                className="grid-vertical-line absolute top-0 bottom-0 w-[1px] bg-[var(--grid-line)] border-r border-[var(--border-color)]/30 pointer-events-none"
                style={{
                  left: `${(beatIdx / (barMode * 4)) * 100}%`,
                }}
              />
            ))}

            {/* Click triggers background */}
            {React.useMemo(() => {
              return DRUM_LANES.map((lane, rIdx) => {
                return Array.from({ length: barMode * 16 }).map((_, sIdx) => {
                  return (
                    <div 
                      key={`drum-bg-${rIdx}-${sIdx}`}
                      onClick={() => handleDrumCellClick(sIdx, lane.midi, lane.tag)}
                      className={`h-[25px] border-b border-r border-[var(--grid-line)] custom-precise-crosshair transition-colors ${
                        sIdx % 4 === 0 ? "bg-slate-100/10 dark:bg-slate-900/5" : "hover:bg-slate-500/5"
                      }`}
                      style={{
                        gridRowStart: rIdx + 1,
                        gridColumnStart: sIdx + 1,
                      }}
                    />
                  );
                });
              });
            }, [barMode, handleDrumCellClick])}

            {/* Plotted Drum Notes triggers */}
            {drumNotes.map((d) => {
              const laneIdx = DRUM_LANES.findIndex(lane => lane.midi === d.midi);
              if (laneIdx === -1 || d.step >= barMode * 16) return null;

              const noteLeftPercent = (d.step / (barMode * 16)) * 100;
              const noteWidthPercent = (1 / (barMode * 16)) * 100; // Trigger blocks have 1 step width
              const noteTopPercent = laneIdx * 25;
              const laneData = DRUM_LANES[laneIdx];

              const isPlayed = isPlaying && currentPlaybackStep === d.step;
              const drumColorClass = isPlayed 
                ? "bg-emerald-400 border border-emerald-200 text-slate-950 shadow-[0_0_15px_#10b981] scale-[1.08] z-20"
                : laneData.color;

              return (
                <div 
                  key={d.id}
                  onClick={() => handleDrumCellClick(d.step, d.midi, d.pitchName)}
                  className={`absolute h-[21px] mt-[2px] rounded-md flex items-center justify-center font-black text-[9px] shadow-sm select-none transition-transform hover:scale-105 cursor-pointer z-10 shrink-0 ${drumColorClass}`}
                  style={{
                    left: `${noteLeftPercent}%`,
                    width: `${noteWidthPercent}%`,
                    top: `${noteTopPercent}px`,
                  }}
                >
                  ●
                </div>
              );
            })}
          </div>
        </div>


        {/* SYNTH BACKING TRACK GRID SECTION */}
        <div className="bg-black dark:bg-black border-t-2 border-b-2 border-amber-500/80 px-4 py-2.5 flex justify-between items-center text-[11px] font-extrabold text-white tracking-wide uppercase">
          <div className="flex items-center gap-1.5 text-amber-500 font-extrabold">
            {lang === "ko" ? "신스 코드 반주 가이드 트랙 (마우스 클릭으로 코드 노드 수정 / 편집 가능)" : "SYNTH ACCOMPANIMENT CHORDS (CLICK TO SEQUENCE HARMONY)"}
          </div>
          {synthNotes.length > 0 && (
            <span className="text-[10px] text-amber-400 font-mono font-black tracking-wider leading-none bg-slate-900 border border-amber-500/40 rounded px-1.5 py-0.5">
              {synthNotes.length} {lang === "ko" ? "노드 활성화" : "chords active"}
            </span>
          )}
        </div>
        
        <div className="synth-roll flex h-[100px] relative bg-[var(--grid-bg)] overflow-hidden">
          {/* Y AXIS: Synth Labels */}
          <div className="w-[70px] bg-[var(--editor-header-bg)] border-r-2 border-[var(--border-color)] flex flex-col z-2 sticky left-0 shrink-0">
            {SYNTH_LANES.map((lane) => (
              <div 
                key={lane.name} 
                className="h-[20px] border-b border-[var(--border-color)] text-[10px] pl-2 flex items-center justify-between font-bold select-none bg-[var(--panel-bg)] text-[var(--text-dark)] shrink-0"
              >
                <span className="text-[9px]">{lane.name}</span>
              </div>
            ))}
          </div>

          {/* Synth Grid Area Columns Content */}
          <div 
            className="grid-content flex-1 h-full relative"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${barMode * 16}, 1fr)`,
              gridTemplateRows: "repeat(5, 20px)",
            }}
          >
            {/* Visual Sweeping Playback Neon Bar Scan Guide */}
            {isPlaying && currentPlaybackStep >= 0 && (
              <div 
                className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500/10 via-amber-400/35 to-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.55)] border-l border-r border-amber-400/45 z-10 pointer-events-none transition-all duration-75 ease-out backdrop-blur-[0.5px]"
                style={{
                  left: `${(currentPlaybackStep / (barMode * 16)) * 100}%`,
                  width: `${100 / (barMode * 16)}%`,
                }}
              />
            )}

            {/* Vertical Bar Separator Guide-Lines */}
            {Array.from({ length: barMode - 1 }).map((_, idx) => (
              <div 
                key={idx}
                className="grid-vertical-line bar-line absolute top-0 bottom-0 w-[2px] bg-[var(--pastel-blue)] z-5 pointer-events-none"
                style={{
                  left: `${((idx + 1) / barMode) * 100}%`,
                }}
              />
            ))}

            {/* Grid vertical lines for beats */}
            {Array.from({ length: barMode * 4 }).map((_, beatIdx) => (
              <div 
                key={beatIdx}
                className="grid-vertical-line absolute top-0 bottom-0 w-[1px] bg-[var(--grid-line)] border-r border-[var(--border-color)]/30 pointer-events-none"
                style={{
                  left: `${(beatIdx / (barMode * 4)) * 100}%`,
                }}
              />
            ))}

            {/* Click triggers background */}
            {React.useMemo(() => {
              return SYNTH_LANES.map((lane, rIdx) => {
                return Array.from({ length: barMode * 16 }).map((_, sIdx) => {
                  return (
                    <div 
                      key={`synth-bg-${rIdx}-${sIdx}`}
                      onClick={() => handleSynthCellClick(sIdx, lane.midi, lane.tag)}
                      className={`h-[20px] border-b border-r border-[var(--grid-line)] custom-precise-crosshair transition-colors ${
                        sIdx % 4 === 0 ? "bg-slate-100/10 dark:bg-slate-900/5" : "hover:bg-slate-500/5"
                      }`}
                      style={{
                        gridRowStart: rIdx + 1,
                        gridColumnStart: sIdx + 1,
                      }}
                    />
                  );
                });
              });
            }, [barMode, handleSynthCellClick])}

            {/* Plotted Synth Notes blocks */}
            {synthNotes.map((s) => {
              // Find nearest row for synth note visual mapping (clamp pitch class representation)
              let matchedLaneIdx = -1;
              if (s.midi >= 63) matchedLaneIdx = 0;      // High
              else if (s.midi >= 59) matchedLaneIdx = 1; // Mid-High
              else if (s.midi >= 55) matchedLaneIdx = 2; // Mid
              else if (s.midi >= 48) matchedLaneIdx = 3; // Low-Mid
              else matchedLaneIdx = 4;                   // Bass

              if (matchedLaneIdx === -1 || s.step >= barMode * 16) return null;

              const notePercentLeft = (s.step / (barMode * 16)) * 100;
              const notePercentWidth = (s.durationSteps / (barMode * 16)) * 100;
              const notePercentTop = matchedLaneIdx * 20;
              const laneData = SYNTH_LANES[matchedLaneIdx];

              const isPlayed = isPlaying && currentPlaybackStep >= s.step && currentPlaybackStep < s.step + s.durationSteps;
              const synthColorClass = isPlayed 
                ? "bg-emerald-400 border border-emerald-200 text-slate-950 shadow-[0_0_15px_#10b981] scale-[1.04] z-20 font-black animate-pulse"
                : laneData.color;

              return (
                <div 
                  key={s.id}
                  onClick={() => handleSynthCellClick(s.step, s.midi, s.pitchName)}
                  className={`absolute h-[16px] mt-[2px] rounded-md flex items-center justify-center font-bold text-[8px] px-0.5 truncate whitespace-nowrap overflow-hidden tracking-tight shadow-sm select-none transition-transform hover:scale-105 cursor-pointer z-1 shrink-0 ${synthColorClass}`}
                  style={{
                    left: `${notePercentLeft}%`,
                    width: `${notePercentWidth}%`,
                    top: `${notePercentTop}px`,
                  }}
                >
                  {s.pitchName}
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* 5. BANDLAB DOWNLOAD CTA BLOCK */}
      <section className="flex flex-col lg:flex-row items-center justify-between mt-6 gap-4 pt-3 border-t border-dashed border-[var(--border-color)]">
        <div id="txt-bottom-tip-container" className="text-xs text-[var(--text-dark)] leading-normal flex items-center gap-1.5 font-medium max-w-lg">
          <HelpCircle className="w-5 h-5 text-[var(--brand-color)] flex-shrink-0" />
          <span id="txt-bottom-tip" dangerouslySetInnerHTML={{ __html: p.bottomTip }}></span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto justify-end">
          {/* Button 1: Topline Only */}
          <button 
            id="btn-download-topline-only" 
            onClick={downloadFinishedMidi}
            className="btn-action cursor-pointer bg-[var(--accent-mint)] hover:opacity-95 text-[var(--accent-mint-text)] border border-[var(--accent-mint-border)] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Music className="w-4 h-4 text-[var(--accent-mint-text)]" />
            {p.btnDownloadToplineOnly}
          </button>

          {/* Button 2: Full Multitrack */}
          <button 
            id="btn-download-multitrack" 
            onClick={downloadAllTracksMidi}
            className="btn-action cursor-pointer bg-[var(--brand-color)] hover:bg-[var(--brand-hover)] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 text-white" />
            {p.btnDownloadMultiTrack}
          </button>
        </div>
      </section>

      {/* FOOTER PIPELINE OUTCOMES */}
      <footer className="mt-8 pt-6 border-t border-[var(--border-color)] flex flex-col items-center gap-5 pb-8">
        <div 
          id="txt-footer-banner" 
          className="footer-banner text-center text-xs text-[var(--text-muted)] font-bold tracking-tight leading-relaxed animate-fade-in"
          dangerouslySetInnerHTML={{ __html: p.footerBanner }}
        />

        {/* Dynamic On-Device Reassurance Notice */}
        <div 
          id="info-engine-reassurance" 
          className="max-w-3xl w-full bg-[var(--card-sub-bg)] dark:bg-slate-900/50 border border-[var(--border-color)]/30 rounded-2xl p-4 text-left transition-all hover:border-[var(--brand-color)]/50 shadow-sm"
        >
          <h4 className="text-xs font-extrabold text-[var(--text-dark)] flex items-center gap-1.5 mb-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {p.engineTitle}
          </h4>
          <p 
            className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: p.engineDetail }}
          />
        </div>

        {/* Producer Copyright */}
        <div id="copyright-owner-notice" className="text-[10px] text-[var(--text-muted)]/70 font-mono tracking-wider">
          {p.copyright}
        </div>
      </footer>

      {/* DETAILED USER GUIDE MODAL POPUP */}
      <HowToUseModal 
        isOpen={isHowToUseOpen} 
        onClose={() => setIsHowToUseOpen(false)} 
        lang={lang} 
      />
    </div>
  );
}
