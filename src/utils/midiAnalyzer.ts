import { Midi } from "@tonejs/midi";
import { ToplineNote, SessionContext, ToplinePlan } from "../types";

export interface ParsedMidiData {
  fileName: string;
  bpm: number;
  genre: string;
  scale: string;
  tracksCount: number;
  duration: number;
  notes: AnalyzedNote[];
  originalMidi?: Midi;
  drumNotes?: AnalyzedNote[];
  synthNotes?: AnalyzedNote[];
  sessionContext?: SessionContext;
}

export interface AnalyzedNote {
  time: number;
  duration: number;
  name: string;
  midi: number;
  velocity: number;
}

const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

// Basic analysis helpers
export function analyzeMidiFile(
  arrayBuffer: ArrayBuffer,
  fileName: string
): ParsedMidiData {
  try {
    const midi = new Midi(arrayBuffer);
    
    // Get BPM
    let bpm = 120;
    if (midi.header.tempos && midi.header.tempos.length > 0) {
      bpm = Math.round(midi.header.tempos[0].bpm);
    } else {
      // Try parsing standard BPM pattern from filename (e.g. 140BPM)
      const bpmMatch = fileName.match(/(\d+)\s*bpm/i);
      if (bpmMatch) {
         bpm = parseInt(bpmMatch[1], 10);
      }
    }

    // Extract notes and classify into drum / synth categories
    const allNotes: AnalyzedNote[] = [];
    const drumNotes: AnalyzedNote[] = [];
    const synthNotes: AnalyzedNote[] = [];

    midi.tracks.forEach((track) => {
      const trackName = (track.name || "").toLowerCase();
      // Channel 9 (10th channel) is globally reserved for percussion/drums in General MIDI (GM)
      const isDrumTrack = track.channel === 9 || 
                          track.instrument.percussion === true || 
                          /drum|perc|beat|kick|snare|hit|hat|drumkit/i.test(trackName);

      track.notes.forEach((note) => {
        const parsedNote: AnalyzedNote = {
          time: note.time,
          duration: note.duration,
          name: note.name,
          midi: note.midi,
          velocity: note.velocity,
        };

        allNotes.push(parsedNote);

        if (isDrumTrack) {
          drumNotes.push(parsedNote);
        } else {
          synthNotes.push(parsedNote);
        }
      });
    });

    // If synthNotes is completely empty but there are other notes, let's treat non-drum tracks as synth
    if (synthNotes.length === 0 && drumNotes.length > 0 && allNotes.length > drumNotes.length) {
      allNotes.forEach(n => {
        if (!drumNotes.includes(n)) {
          synthNotes.push(n);
        }
      });
    }

    // Detect Key and Scale based on pitch statistics (using synth notes if available for better musicality)
    const scale = detectScale(synthNotes.length > 0 ? synthNotes : allNotes, fileName);

    // Identify genre
    const genre = detectGenre(bpm, fileName, midi);

    // Prepare duration
    const duration = midi.duration || (allNotes.length > 0 ? Math.max(...allNotes.map(n => n.time + n.duration)) : 0);

    // Create session context
    const sessionContext = createSessionContext(arrayBuffer, fileName, midi);

    // Synchronize parsed BPM, Scale and Genre to the resolved sessionContext if it was overridden by metadata
    const finalBpm = sessionContext.bpm;
    const finalGenre = sessionContext.genrePreset || genre;
    const finalScale = `${sessionContext.key} ${sessionContext.scale.charAt(0).toUpperCase() + sessionContext.scale.slice(1)}`;

    return {
      fileName,
      bpm: finalBpm,
      genre: finalGenre,
      scale: finalScale,
      tracksCount: midi.tracks.length,
      duration,
      notes: allNotes.slice(0, 150), // Keep a reasonable subset for visualization
      originalMidi: midi,
      drumNotes: drumNotes.slice(0, 300),
      synthNotes: synthNotes.slice(0, 300),
      sessionContext,
    };
  } catch (error) {
    // Graceously handle unrecognized MIDI event types or other binary parsing errors which sometimes occur in specific DAWs
    console.warn(`MIDI binary parsing fell back to filename heuristic modeling (${fileName}):`, error);
    return getFallbackMidiData(fileName);
  }
}

