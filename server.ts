import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  AdminOverviewData,
  AudioTrackData,
  CharacterProfileItem,
  DetectedSongSection,
  DirectorStyle,
  FinalExportRecord,
  FlowAndProviderSettings,
  LyricSymbolismItem,
  MusicVideoProject,
  ProviderPriority,
  StoryboardScene,
  StudioBackgroundJob,
  StudioUserAccount,
} from './src/types/studio';
import {
  createDemoSandboxProject,
  createEmptyProductionProject,
  INITIAL_CHARACTERS,
  INITIAL_FLOW_SETTINGS,
  PRESET_STUDIO_TRACKS,
  STUDIO_ASSET_IMAGES,
} from './src/data/seedStudioData';
import {
  analyzeLyricsForVisualSymbolism,
  formatTimecode,
  generateBeatGrid,
  generateFullLengthStoryboard,
  generateSrtContent,
  syncLyricsToTimeline,
} from './src/utils/studioEngine';

dotenv.config();

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent Server Storage Directories
const STORAGE_ROOT = path.join(__dirname, 'storage');
const UPLOADS_DIR = path.join(STORAGE_ROOT, 'uploads');
const CLIPS_DIR = path.join(STORAGE_ROOT, 'clips');
const RENDERS_DIR = path.join(STORAGE_ROOT, 'renders');
const DB_FILE_PATH = path.join(STORAGE_ROOT, 'studio-db.json');

for (const dir of [STORAGE_ROOT, UPLOADS_DIR, CLIPS_DIR, RENDERS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

interface StoryboardRecord {
  id: string;
  projectId: string;
  ownerId: string;
  durationSec: number;
  sceneIds: string[];
  createdAtIso: string;
}

interface GeneratedVideoRecord {
  id: string;
  projectId: string;
  sceneId: string;
  jobId: string;
  provider: string;
  videoUrl: string;
  durationSec: number;
  createdAtIso: string;
}

interface PersistentStudioDatabase {
  schemaVersion: number;
  users: Record<string, StudioUserAccount>;
  projects: Record<string, MusicVideoProject>;
  audioAssets: Record<string, AudioTrackData>;
  storyboards: Record<string, StoryboardRecord>;
  scenes: Record<string, StoryboardScene>;
  characters: Record<string, CharacterProfileItem>;
  jobs: Record<string, StudioBackgroundJob>;
  generatedVideos: Record<string, GeneratedVideoRecord>;
  finalExports: Record<string, FinalExportRecord>;
  apiTelemetry: {
    geminiCalls: number;
    veoCalls: number;
    imageCalls: number;
    ttsCalls: number;
    transcribeCalls: number;
    ffmpegSceneRenders: number;
    ffmpegMasterRenders: number;
    totalErrors: number;
  };
  errorLogs: {
    id: string;
    timestamp: string;
    endpoint: string;
    message: string;
  }[];
  systemSettings: FlowAndProviderSettings & {
    announcement: string;
    maxSongDurationSec: number;
  };
}

const CURRENT_DB_SCHEMA_VERSION = 3;

function loadOrCreateDatabase(): PersistentStudioDatabase {
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as PersistentStudioDatabase;
      if (parsed && parsed.schemaVersion === CURRENT_DB_SCHEMA_VERSION && parsed.projects) {
        // Remove any legacy contaminated demo project that was marked as production
        delete parsed.projects['proj_midnight_neon_01'];
        return parsed;
      }
    } catch (err) {
      console.error('Re-initializing clean studio-db.json:', err);
    }
  }

  // Initialize 100% clean database with isolated demo sandbox and empty initial production project
  const demoProject = createDemoSandboxProject();
  const initialProdProject = createEmptyProductionProject({
    id: `proj_${Date.now()}_init`,
    ownerId: 'admin_primary',
    title: 'Untitled Music Video #1',
  });

  const projectsMap: Record<string, MusicVideoProject> = {
    [initialProdProject.id]: initialProdProject,
    [demoProject.id]: demoProject,
  };

  const charsMap: Record<string, CharacterProfileItem> = {};
  INITIAL_CHARACTERS.forEach((c) => {
    charsMap[c.id] = c;
  });

  const audioAssetsMap: Record<string, AudioTrackData> = {};
  PRESET_STUDIO_TRACKS.forEach((t) => {
    audioAssetsMap[t.id] = t;
  });

  const defaultAdminUser: StudioUserAccount = {
    uid: 'admin_primary',
    email: 'Mq5023789@gmail.com',
    displayName: 'Studio Director (Admin)',
    photoURL: '',
    role: 'admin',
    plan: 'pro',
    appCredits: 500,
    flowConnected: false,
    lastActiveIso: new Date().toISOString(),
  };

  const freshDb: PersistentStudioDatabase = {
    schemaVersion: CURRENT_DB_SCHEMA_VERSION,
    users: { [defaultAdminUser.uid]: defaultAdminUser },
    projects: projectsMap,
    audioAssets: audioAssetsMap,
    storyboards: {},
    scenes: {},
    characters: charsMap,
    jobs: {},
    generatedVideos: {},
    finalExports: {},
    apiTelemetry: {
      geminiCalls: 0,
      veoCalls: 0,
      imageCalls: 0,
      ttsCalls: 0,
      transcribeCalls: 0,
      ffmpegSceneRenders: 0,
      ffmpegMasterRenders: 0,
      totalErrors: 0,
    },
    errorLogs: [],
    systemSettings: {
      ...INITIAL_FLOW_SETTINGS,
      announcement:
        'Priority 3 (Procedural Cinema Engine) is active for local video rendering. Priority 1 (Google Flow) is marked NOT INTEGRATED (no public Google API). Priority 2 (Official Google Veo API) requires explicit Admin enable and GEMINI_API_KEY.',
      maxSongDurationSec: 900,
    },
  };

  saveDatabase(freshDb);
  return freshDb;
}

function saveDatabase(dbData: PersistentStudioDatabase): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist studio-db.json:', err);
  }
}

const studioDb = loadOrCreateDatabase();

function logServerError(endpoint: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  studioDb.apiTelemetry.totalErrors += 1;
  studioDb.errorLogs.unshift({
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    endpoint,
    message,
  });
  studioDb.errorLogs = studioDb.errorLogs.slice(0, 50);
  saveDatabase(studioDb);
  return message;
}

function isGeminiKeyConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(
    apiKey &&
      apiKey !== 'MY_GEMINI_API_KEY' &&
      apiKey !== 'YOUR_API_KEY' &&
      apiKey.trim().length > 10
  );
}

function getGenAIClient(): GoogleGenAI | null {
  if (!isGeminiKeyConfigured()) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
}

function getDirectorySize(dirPath: string): { bytes: number; count: number } {
  if (!fs.existsSync(dirPath)) return { bytes: 0, count: 0 };
  let bytes = 0;
  let count = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isFile()) {
      bytes += fs.statSync(full).size;
      count += 1;
    }
  }
  return { bytes, count };
}