// Fallback algorithm if midi binary is corrupt or can't be parsed
export function getFallbackMidiData(fileName: string): ParsedMidiData {
  // Parse BPM from filename
  let bpm = 120;
  const bpmMatch = fileName.match(/(\d+)\s*bpm/i);
  if (bpmMatch) {
    bpm = parseInt(bpmMatch[1], 10);
  } else if (fileName.toLowerCase().includes("hiphop") || fileName.toLowerCase().includes("trap")) {
    bpm = 140;
  } else if (fileName.toLowerCase().includes("lofi") || fileName.toLowerCase().includes("chill")) {
    bpm = 80;
  } else if (fileName.toLowerCase().includes("house") || fileName.toLowerCase().includes("synthwave") || fileName.toLowerCase().includes("dance")) {
    bpm = 124;
  }

  // Detect scale from filename or default to A Minor
  let scale = "A Minor";
  const scaleKeywords = [
    { key: "c_minor", val: "C Minor" },
    { key: "c_major", val: "C Major" },
    { key: "a_minor", val: "A Minor" },
    { key: "a_major", val: "A Major" },
    { key: "g_minor", val: "G Minor" },
    { key: "g_major", val: "G Major" },
    { key: "f_minor", val: "F Minor" },
    { key: "f_major", val: "F Major" },
    { key: "e_minor", val: "E Minor" },
    { key: "e_major", val: "E Major" },
    { key: "d_minor", val: "D Minor" },
    { key: "d_major", val: "D Major" },
    { key: "b_minor", val: "B Minor" },
  ];
  const nameLower = fileName.toLowerCase();
  for (const item of scaleKeywords) {
    if (nameLower.includes(item.key) || nameLower.includes(item.val.toLowerCase().replace(" ", ""))) {
      scale = item.val;
      break;
    }
  }

  // Detect Genre
  const genre = detectGenre(bpm, fileName);

  const fallbackNotes = createMockNotesFromScale(scale);

  const contextParts = scale.split(" ");
  const fallbackKey = normalizeKeyToSharp(contextParts[0] || "A");
  const fallbackScaleName = contextParts[1] ? contextParts[1].toLowerCase() : "minor";

  const fallbackContext: SessionContext = {
    sourceType: "fallback-analysis",
    bpm,
    timeSignature: "4/4",
    ppq: 96,
    ticksPerStep: 24,
    patternLength: 64,
    bars: 4,
    key: fallbackKey,
    scale: fallbackScaleName,
    genrePreset: genre,
    groovePreset: "Pop Bounce",
    drumDensity: 40,
    bassDensity: 30,
    rhythmIntensity: "medium",
    mood: "neutral",
    tracks: {},
    toplineHints: {
      recommendedRegister: "mid-high",
      phraseDensity: "medium",
      avoidTooBusyMelody: false,
      safeScaleDegrees: [1, 3, 5],
      strongBeatSteps: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60],
      restBias: 0.25
    },
    confidence: {
      metadata: 0,
      key: 0.2,
      tempo: 0.5,
      trackDetection: 0.1
    },
    warnings: ["Fallback system parsing triggered. Minimal layout values resolved."]
  };

  return {
    fileName,
    bpm,
    genre,
    scale,
    tracksCount: 2,
    duration: 8.0, // Default 4 bars
    notes: fallbackNotes,
    drumNotes: [
      { time: 0.0, duration: 0.2, name: "Kick", midi: 36, velocity: 0.9 },
      { time: 0.5, duration: 0.2, name: "Hihat", midi: 42, velocity: 0.7 },
      { time: 1.0, duration: 0.2, name: "Snare", midi: 38, velocity: 0.8 },
      { time: 1.5, duration: 0.2, name: "Hihat", midi: 42, velocity: 0.7 },
      { time: 2.0, duration: 0.2, name: "Kick", midi: 36, velocity: 0.9 },
      { time: 2.5, duration: 0.2, name: "Hihat", midi: 42, velocity: 0.7 },
      { time: 3.0, duration: 0.2, name: "Snare", midi: 38, velocity: 0.8 },
      { time: 3.5, duration: 0.2, name: "Hihat", midi: 42, velocity: 0.7 },
    ],
    synthNotes: fallbackNotes,
    sessionContext: fallbackContext,
  };
}

function detectScale(notes: AnalyzedNote[], fileName: string): string {
  // Check if filename contains a key first
  const fileNameLower = fileName.toLowerCase();
  const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  // Look for patterns like "Amin", "A minor", "Cmajor", "F# major", "F#m"
  for (const k of keys) {
    const kEscaped = k.replace("#", "\\#");
    const minorRegex = new RegExp(`\\b${kEscaped}\\s*(m|min|minor)\\b`, "i");
    const majorRegex = new RegExp(`\\b${kEscaped}\\s*(maj|major)?\\b`, "i");
    
    if (minorRegex.test(fileNameLower)) {
      return `${k} Minor`;
    }
    if (majorRegex.test(fileNameLower)) {
      // Avoid false-positives matching "A" in generic words, e.g. "a drum loop"
      if (k === "A" && !fileNameLower.includes("a major") && !fileNameLower.includes("a_major") && !fileNameLower.includes("amaj")) {
        continue;
      }
      return `${k} Major`;
    }
  }

  if (notes.length === 0) {
    return "A Minor"; // Standard default
  }

  // Count pitch class histogram
  const pitchCounts = new Array(12).fill(0);
  notes.forEach((note) => {
    const pitchClass = note.midi % 12;
    // Add weight based on note duration (longer notes hold more key importance)
    pitchCounts[pitchClass] += note.duration;
  });

  let bestScale = "A Minor";
  let maxScore = -1;

  for (let root = 0; root < 12; root++) {
    // 1. Scoring Major
    const majorPitches = MAJOR_INTERVALS.map((interval) => (root + interval) % 12);
    let majorScore = 0;
    majorPitches.forEach((p) => {
      majorScore += pitchCounts[p];
    });
    // Add slight bias or filter
    if (majorScore > maxScore) {
      maxScore = majorScore;
      bestScale = `${PITCH_NAMES[root]} Major`;
    }

    // 2. Scoring Minor
    const minorPitches = MINOR_INTERVALS.map((interval) => (root + interval) % 12);
    let minorScore = 0;
    minorPitches.forEach((p) => {
      minorScore += pitchCounts[p];
    });
    if (minorScore > maxScore) {
      maxScore = minorScore;
      bestScale = `${PITCH_NAMES[root]} Minor`;
    }
  }

  return bestScale;
}

function detectGenre(bpm: number, fileName: string, midi?: Midi): string {
  const contentText = (fileName + " " + (midi?.header.name || "")).toLowerCase();

  // Keyword check
  if (contentText.includes("hiphop") || contentText.includes("hip_hop") || contentText.includes("trap") || contentText.includes("808") || contentText.includes("rap")) {
    return "힙합 (Hip-Hop)";
  }
  if (contentText.includes("lofi") || contentText.includes("lo-fi") || contentText.includes("chill") || contentText.includes("jazz")) {
    return "로파이 (Lo-Fi)";
  }
  if (contentText.includes("house") || contentText.includes("techno") || contentText.includes("edm") || contentText.includes("dance") || contentText.includes("electro")) {
    return "댄스/하우스 (Dance/House)";
  }
  if (contentText.includes("synthwave") || contentText.includes("retro") || contentText.includes("80s")) {
    return "신스웨이브 (Synthwave)";
  }
  if (contentText.includes("ballad") || contentText.includes("sad") || contentText.includes("acoustic") || contentText.includes("vocal")) {
    return "발라드 (Ballad)";
  }
  if (contentText.includes("rock") || contentText.includes("punk") || contentText.includes("guitar") || contentText.includes("metal")) {
    return "락/인디 (Rock/Indie)";
  }

  // BPM threshold fallback
  if (bpm >= 70 && bpm < 90) {
    return "로파이/알앤비 (Lo-Fi/R&B)";
  }
  if (bpm >= 90 && bpm < 115) {
    return "팝/인디 (Pop/Indie)";
  }
  if (bpm >= 115 && bpm < 130) {
    // Standard house tempo is typically 120-128
    return "댄스/하우스 (Dance/House)";
  }
  if (bpm >= 130 && bpm < 155) {
    return "힙합/트랩 (Hip-Hop/Trap)";
  }
  if (bpm >= 155) {
    return "퓨처베이스/D&B (Future Bass/D&B)";
  }

  return "힙합 (Hip-Hop)"; // global default matching mockup
}

function createMockNotesFromScale(scale: string): AnalyzedNote[] {
  // Simple melody notes default setup
  const rootName = scale.split(" ")[0];
  const isMinor = scale.includes("Minor");
  const rootIndex = PITCH_NAMES.indexOf(rootName);
  const rootMidi = 60 + (rootIndex !== -1 ? rootIndex : 0); // Octave 4 C
  
  const intervals = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
  
  return [
    { time: 0.0, duration: 0.8, name: `${rootName}4`, midi: rootMidi, velocity: 0.8 },
    { time: 1.0, duration: 0.4, name: `${PITCH_NAMES[(rootIndex + intervals[4]) % 12]}4`, midi: rootMidi + intervals[4], velocity: 0.8 },
    { time: 2.0, duration: 0.8, name: `${PITCH_NAMES[(rootIndex + intervals[5]) % 12]}4`, midi: rootMidi + intervals[5], velocity: 0.8 },
    { time: 3.5, duration: 0.4, name: `${PITCH_NAMES[(rootIndex + intervals[2]) % 12]}4`, midi: rootMidi + intervals[2], velocity: 0.8 },
    { time: 4.5, duration: 0.4, name: `${rootName}5`, midi: rootMidi + 12, velocity: 0.8 },
    { time: 5.0, duration: 0.4, name: `${PITCH_NAMES[(rootIndex + intervals[4]) % 12]}4`, midi: rootMidi + intervals[4], velocity: 0.8 },
    { time: 5.5, duration: 0.6, name: `${rootName}4`, midi: rootMidi, velocity: 0.8 },
  ];
}

const VALID_MIDI_KEYS: Record<string, string> = {
  "C": "C", "C#": "C#", "Db": "Db", "D": "D", "D#": "Eb", "Eb": "Eb", "E": "E", 
  "F": "F", "F#": "F#", "Gb": "Gb", "G": "G", "G#": "Ab", "Ab": "Ab", "A": "A", 
  "A#": "Bb", "Bb": "Bb", "B": "B", "Cb": "Cb"
};

// Estimate chords from ToplineNotes
export function estimateChordsFromNotes(
  rawSynthNotes: ToplineNote[]
): Array<{ bar: number; step: number; chord: string }> {
  if (!rawSynthNotes || rawSynthNotes.length === 0) {
    return [];
  }
  
  const notesByStep: Record<number, ToplineNote[]> = {};
  rawSynthNotes.forEach((n) => {
    if (n.isRest) return;
    if (!notesByStep[n.step]) {
      notesByStep[n.step] = [];
    }
    notesByStep[n.step].push(n);
  });

  const chords: Array<{ bar: number; step: number; chord: string }> = [];
  const steps = Object.keys(notesByStep).map(Number).sort((a, b) => a - b);

  steps.forEach((step) => {
    const stepNotes = notesByStep[step];
    if (stepNotes.length === 0) return;

    const sortedByMidi = [...stepNotes].sort((a, b) => a.midi - b.midi);
    const rootMidi = sortedByMidi[0].midi;
    const rootPitchClass = rootMidi % 12;
    const rootName = PITCH_NAMES[rootPitchClass];

    const pitchClasses = Array.from(new Set(stepNotes.map((n) => (n.midi % 12))));
    const relativePitches = pitchClasses.map((p) => (p - rootPitchClass + 12) % 12);

    let chordSuffix = "";
    const hasMinorThird = relativePitches.includes(3);
    const hasMajorThird = relativePitches.includes(4);
    const hasFifth = relativePitches.includes(7);
    const hasMinorSeventh = relativePitches.includes(10);
    const hasMajorSeventh = relativePitches.includes(11);

    if (hasMinorThird && hasFifth) {
      chordSuffix = "m";
      if (hasMinorSeventh) chordSuffix = "7";
      else if (hasMajorSeventh) chordSuffix = "M7";
    } else if (hasMajorThird && hasFifth) {
      chordSuffix = "";
      if (hasMajorSeventh) chordSuffix = "M7";
      else if (hasMinorSeventh) chordSuffix = "7";
    } else if (hasMinorThird) {
      chordSuffix = "m";
    } else if (hasMajorThird) {
      chordSuffix = "";
    } else if (relativePitches.includes(5) && hasFifth) {
      chordSuffix = "sus4";
    } else if (relativePitches.includes(2) && hasFifth) {
      chordSuffix = "sus2";
    }

    const barNum = Math.floor(step / 16) + 1;
    chords.push({
      bar: barNum,
      step: step,
      chord: `${rootName}${chordSuffix}`,
    });
  });

  return chords;
}