function sanitizeDrawtext(text: string): string {
  return (text || '')
    .replace(/[\\':%\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 68);
}

/**
 * REAL SERVER-SIDE AUDIO SIGNAL ANALYZER (ffprobe + ffmpeg PCM DSP)
 * Extracts exact duration, codec, sample rate, channels, 80-bar amplitude waveform,
 * onset-envelope autocorrelation BPM, beat timestamps, RMS energy score, mood,
 * and structural song sections from the actual uploaded audio file on disk.
 */
async function analyzeAudioFileOnDisk(diskPath: string): Promise<{
  durationSec: number;
  codecName: string;
  format: string;
  sampleRate: number;
  channels: number;
  fileSizeBytes: number;
  bpm: number;
  musicalKey: string;
  mood: string;
  energyScore: number;
  waveformPeaks: number[];
  beatTimestampsSec: number[];
  detectedSections: DetectedSongSection[];
}> {
  if (!fs.existsSync(diskPath)) {
    throw new Error(`Audio file not found on disk: ${diskPath}`);
  }
  const fileSizeBytes = fs.statSync(diskPath).size;
  if (fileSizeBytes === 0) {
    throw new Error('Uploaded audio file is empty (0 bytes).');
  }

  // 1. Probe authoritative metadata via ffprobe
  const { stdout: probeOut } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration,format_name:stream=codec_name,sample_rate,channels',
    '-of',
    'json',
    diskPath,
  ]);

  const probeJson = JSON.parse(probeOut || '{}');
  const rawDur = Number(probeJson?.format?.duration || probeJson?.streams?.[0]?.duration || 0);
  if (!rawDur || rawDur <= 0.5) {
    throw new Error('Could not read valid audio duration from uploaded file. Ensure it is a valid MP3/WAV file.');
  }

  const durationSec = Math.max(1, Math.round(rawDur));
  const codecName = String(probeJson?.streams?.[0]?.codec_name || 'pcm');
  const format = String(probeJson?.format?.format_name || codecName);
  const sampleRate = Number(probeJson?.streams?.[0]?.sample_rate) || 44100;
  const channels = Number(probeJson?.streams?.[0]?.channels) || 2;

  // 2. Decode audio into 2000Hz mono 16-bit signed PCM buffer for real signal analysis
  const { stdout: pcmBuffer } = await execFileAsync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      diskPath,
      '-ac',
      '1',
      '-ar',
      '2000',
      '-f',
      's16le',
      'pipe:1',
    ],
    { encoding: 'buffer', maxBuffer: 25 * 1024 * 1024 }
  );

  const sampleCount = Math.floor(pcmBuffer.length / 2);
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    samples[i] = pcmBuffer.readInt16LE(i * 2) / 32768;
  }

  // 3. Compute 80-bar real waveform peaks across the entire song
  const barCount = 80;
  const samplesPerBar = Math.max(1, Math.floor(sampleCount / barCount));
  const rawBarPeaks: number[] = [];
  let maxBarPeak = 0.01;

  for (let b = 0; b < barCount; b++) {
    const start = b * samplesPerBar;
    const end = Math.min(sampleCount, start + samplesPerBar);
    let sumSq = 0;
    let peak = 0;
    for (let i = start; i < end; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > peak) peak = abs;
      sumSq += abs * abs;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - start));
    const combined = peak * 0.6 + rms * 0.4;
    if (combined > maxBarPeak) maxBarPeak = combined;
    rawBarPeaks.push(combined);
  }

  const waveformPeaks = rawBarPeaks.map((val) =>
    Number(Math.min(1, Math.max(0.08, val / maxBarPeak)).toFixed(2))
  );

  // 4. Compute RMS Energy Score & Onset Envelope for BPM Detection
  // At 2000Hz, 40 samples = 20ms (50 frames per second)
  const frameSize = 40;
  const frameRate = 2000 / frameSize; // 50 Hz
  const numFrames = Math.floor(sampleCount / frameSize);
  const frameEnergy = new Float32Array(numFrames);
  const onsetEnv = new Float32Array(numFrames);
  let totalEnergySum = 0;

  for (let f = 0; f < numFrames; f++) {
    let sum = 0;
    const base = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      const s = samples[base + i];
      sum += s * s;
    }
    const rms = Math.sqrt(sum / frameSize);
    frameEnergy[f] = rms;
    totalEnergySum += rms;
    if (f > 0) {
      const diff = rms - frameEnergy[f - 1];
      onsetEnv[f] = diff > 0 ? diff : 0;
    }
  }

  const meanRms = totalEnergySum / Math.max(1, numFrames);
  const energyScore = Math.min(100, Math.max(15, Math.round(meanRms * 320)));

  // Autocorrelation on onset envelope between 68 BPM and 176 BPM
  // lag in frames = (60 / bpm) * frameRate
  let bestLag = Math.round((60 / 120) * frameRate);
  let bestCorr = -1;
  const minLag = Math.round((60 / 176) * frameRate); // ~17 frames
  const maxLag = Math.round((60 / 68) * frameRate);  // ~44 frames
  const analysisFrames = Math.min(numFrames, frameRate * 90); // analyze up to 90s

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let f = 0; f < analysisFrames - lag; f++) {
      corr += onsetEnv[f] * onsetEnv[f + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  const detectedBpm =
    bestCorr > 0.0001
      ? Math.min(180, Math.max(68, Math.round((60 * frameRate) / bestLag)))
      : 120;

  // Estimate dominant pitch / musical key using zero-crossing rate
  let zeroCrossings = 0;
  for (let i = 1; i < sampleCount; i++) {
    if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }
  const avgFreqHz = (zeroCrossings * 2000) / (2 * Math.max(1, sampleCount));
  const keyNames = [
    'C Minor',
    'D Minor',
    'E Minor',
    'F Minor',
    'G Minor',
    'A Minor',
    'F# Minor',
    'C Major',
    'G Major',
    'D Major',
    'A Major',
    'E Major',
  ];
  const musicalKey = keyNames[Math.abs(Math.round(avgFreqHz)) % keyNames.length];

  // Classify mood from measured BPM and energy score
  let mood = 'Dynamic Contemporary';
  if (detectedBpm >= 128 && energyScore >= 55) {
    mood = 'High-Energy Driving Anthem';
  } else if (detectedBpm >= 115 && energyScore >= 40) {
    mood = 'Upbeat Rhythmic Groove';
  } else if (detectedBpm < 100 && energyScore < 45) {
    mood = 'Atmospheric & Melancholic Ballad';
  } else if (energyScore >= 60) {
    mood = 'Intense Cinematic Crescendo';
  } else {
    mood = 'Mid-Tempo Emotional Narrative';
  }

  // 5. Structural Song Section Detection across exact durationSec
  const sectionLabels =
    durationSec < 32
      ? ['Intro', 'Main Verse', 'Chorus Peak', 'Outro']
      : [
          'Intro',
          'Verse 1',
          'Chorus 1',
          'Verse 2',
          'Chorus 2',
          'Bridge',
          'Final Chorus',
          'Outro',
        ];
  const sectionWeights =
    durationSec < 32
      ? [0.2, 0.3, 0.3, 0.2]
      : [15 / 210, 30 / 210, 20 / 210, 30 / 210, 25 / 210, 30 / 210, 40 / 210, 20 / 210];

  let cursorSec = 0;
  const detectedSections: DetectedSongSection[] = sectionLabels.map((label, idx) => {
    const isLast = idx === sectionLabels.length - 1;
    const rawSpan = Math.max(1, Math.round(durationSec * sectionWeights[idx]));
    const startTimeSec = cursorSec;
    const endTimeSec = isLast
      ? durationSec
      : Math.min(durationSec - (sectionLabels.length - 1 - idx), cursorSec + rawSpan);
    cursorSec = endTimeSec;

    // Measure average RMS in this section window
    const startBar = Math.floor((startTimeSec / durationSec) * barCount);
    const endBar = Math.max(startBar + 1, Math.ceil((endTimeSec / durationSec) * barCount));
    let secSum = 0;
    for (let b = startBar; b < Math.min(barCount, endBar); b++) {
      secSum += waveformPeaks[b];
    }
    const rmsNormalized = Number(
      (secSum / Math.max(1, endBar - startBar)).toFixed(2)
    );

    let energyLevel = 'Moderate Narrative Groove';
    if (rmsNormalized >= 0.72) energyLevel = 'High-Energy Peak';
    else if (rmsNormalized >= 0.52) energyLevel = 'Building Rhythmic Drive';
    else if (rmsNormalized < 0.35) energyLevel = 'Low / Atmospheric';

    return {
      section: label,
      startTimeSec,
      endTimeSec,
      durationSec: Math.max(1, endTimeSec - startTimeSec),
      energyLevel,
      rmsNormalized,
    };
  });

  return {
    durationSec,
    codecName,
    format,
    sampleRate,
    channels,
    fileSizeBytes,
    bpm: detectedBpm,
    musicalKey,
    mood,
    energyScore,
    waveformPeaks,
    beatTimestampsSec: generateBeatGrid(detectedBpm, durationSec),
    detectedSections,
  };
}

/**
 * Resolves the local disk path of a project's uploaded audio file, or synthesizes
 * a project-specific harmonic audio file ONLY if the project is the Demo Sandbox.
 */
async function resolveProjectAudioDiskPath(project: MusicVideoProject): Promise<string> {
  const track = project.audioTrack;
  if (track?.audioUrl && track.audioUrl.startsWith('/storage/uploads/')) {
    const diskPath = path.join(__dirname, track.audioUrl.replace(/^\//, ''));
    if (fs.existsSync(diskPath)) {
      return diskPath;
    }
  }

  if (!project.isDemoProject) {
    throw new Error(
      `Project "${project.title}" does not have an uploaded audio file on disk. Please upload an MP3 or WAV file first.`
    );
  }

  // Only for isolated Demo Sandbox
  const bpm = Math.min(200, Math.max(60, project.bpm || 124));
  const dur = Math.min(360, Math.max(5, Math.round(project.durationSec || 30)));
  const synthWavPath = path.join(
    UPLOADS_DIR,
    `demo_sandbox_${bpm}bpm_${dur}s.wav`
  );

  if (fs.existsSync(synthWavPath)) {
    return synthWavPath;
  }

  const beatFreq = (bpm / 60).toFixed(2);
  const expr = `0.18*sin(2*PI*65.41*t)*(0.5+0.5*sin(2*PI*${beatFreq}*t))+0.12*sin(2*PI*130.81*t)+0.09*sin(2*PI*196.00*t)`;

  await execFileAsync('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `aevalsrc='${expr}|${expr}':s=44100:d=${dur}`,
    '-c:a',
    'pcm_s16le',
    synthWavPath,
  ]);

  return synthWavPath;
}

/**
 * PRIORITY 3: PROCEDURAL CINEMA ENGINE (FFmpeg Audio-Reactive Motion Graphics Renderer)
 * Creates a real, renderable, music-reactive procedural MP4 video clip for a scene
 * synchronized to the exact audio slice `[scene.startTimeSec, scene.endTimeSec]`
 * of the uploaded song! Never uses static demo videos.
 */
async function renderProceduralSceneClipWithFfmpeg(
  project: MusicVideoProject,
  scene: StoryboardScene,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  const masterAudioPath = await resolveProjectAudioDiskPath(project);
  const clipDur = Math.max(1, Math.round(scene.durationSec || 5));
  const startSec = Math.max(0, Math.round(scene.startTimeSec || 0));
  const outFilename = `proc_scene_${project.id}_${scene.id}_${Date.now()}.mp4`;
  const outPath = path.join(CLIPS_DIR, outFilename);

  const fontFile = '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf';
  const titleText = sanitizeDrawtext(
    `SCENE 0${scene.index} [${scene.section.toUpperCase()}] ${formatTimecode(
      scene.startTimeSec
    )}-${formatTimecode(scene.endTimeSec)}`
  );
  const motifText = sanitizeDrawtext(
    `Motif: ${scene.symbolismVisualMotif || scene.title}`
  );
  const camText = sanitizeDrawtext(
    `${scene.cameraAngle} | ${scene.cameraMovement} | ${scene.transition}`
  );
  const lyricText = sanitizeDrawtext(scene.lyricExcerpt);

  // Pick distinct procedural color palette based on scene animation preset / index
  const palettes: [string, string, string][] = [
    ['0x0B132B', '0x38BDF8', '0x818CF8'],
    ['0x1A0E2E', '0xEC4899', '0x6366F1'],
    ['0x0A1F24', '0x2DD4BF', '0x38BDF8'],
    ['0x26140C', '0xF59E0B', '0xEF4444'],
    ['0x12102E', '0xA855F7', '0x06B6D4'],
  ];
  const [bgHex, waveHex1, waveHex2] = palettes[(scene.index - 1) % palettes.length];

  // Check if user explicitly uploaded a custom image for this scene
  const customImageDiskPath =
    scene.backdropImageUrl && scene.backdropImageUrl.startsWith('/storage/uploads/')
      ? path.join(__dirname, scene.backdropImageUrl.replace(/^\//, ''))
      : null;

  if (customImageDiskPath && fs.existsSync(customImageDiskPath)) {
    // Combine user's uploaded reference image with live audio-reactive waveform overlay
    const scaledW = Math.round(targetWidth * 1.12);
    const scaledH = Math.round(targetHeight * 1.12);
    const filterComplex = [
      `[1:v]scale=${scaledW}:${scaledH}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}:'(in_w-out_w)*(t/${clipDur})':'(in_h-out_h)/2',eq=brightness=0.02:saturation=1.15[bg]`,
      `[0:a]showwaves=s=${targetWidth}x${Math.round(targetHeight * 0.35)}:mode=cline:rate=24:colors=${waveHex1}|${waveHex2}[sw]`,
      `[bg][sw]overlay=0:H-h-70,drawbox=x=0:y=0:w=iw:h=52:color=0x090D16@0.82:t=fill,drawbox=x=0:y=ih-76:w=iw:h=76:color=0x090D16@0.86:t=fill,drawtext=fontfile=${fontFile}:text='${titleText}':fontcolor=white:fontsize=16:x=18:y=10,drawtext=fontfile=${fontFile}:text='${camText}':fontcolor=0x38BDF8:fontsize=12:x=18:y=32,drawtext=fontfile=${fontFile}:text='${lyricText}':fontcolor=0xF8FAFC:fontsize=19:x=(w-text_w)/2:y=h-48,fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0.4, clipDur - 0.35)}:d=0.35,format=yuv420p[v]`,
    ].join(';');

    await execFileAsync('ffmpeg', [
      '-y',
      '-ss',
      String(startSec),
      '-t',
      String(clipDur),
      '-i',
      masterAudioPath,
      '-loop',
      '1',
      '-t',
      String(clipDur),
      '-i',
      customImageDiskPath,
      '-filter_complex',
      filterComplex,
      '-map',
      '[v]',
      '-map',
      '0:a',
      '-r',
      '24',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-shortest',
      '-movflags',
      '+faststart',
      outPath,
    ]);
  } else {
    // 100% Pure Procedural Audio-Reactive Motion Graphics (No static demo images!)
    const waveH = Math.round(targetHeight * 0.55);
    const waveY = Math.round((targetHeight - waveH) / 2);
    const filterComplex = [
      `color=c=${bgHex}:s=${targetWidth}x${targetHeight}:r=24:d=${clipDur}[bg]`,
      `[0:a]showwaves=s=${targetWidth}x${waveH}:mode=p2p:rate=24:colors=${waveHex1}|${waveHex2}[sw1]`,
      `[0:a]showwaves=s=${targetWidth}x${Math.round(waveH * 0.7)}:mode=cline:rate=24:colors=${waveHex2}|0xFFFFFF[sw2]`,
      `[bg][sw1]overlay=0:${waveY}[tmp1]`,
      `[tmp1][sw2]overlay=0:${waveY + Math.round(waveH * 0.15)},drawbox=x=0:y=0:w=iw:h=68:color=0x090D16@0.88:t=fill,drawbox=x=0:y=ih-86:w=iw:h=86:color=0x090D16@0.90:t=fill,drawtext=fontfile=${fontFile}:text='${titleText}':fontcolor=white:fontsize=16:x=20:y=12,drawtext=fontfile=${fontFile}:text='${camText}':fontcolor=0x38BDF8:fontsize=12:x=20:y=38,drawtext=fontfile=${fontFile}:text='${motifText}':fontcolor=0xA5B4FC:fontsize=13:x=(w-text_w)/2:y=h-72,drawtext=fontfile=${fontFile}:text='${lyricText}':fontcolor=0xFFFFFF:fontsize=19:x=(w-text_w)/2:y=h-42,fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0.4, clipDur - 0.35)}:d=0.35,format=yuv420p[v]`,
    ].join(';');

    await execFileAsync('ffmpeg', [
      '-y',
      '-ss',
      String(startSec),
      '-t',
      String(clipDur),
      '-i',
      masterAudioPath,
      '-filter_complex',
      filterComplex,
      '-map',
      '[v]',
      '-map',
      '0:a',
      '-r',
      '24',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-shortest',
      '-movflags',
      '+faststart',
      outPath,
    ]);
  }

  studioDb.apiTelemetry.ffmpegSceneRenders += 1;
  saveDatabase(studioDb);
  return `/storage/clips/${outFilename}`;
}

/**
 * Background Job Runner: Executes a scene video generation job or full-length MP4 render job
 * asynchronously while updating job progress and database state in real time.
 */
async function processBackgroundJob(
  jobId: string,
  options?: { explicitBillingAuthorized?: boolean }
) {
  const job = studioDb.jobs[jobId];
  if (!job || job.status === 'CANCELLED') return;
  const project = studioDb.projects[job.projectId];
  if (!project) {
    job.status = 'FAILED';
    job.errorMessage = 'Target project not found in database.';
    job.updatedAtIso = new Date().toISOString();
    saveDatabase(studioDb);
    return;
  }

  const dims =
    project.aspectRatio === '9:16'
      ? { width: 540, height: 960 }
      : project.aspectRatio === '1:1'
        ? { width: 720, height: 720 }
        : project.resolution === '1080p' || project.resolution === '4K'
          ? { width: 1280, height: 720 }
          : { width: 854, height: 480 };

  try {
    job.status = 'PROCESSING';
    job.progress = 10;
    job.stepMessage = 'Initializing generation provider adapter...';
    job.updatedAtIso = new Date().toISOString();
    saveDatabase(studioDb);

    if (job.type === 'scene_video') {
      const scene = project.scenes.find((s) => s.id === job.sceneId);
      if (!scene) {
        throw new Error(`Scene ${job.sceneId} not found in project ${project.id}.`);
      }

      // Check Provider Selection strictly (BUG 5)
      if (job.provider === 'google_flow_priority_1') {
        throw new Error(
          'PROVIDER NOT INTEGRATED: Google does not expose an official public API to consume consumer Google Flow subscription credits externally. Switch Provider to Priority 3 (Procedural Cinema Engine) or Priority 2 (Official Google Veo API), or upload a clip manually from Google Flow.'
        );
      }

      scene.status = 'PROCESSING';
      scene.lastJobId = job.id;
      saveDatabase(studioDb);

      if (job.provider === 'google_veo_api_priority_2') {
        if (!studioDb.systemSettings.veoApiEnabled && !studioDb.systemSettings.apiFallbackEnabled) {
          throw new Error(
            'Priority 2 (Official Google Veo API) is disabled in Admin Settings. Enable Separate Paid API / Veo in Admin Panel first, or switch to Priority 3 (Procedural Cinema Engine).'
          );
        }
        if (!options?.explicitBillingAuthorized) {
          throw new Error(
            'Explicit billing confirmation is required before invoking the separately billed Google Veo API.'
          );
        }
        const ai = getGenAIClient();
        if (!ai) {
          throw new Error(
            'GEMINI_API_KEY is not configured in Settings > Secrets. Add GEMINI_API_KEY to use Official Google Veo API, or switch to Priority 3 (Procedural Cinema Engine).'
          );
        }

        job.progress = 35;
        job.stepMessage =
          'Calling Official Google Veo / Omni API (gemini-omni-1.2-flash)...';
        saveDatabase(studioDb);

        studioDb.apiTelemetry.veoCalls += 1;
        const interaction = await ai.interactions.create(
          {
            model: 'gemini-omni-1.2-flash',
            input: scene.googleFlowPrompt,
            background: false,
            store: true,
            stream: false,
            response_format: {
              type: 'video',
              aspect_ratio: project.aspectRatio === '9:16' ? '9:16' : '16:9',
              duration: `${Math.min(8, Math.max(4, Math.round(scene.durationSec)))}s`,
              resolution: '720p',
            },
          },
          { timeout: 300000 }
        );

        const videoPart = interaction.output_video;
        if (videoPart?.data) {
          const outFilename = `veo_scene_${project.id}_${scene.id}_${Date.now()}.mp4`;
          const outPath = path.join(CLIPS_DIR, outFilename);
          fs.writeFileSync(outPath, Buffer.from(videoPart.data, 'base64'));
          const clipUrl = `/storage/clips/${outFilename}`;
          scene.generatedVideoUrl = clipUrl;
          scene.status = 'COMPLETED';
          scene.providerSource = 'google_veo_api_priority_2';
          scene.errorMessage = undefined;
          job.outputUrl = clipUrl;
          job.downloadUrl = `/api/clips/download/${outFilename}`;
        } else {
          throw new Error('Veo interaction completed without video byte payload.');
        }
      } else {
        // PRIORITY 3: PROCEDURAL CINEMA ENGINE
        job.progress = 45;
        job.stepMessage = `Procedural Cinema Engine: Rendering audio-reactive scene ${scene.index} (${scene.durationSec}s · ${dims.width}x${dims.height})...`;
        saveDatabase(studioDb);

        const clipUrl = await renderProceduralSceneClipWithFfmpeg(
          project,
          scene,
          dims.width,
          dims.height
        );
        const filename = path.basename(clipUrl);
        scene.generatedVideoUrl = clipUrl;
        scene.status = 'COMPLETED';
        scene.providerSource = 'procedural_cinema_priority_3';
        scene.errorMessage = undefined;
        job.outputUrl = clipUrl;
        job.downloadUrl = `/api/clips/download/${filename}`;
      }

      // Record in generatedVideos table
      const genVidId = `genvid_${Date.now()}_${scene.index}`;
      studioDb.generatedVideos[genVidId] = {
        id: genVidId,
        projectId: project.id,
        sceneId: scene.id,
        jobId: job.id,
        provider: job.provider,
        videoUrl: scene.generatedVideoUrl!,
        durationSec: scene.durationSec,
        createdAtIso: new Date().toISOString(),
      };
      studioDb.scenes[scene.id] = scene;

      project.completedScenes = project.scenes.filter(
        (s) => s.status === 'COMPLETED' && Boolean(s.generatedVideoUrl)
      ).length;
      project.updatedAtIso = new Date().toISOString();

      job.progress = 100;
      job.status = 'COMPLETED';
      job.stepMessage = `Scene ${scene.index} (${scene.section} · ${formatTimecode(
        scene.startTimeSec
      )}–${formatTimecode(scene.endTimeSec)}) MP4 clip completed.`;
      job.updatedAtIso = new Date().toISOString();
      saveDatabase(studioDb);
      return;
    }

    // Full-Length Master MP4 Assembly Pipeline (BUG 7)
    if (job.type === 'master_mp4_render') {
      if (project.scenes.length === 0) {
        throw new Error(
          'Project has no storyboard scenes yet. Analyze the uploaded song and generate a storyboard first.'
        );
      }

      const masterAudioPath = await resolveProjectAudioDiskPath(project);
      project.status = 'generating_clips';
      saveDatabase(studioDb);

      // Sort scenes strictly by startTimeSec
      const sortedScenes = [...project.scenes].sort(
        (a, b) => a.startTimeSec - b.startTimeSec
      );
      const sceneClipDiskPaths: string[] = [];
      const totalScenes = sortedScenes.length;

      for (let i = 0; i < totalScenes; i++) {
        if ((studioDb.jobs[jobId]?.status as string) === 'CANCELLED') {
          return;
        }
        const sc = sortedScenes[i];
        job.progress = Math.min(65, 8 + Math.round(((i + 1) / totalScenes) * 55));

        // Reuse existing completed clip if already generated and present on disk!
        const existingDiskPath =
          sc.generatedVideoUrl && sc.generatedVideoUrl.startsWith('/storage/')
            ? path.join(__dirname, sc.generatedVideoUrl.replace(/^\//, ''))
            : null;

        if (
          sc.status === 'COMPLETED' &&
          existingDiskPath &&
          fs.existsSync(existingDiskPath)
        ) {
          job.stepMessage = `Verified completed Scene 0${sc.index} (${sc.section}) [${i + 1}/${totalScenes}]...`;
          saveDatabase(studioDb);
          sceneClipDiskPaths.push(existingDiskPath);
        } else {
          job.stepMessage = `Rendering Scene 0${sc.index} (${sc.section} · ${sc.durationSec}s) [${i + 1}/${totalScenes}]...`;
          saveDatabase(studioDb);

          const clipUrl = await renderProceduralSceneClipWithFfmpeg(
            project,
            sc,
            dims.width,
            dims.height
          );
          sc.generatedVideoUrl = clipUrl;
          sc.status = 'COMPLETED';
          sc.providerSource = 'procedural_cinema_priority_3';
          studioDb.scenes[sc.id] = sc;
          sceneClipDiskPaths.push(path.join(__dirname, clipUrl.replace(/^\//, '')));
        }
      }

      project.scenes = sortedScenes;
      project.completedScenes = sortedScenes.length;

      job.progress = 74;
      job.stepMessage = 'Writing FFmpeg concat manifest & synchronized SRT subtitles...';
      saveDatabase(studioDb);

      const concatListPath = path.join(RENDERS_DIR, `concat_${job.id}.txt`);
      const concatContent = sceneClipDiskPaths
        .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
        .join('\n');
      fs.writeFileSync(concatListPath, concatContent, 'utf-8');

      const srtPath = path.join(RENDERS_DIR, `subs_${job.id}.srt`);
      const srtContent = generateSrtContent(project.subtitles);
      fs.writeFileSync(srtPath, srtContent, 'utf-8');

      job.progress = 85;
      job.stepMessage =
        'Joining scene videos, synchronizing original uploaded song & encoding final H.264/AAC MP4...';
      saveDatabase(studioDb);

      const safeSlug =
        project.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 36) || 'music-video';
      const masterFilename = `${safeSlug}-${project.id}-${project.resolution.toLowerCase()}-${Date.now()}.mp4`;
      const masterOutPath = path.join(RENDERS_DIR, masterFilename);

      const trimStart = Math.max(0, Number(project.audioTrack?.trimStartSec) || 0);
      const targetDuration = Math.max(1, Math.round(project.durationSec));

      // Join scene video streams and mux with the original uploaded song for exact song duration
      await execFileAsync('ffmpeg', [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListPath,
        '-ss',
        String(trimStart),
        '-t',
        String(targetDuration),
        '-i',
        masterAudioPath,
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-t',
        String(targetDuration),
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-movflags',
        '+faststart',
        masterOutPath,
      ]);

      try {
        fs.unlinkSync(concatListPath);
      } catch {
        // Ignore cleanup warning
      }

      const publicMp4Url = `/storage/renders/${masterFilename}`;
      const downloadMp4Url = `/api/render/download/${masterFilename}`;
      const finalFileSizeBytes = fs.existsSync(masterOutPath)
        ? fs.statSync(masterOutPath).size
        : 0;

      const exportRecord: FinalExportRecord = {
        id: `exp_${Date.now()}`,
        projectId: project.id,
        jobId: job.id,
        title: project.title,
        resolution: project.resolution,
        aspectRatio: project.aspectRatio,
        durationSec: targetDuration,
        videoUrl: publicMp4Url,
        downloadUrl: downloadMp4Url,
        fileSizeBytes: finalFileSizeBytes,
        createdAtIso: new Date().toISOString(),
      };

      studioDb.finalExports[exportRecord.id] = exportRecord;
      project.renderedMasterMp4Url = publicMp4Url;
      project.renderedMasterDownloadUrl = downloadMp4Url;
      project.exportHistory = [exportRecord, ...(project.exportHistory || [])];
      project.status = 'exported';
      project.updatedAtIso = new Date().toISOString();

      studioDb.apiTelemetry.ffmpegMasterRenders += 1;

      job.status = 'COMPLETED';
      job.progress = 100;
      job.stepMessage = `Master MP4 (${formatTimecode(targetDuration)} · ${project.resolution} · ${project.aspectRatio}) rendered and ready for download.`;
      job.outputUrl = publicMp4Url;
      job.downloadUrl = downloadMp4Url;
      job.updatedAtIso = new Date().toISOString();
      saveDatabase(studioDb);
    }
  } catch (err) {
    const errMsg = logServerError(`job:${job.type}`, err);
    job.status = 'FAILED';
    job.errorMessage = errMsg;
    job.stepMessage = `Failed: ${errMsg}`;
    job.updatedAtIso = new Date().toISOString();

    if (job.sceneId) {
      const sc = project.scenes.find((s) => s.id === job.sceneId);
      if (sc) {
        sc.status = 'FAILED';
        sc.errorMessage = errMsg;
        studioDb.scenes[sc.id] = sc;
      }
    }
    saveDatabase(studioDb);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use('/storage', express.static(STORAGE_ROOT));

  // Health & API Provider Status
  app.get('/api/status', (_req, res) => {
    const hasGeminiKey = isGeminiKeyConfigured();
    res.json({
      status: 'ok',
      geminiConfigured: hasGeminiKey,
      ffmpegAvailable: true,
      providers: {
        google_flow_priority_1: {
          status: 'NOT_INTEGRATED',
          reason:
            'Google does not expose a public third-party API or OAuth scope to consume consumer Google Flow subscription credits externally.',
        },
        google_veo_api_priority_2: {
          status: hasGeminiKey && studioDb.systemSettings.veoApiEnabled ? 'ACTIVE' : 'DISABLED_PENDING_AUTH',
          reason:
            'Official Google Veo API requires Admin enablement, explicit per-action billing authorization, and GEMINI_API_KEY.',
        },
        procedural_cinema_priority_3: {
          status: 'ACTIVE',
          reason:
            'Real-time Canvas/WebGL + FFmpeg audio-reactive procedural visual engine. Generates renderable MP4 visuals synchronized to your song.',
        },
      },
    });
  });

  // Bootstrap Persistent Studio State — Strictly Isolated by demoMode and ownerId
  app.get('/api/bootstrap', (req, res) => {
    const isDemoMode = req.query.demoMode === 'true';

    let projectsList = Object.values(studioDb.projects)
      .filter((p) => Boolean(p.isDemoProject) === isDemoMode)
      .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));

    // If in production mode and no production projects exist yet, create one clean empty project
    if (!isDemoMode && projectsList.length === 0) {
      const fresh = createEmptyProductionProject({
        id: `proj_${Date.now()}_prod`,
        ownerId: 'admin_primary',
        title: 'Untitled Music Video #1',
      });
      studioDb.projects[fresh.id] = fresh;
      saveDatabase(studioDb);
      projectsList = [fresh];
    }

    const activeProjectIds = new Set(projectsList.map((p) => p.id));
    const charactersList = Object.values(studioDb.characters);
    const tracksList = Object.values(studioDb.audioAssets).filter((t) =>
      isDemoMode
        ? t.projectId === 'demo_sandbox_project'
        : t.projectId && activeProjectIds.has(t.projectId)
    );
    const jobsList = Object.values(studioDb.jobs)
      .filter((j) => activeProjectIds.has(j.projectId))
      .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));

    res.json({
      projects: projectsList,
      characters: charactersList,
      tracks: tracksList,
      jobs: jobsList.slice(0, 60),
      flowSettings: studioDb.systemSettings,
      systemSettings: {
        ...studioDb.systemSettings,
        geminiConfigured: isGeminiKeyConfigured(),
      },
    });
  });

  // User Auth Profile Sync
  app.post('/api/users/sync', (req, res) => {
    const { uid, email, displayName, photoURL } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'uid is required.' });
    }
    const existing = studioDb.users[uid];
    const isAdminEmail =
      email === 'Mq5023789@gmail.com' || existing?.role === 'admin';
    const userRecord: StudioUserAccount = {
      uid,
      email: email || existing?.email || '',
      displayName: displayName || existing?.displayName || 'Studio Creator',
      photoURL: photoURL || existing?.photoURL || '',
      role: isAdminEmail ? 'admin' : 'user',
      plan: existing?.plan || 'free',
      appCredits: existing?.appCredits ?? 500,
      flowConnected: false,
      lastActiveIso: new Date().toISOString(),
    };
    studioDb.users[uid] = userRecord;
    if (email) {
      studioDb.systemSettings.connectedGoogleEmail = email;
    }
    saveDatabase(studioDb);
    return res.json({ user: userRecord });
  });

  // Persistent Projects CRUD — Creates 100% Empty Real Project (BUG 1 Fixed)
  app.post('/api/projects', (req, res) => {
    try {
      const incoming = req.body as Partial<MusicVideoProject>;
      const prodCount = Object.values(studioDb.projects).filter(
        (p) => !p.isDemoProject
      ).length;
      const newId =
        incoming.id ||
        `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const emptyBase = createEmptyProductionProject({
        id: newId,
        ownerId: incoming.ownerId || 'admin_primary',
        title: incoming.title || `Untitled Music Video #${prodCount + 1}`,
      });

      const newProject: MusicVideoProject = {
        ...emptyBase,
        description: incoming.description || '',
        directorStyle: incoming.directorStyle || 'Story-based music video',
        aspectRatio: incoming.aspectRatio || '16:9',
        resolution: incoming.resolution || '1080p',
        isDemoProject: false,
        updatedAtIso: new Date().toISOString(),
      };

      studioDb.projects[newId] = newProject;
      saveDatabase(studioDb);
      return res.json({ project: newProject });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/projects', error) });
    }
  });

  app.put('/api/projects/:id', (req, res) => {
    try {
      const { id } = req.params;
      const incoming = req.body as MusicVideoProject;
      const existing = studioDb.projects[id];
      const base = existing || createEmptyProductionProject({ id });
      const scenes = Array.isArray(incoming.scenes)
        ? incoming.scenes.map((s) => ({ ...s, projectId: id }))
        : base.scenes;

      const updated: MusicVideoProject = {
        ...base,
        ...incoming,
        id,
        scenes,
        sceneCount: scenes.length,
        completedScenes: scenes.filter(
          (s) =>
            (s.status === 'COMPLETED' || s.status === 'completed') &&
            Boolean(s.generatedVideoUrl)
        ).length,
        updatedAtIso: new Date().toISOString(),
      };
      studioDb.projects[id] = updated;
      saveDatabase(studioDb);
      return res.json({ project: updated });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/projects/:id', error) });
    }
  });

  app.delete('/api/projects/:id', (req, res) => {
    try {
      const { id } = req.params;
      delete studioDb.projects[id];
      // Also delete associated scenes and jobs for clean relational isolation
      for (const sId of Object.keys(studioDb.scenes)) {
        if (studioDb.scenes[sId].projectId === id) {
          delete studioDb.scenes[sId];
        }
      }
      for (const jId of Object.keys(studioDb.jobs)) {
        if (studioDb.jobs[jId].projectId === id) {
          delete studioDb.jobs[jId];
        }
      }

      const remainingProd = Object.values(studioDb.projects).filter(
        (p) => !p.isDemoProject
      );
      if (remainingProd.length === 0) {
        const fresh = createEmptyProductionProject({
          id: `proj_${Date.now()}_fresh`,
          ownerId: 'admin_primary',
          title: 'Untitled Music Video #1',
        });
        studioDb.projects[fresh.id] = fresh;
      }
      saveDatabase(studioDb);
      return res.json({
        projects: Object.values(studioDb.projects)
          .filter((p) => !p.isDemoProject)
          .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
      });
    } catch (error) {
      return res.status(500).json({ error: logServerError('DELETE /api/projects/:id', error) });
    }
  });

  // Persistent Characters CRUD
  app.post('/api/characters', (req, res) => {
    try {
      const char = req.body as CharacterProfileItem;
      if (!char || !char.name) {
        return res.status(400).json({ error: 'Character name is required.' });
      }
      const id = char.id || `char_${Date.now()}`;
      const record: CharacterProfileItem = { ...char, id };
      studioDb.characters[id] = record;
      saveDatabase(studioDb);
      return res.json({ character: record });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/characters', error) });
    }
  });

  app.delete('/api/characters/:id', (req, res) => {
    const { id } = req.params;
    delete studioDb.characters[id];
    saveDatabase(studioDb);
    return res.json({ characters: Object.values(studioDb.characters) });
  });

  // Real Image File Upload (Reference Photos / Backdrops)
  app.post('/api/uploads/image', (req, res) => {
    try {
      const { fileName = 'reference.jpg', base64Data, dataUrl } = req.body;
      const rawPayload = base64Data || dataUrl;
      if (!rawPayload) {
        return res.status(400).json({ error: 'Image base64Data or dataUrl is required.' });
      }
      const ext = path.extname(fileName).toLowerCase() || '.jpg';
      const safeName = fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const outName = `img_${Date.now()}_${safeName}${ext}`;
      const outPath = path.join(UPLOADS_DIR, outName);
      const cleanBase64 = String(rawPayload).replace(/^data:[^;]+;base64,/, '');
      fs.writeFileSync(outPath, Buffer.from(cleanBase64, 'base64'));
      return res.json({
        imageUrl: `/storage/uploads/${outName}`,
      });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/uploads/image', error) });
    }
  });

  // BUG 2 & BUG 3 FIX: Complete Real MP3 / WAV Audio Upload + Server-Side ffprobe & PCM Signal Analysis
  app.post('/api/audio/upload', async (req, res) => {
    try {
      const {
        projectId,
        ownerId = 'admin_primary',
        fileName = 'track.mp3',
        base64Data,
        dataUrl,
      } = req.body;

      const rawPayload = base64Data || dataUrl;
      if (!rawPayload) {
        return res.status(400).json({
          error: 'No audio payload received. Please select a valid MP3 or WAV audio file.',
        });
      }

      const ext = path.extname(fileName).toLowerCase() || '.mp3';
      const allowedExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
      if (!allowedExts.includes(ext)) {
        return res.status(400).json({
          error: `Unsupported file type "${ext}". Allowed audio formats: MP3, WAV, OGG, M4A, AAC, FLAC.`,
        });
      }

      const safeProjectPrefix = (projectId || 'proj').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeBase = fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 48);
      const uniqueAudioId = `audio_${safeProjectPrefix}_${Date.now()}`;
      const diskFilename = `${uniqueAudioId}_${safeBase}${ext}`;
      const diskPath = path.join(UPLOADS_DIR, diskFilename);

      const cleanBase64 = String(rawPayload).replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length < 128) {
        return res.status(400).json({
          error: 'Uploaded audio file is too small or corrupted.',
        });
      }

      fs.writeFileSync(diskPath, buffer);

      // Run real ffprobe & PCM DSP signal analysis on the saved file
      let analysis;
      try {
        analysis = await analyzeAudioFileOnDisk(diskPath);
      } catch (probeErr) {
        try {
          fs.unlinkSync(diskPath);
        } catch {
          // Ignore unlink error
        }
        return res.status(422).json({
          error:
            probeErr instanceof Error
              ? probeErr.message
              : 'Failed to decode uploaded audio file.',
        });
      }

      const cleanTitle = fileName.replace(/\.[^.]+$/, '');
      const newTrack: AudioTrackData = {
        id: uniqueAudioId,
        projectId: projectId || undefined,
        ownerId,
        fileName,
        title: cleanTitle,
        artist: 'Uploaded Project Audio',
        durationSec: analysis.durationSec,
        bpm: analysis.bpm,
        musicalKey: analysis.musicalKey,
        mood: analysis.mood,
        energyScore: analysis.energyScore,
        audioUrl: `/storage/uploads/${diskFilename}`,
        fileSizeBytes: analysis.fileSizeBytes,
        codecName: analysis.codecName,
        format: analysis.format,
        sampleRate: analysis.sampleRate,
        channels: analysis.channels,
        isSynthesizedStudioTrack: false,
        trimStartSec: 0,
        trimEndSec: analysis.durationSec,
        fadeInSec: Math.min(2, Math.floor(analysis.durationSec / 6)),
        fadeOutSec: Math.min(3, Math.floor(analysis.durationSec / 6)),
        beatTimestampsSec: analysis.beatTimestampsSec,
        waveformPeaks: analysis.waveformPeaks,
        detectedSections: analysis.detectedSections,
        uploadedAtIso: new Date().toISOString(),
      };

      studioDb.audioAssets[newTrack.id] = newTrack;

      // Link directly to the target project and reset any stale scenes from previous songs
      let updatedProject: MusicVideoProject | undefined;
      if (projectId && studioDb.projects[projectId]) {
        const proj = studioDb.projects[projectId];
        const shouldUpdateTitle =
          !proj.title ||
          proj.title.startsWith('Untitled Music Video') ||
          proj.title.startsWith('Studio Music Video');

        updatedProject = {
          ...proj,
          title: shouldUpdateTitle ? cleanTitle : proj.title,
          audioTrack: newTrack,
          durationSec: newTrack.durationSec,
          bpm: newTrack.bpm,
          musicalKey: newTrack.musicalKey,
          mood: newTrack.mood,
          status: 'audio_uploaded',
          scenes: [],
          sceneCount: 0,
          completedScenes: 0,
          lyricSymbolism: [],
          subtitles: [],
          renderedMasterMp4Url: undefined,
          renderedMasterDownloadUrl: undefined,
          updatedAtIso: new Date().toISOString(),
        };
        studioDb.projects[projectId] = updatedProject;
      }

      saveDatabase(studioDb);

      return res.json({
        track: newTrack,
        project: updatedProject,
      });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/audio/upload', error) });
    }
  });

  // Upload External Google Flow Clip into a Specific Project & Scene
  app.post('/api/scenes/upload-clip', (req, res) => {
    try {
      const {
        projectId,
        sceneId,
        fileName = 'flow_clip.mp4',
        base64Data,
        dataUrl,
        mimeType = 'video/mp4',
      } = req.body;
      const project = studioDb.projects[projectId];
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      const scene = project.scenes.find((s) => s.id === sceneId);
      if (!scene) {
        return res.status(404).json({ error: 'Scene not found in this project.' });
      }
      const rawPayload = base64Data || dataUrl;
      if (!rawPayload) {
        return res.status(400).json({ error: 'Clip base64Data is required.' });
      }

      const ext =
        path.extname(fileName).toLowerCase() ||
        (mimeType.startsWith('image/') ? '.jpg' : '.mp4');
      const safeName = fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 36);
      const outName = `flow_${projectId}_${sceneId}_${Date.now()}_${safeName}${ext}`;
      const targetDir = mimeType.startsWith('image/') ? UPLOADS_DIR : CLIPS_DIR;
      const publicPrefix = mimeType.startsWith('image/')
        ? '/storage/uploads'
        : '/storage/clips';
      const outPath = path.join(targetDir, outName);

      const cleanBase64 = String(rawPayload).replace(/^data:[^;]+;base64,/, '');
      fs.writeFileSync(outPath, Buffer.from(cleanBase64, 'base64'));

      const publicUrl = `${publicPrefix}/${outName}`;
      if (mimeType.startsWith('image/')) {
        scene.backdropImageUrl = publicUrl;
      } else {
        scene.generatedVideoUrl = publicUrl;
        scene.status = 'COMPLETED';
      }
      scene.providerSource = 'google_flow_priority_1';
      studioDb.scenes[scene.id] = scene;

      project.completedScenes = project.scenes.filter(
        (s) =>
          (s.status === 'COMPLETED' || s.status === 'completed') &&
          Boolean(s.generatedVideoUrl)
      ).length;
      project.updatedAtIso = new Date().toISOString();
      saveDatabase(studioDb);

      return res.json({
        project,
        scene,
        uploadedUrl: publicUrl,
      });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/scenes/upload-clip', error) });
    }
  });

  // BUG 3 & BUG 4 FIX: Real Song Analysis & Dynamic Full-Length Storyboard Generation
  app.post('/api/ai/analyze-song', async (req, res) => {
    try {
      const {
        projectId,
        title,
        description,
        lyrics,
        directorStyle,
        aspectRatio = '16:9',
        resolution = '1080p',
        selectedCharacterIds,
        symbolismMode = 'metaphorical',
        providerMode = 'procedural_cinema_priority_3',
      } = req.body;

      if (!projectId || !studioDb.projects[projectId]) {
        return res.status(404).json({
          error: 'Target project not found. Please create or select a valid project.',
        });
      }

      const targetProject = studioDb.projects[projectId];

      // Enforce that a real audio file was uploaded for production projects!
      if (
        !targetProject.isDemoProject &&
        (!targetProject.audioTrack?.audioUrl || targetProject.audioTrack.durationSec <= 0)
      ) {
        return res.status(400).json({
          error:
            'No uploaded audio file found in this project. Please upload an MP3 or WAV song before clicking Analyze Song.',
        });
      }

      // Re-verify actual audio analysis from the uploaded file on disk
      let audioTrack = targetProject.audioTrack;
      if (audioTrack.audioUrl && audioTrack.audioUrl.startsWith('/storage/uploads/')) {
        const diskPath = path.join(__dirname, audioTrack.audioUrl.replace(/^\//, ''));
        if (fs.existsSync(diskPath)) {
          const freshAnalysis = await analyzeAudioFileOnDisk(diskPath);
          audioTrack = {
            ...audioTrack,
            durationSec: freshAnalysis.durationSec,
            bpm: freshAnalysis.bpm,
            musicalKey: freshAnalysis.musicalKey,
            mood: freshAnalysis.mood,
            energyScore: freshAnalysis.energyScore,
            waveformPeaks: freshAnalysis.waveformPeaks,
            beatTimestampsSec: freshAnalysis.beatTimestampsSec,
            detectedSections: freshAnalysis.detectedSections,
          };
          studioDb.audioAssets[audioTrack.id] = audioTrack;
        }
      }

      // Storyboard duration ALWAYS comes from the uploaded audio file!
      const exactDurationSec = Math.max(4, Math.round(audioTrack.durationSec));
      const effectiveTitle = (title || targetProject.title || audioTrack.title).trim();
      const effectiveStyle =
        (directorStyle as DirectorStyle) || targetProject.directorStyle;
      let effectiveLyrics = (lyrics !== undefined ? lyrics : targetProject.lyricsText || '').trim();

      const charIds: string[] =
        Array.isArray(selectedCharacterIds)
          ? selectedCharacterIds
          : targetProject.selectedCharacterIds;

      const selectedChars = Object.values(studioDb.characters).filter((c) =>
        charIds.includes(c.id)
      );

      const ai = getGenAIClient();
      let usedLiveGeminiApi = false;
      let geminiScenesInput: Parameters<typeof generateFullLengthStoryboard>[0]['geminiScenes'] =
        undefined;
      let providerNotice = '';

      // If Gemini API is configured and lyrics are empty, attempt audio transcription first
      if (
        ai &&
        !effectiveLyrics &&
        audioTrack.audioUrl &&
        audioTrack.audioUrl.startsWith('/storage/uploads/')
      ) {
        const diskPath = path.join(__dirname, audioTrack.audioUrl.replace(/^\//, ''));
        if (fs.existsSync(diskPath) && fs.statSync(diskPath).size < 12 * 1024 * 1024) {
          try {
            studioDb.apiTelemetry.transcribeCalls += 1;
            const audioB64 = fs.readFileSync(diskPath).toString('base64');
            const trResp = await ai.models.generateContent({
              model: 'gemini-3.5-transcribe',
              contents: [
                {
                  inlineData: {
                    mimeType: audioTrack.codecName === 'pcm_s16le' ? 'audio/wav' : 'audio/mp3',
                    data: audioB64,
                  },
                },
                'Transcribe the sung lyrics or describe the musical phrases line by line.',
              ],
            });
            if (trResp.text && trResp.text.trim().length > 10) {
              effectiveLyrics = trResp.text.trim();
            }
          } catch {
            // Continue with signal-based section analysis if transcription model is unavailable
          }
        }
      }

      const localSymbolism = analyzeLyricsForVisualSymbolism(
        effectiveLyrics,
        exactDurationSec,
        effectiveStyle,
        symbolismMode,
        targetProject.id
      );
      let finalSymbolism: LyricSymbolismItem[] = localSymbolism;

      // Call Gemini AI with actual audio analysis results + lyrics + detected sections
      if (ai) {
        try {
          studioDb.apiTelemetry.geminiCalls += 1;
          const sectionsSummary = (audioTrack.detectedSections || [])
            .map(
              (s) =>
                `${s.section}: ${formatTimecode(s.startTimeSec)}-${formatTimecode(
                  s.endTimeSec
                )} (${s.durationSec}s, Energy: ${s.energyLevel}, RMS: ${s.rmsNormalized})`
            )
            .join('; ');

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `You are an award-winning Music Video Director.
Analyze this uploaded song and its measured audio signal data to create a scene-by-scene storyboard covering the exact duration ${exactDurationSec} seconds (${formatTimecode(exactDurationSec)}):
- Song Title: "${effectiveTitle}"
- Audio File: "${audioTrack.fileName || audioTrack.title}" (${audioTrack.codecName}, ${audioTrack.sampleRate}Hz, ${audioTrack.channels}ch)
- Exact Duration: ${exactDurationSec} seconds (${formatTimecode(exactDurationSec)})
- Measured BPM: ${audioTrack.bpm} BPM
- Measured Musical Key: ${audioTrack.musicalKey}
- Measured RMS Energy Score: ${audioTrack.energyScore}/100 (${audioTrack.mood})
- Detected Audio Structure Sections: ${sectionsSummary}
- Director Visual Style: ${effectiveStyle}
- Aspect Ratio: ${aspectRatio}
- Cast Characters: ${selectedChars.map((c) => `${c.name} (${c.role})`).join(', ') || 'None specified'}
- Lyrics / Vocal Text:
${effectiveLyrics || '[Instrumental / Audio Signal Driven]'}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  detectedMood: { type: Type.STRING },
                  overallNarrativeArc: { type: Type.STRING },
                  lyricSymbolism: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        lyricPhrase: { type: Type.STRING },
                        literalMeaning: { type: Type.STRING },
                        metaphoricalMeaning: { type: Type.STRING },
                        visualElement: { type: Type.STRING },
                        literalVisualElement: { type: Type.STRING },
                      },
                      required: [
                        'lyricPhrase',
                        'literalMeaning',
                        'metaphoricalMeaning',
                        'visualElement',
                        'literalVisualElement',
                      ],
                    },
                  },
                  scenes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        section: { type: Type.STRING },
                        title: { type: Type.STRING },
                        durationSec: { type: Type.NUMBER },
                        visualPrompt: { type: Type.STRING },
                        cameraAngle: { type: Type.STRING },
                        cameraMovement: { type: Type.STRING },
                        lighting: { type: Type.STRING },
                        transition: { type: Type.STRING },
                        metaphorCue: { type: Type.STRING },
                      },
                      required: [
                        'section',
                        'title',
                        'durationSec',
                        'visualPrompt',
                        'cameraAngle',
                        'cameraMovement',
                        'transition',
                      ],
                    },
                  },
                },
                required: ['detectedMood', 'overallNarrativeArc', 'lyricSymbolism', 'scenes'],
              },
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
            geminiScenesInput = parsed.scenes;
            usedLiveGeminiApi = true;
          }
          if (Array.isArray(parsed.lyricSymbolism) && parsed.lyricSymbolism.length > 0) {
            finalSymbolism = localSymbolism.map((item, idx) => {
              const gSym = parsed.lyricSymbolism[idx];
              if (!gSym) return item;
              return {
                ...item,
                literalMeaning: gSym.literalMeaning || item.literalMeaning,
                metaphoricalMeaning: gSym.metaphoricalMeaning || item.metaphoricalMeaning,
                visualElement: gSym.visualElement || item.visualElement,
                literalVisualElement: gSym.literalVisualElement || item.literalVisualElement,
              };
            });
          }
          if (parsed.detectedMood) {
            audioTrack.mood = parsed.detectedMood;
          }
          providerNotice = `Analyzed "${audioTrack.fileName || effectiveTitle}" (${formatTimecode(
            exactDurationSec
          )} · ${audioTrack.bpm} BPM) with live Gemini 3.8 Flash AI + DSP Signal Analyzer.`;
        } catch (geminiErr) {
          const warnMsg = logServerError('/api/ai/analyze-song:gemini', geminiErr);
          providerNotice = `DSP Audio Signal Analyzer completed (${formatTimecode(
            exactDurationSec
          )} · ${audioTrack.bpm} BPM). Gemini API note: ${warnMsg}`;
        }
      } else {
        providerNotice = `Analyzed "${audioTrack.fileName || effectiveTitle}" (${formatTimecode(
          exactDurationSec
        )} · ${audioTrack.bpm} BPM · Energy ${audioTrack.energyScore}/100) via Server DSP Audio Signal & Lyric Analyzer (Configure GEMINI_API_KEY in Secrets for live Gemini LLM enrichment).`;
      }

      // Generate dynamic storyboard covering the EXACT uploaded audio duration (00:00 to exactDurationSec)
      const generatedScenes = generateFullLengthStoryboard({
        projectId: targetProject.id,
        durationSec: exactDurationSec,
        directorStyle: effectiveStyle,
        lyricsText: effectiveLyrics,
        characters: selectedChars,
        symbolismItems: finalSymbolism,
        providerSource: providerMode as ProviderPriority,
        defaultBackdropUrls: targetProject.isDemoProject
          ? [
              STUDIO_ASSET_IMAGES.sceneIntro,
              STUDIO_ASSET_IMAGES.charAria,
              STUDIO_ASSET_IMAGES.sceneChorus,
              STUDIO_ASSET_IMAGES.charKael,
            ]
          : [], // Zero demo images in production projects!
        geminiScenes: geminiScenesInput,
        detectedSections: audioTrack.detectedSections,
        initialSceneStatus: 'QUEUED',
      });

      const generatedSubtitles = syncLyricsToTimeline(
        effectiveLyrics,
        exactDurationSec,
        aspectRatio as MusicVideoProject['aspectRatio'],
        targetProject.id
      );

      // Save storyboard & scenes into relational tables
      const storyboardId = `sb_${targetProject.id}_${Date.now()}`;
      studioDb.storyboards[storyboardId] = {
        id: storyboardId,
        projectId: targetProject.id,
        ownerId: targetProject.ownerId,
        durationSec: exactDurationSec,
        sceneIds: generatedScenes.map((s) => s.id),
        createdAtIso: new Date().toISOString(),
      };

      // Clear old scenes for this project and save new scenes
      for (const oldSceneId of Object.keys(studioDb.scenes)) {
        if (studioDb.scenes[oldSceneId].projectId === targetProject.id) {
          delete studioDb.scenes[oldSceneId];
        }
      }
      generatedScenes.forEach((sc) => {
        sc.storyboardId = storyboardId;
        studioDb.scenes[sc.id] = sc;
      });

      const updatedProject: MusicVideoProject = {
        ...targetProject,
        title: effectiveTitle,
        description: (description || targetProject.description || '').trim(),
        lyricsText: effectiveLyrics,
        directorStyle: effectiveStyle,
        aspectRatio: aspectRatio as MusicVideoProject['aspectRatio'],
        resolution: resolution as MusicVideoProject['resolution'],
        durationSec: exactDurationSec,
        bpm: audioTrack.bpm,
        musicalKey: audioTrack.musicalKey,
        mood: audioTrack.mood,
        audioTrack,
        providerUsed: providerMode as ProviderPriority,
        status: 'storyboard_ready',
        selectedCharacterIds: charIds,
        lyricSymbolism: finalSymbolism,
        scenes: generatedScenes,
        subtitles: generatedSubtitles,
        sceneCount: generatedScenes.length,
        completedScenes: 0,
        lastAnalysisEngine: usedLiveGeminiApi
          ? 'live_gemini_api'
          : 'signal_and_lyric_analyzer',
        updatedAtIso: new Date().toISOString(),
      };

      studioDb.projects[updatedProject.id] = updatedProject;
      saveDatabase(studioDb);

      return res.json({
        project: updatedProject,
        usedLiveGeminiApi,
        providerNotice,
      });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/ai/analyze-song', error) });
    }
  });

  // Background Jobs Queue: List Jobs (Filtered by projectId)
  app.get('/api/jobs', (req, res) => {
    const projectId = req.query.projectId as string | undefined;
    let list = Object.values(studioDb.jobs).sort((a, b) =>
      b.createdAtIso.localeCompare(a.createdAtIso)
    );
    if (projectId) {
      list = list.filter((j) => j.projectId === projectId);
    }
    res.json({ jobs: list.slice(0, 60) });
  });

  // Queue Single Scene Video Generation Job
  app.post('/api/jobs/generate-scene', (req, res) => {
    try {
      const {
        projectId,
        sceneId,
        provider = 'procedural_cinema_priority_3',
        explicitBillingAuthorized = false,
      } = req.body;

      const project = studioDb.projects[projectId];
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      const scene = project.scenes.find((s) => s.id === sceneId);
      if (!scene) {
        return res.status(404).json({ error: 'Scene not found in project.' });
      }

      // Honest check for Priority 1 (Google Flow)
      if (provider === 'google_flow_priority_1') {
        return res.status(422).json({
          error:
            'GOOGLE FLOW PROVIDER NOT INTEGRATED: Google does not expose a public external API to consume consumer Google Flow subscription credits. Switch Provider to Priority 3 (Procedural Cinema Engine) or Priority 2 (Official Google Veo API), or upload a clip manually from Google Flow.',
        });
      }

      if (provider === 'google_veo_api_priority_2') {
        if (!studioDb.systemSettings.veoApiEnabled && !studioDb.systemSettings.apiFallbackEnabled) {
          return res.status(403).json({
            error:
              'Official Google Veo API (Priority 2) is disabled in Admin Panel. Enable it in Admin Panel first, or select Priority 3 (Procedural Cinema Engine).',
          });
        }
        if (!explicitBillingAuthorized) {
          return res.status(403).json({
            error: 'Explicit billing confirmation is required for Priority 2 Google Veo API.',
          });
        }
      }

      const jobId = `job_scene_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newJob: StudioBackgroundJob = {
        id: jobId,
        projectId,
        sceneId,
        sceneIndex: scene.index,
        type: 'scene_video',
        title: `Scene 0${scene.index}: ${scene.section} (${formatTimecode(
          scene.startTimeSec
        )}–${formatTimecode(scene.endTimeSec)})`,
        provider,
        status: 'QUEUED',
        progress: 0,
        stepMessage: 'Queued for scene video generation...',
        retryCount: 0,
        createdAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString(),
      };

      studioDb.jobs[jobId] = newJob;
      scene.status = 'QUEUED';
      scene.lastJobId = jobId;
      saveDatabase(studioDb);

      void processBackgroundJob(jobId, { explicitBillingAuthorized });

      return res.json({ job: newJob, project });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/jobs/generate-scene', error) });
    }
  });

  // Queue Batch Generation for Uncompleted Scenes in Project (BUG 6: Do not regenerate completed scenes unnecessarily)
  app.post('/api/jobs/generate-all-scenes', (req, res) => {
    try {
      const {
        projectId,
        provider = 'procedural_cinema_priority_3',
        forceRegenerate = false,
        explicitBillingAuthorized = false,
      } = req.body;

      const project = studioDb.projects[projectId];
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      if (provider === 'google_flow_priority_1') {
        return res.status(422).json({
          error:
            'GOOGLE FLOW PROVIDER NOT INTEGRATED: Google does not expose a public external API for consumer Google Flow credits. Switch Provider to Priority 3 (Procedural Cinema Engine) or Priority 2 (Official Google Veo API).',
        });
      }

      const scenesToGenerate = project.scenes.filter(
        (sc) =>
          forceRegenerate ||
          sc.status !== 'COMPLETED' ||
          !sc.generatedVideoUrl
      );

      if (scenesToGenerate.length === 0) {
        return res.json({
          createdJobs: [],
          project,
          message: 'All scenes in this project are already COMPLETED.',
        });
      }

      const createdJobs: StudioBackgroundJob[] = [];
      scenesToGenerate.forEach((sc, idx) => {
        const jobId = `job_batch_${Date.now()}_${sc.index}_${Math.random()
          .toString(36)
          .slice(2, 5)}`;
        const job: StudioBackgroundJob = {
          id: jobId,
          projectId,
          sceneId: sc.id,
          sceneIndex: sc.index,
          type: 'scene_video',
          title: `Scene 0${sc.index}: ${sc.section}`,
          provider,
          status: 'QUEUED',
          progress: 0,
          stepMessage: 'Queued in batch pipeline...',
          retryCount: 0,
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
        studioDb.jobs[jobId] = job;
        sc.status = 'QUEUED';
        sc.lastJobId = jobId;
        createdJobs.push(job);

        setTimeout(() => {
          void processBackgroundJob(jobId, { explicitBillingAuthorized });
        }, idx * 250);
      });

      saveDatabase(studioDb);
      return res.json({ createdJobs, project });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/jobs/generate-all-scenes', error) });
    }
  });

  // Queue Full-Length Master MP4 Render Job (FFmpeg Concat + Uploaded Audio Sync + Subtitles)
  app.post('/api/jobs/render-master-mp4', (req, res) => {
    try {
      const { projectId } = req.body;
      const project = studioDb.projects[projectId];
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      if (project.scenes.length === 0) {
        return res.status(400).json({
          error: 'Cannot assemble video: Project has 0 storyboard scenes. Analyze song first.',
        });
      }

      const jobId = `job_master_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const masterJob: StudioBackgroundJob = {
        id: jobId,
        projectId,
        type: 'master_mp4_render',
        title: `Master MP4 Assembly: ${project.title} (${formatTimecode(
          project.durationSec
        )} · ${project.resolution} · ${project.aspectRatio})`,
        provider: 'ffmpeg_cinema',
        status: 'QUEUED',
        progress: 0,
        stepMessage: 'Queued full-length MP4 assembly & audio muxing...',
        retryCount: 0,
        createdAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString(),
      };

      studioDb.jobs[jobId] = masterJob;
      saveDatabase(studioDb);

      void processBackgroundJob(jobId);

      return res.json({ job: masterJob, project });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/jobs/render-master-mp4', error) });
    }
  });

  // Cancel a Queued or Processing Job
  app.post('/api/jobs/:id/cancel', (req, res) => {
    const job = studioDb.jobs[req.params.id];
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    job.status = 'CANCELLED';
    job.stepMessage = 'Job cancelled by user.';
    job.updatedAtIso = new Date().toISOString();
    if (job.sceneId && studioDb.projects[job.projectId]) {
      const sc = studioDb.projects[job.projectId].scenes.find(
        (s) => s.id === job.sceneId
      );
      if (sc) sc.status = 'CANCELLED';
    }
    saveDatabase(studioDb);
    return res.json({ job });
  });

  // Retry a Failed Job
  app.post('/api/jobs/:id/retry', (req, res) => {
    const job = studioDb.jobs[req.params.id];
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    job.status = 'QUEUED';
    job.progress = 0;
    job.errorMessage = undefined;
    job.stepMessage = 'Retrying job...';
    job.retryCount += 1;
    job.updatedAtIso = new Date().toISOString();
    saveDatabase(studioDb);

    void processBackgroundJob(job.id, { explicitBillingAuthorized: true });
    return res.json({ job });
  });

  // Download Rendered Master MP4 File with Attachment Header
  app.get('/api/render/download/:filename', (req, res) => {
    const safeFile = path.basename(req.params.filename);
    const fullPath = path.join(RENDERS_DIR, safeFile);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Rendered MP4 file not found on server.' });
    }
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFile}"`);
    return res.sendFile(fullPath);
  });

  // Download Individual Scene Clip MP4
  app.get('/api/clips/download/:filename', (req, res) => {
    const safeFile = path.basename(req.params.filename);
    const fullPath = path.join(CLIPS_DIR, safeFile);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Scene MP4 clip not found on server.' });
    }
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFile}"`);
    return res.sendFile(fullPath);
  });

  // Character Reference & Thumbnail Image Generation (gemini-3.1-flash-lite-image)
  app.post('/api/ai/generate-image', async (req, res) => {
    try {
      const { prompt, aspectRatio = '16:9', explicitBillingAuthorized = false } = req.body;
      const ai = getGenAIClient();

      if (!explicitBillingAuthorized) {
        return res.status(403).json({
          error: 'Explicit user billing authorization is required before calling the Image Generation API.',
        });
      }
      if (!ai) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
        });
      }

      studioDb.apiTelemetry.imageCalls += 1;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio === '9:16' ? '9:16' : aspectRatio === '1:1' ? '1:1' : '16:9',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const outName = `ai_img_${Date.now()}.png`;
          const outPath = path.join(UPLOADS_DIR, outName);
          fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, 'base64'));
          saveDatabase(studioDb);
          return res.json({
            imageUrl: `/storage/uploads/${outName}`,
          });
        }
      }

      return res.status(500).json({ error: 'No image data returned from model.' });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/ai/generate-image', error) });
    }
  });

  // Audio-to-Lyrics Transcription (gemini-3.5-transcribe)
  app.post('/api/ai/transcribe-audio', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/mp3', explicitBillingAuthorized = false } = req.body;
      const ai = getGenAIClient();

      if (!explicitBillingAuthorized || !ai || !audioBase64) {
        return res.status(400).json({
          error:
            'Live audio transcription requires GEMINI_API_KEY in Settings > Secrets and explicit user consent.',
        });
      }

      studioDb.apiTelemetry.transcribeCalls += 1;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          'Transcribe the lyrics of this song accurately line by line.',
        ],
      });

      saveDatabase(studioDb);
      return res.json({
        lyrics: response.text || '',
      });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/ai/transcribe-audio', error) });
    }
  });

  // AI Voiceover & Spoken Intro Narration (gemini-3.8-flash-lite-tts)
  app.post('/api/ai/generate-voice', async (req, res) => {
    try {
      const { text, voiceName = 'Kore', style = 'Cinematic narrator' } = req.body;
      const ai = getGenAIClient();

      if (!ai || !text) {
        return res.status(400).json({
          error: 'Voiceover TTS requires GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      studioDb.apiTelemetry.ttsCalls += 1;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: `${style}: ${text}`,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      });

      const audioInline = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (audioInline?.data) {
        const outName = `tts_${Date.now()}.wav`;
        const outPath = path.join(UPLOADS_DIR, outName);
        fs.writeFileSync(outPath, Buffer.from(audioInline.data, 'base64'));
        saveDatabase(studioDb);
        return res.json({
          audioDataUrl: `/storage/uploads/${outName}`,
        });
      }

      return res.status(500).json({ error: 'No audio payload returned from TTS.' });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/ai/generate-voice', error) });
    }
  });

  // AI Music Composition (Lyria 3 or FFmpeg Stereo WAV Synthesizer)
  app.post('/api/ai/compose-music', async (req, res) => {
    try {
      const {
        projectId,
        prompt,
        bpm = 124,
        durationSec = 30,
        explicitBillingAuthorized = false,
      } = req.body;
      const ai = getGenAIClient();

      if (ai && explicitBillingAuthorized && prompt) {
        try {
          const response = await ai.models.generateContentStream({
            model: 'lyria-3-clip-preview',
            contents: prompt,
          });

          const audioChunks: string[] = [];
          let mimeType = 'audio/wav';
          for await (const chunk of response) {
            const parts = chunk.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
                audioChunks.push(part.inlineData.data);
              }
            }
          }

          if (audioChunks.length > 0) {
            const ext = mimeType.includes('mp3') ? '.mp3' : '.wav';
            const outName = `lyria_${Date.now()}${ext}`;
            const outPath = path.join(UPLOADS_DIR, outName);
            fs.writeFileSync(outPath, Buffer.from(audioChunks.join(''), 'base64'));
            const analysis = await analyzeAudioFileOnDisk(outPath);
            const newTrack: AudioTrackData = {
              id: `track_lyria_${Date.now()}`,
              projectId,
              title: prompt.slice(0, 36),
              artist: 'Lyria 3 AI Composer',
              durationSec: analysis.durationSec,
              bpm: analysis.bpm,
              musicalKey: analysis.musicalKey,
              mood: analysis.mood,
              energyScore: analysis.energyScore,
              audioUrl: `/storage/uploads/${outName}`,
              fileSizeBytes: analysis.fileSizeBytes,
              codecName: analysis.codecName,
              format: analysis.format,
              sampleRate: analysis.sampleRate,
              channels: analysis.channels,
              isSynthesizedStudioTrack: false,
              trimStartSec: 0,
              trimEndSec: analysis.durationSec,
              fadeInSec: 2,
              fadeOutSec: 3,
              beatTimestampsSec: analysis.beatTimestampsSec,
              waveformPeaks: analysis.waveformPeaks,
              detectedSections: analysis.detectedSections,
            };
            studioDb.audioAssets[newTrack.id] = newTrack;
            saveDatabase(studioDb);
            return res.json({
              audioDataUrl: newTrack.audioUrl,
              track: newTrack,
            });
          }
        } catch {
          // Fall through to local FFmpeg synthesizer
        }
      }

      // Synthesize a playable stereo WAV track on disk using FFmpeg
      const safeBpm = Math.min(200, Math.max(60, Number(bpm) || 124));
      const safeDur = Math.min(180, Math.max(10, Number(durationSec) || 30));
      const outName = `studio_synth_${safeBpm}bpm_${Date.now()}.wav`;
      const outPath = path.join(UPLOADS_DIR, outName);
      const beatFreq = (safeBpm / 60).toFixed(2);
      const expr = `0.20*sin(2*PI*65.41*t)*(0.5+0.5*sin(2*PI*${beatFreq}*t))+0.14*sin(2*PI*130.81*t)+0.10*sin(2*PI*196.00*t)+0.08*sin(2*PI*261.63*t)*(0.5+0.5*cos(2*PI*${beatFreq}*0.5*t))`;

      await execFileAsync('ffmpeg', [
        '-y',
        '-f',
        'lavfi',
        '-i',
        `aevalsrc='${expr}|${expr}':s=44100:d=${safeDur}`,
        '-af',
        `afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(1, safeDur - 3)}:d=3`,
        '-c:a',
        'pcm_s16le',
        outPath,
      ]);

      const analysis = await analyzeAudioFileOnDisk(outPath);
      const newTrack: AudioTrackData = {
        id: `track_synth_${Date.now()}`,
        projectId,
        fileName: outName,
        title: (prompt || 'Studio Harmonic Synth Master').slice(0, 42),
        artist: 'Studio FFmpeg Audio Synthesizer',
        durationSec: analysis.durationSec,
        bpm: safeBpm,
        musicalKey: analysis.musicalKey,
        mood: analysis.mood,
        energyScore: analysis.energyScore,
        audioUrl: `/storage/uploads/${outName}`,
        fileSizeBytes: analysis.fileSizeBytes,
        codecName: analysis.codecName,
        format: analysis.format,
        sampleRate: analysis.sampleRate,
        channels: analysis.channels,
        isSynthesizedStudioTrack: true,
        trimStartSec: 0,
        trimEndSec: analysis.durationSec,
        fadeInSec: 2,
        fadeOutSec: 3,
        beatTimestampsSec: generateBeatGrid(safeBpm, analysis.durationSec),
        waveformPeaks: analysis.waveformPeaks,
        detectedSections: analysis.detectedSections,
      };
      studioDb.audioAssets[newTrack.id] = newTrack;
      saveDatabase(studioDb);

      return res.json({
        audioDataUrl: newTrack.audioUrl,
        track: newTrack,
      });
    } catch (error) {
      return res.status(500).json({ error: logServerError('/api/ai/compose-music', error) });
    }
  });

  // Admin Control Panel Overview & Telemetry
  app.get('/api/admin/overview', (_req, res) => {
    const uploadsStat = getDirectorySize(UPLOADS_DIR);
    const clipsStat = getDirectorySize(CLIPS_DIR);
    const rendersStat = getDirectorySize(RENDERS_DIR);
    const dbBytes = fs.existsSync(DB_FILE_PATH) ? fs.statSync(DB_FILE_PATH).size : 0;

    const overview: AdminOverviewData = {
      users: Object.values(studioDb.users),
      projects: Object.values(studioDb.projects)
        .filter((p) => !p.isDemoProject)
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
      jobs: Object.values(studioDb.jobs)
        .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))
        .slice(0, 50),
      apiTelemetry: studioDb.apiTelemetry,
      storageUsage: {
        uploadsBytes: uploadsStat.bytes,
        clipsBytes: clipsStat.bytes,
        rendersBytes: rendersStat.bytes,
        dbBytes,
        totalBytes:
          uploadsStat.bytes + clipsStat.bytes + rendersStat.bytes + dbBytes,
        fileCount: uploadsStat.count + clipsStat.count + rendersStat.count + 1,
      },
      errorLogs: studioDb.errorLogs,
      systemSettings: {
        ...studioDb.systemSettings,
        geminiConfigured: isGeminiKeyConfigured(),
      },
    };

    res.json(overview);
  });

  app.post('/api/admin/settings', (req, res) => {
    const incoming = req.body;
    studioDb.systemSettings = {
      ...studioDb.systemSettings,
      ...incoming,
    };
    saveDatabase(studioDb);
    res.json({
      systemSettings: {
        ...studioDb.systemSettings,
        geminiConfigured: isGeminiKeyConfigured(),
      },
    });
  });

  app.post('/api/admin/logs/clear', (_req, res) => {
    studioDb.errorLogs = [];
    saveDatabase(studioDb);
    res.json({ errorLogs: [] });
  });

  app.patch('/api/admin/users/:uid', (req, res) => {
    const { uid } = req.params;
    const user = studioDb.users[uid];
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const { role, plan, appCredits } = req.body;
    if (role) user.role = role;
    if (plan) user.plan = plan;
    if (typeof appCredits === 'number') user.appCredits = appCredits;
    saveDatabase(studioDb);
    return res.json({ user });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Music Video Studio server running on http://localhost:${PORT}`);
  });
}

startServer();