// Calculate rhythm density & mood tags
export function calculateRhythmAndMood(
  bpm: number,
  genre: string,
  scale: string,
  rawDrumNotes: ToplineNote[]
) {
  const activeDrumsCount = rawDrumNotes ? rawDrumNotes.filter(n => !n.isRest).length : 0;
  
  let rhythm_intensity = "medium";
  if (activeDrumsCount > 24 || bpm > 135) {
    rhythm_intensity = "high";
  } else if (activeDrumsCount < 10 || bpm < 90) {
    rhythm_intensity = "low";
  }

  let mood = "neutral";
  const scaleLower = scale.toLowerCase();
  const isMinor = scaleLower.includes("minor");

  if (genre.includes("로파이") || genre.includes("Lofi") || genre.includes("Ambient") || genre.includes("우주") || genre.includes("Lounge")) {
    mood = isMinor ? "dreamy melancholic" : "chill futuristic";
  } else if (genre.includes("테크노") || genre.includes("Techno") || genre.includes("드릴") || genre.includes("Drill")) {
    mood = "dark aggressive";
  } else if (genre.includes("신스웨이브") || genre.includes("Retro") || genre.includes("EDM") || genre.includes("하우스") || genre.includes("Club") || genre.includes("Rave")) {
    mood = "energetic neon";
  } else if (genre.includes("발라드") || genre.includes("Ballad")) {
    mood = isMinor ? "emotional sad" : "warm tender";
  } else {
    mood = isMinor ? "mysterious reflective" : "uplifting bright";
  }

  return {
    rhythm_intensity,
    mood,
  };
}

// Generate an elegant, optimized MIDI representing custom topline chords & vocals to download.
export function generateToplineMidi(
  bpm: number,
  notes: Array<{ time: number; duration: number; midi: number; name: string; velocity?: number }>,
  trackName: string = "Piano Topline",
  scale: string = "A Minor",
  genre: string = "Pop",
  rawSynthNotes: ToplineNote[] = [],
  rawDrumNotes: ToplineNote[] = []
): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(bpm);
  
  // 1. Add standard Key Signature
  const scaleParts = scale.trim().split(" ");
  const rawRoot = scaleParts[0] || "C";
  const scaleTypeRaw = (scaleParts[1] || "major").toLowerCase();
  const correctedRoot = VALID_MIDI_KEYS[rawRoot] || "C";
  const finalScaleType: "major" | "minor" = scaleTypeRaw === "minor" ? "minor" : "major";
  
  midi.header.keySignatures.push({
    key: correctedRoot,
    scale: finalScaleType,
    ticks: 0
  });

  // 2. Add standard TrackName target genre meta message
  midi.header.meta.push({
    type: "trackName",
    text: `Genre:${genre}`,
    ticks: 0
  });

  // 3. Compute advanced chords & rhythm/mood tags for python app ingestion
  const chordsDetected = estimateChordsFromNotes(rawSynthNotes);
  const intensityAndMood = calculateRhythmAndMood(bpm, genre, scale, rawDrumNotes);
  const jsonKeyStr = finalScaleType === "minor" ? `${rawRoot}m` : rawRoot;
  
  const jsonPayload = {
    bpm: bpm,
    key: jsonKeyStr,
    chords: chordsDetected,
    rhythm_intensity: intensityAndMood.rhythm_intensity,
    mood: intensityAndMood.mood,
    original_scale: scale,
    original_genre: genre
  };

  // 4. Set standard type='text' JSON string in header meta (Track 0)
  midi.header.meta.push({
    type: "text",
    text: JSON.stringify(jsonPayload),
    ticks: 0
  });

  // Add the piano track
  const track = midi.addTrack();
  track.name = trackName;
  track.instrument.number = 0; // Acoustic Grand Piano

  notes.forEach((note) => {
    track.addNote({
      midi: note.midi,
      time: note.time,
      duration: note.duration,
      velocity: note.velocity !== undefined ? note.velocity : 0.8,
    });
  });

  return midi.toArray();
}

// Generate a full multitrack MIDI file containing drums, synths, and topline piano as separate tracks
export function generateMultiTrackMidi(
  bpm: number,
  trackData: {
    topline: Array<{ time: number; duration: number; midi: number; name: string; velocity?: number }>;
    drums: Array<{ time: number; duration: number; midi: number; name: string }>;
    synths: Array<{ time: number; duration: number; midi: number; name: string }>;
  },
  scale: string = "A Minor",
  genre: string = "Pop",
  rawSynthNotes: ToplineNote[] = [],
  rawDrumNotes: ToplineNote[] = [],
  sessionContext?: SessionContext | null
): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(bpm);
  
  // 1. Add standard Key Signature
  const scaleParts = scale.trim().split(" ");
  const rawRoot = scaleParts[0] || "C";
  const scaleTypeRaw = (scaleParts[1] || "major").toLowerCase();
  const correctedRoot = VALID_MIDI_KEYS[rawRoot] || "C";
  const finalScaleType: "major" | "minor" = scaleTypeRaw === "minor" ? "minor" : "major";
  
  midi.header.keySignatures.push({
    key: correctedRoot,
    scale: finalScaleType,
    ticks: 0
  });

  // 2. Add standard TrackName target genre meta message
  midi.header.meta.push({
    type: "trackName",
    text: `Genre:${genre}`,
    ticks: 0
  });

  // 3. Compute advanced chords & rhythm/mood tags for python app ingestion
  const chordsDetected = estimateChordsFromNotes(rawSynthNotes);
  const intensityAndMood = calculateRhythmAndMood(bpm, genre, scale, rawDrumNotes);
  const jsonKeyStr = finalScaleType === "minor" ? `${rawRoot}m` : rawRoot;
  
  const jsonPayload = {
    bpm: bpm,
    key: jsonKeyStr,
    chords: chordsDetected,
    rhythm_intensity: intensityAndMood.rhythm_intensity,
    mood: intensityAndMood.mood,
    original_scale: scale,
    original_genre: genre
  };

  // 4. Set standard type='text' JSON string in header meta (Track 0)
  midi.header.meta.push({
    type: "text",
    text: JSON.stringify(jsonPayload),
    ticks: 0
  });

  // 4b. Inject custom MDBG Session metadata (MDBG_META_JSON:v1:) in Track 0 (Interoperable block)
  const mdbgMetaPayload = {
    schema: "v1",
    bpm: sessionContext?.bpm || bpm,
    key: sessionContext?.key || jsonKeyStr,
    scale: sessionContext?.scale || finalScaleType,
    genrePreset: sessionContext?.genrePreset || genre,
    groovePreset: sessionContext?.groovePreset || "Pop Bounce",
    bassStrategy: sessionContext?.bassStrategy || "Indie Pulse",
    drumKit: sessionContext?.drumKit || "standard",
    bassSound: sessionContext?.bassSound || "sub",
    bars: sessionContext?.bars || 4,
    patternLength: sessionContext?.patternLength || 64,
    drumDensity: sessionContext?.drumDensity !== undefined ? sessionContext.drumDensity : Math.min(100, Math.round((trackData.drums.length / 64) * 100)),
    bassDensity: sessionContext?.bassDensity !== undefined ? sessionContext.bassDensity : Math.min(100, Math.round((trackData.synths.length / 64) * 100)),
    rhythmIntensity: sessionContext?.rhythmIntensity || intensityAndMood.rhythm_intensity,
    mood: sessionContext?.mood || intensityAndMood.mood
  };

  midi.header.meta.push({
    type: "text",
    text: `MDBG_META_JSON:v1:${JSON.stringify(mdbgMetaPayload)}`,
    ticks: 0
  });

  // 5. Drums track (Channel 9 is general MIDI percussion standard)
  if (trackData.drums && trackData.drums.length > 0) {
    const drumTrack = midi.addTrack();
    drumTrack.name = "Drums";
    drumTrack.channel = 9;
    drumTrack.instrument.number = 0;
    trackData.drums.forEach((note) => {
      drumTrack.addNote({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: 0.9,
      });
    });
  }

  // 6. Synth Track (Lead/Chords)
  if (trackData.synths && trackData.synths.length > 0) {
    const synthTrack = midi.addTrack();
    synthTrack.name = "Synth Chords";
    synthTrack.instrument.number = 81; // Synth Lead
    trackData.synths.forEach((note) => {
      synthTrack.addNote({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: 0.7,
      });
    });
  }

  // 7. Piano Topline track
  if (trackData.topline && trackData.topline.length > 0) {
    const toplineTrack = midi.addTrack();
    toplineTrack.name = "Piano Topline";
    toplineTrack.instrument.number = 0; // Acoustic Grand Piano
    trackData.topline.forEach((note) => {
      toplineTrack.addNote({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity !== undefined ? note.velocity : 0.85,
      });
    });
  }

  return midi.toArray();
}

// RAW BINARY MIDI PARSER FOR EXTRACTING META TEXTS DEFINITIONS
export function scanMetaEventsForPrefix(arrayBuffer: ArrayBuffer, prefix: string): any | null {
  const data = new DataView(arrayBuffer);
  let offset = 0;
  
  if (data.byteLength < 14) return null;
  const magic = data.getUint32(offset); offset += 4;
  if (magic !== 0x4D546864) return null; // "MThd"
  const headerLength = data.getUint32(offset); offset += 4;
  offset += headerLength; // Skip header content to track chunks
  
  while (offset + 8 <= data.byteLength) {
    const chunkType = data.getUint32(offset); offset += 4;
    const chunkSize = data.getUint32(offset); offset += 4;
    
    if (chunkType === 0x4D54726B) { // "MTrk"
      const trackEnd = offset + chunkSize;
      const trackOffset = { value: offset };
      let lastStatus = 0;
      
      while (trackOffset.value < trackEnd && trackOffset.value < data.byteLength) {
        // Delta time
        readVarIntRaw(data, trackOffset);
        
        let status = data.getUint8(trackOffset.value);
        if (status >= 0x80) {
          trackOffset.value++;
          lastStatus = status;
        } else {
          status = lastStatus;
        }
        
        if (status === 0xFF) { // Meta event
          const type = data.getUint8(trackOffset.value++);
          const length = readVarIntRaw(data, trackOffset);
          
          if (type === 0x01 || type === 0x03 || type === 0x06 || type === 0x07) { // Text, TrackName, Marker, Cue
            try {
              const textBytes = new Uint8Array(arrayBuffer, trackOffset.value, length);
              const text = new TextDecoder("utf-8").decode(textBytes);
              if (text.startsWith(prefix)) {
                const jsonStr = text.substring(prefix.length);
                return JSON.parse(jsonStr);
              }
            } catch (e) {
              console.warn("Failed to decode meta event text:", e);
            }
          }
          trackOffset.value += length;
        } else if (status === 0xF0 || status === 0xF7) { // SysEx
          const length = readVarIntRaw(data, trackOffset);
          trackOffset.value += length;
        } else if ((status & 0xF0) === 0xC0 || (status & 0xF0) === 0xD0) { // 1 data byte
          trackOffset.value += 1;
        } else { // 2 data bytes
          trackOffset.value += 2;
        }
      }
      offset += chunkSize;
    } else {
      offset += chunkSize;
    }
  }
  return null;
}

function readVarIntRaw(data: DataView, offset: { value: number }): number {
  let value = 0;
  let byte = 0;
  do {
    byte = data.getUint8(offset.value++);
    value = (value << 7) | (byte & 0x7F);
  } while (byte & 0x80);
  return value;
}

const SHARP_MAP: Record<string, string> = {
  "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#",
  "db": "C#", "eb": "D#", "gb": "F#", "ab": "G#", "bb": "A#",
  "d#": "D#", "f#": "F#", "g#": "G#", "a#": "A#", "c#": "C#"
};

function normalizeKeyToSharp(key: string): string {
  let trimmed = key.trim();
  if (trimmed.endsWith("m") || trimmed.endsWith("M")) {
    trimmed = trimmed.substring(0, trimmed.length - 1);
  }
  return SHARP_MAP[trimmed] || trimmed;
}

export function createSessionContext(
  arrayBuffer: ArrayBuffer, 
  fileName: string,
  midi: Midi
): SessionContext {
  const warnings: string[] = [];
  
  // 1. Check for custom platform JSON metadata (MDBG_META_JSON:v1:)
  const metaPrefix = "MDBG_META_JSON:v1:";
  const importedMeta = scanMetaEventsForPrefix(arrayBuffer, metaPrefix);
  
  // 2. Fallbacks calculation based on parsed tracks
  let timeSign = "4/4";
  if (midi.header.timeSignatures && midi.header.timeSignatures.length > 0) {
    const tsEvent = midi.header.timeSignatures[0];
    if (tsEvent.timeSignature && Array.isArray(tsEvent.timeSignature)) {
      timeSign = `${tsEvent.timeSignature[0]}/${tsEvent.timeSignature[1]}`;
    } else if ((tsEvent as any).signatures && Array.isArray((tsEvent as any).signatures)) {
      timeSign = `${(tsEvent as any).signatures[0]}/${(tsEvent as any).signatures[1]}`;
    }
  }
  
  const ppq = midi.header.ppq || 96;
  const ticksPerStep = ppq / 4; // 16th note grid step
  
  // Track classification counters
  let drumsTrackIdx = -1;
  let drumsChannel = 9;
  let drumsNoteCount = 0;
  
  let bassTrackIdx = -1;
  let bassChannel = 0;
  let bassNoteCount = 0;
  let bassMinMidi = 127;
  let bassMaxMidi = 0;

  midi.tracks.forEach((track, idx) => {
    const trackName = (track.name || "").toLowerCase();
    const isDrums = track.channel === 9 || 
                     track.instrument.percussion === true || 
                     /drum|perc|beat|kick|snare|hit|hat|drumkit/i.test(trackName);
                     
    const isBass = track.channel === 0 || 
                    track.channel === 1 || 
                    /bass|sub|synth-bass|guitar-bass/i.test(trackName);

    if (isDrums) {
      if (drumsTrackIdx === -1 || track.notes.length > drumsNoteCount) {
        drumsTrackIdx = idx;
        drumsChannel = track.channel;
        drumsNoteCount = track.notes.length;
      }
    } else if (isBass) {
      if (bassTrackIdx === -1 || track.notes.length > bassNoteCount) {
        bassTrackIdx = idx;
        bassChannel = track.channel;
        bassNoteCount = track.notes.length;
        track.notes.forEach(n => {
          if (n.midi < bassMinMidi) bassMinMidi = n.midi;
          if (n.midi > bassMaxMidi) bassMaxMidi = n.midi;
        });
      }
    }
  });

  // Calculate dynamic density
  const totalSteps = 64; // assume default pattern
  const drumDensity = drumsNoteCount > 0 ? Math.min(100, Math.round((drumsNoteCount / totalSteps) * 100)) : 0;
  const bassDensity = bassNoteCount > 0 ? Math.min(100, Math.round((bassNoteCount / totalSteps) * 100)) : 0;
  
  const midiTempo = midi.header.tempos && midi.header.tempos.length > 0 ? Math.round(midi.header.tempos[0].bpm) : 120;
  
  // Detect Key/Scale
  const estimatedScaleWithName = detectScale(
    midi.tracks.flatMap(t => t.channel !== 9 ? t.notes.map(n => ({ time: n.time, duration: n.duration, midi: n.midi, name: n.name, velocity: n.velocity })) : []),
    fileName
  );
  
  const parts = estimatedScaleWithName.split(" ");
  const estimatedKey = parts[0];
  const estimatedScale = parts[1] ? parts[1].toLowerCase() : "minor";
  
  // Base configuration build
  if (importedMeta) {
    // If we have imported metadata, use it as priority
    const bpm = Number(importedMeta.bpm || importedMeta.tempo || midiTempo);
    if (Math.abs(bpm - midiTempo) > 1) {
      warnings.push(`MIDI file tempo (${midiTempo} BPM) differs from external metadata BPM (${bpm}). Overriding to metadata.`);
    }
    
    // Normalize Key
    let keyMeta = importedMeta.key || estimatedKey;
    keyMeta = normalizeKeyToSharp(keyMeta);

    const scaleMeta = importedMeta.scale || estimatedScale;
    const barsMeta: number = importedMeta.bars || (importedMeta.patternLength ? importedMeta.patternLength / 16 : 4);
    const patternLengthMeta: any = importedMeta.patternLength || (barsMeta * 16);
    
    const drumIntensity: "low" | "medium" | "high" = 
      importedMeta.rhythmIntensity || 
      (drumDensity > 60 ? "high" : drumDensity < 20 ? "low" : "medium");

    const moodMeta: "happy" | "dark" | "neutral" = 
      importedMeta.mood || 
      (scaleMeta.toLowerCase().includes("minor") ? "dark" : "happy");

    return {
      sourceType: "mdbg-session",
      bpm,
      timeSignature: timeSign,
      ppq,
      ticksPerStep,
      patternLength: patternLengthMeta,
      bars: barsMeta as 1 | 2 | 4,
      key: keyMeta,
      scale: scaleMeta,
      genrePreset: importedMeta.genrePreset || importedMeta.genre || "Pop",
      groovePreset: importedMeta.groovePreset || importedMeta.groove || "Pop Bounce",
      bassStrategy: importedMeta.bassStrategy || "Indie Pulse",
      drumKit: importedMeta.drumKit,
      bassSound: importedMeta.bassSound,
      drumDensity: importedMeta.drumDensity !== undefined ? importedMeta.drumDensity : drumDensity,
      bassDensity: importedMeta.bassDensity !== undefined ? importedMeta.bassDensity : bassDensity,
      averageDrumVelocity: importedMeta.averageDrumVelocity || 0.8,
      averageBassVelocity: importedMeta.averageBassVelocity || 0.75,
      rhythmIntensity: drumIntensity,
      mood: moodMeta,
      tracks: {
        drums: drumsTrackIdx !== -1 ? { trackIndex: drumsTrackIdx, channel: drumsChannel, noteCount: drumsNoteCount } : undefined,
        bass: bassTrackIdx !== -1 ? { trackIndex: bassTrackIdx, channel: bassChannel, noteCount: bassNoteCount, pitchRange: [bassMinMidi, bassMaxMidi] } : undefined
      },
      toplineHints: {
        recommendedRegister: (importedMeta.genrePreset === "Hip-Hop" || importedMeta.genrePreset === "Trap" || scaleMeta.toLowerCase().includes("minor")) ? "mid" : "mid-high",
        phraseDensity: drumIntensity === "high" ? "low" : drumIntensity === "low" ? "high" : "medium",
        avoidTooBusyMelody: drumDensity > 50,
        safeScaleDegrees: [1, 3, 5, 7],
        strongBeatSteps: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60],
        restBias: drumIntensity === "high" ? 0.35 : 0.2
      },
      confidence: {
        metadata: 1.0,
        key: importedMeta.key ? 1.0 : 0.7,
        tempo: importedMeta.bpm ? 1.0 : 0.8,
        trackDetection: 0.9
      },
      warnings
    };
  } else {
    // FALLBACK ANALYSIS MODE
    const normalizedKey = normalizeKeyToSharp(estimatedKey);
    const barsEst = Math.min(4, Math.max(1, Math.round(midi.duration / (60 / midiTempo * 4)))) as 1 | 2 | 4;
    const patternLengthEst = (barsEst * 16) as 16 | 32 | 64;
    
    warnings.push("No MDBG metadata found in Track 0. Executing fallback acoustic analysis.");
    if (bassTrackIdx !== -1) {
      warnings.push("Estimated harmonic Key from bass note distribution. Please verify.");
    }

    const isMinor = estimatedScale.toLowerCase().includes("minor") || estimatedScale.toLowerCase().includes("pentatonic");
    const inferredGenre = detectGenre(midiTempo, fileName, midi);

    return {
      sourceType: "fallback-analysis",
      bpm: midiTempo,
      timeSignature: timeSign,
      ppq,
      ticksPerStep,
      patternLength: patternLengthEst,
      bars: barsEst,
      key: normalizedKey,
      scale: isMinor ? "minor" : "major",
      genrePreset: inferredGenre,
      groovePreset: "Pop Bounce",
      bassStrategy: "Unknown",
      drumDensity,
      bassDensity,
      rhythmIntensity: drumDensity > 50 ? "high" : drumDensity < 20 ? "low" : "medium",
      mood: isMinor ? "dark" : "happy",
      tracks: {
        drums: drumsTrackIdx !== -1 ? { trackIndex: drumsTrackIdx, channel: drumsChannel, noteCount: drumsNoteCount } : undefined,
        bass: bassTrackIdx !== -1 ? { trackIndex: bassTrackIdx, channel: bassChannel, noteCount: bassNoteCount, pitchRange: [bassMinMidi, bassMaxMidi] } : undefined
      },
      toplineHints: {
        recommendedRegister: "mid-high",
        phraseDensity: "medium",
        avoidTooBusyMelody: drumDensity > 40,
        safeScaleDegrees: [1, 3, 5],
        strongBeatSteps: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60],
        restBias: 0.25
      },
      confidence: {
        metadata: 0.0,
        key: bassTrackIdx !== -1 ? 0.7 : 0.4,
        tempo: 0.9,
        trackDetection: (drumsTrackIdx !== -1 || bassTrackIdx !== -1) ? 0.8 : 0.3
      },
      warnings
    };
  }
}

export function createToplinePlan(context: SessionContext): ToplinePlan {
  const isMinor = context.scale.toLowerCase().includes("minor") || context.scale.toLowerCase().includes("pentatonic");
  
  // Scale pitch classes mapping
  const rootIndex = PITCH_NAMES.indexOf(normalizeKeyToSharp(context.key));
  const intervals = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
  
  // 1. Determine Register
  let minMidi = 57; // A3
  let maxMidi = 76; // E5
  let preferredCenter = 64; // E4
  
  const reg = context.toplineHints.recommendedRegister || "mid-high";
  if (reg === "low") {
    minMidi = 45; maxMidi = 57; preferredCenter = 52;
  } else if (reg === "mid") {
    minMidi = 52; maxMidi = 64; preferredCenter = 57;
  } else if (reg === "mid-high") {
    minMidi = 57; maxMidi = 69; preferredCenter = 64;
  } else if (reg === "high") {
    minMidi = 64; maxMidi = 76; preferredCenter = 69;
  }

  // 2. Select allowed notes in octave range
  const allowedNotes = getMidiNotesInIntervals(rootIndex !== -1 ? rootIndex : 0, intervals, minMidi, maxMidi);
  
  // 3. Determine density and style
  let density: "low" | "medium" | "high" = "medium";
  let restBias = 0.25;
  let motifLength: 2 | 3 | 4 = 3;
  let phraseShape: "rise" | "fall" | "arch" | "flat" = "arch";
  let rhythmicStyle: "straight" | "bounce" | "laid-back" | "syncopated" = "bounce";

  const genre = (context.genrePreset || "").toLowerCase();
  const groove = (context.groovePreset || "").toLowerCase();

  // Genre rules
  if (genre.includes("indie") || genre.includes("pop")) {
    density = "medium";
    restBias = 0.2;
    motifLength = 4;
    phraseShape = "arch";
    rhythmicStyle = "bounce";
  } else if (genre.includes("hip") || genre.includes("trap") || genre.includes("rap")) {
    density = "low";
    restBias = 0.4; // heavy rest for rapping/vocal spaces
    motifLength = 2;
    phraseShape = "fall";
    rhythmicStyle = "laid-back";
  } else if (genre.includes("edm") || genre.includes("house") || genre.includes("techno") || genre.includes("dance")) {
    density = "high";
    restBias = 0.15;
    motifLength = 4;
    phraseShape = "rise";
    rhythmicStyle = "straight";
  } else if (genre.includes("ballad")) {
    density = "low";
    restBias = 0.3;
    motifLength = 3;
    phraseShape = "arch";
    rhythmicStyle = "laid-back";
  } else if (genre.includes("funk")) {
    density = "medium";
    restBias = 0.25;
    motifLength = 3;
    phraseShape = "flat";
    rhythmicStyle = "syncopated";
  }

  // Handle high drum density restriction
  if (context.drumDensity > 60) {
    density = "low";
    restBias += 0.15;
  }

  // Strong beat steps
  const strongBeatSteps = context.toplineHints.strongBeatSteps || [0, 4, 8, 12];
  
  // Avoid steps (such as the end of a 4-bar block for breathing)
  const avoidSteps: number[] = [];
  if (context.bars === 4) {
    // Bar 4 ending is step 60 to 64. Rest the last 2-4 steps
    avoidSteps.push(60, 61, 62, 63);
  } else if (context.bars === 2) {
    avoidSteps.push(28, 29, 30, 31);
  }

  const pickupSteps = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63];

  const sourceSummary = `${context.sourceType === "mdbg-session" ? "MDBG Session Metadata" : "Acoustic Pattern Detection"} (BPM:${context.bpm}, ${context.key} ${context.scale})`;

  return {
    bpm: context.bpm,
    key: context.key,
    scale: context.scale,
    bars: context.bars,
    register: { minMidi, maxMidi, preferredCenter },
    density,
    restBias: Math.min(0.8, Math.max(0.05, restBias)),
    motifLength,
    phraseShape,
    rhythmicStyle,
    allowedNotes,
    strongBeatSteps,
    avoidSteps,
    pickupSteps,
    sourceSummary
  };
}

function getMidiNotesInIntervals(
  rootPitchClass: number,
  intervals: number[],
  minMidi: number,
  maxMidi: number
): number[] {
  const allowed: number[] = [];
  for (let m = minMidi; m <= maxMidi; m++) {
    const pc = m % 12;
    const diff = (pc - rootPitchClass + 12) % 12;
    if (intervals.includes(diff)) {
      allowed.push(m);
    }
  }
  return allowed;
}

